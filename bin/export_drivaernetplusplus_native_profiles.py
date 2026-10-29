#!/usr/bin/env python3
"""Export report-only Cp traces from the verified DrivAerNet++ candidate support.

Uses the frozen native indices and coordinates without interpolation. The dev
browser bundle has its own checksum binding; historical fixture truth is retained.
"""
import argparse
import gzip
import hashlib
import io
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def encoded(value):
    return (json.dumps(value, separators=(",", ":"), allow_nan=False) + "\n").encode()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def export(source, support_root, output):
    sys.path.insert(0, str(source.resolve()))
    from reference.drivaernetplusplus.contract import official_split
    from reference.drivaernetplusplus.distribution import load_case_support, load_distribution, ensure_archive
    from reference.drivaernetplusplus.native import DYNAMIC_HEAD, PROFILE_STATIONS
    from reference.drivaernetplusplus.support import TRUTH_ARRAY, station_array_names

    distribution = load_distribution()
    split = official_split("official_test")
    source_release = {
        "release_id": distribution["scientific_release_id"],
        "manifest_sha256": distribution["scientific_manifest_sha256"],
        "rules_version": distribution["rules_version"],
    }
    output.mkdir(parents=True, exist_ok=True)
    # Check complete archive bytes once, then verify every retained NPZ and record.
    for entry in distribution["archives"]:
        ensure_archive(entry, destination=support_root, offline=True)
    chunks = []
    for number, case_id in enumerate(split["case_ids"]):
        support = load_case_support(case_id, destination=support_root)
        truth = support.arrays[TRUTH_ARRAY].astype("float64")
        series = []
        for station in PROFILE_STATIONS:
            index_name, coordinate_name = station_array_names(station)
            ids = support.arrays[index_name]
            series.append({
                "panel_id": "pressure_profiles", "station_id": station, "quantity_id": "cp",
                "coordinate_id": support.record["profile_stations"][station]["coordinate_id"],
                "coordinate_unit": "1", "scoring_role": "report_only",
                "native_point_ids": ids.tolist(),
                "coordinate": support.arrays[coordinate_name].tolist(),
                "value": (truth[ids] / DYNAMIC_HEAD).tolist(),
            })
        case = {"schema": "drivaernetplusplus-browser-native-case-v1", "case_id": case_id,
                "source_case_support_sha256": support.record_sha256,
                "source_support_npz_sha256": support.record["support_npz"]["sha256"],
                "native_point_count": support.point_count, "series": series}
        compressed = io.BytesIO()
        with gzip.GzipFile(filename="", fileobj=compressed, mode="wb", mtime=0) as stream:
            stream.write(encoded(case))
        data = compressed.getvalue()
        filename = f"case-{number:04d}.json.gz"
        (output / filename).write_bytes(data)
        chunks.append({"file": filename, "sha256": digest(data), "case_ids": [case_id],
                       "source_case_support_sha256": support.record_sha256,
                       "source_support_npz_sha256": support.record["support_npz"]["sha256"],
                       "native_point_count": support.point_count,
                       "station_point_counts": {s["station_id"]: len(s["value"]) for s in series}})
        if (number + 1) % 100 == 0:
            print(f"Exported {number + 1}/{len(split['case_ids'])} native cases", flush=True)
    split_bytes = (source / "benchmark-specs/drivaernetplusplus/splits/official_test.json").read_bytes()
    manifest = {"schema": "drivaernetplusplus-browser-native-profiles-v1", "dataset_id": "drivaernetplusplus",
                "source_release": source_release, "split_id": "official_test", "split_sha256": digest(split_bytes),
                "case_count": len(chunks), "series_per_case": 3, "station_ids": list(PROFILE_STATIONS),
                "scoring_role": "report_only", "source_kind": "native_cfd", "analytical_dummy": False,
                "status": "dev_candidate", "license_spdx": "CC-BY-NC-4.0",
                "source_url": "https://github.com/neilashton/fluidsbench-submission/releases/tag/" + distribution["release_tag"],
                "pressure_conversion": "binary64(native PointData p) / 450",
                "case_ids": split["case_ids"], "chunks": chunks}
    payload = encoded(manifest)
    (output / "manifest.json").write_bytes(payload)
    return {"manifest_path": "assets/data/drivaernetplusplus-native-profiles/manifest.json",
            "manifest_sha256": digest(payload), "source_release": source_release,
            "split_sha256": manifest["split_sha256"]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submission-root", required=True, type=Path)
    parser.add_argument("--support-root", required=True, type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "assets/data/drivaernetplusplus-native-profiles")
    args = parser.parse_args()
    binding = export(args.submission_root, args.support_root, args.output)
    (ROOT / "_data/drivaernetplusplus_native_profiles.json").write_text(json.dumps(binding, indent=2) + "\n")
    print("Exported all 1,154 cases with their three frozen native Cp traces.")
