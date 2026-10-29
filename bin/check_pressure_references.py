#!/usr/bin/env python3
"""Check the descriptive pressure snapshot without touching scoring data."""

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submission-root", type=Path)
    args = parser.parse_args()
    path = ROOT / "_data/pressure_references.json"
    audit = json.loads(path.read_text())
    catalog = json.loads((ROOT / "_data/dataset_catalog.json").read_text())
    expected = set(catalog) - {"blendednet"}
    assert audit["schema_version"] == 1
    assert set(audit["datasets"]) == expected, "pressure inventory must match visible datasets"
    assert re.fullmatch(r"[0-9a-f]{40}", audit["audited_submission_revision"])
    for slug, entry in audit["datasets"].items():
        assert entry["status"] in {"confirmed", "partial", "inferred", "not_applicable"}, slug
        assert entry["summary"] and entry["fields"] and entry["sources"] and entry["code_evidence"], slug
        if entry["status"] in {"partial", "inferred"}:
            assert entry["follow_up"], f"{slug}: do not hide unresolved evidence"
        for field in entry["fields"]:
            assert all(field.get(key) for key in ("domain", "raw_field", "association", "units", "reference", "evaluation", "conversion")), slug
        for source in entry["sources"]:
            assert source["url"].startswith("https://") and source["locator"], slug
        for source in entry["code_evidence"]:
            assert re.fullmatch(r"[0-9a-f]{64}", source["sha256"]), slug
    if args.submission_root:
        canonical = args.submission_root / "docs/pressure-references.json"
        assert path.read_bytes() == canonical.read_bytes(), "regenerate the website snapshot from submission documentation"
    print(f"Pressure definitions: {len(expected)} datasets; evidence gaps explicit; snapshot checked.")


if __name__ == "__main__":
    main()
