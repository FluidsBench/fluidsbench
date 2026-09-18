#!/usr/bin/env python3
"""Check website ground truth against the fluidsbench-submission contract."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
import math
import struct
import sys
import zipfile
from pathlib import Path
from typing import Any

from export_windsorml_native_profile_truth import bundle_errors as windsorml_native_bundle_errors


ROOT = Path(__file__).resolve().parents[1]
GROUND_TRUTH_ROOT = ROOT / "assets" / "data" / "profile-ground-truth"
PUBLIC_TOP_LEVEL_SCHEMA_ROOT = ROOT / "schemas"
TOP_LEVEL_SCHEMA_NAMES = ("methodology-contract-v1.schema.json",)
PUBLIC_SCHEMA_ROOT = ROOT / "schemas" / "v2"
V2_SCHEMA_NAMES = (
    "submission.schema.json",
    "evaluation-evidence.schema.json",
    "maintainer-validation.schema.json",
)
PUBLIC_V3_SCHEMA_ROOT = ROOT / "schemas" / "v3"
V3_SCHEMA_NAMES = (
    "submission.schema.json",
    "evaluation-evidence.schema.json",
    "discretization.schema.json",
    "discretization-case.schema.json",
    "case-metrics.schema.json",
    "maintainer-validation.schema.json",
    "prediction-artifact.schema.json",
    "prediction-artifact-checks.schema.json",
)
PUBLIC_SCORING_SUPPORT_SCHEMA_ROOT = ROOT / "schemas" / "scoring-support" / "v1"
SCORING_SUPPORT_SCHEMA_NAMES = (
    "manifest.schema.json",
    "case-index.schema.json",
    "case-chunk.schema.json",
)
PUBLIC_RELEASE_SCHEMA_ROOT = ROOT / "schemas" / "releases"
RELEASE_SCHEMA_NAMES = (
    "claim-index.schema.json",
    "revision-history.schema.json",
    "result-claim.schema.json",
)
COMPLETE_COVERAGE = "complete_split"
REPRESENTATIVE_COVERAGE = "representative_subset"
HILIFT_COMPACT_TRUTH_INDEX_SCHEMA = (
    "fluidsbench-hiliftaeroml-compact-profile-truth-index-v1"
)
HILIFT_COMPACT_TRUTH_MASTER_INDEX_SCHEMA = (
    "fluidsbench-hiliftaeroml-compact-profile-truth-master-index-v1"
)
HILIFT_COMPACT_TRUTH_CHUNK_SCHEMA = (
    "fluidsbench-hiliftaeroml-compact-profile-truth-chunk-v1"
)
HILIFT_COMPACT_TRUTH_FORMAT = (
    "fluidsbench-hiliftaeroml-compact-profile-truth-v1"
)
HILIFT_COMPACT_TRUTH_RELEASE_ID = (
    "hiliftaeroml-compact-profile-truth-all1355-v1"
)
HILIFT_COMPACT_TRUTH_CASE_COUNT = 1355
HILIFT_COMPACT_TRUTH_CASE_SET_COUNT = 8
HILIFT_COMPACT_PROFILE_CONTRACT_ID = (
    "hiliftaeroml-compact-profile-predictions-v2-candidate"
)
HILIFT_COMPACT_PROFILE_CONTRACT_SHA256 = (
    "b1fd29b2cb6c1c84c694ddffc5d85f6cd68fd175b79c3695a443aa78bf962c2f"
)
HILIFT_COMPACT_CASE_SET_ID = "caseset-ac791749e527"
HILIFT_NATIVE_TRUTH_RELEASE_ID = "hiliftaeroml-native-profile-truth-v1-candidate"
HILIFT_NATIVE_TRUTH_MANIFEST_SHA256 = (
    "3e20b857e12055e16f1d248d125b8df62a3669c604411dc67322fe98d9ab4477"
)
HILIFT_PREREQUISITE_AUTHORITY_INDEX_SHA256 = (
    "991988cba62214ee85e7066f53a8bc82f639baa76b92f07b4e375e0364986ea4"
)
HILIFT_COMPACT_PREDICTION_FORMAT = (
    "fluidsbench-hiliftaeroml-compact-profile-chunks-v2-candidate"
)
HILIFT_COMPACT_PREVIEW_SUBMISSION_ID = (
    "hiliftaeroml-transolver-full360-candidate-v1"
)
AHMEDML_NATIVE_TRUTH_MASTER_SCHEMA = (
    "fluidsbench-ahmedml-native-profile-truth-master-index-v1"
)
AHMEDML_NATIVE_TRUTH_INDEX_SCHEMA = (
    "fluidsbench-ahmedml-native-profile-truth-index-v1"
)
AHMEDML_NATIVE_TRUTH_CHUNK_SCHEMA = (
    "fluidsbench-ahmedml-native-profile-truth-chunk-v1"
)
AHMEDML_NATIVE_TRUTH_RELEASE_ID = (
    "ahmedml-native-profile-truth-all316-v1-candidate"
)
AHMEDML_NATIVE_TRUTH_DATASET_REVISION = (
    "02688c727cdb8dc8678e28abc6bbbb7e93c5fa15"
)
AHMEDML_NATIVE_TRUTH_SOURCE_IDENTITY_SHA256 = (
    "56a620a5b335cef6cb0587e186df321eb907bbe46e8b81aa4de302b8fe73cf44"
)
AHMEDML_NATIVE_TRUTH_PROFILE_DEFINITION_SHA256 = (
    "1048a0380f70de778e3e51db07d6910579f720d6f2dd1d9ad7179dbfe88d1cae"
)
AHMEDML_NATIVE_TRUTH_SOURCE = {
    "source_kind": "native_cfd",
    "analytical_dummy": False,
    "native_quantity_source": (
        "pinned_ahmedml_cell_data_via_frozen_evaluator_mapping"
    ),
}
AHMEDML_NATIVE_TRUTH_CASE_COUNT = 316
AHMEDML_NATIVE_TRUTH_CASE_SET_COUNT = 5
AHMEDML_NATIVE_TRUTH_SERIES_PER_CASE = 7
AHMEDML_NATIVE_TRUTH_SAMPLES_PER_SERIES = 128
AHMEDML_NATIVE_TRUTH_SERIES = (
    ("pressure_profiles", "upper_body_centerline", "cp", "x_over_l", 0.0, 1.0),
    ("pressure_profiles", "underbody_centerline", "cp", "x_over_l", 0.0, 1.0),
    ("pressure_profiles", "rear_slant_centerline", "cp", "s_over_slant", 0.0, 1.0),
    ("velocity_profiles", "wake_vertical_x_0p25_l", "ux_over_uinf", "z_over_h", 0.0, 2.0),
    ("velocity_profiles", "wake_vertical_x_0p50_l", "ux_over_uinf", "z_over_h", 0.0, 2.0),
    ("velocity_profiles", "wake_vertical_x_1p00_l", "ux_over_uinf", "z_over_h", 0.0, 2.0),
    (
        "velocity_profiles",
        "wake_lateral_x_0p50_l_z_0p50_h",
        "ux_over_uinf",
        "y_over_w",
        -1.0,
        1.0,
    ),
)
NATIVE_DRIVAERML_INDEX_SCHEMA = "fluidsbench-drivaerml-native-profile-truth-index-v2"
NATIVE_DRIVAERML_SPLIT_SCHEMA = (
    "fluidsbench-drivaerml-native-profile-truth-split-index-v2"
)
NATIVE_DRIVAERML_CHUNK_SCHEMA = (
    "fluidsbench-drivaerml-native-profile-truth-chunk-v2"
)
NATIVE_DRIVAERML_CASE_SCHEMA = (
    "fluidsbench-drivaerml-native-profile-truth-case-v2"
)
NATIVE_DRIVAERML_PROVENANCE_SCHEMA = (
    "fluidsbench-drivaerml-native-profile-truth-provenance-v2"
)
NATIVE_DRIVAERML_RELEASE_SCHEMA = (
    "fluidsbench-drivaerml-native-profile-truth-release-v2"
)
NATIVE_DRIVAERML_CONTRACTS = {
    "2.0": {
        "index": NATIVE_DRIVAERML_INDEX_SCHEMA,
        "split": NATIVE_DRIVAERML_SPLIT_SCHEMA,
        "chunk": NATIVE_DRIVAERML_CHUNK_SCHEMA,
        "case": NATIVE_DRIVAERML_CASE_SCHEMA,
        "provenance": NATIVE_DRIVAERML_PROVENANCE_SCHEMA,
        "release": NATIVE_DRIVAERML_RELEASE_SCHEMA,
    },
    "3.0": {
        "index": "fluidsbench-drivaerml-native-profile-truth-index-v3",
        "split": "fluidsbench-drivaerml-native-profile-truth-split-index-v3",
        "chunk": "fluidsbench-drivaerml-native-profile-truth-chunk-v3",
        "case": "fluidsbench-drivaerml-native-profile-truth-case-v3",
        "provenance": "fluidsbench-drivaerml-native-profile-truth-provenance-v3",
        "release": "fluidsbench-drivaerml-native-profile-truth-release-v3",
    },
}
NATIVE_DRIVAERML_DATASET_REVISION = "7a5c0948ce27be709b1116a3a190f806e7a8f79f"
COORDINATE_IDENTITY_DOMAIN = b"fluidsbench-drivaerml-coordinate-array-v1\x00"
VALUE_IDENTITY_DOMAIN = b"fluidsbench-drivaerml-native-value-array-v1\x00"
ID_ARRAY_IDENTITY_DOMAIN = b"fluidsbench-drivaerml-native-id-array-v1\x00"
NATIVE_SERIES_IDENTITY_SCHEMA = "fluidsbench-drivaerml-native-series-identity-v1"
NATIVE_SERIES_IDENTITY_SCHEMA_V2 = "fluidsbench-drivaerml-native-series-identity-v2"
NATIVE_CP_DISPLAY_FIELDS = {
    "display_coordinate_id",
    "display_coordinate_unit",
    "display_coordinate_identity_sha256",
    "display_coordinate",
}
NATIVE_CP_DISPLAY_COORDINATE_ID = "streamwise_x_m"
NATIVE_CP_DISPLAY_COORDINATE_UNIT = "m"
NATIVE_CP_DISPLAY_COORDINATE_DEFINITION = (
    "retained_plane_intersection_segment_endpoint_midpoint_x"
)
NATIVE_TRUTH_SOURCE = {
    "source_kind": "native_cfd",
    "analytical_dummy": False,
    "native_quantity_source": "pinned_drivaerml_cell_data",
}
DRIVAERML_CONSTANT_VELOCITY_STATIONS = tuple(
    f"autocfd5_{prefix}{index}"
    for prefix, count in (("v", 6), ("u", 6), ("l", 1), ("r", 3))
    for index in range(1, count + 1)
)
DRIVAERML_RELATIVE_VELOCITY_STATIONS = tuple(
    f"{prefix.upper()}{index}"
    for prefix, count in (("v", 6), ("u", 6), ("l", 1), ("r", 3))
    for index in range(1, count + 1)
)
DRIVAERML_CONSTANT_CP_STATIONS = (
    "upperbody_centerline",
    "underbody_centerline",
    "sidewall_z_0_15",
    "front_left_wheelhouse_y_neg_0_6",
)
DRIVAERML_RELATIVE_CP_STATIONS = (
    "upperbody_centerline",
    "underbody_centerline",
    "sidewall_front_wheelhouse_relative",
    "front_left_wheelhouse_relative",
)
DRIVAERML_RELATIVE_CP_ALIASES = {
    "upperbody_centerline": ("drivaerml_cp_constant_v1", "upperbody_centerline"),
    "underbody_centerline": ("drivaerml_cp_constant_v1", "underbody_centerline"),
}
DRIVAERML_SHARED_CP_SUPPORT_IDS = {
    "upperbody_centerline": "drivaerml-cp-upperbody-centerline-y0-v1",
    "underbody_centerline": "drivaerml-cp-underbody-centerline-y0-v1",
}
DRIVAERML_EXPECTED_ALL484_COVERAGE = {
    "drivaerml-autocfd5-constant-v1": {
        "materialized_series_count": 484 * 16,
        "shared_alias_series_count": 0,
        "sample_count": 1_766_227,
        "unsupported_sample_count": 51_677,
    },
    "drivaerml-velocity-relative-v3": {
        "materialized_series_count": 484 * 16,
        "shared_alias_series_count": 0,
        "sample_count": 1_779_592,
        "unsupported_sample_count": 38_312,
    },
    "drivaerml_cp_constant_v1": {
        "materialized_series_count": 484 * 4,
        "shared_alias_series_count": 0,
        "sample_count": 2_768_745,
        "unsupported_sample_count": 0,
    },
    "drivaerml_cp_relative_v1": {
        "materialized_series_count": 484 * 2,
        "shared_alias_series_count": 484 * 2,
        "sample_count": 739_775,
        "unsupported_sample_count": 0,
    },
}
DRIVAERML_EXPECTED_ALL484_COVERAGE_V3 = {
    family_id: {
        **counts,
        "display_coordinate_sample_count": (
            counts["sample_count"] if family_id.startswith("drivaerml_cp_") else 0
        ),
    }
    for family_id, counts in DRIVAERML_EXPECTED_ALL484_COVERAGE.items()
}
DRIVAERML_NATIVE_TRUTH_DEFINITIONS = {
    "velocity_ratio": "numpy.linalg.norm(Float32 UMeanTrim cast exactly to binary64, axis=-1) / 38.889",
    "cp": "2.0 * binary64(directly selected native boundary Float32 pMeanTrim) / (38.889 * 38.889)",
    "sampling": "zeroth-order native CellData/raw polygon CellData; every boundary file is fully SHA-256 verified against the immutable pin; producer pMeanTrim is exact-cross-checked but is not the published value source; no interpolation, snapping, remeshing, or gap filling",
}
DRIVAERML_NATIVE_TRUTH_DEFINITIONS_V3 = {
    "velocity_ratio": DRIVAERML_NATIVE_TRUTH_DEFINITIONS["velocity_ratio"],
    "cp": DRIVAERML_NATIVE_TRUTH_DEFINITIONS["cp"],
    "cp_display_coordinate": (
        "binary64 midpoint x = 0.5 * (endpoint_start_m[0] + "
        "endpoint_end_m[0]) from each retained producer plane-intersection "
        "segment, in source order and raw VTP metres; display only, with no "
        "shift, normalization, sorting, interpolation, or resampling"
    ),
    "cp_scoring_coordinate": (
        "the unchanged retained arc_length_m array and its existing identity"
    ),
    "sampling": DRIVAERML_NATIVE_TRUTH_DEFINITIONS["sampling"],
}
DRIVAERML_NATIVE_IDENTITY_ENCODINGS = {
    "coordinate": "ASCII domain fluidsbench-drivaerml-coordinate-array-v1 plus NUL, uint64_be count, finite IEEE-754 binary64_be values, signed zero normalized",
    "value": "ASCII domain fluidsbench-drivaerml-native-value-array-v1 plus NUL, uint64_be count, finite IEEE-754 binary64_be values, signed zero normalized",
    "native_id": "ASCII domain fluidsbench-drivaerml-native-id-array-v1 plus NUL, uint64_be count, non-negative uint64_be IDs",
    "series": "SHA-256 of UTF-8 sorted-key compact JSON plus LF over schema fluidsbench-drivaerml-native-series-identity-v1 descriptors, component identities/counts, segments, and unsupported_samples",
}
DRIVAERML_NATIVE_IDENTITY_ENCODINGS_V3 = {
    "coordinate": DRIVAERML_NATIVE_IDENTITY_ENCODINGS["coordinate"],
    "display_coordinate": (
        "the same platform-independent coordinate-array encoding as coordinate; "
        "its SHA-256 is bound into native-series-identity-v2"
    ),
    "value": DRIVAERML_NATIVE_IDENTITY_ENCODINGS["value"],
    "native_id": DRIVAERML_NATIVE_IDENTITY_ENCODINGS["native_id"],
    "series": (
        "SHA-256 of UTF-8 sorted-key compact JSON plus LF; velocity and aliases "
        "retain native-series-identity-v1, while materialized Cp uses "
        "native-series-identity-v2 to additionally bind display coordinate "
        "id, unit, and identity"
    ),
}
NATIVE_CP_CASE_DISPLAY_DECLARATION = {
    "coordinate_id": NATIVE_CP_DISPLAY_COORDINATE_ID,
    "coordinate_unit": NATIVE_CP_DISPLAY_COORDINATE_UNIT,
    "definition": NATIVE_CP_DISPLAY_COORDINATE_DEFINITION,
    "source": "retained_cp_plane_intersection_segment_endpoints",
    "native_coordinate_frame": "raw_vtp_coordinates_metres",
    "transformation": "none_no_shift_normalization_sort_or_resampling",
    "endpoint_geometry_verification": (
        "three_finite_binary64_components_and_replayed_segment_length_all_rows"
    ),
    "purpose": "display_only_arc_length_remains_scoring_coordinate",
}
NATIVE_CP_INDEX_DISPLAY_DECLARATION = {
    "coordinate_id": NATIVE_CP_DISPLAY_COORDINATE_ID,
    "coordinate_unit": NATIVE_CP_DISPLAY_COORDINATE_UNIT,
    "definition": NATIVE_CP_DISPLAY_COORDINATE_DEFINITION,
    "default_website_axis": True,
    "display_only": True,
    "scoring_coordinate_unchanged": "arc_length_m",
}


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def finite_numbers(values: Any) -> bool:
    return isinstance(values, list) and all(
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
        for value in values
    )


def valid_sha256(value: Any) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 64
        and value != "0" * 64
        and all(character in "0123456789abcdef" for character in value)
    )


def valid_git_commit(value: Any) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 40
        and value != "0" * 40
        and all(character in "0123456789abcdef" for character in value)
    )


def coordinate_identity_sha256(values: Any) -> str:
    if not finite_numbers(values):
        raise ValueError("coordinate array must contain only finite numbers")
    encoded = bytearray(COORDINATE_IDENTITY_DOMAIN)
    encoded.extend(struct.pack(">Q", len(values)))
    for raw_value in values:
        value = float(raw_value)
        if value == 0.0:
            value = 0.0
        encoded.extend(struct.pack(">d", value))
    return hashlib.sha256(encoded).hexdigest()


def value_identity_sha256(values: Any) -> str:
    if not finite_numbers(values):
        raise ValueError("value array must contain only finite numbers")
    encoded = bytearray(VALUE_IDENTITY_DOMAIN)
    encoded.extend(struct.pack(">Q", len(values)))
    for raw_value in values:
        value = float(raw_value)
        if value == 0.0:
            value = 0.0
        encoded.extend(struct.pack(">d", value))
    return hashlib.sha256(encoded).hexdigest()


def id_array_identity_sha256(values: Any) -> str:
    if not _nonnegative_integers(values):
        raise ValueError("ID array must contain only non-negative integers")
    encoded = bytearray(ID_ARRAY_IDENTITY_DOMAIN)
    encoded.extend(struct.pack(">Q", len(values)))
    for value in values:
        if value > (1 << 64) - 1:
            raise ValueError("ID cannot be represented as uint64")
        encoded.extend(struct.pack(">Q", value))
    return hashlib.sha256(encoded).hexdigest()


def canonical_json_bytes(value: Any) -> bytes:
    return (
        json.dumps(
            value,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
            allow_nan=False,
        )
        + "\n"
    ).encode("utf-8")


def canonical_json_identity_sha256(value: Any) -> str:
    return hashlib.sha256(canonical_json_bytes(value)).hexdigest()


def identity_bound_document_errors(
    document: Any, identity_field: str, label: str
) -> list[str]:
    if not isinstance(document, dict):
        return [f"{label}: identity-bound document is not an object"]
    identity = document.get(identity_field)
    expected_scope = f"canonical_json_body_without_{identity_field}"
    if not isinstance(identity, dict) or identity != {
        "algorithm": "sha256",
        "scope": expected_scope,
        "sha256": identity.get("sha256") if isinstance(identity, dict) else None,
    }:
        return [f"{label}: {identity_field} declaration is not exact"]
    if not valid_sha256(identity.get("sha256")):
        return [f"{label}: {identity_field} has an invalid SHA-256"]
    body = dict(document)
    body.pop(identity_field, None)
    try:
        actual_identity = canonical_json_identity_sha256(body)
    except (TypeError, ValueError):
        return [
            f"{label}: {identity_field} body is not finite canonical JSON"
        ]
    if actual_identity != identity["sha256"]:
        return [f"{label}: {identity_field} does not bind the canonical document body"]
    return []


def drivaerml_native_contract_version(document: Any, kind: str) -> str | None:
    """Return the one coherently matched native contract version, if any."""

    if not isinstance(document, dict):
        return None
    version = document.get("schema_version")
    contract = NATIVE_DRIVAERML_CONTRACTS.get(version)
    if contract is None or kind not in contract:
        return None
    return version if document.get("schema") == contract[kind] else None


def native_series_identity_projection(
    series: dict[str, Any], version: str = "2.0"
) -> dict[str, Any]:
    projection = {
        "schema": NATIVE_SERIES_IDENTITY_SCHEMA,
        "panel_id": series.get("panel_id"),
        "family_id": series.get("family_id"),
        "placement_mode": series.get("placement_mode"),
        "station_id": series.get("station_id"),
        "quantity_id": series.get("quantity_id"),
        "quantity": series.get("quantity"),
        "units": series.get("units"),
        "scoring_role": series.get("scoring_role"),
        "representation": series.get("representation"),
        "placement_receipt_identity_sha256": series.get(
            "placement_receipt_identity_sha256"
        ),
    }
    if series.get("representation") == "shared_alias":
        projection["shared_support_ref"] = series.get("shared_support_ref")
        return projection
    projection.update(
        {
            "support_identity_sha256": series.get("support_identity_sha256"),
            "coordinate_id": series.get("coordinate_id"),
            "coordinate_unit": series.get("coordinate_unit"),
            "sample_count": len(series.get("coordinate", [])),
            "sample_index_identity_sha256": id_array_identity_sha256(
                series.get("sample_index", [])
            ),
            "raw_native_cell_id_identity_sha256": id_array_identity_sha256(
                series.get("raw_native_cell_id", [])
            ),
            "coordinate_identity_sha256": series.get(
                "coordinate_identity_sha256"
            ),
            "value_identity_sha256": series.get("value_identity_sha256"),
            "segments": series.get("segments"),
            "unsupported_samples": series.get("unsupported_samples"),
        }
    )
    native_v3_materialized_cp = (
        version == "3.0"
        and series.get("representation") == "materialized"
        and series.get("panel_id") == "pressure_profiles"
        and series.get("quantity_id") == "cp"
    )
    if native_v3_materialized_cp:
        projection["schema"] = NATIVE_SERIES_IDENTITY_SCHEMA_V2
        projection.update(
            {
                "display_coordinate_id": series.get("display_coordinate_id"),
                "display_coordinate_unit": series.get("display_coordinate_unit"),
                "display_coordinate_identity_sha256": series.get(
                    "display_coordinate_identity_sha256"
                ),
            }
        )
    return projection


def drivaerml_native_expected_series() -> dict[
    tuple[str, str, str, str, str], str
]:
    expected: dict[tuple[str, str, str, str, str], str] = {}
    for station_id in DRIVAERML_CONSTANT_VELOCITY_STATIONS:
        expected[
            (
                "velocity_profiles",
                "drivaerml-autocfd5-constant-v1",
                "constant",
                station_id,
                "velocity_ratio",
            )
        ] = "materialized"
    for station_id in DRIVAERML_RELATIVE_VELOCITY_STATIONS:
        expected[
            (
                "velocity_profiles",
                "drivaerml-velocity-relative-v3",
                "relative",
                station_id,
                "velocity_ratio",
            )
        ] = "materialized"
    for station_id in DRIVAERML_CONSTANT_CP_STATIONS:
        expected[
            (
                "pressure_profiles",
                "drivaerml_cp_constant_v1",
                "constant",
                station_id,
                "cp",
            )
        ] = "materialized"
    for station_id in DRIVAERML_RELATIVE_CP_STATIONS:
        expected[
            (
                "pressure_profiles",
                "drivaerml_cp_relative_v1",
                "relative",
                station_id,
                "cp",
            )
        ] = "shared_alias" if station_id in DRIVAERML_RELATIVE_CP_ALIASES else "materialized"
    return expected


def _native_expected_coverage(version: str) -> dict[str, dict[str, int]]:
    return (
        DRIVAERML_EXPECTED_ALL484_COVERAGE_V3
        if version == "3.0"
        else DRIVAERML_EXPECTED_ALL484_COVERAGE
    )


def _native_coverage_accumulator(
    version: str = "2.0",
) -> dict[str, dict[str, int]]:
    display_fields = (
        {"display_coordinate_sample_count": 0} if version == "3.0" else {}
    )
    return {
        family_id: {
            "materialized_series_count": 0,
            "shared_alias_series_count": 0,
            "sample_count": 0,
            "unsupported_sample_count": 0,
            "segment_count": 0,
            **display_fields,
        }
        for family_id in _native_expected_coverage(version)
    }


def _accumulate_native_coverage(
    accumulator: dict[str, dict[str, int]],
    case: dict[str, Any],
    version: str = "2.0",
) -> None:
    for series in case.get("series", []):
        if not isinstance(series, dict) or series.get("family_id") not in accumulator:
            continue
        family = accumulator[series["family_id"]]
        if series.get("representation") == "shared_alias":
            family["shared_alias_series_count"] += 1
        elif series.get("representation") == "materialized":
            family["materialized_series_count"] += 1
            family["sample_count"] += len(series.get("sample_index", []))
            family["unsupported_sample_count"] += len(
                series.get("unsupported_samples", [])
            )
            family["segment_count"] += len(series.get("segments", []))
            if version == "3.0":
                display = series.get("display_coordinate")
                if isinstance(display, list):
                    family["display_coordinate_sample_count"] += len(display)


def _finalize_native_coverage(
    accumulator: dict[str, dict[str, int]],
) -> dict[str, Any]:
    for family in accumulator.values():
        family["requested_sample_count"] = (
            family["sample_count"] + family["unsupported_sample_count"]
        )
    total_fields = (
        "materialized_series_count",
        "shared_alias_series_count",
        "sample_count",
        "unsupported_sample_count",
        "requested_sample_count",
        "segment_count",
    )
    if all("display_coordinate_sample_count" in family for family in accumulator.values()):
        total_fields += ("display_coordinate_sample_count",)
    return {
        "derivation": "recomputed_from_all_484_case_series_arrays",
        "producer_expected_counts_verified": True,
        "families": accumulator,
        "totals": {
            field: sum(family[field] for family in accumulator.values())
            for field in total_fields
        },
    }


def _strictly_increasing_integers(values: Any) -> bool:
    return (
        isinstance(values, list)
        and all(
            isinstance(value, int)
            and not isinstance(value, bool)
            and 0 <= value <= (1 << 64) - 1
            for value in values
        )
        and all(right > left for left, right in zip(values, values[1:]))
    )


def _nonnegative_integers(values: Any) -> bool:
    return isinstance(values, list) and all(
        isinstance(value, int)
        and not isinstance(value, bool)
        and 0 <= value <= (1 << 64) - 1
        for value in values
    )


def _native_segment_errors(
    segments: Any,
    sample_index: list[int],
    coordinate: list[float],
    label: str,
) -> list[str]:
    if not isinstance(segments, list) or not segments:
        return [f"{label}: segments must be a nonempty array"]
    errors: list[str] = []
    exact_fields = {
        "segment_id",
        "emitted_index_start",
        "emitted_index_stop",
        "sample_index_start",
        "sample_index_stop",
        "coordinate_start",
        "coordinate_stop",
    }
    expected_emitted_start = 0
    previous_sample_stop: int | None = None
    for segment_ordinal, segment in enumerate(segments):
        segment_label = f"{label}/segments[{segment_ordinal}]"
        if not isinstance(segment, dict) or set(segment) != exact_fields:
            errors.append(
                f"{segment_label}: segment must contain exactly {sorted(exact_fields)}"
            )
            continue
        start = segment.get("emitted_index_start")
        stop = segment.get("emitted_index_stop")
        if (
            not isinstance(segment.get("segment_id"), str)
            or not segment.get("segment_id")
            or not isinstance(start, int)
            or isinstance(start, bool)
            or not isinstance(stop, int)
            or isinstance(stop, bool)
            or start != expected_emitted_start
            or stop <= start
            or stop > len(sample_index)
        ):
            errors.append(
                f"{segment_label}: segment IDs and half-open emitted-index ranges must be contiguous and in bounds"
            )
            continue
        expected_sample_start = sample_index[start]
        expected_sample_stop = sample_index[stop - 1] + 1
        if segment.get("sample_index_start") != expected_sample_start or segment.get(
            "sample_index_stop"
        ) != expected_sample_stop:
            errors.append(
                f"{segment_label}: half-open sample-index range differs from emitted lineage"
            )
        if any(
            right != left + 1
            for left, right in zip(sample_index[start:stop], sample_index[start + 1 : stop])
        ):
            errors.append(
                f"{segment_label}: an unsupported sample gap occurs inside a declared segment"
            )
        if any(
            right <= left
            for left, right in zip(coordinate[start:stop], coordinate[start + 1 : stop])
        ):
            errors.append(
                f"{segment_label}: coordinates are not strictly increasing within the declared segment"
            )
        if previous_sample_stop is not None and expected_sample_start < previous_sample_stop:
            errors.append(f"{segment_label}: sample-index ranges overlap")
        coordinate_endpoints = [
            segment.get("coordinate_start"),
            segment.get("coordinate_stop"),
        ]
        if not finite_numbers(coordinate_endpoints) or coordinate_endpoints != [
            coordinate[start],
            coordinate[stop - 1],
        ]:
            errors.append(
                f"{segment_label}: coordinate endpoints differ from emitted arrays"
            )
        expected_emitted_start = stop
        previous_sample_stop = expected_sample_stop
    if expected_emitted_start != len(sample_index):
        errors.append(f"{label}: segments do not cover every emitted sample exactly once")
    return errors


def _unsupported_sample_errors(
    unsupported: Any,
    sample_index: list[int],
    label: str,
) -> list[str]:
    if not isinstance(unsupported, list):
        return [f"{label}: unsupported_samples must be an array"]
    errors: list[str] = []
    previous = -1
    emitted = set(sample_index)
    for index, item in enumerate(unsupported):
        item_label = f"{label}/unsupported_samples[{index}]"
        if not isinstance(item, dict) or set(item) != {
            "sample_index",
            "coordinate",
            "reason",
        }:
            errors.append(
                f"{item_label}: unsupported sample must contain sample_index, coordinate, and reason"
            )
            continue
        sample = item.get("sample_index")
        if (
            not isinstance(sample, int)
            or isinstance(sample, bool)
            or sample < 0
            or sample <= previous
            or sample in emitted
        ):
            errors.append(
                f"{item_label}: unsupported sample index must be ordered, unique, non-negative, and absent from emitted lineage"
            )
        if not finite_numbers([item.get("coordinate")]):
            errors.append(f"{item_label}: coordinate must be finite")
        if not isinstance(item.get("reason"), str) or not item["reason"]:
            errors.append(f"{item_label}: reason must be a nonempty string")
        if isinstance(sample, int) and not isinstance(sample, bool):
            previous = sample
    return errors


def drivaerml_native_case_series_errors(
    case: Any, label: str, expected_version: str | None = None
) -> list[str]:
    errors: list[str] = []
    if not isinstance(case, dict):
        return [f"{label}: case record is not an object"]
    contract_version = drivaerml_native_contract_version(case, "case")
    claimed_version = case.get("schema_version")
    version = (
        contract_version
        or (claimed_version if claimed_version in NATIVE_DRIVAERML_CONTRACTS else None)
        or expected_version
        or "2.0"
    )
    contract = NATIVE_DRIVAERML_CONTRACTS[version]
    if contract_version is None:
        errors.append(
            f"{label}: native case schema and schema_version do not form a supported coherent pair"
        )
    if expected_version is not None and contract_version != expected_version:
        errors.append(
            f"{label}: native case contract version differs from enclosing native {expected_version} bundle"
        )
    expected_case_fields = {
        "schema",
        "schema_version",
        "dataset_id",
        "dataset_revision",
        "case_id",
        "series_count",
        "truth_source",
        "relative_scoring_activated",
        "native_volume",
        "native_boundary",
        "input_bindings",
        "generator",
        "series",
        "case_identity",
    }
    if version == "3.0":
        expected_case_fields.add("cp_display_coordinate")
    if set(case) != expected_case_fields:
        errors.append(
            f"{label}: native case fields differ from schema {version}; expected exactly {sorted(expected_case_fields)}"
        )
    if (
        case.get("schema") != contract["case"]
        or case.get("schema_version") != version
        or case.get("dataset_id") != "drivaerml"
        or case.get("dataset_revision") != NATIVE_DRIVAERML_DATASET_REVISION
        or case.get("series_count") != 40
        or case.get("truth_source") != NATIVE_TRUTH_SOURCE
        or case.get("relative_scoring_activated") is not False
    ):
        errors.append(f"{label}: native case contract binding is stale or incomplete")
    errors.extend(identity_bound_document_errors(case, "case_identity", label))
    if not isinstance(case.get("input_bindings"), dict) or set(
        case.get("input_bindings", {})
    ) != {"constant_velocity", "relative_velocity", "cp"}:
        errors.append(f"{label}: case input_bindings differ from the three verified producer families")
    generator = case.get("generator")
    exporter_source = generator.get("exporter_source", {}) if isinstance(
        generator, dict
    ) else {}
    if (
        not isinstance(generator, dict)
        or set(generator) != {"evaluator_git_revision", "exporter_source"}
        or not valid_git_commit(generator.get("evaluator_git_revision"))
        or not isinstance(exporter_source, dict)
        or set(exporter_source) != {"path", "sha256", "size_bytes"}
        or exporter_source.get("path")
        != "scripts/export_drivaerml_native_profile_truth.py"
        or not valid_sha256(exporter_source.get("sha256"))
        or not isinstance(exporter_source.get("size_bytes"), int)
        or exporter_source.get("size_bytes", 0) <= 0
    ):
        errors.append(f"{label}: generator does not bind an evaluator revision and exporter source")
    series_records = case.get("series")
    if not isinstance(series_records, list):
        return [f"{label}: series must be an array"]
    expected = drivaerml_native_expected_series()
    provided: dict[tuple[str, str, str, str, str], dict[str, Any]] = {}
    forbidden_alias_arrays = {
        "sample_index",
        "raw_native_cell_id",
        "coordinate",
        "value",
        "prediction",
        "segments",
        "unsupported_samples",
        "coordinate_identity_sha256",
        "value_identity_sha256",
        *NATIVE_CP_DISPLAY_FIELDS,
    }
    for index, series in enumerate(series_records):
        series_label = f"{label}/series[{index}]"
        if not isinstance(series, dict):
            errors.append(f"{series_label}: series is not an object")
            continue
        key = (
            series.get("panel_id"),
            series.get("family_id"),
            series.get("placement_mode"),
            series.get("station_id"),
            series.get("quantity_id"),
        )
        if key in provided:
            errors.append(f"{series_label}: duplicate native profile series {key}")
            continue
        provided[key] = series
        expected_representation = expected.get(key)
        if expected_representation is None:
            errors.append(f"{series_label}: unexpected native profile series {key}")
            continue
        if series.get("representation") != expected_representation:
            errors.append(
                f"{series_label}: expected representation {expected_representation!r}"
            )
        common_fields = {
            "panel_id",
            "family_id",
            "placement_mode",
            "station_id",
            "quantity_id",
            "quantity",
            "units",
            "scoring_role",
            "representation",
            "placement_receipt_identity_sha256",
            "series_identity_sha256",
        }
        expected_fields = (
            common_fields | {"shared_support_ref"}
            if expected_representation == "shared_alias"
            else common_fields
            | {
                "coordinate_id",
                "coordinate_unit",
                "support_identity_sha256",
                "coordinate_identity_sha256",
                "value_identity_sha256",
                "sample_index",
                "raw_native_cell_id",
                "coordinate",
                "value",
                "segments",
                "unsupported_samples",
            }
        )
        materialized_cp = (
            expected_representation == "materialized"
            and series.get("panel_id") == "pressure_profiles"
            and series.get("quantity_id") == "cp"
        )
        if version == "3.0" and materialized_cp:
            expected_fields |= NATIVE_CP_DISPLAY_FIELDS
        if set(series) != expected_fields:
            errors.append(
                f"{series_label}: {expected_representation} series fields differ; expected exactly {sorted(expected_fields)}"
            )
        for descriptor in ("quantity", "units", "scoring_role"):
            if not isinstance(series.get(descriptor), str) or not series[descriptor]:
                errors.append(f"{series_label}: missing {descriptor}")
        relative_family = series.get("family_id") in {
            "drivaerml-velocity-relative-v3",
            "drivaerml_cp_relative_v1",
        }
        velocity_family = series.get("panel_id") == "velocity_profiles"
        expected_descriptors = {
            "quantity": (
                "velocity_magnitude_ratio"
                if velocity_family
                else "pressure_coefficient"
            ),
            "units": "1",
            "scoring_role": (
                "report_only" if relative_family else "inherits_parent_candidate"
            ),
        }
        for descriptor, expected_value in expected_descriptors.items():
            if series.get(descriptor) != expected_value:
                errors.append(
                    f"{series_label}: {descriptor} differs from the closed family contract"
                )
        for identity_field in ("placement_receipt_identity_sha256",):
            if not valid_sha256(series.get(identity_field)):
                errors.append(f"{series_label}: invalid {identity_field}")
        if expected_representation == "shared_alias":
            if NATIVE_CP_DISPLAY_FIELDS.intersection(series):
                errors.append(
                    f"{series_label}: shared alias must not declare display-coordinate fields"
                )
            present_arrays = sorted(forbidden_alias_arrays.intersection(series))
            if present_arrays:
                errors.append(
                    f"{series_label}: shared alias must not materialize {present_arrays}"
                )
            reference = series.get("shared_support_ref")
            expected_reference = DRIVAERML_RELATIVE_CP_ALIASES.get(
                str(series.get("station_id"))
            )
            if not isinstance(reference, dict):
                errors.append(f"{series_label}: missing shared_support_ref")
            elif set(reference) != {
                "canonical_family_id",
                "canonical_station_id",
                "canonical_support_identity_sha256",
                "shared_support_id",
            } or (
                reference.get("canonical_family_id"),
                reference.get("canonical_station_id"),
            ) != expected_reference:
                errors.append(
                    f"{series_label}: shared_support_ref differs from the exact canonical constant support"
                )
            elif not valid_sha256(
                reference.get("canonical_support_identity_sha256")
            ) or reference.get("shared_support_id") != DRIVAERML_SHARED_CP_SUPPORT_IDS.get(
                series.get("station_id")
            ):
                errors.append(
                    f"{series_label}: shared_support_ref identities are invalid"
                )
            if not valid_sha256(series.get("series_identity_sha256")):
                errors.append(f"{series_label}: invalid series_identity_sha256")
            elif series.get(
                "series_identity_sha256"
            ) != canonical_json_identity_sha256(
                native_series_identity_projection(series)
            ):
                errors.append(
                    f"{series_label}: series_identity_sha256 does not bind the exact alias projection"
                )
            continue

        for descriptor in ("coordinate_id", "coordinate_unit"):
            if not isinstance(series.get(descriptor), str) or not series[descriptor]:
                errors.append(f"{series_label}: missing {descriptor}")
        expected_coordinate = (
            ("distance_m", "m")
            if series.get("family_id") == "drivaerml-autocfd5-constant-v1"
            else ("normalized_arc_length", "1")
            if series.get("family_id") == "drivaerml-velocity-relative-v3"
            else ("arc_length_m", "m")
        )
        if (
            series.get("coordinate_id"),
            series.get("coordinate_unit"),
        ) != expected_coordinate:
            errors.append(
                f"{series_label}: coordinate ID/unit differ from the closed family contract"
            )
        coordinate = series.get("coordinate")
        values = series.get("value")
        sample_index = series.get("sample_index")
        native_cell_ids = series.get("raw_native_cell_id")
        present_display_fields = NATIVE_CP_DISPLAY_FIELDS.intersection(series)
        display_coordinate = series.get("display_coordinate")
        if version == "3.0" and materialized_cp:
            if present_display_fields != NATIVE_CP_DISPLAY_FIELDS:
                errors.append(
                    f"{series_label}: native-v3 materialized Cp requires the exact display-coordinate fields"
                )
            if (
                series.get("display_coordinate_id")
                != NATIVE_CP_DISPLAY_COORDINATE_ID
                or series.get("display_coordinate_unit")
                != NATIVE_CP_DISPLAY_COORDINATE_UNIT
            ):
                errors.append(
                    f"{series_label}: display-coordinate ID/unit differ from the native-v3 Cp contract"
                )
            if not finite_numbers(display_coordinate) or not display_coordinate:
                errors.append(
                    f"{series_label}: display_coordinate must be nonempty and contain only finite values"
                )
            elif not isinstance(coordinate, list) or len(display_coordinate) != len(
                coordinate
            ):
                errors.append(
                    f"{series_label}: display_coordinate is not aligned with the retained scoring coordinate"
                )
            if not valid_sha256(
                series.get("display_coordinate_identity_sha256")
            ):
                errors.append(
                    f"{series_label}: invalid display_coordinate_identity_sha256"
                )
            elif finite_numbers(display_coordinate) and series.get(
                "display_coordinate_identity_sha256"
            ) != coordinate_identity_sha256(display_coordinate):
                errors.append(
                    f"{series_label}: display_coordinate_identity_sha256 does not bind the ordered display-coordinate array"
                )
        elif present_display_fields:
            errors.append(
                f"{series_label}: display-coordinate fields are forbidden on native-v{version[0]} velocity or non-v3 series"
            )
        if not finite_numbers(coordinate) or not finite_numbers(values):
            errors.append(f"{series_label}: coordinate/value arrays are not finite")
            continue
        lengths = {
            len(coordinate),
            len(values),
            len(sample_index) if isinstance(sample_index, list) else -1,
            len(native_cell_ids) if isinstance(native_cell_ids, list) else -2,
        }
        if len(lengths) != 1 or not coordinate:
            errors.append(
                f"{series_label}: coordinate, value, sample_index, and raw_native_cell_id must be nonempty and aligned"
            )
        if not _strictly_increasing_integers(sample_index):
            errors.append(
                f"{series_label}: sample_index is not strictly increasing non-negative integer lineage"
            )
        if not _nonnegative_integers(native_cell_ids):
            errors.append(f"{series_label}: raw_native_cell_id is invalid")
        segments = series.get("segments")
        unsupported = series.get("unsupported_samples")
        if isinstance(sample_index, list) and isinstance(coordinate, list):
            errors.extend(
                _native_segment_errors(
                    segments, sample_index, coordinate, series_label
                )
            )
            errors.extend(
                _unsupported_sample_errors(unsupported, sample_index, series_label)
            )
        for identity_field in (
            "support_identity_sha256",
            "coordinate_identity_sha256",
            "value_identity_sha256",
            "series_identity_sha256",
        ):
            if not valid_sha256(series.get(identity_field)):
                errors.append(f"{series_label}: invalid {identity_field}")
        if finite_numbers(coordinate) and series.get(
            "coordinate_identity_sha256"
        ) != coordinate_identity_sha256(coordinate):
            errors.append(
                f"{series_label}: coordinate_identity_sha256 does not bind the ordered coordinate array"
            )
        if finite_numbers(values) and series.get(
            "value_identity_sha256"
        ) != value_identity_sha256(values):
            errors.append(
                f"{series_label}: value_identity_sha256 does not bind the ordered value array"
            )
        if (
            valid_sha256(series.get("series_identity_sha256"))
            and _strictly_increasing_integers(sample_index)
            and _nonnegative_integers(native_cell_ids)
            and series.get("series_identity_sha256")
            != canonical_json_identity_sha256(
                native_series_identity_projection(series, version)
            )
        ):
            errors.append(
                f"{series_label}: series_identity_sha256 does not bind the exact materialized projection"
            )

    if version == "3.0":
        materialized_cp_row_count = sum(
            len(series.get("coordinate", []))
            for series in series_records
            if isinstance(series, dict)
            and series.get("representation") == "materialized"
            and series.get("panel_id") == "pressure_profiles"
            and series.get("quantity_id") == "cp"
            and isinstance(series.get("coordinate"), list)
        )
        expected_display_declaration = {
            **NATIVE_CP_CASE_DISPLAY_DECLARATION,
            "materialized_row_count": materialized_cp_row_count,
        }
        if case.get("cp_display_coordinate") != expected_display_declaration:
            errors.append(
                f"{label}: cp_display_coordinate does not exactly declare the native-v3 materialized Cp display contract and row count"
            )
        native_boundary = case.get("native_boundary")
        if (
            not isinstance(native_boundary, dict)
            or native_boundary.get("referenced_producer_row_count")
            != materialized_cp_row_count
        ):
            errors.append(
                f"{label}: native-v3 Cp display row count differs from native_boundary referenced producer rows"
            )

    missing = set(expected) - set(provided)
    if missing:
        errors.append(f"{label}: missing native profile series {sorted(missing)}")
    if len(series_records) != 40:
        errors.append(f"{label}: expected exactly 40 native profile series")
    if list(provided) != list(expected):
        errors.append(f"{label}: native profile series order differs from the closed 40-series contract")

    for station_id, (canonical_family, canonical_station) in (
        DRIVAERML_RELATIVE_CP_ALIASES.items()
    ):
        alias_key = (
            "pressure_profiles",
            "drivaerml_cp_relative_v1",
            "relative",
            station_id,
            "cp",
        )
        canonical_key = (
            "pressure_profiles",
            canonical_family,
            "constant",
            canonical_station,
            "cp",
        )
        alias = provided.get(alias_key)
        canonical = provided.get(canonical_key)
        if alias and canonical and alias.get("shared_support_ref", {}).get(
            "canonical_support_identity_sha256"
        ) != canonical.get("support_identity_sha256"):
            errors.append(
                f"{label}/{station_id}: shared alias reference does not bind canonical support identity"
            )
    return errors


def _safe_profile_path(root: Path, base: Path, declared_path: Any) -> Path | None:
    if not isinstance(declared_path, str) or not declared_path or Path(
        declared_path
    ).is_absolute():
        return None
    candidate = (base / declared_path).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return None
    return candidate


def _file_binding_errors(
    path: Path | None,
    declared_sha256: Any,
    declared_size: Any,
    label: str,
) -> list[str]:
    errors: list[str] = []
    if path is None or not path.is_file():
        return [f"{label}: bound file is missing or outside profile-ground-truth"]
    if not valid_sha256(declared_sha256) or sha256_file(path) != declared_sha256:
        errors.append(f"{label}: SHA-256 binding mismatch")
    if declared_size is not None and declared_size != path.stat().st_size:
        errors.append(f"{label}: size_bytes binding mismatch")
    return errors


def drivaerml_native_volume_audit_errors(
    case: dict[str, Any],
    native_pin_case: dict[str, Any],
    label: str,
) -> list[str]:
    errors: list[str] = []
    audit = case.get("native_volume")
    if not isinstance(audit, dict):
        return [f"{label}: missing native_volume"]
    required_fields = {
        "logical_path",
        "logical_size_bytes",
        "pre_post_source_stat_unchanged",
        "source_parts",
        "field_name",
        "association",
        "vtk_type",
        "number_of_components",
        "tuple_count",
        "declared_payload_bytes",
        "retained_full_payload_sha256",
        "full_payload_verification",
        "selected_unique_raw_cell_id_count",
        "selected_values_sha256",
    }
    if set(audit) != required_fields:
        errors.append(
            f"{label}: native_volume must contain exactly {sorted(required_fields)}"
        )
    pinned_volume = native_pin_case.get("volume", {})
    pinned_parts = pinned_volume.get("parts", [])
    expected_logical_path = pinned_volume.get("logical_path_after_assembly")
    expected_logical_size = pinned_volume.get("total_size_bytes")
    if audit.get("logical_path") != expected_logical_path or audit.get(
        "logical_size_bytes"
    ) != expected_logical_size:
        errors.append(f"{label}: logical native volume differs from the source pin")
    if audit.get("pre_post_source_stat_unchanged") is not True:
        errors.append(f"{label}: native source stability was not retained")
    source_parts = audit.get("source_parts")
    if not isinstance(source_parts, list) or len(source_parts) != len(pinned_parts):
        errors.append(f"{label}: native source-part list differs from the source pin")
    else:
        for index, (part, pinned) in enumerate(zip(source_parts, pinned_parts)):
            expected = {
                "part_index": pinned.get("part_index"),
                "path": pinned.get("path"),
                "size_bytes": pinned.get("size_bytes"),
                "sha256": pinned.get("lfs_sha256"),
            }
            if part != expected:
                errors.append(
                    f"{label}: native source part {index} differs from the exact source pin"
                )
    if (
        audit.get("field_name") != "UMeanTrim"
        or audit.get("association") != "CellData"
        or audit.get("vtk_type") != "Float32"
        or audit.get("number_of_components") != 3
    ):
        errors.append(f"{label}: native volume audit is not bound to Float32 UMeanTrim[3]")
    for field in (
        "logical_size_bytes",
        "tuple_count",
        "declared_payload_bytes",
        "selected_unique_raw_cell_id_count",
    ):
        value = audit.get(field)
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            errors.append(f"{label}: {field} must be a positive integer")
    for field in ("retained_full_payload_sha256", "selected_values_sha256"):
        if not valid_sha256(audit.get(field)):
            errors.append(f"{label}: invalid {field}")
    if isinstance(audit.get("tuple_count"), int) and audit.get(
        "declared_payload_bytes"
    ) != audit["tuple_count"] * 3 * 4:
        errors.append(
            f"{label}: declared_payload_bytes differs from Float32 UMeanTrim[3] tuple count"
        )
    if (
        audit.get("full_payload_verification")
        != "retained_all484_native_volume_audit_exact_source_binding"
    ):
        errors.append(f"{label}: full UMeanTrim payload verification is incomplete")

    tuple_count = audit.get("tuple_count")
    raw_ids = {
        raw_id
        for series in case.get("series", [])
        if series.get("representation") == "materialized"
        and series.get("panel_id") == "velocity_profiles"
        for raw_id in series.get("raw_native_cell_id", [])
    }
    if isinstance(tuple_count, int) and any(
        not isinstance(raw_id, int) or raw_id < 0 or raw_id >= tuple_count
        for raw_id in raw_ids
    ):
        errors.append(f"{label}: selected velocity native-cell ID is out of bounds")
    if audit.get("selected_unique_raw_cell_id_count") != len(raw_ids):
        errors.append(
            f"{label}: selected_unique_raw_cell_id_count differs from materialized velocity lineage"
        )
    return errors


def drivaerml_native_boundary_audit_errors(
    case: dict[str, Any],
    native_pin_case: dict[str, Any],
    label: str,
) -> list[str]:
    errors: list[str] = []
    audit = case.get("native_boundary")
    if not isinstance(audit, dict):
        return [f"{label}: missing native_boundary"]
    required_fields = {
        "logical_path",
        "logical_size_bytes",
        "source_sha256",
        "pin_git_blob_sha1",
        "full_file_verification",
        "pre_post_source_stat_unchanged",
        "field_name",
        "association",
        "vtk_type",
        "number_of_components",
        "tuple_count",
        "declared_payload_bytes",
        "referenced_producer_row_count",
        "selected_unique_raw_polygon_id_count",
        "selected_values_sha256",
        "producer_value_crosscheck",
    }
    if set(audit) != required_fields:
        errors.append(
            f"{label}: native_boundary must contain exactly {sorted(required_fields)}"
        )
    pinned = native_pin_case.get("boundary", {})
    if (
        audit.get("logical_path") != pinned.get("path")
        or audit.get("logical_size_bytes") != pinned.get("size_bytes")
        or audit.get("source_sha256") != pinned.get("lfs_sha256")
        or audit.get("pin_git_blob_sha1") != pinned.get("git_blob_sha1")
    ):
        errors.append(f"{label}: native boundary differs from the exact source pin")
    if (
        audit.get("full_file_verification")
        != "sha256_recomputed_against_native_source_pin"
        or audit.get("pre_post_source_stat_unchanged") is not True
        or audit.get("producer_value_crosscheck")
        != "exact_float_equality_all_referenced_rows"
    ):
        errors.append(f"{label}: native boundary source verification is incomplete")
    if (
        audit.get("field_name") != "pMeanTrim"
        or audit.get("association") != "CellData"
        or audit.get("vtk_type") != "Float32"
        or audit.get("number_of_components") != 1
    ):
        errors.append(f"{label}: native boundary audit is not bound to Float32 pMeanTrim CellData")
    for field in (
        "logical_size_bytes",
        "tuple_count",
        "declared_payload_bytes",
        "referenced_producer_row_count",
        "selected_unique_raw_polygon_id_count",
    ):
        value = audit.get(field)
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            errors.append(f"{label}: native boundary {field} must be a positive integer")
    if isinstance(audit.get("tuple_count"), int) and audit.get(
        "declared_payload_bytes"
    ) != audit["tuple_count"] * 4:
        errors.append(
            f"{label}: native boundary payload differs from Float32 pMeanTrim tuple count"
        )
    if not valid_sha256(audit.get("source_sha256")) or not valid_sha256(
        audit.get("selected_values_sha256")
    ):
        errors.append(f"{label}: native boundary SHA-256 evidence is invalid")
    cp_series = [
        series
        for series in case.get("series", [])
        if isinstance(series, dict)
        and series.get("panel_id") == "pressure_profiles"
        and series.get("representation") == "materialized"
    ]
    raw_ids = [
        raw_id
        for series in cp_series
        for raw_id in series.get("raw_native_cell_id", [])
    ]
    tuple_count = audit.get("tuple_count")
    if isinstance(tuple_count, int) and any(
        not isinstance(raw_id, int) or raw_id < 0 or raw_id >= tuple_count
        for raw_id in raw_ids
    ):
        errors.append(f"{label}: selected Cp native-polygon ID is out of bounds")
    if audit.get("referenced_producer_row_count") != len(raw_ids):
        errors.append(
            f"{label}: referenced_producer_row_count differs from materialized Cp lineage"
        )
    if audit.get("selected_unique_raw_polygon_id_count") != len(set(raw_ids)):
        errors.append(
            f"{label}: selected_unique_raw_polygon_id_count differs from materialized Cp lineage"
        )
    return errors


def drivaerml_native_declaration_errors(
    declaration: Any, expected_pin_sha256: str, label: str = "drivaerml/native-profile-truth-v2"
) -> list[str]:
    expected = {
        "source_kind": "native_cfd",
        "analytical_dummy": False,
        "dataset_revision": NATIVE_DRIVAERML_DATASET_REVISION,
        "native_source_pin_sha256": expected_pin_sha256,
        "case_count": 484,
    }
    if not isinstance(declaration, dict):
        return [f"{label}: missing native_profile_truth declaration"]
    expected_fields = set(expected) | {"master_index_file", "master_index_sha256"}
    errors = (
        []
        if set(declaration) == expected_fields
        else [
            f"{label}: native_profile_truth declaration fields differ; expected exactly {sorted(expected_fields)}"
        ]
    )
    errors.extend(
        f"{label}: declaration {field} must be {expected_value!r}"
        for field, expected_value in expected.items()
        if declaration.get(field) != expected_value
    )
    if declaration.get("analytical_dummy") is not False:
        errors.append(f"{label}: analytical dummy data cannot be declared native CFD")
    if not isinstance(declaration.get("master_index_file"), str):
        errors.append(f"{label}: declaration must bind a master_index_file")
    if not valid_sha256(declaration.get("master_index_sha256")):
        errors.append(f"{label}: declaration must bind a nonzero master_index_sha256")
    return errors


def drivaerml_master_coverage_errors(
    official_case_ids: list[str],
    master_case_ids: Any,
    chunk_records: Any,
    label: str = "drivaerml/native-profile-truth-v2",
) -> list[str]:
    errors: list[str] = []
    if (
        not isinstance(master_case_ids, list)
        or master_case_ids != official_case_ids
        or len(master_case_ids) != 484
        or len(set(master_case_ids)) != 484
    ):
        errors.append(
            f"{label}: master index does not cover the exact ordered all-484 source-pin cases"
        )
    chunk_case_ids = (
        [
            case_id
            for chunk in chunk_records
            if isinstance(chunk, dict)
            for case_id in chunk.get("case_ids", [])
        ]
        if isinstance(chunk_records, list)
        else []
    )
    if chunk_case_ids != official_case_ids or len(set(chunk_case_ids)) != len(
        chunk_case_ids
    ):
        errors.append(
            f"{label}: master chunks are incomplete, duplicated, gapped, or reordered"
        )
    return errors


def drivaerml_thin_reference_errors(
    references: Any,
    master_records: dict[str, dict[str, Any]],
    official_split: list[str],
    label: str,
) -> list[str]:
    if not isinstance(references, list):
        return [f"{label}: chunk_refs must be an array"]
    errors: list[str] = []
    referenced_case_ids: list[str] = []
    for index, reference in enumerate(references):
        ref_label = f"{label}/chunk_refs[{index}]"
        if not isinstance(reference, dict):
            errors.append(f"{ref_label}: reference is not an object")
            continue
        if set(reference) != {"chunk_id", "path", "sha256", "case_ids"}:
            errors.append(f"{ref_label}: shared chunk reference fields differ from schema 2.0")
        master = master_records.get(reference.get("chunk_id"))
        if master is None:
            errors.append(f"{ref_label}: unknown shared chunk_id")
            continue
        if reference.get("sha256") != master.get("sha256"):
            errors.append(f"{ref_label}: shared chunk SHA differs from master")
        if reference.get("path") != master.get("path"):
            errors.append(f"{ref_label}: shared chunk path differs from master")
        cases = reference.get("case_ids")
        if not isinstance(cases, list):
            errors.append(f"{ref_label}: case_ids must be an array")
            continue
        master_cases = master.get("case_ids", [])
        expected_order = [case_id for case_id in master_cases if case_id in set(cases)]
        if cases != expected_order or any(
            case_id not in master_cases for case_id in cases
        ):
            errors.append(
                f"{ref_label}: referenced cases differ from exact shared chunk order"
            )
        referenced_case_ids.extend(cases)
    if referenced_case_ids != official_split or len(
        set(referenced_case_ids)
    ) != len(referenced_case_ids):
        errors.append(
            f"{label}: shared chunk refs are incomplete, duplicated, gapped, or reordered"
        )
    return errors


def drivaerml_native_bundle_errors(
    ground_truth_root: Path,
    dataset_manifest: dict[str, Any],
    submission_root: Path,
) -> list[str]:
    errors: list[str] = []
    label = "drivaerml/native-profile-truth"
    declaration = dataset_manifest.get("native_profile_truth")
    native_pin_path = (
        submission_root
        / "benchmark-specs"
        / "drivaerml"
        / "proposal"
        / "native-source-pin.json"
    )
    expected_pin_sha256 = sha256_file(native_pin_path)
    errors.extend(
        drivaerml_native_declaration_errors(
            declaration, expected_pin_sha256, label
        )
    )
    if not isinstance(declaration, dict):
        return errors
    master_path = _safe_profile_path(
        ground_truth_root,
        ground_truth_root,
        declaration.get("master_index_file"),
    )
    errors.extend(
        _file_binding_errors(
            master_path,
            declaration.get("master_index_sha256"),
            None,
            f"{label}/master-index",
        )
    )
    if master_path is None or not master_path.is_file():
        return errors
    master = load_json(master_path)
    contract_version = drivaerml_native_contract_version(master, "index")
    claimed_version = master.get("schema_version") if isinstance(master, dict) else None
    version = (
        contract_version
        or (claimed_version if claimed_version in NATIVE_DRIVAERML_CONTRACTS else None)
        or "2.0"
    )
    contract = NATIVE_DRIVAERML_CONTRACTS[version]
    label = f"drivaerml/native-profile-truth-v{version[0]}"
    if contract_version is None:
        errors.append(
            f"{label}: master index schema and schema_version do not form a supported coherent pair"
        )
    expected_master_file = f"datasets/drivaerml/native-v{version[0]}/index.json"
    if declaration.get("master_index_file") != expected_master_file:
        errors.append(
            f"{label}: declaration master_index_file must be {expected_master_file}"
        )
    expected_master_fields = {
        "schema",
        "schema_version",
        "dataset_id",
        "dataset_repository",
        "dataset_revision",
        "truth_source",
        "relative_scoring_activated",
        "coverage_summary",
        "case_count",
        "case_ids",
        "cases_per_chunk",
        "series_per_case",
        "series_count",
        "profile_set",
        "chunks",
        "case_locations",
        "splits",
        "provenance",
        "release_receipt_path",
        "index_identity",
    }
    if version == "3.0":
        expected_master_fields.add("cp_display_coordinate")
    if set(master) != expected_master_fields:
        errors.append(
            f"{label}: master index fields differ from schema {version}; expected exactly {sorted(expected_master_fields)}"
        )
    if (
        master.get("schema") != contract["index"]
        or master.get("schema_version") != version
    ):
        errors.append(f"{label}: master index schema must be coherent native v{version[0]}")
    if (
        master.get("dataset_id") != "drivaerml"
        or master.get("dataset_repository") != "neashton/drivaerml"
        or master.get("dataset_revision") != NATIVE_DRIVAERML_DATASET_REVISION
    ):
        errors.append(f"{label}: master index dataset binding is stale")
    errors.extend(identity_bound_document_errors(master, "index_identity", label))
    source_pin = load_json(native_pin_path)
    official_case_ids = [record.get("case_id") for record in source_pin.get("cases", [])]
    if len(official_case_ids) != 484 or len(set(official_case_ids)) != 484:
        errors.append(f"{label}: native source pin itself does not contain 484 unique cases")
    if master.get("case_count") != 484:
        errors.append(f"{label}: master index case_count must be 484")
    if master.get("series_per_case") != 40:
        errors.append(f"{label}: master index must declare exactly 40 series per case")
    if (
        master.get("series_count") != 484 * 40
        or master.get("relative_scoring_activated") is not False
        or master.get("profile_set")
        != {
            "drivaerml-autocfd5-constant-v1": 16,
            "drivaerml-velocity-relative-v3": 16,
            "drivaerml_cp_constant_v1": 4,
            "drivaerml_cp_relative_v1": 4,
        }
        or master.get("release_receipt_path") != "release-receipt.json"
    ):
        errors.append(f"{label}: master profile-set, total, inactive state, or release receipt differs")
    if not isinstance(master.get("cases_per_chunk"), int) or isinstance(
        master.get("cases_per_chunk"), bool
    ) or master.get("cases_per_chunk", 0) <= 0:
        errors.append(f"{label}: cases_per_chunk must be a positive integer")
    if master.get("truth_source") != NATIVE_TRUTH_SOURCE:
        errors.append(
            f"{label}: master index lacks the exact pinned non-analytical native CFD truth_source declaration"
        )
    if version == "3.0" and master.get(
        "cp_display_coordinate"
    ) != NATIVE_CP_INDEX_DISPLAY_DECLARATION:
        errors.append(
            f"{label}: master index cp_display_coordinate declaration differs from the exact native-v3 display contract"
        )

    native_pin_cases = {
        record.get("case_id"): record for record in source_pin.get("cases", [])
    }
    coverage_accumulator = _native_coverage_accumulator(version)
    evaluator_revisions: set[str] = set()
    case_exporter_bindings: set[str] = set()
    staging_case_bindings: list[dict[str, Any]] = []
    case_input_inventory: list[dict[str, Any]] = []
    native_volume_inventory: list[dict[str, Any]] = []
    native_boundary_inventory: list[dict[str, Any]] = []
    cp_display_coordinate_inventory: list[dict[str, Any]] = []
    master_chunk_records: dict[str, dict[str, Any]] = {}
    master_base = master_path.parent
    chunks = master.get("chunks")
    if not isinstance(chunks, list) or not chunks:
        errors.append(f"{label}: master chunks must be a nonempty array")
        chunks = []
    for entry_index, entry in enumerate(chunks):
        entry_label = f"{label}/chunks[{entry_index}]"
        if not isinstance(entry, dict):
            errors.append(f"{entry_label}: chunk binding is not an object")
            continue
        if set(entry) != {
            "chunk_id",
            "path",
            "sha256",
            "size_bytes",
            "case_count",
            "case_ids",
            "series_count",
        }:
            errors.append(
                f"{entry_label}: master chunk binding fields differ from schema {version}"
            )
        chunk_id = entry.get("chunk_id")
        if not isinstance(chunk_id, str) or not chunk_id or chunk_id in master_chunk_records:
            errors.append(f"{entry_label}: chunk_id is missing or duplicated")
            continue
        chunk_path = _safe_profile_path(
            ground_truth_root, master_base, entry.get("path")
        )
        errors.extend(
            _file_binding_errors(
                chunk_path,
                entry.get("sha256"),
                entry.get("size_bytes"),
                entry_label,
            )
        )
        case_ids = entry.get("case_ids")
        if (
            not isinstance(case_ids, list)
            or len(case_ids) != len(set(case_ids))
            or entry.get("case_count") != len(case_ids)
            or entry.get("series_count") != len(case_ids) * 40
        ):
            errors.append(f"{entry_label}: case/series counts or uniqueness are invalid")
            continue
        master_chunk_records[chunk_id] = {
            **entry,
            "resolved_path": chunk_path,
        }
        if chunk_path is None or not chunk_path.is_file():
            continue
        chunk = load_json(chunk_path)
        if set(chunk) != {
            "schema",
            "schema_version",
            "dataset_id",
            "dataset_revision",
            "truth_source",
            "chunk_id",
            "case_count",
            "case_ids",
            "series_per_case",
            "series_count",
            "cases",
            "chunk_identity",
        }:
            errors.append(f"{entry_label}: chunk fields differ from schema {version}")
        if (
            chunk.get("schema") != contract["chunk"]
            or chunk.get("schema_version") != version
            or chunk.get("dataset_id") != "drivaerml"
            or chunk.get("dataset_revision") != NATIVE_DRIVAERML_DATASET_REVISION
            or chunk.get("chunk_id") != chunk_id
            or chunk.get("case_count") != len(case_ids)
            or chunk.get("case_ids") != case_ids
            or chunk.get("series_per_case") != 40
            or chunk.get("series_count") != len(case_ids) * 40
            or chunk.get("truth_source") != NATIVE_TRUTH_SOURCE
        ):
            errors.append(f"{entry_label}: chunk schema or immutable binding is stale")
        errors.extend(
            identity_bound_document_errors(chunk, "chunk_identity", entry_label)
        )
        cases = chunk.get("cases")
        loaded_case_ids = (
            [case.get("case_id") for case in cases if isinstance(case, dict)]
            if isinstance(cases, list)
            else []
        )
        if loaded_case_ids != case_ids:
            errors.append(f"{entry_label}: chunk case order differs from its master binding")
        for case in cases if isinstance(cases, list) else []:
            case_id = case.get("case_id") if isinstance(case, dict) else None
            case_label = f"{entry_label}/{case_id}"
            if not isinstance(case, dict) or case.get("truth_source") != NATIVE_TRUTH_SOURCE:
                errors.append(
                    f"{case_label}: case lacks the exact pinned non-analytical native CFD truth_source declaration"
                )
            errors.extend(
                drivaerml_native_case_series_errors(
                    case, case_label, expected_version=version
                )
            )
            if isinstance(case, dict):
                _accumulate_native_coverage(coverage_accumulator, case, version)
                if isinstance(case_id, str):
                    canonical_case = canonical_json_bytes(case)
                    staging_case_bindings.append(
                        {
                            "path": f"cases/{case_id}.json",
                            "sha256": hashlib.sha256(canonical_case).hexdigest(),
                            "size_bytes": len(canonical_case),
                        }
                    )
                    case_input_inventory.append(
                        {
                            "case_id": case_id,
                            "input_bindings": case.get("input_bindings"),
                        }
                    )
                    volume = case.get("native_volume", {})
                    native_volume_inventory.append(
                        {
                            "case_id": case_id,
                            "logical_path": volume.get("logical_path"),
                            "logical_size_bytes": volume.get("logical_size_bytes"),
                            "retained_full_payload_sha256": volume.get(
                                "retained_full_payload_sha256"
                            ),
                            "selected_unique_raw_cell_id_count": volume.get(
                                "selected_unique_raw_cell_id_count"
                            ),
                            "selected_values_sha256": volume.get(
                                "selected_values_sha256"
                            ),
                        }
                    )
                    boundary = case.get("native_boundary", {})
                    native_boundary_inventory.append(
                        {
                            "case_id": case_id,
                            "logical_path": boundary.get("logical_path"),
                            "logical_size_bytes": boundary.get("logical_size_bytes"),
                            "source_sha256": boundary.get("source_sha256"),
                            "tuple_count": boundary.get("tuple_count"),
                            "referenced_producer_row_count": boundary.get(
                                "referenced_producer_row_count"
                            ),
                            "selected_unique_raw_polygon_id_count": boundary.get(
                                "selected_unique_raw_polygon_id_count"
                            ),
                            "selected_values_sha256": boundary.get(
                                "selected_values_sha256"
                            ),
                        }
                    )
                    if version == "3.0":
                        cp_display_coordinate_inventory.append(
                            {
                                "case_id": case_id,
                                "series": [
                                    {
                                        "family_id": item.get("family_id"),
                                        "station_id": item.get("station_id"),
                                        "sample_count": (
                                            len(item.get("display_coordinate"))
                                            if isinstance(
                                                item.get("display_coordinate"), list
                                            )
                                            else None
                                        ),
                                        "display_coordinate_identity_sha256": item.get(
                                            "display_coordinate_identity_sha256"
                                        ),
                                        "series_identity_sha256": item.get(
                                            "series_identity_sha256"
                                        ),
                                    }
                                    for item in case.get("series", [])
                                    if isinstance(item, dict)
                                    and item.get("representation") == "materialized"
                                    and item.get("quantity_id") == "cp"
                                ],
                            }
                        )
                revision = case.get("generator", {}).get("evaluator_git_revision")
                if isinstance(revision, str):
                    evaluator_revisions.add(revision)
                exporter_binding = case.get("generator", {}).get("exporter_source")
                if isinstance(exporter_binding, dict):
                    case_exporter_bindings.add(
                        json.dumps(exporter_binding, sort_keys=True, separators=(",", ":"))
                    )
            pinned_case = native_pin_cases.get(case_id)
            if pinned_case is None:
                errors.append(f"{case_label}: case is absent from native source pin")
            else:
                errors.extend(
                    drivaerml_native_volume_audit_errors(
                        case, pinned_case, case_label
                    )
                )
                errors.extend(
                    drivaerml_native_boundary_audit_errors(
                        case, pinned_case, case_label
                    )
                )
    errors.extend(
        drivaerml_master_coverage_errors(
            official_case_ids, master.get("case_ids"), chunks, label
        )
    )
    expected_locations = [
        {
            "case_id": case_id,
            "chunk_id": chunk.get("chunk_id"),
            "chunk_path": chunk.get("path"),
            "chunk_sha256": chunk.get("sha256"),
            "case_offset": case_offset,
        }
        for chunk in chunks
        if isinstance(chunk, dict)
        for case_offset, case_id in enumerate(chunk.get("case_ids", []))
    ]
    if master.get("case_locations") != expected_locations:
        errors.append(
            f"{label}: case_locations do not bind every ordered case to its exact chunk offset"
        )
    actual_coverage = _finalize_native_coverage(coverage_accumulator)
    if master.get("coverage_summary") != actual_coverage:
        errors.append(
            f"{label}: coverage_summary does not replay from all 484 materialized/alias series"
        )
    for family_id, expected_counts in _native_expected_coverage(version).items():
        observed = actual_coverage["families"][family_id]
        for field, expected_count in expected_counts.items():
            if observed[field] != expected_count:
                errors.append(
                    f"{label}: {family_id} {field} expected {expected_count}, observed {observed[field]}"
                )

    submission_spec = load_json(
        submission_root / "benchmark-specs" / "drivaerml" / "submission-spec.json"
    )
    spec_splits = {split["id"]: split for split in submission_spec["splits"]}
    split_bindings = master.get("splits")
    if not isinstance(split_bindings, list):
        errors.append(f"{label}: master split bindings must be an array")
        split_bindings = []
    by_split_id = {
        binding.get("split_id"): binding
        for binding in split_bindings
        if isinstance(binding, dict)
    }
    if set(by_split_id) != set(spec_splits):
        errors.append(f"{label}: master index must bind all eight exact official splits")
    loaded_splits: dict[str, tuple[Path, str, list[str]]] = {}
    for split_id, split_spec in spec_splits.items():
        binding = by_split_id.get(split_id)
        if not isinstance(binding, dict):
            continue
        split_label = f"{label}/split/{split_id}"
        if set(binding) != {
            "split_id",
            "path",
            "sha256",
            "size_bytes",
            "case_count",
        }:
            errors.append(
                f"{split_label}: master split binding fields differ from schema {version}"
            )
        split_path = _safe_profile_path(
            ground_truth_root, master_base, binding.get("path")
        )
        errors.extend(
            _file_binding_errors(
                split_path,
                binding.get("sha256"),
                binding.get("size_bytes"),
                split_label,
            )
        )
        official_split = load_json(
            submission_root
            / "benchmark-specs"
            / "drivaerml"
            / split_spec["index_file"]
        )["case_ids"]
        if binding.get("case_count") != len(official_split):
            errors.append(f"{split_label}: case_count differs from official split")
        if split_path is None or not split_path.is_file():
            continue
        thin = load_json(split_path)
        if set(thin) != {
            "schema",
            "schema_version",
            "dataset_id",
            "dataset_revision",
            "split_id",
            "case_set_id",
            "case_id_status",
            "case_ids",
            "case_count",
            "series_per_case",
            "series_count",
            "truth_source",
            "source_split_index",
            "chunk_refs",
            "split_identity",
        }:
            errors.append(
                f"{split_label}: thin index fields differ from schema {version}"
            )
        if (
            thin.get("schema") != contract["split"]
            or thin.get("schema_version") != version
            or thin.get("dataset_id") != "drivaerml"
            or thin.get("dataset_revision") != NATIVE_DRIVAERML_DATASET_REVISION
            or thin.get("split_id") != split_id
            or thin.get("case_set_id") != split_spec.get("case_set_id")
            or thin.get("case_id_status") != "official"
            or thin.get("case_ids") != official_split
            or thin.get("case_count") != len(official_split)
            or thin.get("series_per_case") != 40
            or thin.get("series_count") != len(official_split) * 40
            or thin.get("truth_source") != NATIVE_TRUTH_SOURCE
        ):
            errors.append(f"{split_label}: thin index contract or ordered official cases differ")
        errors.extend(
            identity_bound_document_errors(thin, "split_identity", split_label)
        )
        source_split_path = (
            submission_root
            / "benchmark-specs"
            / "drivaerml"
            / split_spec["index_file"]
        )
        if thin.get("source_split_index") != {
            "path": source_split_path.name,
            "sha256": sha256_file(source_split_path),
            "size_bytes": source_split_path.stat().st_size,
        }:
            errors.append(
                f"{split_label}: source_split_index does not bind the exact official split bytes"
            )
        errors.extend(
            drivaerml_thin_reference_errors(
                thin.get("chunk_refs"),
                master_chunk_records,
                official_split,
                split_label,
            )
        )
        for ref_index, reference in enumerate(thin.get("chunk_refs", [])):
            ref_label = f"{split_label}/chunk_refs[{ref_index}]"
            master_record = master_chunk_records.get(reference.get("chunk_id"))
            ref_path = _safe_profile_path(
                ground_truth_root, master_base, reference.get("path")
            )
            if master_record is None:
                continue
            if (
                ref_path != master_record.get("resolved_path")
            ):
                errors.append(f"{ref_label}: shared chunk path differs from master")
        loaded_splits[split_id] = (
            split_path,
            binding.get("sha256"),
            official_split,
        )

    case_sets = {
        case_set.get("id"): case_set
        for case_set in dataset_manifest.get("case_sets", [])
        if isinstance(case_set, dict)
    }
    expected_case_set_split = {
        "standard": "full",
        "geometry": "geometry",
        "high_drag": "high_drag",
        "low_drag": "low_drag",
        "rear_separation": "rear_separation",
    }
    for case_set_id, split_id in expected_case_set_split.items():
        case_set = case_sets.get(case_set_id)
        split_record = loaded_splits.get(split_id)
        if case_set is None or split_record is None:
            errors.append(f"{label}: missing website case set {case_set_id}")
            continue
        expected_path, expected_sha, expected_ids = split_record
        declared_path = _safe_profile_path(
            ground_truth_root, ground_truth_root, case_set.get("index_file")
        )
        if (
            declared_path != expected_path
            or case_set.get("index_sha256") != expected_sha
            or case_set.get("case_count") != len(expected_ids)
            or case_set.get("coverage", COMPLETE_COVERAGE) != COMPLETE_COVERAGE
        ):
            errors.append(
                f"{label}: website case set {case_set_id} does not bind exact {split_id} thin index"
            )

    provenance = master.get("provenance")
    if not isinstance(provenance, dict):
        errors.append(f"{label}: master index lacks hash-bound provenance")
    else:
        if set(provenance) != {"path", "sha256", "size_bytes"}:
            errors.append(f"{label}: master provenance binding fields differ")
        provenance_path = _safe_profile_path(
            ground_truth_root, master_base, provenance.get("path")
        )
        errors.extend(
            _file_binding_errors(
                provenance_path,
                provenance.get("sha256"),
                provenance.get("size_bytes"),
                f"{label}/provenance",
            )
        )
        if provenance_path is not None and provenance_path.is_file():
            provenance_record = load_json(provenance_path)
            expected_provenance_fields = {
                "schema",
                "schema_version",
                "dataset_id",
                "dataset_repository",
                "dataset_revision",
                "evaluator_git_revision",
                "truth_source",
                "relative_scoring_activated",
                "input_bindings",
                "split_source_bindings",
                "case_artifact_count",
                "case_artifact_inventory_sha256",
                "case_input_binding_inventory_sha256",
                "native_volume_selected_values_inventory_sha256",
                "native_boundary_selected_values_inventory_sha256",
                "coverage_summary",
                "run_419_selected_values_sha256",
                "truth_definitions",
                "identity_encodings",
                "provenance_identity",
            }
            if version == "3.0":
                expected_provenance_fields.add(
                    "cp_display_coordinate_inventory_sha256"
                )
            if set(provenance_record) != expected_provenance_fields:
                errors.append(
                    f"{label}/provenance: fields differ from schema {version}"
                )
            expected_truth_definitions = (
                DRIVAERML_NATIVE_TRUTH_DEFINITIONS_V3
                if version == "3.0"
                else DRIVAERML_NATIVE_TRUTH_DEFINITIONS
            )
            expected_identity_encodings = (
                DRIVAERML_NATIVE_IDENTITY_ENCODINGS_V3
                if version == "3.0"
                else DRIVAERML_NATIVE_IDENTITY_ENCODINGS
            )
            if (
                provenance_record.get("schema")
                != contract["provenance"]
                or provenance_record.get("schema_version") != version
                or provenance_record.get("dataset_id") != "drivaerml"
                or provenance_record.get("dataset_repository")
                != "neashton/drivaerml"
                or provenance_record.get("dataset_revision")
                != NATIVE_DRIVAERML_DATASET_REVISION
                or provenance_record.get("truth_source") != NATIVE_TRUTH_SOURCE
                or provenance_record.get("relative_scoring_activated") is not False
                or provenance_record.get("case_artifact_count") != 484
                or provenance_record.get("coverage_summary") != actual_coverage
                or provenance_record.get("run_419_selected_values_sha256")
                != "a1cd9c5bad71b720e6434fbb821aa480fc2f7555516375329bfd02ced43752d0"
                or provenance_record.get("truth_definitions")
                != expected_truth_definitions
                or provenance_record.get("identity_encodings")
                != expected_identity_encodings
            ):
                errors.append(
                    f"{label}/provenance: dataset, truth, coverage, or inactive binding differs"
                )
            errors.extend(
                identity_bound_document_errors(
                    provenance_record,
                    "provenance_identity",
                    f"{label}/provenance",
                )
            )
            provenance_revision = provenance_record.get("evaluator_git_revision")
            if not valid_git_commit(provenance_revision) or evaluator_revisions != {
                provenance_revision
            }:
                errors.append(
                    f"{label}/provenance: evaluator revision is invalid or differs across cases"
                )
            expected_inventory_hashes = {
                "case_artifact_inventory_sha256": canonical_json_identity_sha256(
                    staging_case_bindings
                ),
                "case_input_binding_inventory_sha256": canonical_json_identity_sha256(
                    case_input_inventory
                ),
                "native_volume_selected_values_inventory_sha256": canonical_json_identity_sha256(
                    native_volume_inventory
                ),
                "native_boundary_selected_values_inventory_sha256": canonical_json_identity_sha256(
                    native_boundary_inventory
                ),
            }
            if version == "3.0":
                expected_inventory_hashes[
                    "cp_display_coordinate_inventory_sha256"
                ] = canonical_json_identity_sha256(cp_display_coordinate_inventory)
            for field, expected_sha256 in expected_inventory_hashes.items():
                if provenance_record.get(field) != expected_sha256:
                    errors.append(
                        f"{label}/provenance: {field} does not replay from retained all-484 records"
                    )
            input_bindings = provenance_record.get("input_bindings")
            expected_binding_names = {
                "native_source_pin",
                "native_volume_audit",
                "relative_velocity_placement_manifest",
                "relative_velocity_mapping_manifest",
                "relative_cp_manifest",
                "constant_cp_aggregate",
                "exporter_source",
            }
            if not isinstance(input_bindings, dict) or set(
                input_bindings
            ) != expected_binding_names:
                errors.append(
                    f"{label}/provenance: input_bindings differ from the seven frozen producer inputs"
                )
                input_bindings = {}
            for binding_name, binding in input_bindings.items():
                if (
                    not isinstance(binding, dict)
                    or set(binding) != {"path", "sha256", "size_bytes"}
                    or not isinstance(binding.get("path"), str)
                    or not valid_sha256(binding.get("sha256"))
                    or not isinstance(binding.get("size_bytes"), int)
                    or binding.get("size_bytes", 0) <= 0
                ):
                    errors.append(
                        f"{label}/provenance: invalid {binding_name} file binding"
                    )
            if input_bindings.get("native_source_pin") != {
                "path": native_pin_path.name,
                "sha256": expected_pin_sha256,
                "size_bytes": native_pin_path.stat().st_size,
            }:
                errors.append(
                    f"{label}/provenance: native_source_pin does not bind the exact paired repository bytes"
                )
            exporter_path = submission_root / "scripts" / "export_drivaerml_native_profile_truth.py"
            if input_bindings.get("exporter_source") != {
                "path": "scripts/export_drivaerml_native_profile_truth.py",
                "sha256": sha256_file(exporter_path),
                "size_bytes": exporter_path.stat().st_size,
            }:
                errors.append(
                    f"{label}/provenance: exporter_source does not bind the exact paired repository bytes"
                )
            if case_exporter_bindings != {
                json.dumps(
                    input_bindings.get("exporter_source"),
                    sort_keys=True,
                    separators=(",", ":"),
                )
            }:
                errors.append(
                    f"{label}/provenance: case generator exporter bindings differ from provenance"
                )
            expected_split_sources = {
                split_id: {
                    "path": (
                        submission_root
                        / "benchmark-specs"
                        / "drivaerml"
                        / split_spec["index_file"]
                    ).name,
                    "sha256": sha256_file(
                        submission_root
                        / "benchmark-specs"
                        / "drivaerml"
                        / split_spec["index_file"]
                    ),
                    "size_bytes": (
                        submission_root
                        / "benchmark-specs"
                        / "drivaerml"
                        / split_spec["index_file"]
                    ).stat().st_size,
                }
                for split_id, split_spec in spec_splits.items()
            }
            if provenance_record.get("split_source_bindings") != expected_split_sources:
                errors.append(
                    f"{label}/provenance: split_source_bindings differ from all eight official split bytes"
                )
    release_path = _safe_profile_path(
        ground_truth_root, master_base, master.get("release_receipt_path")
    )
    if release_path is None or not release_path.is_file():
        errors.append(f"{label}/release: immutable release receipt is missing")
    else:
        release = load_json(release_path)
        expected_release_fields = {
            "schema",
            "schema_version",
            "dataset_id",
            "dataset_revision",
            "evaluator_git_revision",
            "status",
            "truth_source",
            "relative_scoring_activated",
            "submissions_opened",
            "owner_approval_complete",
            "coverage_summary",
            "artifact_size_summary",
            "artifact_bindings",
            "release_identity",
        }
        if set(release) != expected_release_fields:
            errors.append(
                f"{label}/release: fields differ from release schema {version}"
            )
        if (
            release.get("schema") != contract["release"]
            or release.get("schema_version") != version
            or release.get("dataset_id") != "drivaerml"
            or release.get("dataset_revision")
            != NATIVE_DRIVAERML_DATASET_REVISION
            or release.get("evaluator_git_revision") not in evaluator_revisions
            or release.get("status")
            != "complete_native_truth_export_not_scoring_activation"
            or release.get("truth_source") != NATIVE_TRUTH_SOURCE
            or release.get("relative_scoring_activated") is not False
            or release.get("submissions_opened") is not False
            or release.get("owner_approval_complete") is not False
            or release.get("coverage_summary") != actual_coverage
        ):
            errors.append(
                f"{label}/release: source, coverage, or explicit inactive gates differ"
            )
        errors.extend(
            identity_bound_document_errors(
                release, "release_identity", f"{label}/release"
            )
        )
        expected_artifact_bindings = {
            "index": {
                "path": "index.json",
                "sha256": declaration.get("master_index_sha256"),
                "size_bytes": master_path.stat().st_size,
            },
            "provenance": master.get("provenance"),
            "chunks": chunks,
            "splits": split_bindings,
        }
        if release.get("artifact_bindings") != expected_artifact_bindings:
            errors.append(
                f"{label}/release: artifact_bindings differ from the exact master/chunk/split/provenance bytes"
            )
        case_bytes = sum(
            binding.get("size_bytes", 0)
            for binding in staging_case_bindings
            if isinstance(binding, dict)
        )
        chunk_bytes = sum(
            binding.get("size_bytes", 0)
            for binding in chunks
            if isinstance(binding, dict)
        )
        split_bytes = sum(
            binding.get("size_bytes", 0)
            for binding in split_bindings
            if isinstance(binding, dict)
        )
        expected_size_summary = {
            "scope": "browser_publication_artifacts_bound_by_this_receipt_excluding_the_receipt_itself",
            "public_artifact_count": len(chunks) + len(split_bindings) + 2,
            "public_total_size_bytes": (
                chunk_bytes
                + split_bytes
                + master.get("provenance", {}).get("size_bytes", 0)
                + master_path.stat().st_size
            ),
            "staging_case_artifacts": {
                "published": False,
                "count": len(staging_case_bindings),
                "total_size_bytes": case_bytes,
                "inventory_bound_in_provenance": True,
            },
            "public_chunk_artifact_count": len(chunks),
            "public_chunk_artifact_total_size_bytes": chunk_bytes,
            "chunk_sizes": [
                {
                    "chunk_id": binding.get("chunk_id"),
                    "size_bytes": binding.get("size_bytes"),
                }
                for binding in chunks
                if isinstance(binding, dict)
            ],
            "public_split_artifact_count": len(split_bindings),
            "public_split_artifact_total_size_bytes": split_bytes,
            "public_provenance_size_bytes": master.get("provenance", {}).get(
                "size_bytes"
            ),
            "public_index_size_bytes": master_path.stat().st_size,
        }
        if release.get("artifact_size_summary") != expected_size_summary:
            errors.append(
                f"{label}/release: artifact_size_summary does not replay from retained files"
            )
    return errors


def case_coverage_errors(
    expected_case_ids: list[str],
    indexed_case_ids: list[str],
    coverage: str,
    release_status: str,
) -> list[str]:
    if len(indexed_case_ids) != len(set(indexed_case_ids)):
        return ["ground-truth case IDs contain duplicates"]
    if coverage == COMPLETE_COVERAGE:
        if indexed_case_ids != expected_case_ids:
            return ["ground-truth case IDs differ from the submission split"]
        return []
    if coverage != REPRESENTATIVE_COVERAGE:
        return [f"ground-truth coverage {coverage!r} is invalid"]

    errors: list[str] = []
    if release_status != "prototype_dummy_data":
        errors.append(
            "representative profile subsets are permitted only in prototype releases"
        )
    if not indexed_case_ids:
        errors.append("representative profile subset is empty")
    unexpected = sorted(set(indexed_case_ids) - set(expected_case_ids))
    if unexpected:
        errors.append(
            f"representative profile cases are absent from the official split: {unexpected}"
        )
    return errors


def _npy_1d_payload(payload: bytes, label: str) -> tuple[str, int, bytes]:
    if len(payload) < 10 or payload[:6] != b"\x93NUMPY":
        raise ValueError(f"{label}: member is not a NumPy NPY array")
    major = payload[6]
    if major == 1:
        header_length = struct.unpack_from("<H", payload, 8)[0]
        header_start = 10
    elif major in {2, 3}:
        if len(payload) < 12:
            raise ValueError(f"{label}: truncated NPY header")
        header_length = struct.unpack_from("<I", payload, 8)[0]
        header_start = 12
    else:
        raise ValueError(f"{label}: unsupported NPY version {major}.{payload[7]}")
    data_start = header_start + header_length
    if data_start > len(payload):
        raise ValueError(f"{label}: truncated NPY header body")
    encoding = "utf-8" if major == 3 else "latin1"
    try:
        header = ast.literal_eval(payload[header_start:data_start].decode(encoding).strip())
    except (SyntaxError, UnicodeDecodeError, ValueError) as error:
        raise ValueError(f"{label}: invalid NPY header") from error
    if not isinstance(header, dict) or header.get("fortran_order") is not False:
        raise ValueError(f"{label}: NPY array must use C order")
    dtype = header.get("descr")
    shape = header.get("shape")
    widths = {"<i2": 2, "<i4": 4, "|u1": 1, "|b1": 1, "<f4": 4}
    if dtype not in widths or not isinstance(shape, tuple) or len(shape) != 1:
        raise ValueError(f"{label}: unsupported NPY dtype or rank")
    count = shape[0]
    if not isinstance(count, int) or isinstance(count, bool) or count < 0:
        raise ValueError(f"{label}: invalid NPY shape")
    data = payload[data_start:]
    if len(data) != count * widths[dtype]:
        raise ValueError(f"{label}: NPY payload size differs from shape/dtype")
    return dtype, count, data


def _compact_npz_arrays(
    path: Path, expected_names: list[str], label: str
) -> dict[str, tuple[str, int, bytes]]:
    try:
        with zipfile.ZipFile(path) as archive:
            infos = archive.infolist()
            expected_members = [f"{name}.npy" for name in expected_names]
            if [info.filename for info in infos] != expected_members:
                raise ValueError(f"{label}: NPZ member inventory or order differs")
            if any(
                info.compress_type != zipfile.ZIP_DEFLATED
                or info.flag_bits & (0x1 | 0x8)
                or info.is_dir()
                for info in infos
            ):
                raise ValueError(f"{label}: NPZ members must be unencrypted deterministic DEFLATE files")
            return {
                name: _npy_1d_payload(
                    archive.read(f"{name}.npy"), f"{label}/{name}.npy"
                )
                for name in expected_names
            }
    except (OSError, KeyError, zipfile.BadZipFile) as error:
        raise ValueError(f"{label}: unreadable NPZ artifact") from error


def _unpack_i4(data: bytes) -> list[int]:
    return [value[0] for value in struct.iter_unpack("<i", data)]


def _all_finite_f4(data: bytes, *, nonnegative: bool = False) -> bool:
    for (value,) in struct.iter_unpack("<f", data):
        if not math.isfinite(value) or (nonnegative and value < 0.0):
            return False
    return True


def _decode_hilift_velocity_storage(data: bytes, count: int) -> bytes:
    if len(data) != count * 4:
        raise ValueError("HiLift compact velocity storage length differs")
    decoded = bytearray(len(data))
    word = 0
    for index in range(count):
        delta = (
            data[index]
            | (data[count + index] << 8)
            | (data[2 * count + index] << 16)
            | (data[3 * count + index] << 24)
        )
        word = (word + delta) & 0xFFFFFFFF
        struct.pack_into("<I", decoded, index * 4, word)
    return bytes(decoded)


def ahmedml_series_errors(
    series: Any,
    expected: tuple[str, str, str, str, float, float],
    label: str,
) -> list[str]:
    """Validate one exact AhmedML evaluator-owned native truth series."""

    if not isinstance(series, dict):
        return [f"{label}: series is not an object"]
    expected_fields = {
        "panel_id",
        "station_id",
        "quantity_id",
        "coordinate_id",
        "coordinate_unit",
        "coordinate",
        "value",
        "sample_count",
        "source",
    }
    errors: list[str] = []
    if set(series) != expected_fields:
        errors.append(f"{label}: series fields differ")
    panel_id, station_id, quantity_id, coordinate_id, start, stop = expected
    if (
        series.get("panel_id") != panel_id
        or series.get("station_id") != station_id
        or series.get("quantity_id") != quantity_id
        or series.get("coordinate_id") != coordinate_id
        or series.get("coordinate_unit") != "1"
        or series.get("sample_count") != AHMEDML_NATIVE_TRUTH_SAMPLES_PER_SERIES
        or series.get("source")
        != "evaluator_owned_frozen_native_cell_mapping"
    ):
        errors.append(f"{label}: series identity or source differs")
    coordinate = series.get("coordinate")
    values = series.get("value")
    sample_count = AHMEDML_NATIVE_TRUTH_SAMPLES_PER_SERIES
    if not finite_numbers(coordinate) or len(coordinate) != sample_count:
        errors.append(f"{label}: coordinate must contain 128 finite samples")
    else:
        expected_coordinate = [
            start + (stop - start) * index / (sample_count - 1)
            for index in range(sample_count)
        ]
        if any(
            not math.isclose(actual, target, rel_tol=0.0, abs_tol=2.0e-15)
            for actual, target in zip(coordinate, expected_coordinate, strict=True)
        ):
            errors.append(f"{label}: coordinate grid differs from the frozen uniform grid")
    if not finite_numbers(values) or len(values) != sample_count:
        errors.append(f"{label}: value must contain 128 finite native-CFD samples")
    return errors


def _ahmedml_common_header_errors(
    document: Any,
    *,
    schema: str,
    label: str,
) -> list[str]:
    if not isinstance(document, dict):
        return [f"{label}: document is not an object"]
    errors: list[str] = []
    if (
        document.get("schema") != schema
        or document.get("schema_version") != "1.0"
        or document.get("release_id") != AHMEDML_NATIVE_TRUTH_RELEASE_ID
        or document.get("dataset_id") != "ahmedml"
        or document.get("dataset_revision")
        != AHMEDML_NATIVE_TRUTH_DATASET_REVISION
        or document.get("source_identity_sha256")
        != AHMEDML_NATIVE_TRUTH_SOURCE_IDENTITY_SHA256
        or document.get("profile_definition_sha256")
        != AHMEDML_NATIVE_TRUTH_PROFILE_DEFINITION_SHA256
        or document.get("truth_source") != AHMEDML_NATIVE_TRUTH_SOURCE
    ):
        errors.append(f"{label}: immutable AhmedML header differs")
    return errors


def _ahmedml_support_lineage(
    submission_root: Path,
    specification: dict[str, Any],
    expected_by_case_set: dict[str, list[str]],
) -> tuple[dict[str, tuple[str, str]], list[str]]:
    """Read the checksum-bound support release and return case lineage pairs."""

    label = "ahmedml/native-profile-truth/support-release"
    errors: list[str] = []
    support = specification.get("scoring_support", {})
    declaration = support.get("candidate_manifest", {})
    spec_root = submission_root / "benchmark-specs" / "ahmedml"
    manifest_path = _safe_profile_path(
        spec_root, spec_root, declaration.get("manifest_file")
    )
    if manifest_path is None:
        errors.append(f"{label}: candidate manifest path is invalid")
        return {}, errors
    errors.extend(
        _file_binding_errors(
            manifest_path,
            declaration.get("manifest_sha256"),
            None,
            label,
        )
    )
    if not manifest_path.is_file():
        return {}, errors
    manifest = load_json(manifest_path)
    if (
        not isinstance(manifest, dict)
        or manifest.get("release_id") != declaration.get("release_id")
        or manifest.get("dataset_id") != "ahmedml"
    ):
        errors.append(f"{label}: support manifest header differs")
        return {}, errors
    case_set_records = {
        item.get("id"): item
        for item in manifest.get("case_sets", [])
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    }
    if set(case_set_records) != set(expected_by_case_set):
        errors.append(f"{label}: support case-set membership differs")
    lineage: dict[str, tuple[str, str]] = {}
    for case_set_id, expected_case_ids in expected_by_case_set.items():
        record = case_set_records.get(case_set_id, {})
        index_path = _safe_profile_path(
            manifest_path.parent,
            manifest_path.parent,
            record.get("index_file"),
        )
        errors.extend(
            _file_binding_errors(
                index_path,
                record.get("index_sha256"),
                None,
                f"{label}/{case_set_id}/index",
            )
        )
        if index_path is None or not index_path.is_file():
            continue
        index = load_json(index_path)
        if (
            index.get("release_id") != manifest.get("release_id")
            or index.get("dataset_id") != "ahmedml"
            or index.get("case_set_id") != case_set_id
            or index.get("case_count") != len(expected_case_ids)
        ):
            errors.append(f"{label}/{case_set_id}: support index header differs")
        flattened: list[str] = []
        for chunk_index, descriptor in enumerate(index.get("chunks", [])):
            chunk_label = f"{label}/{case_set_id}/chunk-{chunk_index:03d}"
            if not isinstance(descriptor, dict):
                errors.append(f"{chunk_label}: descriptor is not an object")
                continue
            chunk_path = _safe_profile_path(
                manifest_path.parent, index_path.parent, descriptor.get("file")
            )
            errors.extend(
                _file_binding_errors(
                    chunk_path,
                    descriptor.get("sha256"),
                    None,
                    chunk_label,
                )
            )
            if chunk_path is None or not chunk_path.is_file():
                continue
            chunk = load_json(chunk_path)
            cases = chunk.get("cases", []) if isinstance(chunk, dict) else []
            case_ids = [
                case.get("case_id") for case in cases if isinstance(case, dict)
            ]
            if (
                chunk.get("release_id") != manifest.get("release_id")
                or chunk.get("dataset_id") != "ahmedml"
                or chunk.get("case_set_id") != case_set_id
                or descriptor.get("case_ids") != case_ids
                or descriptor.get("case_count") != len(case_ids)
            ):
                errors.append(f"{chunk_label}: support chunk binding differs")
            flattened.extend(case_ids)
            for case in cases:
                if not isinstance(case, dict) or not isinstance(
                    case.get("support_instances"), list
                ):
                    errors.append(f"{chunk_label}: malformed support case")
                    continue
                case_id = case.get("case_id")
                instances = {
                    item.get("support_id"): item
                    for item in case["support_instances"]
                    if isinstance(item, dict)
                }
                cp = instances.get("ahmedml-surface-cp-profiles-v1", {})
                velocity = instances.get(
                    "ahmedml-volume-velocity-profiles-v1", {}
                )
                cp_parameters = cp.get("parameters", {})
                velocity_parameters = velocity.get("parameters", {})
                support_sha = cp_parameters.get("case_support_manifest_sha256")
                mapping_sha = cp_parameters.get("mapping_and_truth_sha256")
                if (
                    not valid_sha256(support_sha)
                    or not valid_sha256(mapping_sha)
                    or velocity_parameters.get("case_support_manifest_sha256")
                    != support_sha
                    or velocity_parameters.get("mapping_and_truth_sha256")
                    != mapping_sha
                    or cp_parameters.get("samples_per_station") != 128
                    or velocity_parameters.get("samples_per_station") != 128
                    or cp_parameters.get("station_count") != 3
                    or velocity_parameters.get("station_count") != 4
                ):
                    errors.append(
                        f"{chunk_label}/{case_id}: profile support lineage differs"
                    )
                    continue
                previous = lineage.setdefault(case_id, (support_sha, mapping_sha))
                if previous != (support_sha, mapping_sha):
                    errors.append(
                        f"{chunk_label}/{case_id}: duplicate support lineage differs"
                    )
        if flattened != expected_case_ids or len(set(flattened)) != len(flattened):
            errors.append(
                f"{label}/{case_set_id}: support cases are incomplete, duplicated, or reordered"
            )
    return lineage, errors


def ahmedml_native_bundle_errors(
    ground_truth_root: Path,
    dataset_manifest: dict[str, Any],
    submission_root: Path,
) -> list[str]:
    """Fail closed on the complete cross-repository AhmedML truth bundle."""

    label = "ahmedml/native-profile-truth-all316-v1"
    errors: list[str] = []
    declaration = dataset_manifest.get("native_profile_truth")
    expected_declaration = {
        "source_kind": "native_cfd",
        "analytical_dummy": False,
        "dataset_revision": AHMEDML_NATIVE_TRUTH_DATASET_REVISION,
        "source_identity_sha256": AHMEDML_NATIVE_TRUTH_SOURCE_IDENTITY_SHA256,
        "profile_definition_sha256": AHMEDML_NATIVE_TRUTH_PROFILE_DEFINITION_SHA256,
        "release_id": AHMEDML_NATIVE_TRUTH_RELEASE_ID,
        "case_count": AHMEDML_NATIVE_TRUTH_CASE_COUNT,
        "case_set_count": AHMEDML_NATIVE_TRUTH_CASE_SET_COUNT,
        "series_per_case": AHMEDML_NATIVE_TRUTH_SERIES_PER_CASE,
        "samples_per_series": AHMEDML_NATIVE_TRUTH_SAMPLES_PER_SERIES,
        "master_index_file": "datasets/ahmedml/native-all316-v1/index.json",
    }
    if (
        not isinstance(declaration, dict)
        or set(declaration) != {*expected_declaration, "master_index_sha256"}
        or any(declaration.get(key) != value for key, value in expected_declaration.items())
        or not valid_sha256(declaration.get("master_index_sha256"))
    ):
        return [f"{label}: public native-CFD declaration differs"]

    spec_root = submission_root / "benchmark-specs" / "ahmedml"
    specification = load_json(spec_root / "submission-spec.json")
    profile_binding = specification.get("profile_definition", {})
    profile_path = _safe_profile_path(
        spec_root, spec_root, profile_binding.get("file")
    )
    errors.extend(
        _file_binding_errors(
            profile_path,
            profile_binding.get("sha256"),
            None,
            f"{label}/profile-definition",
        )
    )
    source_binding = specification.get("scoring_support", {}).get(
        "dataset_source", {}
    )
    source_path = _safe_profile_path(
        spec_root, spec_root, source_binding.get("identity_file")
    )
    errors.extend(
        _file_binding_errors(
            source_path,
            source_binding.get("identity_sha256"),
            None,
            f"{label}/source-identity",
        )
    )
    if (
        profile_binding.get("sha256")
        != AHMEDML_NATIVE_TRUTH_PROFILE_DEFINITION_SHA256
        or profile_binding.get("sample_count_per_series") != 128
        or source_binding.get("revision") != AHMEDML_NATIVE_TRUTH_DATASET_REVISION
        or source_binding.get("identity_sha256")
        != AHMEDML_NATIVE_TRUTH_SOURCE_IDENTITY_SHA256
    ):
        errors.append(f"{label}: submission source/profile binding differs")

    spec_splits = {
        item.get("id"): item
        for item in specification.get("splits", [])
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    }
    website_splits = {
        item.get("id"): item
        for item in dataset_manifest.get("splits", [])
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    }
    if set(spec_splits) != set(website_splits) or len(spec_splits) != 8:
        errors.append(f"{label}: website split inventory differs")
    expected_by_case_set: dict[str, list[str]] = {}
    for split_id, split in spec_splits.items():
        split_path = _safe_profile_path(
            spec_root, spec_root, split.get("index_file")
        )
        errors.extend(
            _file_binding_errors(
                split_path,
                split.get("sha256"),
                None,
                f"{label}/split-{split_id}",
            )
        )
        if split_path is None or not split_path.is_file():
            continue
        split_index = load_json(split_path)
        case_ids = split_index.get("case_ids", [])
        case_set_id = split.get("case_set_id")
        if (
            not isinstance(case_ids, list)
            or len(case_ids) != split.get("case_count")
            or len(set(case_ids)) != len(case_ids)
            or split_index.get("split_id") != split_id
            or split_index.get("case_set_id") != case_set_id
        ):
            errors.append(f"{label}/split-{split_id}: split index differs")
            continue
        previous = expected_by_case_set.setdefault(case_set_id, case_ids)
        if previous != case_ids:
            errors.append(f"{label}/{case_set_id}: shared split cases differ")
        website = website_splits.get(split_id, {})
        if (
            website.get("case_set_id") != case_set_id
            or website.get("case_count") != len(case_ids)
        ):
            errors.append(f"{label}/split-{split_id}: website mapping differs")

    support_lineage, support_errors = _ahmedml_support_lineage(
        submission_root, specification, expected_by_case_set
    )
    errors.extend(support_errors)

    master_path = _safe_profile_path(
        ground_truth_root,
        ground_truth_root,
        declaration.get("master_index_file"),
    )
    errors.extend(
        _file_binding_errors(
            master_path,
            declaration.get("master_index_sha256"),
            None,
            f"{label}/master-index",
        )
    )
    if master_path is None or not master_path.is_file():
        return errors
    master = load_json(master_path)
    expected_master_fields = {
        "schema",
        "schema_version",
        "release_id",
        "status",
        "usage",
        "generated_at",
        "dataset_id",
        "dataset_repository",
        "dataset_revision",
        "source_identity_sha256",
        "profile_definition_sha256",
        "truth_source",
        "case_count",
        "case_ids",
        "case_set_count",
        "case_sets",
        "series_per_case",
        "samples_per_series",
        "derivation",
    }
    if not isinstance(master, dict) or set(master) != expected_master_fields:
        errors.append(f"{label}: master index fields differ")
        return errors
    errors.extend(
        _ahmedml_common_header_errors(
            master, schema=AHMEDML_NATIVE_TRUTH_MASTER_SCHEMA, label=label
        )
    )
    if (
        master.get("status") != "candidate_owner_review_required"
        or master.get("usage")
        != "browser_visualization_only_not_metric_recomputation"
        or master.get("dataset_repository") != "neashton/ahmedml"
        or master.get("case_count") != AHMEDML_NATIVE_TRUTH_CASE_COUNT
        or master.get("case_set_count") != AHMEDML_NATIVE_TRUTH_CASE_SET_COUNT
        or master.get("series_per_case") != AHMEDML_NATIVE_TRUTH_SERIES_PER_CASE
        or master.get("samples_per_series")
        != AHMEDML_NATIVE_TRUTH_SAMPLES_PER_SERIES
        or master.get("derivation")
        != "exact_truth_arrays_from_checksum_verified_evaluator_case_support"
        or not isinstance(master.get("generated_at"), str)
        or not master["generated_at"].endswith("Z")
    ):
        errors.append(f"{label}: master release declaration differs")

    expected_case_ids = sorted(
        {case_id for cases in expected_by_case_set.values() for case_id in cases},
        key=lambda value: int(value.removeprefix("run_")),
    )
    if master.get("case_ids") != expected_case_ids or len(expected_case_ids) != 316:
        errors.append(f"{label}: master case order or membership differs")
    master_case_sets = {
        item.get("case_set_id"): item
        for item in master.get("case_sets", [])
        if isinstance(item, dict)
    }
    public_case_sets = {
        item.get("id"): item
        for item in dataset_manifest.get("case_sets", [])
        if isinstance(item, dict)
    }
    if (
        set(master_case_sets) != set(expected_by_case_set)
        or set(public_case_sets) != set(expected_by_case_set)
    ):
        errors.append(f"{label}: case-set membership differs")

    seen_cases: dict[str, str] = {}
    for case_set_id, expected_cases in expected_by_case_set.items():
        record = master_case_sets.get(case_set_id, {})
        public = public_case_sets.get(case_set_id, {})
        index_path = _safe_profile_path(
            master_path.parent, master_path.parent, record.get("file")
        )
        errors.extend(
            _file_binding_errors(
                index_path,
                record.get("sha256"),
                record.get("size_bytes"),
                f"{label}/{case_set_id}/index",
            )
        )
        expected_public_file = (
            f"datasets/ahmedml/native-all316-v1/{case_set_id}/index.json"
        )
        if (
            record.get("case_count") != len(expected_cases)
            or record.get("case_id_status") != "official"
            or public.get("index_file") != expected_public_file
            or public.get("index_sha256") != record.get("sha256")
            or public.get("case_count") != len(expected_cases)
            or public.get("case_id_status") != "official"
        ):
            errors.append(f"{label}/{case_set_id}: public/master binding differs")
        if index_path is None or not index_path.is_file():
            continue
        index = load_json(index_path)
        expected_index_fields = {
            "schema",
            "schema_version",
            "release_id",
            "status",
            "usage",
            "dataset_id",
            "dataset_revision",
            "source_identity_sha256",
            "profile_definition_sha256",
            "truth_source",
            "case_set_id",
            "case_id_status",
            "case_count",
            "case_ids",
            "series_per_case",
            "samples_per_series",
            "chunks",
        }
        if not isinstance(index, dict) or set(index) != expected_index_fields:
            errors.append(f"{label}/{case_set_id}: index fields differ")
            continue
        errors.extend(
            _ahmedml_common_header_errors(
                index,
                schema=AHMEDML_NATIVE_TRUTH_INDEX_SCHEMA,
                label=f"{label}/{case_set_id}",
            )
        )
        if (
            index.get("status") != "candidate_owner_review_required"
            or index.get("usage")
            != "browser_visualization_only_not_metric_recomputation"
            or index.get("case_set_id") != case_set_id
            or index.get("case_id_status") != "official"
            or index.get("case_count") != len(expected_cases)
            or index.get("case_ids") != expected_cases
            or index.get("series_per_case") != 7
            or index.get("samples_per_series") != 128
        ):
            errors.append(f"{label}/{case_set_id}: index contract differs")
        flattened: list[str] = []
        for chunk_index, descriptor in enumerate(index.get("chunks", [])):
            chunk_label = f"{label}/{case_set_id}/chunk-{chunk_index:03d}"
            if not isinstance(descriptor, dict) or set(descriptor) != {
                "file",
                "sha256",
                "size_bytes",
                "case_count",
                "case_ids",
                "series_count",
            }:
                errors.append(f"{chunk_label}: descriptor fields differ")
                continue
            chunk_path = _safe_profile_path(
                master_path.parent, index_path.parent, descriptor.get("file")
            )
            errors.extend(
                _file_binding_errors(
                    chunk_path,
                    descriptor.get("sha256"),
                    descriptor.get("size_bytes"),
                    chunk_label,
                )
            )
            if chunk_path is None or not chunk_path.is_file():
                continue
            chunk = load_json(chunk_path)
            expected_chunk_fields = {
                "schema",
                "schema_version",
                "release_id",
                "dataset_id",
                "dataset_revision",
                "source_identity_sha256",
                "profile_definition_sha256",
                "case_set_id",
                "truth_source",
                "case_count",
                "case_ids",
                "series_per_case",
                "samples_per_series",
                "cases",
            }
            if not isinstance(chunk, dict) or set(chunk) != expected_chunk_fields:
                errors.append(f"{chunk_label}: chunk fields differ")
                continue
            errors.extend(
                _ahmedml_common_header_errors(
                    chunk,
                    schema=AHMEDML_NATIVE_TRUTH_CHUNK_SCHEMA,
                    label=chunk_label,
                )
            )
            cases = chunk.get("cases", [])
            case_ids = [
                case.get("case_id") for case in cases if isinstance(case, dict)
            ]
            if (
                chunk.get("case_set_id") != case_set_id
                or chunk.get("case_count") != len(cases)
                or chunk.get("case_ids") != case_ids
                or chunk.get("series_per_case") != 7
                or chunk.get("samples_per_series") != 128
                or descriptor.get("case_count") != len(cases)
                or descriptor.get("case_ids") != case_ids
                or descriptor.get("series_count") != len(cases) * 7
            ):
                errors.append(f"{chunk_label}: chunk descriptor/header differs")
            flattened.extend(case_ids)
            for case_index, case in enumerate(cases):
                case_label = f"{chunk_label}/case-{case_index}"
                if not isinstance(case, dict) or set(case) != {
                    "case_id",
                    "truth_source",
                    "lineage",
                    "series",
                }:
                    errors.append(f"{case_label}: case fields differ")
                    continue
                case_id = case.get("case_id")
                lineage = case.get("lineage")
                if case.get("truth_source") != AHMEDML_NATIVE_TRUTH_SOURCE:
                    errors.append(f"{case_label}: truth source differs")
                expected_lineage = support_lineage.get(case_id)
                if (
                    not isinstance(lineage, dict)
                    or set(lineage)
                    != {
                        "case_support_sha256",
                        "profile_mapping_and_truth_sha256",
                        "profile_definition_sha256",
                    }
                    or expected_lineage is None
                    or lineage.get("case_support_sha256") != expected_lineage[0]
                    or lineage.get("profile_mapping_and_truth_sha256")
                    != expected_lineage[1]
                    or lineage.get("profile_definition_sha256")
                    != AHMEDML_NATIVE_TRUTH_PROFILE_DEFINITION_SHA256
                ):
                    errors.append(f"{case_label}: cross-repository lineage differs")
                series = case.get("series")
                if not isinstance(series, list) or len(series) != 7:
                    errors.append(f"{case_label}: case must contain seven series")
                else:
                    for series_index, (item, expected) in enumerate(
                        zip(series, AHMEDML_NATIVE_TRUTH_SERIES, strict=True)
                    ):
                        errors.extend(
                            ahmedml_series_errors(
                                item,
                                expected,
                                f"{case_label}/series-{series_index}",
                            )
                        )
                fingerprint = hashlib.sha256(
                    canonical_json_bytes(case)
                ).hexdigest()
                previous = seen_cases.setdefault(case_id, fingerprint)
                if previous != fingerprint:
                    errors.append(f"{case_label}: duplicate case payload differs")
        if flattened != expected_cases or len(set(flattened)) != len(flattened):
            errors.append(
                f"{label}/{case_set_id}: truth cases are incomplete, duplicated, or reordered"
            )
    if set(seen_cases) != set(expected_case_ids):
        errors.append(f"{label}: complete truth case coverage differs")
    return errors


def hiliftaeroml_compact_truth_errors(
    ground_truth_root: Path,
    dataset_manifest: dict[str, Any],
    submission_root: Path,
) -> list[str]:
    label = "hiliftaeroml/compact-all1355-v1"
    errors: list[str] = []
    declaration = dataset_manifest.get("compact_profile_truth")
    expected_declaration = {
        "source_kind": "native_cfd",
        "analytical_dummy": False,
        "plot_only": True,
        "release_id": HILIFT_COMPACT_TRUTH_RELEASE_ID,
        "format": HILIFT_COMPACT_TRUTH_FORMAT,
        "profile_contract_id": HILIFT_COMPACT_PROFILE_CONTRACT_ID,
        "profile_contract_sha256": HILIFT_COMPACT_PROFILE_CONTRACT_SHA256,
        "case_count": HILIFT_COMPACT_TRUTH_CASE_COUNT,
        "case_set_count": HILIFT_COMPACT_TRUTH_CASE_SET_COUNT,
        "master_index_file": (
            "datasets/hiliftaeroml/compact-all1355-v1/index.json"
        ),
    }
    if (
        not isinstance(declaration, dict)
        or any(
            declaration.get(key) != value
            for key, value in expected_declaration.items()
        )
        or not valid_sha256(declaration.get("master_index_sha256"))
        or set(declaration) != {
            *expected_declaration,
            "master_index_sha256",
        }
    ):
        return [f"{label}: public compact Native CFD declaration differs"]

    spec_root = submission_root / "benchmark-specs" / "hiliftaeroml"
    spec = load_json(spec_root / "submission-spec.json")
    compact_definition = spec.get("profile_definition", {})
    public_binding = compact_definition.get("public_plot_ground_truth", {})
    binding_path = spec_root / str(public_binding.get("binding_file", ""))
    ground_truth_manifest = load_json(ground_truth_root / "manifest.json")
    ground_truth_manifest_sha = sha256_file(ground_truth_root / "manifest.json")

    spec_split_list = [
        split for split in spec.get("splits", []) if isinstance(split, dict)
    ]
    spec_splits = {split.get("id"): split for split in spec_split_list}
    website_split_list = [
        split
        for split in dataset_manifest.get("splits", [])
        if isinstance(split, dict)
    ]
    website_splits = {split.get("id"): split for split in website_split_list}
    if (
        len(spec_splits) != 14
        or len(website_splits) != 14
        or set(spec_splits) != set(website_splits)
    ):
        errors.append(
            f"{label}: website split inventory differs from the 14-split submission contract"
        )
    for split_id, split in spec_splits.items():
        website_split = website_splits.get(split_id, {})
        if any(
            website_split.get(key) != split.get(key)
            for key in ("label", "case_set_id", "case_count")
        ):
            errors.append(
                f"{label}/{split_id}: website case-set, label, or count binding is stale"
            )

    expected_binding_splits = [
        {
            "split_id": split.get("id"),
            "case_set_id": split.get("case_set_id"),
            "case_count": split.get("case_count"),
        }
        for split in spec_split_list
    ]
    expected_public_binding = {
        "schema": "hiliftaeroml-public-compact-profile-truth-binding-v1",
        "schema_version": "1.0",
        "status": "public_plot_only_candidate",
        "usage": "browser_visualization_only_not_metric_recomputation",
        "activation_effect": "none",
        "dataset_id": "hiliftaeroml",
        "case_count": HILIFT_COMPACT_TRUTH_CASE_COUNT,
        "case_set_count": HILIFT_COMPACT_TRUTH_CASE_SET_COUNT,
        "splits": expected_binding_splits,
        "profile_contract_id": HILIFT_COMPACT_PROFILE_CONTRACT_ID,
        "profile_contract_sha256": HILIFT_COMPACT_PROFILE_CONTRACT_SHA256,
        "truth_release": {
            "release_id": HILIFT_COMPACT_TRUTH_RELEASE_ID,
            "format": HILIFT_COMPACT_TRUTH_FORMAT,
            "source_kind": "native_cfd",
            "analytical_dummy": False,
            "plot_only": True,
            "contains_scoring_weights": False,
            "repository": "https://github.com/neilashton/fluidsbench",
            "source_ref": "dev",
            "site_manifest_release_id": ground_truth_manifest["data_release"]["id"],
            "site_manifest_url": (
                "https://fluidsbench.org/assets/data/profile-ground-truth/"
                "manifest.json"
            ),
            "site_manifest_sha256": ground_truth_manifest_sha,
            "master_index_url": (
                "https://fluidsbench.org/assets/data/profile-ground-truth/"
                "datasets/hiliftaeroml/compact-all1355-v1/index.json"
            ),
            "master_index_sha256": declaration["master_index_sha256"],
        },
        "scoring_truth": {
            "release_id": HILIFT_NATIVE_TRUTH_RELEASE_ID,
            "manifest_sha256": HILIFT_NATIVE_TRUTH_MANIFEST_SHA256,
            "published": False,
            "relationship": (
                "the public plot release is a float32 visualization projection "
                "and does not replace this evaluator-owned scoring truth"
            ),
        },
    }
    if (
        compact_definition.get("status") != "official"
        or compact_definition.get("accepted_profile_formats")
        != [HILIFT_COMPACT_PREDICTION_FORMAT]
        or compact_definition.get("prior_profile_formats_accepted") is not False
        or compact_definition.get("contract_id")
        != HILIFT_COMPACT_PROFILE_CONTRACT_ID
        or compact_definition.get("sha256")
        != HILIFT_COMPACT_PROFILE_CONTRACT_SHA256
        or public_binding.get("status") != "public_plot_only_candidate"
        or public_binding.get("usage")
        != "browser_visualization_only_not_metric_recomputation"
        or public_binding.get("activation_effect") != "none"
        or public_binding.get("binding_file")
        != "public-compact-profile-truth-binding-v1.json"
        or not binding_path.is_file()
        or public_binding.get("binding_sha256") != sha256_file(binding_path)
        or load_json(binding_path) != expected_public_binding
    ):
        errors.append(
            f"{label}: submission repository public plot binding differs"
        )

    expected_case_ids: dict[str, list[str]] = {}
    expected_case_set_order: list[str] = []
    for split in spec_split_list:
        split_id = split.get("id")
        case_set_id = split.get("case_set_id")
        split_path = spec_root / str(split.get("index_file", ""))
        if (
            not split_path.is_file()
            or split.get("sha256") != sha256_file(split_path)
        ):
            errors.append(
                f"{label}/{split_id}: official split file or SHA-256 differs"
            )
            continue
        split_index = load_json(split_path)
        split_case_ids = split_index.get("case_ids")
        if (
            split_index.get("dataset_id") != "hiliftaeroml"
            or split_index.get("split_id") != split_id
            or split_index.get("case_set_id") != case_set_id
            or split_index.get("case_count") != split.get("case_count")
            or split_index.get("case_id_status") != "official"
            or not isinstance(split_case_ids, list)
            or len(split_case_ids) != split.get("case_count")
            or len(set(split_case_ids)) != len(split_case_ids)
        ):
            errors.append(
                f"{label}/{split_id}: official ordered split contract differs"
            )
            continue
        if case_set_id not in expected_case_ids:
            expected_case_set_order.append(case_set_id)
            expected_case_ids[case_set_id] = split_case_ids
        elif expected_case_ids[case_set_id] != split_case_ids:
            errors.append(
                f"{label}/{split_id}: aliases of one case set have different cases"
            )

    if (
        len(expected_case_ids) != HILIFT_COMPACT_TRUTH_CASE_SET_COUNT
        or len(set().union(*(set(ids) for ids in expected_case_ids.values())))
        != HILIFT_COMPACT_TRUTH_CASE_COUNT
    ):
        errors.append(
            f"{label}: official split files do not resolve to 8 case sets and 1,355 unique cases"
        )

    case_sets = {
        case_set.get("id"): case_set
        for case_set in dataset_manifest.get("case_sets", [])
        if isinstance(case_set, dict)
    }
    if set(case_sets) != set(expected_case_ids):
        errors.append(
            f"{label}: website case-set inventory differs from all official case sets"
        )

    master_path = _safe_profile_path(
        ground_truth_root,
        ground_truth_root,
        declaration.get("master_index_file"),
    )
    if master_path is None or not master_path.is_file():
        return [*errors, f"{label}: compact truth master index is missing or unsafe"]
    errors.extend(
        _file_binding_errors(
            master_path,
            declaration.get("master_index_sha256"),
            None,
            f"{label}/master-index",
        )
    )
    master = load_json(master_path)
    master_case_ids = master.get("case_ids")
    master_case_sets = master.get("case_sets")
    master_common = master.get("common_support", {})
    official_unique_case_ids = sorted(
        set().union(*(set(ids) for ids in expected_case_ids.values()))
    )
    if (
        master.get("schema") != HILIFT_COMPACT_TRUTH_MASTER_INDEX_SCHEMA
        or master.get("schema_version") != "1.0"
        or master.get("format") != HILIFT_COMPACT_TRUTH_FORMAT
        or master.get("release_id") != HILIFT_COMPACT_TRUTH_RELEASE_ID
        or master.get("status") != "public_plot_only_candidate"
        or master.get("usage")
        != "browser_visualization_only_not_metric_recomputation"
        or master.get("dataset_id") != "hiliftaeroml"
        or master.get("profile_contract_id")
        != HILIFT_COMPACT_PROFILE_CONTRACT_ID
        or master.get("profile_contract_sha256")
        != HILIFT_COMPACT_PROFILE_CONTRACT_SHA256
        or master.get("source_profile_truth_release_id")
        != HILIFT_NATIVE_TRUTH_RELEASE_ID
        or master.get("source_profile_truth_manifest_sha256")
        != HILIFT_NATIVE_TRUTH_MANIFEST_SHA256
        or master.get("source_prerequisite_authority_index_sha256")
        != HILIFT_PREREQUISITE_AUTHORITY_INDEX_SHA256
        or master.get("case_count") != HILIFT_COMPACT_TRUTH_CASE_COUNT
        or master_case_ids != official_unique_case_ids
        or master.get("case_set_count")
        != HILIFT_COMPACT_TRUTH_CASE_SET_COUNT
        or not isinstance(master_case_sets, list)
        or len(master_case_sets) != HILIFT_COMPACT_TRUTH_CASE_SET_COUNT
        or len(
            {
                entry.get("case_set_id")
                for entry in master_case_sets
                if isinstance(entry, dict)
            }
        )
        != HILIFT_COMPACT_TRUTH_CASE_SET_COUNT
        or master.get("coverage")
        != "all_official_case_sets_deduplicated"
        or master.get("cp_resolution", {}).get(
            "maximum_points_per_physical_graph"
        )
        != 128
        or master.get("cp_resolution", {}).get(
            "resampling_during_publication"
        )
        is not False
        or master.get("plot_precision")
        != {
            "coordinates": "float32",
            "truth_values": "float32",
            "scoring_values": "not_included",
        }
    ):
        errors.append(
            f"{label}: master index coverage, provenance, or compact contract differs"
        )

    master_case_set_map = {
        entry.get("case_set_id"): entry
        for entry in master_case_sets or []
        if isinstance(entry, dict)
    }
    if list(master_case_set_map) != expected_case_set_order:
        errors.append(
            f"{label}: master case-set order differs from the official split inventory"
        )

    common_path = _safe_profile_path(
        ground_truth_root, master_path.parent, master_common.get("file")
    )
    common_arrays: dict[str, tuple[str, int, bytes]] = {}
    if common_path is None or not common_path.is_file():
        errors.append(
            f"{label}: shared velocity plot support is missing or unsafe"
        )
    else:
        errors.extend(
            _file_binding_errors(
                common_path,
                master_common.get("sha256"),
                master_common.get("byte_size"),
                f"{label}/common-support",
            )
        )
        try:
            common_arrays = _compact_npz_arrays(
                common_path,
                [
                    "velocity_coordinate_in",
                    "velocity_valid_mask",
                    "velocity_station_row_offsets",
                ],
                f"{label}/common-support",
            )
            if (
                master_common.get("row_count") != 4005
                or master_common.get("rows_per_station") != 801
                or master_common.get("station_order")
                != ["B.2", "B.3", "C.1", "C.2", "C.3"]
                or common_arrays["velocity_coordinate_in"][:2]
                != ("<f4", 4005)
                or common_arrays["velocity_valid_mask"][:2]
                != ("|b1", 4005)
                or common_arrays["velocity_station_row_offsets"][:2]
                != ("<i4", 6)
                or _unpack_i4(
                    common_arrays["velocity_station_row_offsets"][2]
                )
                != [0, 801, 1602, 2403, 3204, 4005]
                or any(
                    value not in {0, 1}
                    for value in common_arrays["velocity_valid_mask"][2]
                )
                or not _all_finite_f4(
                    common_arrays["velocity_coordinate_in"][2]
                )
            ):
                errors.append(
                    f"{label}: shared velocity plot arrays differ from the 5 x 801 contract"
                )
        except ValueError as error:
            errors.append(str(error))
    valid_velocity_count = (
        sum(common_arrays["velocity_valid_mask"][2])
        if "velocity_valid_mask" in common_arrays
        else None
    )

    truth_metadata: dict[str, dict[str, Any]] = {}
    truth_case_records: dict[str, dict[str, Any]] = {}
    indexed_ids_by_case_set: dict[str, list[str]] = {}
    for case_set_id in expected_case_set_order:
        case_label = f"{label}/{case_set_id}"
        expected_ids = expected_case_ids[case_set_id]
        site_case_set = case_sets.get(case_set_id)
        master_case_set = master_case_set_map.get(case_set_id)
        if not isinstance(site_case_set, dict):
            errors.append(f"{case_label}: website case-set declaration is missing")
            continue
        index_path = _safe_profile_path(
            ground_truth_root,
            ground_truth_root,
            site_case_set.get("index_file"),
        )
        if index_path is None or not index_path.is_file():
            errors.append(f"{case_label}: thin index is missing or unsafe")
            continue
        index_sha = sha256_file(index_path)
        descriptor_path = (
            _safe_profile_path(
                ground_truth_root,
                master_path.parent,
                master_case_set.get("file"),
            )
            if isinstance(master_case_set, dict)
            else None
        )
        if (
            site_case_set.get("index_sha256") != index_sha
            or site_case_set.get("case_count") != len(expected_ids)
            or site_case_set.get("coverage") != COMPLETE_COVERAGE
            or site_case_set.get("case_id_status") != "official"
            or site_case_set.get("truth_role")
            != "native_cfd_plot_only_not_scoring_source"
            or not isinstance(master_case_set, dict)
            or master_case_set.get("sha256") != index_sha
            or master_case_set.get("case_count") != len(expected_ids)
            or master_case_set.get("byte_size") != index_path.stat().st_size
            or descriptor_path != index_path.resolve()
        ):
            errors.append(
                f"{case_label}: manifest/master checksum, count, coverage, or path binding differs"
            )

        index = load_json(index_path)
        chunks = index.get("chunks")
        indexed_case_ids = [
            listed_case_id
            for chunk in chunks or []
            if isinstance(chunk, dict)
            for listed_case_id in chunk.get("case_ids", [])
        ]
        indexed_ids_by_case_set[case_set_id] = indexed_case_ids
        if (
            index.get("schema") != HILIFT_COMPACT_TRUTH_INDEX_SCHEMA
            or index.get("schema_version") != "1.0"
            or index.get("format") != HILIFT_COMPACT_TRUTH_FORMAT
            or index.get("release_id") != HILIFT_COMPACT_TRUTH_RELEASE_ID
            or index.get("status") != "public_plot_only_candidate"
            or index.get("usage")
            != "browser_visualization_only_not_metric_recomputation"
            or index.get("dataset_id") != "hiliftaeroml"
            or index.get("case_set_id") != case_set_id
            or index.get("profile_contract_id")
            != HILIFT_COMPACT_PROFILE_CONTRACT_ID
            or index.get("profile_contract_sha256")
            != HILIFT_COMPACT_PROFILE_CONTRACT_SHA256
            or index.get("source_profile_truth_release_id")
            != HILIFT_NATIVE_TRUTH_RELEASE_ID
            or index.get("source_profile_truth_manifest_sha256")
            != HILIFT_NATIVE_TRUTH_MANIFEST_SHA256
            or index.get("source_prerequisite_authority_index_sha256")
            != HILIFT_PREREQUISITE_AUTHORITY_INDEX_SHA256
            or index.get("case_count") != len(expected_ids)
            or index.get("case_ids") != expected_ids
            or indexed_case_ids != expected_ids
            or index.get("common_support") != master_common
            or not isinstance(chunks, list)
            or len(chunks) != math.ceil(len(expected_ids) / 10)
        ):
            errors.append(
                f"{case_label}: thin index coverage, provenance, or contract differs"
            )
            chunks = chunks if isinstance(chunks, list) else []

        loaded_case_ids: list[str] = []
        for chunk_index, chunk_ref in enumerate(chunks):
            chunk_label = f"{case_label}/chunk-{chunk_index:03d}"
            expected_chunk_ids = expected_ids[
                chunk_index * 10 : (chunk_index + 1) * 10
            ]
            chunk_path = _safe_profile_path(
                ground_truth_root, index_path.parent, chunk_ref.get("file")
            )
            if (
                chunk_ref.get("chunk_id") != f"chunk-{chunk_index:03d}"
                or chunk_ref.get("case_count") != len(expected_chunk_ids)
                or chunk_ref.get("case_ids") != expected_chunk_ids
                or not 1 <= len(expected_chunk_ids) <= 10
            ):
                errors.append(
                    f"{chunk_label}: thin-index chunk order or count differs"
                )
            if chunk_path is None or not chunk_path.is_file():
                errors.append(f"{chunk_label}: chunk is missing or unsafe")
                continue
            errors.extend(
                _file_binding_errors(
                    chunk_path,
                    chunk_ref.get("sha256"),
                    chunk_ref.get("byte_size"),
                    chunk_label,
                )
            )
            chunk = load_json(chunk_path)
            chunk_case_ids = [
                case.get("case_id")
                for case in chunk.get("cases", [])
                if isinstance(case, dict)
            ]
            if (
                chunk.get("schema")
                != HILIFT_COMPACT_TRUTH_CHUNK_SCHEMA
                or chunk.get("schema_version") != "1.0"
                or chunk.get("format") != HILIFT_COMPACT_TRUTH_FORMAT
                or chunk.get("release_id")
                != HILIFT_COMPACT_TRUTH_RELEASE_ID
                or chunk.get("dataset_id") != "hiliftaeroml"
                or chunk.get("case_set_id") != case_set_id
                or chunk.get("case_ids") != expected_chunk_ids
                or chunk_case_ids != expected_chunk_ids
                or chunk.get("case_count") != len(expected_chunk_ids)
            ):
                errors.append(
                    f"{chunk_label}: chunk schema, count, or ordered cases differ"
                )
            loaded_case_ids.extend(chunk_case_ids)
            for case in chunk.get("cases", []):
                if not isinstance(case, dict):
                    continue
                case_id = case.get("case_id")
                artifact_label = f"{case_label}/{case_id}"
                existing_case = truth_case_records.get(case_id)
                if existing_case is not None:
                    if case != existing_case:
                        errors.append(
                            f"{artifact_label}: duplicate case metadata differs between case sets"
                        )
                    continue
                truth_case_records[case_id] = case
                artifact = case.get("artifact", {})
                artifact_path = _safe_profile_path(
                    ground_truth_root,
                    index_path.parent,
                    artifact.get("file"),
                )
                source_support = case.get("source_support", {})
                cp = case.get("surface_cp", {})
                velocity = case.get("volume_velocity", {})
                if (
                    case.get("truth_source")
                    != {
                        "source_kind": "native_cfd",
                        "analytical_dummy": False,
                        "role": "plot_only_not_scoring_source",
                    }
                    or source_support.get("construction")
                    != "compact_profile_v2_from_frozen_prerequisite_authority"
                    or source_support.get("prediction_outputs_used_as_source")
                    is not False
                    or any(
                        not valid_sha256(source_support.get(key))
                        for key in (
                            "authority_case_identity_sha256",
                            "cp_stencil_identity_sha256",
                            "native_truth_artifact_sha256",
                            "native_truth_case_record_sha256",
                            "validity_identity_sha256",
                            "velocity_stencil_identity_sha256",
                        )
                    )
                    or not valid_sha256(cp.get("support_identity_sha256"))
                    or not valid_sha256(cp.get("prediction_order_sha256"))
                    or cp.get("maximum_points_per_physical_graph") != 128
                    or cp.get("station_order")
                    != list("ABCDEFGHIJ")
                    or cp.get("quantization_scale") != 1024
                    or cp.get("quantization_dtype") != "int16"
                    or cp.get("delta_dtype") != "int16"
                    or not valid_sha256(
                        velocity.get("support_identity_sha256")
                    )
                    or not valid_sha256(
                        velocity.get("prediction_order_sha256")
                    )
                    or velocity.get("station_order")
                    != ["B.2", "B.3", "C.1", "C.2", "C.3"]
                    or velocity.get("row_count") != 4005
                    or velocity.get("valid_row_count") != valid_velocity_count
                    or velocity.get("invalid_row_count") != 14
                ):
                    errors.append(
                        f"{artifact_label}: native truth or compact support identities differ"
                    )
                if artifact_path is None or not artifact_path.is_file():
                    errors.append(
                        f"{artifact_label}: plot truth artifact is missing or unsafe"
                    )
                    continue
                errors.extend(
                    _file_binding_errors(
                        artifact_path,
                        artifact.get("sha256"),
                        artifact.get("byte_size"),
                        artifact_label,
                    )
                )
                try:
                    arrays = _compact_npz_arrays(
                        artifact_path,
                        [
                            "cp_x_in",
                            "cp_truth",
                            "cp_branch_point_offsets",
                            "cp_branch_row_code",
                            "velocity_truth_speed_over_u_inf",
                        ],
                        artifact_label,
                    )
                    cp_points = cp.get("retained_point_count")
                    cp_branches = cp.get("retained_branch_count")
                    velocity_values = velocity.get("valid_row_count")
                    offsets = _unpack_i4(
                        arrays["cp_branch_point_offsets"][2]
                    )
                    rows = list(arrays["cp_branch_row_code"][2])
                    if (
                        arrays["cp_x_in"][:2] != ("<f4", cp_points)
                        or arrays["cp_truth"][:2] != ("<f4", cp_points)
                        or arrays["cp_branch_point_offsets"][:2]
                        != ("<i4", cp_branches + 1)
                        or arrays["cp_branch_row_code"][:2]
                        != ("|u1", cp_branches)
                        or arrays[
                            "velocity_truth_speed_over_u_inf"
                        ][:2]
                        != ("<f4", velocity_values)
                        or velocity_values != valid_velocity_count
                        or not offsets
                        or offsets[0] != 0
                        or offsets[-1] != cp_points
                        or any(
                            right <= left
                            for left, right in zip(
                                offsets, offsets[1:]
                            )
                        )
                        or set(rows) != set(range(10))
                        or not _all_finite_f4(arrays["cp_x_in"][2])
                        or not _all_finite_f4(arrays["cp_truth"][2])
                        or not _all_finite_f4(
                            arrays[
                                "velocity_truth_speed_over_u_inf"
                            ][2],
                            nonnegative=True,
                        )
                    ):
                        errors.append(
                            f"{artifact_label}: plot arrays differ from bound support counts or values"
                        )
                except (TypeError, ValueError) as error:
                    errors.append(str(error))
                truth_metadata[case_id] = {
                    "surface_cp": cp,
                    "volume_velocity": velocity,
                }
        if loaded_case_ids != expected_ids:
            errors.append(
                f"{case_label}: loaded chunk cases differ from the official index"
            )

    if (
        len(truth_metadata) != HILIFT_COMPACT_TRUTH_CASE_COUNT
        or set(truth_metadata) != set(official_unique_case_ids)
    ):
        errors.append(
            f"{label}: truth metadata does not cover all 1,355 unique cases"
        )

    full_case_ids = indexed_ids_by_case_set.get(
        HILIFT_COMPACT_CASE_SET_ID, []
    )
    preview_root = (
        submission_root
        / "submissions"
        / "hiliftaeroml"
        / HILIFT_COMPACT_PREVIEW_SUBMISSION_ID
    )
    submission_path = preview_root / "submission.json"
    if not submission_path.is_file():
        return [
            *errors,
            f"{label}: registered compact Full360 preview is missing",
        ]
    submission = load_json(submission_path)
    profile_data = submission.get("profile_data", {})
    prediction_index_path = _safe_profile_path(
        preview_root, preview_root, profile_data.get("index_file")
    )
    if (
        submission.get("submission_id")
        != HILIFT_COMPACT_PREVIEW_SUBMISSION_ID
        or submission.get("dataset_id") != "hiliftaeroml"
        or submission.get("split_id") != "full"
        or submission.get("case_set_id") != HILIFT_COMPACT_CASE_SET_ID
        or profile_data.get("format")
        != HILIFT_COMPACT_PREDICTION_FORMAT
        or profile_data.get("case_count") != 360
        or profile_data.get("case_set_id")
        != HILIFT_COMPACT_CASE_SET_ID
        or prediction_index_path is None
        or not prediction_index_path.is_file()
    ):
        return [
            *errors,
            f"{label}: registered compact Full360 preview binding differs",
        ]
    prediction_index = load_json(prediction_index_path)
    prediction_chunks = prediction_index.get("chunks", [])
    prediction_case_ids = [
        case_id
        for chunk in prediction_chunks
        if isinstance(chunk, dict)
        for case_id in chunk.get("case_ids", [])
    ]
    if (
        prediction_index.get("schema_version") != "1.0"
        or prediction_index.get("format")
        != HILIFT_COMPACT_PREDICTION_FORMAT
        or prediction_index.get("contract_id")
        != HILIFT_COMPACT_PROFILE_CONTRACT_ID
        or prediction_index.get("contract_sha256")
        != HILIFT_COMPACT_PROFILE_CONTRACT_SHA256
        or prediction_index.get("submission_id")
        != HILIFT_COMPACT_PREVIEW_SUBMISSION_ID
        or prediction_index.get("dataset_id") != "hiliftaeroml"
        or prediction_index.get("split_id") != "full"
        or prediction_index.get("case_set_id")
        != HILIFT_COMPACT_CASE_SET_ID
        or prediction_index.get("case_count") != 360
        or len(prediction_chunks) != 36
        or prediction_case_ids != full_case_ids
    ):
        errors.append(
            f"{label}: compact prediction index cannot join the public truth"
        )

    loaded_prediction_case_ids: list[str] = []
    for chunk_index, chunk_ref in enumerate(prediction_chunks):
        chunk_label = f"{label}/prediction-chunk-{chunk_index:03d}"
        chunk_path = _safe_profile_path(
            preview_root,
            prediction_index_path.parent,
            chunk_ref.get("file"),
        )
        if chunk_path is None or not chunk_path.is_file():
            errors.append(
                f"{chunk_label}: prediction chunk is missing or unsafe"
            )
            continue
        errors.extend(
            _file_binding_errors(
                chunk_path,
                chunk_ref.get("sha256"),
                None,
                chunk_label,
            )
        )
        chunk = load_json(chunk_path)
        chunk_case_ids = [
            case.get("case_id")
            for case in chunk.get("cases", [])
            if isinstance(case, dict)
        ]
        if (
            chunk.get("schema")
            != "hiliftaeroml-compact-profile-chunk-v2-candidate"
            or chunk.get("schema_version") != "2.0"
            or chunk.get("format")
            != HILIFT_COMPACT_PREDICTION_FORMAT
            or chunk.get("contract_id")
            != HILIFT_COMPACT_PROFILE_CONTRACT_ID
            or chunk.get("contract_sha256")
            != HILIFT_COMPACT_PROFILE_CONTRACT_SHA256
            or chunk.get("submission_id")
            != HILIFT_COMPACT_PREVIEW_SUBMISSION_ID
            or chunk.get("dataset_id") != "hiliftaeroml"
            or chunk.get("split_id") != "full"
            or chunk.get("case_set_id")
            != HILIFT_COMPACT_CASE_SET_ID
            or chunk_case_ids != chunk_ref.get("case_ids")
        ):
            errors.append(
                f"{chunk_label}: prediction chunk binding or order differs"
            )
        loaded_prediction_case_ids.extend(chunk_case_ids)
        for case in chunk.get("cases", []):
            if not isinstance(case, dict):
                continue
            case_id = case.get("case_id")
            case_label = f"{label}/{case_id}/prediction"
            truth = truth_metadata.get(case_id, {})
            truth_cp = truth.get("surface_cp", {})
            truth_velocity = truth.get("volume_velocity", {})
            prediction_cp = case.get("surface_cp", {})
            prediction_velocity = case.get("volume_velocity", {})
            cp_keys = (
                "support_identity_sha256",
                "prediction_order_sha256",
                "physical_graph_count",
                "retained_branch_count",
                "retained_point_count",
                "maximum_points_per_physical_graph",
                "quantization_scale",
                "quantization_dtype",
                "delta_dtype",
                "prediction_array",
            )
            velocity_keys = (
                "support_identity_sha256",
                "prediction_order_sha256",
                "station_order",
                "station_count",
                "row_count",
                "valid_row_count",
                "invalid_row_count",
                "prediction_dtype",
                "prediction_array",
                "storage_dtype",
                "storage_encoding",
                "stored_byte_count",
            )
            if any(
                prediction_cp.get(key) != truth_cp.get(key)
                for key in cp_keys
            ):
                errors.append(
                    f"{case_label}: Cp support metadata cannot join public truth"
                )
            if any(
                prediction_velocity.get(key)
                != truth_velocity.get(key)
                for key in velocity_keys
            ):
                errors.append(
                    f"{case_label}: velocity support metadata cannot join public truth"
                )
            artifact = case.get("artifact", {})
            artifact_path = _safe_profile_path(
                preview_root,
                prediction_index_path.parent,
                artifact.get("file"),
            )
            if artifact_path is None or not artifact_path.is_file():
                errors.append(
                    f"{case_label}: prediction artifact is missing or unsafe"
                )
                continue
            errors.extend(
                _file_binding_errors(
                    artifact_path,
                    artifact.get("sha256"),
                    artifact.get("byte_size"),
                    case_label,
                )
            )
            try:
                arrays = _compact_npz_arrays(
                    artifact_path,
                    ["cp_q_delta", "velocity_speed_over_u_inf"],
                    case_label,
                )
                if (
                    arrays["cp_q_delta"][:2]
                    != (
                        "<i2",
                        prediction_cp.get("retained_point_count"),
                    )
                    or arrays["velocity_speed_over_u_inf"][:2]
                    != (
                        "|u1",
                        prediction_velocity.get("stored_byte_count"),
                    )
                    or prediction_velocity.get("storage_dtype") != "uint8"
                    or prediction_velocity.get("storage_encoding")
                    != (
                        "little_endian_float32_bits_unsigned_delta_modulo_"
                        "2pow32_byte_shuffle_v1"
                    )
                    or prediction_velocity.get("stored_byte_count")
                    != prediction_velocity.get("valid_row_count", 0) * 4
                    or not _all_finite_f4(
                        _decode_hilift_velocity_storage(
                            arrays["velocity_speed_over_u_inf"][2],
                            prediction_velocity.get("valid_row_count", 0),
                        ),
                        nonnegative=True,
                    )
                ):
                    errors.append(
                        f"{case_label}: prediction arrays differ from joined support counts"
                    )
            except (TypeError, ValueError) as error:
                errors.append(str(error))
    if loaded_prediction_case_ids != full_case_ids:
        errors.append(
            f"{label}: loaded prediction cases differ from public truth order"
        )
    return errors
def check(submission_root: Path) -> list[str]:
    errors: list[str] = []
    for schema_name in TOP_LEVEL_SCHEMA_NAMES:
        source_schema = submission_root / "schemas" / schema_name
        public_schema = PUBLIC_TOP_LEVEL_SCHEMA_ROOT / schema_name
        if not source_schema.is_file():
            errors.append(f"submission repository is missing schemas/{schema_name}")
        elif not public_schema.is_file():
            errors.append(f"website is missing public schema schemas/{schema_name}")
        elif public_schema.read_bytes() != source_schema.read_bytes():
            errors.append(
                f"public schema schemas/{schema_name} differs from the submission contract"
            )

    for schema_name in V2_SCHEMA_NAMES:
        source_schema = submission_root / "schemas" / "v2" / schema_name
        public_schema = PUBLIC_SCHEMA_ROOT / schema_name
        if not source_schema.is_file():
            errors.append(f"submission repository is missing schemas/v2/{schema_name}")
        elif not public_schema.is_file():
            errors.append(f"website is missing public schema schemas/v2/{schema_name}")
        elif public_schema.read_bytes() != source_schema.read_bytes():
            errors.append(
                f"public schema schemas/v2/{schema_name} differs from the submission contract"
            )

    for schema_name in V3_SCHEMA_NAMES:
        source_schema = submission_root / "schemas" / "v3" / schema_name
        public_schema = PUBLIC_V3_SCHEMA_ROOT / schema_name
        if not source_schema.is_file():
            errors.append(f"submission repository is missing schemas/v3/{schema_name}")
        elif not public_schema.is_file():
            errors.append(f"website is missing public schema schemas/v3/{schema_name}")
        elif public_schema.read_bytes() != source_schema.read_bytes():
            errors.append(
                f"public schema schemas/v3/{schema_name} differs from the submission contract"
            )

    for schema_name in SCORING_SUPPORT_SCHEMA_NAMES:
        source_schema = (
            submission_root / "schemas" / "scoring-support" / "v1" / schema_name
        )
        public_schema = PUBLIC_SCORING_SUPPORT_SCHEMA_ROOT / schema_name
        if not source_schema.is_file():
            errors.append(
                f"submission repository is missing schemas/scoring-support/v1/{schema_name}"
            )
        elif not public_schema.is_file():
            errors.append(
                f"website is missing public schema schemas/scoring-support/v1/{schema_name}"
            )
        elif public_schema.read_bytes() != source_schema.read_bytes():
            errors.append(
                f"public schema schemas/scoring-support/v1/{schema_name} differs from the submission contract"
            )

    for schema_name in RELEASE_SCHEMA_NAMES:
        source_schema = submission_root / "schemas" / "releases" / schema_name
        public_schema = PUBLIC_RELEASE_SCHEMA_ROOT / schema_name
        if not source_schema.is_file():
            errors.append(
                f"submission repository is missing schemas/releases/{schema_name}"
            )
        elif not public_schema.is_file():
            errors.append(
                f"website is missing public schema schemas/releases/{schema_name}"
            )
        elif public_schema.read_bytes() != source_schema.read_bytes():
            errors.append(
                f"public schema schemas/releases/{schema_name} differs from the submission contract"
            )

    submission_manifest = load_json(submission_root / "leaderboard" / "manifest.json")
    ground_truth_manifest_path = GROUND_TRUTH_ROOT / "manifest.json"
    ground_truth_manifest = load_json(ground_truth_manifest_path)
    scalar_release = submission_manifest.get("data_release", {})
    expected_ground_truth = scalar_release.get("profile_ground_truth", {})
    ground_truth_release = ground_truth_manifest.get("data_release", {})
    if expected_ground_truth.get("release_id") != ground_truth_release.get("id"):
        errors.append("scalar and profile-ground-truth release IDs differ")
    if expected_ground_truth.get("manifest_sha256") != sha256_file(
        ground_truth_manifest_path
    ):
        errors.append(
            "scalar release does not pin the current profile-ground-truth manifest SHA-256"
        )
    if scalar_release.get("status") == "official":
        source_commit = ground_truth_release.get("source_commit", "")
        if ground_truth_release.get("status") != "official" or len(
            source_commit
        ) not in {40, 64}:
            errors.append(
                "official scalar data require official profile ground truth pinned to a full source commit"
            )
    ground_truth_datasets = {
        dataset["id"]: dataset for dataset in ground_truth_manifest.get("datasets", [])
    }
    expected_dataset_ids = {
        dataset["slug"] for dataset in submission_manifest["datasets"]
    }
    if set(ground_truth_datasets) != expected_dataset_ids:
        errors.append(
            f"ground-truth dataset IDs differ: expected={sorted(expected_dataset_ids)}, actual={sorted(ground_truth_datasets)}"
        )

    for dataset in submission_manifest["datasets"]:
        dataset_id = dataset["slug"]
        ground_truth_dataset = ground_truth_datasets.get(dataset_id)
        if not ground_truth_dataset:
            continue
        spec = load_json(
            submission_root / "benchmark-specs" / dataset_id / "submission-spec.json"
        )
        profile_definition: dict[str, Any] = {}
        expected_extractor_sha256 = ""
        if dataset_id == "airfrans":
            profile_binding = spec["profile_definition"]
            profile_definition = load_json(
                submission_root
                / "benchmark-specs"
                / dataset_id
                / profile_binding["file"]
            )
            reference_fixture = load_json(
                submission_root / profile_definition["reference_fixture"]["file"]
            )
            expected_extractor_sha256 = reference_fixture["provenance"][
                "extractor_sha256"
            ]
        native_drivaerml_candidate = dataset_id == "drivaerml" and (
            "native_profile_truth" in ground_truth_dataset
            or any(
                (
                    lambda path: path.is_file()
                    and drivaerml_native_contract_version(
                        load_json(path), "split"
                    )
                    in NATIVE_DRIVAERML_CONTRACTS
                )(
                    GROUND_TRUTH_ROOT / case_set.get("index_file", "")
                )
                for case_set in ground_truth_dataset.get("case_sets", [])
                if isinstance(case_set, dict)
            )
        )
        if native_drivaerml_candidate:
            errors.extend(
                drivaerml_native_bundle_errors(
                    GROUND_TRUTH_ROOT, ground_truth_dataset, submission_root
                )
            )
            spec_splits = {split["id"]: split for split in spec["splits"]}
            ground_truth_splits = {
                split["id"]: split
                for split in ground_truth_dataset.get("splits", [])
                if isinstance(split, dict) and isinstance(split.get("id"), str)
            }
            if set(spec_splits) != set(ground_truth_splits):
                errors.append(
                    "drivaerml: native ground-truth split IDs differ from the submission specification"
                )
            for split_id, split in spec_splits.items():
                split_index = load_json(
                    submission_root
                    / "benchmark-specs"
                    / dataset_id
                    / split["index_file"]
                )
                ground_truth_split = ground_truth_splits.get(split_id, {})
                if (
                    ground_truth_split.get("case_set_id")
                    != split.get("case_set_id")
                    or ground_truth_split.get("case_count")
                    != len(split_index.get("case_ids", []))
                ):
                    errors.append(
                        f"drivaerml/{split_id}: native ground-truth split mapping or case_count is stale"
                    )
            continue
        if dataset_id == "hiliftaeroml" and "compact_profile_truth" in ground_truth_dataset:
            errors.extend(
                hiliftaeroml_compact_truth_errors(
                    GROUND_TRUTH_ROOT, ground_truth_dataset, submission_root
                )
            )
            continue
        if dataset_id == "ahmedml" and "native_profile_truth" in ground_truth_dataset:
            errors.extend(
                ahmedml_native_bundle_errors(
                    GROUND_TRUTH_ROOT, ground_truth_dataset, submission_root
                )
            )
            continue
        if dataset_id == "windsorml":
            errors.extend(windsorml_native_bundle_errors(GROUND_TRUTH_ROOT, ground_truth_dataset, submission_root))
            continue
        spec_splits = {split["id"]: split for split in spec["splits"]}
        ground_truth_splits = {
            split["id"]: split for split in ground_truth_dataset.get("splits", [])
        }
        if set(spec_splits) != set(ground_truth_splits):
            errors.append(
                f"{dataset_id}: ground-truth split IDs differ from the submission specification"
            )
        case_sets = {
            case_set["id"]: case_set
            for case_set in ground_truth_dataset.get("case_sets", [])
        }
        expected_by_case_set: dict[str, list[str]] = {}
        split_ids_by_case_set: dict[str, list[str]] = {}
        for split_id, split in spec_splits.items():
            split_index = load_json(
                submission_root / "benchmark-specs" / dataset_id / split["index_file"]
            )
            case_set_id = split["case_set_id"]
            split_ids_by_case_set.setdefault(case_set_id, []).append(split_id)
            previous = expected_by_case_set.setdefault(
                case_set_id, split_index["case_ids"]
            )
            if previous != split_index["case_ids"]:
                errors.append(
                    f"{dataset_id}/{case_set_id}: submission splits disagree on shared case IDs"
                )
            ground_truth_split = ground_truth_splits.get(split_id, {})
            if ground_truth_split.get("case_set_id") != case_set_id:
                errors.append(
                    f"{dataset_id}/{split_id}: ground-truth case_set_id is stale"
                )

        panels = {panel["id"]: panel for panel in spec["profile_panels"]}
        expected_series = {
            (panel_id, station_id, quantity_id)
            for panel_id, panel in panels.items()
            for station_id in panel["station_ids"]
            for quantity_id in panel["quantity_ids"]
        }
        for case_set_id, expected_case_ids in expected_by_case_set.items():
            case_set = case_sets.get(case_set_id)
            if not case_set:
                errors.append(
                    f"{dataset_id}: missing ground-truth case set {case_set_id}"
                )
                continue
            index_path = GROUND_TRUTH_ROOT / case_set["index_file"]
            if not index_path.is_file():
                errors.append(
                    f"{dataset_id}/{case_set_id}: missing {case_set['index_file']}"
                )
                continue
            if case_set.get("index_sha256") != sha256_file(index_path):
                errors.append(
                    f"{dataset_id}/{case_set_id}: release manifest index_sha256 mismatch"
                )
            index = load_json(index_path)
            indexed_case_ids = [
                case_id
                for chunk in index.get("chunks", [])
                for case_id in chunk.get("case_ids", [])
            ]
            coverage = case_set.get("coverage", COMPLETE_COVERAGE)
            for coverage_error in case_coverage_errors(
                expected_case_ids,
                indexed_case_ids,
                coverage,
                ground_truth_release.get("status", ""),
            ):
                errors.append(f"{dataset_id}/{case_set_id}: {coverage_error}")
            if case_set.get("case_count") != len(indexed_case_ids):
                errors.append(
                    f"{dataset_id}/{case_set_id}: release manifest case_count is stale"
                )
            if index.get("case_count") != len(indexed_case_ids):
                errors.append(
                    f"{dataset_id}/{case_set_id}: profile index case_count is stale"
                )
            if index.get("coverage", COMPLETE_COVERAGE) != coverage:
                errors.append(
                    f"{dataset_id}/{case_set_id}: profile index coverage differs from the release manifest"
                )
            for split_id in split_ids_by_case_set[case_set_id]:
                if ground_truth_splits.get(split_id, {}).get("case_count") != len(
                    indexed_case_ids
                ):
                    errors.append(
                        f"{dataset_id}/{split_id}: ground-truth split case_count is stale"
                    )
            loaded_case_ids: list[str] = []
            for chunk_entry in index.get("chunks", []):
                chunk_path = index_path.parent / chunk_entry["file"]
                if not chunk_path.is_file():
                    errors.append(
                        f"{dataset_id}/{case_set_id}: missing chunk {chunk_entry['file']}"
                    )
                    continue
                if sha256_file(chunk_path) != chunk_entry.get("sha256"):
                    errors.append(
                        f"{dataset_id}/{case_set_id}/{chunk_entry['file']}: sha256 mismatch"
                    )
                chunk = load_json(chunk_path)
                if coverage == REPRESENTATIVE_COVERAGE and dataset_id == "airfrans":
                    provenance = chunk.get("provenance", {})
                    if chunk.get("status") != "official_dataset_reference_fixture":
                        errors.append(
                            f"{dataset_id}/{case_set_id}/{chunk_entry['file']}: fixture status is invalid"
                        )
                    if provenance.get(
                        "profile_definition_id"
                    ) != profile_definition.get("profile_definition_id"):
                        errors.append(
                            f"{dataset_id}/{case_set_id}/{chunk_entry['file']}: profile definition ID is stale"
                        )
                    if provenance.get("profile_definition_sha256") != spec[
                        "profile_definition"
                    ].get("sha256"):
                        errors.append(
                            f"{dataset_id}/{case_set_id}/{chunk_entry['file']}: profile definition SHA-256 is stale"
                        )
                    if provenance.get("extractor_sha256") != expected_extractor_sha256:
                        errors.append(
                            f"{dataset_id}/{case_set_id}/{chunk_entry['file']}: extractor SHA-256 is stale"
                        )
                    if provenance.get("sampling", {}).get(
                        "normal_transform"
                    ) != profile_definition.get("extraction", {}).get(
                        "normal_transform"
                    ):
                        errors.append(
                            f"{dataset_id}/{case_set_id}/{chunk_entry['file']}: normal transform is stale"
                        )
                chunk_case_ids = [
                    case.get("case_id") for case in chunk.get("cases", [])
                ]
                if chunk_case_ids != chunk_entry.get("case_ids"):
                    errors.append(
                        f"{dataset_id}/{case_set_id}/{chunk_entry['file']}: index case order mismatch"
                    )
                loaded_case_ids.extend(chunk_case_ids)
                for case in chunk.get("cases", []):
                    provided = set()
                    for series in case.get("series", []):
                        key = (
                            series.get("panel_id"),
                            series.get("station_id"),
                            series.get("quantity_id"),
                        )
                        if key in provided:
                            errors.append(
                                f"{dataset_id}/{case['case_id']}: duplicate profile series {key}"
                            )
                        provided.add(key)
                        coordinate = series.get("coordinate")
                        value = series.get("value")
                        if (
                            not finite_numbers(coordinate)
                            or not finite_numbers(value)
                            or len(coordinate) != len(value)
                        ):
                            errors.append(
                                f"{dataset_id}/{case['case_id']}/{key}: invalid coordinate/value arrays"
                            )
                        elif len(coordinate) < 2 or any(
                            right <= left
                            for left, right in zip(coordinate, coordinate[1:])
                        ):
                            errors.append(
                                f"{dataset_id}/{case['case_id']}/{key}: coordinates are not strictly increasing"
                            )
                        panel = panels.get(series.get("panel_id"), {})
                        station_sample_counts = panel.get(
                            "station_sample_counts", {}
                        )
                        sample_count = (
                            station_sample_counts.get(series.get("station_id"))
                            if isinstance(station_sample_counts, dict)
                            else None
                        )
                        if sample_count is None:
                            sample_count = panel.get("sample_count")
                        if sample_count is None:
                            sample_count = panel.get("exact_points")
                        if isinstance(sample_count, int) and (
                            not isinstance(coordinate, list)
                            or len(coordinate) != sample_count
                        ):
                            errors.append(
                                f"{dataset_id}/{case['case_id']}/{key}: expected {sample_count} profile samples"
                            )
                        station_intervals = panel.get(
                            "station_coordinate_intervals", {}
                        )
                        interval = (
                            station_intervals.get(series.get("station_id"))
                            if isinstance(station_intervals, dict)
                            else None
                        )
                        if interval is None:
                            interval = panel.get("coordinate_interval")
                        if (
                            isinstance(interval, list)
                            and len(interval) == 2
                            and finite_numbers(interval)
                            and isinstance(coordinate, list)
                            and len(coordinate) >= 2
                        ):
                            start, end = interval
                            if not math.isclose(
                                coordinate[0], start, rel_tol=0.0, abs_tol=1e-12
                            ) or not math.isclose(
                                coordinate[-1], end, rel_tol=0.0, abs_tol=1e-12
                            ):
                                errors.append(
                                    f"{dataset_id}/{case['case_id']}/{key}: coordinate interval differs from the contract"
                                )
                            station_spacings = panel.get(
                                "station_coordinate_spacings", {}
                            )
                            spacing = (
                                station_spacings.get(series.get("station_id"))
                                if isinstance(station_spacings, dict)
                                else None
                            )
                            if spacing is None:
                                spacing = panel.get("coordinate_spacing")
                            if spacing == "uniform":
                                denominator = len(coordinate) - 1
                                if any(
                                    not math.isclose(
                                        value,
                                        start
                                        + (end - start) * index / denominator,
                                        rel_tol=0.0,
                                        abs_tol=1e-12,
                                    )
                                    for index, value in enumerate(coordinate)
                                ):
                                    errors.append(
                                        f"{dataset_id}/{case['case_id']}/{key}: coordinates are not uniformly spaced over the contract interval"
                                    )
                    missing = expected_series - provided
                    if missing:
                        errors.append(
                            f"{dataset_id}/{case['case_id']}: missing ground-truth series {sorted(missing)}"
                        )
            if loaded_case_ids != indexed_case_ids:
                errors.append(
                    f"{dataset_id}/{case_set_id}: loaded chunk cases differ from the index"
                )
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--submission-root",
        type=Path,
        default=ROOT.parent / "fluidsbench-submission",
        help="path to a fluidsbench-submission checkout",
    )
    args = parser.parse_args()
    errors = check(args.submission_root.resolve())
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    manifest = load_json(GROUND_TRUTH_ROOT / "manifest.json")
    case_set_count = sum(
        len(dataset.get("case_sets", [])) for dataset in manifest["datasets"]
    )
    print(
        f"Validated {len(TOP_LEVEL_SCHEMA_NAMES)} public methodology schema, "
        f"{len(V2_SCHEMA_NAMES)} public v2 schemas, {len(V3_SCHEMA_NAMES)} public v3 schemas, "
        f"{len(SCORING_SUPPORT_SCHEMA_NAMES)} public scoring-support schemas, "
        f"{len(RELEASE_SCHEMA_NAMES)} public release schemas, and profile ground truth for "
        f"{len(manifest['datasets'])} datasets and {case_set_count} case sets."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
