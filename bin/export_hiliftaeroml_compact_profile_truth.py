#!/usr/bin/env python3
"""Export all-split plot-only HiLiftAeroML truth from benchmark-owned data.

The generated release preserves every compact Cp support sample and every
explicit velocity gap, but deliberately omits evaluator weights, native
mapping arrays, and full-field/native-profile data.  It is a visualization
release, not an independent scoring source.

Truth values come only from the validated 1,355-case native-profile truth
release.  Plot support is reconstructed case-by-case from its frozen
prerequisite authority with the exact compact profile-v2 implementation; no
participant prediction output is a source input.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib
import json
import os
import re
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Any

import numpy as np


RELEASE_ID = "hiliftaeroml-compact-profile-truth-all1355-v1"
MASTER_INDEX_SCHEMA = (
    "fluidsbench-hiliftaeroml-compact-profile-truth-master-index-v1"
)
INDEX_SCHEMA = "fluidsbench-hiliftaeroml-compact-profile-truth-index-v1"
CHUNK_SCHEMA = "fluidsbench-hiliftaeroml-compact-profile-truth-chunk-v1"
PROVENANCE_SCHEMA = "fluidsbench-hiliftaeroml-compact-profile-truth-provenance-v1"
RECEIPT_SCHEMA = "fluidsbench-hiliftaeroml-compact-profile-truth-release-v1"
FORMAT = "fluidsbench-hiliftaeroml-compact-profile-truth-v1"
SCHEMA_VERSION = "1.0"
EXPECTED_CASE_COUNT = 1355
EXPECTED_CASE_SET_COUNT = 8
CHUNK_SIZE = 10
CP_ROWS = tuple("ABCDEFGHIJ")
VELOCITY_STATIONS = ("B.2", "B.3", "C.1", "C.2", "C.3")
CASE_ARRAY_ORDER = (
    "cp_x_in",
    "cp_truth",
    "cp_branch_point_offsets",
    "cp_branch_row_code",
    "velocity_truth_speed_over_u_inf",
)
COMMON_ARRAY_ORDER = (
    "velocity_coordinate_in",
    "velocity_valid_mask",
    "velocity_station_row_offsets",
)
SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")
REVISION_PATTERN = re.compile(r"^[0-9a-f]{40}$")


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def compact_json_bytes(value: Any) -> bytes:
    return (
        json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        + "\n"
    ).encode("utf-8")


def pretty_json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def write_bytes(path: Path, payload: bytes) -> dict[str, Any]:
    if path.exists() or path.is_symlink():
        raise ValueError(f"refusing to overwrite release artifact: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
    return {"sha256": sha256_bytes(payload), "byte_size": len(payload)}


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def require_sha256(value: Any, label: str) -> str:
    require(
        isinstance(value, str) and SHA256_PATTERN.fullmatch(value) is not None,
        f"{label} must be a lowercase SHA-256",
    )
    return value


def relative_record(path: str, details: dict[str, Any]) -> dict[str, Any]:
    return {"file": path, **details}


def safe_release_file(root: Path, descriptor: Any, label: str) -> tuple[Path, str]:
    require(isinstance(descriptor, dict), f"{label} descriptor is absent")
    relative = descriptor.get("file")
    require(
        isinstance(relative, str)
        and relative
        and not Path(relative).is_absolute()
        and ".." not in Path(relative).parts,
        f"{label} path is unsafe",
    )
    path = (root / relative).resolve()
    require(root.resolve() in path.parents, f"{label} escaped its release root")
    require(path.is_file() and not path.is_symlink(), f"{label} is not regular")
    digest = require_sha256(descriptor.get("sha256"), f"{label} sha256")
    require(sha256_file(path) == digest, f"{label} SHA-256 differs")
    require(path.stat().st_size == descriptor.get("byte_size"), f"{label} size differs")
    return path, digest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submission-root", type=Path, required=True)
    parser.add_argument("--native-truth-release", type=Path, required=True)
    parser.add_argument("--native-truth-manifest-sha256", required=True)
    parser.add_argument("--authority-index", type=Path, required=True)
    parser.add_argument("--authority-index-sha256", required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--source-repository", required=True)
    parser.add_argument("--source-revision", required=True)
    parser.add_argument("--generated-at", required=True)
    return parser.parse_args()


def load_source_scope(
    *,
    native_truth: Any,
    truth_materializer: Any,
    release_root: Path,
    expected_manifest_sha256: str,
    authority_path: Path,
    expected_authority_sha256: str,
) -> tuple[
    dict[str, Any],
    str,
    dict[str, Any],
    list[dict[str, Any]],
    Any,
]:
    require(
        release_root.is_dir() and not release_root.is_symlink(),
        "native truth release must be a regular directory",
    )
    manifest_path = release_root / "manifest.json"
    manifest = load_json(manifest_path)
    manifest_sha = sha256_file(manifest_path)
    require(
        manifest_sha == require_sha256(
            expected_manifest_sha256, "expected native truth manifest"
        ),
        "native truth manifest differs from its explicit pin",
    )
    require(
        manifest.get("release_id") == native_truth.TRUTH_RELEASE_ID
        and manifest.get("format") == native_truth.TRUTH_FORMAT
        and manifest.get("case_count") == EXPECTED_CASE_COUNT
        and manifest.get("case_set_count") == EXPECTED_CASE_SET_COUNT,
        "native truth manifest identity or official scope differs",
    )
    index_path, index_sha = safe_release_file(
        release_root, manifest.get("master_index"), "native truth master index"
    )
    index = load_json(index_path)
    case_ids = index.get("case_ids")
    require(
        isinstance(case_ids, list)
        and len(case_ids) == len(set(case_ids)) == EXPECTED_CASE_COUNT
        and case_ids == sorted(case_ids),
        "native truth master case inventory differs",
    )
    require(
        index.get("case_count") == EXPECTED_CASE_COUNT
        and set(index.get("case_locations", {})) == set(case_ids),
        "native truth master index coverage differs",
    )

    case_sets: list[dict[str, Any]] = []
    seen_case_sets: set[str] = set()
    union: set[str] = set()
    universe_sets: list[tuple[str, tuple[str, ...], str]] = []
    descriptors = manifest.get("case_sets")
    require(
        isinstance(descriptors, list)
        and len(descriptors) == EXPECTED_CASE_SET_COUNT,
        "native truth case-set descriptors differ",
    )
    for descriptor in descriptors:
        case_set_id = descriptor.get("case_set_id")
        require(
            isinstance(case_set_id, str)
            and case_set_id.startswith("caseset-")
            and case_set_id not in seen_case_sets,
            "native truth case-set identity differs",
        )
        seen_case_sets.add(case_set_id)
        path, digest = safe_release_file(
            release_root, descriptor, f"{case_set_id} native truth index"
        )
        case_set = load_json(path)
        members = case_set.get("case_ids")
        require(
            case_set.get("case_set_id") == case_set_id
            and case_set.get("master_index_sha256") == index_sha
            and isinstance(members, list)
            and len(members) == len(set(members)) == descriptor.get("case_count")
            and set(members).issubset(case_ids),
            f"{case_set_id} native truth membership differs",
        )
        source_index_sha = require_sha256(
            case_set.get("source_scoring_support_case_set_index_sha256"),
            f"{case_set_id} source case-set index",
        )
        case_sets.append(
            {
                "case_set_id": case_set_id,
                "case_ids": list(members),
                "native_truth_index_sha256": digest,
                "source_scoring_support_case_set_index_sha256": source_index_sha,
            }
        )
        universe_sets.append((case_set_id, tuple(members), source_index_sha))
        union.update(members)
    require(union == set(case_ids), "native truth case sets do not cover the universe")

    universe = native_truth.CaseUniverse(
        case_ids=tuple(case_ids),
        case_sets=tuple(universe_sets),
        support_manifest_sha256=index["support_manifest_sha256"],
        case_universe_sha256=index["case_universe_sha256"],
    )
    require(
        authority_path.is_file() and not authority_path.is_symlink(),
        "prerequisite authority index must be a regular file",
    )
    expected_authority_sha = require_sha256(
        expected_authority_sha256, "expected prerequisite authority index"
    )
    authority, authority_sha = truth_materializer.load_prerequisite_authority_index(
        authority_path,
        universe=universe,
        require_complete=True,
    )
    require(
        authority_sha == expected_authority_sha,
        "prerequisite authority index differs from its explicit pin",
    )
    return manifest, manifest_sha, index, case_sets, authority


def truth_authority_matches(record: dict[str, Any], evidence: dict[str, str]) -> bool:
    return (
        record.get("truth_authority", {}).get("authority_identity_sha256")
        == evidence["authority_case_identity_sha256"]
        and record.get("surface_cp", {})
        .get("source", {})
        .get("cp_stencil_identity_sha256")
        == evidence["cp_stencil_identity_sha256"]
        and record.get("volume_velocity", {})
        .get("source", {})
        .get("velocity_stencil_identity_sha256")
        == evidence["velocity_stencil_identity_sha256"]
        and record.get("volume_velocity", {})
        .get("source", {})
        .get("validity_identity_sha256")
        == evidence["validity_identity_sha256"]
    )


def common_velocity_arrays(support: dict[str, np.ndarray]) -> dict[str, np.ndarray]:
    valid = support["velocity_valid_mask"]
    velocity_xyz = support["velocity_requested_xyz_in"]
    offsets = support["velocity_station_row_offsets"].astype(np.int32)
    coordinate = np.empty(len(valid), dtype=np.float32)
    for start_raw, stop_raw in zip(offsets[:-1], offsets[1:], strict=True):
        start = int(start_raw)
        stop = int(stop_raw)
        coordinate[start:stop] = (
            velocity_xyz[start:stop, 2] - velocity_xyz[start, 2]
        ).astype(np.float32)
    return {
        "velocity_coordinate_in": coordinate,
        "velocity_valid_mask": np.array(valid, copy=True),
        "velocity_station_row_offsets": offsets,
    }


def build_release(args: argparse.Namespace, output_root: Path) -> dict[str, Any]:
    submission_root = args.submission_root.resolve()
    require(
        submission_root.is_dir() and not submission_root.is_symlink(),
        "submission root must be a regular directory",
    )
    require(
        REVISION_PATTERN.fullmatch(args.source_revision) is not None,
        "--source-revision must be a full lowercase Git commit",
    )
    require(
        args.generated_at.endswith("Z"),
        "--generated-at must be an explicit UTC timestamp ending in Z",
    )
    sys.path.insert(0, str(submission_root))
    compact = importlib.import_module("reference.hiliftaeroml.compact_profiles")
    compact_evaluator = importlib.import_module(
        "reference.hiliftaeroml.compact_profile_evaluator"
    )
    native_truth = importlib.import_module(
        "reference.hiliftaeroml.native_profile_truth"
    )
    truth_materializer = importlib.import_module(
        "reference.hiliftaeroml.native_profile_truth_materializer"
    )

    release_root = args.native_truth_release.resolve()
    authority_path = args.authority_index.resolve()
    source_manifest, source_manifest_sha, source_index, case_sets, authority = (
        load_source_scope(
            native_truth=native_truth,
            truth_materializer=truth_materializer,
            release_root=release_root,
            expected_manifest_sha256=args.native_truth_manifest_sha256,
            authority_path=authority_path,
            expected_authority_sha256=args.authority_index_sha256,
        )
    )
    case_ids = list(source_index["case_ids"])
    case_documents: dict[str, dict[str, Any]] = {}
    common_arrays: dict[str, np.ndarray] | None = None
    common_source_sha: str | None = None
    total_cp_points = 0
    total_cp_branches = 0
    total_velocity_values = 0
    max_float32_cp_error = 0.0
    max_float32_velocity_error = 0.0

    for ordinal, case_id in enumerate(case_ids):
        record, record_sha, truth_arrays, truth_artifact_sha = (
            native_truth.load_case_truth_arrays(release_root, case_id)
        )
        cp_native, velocity_native, authority_evidence = (
            truth_materializer.load_compact_profile_support_inputs(
                case_id=case_id,
                authority=authority,
            )
        )
        require(
            truth_authority_matches(record, authority_evidence),
            f"{case_id}: native truth and prerequisite authority differ",
        )
        support = compact.build_compact_support(
            cp_native=cp_native,
            truth_cp=truth_arrays["truth_cp"],
            velocity_native=velocity_native,
            truth_velocity_nd=truth_arrays["reference_velocity_nd"],
        )
        metadata = compact.compact_case_metadata(support)

        cp_x = support["cp_xyz_in"][:, 0].astype(np.float32)
        cp_truth = support["cp_truth"].astype(np.float32)
        cp_offsets = support["cp_branch_point_offsets"].astype(np.int32)
        cp_rows = np.array(support["cp_branch_row_code"], copy=True)
        valid = support["velocity_valid_mask"]
        velocity_truth = support["velocity_truth_speed_over_uinf"][valid].astype(
            np.float32
        )
        require(np.all(np.isfinite(cp_x)), f"{case_id}: Cp coordinates are non-finite")
        require(np.all(np.isfinite(cp_truth)), f"{case_id}: Cp truth is non-finite")
        require(
            np.all(np.isfinite(velocity_truth)) and np.all(velocity_truth >= 0.0),
            f"{case_id}: velocity truth is invalid",
        )
        require(cp_offsets[-1] == len(cp_x), f"{case_id}: Cp offsets are incomplete")
        require(
            len(cp_rows) + 1 == len(cp_offsets),
            f"{case_id}: Cp row/offset counts differ",
        )
        require(
            set(cp_rows.tolist()) == set(range(10)),
            f"{case_id}: Cp A-J row coverage is incomplete",
        )

        candidate_common = common_velocity_arrays(support)
        candidate_common_sha = sha256_bytes(
            compact.deterministic_npz_bytes(
                candidate_common,
                order=COMMON_ARRAY_ORDER,
            )
        )
        if common_arrays is None:
            common_arrays = candidate_common
            common_source_sha = candidate_common_sha
        else:
            require(
                candidate_common_sha == common_source_sha,
                f"{case_id}: shared velocity plotting support differs",
            )

        case_arrays = {
            "cp_x_in": cp_x,
            "cp_truth": cp_truth,
            "cp_branch_point_offsets": cp_offsets,
            "cp_branch_row_code": cp_rows,
            "velocity_truth_speed_over_u_inf": velocity_truth,
        }
        payload = compact.deterministic_npz_bytes(
            case_arrays,
            order=CASE_ARRAY_ORDER,
        )
        artifact_rel = f"artifacts/{case_id}/plot-profile-truth.npz"
        artifact_details = write_bytes(output_root / artifact_rel, payload)

        cp_error = float(
            np.max(np.abs(support["cp_truth"] - cp_truth.astype(np.float64)))
        )
        velocity_error = float(
            np.max(
                np.abs(
                    support["velocity_truth_speed_over_uinf"][valid]
                    - velocity_truth.astype(np.float64)
                )
            )
        )
        max_float32_cp_error = max(max_float32_cp_error, cp_error)
        max_float32_velocity_error = max(max_float32_velocity_error, velocity_error)
        total_cp_points += len(cp_truth)
        total_cp_branches += len(cp_rows)
        total_velocity_values += len(velocity_truth)

        case_documents[case_id] = {
            "case_id": case_id,
            "case_ordinal": ordinal,
            "truth_source": {
                "source_kind": "native_cfd",
                "analytical_dummy": False,
                "role": "plot_only_not_scoring_source",
            },
            "source_support": {
                "construction": "compact_profile_v2_from_frozen_prerequisite_authority",
                "prediction_outputs_used_as_source": False,
                "native_truth_case_record_sha256": record_sha,
                "native_truth_artifact_sha256": truth_artifact_sha,
                **authority_evidence,
            },
            "artifact": {
                "format": "numpy-npz-v1",
                **relative_record(artifact_rel, artifact_details),
                "array_order": list(CASE_ARRAY_ORDER),
                "content": "plot_only_truth",
            },
            "surface_cp": {
                **metadata["surface_cp"],
                "station_order": list(CP_ROWS),
                "plot_coordinate_array": "cp_x_in",
                "plot_coordinate_id": "streamwise_x_in",
                "plot_coordinate_unit": "in",
                "truth_array": "cp_truth",
                "truth_dtype": "float32",
                "truth_conversion": (
                    "round_to_nearest_ieee754_binary32_from_evaluator_binary64"
                ),
            },
            "volume_velocity": {
                **metadata["volume_velocity"],
                "plot_coordinate_array": "velocity_coordinate_in",
                "plot_coordinate_id": "z_minus_surface_z_in",
                "plot_coordinate_unit": "in",
                "truth_array": "velocity_truth_speed_over_u_inf",
                "truth_storage": "valid_rows_only_in_station_major_prediction_order",
                "truth_dtype": "float32",
                "truth_conversion": (
                    "round_to_nearest_ieee754_binary32_from_evaluator_binary64"
                ),
            },
        }
        if (ordinal + 1) % 25 == 0 or ordinal + 1 == len(case_ids):
            print(
                f"public-compact-truth {ordinal + 1}/{len(case_ids)} {case_id}",
                file=sys.stderr,
                flush=True,
            )

    assert common_arrays is not None
    common_payload = compact.deterministic_npz_bytes(
        common_arrays,
        order=COMMON_ARRAY_ORDER,
    )
    common_rel = "artifacts/common/velocity-plot-support.npz"
    common_details = write_bytes(output_root / common_rel, common_payload)
    common_descriptor = {
        "format": "numpy-npz-v1",
        **relative_record(common_rel, common_details),
        "array_order": list(COMMON_ARRAY_ORDER),
        "station_order": list(VELOCITY_STATIONS),
        "rows_per_station": 801,
        "row_count": 4005,
    }
    shared_index_fields = {
        "status": "public_plot_only_candidate",
        "usage": "browser_visualization_only_not_metric_recomputation",
        "dataset_id": "hiliftaeroml",
        "dataset_revision": source_manifest["release_id"],
        "profile_contract_id": compact_evaluator.COMPACT_PROFILE_CONTRACT_ID,
        "profile_contract_sha256": (
            compact_evaluator.COMPACT_PROFILE_CONTRACT_SHA256
        ),
        "source_profile_truth_release_id": source_manifest["release_id"],
        "source_profile_truth_manifest_sha256": source_manifest_sha,
        "source_prerequisite_authority_index_sha256": sha256_file(authority_path),
        "cp_resolution": {
            "rule": (
                "all_compact_support_points_with_at_most_128_points_per_"
                "physical_connected_graph"
            ),
            "maximum_points_per_physical_graph": compact.CP_POINTS_PER_GRAPH,
            "rows": list(CP_ROWS),
            "resampling_during_publication": False,
        },
        "plot_precision": {
            "coordinates": "float32",
            "truth_values": "float32",
            "scoring_values": "not_included",
        },
        "common_support": common_descriptor,
    }
    case_set_descriptors: list[dict[str, Any]] = []
    for case_set in case_sets:
        case_set_id = case_set["case_set_id"]
        members = case_set["case_ids"]
        chunk_refs: list[dict[str, Any]] = []
        for chunk_index, start in enumerate(range(0, len(members), CHUNK_SIZE)):
            selected = members[start : start + CHUNK_SIZE]
            chunk_id = f"chunk-{chunk_index:03d}"
            chunk = {
                "schema": CHUNK_SCHEMA,
                "schema_version": SCHEMA_VERSION,
                "format": FORMAT,
                "release_id": RELEASE_ID,
                "dataset_id": "hiliftaeroml",
                "case_set_id": case_set_id,
                "case_count": len(selected),
                "case_ids": selected,
                "cases": [case_documents[case_id] for case_id in selected],
            }
            chunk_rel = f"chunks/{case_set_id}/{chunk_id}.json"
            chunk_details = write_bytes(
                output_root / chunk_rel,
                compact_json_bytes(chunk),
            )
            chunk_refs.append(
                {
                    "chunk_id": chunk_id,
                    **relative_record(chunk_rel, chunk_details),
                    "case_count": len(selected),
                    "case_ids": selected,
                }
            )
        index = {
            "schema": INDEX_SCHEMA,
            "schema_version": SCHEMA_VERSION,
            "format": FORMAT,
            "release_id": RELEASE_ID,
            **shared_index_fields,
            "case_set_id": case_set_id,
            "coverage": "complete_split",
            "case_count": len(members),
            "case_ids": members,
            "source_profile_truth_case_set_index_sha256": case_set[
                "native_truth_index_sha256"
            ],
            "chunks": chunk_refs,
        }
        index_rel = f"case-set-{case_set_id}.json"
        index_details = write_bytes(
            output_root / index_rel,
            pretty_json_bytes(index),
        )
        case_set_descriptors.append(
            {
                "case_set_id": case_set_id,
                "case_count": len(members),
                **relative_record(index_rel, index_details),
                "source_profile_truth_case_set_index_sha256": case_set[
                    "native_truth_index_sha256"
                ],
            }
        )

    master_index = {
        "schema": MASTER_INDEX_SCHEMA,
        "schema_version": SCHEMA_VERSION,
        "format": FORMAT,
        "release_id": RELEASE_ID,
        **shared_index_fields,
        "coverage": "all_official_case_sets_deduplicated",
        "case_count": len(case_ids),
        "case_ids": case_ids,
        "case_set_count": len(case_set_descriptors),
        "case_sets": case_set_descriptors,
    }
    master_details = write_bytes(
        output_root / "index.json",
        pretty_json_bytes(master_index),
    )

    module_paths = {
        "compact_profile_evaluator": submission_root
        / "reference"
        / "hiliftaeroml"
        / "compact_profile_evaluator.py",
        "compact_profiles": submission_root
        / "reference"
        / "hiliftaeroml"
        / "compact_profiles.py",
        "native_profile_truth": submission_root
        / "reference"
        / "hiliftaeroml"
        / "native_profile_truth.py",
        "native_profile_truth_materializer": submission_root
        / "reference"
        / "hiliftaeroml"
        / "native_profile_truth_materializer.py",
    }
    provenance = {
        "schema": PROVENANCE_SCHEMA,
        "schema_version": SCHEMA_VERSION,
        "release_id": RELEASE_ID,
        "generated_at": args.generated_at,
        "generator": {
            "file": "bin/export_hiliftaeroml_compact_profile_truth.py",
            "sha256": sha256_file(Path(__file__)),
        },
        "source_repository": args.source_repository,
        "source_revision": args.source_revision,
        "source_implementation": {
            name: {
                "file": path.relative_to(submission_root).as_posix(),
                "sha256": sha256_file(path),
            }
            for name, path in module_paths.items()
        },
        "source_native_truth": {
            "release_id": source_manifest["release_id"],
            "manifest_sha256": source_manifest_sha,
            "master_index_sha256": source_manifest["master_index"]["sha256"],
            "case_count": len(case_ids),
            "case_set_count": len(case_sets),
        },
        "source_prerequisite_authority": {
            "sha256": sha256_file(authority_path),
            "prediction_bearing_evaluator_outputs_used_as_source": False,
        },
        "transformation": {
            "scope": "plot_only_projection",
            "cp": (
                "apply the exact compact-v2 128-point physical-graph rule; "
                "preserve every resulting row and branch boundary; select "
                "streamwise x; cast coordinate and truth to float32"
            ),
            "velocity": (
                "preserve shared station coordinates and validity mask; cast "
                "valid truth speed values to float32"
            ),
            "case_deduplication": (
                "one artifact per unique physical case; case-set indexes and "
                "chunks reference the shared artifact"
            ),
            "omitted": [
                "quadrature_weights",
                "native_mapping_arrays",
                "nonplot_topology_codes",
                "full_field_truth",
                "native_lossless_profile_archive",
            ],
            "metric_recomputation_permitted": False,
        },
        "observed_rounding_error": {
            "maximum_absolute_cp": max_float32_cp_error,
            "maximum_absolute_velocity_speed_over_u_inf": (
                max_float32_velocity_error
            ),
        },
    }
    provenance_details = write_bytes(
        output_root / "provenance.json",
        pretty_json_bytes(provenance),
    )

    release_files = []
    for path in sorted(output_root.rglob("*")):
        if path.is_file() and path.name != "release-receipt.json":
            release_files.append(
                {
                    "file": path.relative_to(output_root).as_posix(),
                    "sha256": sha256_file(path),
                    "byte_size": path.stat().st_size,
                }
            )
    receipt = {
        "schema": RECEIPT_SCHEMA,
        "schema_version": SCHEMA_VERSION,
        "release_id": RELEASE_ID,
        "generated_at": args.generated_at,
        "status": "public_plot_only_candidate",
        "case_count": len(case_ids),
        "case_set_count": len(case_set_descriptors),
        "cp_point_count": total_cp_points,
        "cp_branch_count": total_cp_branches,
        "velocity_valid_value_count": total_velocity_values,
        "master_index": relative_record("index.json", master_details),
        "provenance": relative_record("provenance.json", provenance_details),
        "file_count_excluding_receipt": len(release_files),
        "payload_byte_size_excluding_receipt": sum(
            item["byte_size"] for item in release_files
        ),
        "files": release_files,
    }
    receipt_details = write_bytes(
        output_root / "release-receipt.json",
        compact_json_bytes(receipt),
    )
    return {
        "release_id": RELEASE_ID,
        "case_count": len(case_ids),
        "case_set_count": len(case_set_descriptors),
        "cp_point_count": total_cp_points,
        "velocity_valid_value_count": total_velocity_values,
        "master_index_sha256": master_details["sha256"],
        "receipt_sha256": receipt_details["sha256"],
        "total_bytes": sum(
            path.stat().st_size for path in output_root.rglob("*") if path.is_file()
        ),
    }


def main() -> int:
    args = parse_args()
    final_root = args.output_root.resolve()
    require(not final_root.exists(), f"refusing to overwrite output: {final_root}")
    final_root.parent.mkdir(parents=True, exist_ok=True)
    staging_root = Path(
        tempfile.mkdtemp(prefix=f".{final_root.name}.staging-", dir=final_root.parent)
    )
    try:
        result = build_release(args, staging_root)
        require(not final_root.exists(), f"refusing to overwrite output: {final_root}")
        os.rename(staging_root, final_root)
    except BaseException:
        if staging_root.exists():
            shutil.rmtree(staging_root)
        raise
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
