from __future__ import annotations

import hashlib
import json
import sys
import unittest
from pathlib import Path

try:
    import numpy as np
    import pytest
except ModuleNotFoundError as exc:  # pragma: no cover - unittest smoke environment
    raise unittest.SkipTest(
        "AhmedML profile exporter tests require the optional NumPy/pytest toolchain"
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "bin"))

import export_ahmedml_native_profile_truth as exporter  # noqa: E402


def _stations() -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    definition = {
        "panels": [
            {
                "panel_id": "pressure_profiles",
                "quantity_id": "cp",
                "stations": [
                    {"station_id": "upper_body_centerline", "coordinate_id": "x_over_l"},
                    {"station_id": "underbody_centerline", "coordinate_id": "x_over_l"},
                    {"station_id": "rear_slant_centerline", "coordinate_id": "s_over_slant"},
                ],
            },
            {
                "panel_id": "velocity_profiles",
                "quantity_id": "ux_over_uinf",
                "stations": [
                    {"station_id": "wake_vertical_x_0p25_l", "coordinate_id": "z_over_h"},
                    {"station_id": "wake_vertical_x_0p50_l", "coordinate_id": "z_over_h"},
                    {"station_id": "wake_vertical_x_1p00_l", "coordinate_id": "z_over_h"},
                    {
                        "station_id": "wake_lateral_x_0p50_l_z_0p50_h",
                        "coordinate_id": "y_over_w",
                    },
                ],
            },
        ]
    }
    return exporter._station_records(definition)


def _write_support(root: Path, *, alter_grid: bool = False) -> Path:
    case_root = root / "run_1"
    case_root.mkdir(parents=True)
    surface_coordinate = np.vstack(
        [np.linspace(0.0, 1.0, 128, dtype=np.float64)] * 3
    )
    volume_coordinate = np.vstack(
        [
            np.linspace(0.0, 2.0, 128, dtype=np.float64),
            np.linspace(0.0, 2.0, 128, dtype=np.float64),
            np.linspace(0.0, 2.0, 128, dtype=np.float64),
            np.linspace(-1.0, 1.0, 128, dtype=np.float64),
        ]
    )
    if alter_grid:
        volume_coordinate[0, 64] = 0.5 * (
            volume_coordinate[0, 64] + volume_coordinate[0, 65]
        )
    arrays = {
        "surface_raw_cell_id": np.zeros((3, 128), dtype="<i8"),
        "surface_coordinate": surface_coordinate.astype("<f8"),
        "surface_target_xyz_m": np.zeros((3, 128, 3), dtype="<f8"),
        "surface_projected_xyz_m": np.zeros((3, 128, 3), dtype="<f8"),
        "surface_distance_m": np.zeros((3, 128), dtype="<f8"),
        "surface_truth_cp": np.arange(3 * 128, dtype=np.float32).reshape(3, 128),
        "volume_raw_cell_id": np.zeros((4, 128), dtype="<i8"),
        "volume_coordinate": volume_coordinate.astype("<f8"),
        "volume_target_xyz_m": np.zeros((4, 128, 3), dtype="<f8"),
        "volume_projected_xyz_m": np.zeros((4, 128, 3), dtype="<f8"),
        "volume_distance_m": np.zeros((4, 128), dtype="<f8"),
        "volume_truth_ux_over_uinf": np.linspace(
            -0.5, 1.1, 4 * 128, dtype=np.float32
        ).reshape(4, 128),
    }
    artifact = case_root / "profile_mapping_and_truth.npz"
    np.savez_compressed(artifact, **arrays)
    payload = artifact.read_bytes()
    manifest = {
        "schema": "ahmedml-native-case-support-v1",
        "schema_version": 1,
        "case_id": "run_1",
        "run_id": 1,
        "dataset_revision": exporter.DATASET_REVISION,
        "source": {"source_identity_sha256": exporter.SOURCE_IDENTITY_SHA256},
        "definitions": {
            "profile_definition_sha256": exporter.PROFILE_DEFINITION_SHA256,
            "profile_sample_count": 128,
        },
        "artifacts": {
            "profile_mapping_and_truth": {
                "path": artifact.name,
                "sha256": hashlib.sha256(payload).hexdigest(),
                "size_bytes": len(payload),
                "format": "npz",
                "arrays": exporter._artifact_array_declarations(),
            }
        },
    }
    path = case_root / "case-support.json"
    path.write_text(json.dumps(manifest), encoding="utf-8")
    return root


def test_exports_only_exact_evaluator_owned_128_point_series(tmp_path: Path) -> None:
    support = _write_support(tmp_path / "support")
    surface_stations, volume_stations = _stations()

    case = exporter._load_case(
        support,
        "run_1",
        surface_stations,
        volume_stations,
    )

    assert case["truth_source"] == exporter.TRUTH_SOURCE
    assert len(case["series"]) == 7
    assert all(series["sample_count"] == 128 for series in case["series"])
    assert case["series"][3]["coordinate"][:1] == [0.0]
    assert case["series"][3]["coordinate"][-1:] == [2.0]
    assert case["series"][6]["coordinate"][:1] == [-1.0]
    assert case["series"][6]["coordinate"][-1:] == [1.0]


def test_rejects_monotonic_noncanonical_profile_grid(tmp_path: Path) -> None:
    support = _write_support(tmp_path / "support", alter_grid=True)
    surface_stations, volume_stations = _stations()

    with pytest.raises(exporter.ExportError, match="exact 128-point grids"):
        exporter._load_case(
            support,
            "run_1",
            surface_stations,
            volume_stations,
        )
