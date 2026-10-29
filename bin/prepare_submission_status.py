#!/usr/bin/env python3
"""Prepare a small, score-free availability snapshot from pinned dataset contracts."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEV_GUIDES = {
    "ahmedml": "benchmark-specs/ahmedml/QUICKSTART.md",
    "windsorml": "benchmark-specs/windsorml/QUICKSTART.md",
    "drivaerml": "benchmark-specs/drivaerml/QUICKSTART.md",
    "drivaernetplusplus": "benchmark-specs/drivaernetplusplus/QUICKSTART.md",
    "airfrans": "benchmark-specs/airfrans/QUICKSTART.md",
}


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
            "dev_candidate": bool(slug in DEV_GUIDES and slug != "airfrans"
                                  and release.get("source_ref") == "dev"
                                  and release.get("status") == "prototype_dummy_data"
                                  and spec.get("status") in {"candidate_native_support", "candidate_scoring_contract"}
                                  and support.get("candidate_manifest", {}).get("manifest_sha256")),
            "guide": DEV_GUIDES.get(slug),
            "specification_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "scoring_release_id": support.get("release_id"),
            "open_splits": [{"id": split["id"], "label": split["label"]}
                            for split in spec.get("splits", [])] if is_open else [],
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
    parser.add_argument("--check-contracts", action="store_true", help="compare dataset availability with current dev, ignoring feed/commit changes")
    args = parser.parse_args()
    result = snapshot(args.submission_root, json.loads((ROOT / "_data/dataset_catalog.json").read_text()),
                      json.loads((ROOT / "_data/leaderboard_display.json").read_text()))
    if args.check_contracts:
        if not args.output.is_file() or json.loads(args.output.read_text()).get("datasets") != result["datasets"]:
            parser.error("dataset availability differs from current dev; update the website snapshot")
        print("Dataset availability matches current dev contracts.")
    elif args.check:
        if not args.output.is_file() or json.loads(args.output.read_text()) != result:
            parser.error("submission availability is stale; regenerate it from the configured source commit")
        print("Submission availability matches the pinned contracts.")
    else:
        args.output.write_text(json.dumps(result, indent=2) + "\n")
        print(f"Prepared availability for {len(result['datasets'])} published datasets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
