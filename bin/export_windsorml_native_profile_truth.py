#!/usr/bin/env python3
"""Export WindsorML plot data without resampling the evaluator's pinned CFD truth.

Only Python's standard library is needed. --check compares every exported byte
and the release declaration against the upstream, hash-pinned support files.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRUTH_ROOT = ROOT / "assets/data/profile-ground-truth"
REVISION = "8a6ca32ae22c94f54df2186d1b0ccf9662a294c2"
MANIFEST_SHA = "e660311ef82ec19347e91eeb1753c1f0af4c1bd65ba01491fb47ac960da51376"
DEFINITION_SHA = "d58014ae66d92ea5ffce3c4f3b8e206447873d563d8bc3ffb4cbeee81539e056"
SOURCE_SHA = "e9bc888931e26220a9c7bddc202a66ab96a043343bf9d70066d8de4ad8ba2cff"
RELEASE = "windsorml-native-profile-truth-v1-candidate"
CASE_STATUS = "official_intersected_with_published"
SPLITS = [
    "full",
    "medium",
    "scarce",
    "super_scarce",
    "geometry",
    "high_drag",
    "low_drag",
    "image_wake",
]
BINDING = {
    "schema_version": "1.0",
    "release_id": RELEASE,
    "dataset_id": "windsorml",
    "dataset_revision": REVISION,
    "profile_support_manifest_sha256": MANIFEST_SHA,
    "profile_definition_sha256": DEFINITION_SHA,
    "source_identity_sha256": SOURCE_SHA,
    "source_kind": "native_cfd",
    "analytical_dummy": False,
    "status": "candidate_owner_review_required",
    "usage": "browser_visualization_only_not_metric_recomputation",
    "series_per_case": 16,
    "samples_per_series": 128,
}


def encode(value):
    return (
        json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
        + "\n"
    ).encode()


def digest(payload):
    return hashlib.sha256(payload).hexdigest()


def pinned(path, expected):
    payload = path.read_bytes()
    if digest(payload) != expected:
        raise ValueError(f"{path}: differs from pinned SHA-256")
    return json.loads(payload)


def station_metadata(definition, family, station_id):
    kind = (
        "velocity_stations"
        if family["quantity_id"] == "ux_over_uinf"
        else "pressure_stations"
    )
    return next(
        s for s in definition[kind][family["placement_mode"]] if s["id"] == station_id
    )


def expected_bundle(submission_root):
    spec_root = submission_root / "benchmark-specs/windsorml"
    support_root = spec_root / "profile-support"
    manifest = pinned(
        support_root / "windsorml-profile-support-v3-manifest.json", MANIFEST_SHA
    )
    definition = pinned(spec_root / "profile-definition-v2.json", DEFINITION_SHA)
    pinned(
        spec_root / "public-source-identity/windsorml-public-source-identity-v1.json",
        SOURCE_SHA,
    )
    specification = json.loads((spec_root / "submission-spec.json").read_text())
    if [s["id"] for s in specification["splits"]] != SPLITS:
        raise ValueError("WindsorML must declare all eight official source splits")
    files = {}
    case_chunks = {}
    for entry in manifest["cases"]:
        case_id = entry["case_id"]
        support = pinned(support_root / entry["file"], entry["sha256"])
        if support["case_id"] != case_id or support["sample_count"] != 128:
            raise ValueError(f"{case_id}: invalid support metadata")
        series = []
        for family in definition["families"]:
            for station_id in family["station_ids"]:
                samples = support["families"][family["family_id"]][station_id]
                station = station_metadata(definition, family, station_id)
                quantity = family["quantity_id"]
                coordinate = samples["coordinate"]
                values = samples["truth_" + quantity]
                if any(
                    len(array) != 128
                    or any(
                        type(v) not in (int, float) or not math.isfinite(v)
                        for v in array
                    )
                    for array in (coordinate, values)
                ):
                    raise ValueError(
                        f"{case_id}/{station_id}: invalid 128-point series"
                    )
                if any(a >= b for a, b in zip(coordinate, coordinate[1:])):
                    raise ValueError(
                        f"{case_id}/{station_id}: coordinates must increase"
                    )
                item = {
                    "panel_id": family["panel_id"],
                    "family_id": family["family_id"],
                    "placement_mode": family["placement_mode"],
                    "scoring_role": family["scoring_role"],
                    "station_id": station_id,
                    "quantity_id": quantity,
                    "coordinate_id": station["varying"],
                    "coordinate_unit": "m" if "interval_m" in station else "1",
                    "sample_count": 128,
                    "coordinate": coordinate,
                    "value": values,
                }
                for key in (
                    "native_point_ids",
                    "native_cell_ids",
                    "max_centre_offset_m",
                    "containment_fallbacks",
                ):
                    if key in samples:
                        item[key] = samples[key]
                series.append(item)
        case = {
            "case_id": case_id,
            "profile_support_sha256": entry["sha256"],
            "body_height_m": support["body_height_m"],
            "reference_velocity_m_s": support["reference_velocity_m_s"],
            "series": series,
        }
        chunk = {
            **BINDING,
            "schema": "windsorml-native-profile-truth-chunk-v1",
            "cases": [case],
        }
        payload = encode(chunk)
        files[f"cases/{case_id}.json"] = payload
        case_chunks[case_id] = {
            "file": f"../cases/{case_id}.json",
            "case_ids": [case_id],
            "sha256": digest(payload),
        }

    dataset = {
        "id": "windsorml",
        "name": "WindsorML",
        "splits": [],
        "case_sets": [],
        "native_profile_truth": {
            **BINDING,
            "case_count": len(case_chunks),
            "case_set_count": 5,
        },
    }
    indexed_sets = {}
    for split in specification["splits"]:
        index = pinned(spec_root / split["index_file"], split["sha256"])
        case_ids = index["case_ids"]
        case_set_id = split["case_set_id"]
        if len(case_ids) != split["case_count"] or len(set(case_ids)) != len(case_ids):
            raise ValueError(f"{split['id']}: incomplete or duplicate case IDs")
        dataset["splits"].append(
            {
                "id": split["id"],
                "label": split["label"],
                "case_set_id": case_set_id,
                "case_count": len(case_ids),
            }
        )
        if case_set_id in indexed_sets:
            if case_ids != indexed_sets[case_set_id]:
                raise ValueError(f"{split['id']}: shared case-set order differs")
            continue
        indexed_sets[case_set_id] = case_ids
        payload = encode(
            {
                **BINDING,
                "schema": "windsorml-native-profile-truth-index-v1",
                "case_set_id": case_set_id,
                "case_id_status": CASE_STATUS,
                "case_count": len(case_ids),
                "case_ids": case_ids,
                "chunks": [case_chunks[c] for c in case_ids],
            }
        )
        filename = f"{case_set_id}/index.json"
        files[filename] = payload
        dataset["case_sets"].append(
            {
                "id": case_set_id,
                "index_file": f"datasets/windsorml/{filename}",
                "index_sha256": digest(payload),
                "case_count": len(case_ids),
                "case_id_status": CASE_STATUS,
            }
        )
    if (
        set(case_chunks) != set().union(*map(set, indexed_sets.values()))
        or len(case_chunks) != 233
        or len(indexed_sets) != 5
    ):
        raise ValueError(
            "WindsorML truth must cover exactly the 233-case test union and five case sets"
        )
    return files, dataset


def bundle_errors(truth_root, dataset, submission_root):
    files, expected = expected_bundle(submission_root)
    errors = []
    if dataset != expected:
        errors.append(
            "windsorml: release declaration differs from pinned native truth and eight splits"
        )
    root = truth_root / "datasets/windsorml"
    actual = {str(p.relative_to(root)) for p in root.rglob("*.json")}
    if actual != set(files):
        errors.append("windsorml: stale, missing, or extra profile data files")
    for name, payload in files.items():
        path = root / name
        if not path.is_file() or path.read_bytes() != payload:
            errors.append(
                f"windsorml/{name}: differs from the exact pinned native CFD export"
            )
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submission-root", type=Path, required=True)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    manifest_path = TRUTH_ROOT / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    if args.check:
        dataset = next(d for d in manifest["datasets"] if d["id"] == "windsorml")
        errors = bundle_errors(TRUTH_ROOT, dataset, args.submission_root)
        if errors:
            raise SystemExit("\n".join(errors))
    else:
        files, dataset = expected_bundle(args.submission_root)
        root = TRUTH_ROOT / "datasets/windsorml"
        for name, payload in files.items():
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)
        # Delete only WindsorML JSON artifacts absent from the reproducible export.
        for path in root.rglob("*.json"):
            if str(path.relative_to(root)) not in files:
                path.unlink()
        manifest["datasets"] = [
            dataset if d["id"] == "windsorml" else d for d in manifest["datasets"]
        ]
        manifest_path.write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
        )
    print(
        "WindsorML: all 8 splits, 5 case sets, 233 native CFD cases, 16 series × 128 samples per case verified"
    )


if __name__ == "__main__":
    main()
