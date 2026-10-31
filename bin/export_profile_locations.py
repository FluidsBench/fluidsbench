#!/usr/bin/env python3
"""Export small, display-only location definitions from the audited submission repo."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_REF = "7a15eda810f24afcddb46ec383ced278feb6885e"


def build(source):
    def read(relative):
        raw = (source / relative).read_bytes()
        return json.loads(raw), {"file": relative, "sha256": hashlib.sha256(raw).hexdigest()}

    def envelope(dataset):
        return {"schema": "fluidsbench-profile-location-guide-v1", "dataset_id": dataset,
                "source_repository": "FluidsBench/fluidsbench-submission", "source_ref": SOURCE_REF}

    ahmed = envelope("ahmedml")
    ahmed["definition"], ahmed["source"] = read("benchmark-specs/ahmedml/profile-definition-v1.json")
    cases = {}
    base = source / "benchmark-specs/ahmedml/scoring-support/ahmedml-native-all-splits-support-v1-candidate"
    for path in sorted(base.rglob("case-support.json")):
        record, binding = read(path.relative_to(source).as_posix())
        case = {"case_support_sha256": binding["sha256"],
                "geometry_parameters_mm_or_degrees": record["geometry_parameters_mm_or_degrees"],
                "surface_bounds_m": record["audits"]["surface_bounds_m"]}
        case_id = record["case_id"]
        if case_id in cases and cases[case_id] != case:
            raise ValueError(f"Conflicting geometry for {case_id}")
        cases[case_id] = case
    # The geometry must belong to the exact support already used by the plotted truth.
    truth_cases = {}
    for path in (ROOT / "assets/data/profile-ground-truth/datasets/ahmedml/native-all316-v1").rglob("chunk-*.json"):
        for case in json.loads(path.read_text())["cases"]:
            truth_cases[case["case_id"]] = case["lineage"]["case_support_sha256"]
    if len(truth_cases) != 316 or set(cases) != set(truth_cases):
        raise ValueError("AhmedML location coverage differs from the 316-case native truth")
    for case_id, digest in truth_cases.items():
        if cases[case_id]["case_support_sha256"] != digest:
            raise ValueError(f"Geometry/truth binding mismatch for {case_id}")
    ahmed["cases"] = cases

    windsor = envelope("windsorml")
    windsor["definition"], windsor["source"] = read("benchmark-specs/windsorml/profile-definition-v2.json")
    hilift = envelope("hiliftaeroml")
    manifest, hilift["source"] = read("leaderboard/manifest.json")
    hilift["panels"] = next(d["diagnostic_panels"] for d in manifest["datasets"] if d["slug"] == "hiliftaeroml")
    return {"ahmedml-v1.json": ahmed, "windsorml-v2.json": windsor, "hiliftaeroml-v1.json": hilift}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submission-root", type=Path, required=True)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    for name, document in build(args.submission_root).items():
        path = ROOT / "assets/data/profile-locations" / name
        content = json.dumps(document, indent=2, ensure_ascii=False) + "\n"
        if args.check:
            if path.read_text() != content:
                raise SystemExit(f"Location definitions differ: {path}")
        else:
            path.write_text(content)
        print(f"{'Checked' if args.check else 'Exported'} {name}")


if __name__ == "__main__":
    main()
