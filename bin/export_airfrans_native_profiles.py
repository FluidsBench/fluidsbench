#!/usr/bin/env python3
"""Export lossless browser profiles from the hash-pinned public AirfRANS release.

The global historical fixture manifest stays unchanged. This separate dev bundle
preserves all 1001 samples of all eight series; gzip only reduces transfer size.
"""
import argparse
import gzip
import hashlib
import io
import json
from pathlib import Path

from generate_airfrans_ground_truth import validate_extraction

ROOT = Path(__file__).resolve().parents[1]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return (json.dumps(value, separators=(",", ":"), allow_nan=False) + "\n").encode()


def verified(path, sha):
    data = path.read_bytes()
    if digest(data) != sha:
        raise ValueError(f"Checksum mismatch: {path}")
    return json.loads(data)


def export(source, truth, output):
    spec = json.loads((source / "benchmark-specs/airfrans/submission-spec.json").read_text())
    binding = spec["profile_definition"]["profile_ground_truth"]
    manifest = verified(truth / "manifest.json", binding["manifest_sha256"])
    master = verified(truth / manifest["master_index"]["file"], manifest["master_index"]["sha256"])
    definition = verified(source / "benchmark-specs/airfrans/velocity-profiles-v1.json", spec["profile_definition"]["sha256"])
    output.mkdir(parents=True, exist_ok=True)
    chunks = []
    for number, case_id in enumerate(master["case_ids"]):
        location = master["case_locations"][case_id]
        record = verified(truth / location["case_record_file"], location["case_record_sha256"])
        artifact = location["truth_artifact"]
        if artifact != record["truth_artifact"]:
            raise ValueError(f"Conflicting source binding: {case_id}")
        verified(truth / artifact["file"], artifact["sha256"])
        case, _ = validate_extraction(truth / artifact["file"], definition,
                                     spec["profile_definition"]["sha256"], record["extractor_sha256"])
        if case["case_id"] != case_id:
            raise ValueError(f"Wrong source case: {case_id}")
        payload = encoded({"schema": "airfrans-browser-native-case-v1", **case,
                           "source_extraction_sha256": artifact["sha256"]})
        compressed = io.BytesIO()
        with gzip.GzipFile(filename="", fileobj=compressed, mode="wb", mtime=0) as stream:
            stream.write(payload)
        data = compressed.getvalue()
        filename = f"case-{number:03d}.json.gz"
        (output / filename).write_bytes(data)
        chunks.append({"file": filename, "sha256": digest(data), "case_ids": [case_id],
                       "source_extraction_sha256": artifact["sha256"]})
    case_sets = {}
    for entry in manifest["case_sets"]:
        index = verified(truth / entry["file"], entry["sha256"])
        if len(index["case_ids"]) != entry["case_count"] or not set(index["case_ids"]) <= set(master["case_ids"]):
            raise ValueError("Incomplete case set")
        case_sets[entry["case_set_id"]] = index["case_ids"]
    result = {"schema": "airfrans-browser-native-profiles-v1", "dataset_id": "airfrans",
              "source_release": binding, "profile_definition_sha256": spec["profile_definition"]["sha256"],
              "case_count": len(chunks), "samples_per_series": 1001, "series_per_case": 8,
              "splits": {"full": "standard", "scarce": "standard", "aoa_extrapolation": "aoa_extrapolation"},
              "case_sets": case_sets, "chunks": chunks}
    data = encoded(result)
    (output / "manifest.json").write_bytes(data)
    return {"manifest_path": "assets/data/airfrans-native-profiles/manifest.json",
            "manifest_sha256": digest(data), "source_manifest_sha256": binding["manifest_sha256"]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submission-root", required=True, type=Path)
    parser.add_argument("--truth-root", required=True, type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "assets/data/airfrans-native-profiles")
    args = parser.parse_args()
    binding = export(args.submission_root, args.truth_root, args.output)
    (ROOT / "_data/airfrans_native_profiles.json").write_text(json.dumps(binding, indent=2) + "\n")
    print("Exported all 355 AirfRANS cases with lossless native profile samples.")
