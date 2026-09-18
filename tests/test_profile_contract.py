from __future__ import annotations

import sys
import unittest
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "bin"))

import check_profile_contract  # noqa: E402


class ProfileCaseCoverageTests(unittest.TestCase):
    def test_complete_release_requires_exact_ordered_split(self) -> None:
        self.assertEqual(
            check_profile_contract.case_coverage_errors(
                ["case-a", "case-b"],
                ["case-a", "case-b"],
                check_profile_contract.COMPLETE_COVERAGE,
                "prototype_dummy_data",
            ),
            [],
        )
        errors = check_profile_contract.case_coverage_errors(
            ["case-a", "case-b"],
            ["case-a"],
            check_profile_contract.COMPLETE_COVERAGE,
            "prototype_dummy_data",
        )
        self.assertTrue(any("differ" in error for error in errors))

    def test_prototype_may_publish_official_split_members_as_fixtures(self) -> None:
        self.assertEqual(
            check_profile_contract.case_coverage_errors(
                ["case-a", "case-b"],
                ["case-b"],
                check_profile_contract.REPRESENTATIVE_COVERAGE,
                "prototype_dummy_data",
            ),
            [],
        )

    def test_representative_fixture_rejects_unknown_empty_or_duplicate_cases(
        self,
    ) -> None:
        unknown = check_profile_contract.case_coverage_errors(
            ["case-a"],
            ["case-z"],
            check_profile_contract.REPRESENTATIVE_COVERAGE,
            "prototype_dummy_data",
        )
        self.assertTrue(any("absent" in error for error in unknown))
        empty = check_profile_contract.case_coverage_errors(
            ["case-a"],
            [],
            check_profile_contract.REPRESENTATIVE_COVERAGE,
            "prototype_dummy_data",
        )
        self.assertTrue(any("empty" in error for error in empty))
        duplicate = check_profile_contract.case_coverage_errors(
            ["case-a"],
            ["case-a", "case-a"],
            check_profile_contract.REPRESENTATIVE_COVERAGE,
            "prototype_dummy_data",
        )
        self.assertTrue(any("duplicates" in error for error in duplicate))

    def test_official_release_rejects_representative_subset(self) -> None:
        errors = check_profile_contract.case_coverage_errors(
            ["case-a", "case-b"],
            ["case-a"],
            check_profile_contract.REPRESENTATIVE_COVERAGE,
            "official",
        )
        self.assertTrue(any("prototype" in error for error in errors))


