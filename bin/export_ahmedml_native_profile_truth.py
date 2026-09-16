#!/usr/bin/env python3
"""Export exact evaluator-owned AhmedML profile truth for the dev dashboard.

The source of every value is the checksum-bound ``profile_mapping_and_truth``
artifact created by the AhmedML evaluator-support builder.  No participant
prediction, interpolation, analytical curve, or placeholder value is accepted.
The five official test case sets are materialized separately so their case
order is identical to the pinned benchmark split indices.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import shutil
import tempfile
from pathlib import Path
from typing import Any

import numpy as np


RELEASE_ID = "ahmedml-native-profile-truth-all316-v1-candidate"
MASTER_SCHEMA = "fluidsbench-ahmedml-native-profile-truth-master-index-v1"
INDEX_SCHEMA = "fluidsbench-ahmedml-native-profile-truth-index-v1"
CHUNK_SCHEMA = "fluidsbench-ahmedml-native-profile-truth-chunk-v1"
DATASET_ID = "ahmedml"
DATASET_REVISION = "02688c727cdb8dc8678e28abc6bbbb7e93c5fa15"
SOURCE_IDENTITY_SHA256 = "56a620a5b335cef6cb0587e186df321eb907bbe46e8b81aa4de302b8fe73cf44"
PROFILE_DEFINITION_SHA256 = "1048a0380f70de778e3e51db07d6910579f720d6f2dd1d9ad7179dbfe88d1cae"
CASE_SET_SPLITS = {
    "full-test": "full",
    "geometry-test": "geometry",
    "high_drag-test": "high_drag",
    "low_drag-test": "low_drag",
    "image_wake-test": "image_wake",
}
TRUTH_SOURCE = {
    "source_kind": "native_cfd",
    "analytical_dummy": False,
    "native_quantity_source": "pinned_ahmedml_cell_data_via_frozen_evaluator_mapping",
}
PROFILE_ARTIFACT_ARRAYS = {
    "surface_raw_cell_id": ("<i8", (3, 128)),
    "surface_coordinate": ("<f8", (3, 128)),
    "surface_target_xyz_m": ("<f8", (3, 128, 3)),
    "surface_projected_xyz_m": ("<f8", (3, 128, 3)),
    "surface_distance_m": ("<f8", (3, 128)),
    "surface_truth_cp": ("<f4", (3, 128)),
    "volume_raw_cell_id": ("<i8", (4, 128)),
    "volume_coordinate": ("<f8", (4, 128)),
    "volume_target_xyz_m": ("<f8", (4, 128, 3)),
    "volume_projected_xyz_m": ("<f8", (4, 128, 3)),
    "volume_distance_m": ("<f8", (4, 128)),
    "volume_truth_ux_over_uinf": ("<f4", (4, 128)),
}


class ExportError(ValueError):
    """Raised when exact native truth cannot be exported fail-closed."""


def _read_json(path: Path) -> tuple[dict[str, Any], str]:
    try:
        payload = path.read_bytes()
        value = json.loads(payload)
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ExportError(f"cannot read JSON {path}: {error}") from error
    if not isinstance(value, dict):
        raise ExportError(f"{path} must contain a JSON object")
    return value, hashlib.sha256(payload).hexdigest()


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _write_json(path: Path, value: object) -> tuple[str, int]:
    payload = (
        json.dumps(value, indent=2, ensure_ascii=True, allow_nan=False) + "\n"
    ).encode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
    return hashlib.sha256(payload).hexdigest(), len(payload)


def _run_number(case_id: str) -> int:
    prefix = "run_"
    if not case_id.startswith(prefix) or not case_id[len(prefix) :].isdigit():
        raise ExportError(f"invalid AhmedML case ID {case_id!r}")
    return int(case_id[len(prefix) :])


def _safe_relative(root: Path, relative: object, label: str) -> Path:
    if not isinstance(relative, str) or not relative:
        raise ExportError(f"{label} must be a non-empty relative path")
    path = Path(relative)
    if path.is_absolute() or ".." in path.parts:
        raise ExportError(f"{label} escapes {root}")
    resolved = (root / path).resolve()
    if not resolved.is_relative_to(root.resolve()):
        raise ExportError(f"{label} escapes {root}")
    return resolved


def _load_contracts(submission_root: Path) -> tuple[dict[str, list[str]], dict[str, Any]]:
    spec_path = submission_root / "benchmark-specs" / "ahmedml" / "submission-spec.json"
    spec, _ = _read_json(spec_path)
    scoring = spec.get("scoring_support")
    source = scoring.get("dataset_source") if isinstance(scoring, dict) else None
    profile = spec.get("profile_definition")
    if (
        spec.get("dataset_id") != DATASET_ID
        or spec.get("dataset_version") != "ahmedml-native-v1-candidate"
        or not isinstance(source, dict)
        or source.get("revision") != DATASET_REVISION
        or source.get("identity_sha256") != SOURCE_IDENTITY_SHA256
        or not isinstance(profile, dict)
        or profile.get("sha256") != PROFILE_DEFINITION_SHA256
        or profile.get("sample_count_per_series") != 128
    ):
        raise ExportError("submission repository has a stale or incompatible AhmedML contract")

    definition_path = _safe_relative(spec_path.parent, profile.get("file"), "profile definition")
    definition, definition_sha = _read_json(definition_path)
    if definition_sha != PROFILE_DEFINITION_SHA256 or definition.get("sample_count") != 128:
        raise ExportError("profile definition bytes or sample count differ from the closed contract")

    split_by_id = {
        item.get("id"): item
        for item in spec.get("splits", [])
        if isinstance(item, dict)
    }
    case_sets: dict[str, list[str]] = {}
    for case_set_id, split_id in CASE_SET_SPLITS.items():
        declaration = split_by_id.get(split_id)
        if not isinstance(declaration, dict) or declaration.get("case_set_id") != case_set_id:
            raise ExportError(f"missing official {case_set_id} declaration")
        index_path = _safe_relative(spec_path.parent, declaration.get("index_file"), "split index")
        index, digest = _read_json(index_path)
        case_ids = index.get("case_ids")
        if (
            digest != declaration.get("sha256")
            or index.get("dataset_id") != DATASET_ID
            or index.get("split_id") != split_id
            or index.get("case_set_id") != case_set_id
            or index.get("case_id_status") != "official"
            or not isinstance(case_ids, list)
            or not all(isinstance(case_id, str) for case_id in case_ids)
            or len(case_ids) != len(set(case_ids))
            or len(case_ids) != declaration.get("case_count")
            or len(case_ids) != index.get("case_count")
        ):
            raise ExportError(f"{split_id} split is not the pinned official case set")
        case_sets[case_set_id] = list(case_ids)
    unique_ids = {case_id for case_ids in case_sets.values() for case_id in case_ids}
    if len(unique_ids) != 316:
        raise ExportError(f"expected 316 unique official test cases; observed {len(unique_ids)}")
    return case_sets, definition


def _station_records(definition: dict[str, Any]) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    panels = definition.get("panels")
    if not isinstance(panels, list) or len(panels) != 2:
        raise ExportError("profile definition must contain exactly two panels")
    result: list[list[dict[str, str]]] = []
    expected = (("pressure_profiles", "cp", 3), ("velocity_profiles", "ux_over_uinf", 4))
    for panel, (panel_id, quantity_id, station_count) in zip(panels, expected, strict=True):
        if not isinstance(panel, dict) or panel.get("panel_id") != panel_id or panel.get("quantity_id") != quantity_id:
            raise ExportError(f"profile definition panel {panel_id} differs")
        stations = panel.get("stations")
        if not isinstance(stations, list) or len(stations) != station_count:
            raise ExportError(f"profile definition panel {panel_id} station count differs")
        records: list[dict[str, str]] = []
        for station in stations:
            if not isinstance(station, dict):
                raise ExportError("profile station must be an object")
            station_id = station.get("station_id")
            coordinate_id = station.get("coordinate_id")
            if not isinstance(station_id, str) or not isinstance(coordinate_id, str):
                raise ExportError("profile station lacks its identifiers")
            records.append({"station_id": station_id, "coordinate_id": coordinate_id})
        result.append(records)
    return result[0], result[1]


def _finite_array(value: np.ndarray, shape: tuple[int, ...], label: str) -> np.ndarray:
    array = np.asarray(value)
    if array.shape != shape or not np.issubdtype(array.dtype, np.number):
        raise ExportError(f"{label} must have shape {shape}; observed {array.shape}/{array.dtype}")
    converted = np.asarray(array, dtype=np.float64)
    if np.any(~np.isfinite(converted)):
        raise ExportError(f"{label} contains a non-finite value")
    return converted


def _artifact_array_declarations() -> dict[str, dict[str, object]]:
    return {
        name: {"dtype": dtype, "shape": list(shape)}
        for name, (dtype, shape) in PROFILE_ARTIFACT_ARRAYS.items()
    }


def _load_case(
    support_root: Path,
    case_id: str,
    surface_stations: list[dict[str, str]],
    volume_stations: list[dict[str, str]],
) -> dict[str, Any]:
    case_root = support_root / case_id
    manifest_path = case_root / "case-support.json"
    manifest, manifest_sha = _read_json(manifest_path)
    definitions = manifest.get("definitions")
    source = manifest.get("source")
    artifact = manifest.get("artifacts", {}).get("profile_mapping_and_truth")
    if (
        manifest.get("schema") != "ahmedml-native-case-support-v1"
        or manifest.get("schema_version") != 1
        or manifest.get("case_id") != case_id
        or manifest.get("run_id") != _run_number(case_id)
        or manifest.get("dataset_revision") != DATASET_REVISION
        or not isinstance(source, dict)
        or source.get("source_identity_sha256") != SOURCE_IDENTITY_SHA256
        or not isinstance(definitions, dict)
        or definitions.get("profile_definition_sha256") != PROFILE_DEFINITION_SHA256
        or definitions.get("profile_sample_count") != 128
        or not isinstance(artifact, dict)
        or artifact.get("format") != "npz"
        or artifact.get("arrays") != _artifact_array_declarations()
    ):
        raise ExportError(f"{case_id} support manifest differs from the exact native contract")
    artifact_path = _safe_relative(case_root, artifact.get("path"), "profile artifact")
    if (
        artifact_path.stat().st_size != artifact.get("size_bytes")
        or _sha256_file(artifact_path) != artifact.get("sha256")
    ):
        raise ExportError(f"{case_id} profile mapping/truth SHA-256 differs")

    try:
        with np.load(artifact_path, allow_pickle=False) as arrays:
            if set(arrays.files) != set(PROFILE_ARTIFACT_ARRAYS):
                raise ExportError(f"{case_id} profile artifact member set differs")
            for name, (dtype, shape) in PROFILE_ARTIFACT_ARRAYS.items():
                value = np.asarray(arrays[name])
                if value.dtype.str != dtype or value.shape != shape:
                    raise ExportError(
                        f"{case_id}/{name} has {value.dtype.str} {value.shape}, "
                        f"expected {dtype} {shape}"
                    )
                if value.dtype.kind == "f" and np.any(~np.isfinite(value)):
                    raise ExportError(f"{case_id}/{name} contains a non-finite value")
            surface_coordinate = _finite_array(arrays["surface_coordinate"], (3, 128), f"{case_id}/surface_coordinate")
            surface_truth = _finite_array(arrays["surface_truth_cp"], (3, 128), f"{case_id}/surface_truth_cp")
            volume_coordinate = _finite_array(arrays["volume_coordinate"], (4, 128), f"{case_id}/volume_coordinate")
            volume_truth = _finite_array(arrays["volume_truth_ux_over_uinf"], (4, 128), f"{case_id}/volume_truth_ux_over_uinf")
    except (OSError, KeyError, ValueError) as error:
        raise ExportError(f"cannot read exact profile truth for {case_id}: {error}") from error
    if np.any(np.diff(surface_coordinate, axis=1) <= 0.0) or np.any(np.diff(volume_coordinate, axis=1) <= 0.0):
        raise ExportError(f"{case_id} profile coordinates are not strictly increasing")
    expected_surface_coordinate = np.vstack(
        [np.linspace(0.0, 1.0, 128, dtype=np.float64)] * 3
    )
    expected_volume_coordinate = np.vstack(
        [
            np.linspace(0.0, 2.0, 128, dtype=np.float64),
            np.linspace(0.0, 2.0, 128, dtype=np.float64),
            np.linspace(0.0, 2.0, 128, dtype=np.float64),
            np.linspace(-1.0, 1.0, 128, dtype=np.float64),
        ]
    )
    if not np.array_equal(surface_coordinate, expected_surface_coordinate):
        raise ExportError(f"{case_id} surface coordinates differ from the exact 128-point grids")
    if not np.array_equal(volume_coordinate, expected_volume_coordinate):
        raise ExportError(f"{case_id} volume coordinates differ from the exact 128-point grids")

    series: list[dict[str, Any]] = []
    for index, station in enumerate(surface_stations):
        series.append(
            {
                "panel_id": "pressure_profiles",
                "station_id": station["station_id"],
                "quantity_id": "cp",
                "coordinate_id": station["coordinate_id"],
                "coordinate_unit": "1",
                "coordinate": surface_coordinate[index].tolist(),
                "value": surface_truth[index].tolist(),
                "sample_count": 128,
                "source": "evaluator_owned_frozen_native_cell_mapping",
            }
        )
    for index, station in enumerate(volume_stations):
        series.append(
            {
                "panel_id": "velocity_profiles",
                "station_id": station["station_id"],
                "quantity_id": "ux_over_uinf",
                "coordinate_id": station["coordinate_id"],
                "coordinate_unit": "1",
                "coordinate": volume_coordinate[index].tolist(),
                "value": volume_truth[index].tolist(),
                "sample_count": 128,
                "source": "evaluator_owned_frozen_native_cell_mapping",
            }
        )
    return {
        "case_id": case_id,
        "truth_source": TRUTH_SOURCE,
        "lineage": {
            "case_support_sha256": manifest_sha,
            "profile_mapping_and_truth_sha256": artifact["sha256"],
            "profile_definition_sha256": PROFILE_DEFINITION_SHA256,
        },
        "series": series,
    }


def _case_set(
    output_root: Path,
    case_set_id: str,
    case_ids: list[str],
    cases: dict[str, dict[str, Any]],
    cases_per_chunk: int,
) -> dict[str, Any]:
    case_set_root = output_root / case_set_id
    chunks: list[dict[str, Any]] = []
    for start in range(0, len(case_ids), cases_per_chunk):
        chunk_ids = case_ids[start : start + cases_per_chunk]
        chunk_name = f"chunk-{start // cases_per_chunk:03d}.json"
        chunk = {
            "schema": CHUNK_SCHEMA,
            "schema_version": "1.0",
            "release_id": RELEASE_ID,
            "dataset_id": DATASET_ID,
            "dataset_revision": DATASET_REVISION,
            "source_identity_sha256": SOURCE_IDENTITY_SHA256,
            "profile_definition_sha256": PROFILE_DEFINITION_SHA256,
            "case_set_id": case_set_id,
            "truth_source": TRUTH_SOURCE,
            "case_count": len(chunk_ids),
            "case_ids": chunk_ids,
            "series_per_case": 7,
            "samples_per_series": 128,
            "cases": [cases[case_id] for case_id in chunk_ids],
        }
        digest, size = _write_json(case_set_root / "chunks" / chunk_name, chunk)
        chunks.append(
            {
                "file": f"chunks/{chunk_name}",
                "sha256": digest,
                "size_bytes": size,
                "case_count": len(chunk_ids),
                "case_ids": chunk_ids,
                "series_count": 7 * len(chunk_ids),
            }
        )
    index = {
        "schema": INDEX_SCHEMA,
        "schema_version": "1.0",
        "release_id": RELEASE_ID,
        "status": "candidate_owner_review_required",
        "usage": "browser_visualization_only_not_metric_recomputation",
        "dataset_id": DATASET_ID,
        "dataset_revision": DATASET_REVISION,
        "source_identity_sha256": SOURCE_IDENTITY_SHA256,
        "profile_definition_sha256": PROFILE_DEFINITION_SHA256,
        "truth_source": TRUTH_SOURCE,
        "case_set_id": case_set_id,
        "case_id_status": "official",
        "case_count": len(case_ids),
        "case_ids": case_ids,
        "series_per_case": 7,
        "samples_per_series": 128,
        "chunks": chunks,
    }
    index_sha, index_size = _write_json(case_set_root / "index.json", index)
    return {
        "case_set_id": case_set_id,
        "file": f"{case_set_id}/index.json",
        "sha256": index_sha,
        "size_bytes": index_size,
        "case_count": len(case_ids),
        "case_id_status": "official",
    }


def _replace_tree(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        backup = destination.with_name(f".{destination.name}.old-{os.getpid()}")
        destination.rename(backup)
        try:
            source.rename(destination)
        except Exception:
            backup.rename(destination)
            raise
        shutil.rmtree(backup)
    else:
        source.rename(destination)


def export(args: argparse.Namespace) -> dict[str, Any]:
    submission_root = args.submission_repository.expanduser().resolve()
    support_root = args.support_root.expanduser().resolve()
    output = args.output.expanduser().resolve()
    if not (1 <= args.cases_per_chunk <= 50):
        raise ExportError("--cases-per-chunk must lie in [1, 50]")
    case_sets, definition = _load_contracts(submission_root)
    surface_stations, volume_stations = _station_records(definition)
    unique_ids = sorted(
        {case_id for case_ids in case_sets.values() for case_id in case_ids},
        key=_run_number,
    )
    cases = {
        case_id: _load_case(
            support_root, case_id, surface_stations, volume_stations
        )
        for case_id in unique_ids
    }

    temp_parent = output.parent
    temp_parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=f".{output.name}-", dir=temp_parent) as raw:
        staging = Path(raw) / output.name
        staging.mkdir()
        published_sets = [
            _case_set(
                staging,
                case_set_id,
                case_sets[case_set_id],
                cases,
                args.cases_per_chunk,
            )
            for case_set_id in CASE_SET_SPLITS
        ]
        master = {
            "schema": MASTER_SCHEMA,
            "schema_version": "1.0",
            "release_id": RELEASE_ID,
            "status": "candidate_owner_review_required",
            "usage": "browser_visualization_only_not_metric_recomputation",
            "generated_at": args.generated_at,
            "dataset_id": DATASET_ID,
            "dataset_repository": "neashton/ahmedml",
            "dataset_revision": DATASET_REVISION,
            "source_identity_sha256": SOURCE_IDENTITY_SHA256,
            "profile_definition_sha256": PROFILE_DEFINITION_SHA256,
            "truth_source": TRUTH_SOURCE,
            "case_count": len(unique_ids),
            "case_ids": unique_ids,
            "case_set_count": len(published_sets),
            "case_sets": published_sets,
            "series_per_case": 7,
            "samples_per_series": 128,
            "derivation": "exact_truth_arrays_from_checksum_verified_evaluator_case_support",
        }
        master_sha, master_size = _write_json(staging / "index.json", master)
        _replace_tree(staging, output)

    result = {
        "release_id": RELEASE_ID,
        "output": str(output),
        "case_count": len(unique_ids),
        "case_set_count": len(case_sets),
        "published_case_records": sum(map(len, case_sets.values())),
        "master_index_sha256": master_sha,
        "master_index_size_bytes": master_size,
        "case_sets": published_sets,
    }
    if args.manifest is not None:
        manifest_path = args.manifest.expanduser().resolve()
        manifest, _ = _read_json(manifest_path)
        manifest_root = manifest_path.parent
        if not output.is_relative_to(manifest_root):
            raise ExportError("profile output must be inside the ground-truth manifest directory")
        datasets = manifest.get("datasets")
        matches = [
            item
            for item in datasets or []
            if isinstance(item, dict) and item.get("id") == DATASET_ID
        ]
        if len(matches) != 1:
            raise ExportError("ground-truth manifest must contain one AhmedML declaration")
        dataset_manifest = matches[0]
        existing_splits = {
            item.get("id"): item
            for item in dataset_manifest.get("splits", [])
            if isinstance(item, dict)
        }
        split_labels = {
            "full": "Full",
            "medium": "Medium",
            "scarce": "Scarce",
            "super_scarce": "Super scarce",
            "geometry": "Geometry",
            "high_drag": "High drag",
            "low_drag": "Low drag",
            "image_wake": "Image wake",
        }
        split_case_set = {
            split_id: case_set_id
            for case_set_id, canonical_split in CASE_SET_SPLITS.items()
            for split_id in (
                ("full", "medium", "scarce", "super_scarce")
                if canonical_split == "full"
                else (canonical_split,)
            )
        }
        split_counts = {
            split_id: len(case_sets[case_set_id])
            for split_id, case_set_id in split_case_set.items()
        }
        dataset_manifest.clear()
        dataset_manifest.update(
            {
                "id": DATASET_ID,
                "name": "AhmedML",
                "native_profile_truth": {
                    "source_kind": "native_cfd",
                    "analytical_dummy": False,
                    "dataset_revision": DATASET_REVISION,
                    "source_identity_sha256": SOURCE_IDENTITY_SHA256,
                    "profile_definition_sha256": PROFILE_DEFINITION_SHA256,
                    "release_id": RELEASE_ID,
                    "case_count": len(unique_ids),
                    "case_set_count": len(published_sets),
                    "series_per_case": 7,
                    "samples_per_series": 128,
                    "master_index_file": str(
                        (output / "index.json").relative_to(manifest_root)
                    ),
                    "master_index_sha256": master_sha,
                },
                "splits": [
                    {
                        "id": split_id,
                        "label": existing_splits.get(split_id, {}).get(
                            "label", split_labels[split_id]
                        ),
                        "case_set_id": split_case_set[split_id],
                        "case_count": split_counts[split_id],
                    }
                    for split_id in split_labels
                ],
                "case_sets": [
                    {
                        "id": entry["case_set_id"],
                        "index_file": str(
                            (
                                output
                                / entry["case_set_id"]
                                / "index.json"
                            ).relative_to(manifest_root)
                        ),
                        "index_sha256": entry["sha256"],
                        "case_count": entry["case_count"],
                        "case_id_status": "official",
                    }
                    for entry in published_sets
                ],
                "note": (
                    "All seven AhmedML curves per case are exact evaluator-owned "
                    "native CFD truth sampled on frozen mappings at 128 points per "
                    "series for all 316 unique official test cases."
                ),
            }
        )
        if isinstance(manifest.get("data_release"), dict):
            manifest["data_release"]["generated_at"] = args.generated_at
        manifest_staging = manifest_path.with_name(
            f".{manifest_path.name}.partial-{os.getpid()}"
        )
        try:
            manifest_sha, manifest_size = _write_json(manifest_staging, manifest)
            os.replace(manifest_staging, manifest_path)
        finally:
            manifest_staging.unlink(missing_ok=True)
        result["manifest"] = {
            "path": str(manifest_path),
            "sha256": manifest_sha,
            "size_bytes": manifest_size,
        }
    return result


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submission-repository", type=Path, required=True)
    parser.add_argument("--support-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--manifest",
        type=Path,
        help="optionally replace the AhmedML entry in this ground-truth manifest",
    )
    parser.add_argument("--generated-at", required=True)
    parser.add_argument("--cases-per-chunk", type=int, default=10)
    return parser


def main() -> int:
    args = _parser().parse_args()
    try:
        result = export(args)
    except ExportError as error:
        raise SystemExit(f"error: {error}") from error
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
