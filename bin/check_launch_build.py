#!/usr/bin/env python3
"""Check the rendered publication boundary, including old standalone demo routes."""

import argparse
import json
import re
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

from check_preview_build import PreviewLinkParser


COMMITTEE_REVIEW = Path("committee-leaderboard/index.html")
SOURCE = Path(__file__).resolve().parents[1]
DISPLAY = json.loads((SOURCE / "_data/leaderboard_display.json").read_text())
CATALOG = json.loads((SOURCE / "_data/dataset_catalog.json").read_text())
COMING_SOON = {slug: CATALOG[slug]["name"] for slug, display in DISPLAY.items() if display.get("coming_soon")}


class DatasetStatusParser(PreviewLinkParser):
    def __init__(self):
        super().__init__()
        self.upcoming = set()
        self.text = []
        self.ids = set()
        self.in_script = False

    def handle_starttag(self, tag, attrs):
        super().handle_starttag(tag, attrs)
        values = dict(attrs)
        if tag in {"script", "style"}:
            self.in_script = True
        if values.get("id"):
            self.ids.add(values["id"])
        if values.get("data-dataset-status") == "coming-soon" and "dataset-coming-soon" in values.get("class", "").split():
            self.upcoming.add(values.get("data-dataset-id"))

    def handle_endtag(self, tag):
        if tag in {"script", "style"}:
            self.in_script = False

    def handle_data(self, value):
        if not self.in_script:
            self.text.append(value)


def validate_coming_soon(root):
    errors = []
    for path in root.rglob("*.html"):
        parser = DatasetStatusParser()
        parser.feed(path.read_text())
        text = " ".join(parser.text)
        relative = path.relative_to(root)
        for slug, name in COMING_SOON.items():
            if name in text and (slug not in parser.upcoming or "Coming soon" not in text):
                errors.append(f"{relative} mentions {name} without its Coming soon status")
            for link in parser.links:
                target = urlsplit(link)
                if slug in parse_qs(target.query).get("dataset", []):
                    errors.append(f"{relative} links to results for coming-soon dataset {slug}")
            if relative == Path(f"datasets/{slug}/index.html"):
                if slug not in parser.upcoming or {"dataset-start", "dataset-evaluation"} & parser.ids:
                    errors.append(f"{relative} must show a Coming soon placeholder instead of evaluation instructions")
    return errors


def validate(root: Path, phase: str, committee_review: bool = False) -> list[str]:
    errors = validate_coming_soon(root)
    index = (root / "index.html").read_text()
    review_path = root / COMMITTEE_REVIEW
    if committee_review:
        if not review_path.is_file():
            errors.append("committee review page is missing")
        else:
            review = review_path.read_text()
            parser = PreviewLinkParser()
            parser.feed(review)
            if not parser.has_noindex:
                errors.append("committee review page must declare noindex")
            if 'id="committee-review-notice"' not in review or "Prototype results" not in review:
                errors.append("committee review page must be labelled as a prototype")
            if 'id="leaderboard-table"' not in review or '/assets/js/leaderboard.js' not in review:
                errors.append("committee review page does not contain the leaderboard")
            if not re.search(r"window\.FluidsBenchLeaderboardPreviewMode\s*=\s*(?:true|!0)\b", review):
                errors.append("committee review page must use the preview data mode")
            if 'data-countdown' in review:
                errors.append("committee review page shows the launch countdown")
    elif review_path.exists():
        errors.append("committee review page is not enabled for this build")

    # A shared direct URL is intentional; links from regular pages or discovery files are not.
    for path in root.rglob("*.html"):
        if path == review_path:
            continue
        parser = PreviewLinkParser()
        parser.feed(path.read_text())
        for link in parser.links:
            target = unquote(urlsplit(link).path).rstrip("/")
            if target.endswith(("/committee-leaderboard", "/committee-leaderboard/index.html")):
                errors.append(f"{path.relative_to(root)} links to the unlisted committee review")
    for filename in ("sitemap.xml", "feed.xml", "robots.txt"):
        path = root / filename
        if path.exists() and "committee-leaderboard" in path.read_text():
            errors.append(f"{filename} exposes the unlisted committee review")

    live = phase == "live"
    if live:
        if 'id="leaderboard-table"' not in index or '/assets/js/leaderboard.js' not in index:
            errors.append("live build does not contain the leaderboard")
        if 'data-countdown' in index:
            errors.append("live build still contains the announcement countdown")
    else:
        if f'data-launch-phase="{phase}"' not in index or 'data-countdown' not in index:
            errors.append("prelaunch homepage has the wrong phase or no countdown")
        for path in root.rglob("*.html"):
            if committee_review and path == review_path:
                continue
            html = path.read_text()
            if re.search(r'(?:class="leaderboard-page|id="leaderboard-table"|/assets/js/leaderboard\.js|FluidsBenchLeaderboardBaseUrl)', html):
                errors.append(f"prelaunch build exposes a leaderboard in {path.relative_to(root)}")
        for directory in ("leaderboards", "assets/html", "assets/jupyter", "assets/plotly"):
            if (root / directory).exists():
                errors.append(f"prelaunch build contains standalone demos: {directory}")
        if 'aria-live="assertive"' in index:
            errors.append("countdown must not constantly interrupt screen readers")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("--phase", choices=("announced", "collecting", "reviewing", "live"), required=True)
    parser.add_argument("--committee-review", action="store_true", help="Allow only the unlinked dev committee page")
    args = parser.parse_args()
    errors = validate(args.root, args.phase, args.committee_review)
    for error in errors:
        print("ERROR:", error)
    if not errors:
        print(f"Rendered launch boundary checked: {args.phase}.")
    return bool(errors)


if __name__ == "__main__":
    raise SystemExit(main())
