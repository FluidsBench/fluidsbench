#!/usr/bin/env python3
"""Check the rendered publication boundary, including old standalone demo routes."""

import argparse
import re
from pathlib import Path


def validate(root: Path, phase: str) -> list[str]:
    errors = []
    index = (root / "index.html").read_text()
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
    args = parser.parse_args()
    errors = validate(args.root, args.phase)
    for error in errors:
        print("ERROR:", error)
    if not errors:
        print(f"Rendered launch boundary checked: {args.phase}.")
    return bool(errors)


if __name__ == "__main__":
    raise SystemExit(main())