class AhmedMLNativeProfileTruthTests(unittest.TestCase):
    @staticmethod
    def series() -> dict:
        expected = check_profile_contract.AHMEDML_NATIVE_TRUTH_SERIES[0]
        start, stop = expected[-2:]
        count = check_profile_contract.AHMEDML_NATIVE_TRUTH_SAMPLES_PER_SERIES
        return {
            "panel_id": expected[0],
            "station_id": expected[1],
            "quantity_id": expected[2],
            "coordinate_id": expected[3],
            "coordinate_unit": "1",
            "coordinate": [
                start + (stop - start) * index / (count - 1)
                for index in range(count)
            ],
            "value": [0.01 * index for index in range(count)],
            "sample_count": count,
            "source": "evaluator_owned_frozen_native_cell_mapping",
        }

    def test_exact_128_point_series_passes(self) -> None:
        self.assertEqual(
            check_profile_contract.ahmedml_series_errors(
                self.series(),
                check_profile_contract.AHMEDML_NATIVE_TRUTH_SERIES[0],
                "fixture",
            ),
            [],
        )

    def test_rejects_wrong_source_noncanonical_grid_and_nonfinite_value(self) -> None:
        wrong_source = self.series()
        wrong_source["source"] = "participant_supplied"
        self.assertTrue(
            any(
                "identity or source" in error
                for error in check_profile_contract.ahmedml_series_errors(
                    wrong_source,
                    check_profile_contract.AHMEDML_NATIVE_TRUTH_SERIES[0],
                    "fixture",
                )
            )
        )
        wrong_grid = self.series()
        wrong_grid["coordinate"][64] += 1.0e-4
        self.assertTrue(
            any(
                "uniform grid" in error
                for error in check_profile_contract.ahmedml_series_errors(
                    wrong_grid,
                    check_profile_contract.AHMEDML_NATIVE_TRUTH_SERIES[0],
                    "fixture",
                )
            )
        )
        nonfinite = self.series()
        nonfinite["value"][0] = float("nan")
        self.assertTrue(
            any(
                "finite native-CFD" in error
                for error in check_profile_contract.ahmedml_series_errors(
                    nonfinite,
                    check_profile_contract.AHMEDML_NATIVE_TRUTH_SERIES[0],
                    "fixture",
                )
            )
        )

    def test_rejects_stale_revision_schema_and_truth_source(self) -> None:
        header = {
            "schema": check_profile_contract.AHMEDML_NATIVE_TRUTH_INDEX_SCHEMA,
            "schema_version": "1.0",
            "release_id": check_profile_contract.AHMEDML_NATIVE_TRUTH_RELEASE_ID,
            "dataset_id": "ahmedml",
            "dataset_revision": check_profile_contract.AHMEDML_NATIVE_TRUTH_DATASET_REVISION,
            "source_identity_sha256": check_profile_contract.AHMEDML_NATIVE_TRUTH_SOURCE_IDENTITY_SHA256,
            "profile_definition_sha256": check_profile_contract.AHMEDML_NATIVE_TRUTH_PROFILE_DEFINITION_SHA256,
            "truth_source": deepcopy(
                check_profile_contract.AHMEDML_NATIVE_TRUTH_SOURCE
            ),
        }
        self.assertEqual(
            check_profile_contract._ahmedml_common_header_errors(
                header,
                schema=check_profile_contract.AHMEDML_NATIVE_TRUTH_INDEX_SCHEMA,
                label="fixture",
            ),
            [],
        )
        for key, value in (
            ("schema", "wrong-schema"),
            ("dataset_revision", "0" * 40),
            ("truth_source", {"source_kind": "dummy"}),
        ):
            mutated = deepcopy(header)
            mutated[key] = value
            self.assertTrue(
                check_profile_contract._ahmedml_common_header_errors(
                    mutated,
                    schema=check_profile_contract.AHMEDML_NATIVE_TRUTH_INDEX_SCHEMA,
                    label="fixture",
                )
            )


