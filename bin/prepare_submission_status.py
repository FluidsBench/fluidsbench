#!/usr/bin/env python3
"""Prepare a small, score-free availability snapshot from pinned dataset contracts."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def snapshot(source: Path, catalog: dict, display: dict) -> dict:
    commit = subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"], text=True).strip()
    manifest_bytes = (source / "leaderboard/manifest.json").read_bytes()
    manifest = json.loads(manifest_bytes)
    release = manifest["data_release"]
    datasets = {}
    for slug in catalog:
        if display.get(slug, {}).get("hidden"):
            continue
        path = source / "benchmark-specs" / slug / "submission-spec.json"
        spec = json.loads(path.read_text())
        support = spec.get("scoring_support", {})
        owner = support.get("owner_approval", {})
        owner_approved = all(isinstance(owner.get(k), str) and owner[k].strip()
                             for k in ("approved_by", "approved_at", "pull_request_url"))
        is_open = (spec.get("status") == "official" and support.get("status") == "official"
                   and support.get("submissions_open") is True and owner_approved)
        datasets[slug] = {
            "open": bool(is_open),
            "specification_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "scoring_release_id": support.get("release_id"),
        }
    return {
        "source_commit": commit,
        "manifest_sha256": hashlib.sha256(manifest_bytes).hexdigest(),
        "release": {k: release.get(k) for k in ("id", "status", "asset_base_url", "archive_url")},
        "datasets": datasets,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submission-root", required=True, type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "_data/submission_status.json")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    result = snapshot(args.submission_root, json.loads((ROOT / "_data/dataset_catalog.json").read_text()),
                      json.loads((ROOT / "_data/leaderboard_display.json").read_text()))
    if args.check:
        if not args.output.is_file() or json.loads(args.output.read_text()) != result:
            parser.error("submission availability is stale; regenerate it from the configured source commit")
        print("Submission availability matches the pinned contracts.")
    else:
        args.output.write_text(json.dumps(result, indent=2) + "\n")
        print(f"Prepared availability for {len(result['datasets'])} published datasets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
