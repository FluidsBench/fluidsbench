#!/usr/bin/env python3
"""Check the rendered publication boundary, including old standalone demo routes."""

import argparse
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

from check_preview_build import PreviewLinkParser


COMMITTEE_REVIEW = Path("committee-leaderboard/index.html")


def validate(root: Path, phase: str, committee_review: bool = False) -> list[str]:
    errors = []
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
        for relative in ("index.html", "run/index.html", "datasets/index.html"):
            if "BlendedNet" in (root / relative).read_text():
                errors.append(f"hidden dataset appears in {relative}")
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