class DrivAerMLNativeProfileSeriesTests(unittest.TestCase):
    @staticmethod
    def rebind_case_identity(case: dict) -> None:
        body = dict(case)
        body.pop("case_identity", None)
        case["case_identity"] = {
            "algorithm": "sha256",
            "scope": "canonical_json_body_without_case_identity",
            "sha256": check_profile_contract.canonical_json_identity_sha256(body),
        }

    @staticmethod
    def native_case() -> dict:
        series_records = []
        digest = "1" * 64
        for key, representation in (
            check_profile_contract.drivaerml_native_expected_series().items()
        ):
            panel_id, family_id, placement_mode, station_id, quantity_id = key
            series = {
                "panel_id": panel_id,
                "family_id": family_id,
                "placement_mode": placement_mode,
                "station_id": station_id,
                "quantity_id": quantity_id,
                "quantity": (
                    "pressure_coefficient"
                    if quantity_id == "cp"
                    else "velocity_magnitude_ratio"
                ),
                "units": "1",
                "scoring_role": (
                    "report_only" if placement_mode == "relative" else "inherits_parent_candidate"
                ),
                "representation": representation,
                "placement_receipt_identity_sha256": "2" * 64,
            }
            if representation == "shared_alias":
                canonical = check_profile_contract.DRIVAERML_RELATIVE_CP_ALIASES[
                    station_id
                ]
                series["shared_support_ref"] = {
                    "canonical_family_id": canonical[0],
                    "canonical_station_id": canonical[1],
                    "canonical_support_identity_sha256": digest,
                    "shared_support_id": check_profile_contract.DRIVAERML_SHARED_CP_SUPPORT_IDS[
                        station_id
                    ],
                }
            else:
                coordinate = [0.0, 0.5, 1.0]
                series.update(
                    {
                        "support_identity_sha256": digest,
                        "coordinate_id": (
                            "arc_length_m"
                            if panel_id == "pressure_profiles"
                            else "normalized_arc_length"
                            if placement_mode == "relative"
                            else "distance_m"
                        ),
                        "coordinate_unit": (
                            "1"
                            if family_id == "drivaerml-velocity-relative-v3"
                            else "m"
                        ),
                        "coordinate": coordinate,
                        "value": [0.1, 0.2, 0.3],
                        "sample_index": [0, 1, 3],
                        "raw_native_cell_id": [10, 11, 13],
                        "segments": [
                            {
                                "segment_id": "supported",
                                "emitted_index_start": 0,
                                "emitted_index_stop": 2,
                                "sample_index_start": 0,
                                "sample_index_stop": 2,
                                "coordinate_start": 0.0,
                                "coordinate_stop": 0.5,
                            },
                            {
                                "segment_id": "supported",
                                "emitted_index_start": 2,
                                "emitted_index_stop": 3,
                                "sample_index_start": 3,
                                "sample_index_stop": 4,
                                "coordinate_start": 1.0,
                                "coordinate_stop": 1.0,
                            },
                        ],
                        "unsupported_samples": [
                            {
                                "sample_index": 2,
                                "coordinate": 0.75,
                                "reason": "unsupported_test_sample",
                            }
                        ],
                        "coordinate_identity_sha256": check_profile_contract.coordinate_identity_sha256(
                            coordinate
                        ),
                        "value_identity_sha256": check_profile_contract.value_identity_sha256(
                            [0.1, 0.2, 0.3]
                        ),
                    }
                )
            series["series_identity_sha256"] = (
                check_profile_contract.canonical_json_identity_sha256(
                    check_profile_contract.native_series_identity_projection(series)
                )
            )
            series_records.append(series)
        case = {
            "schema": check_profile_contract.NATIVE_DRIVAERML_CASE_SCHEMA,
            "schema_version": "2.0",
            "dataset_id": "drivaerml",
            "dataset_revision": check_profile_contract.NATIVE_DRIVAERML_DATASET_REVISION,
            "case_id": "run_419",
            "series_count": 40,
            "truth_source": deepcopy(check_profile_contract.NATIVE_TRUTH_SOURCE),
            "relative_scoring_activated": False,
            "native_volume": {},
            "native_boundary": {},
            "input_bindings": {
                "constant_velocity": {},
                "relative_velocity": {},
                "cp": {},
            },
            "generator": {
                "evaluator_git_revision": "3" * 40,
                "exporter_source": {
                    "path": "scripts/export_drivaerml_native_profile_truth.py",
                    "sha256": "4" * 64,
                    "size_bytes": 1,
                },
            },
            "series": series_records,
        }
        case["case_identity"] = {
            "algorithm": "sha256",
            "scope": "canonical_json_body_without_case_identity",
            "sha256": check_profile_contract.canonical_json_identity_sha256(case),
        }
        return case

    @classmethod
    def native_v3_case(cls) -> dict:
        case = cls.native_case()
        case["schema"] = check_profile_contract.NATIVE_DRIVAERML_CONTRACTS["3.0"][
            "case"
        ]
        case["schema_version"] = "3.0"
        materialized_cp_row_count = 0
        for series in case["series"]:
            if (
                series["representation"] == "materialized"
                and series["quantity_id"] == "cp"
            ):
                # Physical x is deliberately non-monotone. It is a retained display
                # coordinate in producer order, not the scoring/segment coordinate.
                display_coordinate = [-0.8, -0.9, -0.7]
                series.update(
                    {
                        "display_coordinate_id": check_profile_contract.NATIVE_CP_DISPLAY_COORDINATE_ID,
                        "display_coordinate_unit": check_profile_contract.NATIVE_CP_DISPLAY_COORDINATE_UNIT,
                        "display_coordinate": display_coordinate,
                        "display_coordinate_identity_sha256": check_profile_contract.coordinate_identity_sha256(
                            display_coordinate
                        ),
                    }
                )
                materialized_cp_row_count += len(display_coordinate)
            series["series_identity_sha256"] = (
                check_profile_contract.canonical_json_identity_sha256(
                    check_profile_contract.native_series_identity_projection(
                        series, "3.0"
                    )
                )
            )
        case["cp_display_coordinate"] = {
            **check_profile_contract.NATIVE_CP_CASE_DISPLAY_DECLARATION,
            "materialized_row_count": materialized_cp_row_count,
        }
        case["native_boundary"][
            "referenced_producer_row_count"
        ] = materialized_cp_row_count
        cls.rebind_case_identity(case)
        return case

    def test_exact_40_series_native_case_passes(self) -> None:
        self.assertEqual(
            check_profile_contract.drivaerml_native_case_series_errors(
                self.native_case(), "drivaerml/run_419"
            ),
            [],
        )

    def test_exact_native_v3_case_passes_with_conditional_series_identities(
        self,
    ) -> None:
        case = self.native_v3_case()
        self.assertEqual(
            check_profile_contract.drivaerml_native_case_series_errors(
                case, "drivaerml/run_419", expected_version="3.0"
            ),
            [],
        )
        velocity = next(
            series
            for series in case["series"]
            if series["representation"] == "materialized"
            and series["quantity_id"] == "velocity_ratio"
        )
        materialized_cp = next(
            series
            for series in case["series"]
            if series["representation"] == "materialized"
            and series["quantity_id"] == "cp"
        )
        alias = next(
            series
            for series in case["series"]
            if series["representation"] == "shared_alias"
        )
        self.assertEqual(
            check_profile_contract.native_series_identity_projection(
                velocity, "3.0"
            )["schema"],
            check_profile_contract.NATIVE_SERIES_IDENTITY_SCHEMA,
        )
        self.assertEqual(
            check_profile_contract.native_series_identity_projection(
                alias, "3.0"
            )["schema"],
            check_profile_contract.NATIVE_SERIES_IDENTITY_SCHEMA,
        )
        self.assertEqual(
            check_profile_contract.native_series_identity_projection(
                materialized_cp, "3.0"
            )["schema"],
            check_profile_contract.NATIVE_SERIES_IDENTITY_SCHEMA_V2,
        )

    def test_native_v3_rejects_mutated_display_array_with_retained_hash(
        self,
    ) -> None:
        case = self.native_v3_case()
        materialized_cp = next(
            series
            for series in case["series"]
            if series["representation"] == "materialized"
            and series["quantity_id"] == "cp"
        )
        materialized_cp["display_coordinate"][1] = 1234.0
        self.rebind_case_identity(case)
        errors = check_profile_contract.drivaerml_native_case_series_errors(
            case, "drivaerml/run_419", expected_version="3.0"
        )
        self.assertTrue(
            any("ordered display-coordinate array" in error for error in errors)
        )

    def test_native_v3_rejects_rehashed_display_array_with_stale_series_identity(
        self,
    ) -> None:
        case = self.native_v3_case()
        materialized_cp = next(
            series
            for series in case["series"]
            if series["representation"] == "materialized"
            and series["quantity_id"] == "cp"
        )
        materialized_cp["display_coordinate"][1] = 1234.0
        materialized_cp["display_coordinate_identity_sha256"] = (
            check_profile_contract.coordinate_identity_sha256(
                materialized_cp["display_coordinate"]
            )
        )
        self.rebind_case_identity(case)
        errors = check_profile_contract.drivaerml_native_case_series_errors(
            case, "drivaerml/run_419", expected_version="3.0"
        )
        self.assertTrue(
            any("exact materialized projection" in error for error in errors)
        )

    def test_native_v3_rejects_display_fields_on_alias_or_velocity(self) -> None:
        for representation in ("shared_alias", "velocity"):
            with self.subTest(representation=representation):
                case = self.native_v3_case()
                if representation == "shared_alias":
                    selected = next(
                        series
                        for series in case["series"]
                        if series["representation"] == "shared_alias"
                    )
                else:
                    selected = next(
                        series
                        for series in case["series"]
                        if series["representation"] == "materialized"
                        and series["quantity_id"] == "velocity_ratio"
                    )
                selected["display_coordinate"] = [0.0, 0.5, 1.0]
                self.rebind_case_identity(case)
                errors = check_profile_contract.drivaerml_native_case_series_errors(
                    case, "drivaerml/run_419", expected_version="3.0"
                )
                self.assertTrue(
                    any("display-coordinate" in error for error in errors)
                )

    def test_native_v3_rejects_extra_nested_alias_metadata(self) -> None:
        case = self.native_v3_case()
        alias = next(
            series
            for series in case["series"]
            if series["representation"] == "shared_alias"
        )
        alias["shared_support_ref"]["unexpected"] = True
        alias["series_identity_sha256"] = (
            check_profile_contract.canonical_json_identity_sha256(
                check_profile_contract.native_series_identity_projection(
                    alias, "3.0"
                )
            )
        )
        self.rebind_case_identity(case)
        errors = check_profile_contract.drivaerml_native_case_series_errors(
            case, "drivaerml/run_419", expected_version="3.0"
        )
        self.assertTrue(any("exact canonical" in error for error in errors))

    def test_native_v3_display_contract_rejects_partial_unaligned_and_nonfinite(
        self,
    ) -> None:
        def selected_cp(case: dict) -> dict:
            return next(
                series
                for series in case["series"]
                if series["representation"] == "materialized"
                and series["quantity_id"] == "cp"
            )

        partial = self.native_v3_case()
        partial_cp = selected_cp(partial)
        partial_cp.pop("display_coordinate_unit")
        partial_cp["series_identity_sha256"] = (
            check_profile_contract.canonical_json_identity_sha256(
                check_profile_contract.native_series_identity_projection(
                    partial_cp, "3.0"
                )
            )
        )
        self.rebind_case_identity(partial)
        partial_errors = check_profile_contract.drivaerml_native_case_series_errors(
            partial, "drivaerml/run_419", expected_version="3.0"
        )
        self.assertTrue(
            any("exact display-coordinate fields" in error for error in partial_errors)
        )

        unaligned = self.native_v3_case()
        unaligned_cp = selected_cp(unaligned)
        unaligned_cp["display_coordinate"] = [-0.8, -0.9]
        unaligned_cp["display_coordinate_identity_sha256"] = (
            check_profile_contract.coordinate_identity_sha256(
                unaligned_cp["display_coordinate"]
            )
        )
        unaligned_cp["series_identity_sha256"] = (
            check_profile_contract.canonical_json_identity_sha256(
                check_profile_contract.native_series_identity_projection(
                    unaligned_cp, "3.0"
                )
            )
        )
        self.rebind_case_identity(unaligned)
        unaligned_errors = check_profile_contract.drivaerml_native_case_series_errors(
            unaligned, "drivaerml/run_419", expected_version="3.0"
        )
        self.assertTrue(
            any("not aligned" in error for error in unaligned_errors)
        )

        nonfinite = self.native_v3_case()
        selected_cp(nonfinite)["display_coordinate"][0] = float("nan")
        nonfinite_errors = check_profile_contract.drivaerml_native_case_series_errors(
            nonfinite, "drivaerml/run_419", expected_version="3.0"
        )
        self.assertTrue(
            any("nonempty and contain only finite" in error for error in nonfinite_errors)
        )

    def test_native_v3_requires_coherent_case_schema_and_version(self) -> None:
        case = self.native_v3_case()
        case["schema"] = check_profile_contract.NATIVE_DRIVAERML_CASE_SCHEMA
        self.rebind_case_identity(case)
        errors = check_profile_contract.drivaerml_native_case_series_errors(
            case, "drivaerml/run_419", expected_version="3.0"
        )
        self.assertTrue(any("supported coherent pair" in error for error in errors))

    def test_native_v3_coverage_counts_display_samples_separately(self) -> None:
        accumulator = check_profile_contract._native_coverage_accumulator("3.0")
        check_profile_contract._accumulate_native_coverage(
            accumulator, self.native_v3_case(), "3.0"
        )
        coverage = check_profile_contract._finalize_native_coverage(accumulator)
        self.assertEqual(
            coverage["families"]["drivaerml_cp_constant_v1"][
                "display_coordinate_sample_count"
            ],
            12,
        )
        self.assertEqual(
            coverage["families"]["drivaerml_cp_relative_v1"][
                "display_coordinate_sample_count"
            ],
            6,
        )
        self.assertEqual(
            coverage["totals"]["display_coordinate_sample_count"], 18
        )

    def test_native_v2_rejects_display_coordinate_extension(self) -> None:
        case = self.native_case()
        materialized_cp = next(
            series
            for series in case["series"]
            if series["representation"] == "materialized"
            and series["quantity_id"] == "cp"
        )
        materialized_cp["display_coordinate"] = [-0.8, -0.9, -0.7]
        self.rebind_case_identity(case)
        errors = check_profile_contract.drivaerml_native_case_series_errors(
            case, "drivaerml/run_419", expected_version="2.0"
        )
        self.assertTrue(
            any("forbidden on native-v2" in error for error in errors)
        )

    def test_changed_coordinate_with_retained_identity_is_rejected(self) -> None:
        case = self.native_case()
        materialized = next(
            series
            for series in case["series"]
            if series["representation"] == "materialized"
        )
        materialized["coordinate"][1] = 0.75
        errors = check_profile_contract.drivaerml_native_case_series_errors(
            case, "drivaerml/run_419"
        )
        self.assertTrue(any("does not bind" in error for error in errors))

    def test_relative_cp_coordinate_reset_is_valid_only_at_segment_boundary(self) -> None:
        case = self.native_case()
        moving_cp = next(
            series
            for series in case["series"]
            if series["family_id"] == "drivaerml_cp_relative_v1"
            and series["representation"] == "materialized"
        )
        moving_cp["coordinate"][2] = 0.0
        moving_cp["segments"][1]["coordinate_start"] = 0.0
        moving_cp["segments"][1]["coordinate_stop"] = 0.0
        moving_cp["coordinate_identity_sha256"] = (
            check_profile_contract.coordinate_identity_sha256(
                moving_cp["coordinate"]
            )
        )
        moving_cp["series_identity_sha256"] = (
            check_profile_contract.canonical_json_identity_sha256(
                check_profile_contract.native_series_identity_projection(moving_cp)
            )
        )
        body = dict(case)
        body.pop("case_identity")
        case["case_identity"]["sha256"] = (
            check_profile_contract.canonical_json_identity_sha256(body)
        )
        self.assertEqual(
            check_profile_contract.drivaerml_native_case_series_errors(
                case, "drivaerml/run_419"
            ),
            [],
        )

    def test_alias_must_resolve_exact_canonical_support(self) -> None:
        case = self.native_case()
        alias = next(
            series
            for series in case["series"]
            if series["representation"] == "shared_alias"
        )
        alias["shared_support_ref"]["canonical_station_id"] = "sidewall_z_0_15"
        errors = check_profile_contract.drivaerml_native_case_series_errors(
            case, "drivaerml/run_419"
        )
        self.assertTrue(any("exact canonical" in error for error in errors))

    def test_analytical_legacy_series_cannot_claim_native_schema(self) -> None:
        case = self.native_case()
        legacy = deepcopy(case["series"][0])
        for field in (
            "family_id",
            "placement_mode",
            "support_identity_sha256",
            "placement_receipt_identity_sha256",
            "coordinate_identity_sha256",
            "value_identity_sha256",
            "series_identity_sha256",
            "sample_index",
            "raw_native_cell_id",
            "segments",
            "unsupported_samples",
        ):
            legacy.pop(field, None)
        case["series"][0] = legacy
        errors = check_profile_contract.drivaerml_native_case_series_errors(
            case, "drivaerml/run_419"
        )
        self.assertTrue(any("unexpected native profile series" in error for error in errors))
        self.assertTrue(any("missing native profile series" in error for error in errors))

    def test_zero_identity_and_unaligned_lineage_are_rejected(self) -> None:
        case = self.native_case()
        materialized = next(
            series
            for series in case["series"]
            if series["representation"] == "materialized"
        )
        materialized["support_identity_sha256"] = "0" * 64
        materialized["sample_index"] = [0, 1]
        errors = check_profile_contract.drivaerml_native_case_series_errors(
            case, "drivaerml/run_419"
        )
        self.assertTrue(any("invalid support_identity" in error for error in errors))
        self.assertTrue(any("must be nonempty and aligned" in error for error in errors))

    def test_native_declaration_rejects_analytical_dummy_or_missing_master(self) -> None:
        declaration = {
            "source_kind": "native_cfd",
            "analytical_dummy": True,
            "dataset_revision": check_profile_contract.NATIVE_DRIVAERML_DATASET_REVISION,
            "native_source_pin_sha256": "1" * 64,
            "case_count": 484,
        }
        errors = check_profile_contract.drivaerml_native_declaration_errors(
            declaration, "1" * 64
        )
        self.assertTrue(any("analytical dummy" in error for error in errors))
        self.assertTrue(any("master_index_file" in error for error in errors))
        self.assertTrue(any("master_index_sha256" in error for error in errors))

    def test_exact_native_declaration_passes(self) -> None:
        declaration = {
            "source_kind": "native_cfd",
            "analytical_dummy": False,
            "dataset_revision": check_profile_contract.NATIVE_DRIVAERML_DATASET_REVISION,
            "native_source_pin_sha256": "1" * 64,
            "case_count": 484,
            "master_index_file": "datasets/drivaerml/native-v2/index.json",
            "master_index_sha256": "2" * 64,
        }
        self.assertEqual(
            check_profile_contract.drivaerml_native_declaration_errors(
                declaration, "1" * 64
            ),
            [],
        )

    def test_master_requires_exact_all484_gap_free_unique_order(self) -> None:
        official = [f"run_{index}" for index in range(1, 485)]
        chunks = [
            {"case_ids": official[:242]},
            {"case_ids": official[242:]},
        ]
        self.assertEqual(
            check_profile_contract.drivaerml_master_coverage_errors(
                official, official, chunks
            ),
            [],
        )
        missing = deepcopy(chunks)
        missing[-1]["case_ids"] = missing[-1]["case_ids"][:-1]
        errors = check_profile_contract.drivaerml_master_coverage_errors(
            official, official[:-1], missing
        )
        self.assertTrue(any("all-484" in error for error in errors))
        self.assertTrue(any("incomplete" in error for error in errors))
        duplicate = deepcopy(chunks)
        duplicate[-1]["case_ids"][0] = official[0]
        errors = check_profile_contract.drivaerml_master_coverage_errors(
            official, official, duplicate
        )
        self.assertTrue(any("duplicated" in error for error in errors))

    def test_thin_indexes_must_bind_shared_chunk_hash_and_exact_split(self) -> None:
        master = {
            "chunk-000": {
                "case_ids": ["run_1", "run_2", "run_3"],
                "path": "chunks/chunk-000.json",
                "sha256": "1" * 64,
            },
            "chunk-001": {
                "case_ids": ["run_4", "run_5"],
                "path": "chunks/chunk-001.json",
                "sha256": "2" * 64,
            },
        }
        references = [
            {
                "chunk_id": "chunk-000",
                "path": "chunks/chunk-000.json",
                "sha256": "1" * 64,
                "case_ids": ["run_2", "run_3"],
            },
            {
                "chunk_id": "chunk-001",
                "path": "chunks/chunk-001.json",
                "sha256": "2" * 64,
                "case_ids": ["run_5"],
            },
        ]
        official = ["run_2", "run_3", "run_5"]
        self.assertEqual(
            check_profile_contract.drivaerml_thin_reference_errors(
                references, master, official, "split/full"
            ),
            [],
        )
        wrong_hash = deepcopy(references)
        wrong_hash[0]["sha256"] = "3" * 64
        errors = check_profile_contract.drivaerml_thin_reference_errors(
            wrong_hash, master, official, "split/full"
        )
        self.assertTrue(any("SHA differs" in error for error in errors))
        reordered = deepcopy(references)
        reordered[0]["case_ids"].reverse()
        errors = check_profile_contract.drivaerml_thin_reference_errors(
            reordered, master, official, "split/full"
        )
        self.assertTrue(any("exact shared chunk order" in error for error in errors))
        self.assertTrue(any("reordered" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
