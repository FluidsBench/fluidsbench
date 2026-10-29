#!/usr/bin/env python3
"""Publish representative AirfRANS reference profiles for the review site."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
GROUND_TRUTH_ROOT = ROOT / "assets" / "data" / "profile-ground-truth"
CASE_SET_SOURCES = {
    "standard": "standard",
    "reynolds_extrapolation": "standard",
    "aoa_extrapolation": "aoa",
}
REPRESENTATIVE_COVERAGE = "representative_subset"
CASE_ID_STATUS = "official_split_member_fixture"


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return value


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, ensure_ascii=True, allow_nan=False)
        handle.write("\n")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def finite_numbers(values: object) -> bool:
    return isinstance(values, list) and all(
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
        for value in values
    )


def validate_extraction(
    path: Path,
    profile_definition: dict[str, Any],
    profile_definition_sha256: str,
    extractor_sha256: str,
) -> tuple[dict[str, Any], dict[str, Any]]:
    extraction = load_json(path)
    provenance = extraction.get("provenance")
    require(isinstance(provenance, dict), f"{path}: missing provenance")
    require(
        provenance.get("mode") == "ground_truth_reference",
        f"{path}: extraction mode must be ground_truth_reference",
    )
    require(
        provenance.get("profile_definition_id")
        == profile_definition["profile_definition_id"],
        f"{path}: profile definition ID does not match the submission contract",
    )
    require(
        provenance.get("extractor_sha256") == extractor_sha256,
        f"{path}: extractor SHA-256 does not match the pinned extractor",
    )
    require(
        provenance.get("airfrans_runtime_source_file_sha256")
        == profile_definition["sampling_runtime"][
            "airfrans_runtime_source_file_sha256"
        ],
        f"{path}: AirfRANS runtime source SHA-256 is stale",
    )
    versions = provenance.get("versions", {})
    expected_versions = {
        "airfrans_distribution": profile_definition["sampling_runtime"][
            "airfrans_distribution_version"
        ],
        "airfrans_module": profile_definition["sampling_runtime"][
            "airfrans_module_version"
        ],
        "numpy": profile_definition["sampling_runtime"]["numpy_version"],
        "pyvista": profile_definition["sampling_runtime"]["pyvista_version"],
        "vtk": profile_definition["sampling_runtime"]["vtk_version"],
    }
    require(
        versions == expected_versions,
        f"{path}: runtime versions do not match the profile definition",
    )
    maximum_difference = provenance.get("perfect_copy_validation", {}).get(
        "maximum_absolute_difference"
    )
    require(
        isinstance(maximum_difference, (int, float))
        and maximum_difference
        <= profile_definition["validation"]["perfect_copy_absolute_tolerance"],
        f"{path}: perfect-copy validation exceeds the declared tolerance",
    )

    cases = extraction.get("cases")
    require(isinstance(cases, list) and len(cases) == 1, f"{path}: expected one case")
    case = cases[0]
    require(isinstance(case, dict), f"{path}: case must be an object")
    require(
        isinstance(case.get("case_id"), str) and case["case_id"],
        f"{path}: case_id must be a non-empty string",
    )

    expected_series = {
        ("velocity_profiles", station["id"], quantity["id"])
        for station in profile_definition["stations"]
        for quantity in profile_definition["quantities"]
    }
    provided_series: set[tuple[str, str, str]] = set()
    published_series: list[dict[str, Any]] = []
    sample_count = profile_definition["coordinate"]["sample_count"]
    lower, upper = profile_definition["coordinate"]["interval"]
    expected_step = (upper - lower) / (sample_count - 1)
    for series in case.get("series", []):
        key = (
            series.get("panel_id"),
            series.get("station_id"),
            series.get("quantity_id"),
        )
        require(key not in provided_series, f"{path}: duplicate series {key}")
        provided_series.add(key)
        coordinate = series.get("coordinate")
        value = series.get("value") if "value" in series else series.get("prediction")
        require(
            finite_numbers(coordinate)
            and finite_numbers(value)
            and len(coordinate) == sample_count
            and len(value) == sample_count,
            f"{path}: {key} must contain {sample_count} finite coordinate/value pairs",
        )
        require(
            math.isclose(coordinate[0], lower, abs_tol=1e-15)
            and math.isclose(coordinate[-1], upper, abs_tol=1e-15),
            f"{path}: {key} coordinate endpoints do not match the contract",
        )
        require(
            all(
                math.isclose(right - left, expected_step, abs_tol=1e-14)
                for left, right in zip(coordinate, coordinate[1:])
            ),
            f"{path}: {key} coordinates are not uniformly spaced",
        )
        published_series.append(
            {
                "panel_id": series["panel_id"],
                "station_id": series["station_id"],
                "quantity_id": series["quantity_id"],
                "coordinate": coordinate,
                "value": value,
            }
        )
    require(
        provided_series == expected_series,
        f"{path}: series differ; missing={sorted(expected_series - provided_series)}, "
        f"unexpected={sorted(provided_series - expected_series)}",
    )

    sampling_stations = provenance.get("sampling", {}).get("stations", [])
    require(
        {station.get("station_id") for station in sampling_stations}
        == {station["id"] for station in profile_definition["stations"]},
        f"{path}: sampling provenance does not cover every station",
    )
    require(
        all(
            station.get("valid_sample_count") == sample_count
            for station in sampling_stations
        ),
        f"{path}: every station must have {sample_count} VTK-valid samples",
    )

    published_provenance = {
        "coverage": REPRESENTATIVE_COVERAGE,
        "source_extraction_sha256": sha256_file(path),
        "profile_definition_sha256": profile_definition_sha256,
        **provenance,
    }
    return {
        "case_id": case["case_id"],
        "series": published_series,
    }, published_provenance


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--submission-root",
        type=Path,
        required=True,
        help="Path to a fluidsbench-submission checkout containing the corrected extractor.",
    )
    parser.add_argument("--standard-extraction", type=Path, required=True)
    parser.add_argument("--aoa-extraction", type=Path, required=True)
    parser.add_argument("--release-id", required=True)
    parser.add_argument(
        "--generated-at",
        required=True,
        help="UTC ISO-8601 timestamp recorded in the prototype release manifest.",
    )
    args = parser.parse_args()

    submission_root = args.submission_root.resolve()
    benchmark_root = submission_root / "benchmark-specs" / "airfrans"
    specification = load_json(benchmark_root / "submission-spec.json")
    profile_definition_path = (
        benchmark_root / specification["profile_definition"]["file"]
    )
    profile_definition = load_json(profile_definition_path)
    profile_definition_sha256 = sha256_file(profile_definition_path)
    require(
        specification["profile_definition"]["sha256"] == profile_definition_sha256,
        "submission specification does not pin the current profile definition",
    )
    extractor_path = (
        submission_root / "examples" / "airfrans-profile-extraction" / "extract.py"
    )
    extractor_sha256 = sha256_file(extractor_path)

    extraction_paths = {
        "standard": args.standard_extraction.resolve(),
        "aoa": args.aoa_extraction.resolve(),
    }
    extracted = {
        source: validate_extraction(
            path,
            profile_definition,
            profile_definition_sha256,
            extractor_sha256,
        )
        for source, path in extraction_paths.items()
    }
    require(
        sha256_file(extraction_paths["standard"])
        == profile_definition["reference_fixture"]["sha256"],
        "standard extraction is not the hash-bound AirfRANS reference fixture",
    )

    split_case_ids_by_case_set: dict[str, list[set[str]]] = {}
    for split in specification["splits"]:
        split_index = load_json(benchmark_root / split["index_file"])
        split_case_ids_by_case_set.setdefault(split["case_set_id"], []).append(
            set(split_index["case_ids"])
        )
    require(
        set(split_case_ids_by_case_set) == set(CASE_SET_SOURCES),
        "AirfRANS case sets differ from the publisher mapping",
    )
    for case_set_id, source in CASE_SET_SOURCES.items():
        case_id = extracted[source][0]["case_id"]
        require(
            all(
                case_id in case_ids
                for case_ids in split_case_ids_by_case_set[case_set_id]
            ),
            f"{case_id} is not a member of every official split using {case_set_id}",
        )

    manifest_path = GROUND_TRUTH_ROOT / "manifest.json"
    manifest = load_json(manifest_path)
    require(
        manifest.get("status") == "prototype_dummy_data",
        "this publisher may only update the prototype review release",
    )
    manifest["data_release"]["id"] = args.release_id
    manifest["data_release"]["generated_at"] = args.generated_at

    dataset = next(item for item in manifest["datasets"] if item["id"] == "airfrans")
    case_sets = {item["id"]: item for item in dataset["case_sets"]}
    for case_set_id, source in CASE_SET_SOURCES.items():
        case, provenance = extracted[source]
        directory = GROUND_TRUTH_ROOT / "datasets" / "airfrans" / case_set_id
        chunk_path = directory / "chunk-000.json"
        index_path = directory / "index.json"
        write_json(
            chunk_path,
            {
                "schema_version": "1.0",
                "status": "official_dataset_reference_fixture",
                "provenance": provenance,
                "cases": [case],
            },
        )
        write_json(
            index_path,
            {
                "schema_version": "1.0",
                "dataset_id": "airfrans",
                "case_set_id": case_set_id,
                "case_count": 1,
                "coverage": REPRESENTATIVE_COVERAGE,
                "case_id_status": CASE_ID_STATUS,
                "chunks": [
                    {
                        "file": chunk_path.name,
                        "case_ids": [case["case_id"]],
                        "sha256": sha256_file(chunk_path),
                    }
                ],
            },
        )
        case_set = case_sets[case_set_id]
        case_set["index_sha256"] = sha256_file(index_path)
        case_set["case_count"] = 1
        case_set["coverage"] = REPRESENTATIVE_COVERAGE
        case_set["case_id_status"] = CASE_ID_STATUS

    for split in dataset["splits"]:
        split["case_count"] = case_sets[split["case_set_id"]]["case_count"]
        split["coverage"] = REPRESENTATIVE_COVERAGE
    dataset["note"] = (
        "AirfRANS review curves are checksum-verified official-dataset reference fixtures "
        "generated by the pinned outward-normal extractor; they are representative subsets, "
        "not complete split releases."
    )
    write_json(manifest_path, manifest)
    print(
        f"Published AirfRANS representative ground truth for {len(CASE_SET_SOURCES)} case sets; "
        f"manifest SHA-256: {sha256_file(manifest_path)}"
    )


if __name__ == "__main__":
    main()
