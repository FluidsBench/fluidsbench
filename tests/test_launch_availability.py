from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "bin"))
import prepare_submission_status


class AvailabilityTests(unittest.TestCase):
    def result(self, specification, hidden=False, slug="example", branch="dev"):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "leaderboard").mkdir()
            (root / "leaderboard/manifest.json").write_text(json.dumps({"data_release": {"id": "test", "status": "prototype_dummy_data", "source_ref": branch}}))
            folder = root / "benchmark-specs" / slug
            folder.mkdir(parents=True)
            (folder / "submission-spec.json").write_text(json.dumps(specification))
            with patch.object(prepare_submission_status.subprocess, "check_output", return_value="a" * 40):
                return prepare_submission_status.snapshot(root, {slug: {}}, {slug: {"hidden": hidden}})

    def official(self):
        return {"status": "official", "scoring_support": {"status": "official", "submissions_open": True,
                "owner_approval": {"approved_by": "Owner", "approved_at": "2026-09-20", "pull_request_url": "https://example.test/pull/1"}}}

    def test_open_flag_cannot_override_candidate_status_or_missing_owner_approval(self):
        for field in ("candidate", "owner"):
            spec = self.official()
            if field == "candidate":
                spec["status"] = "owner_review_required"
            else:
                spec["scoring_support"].pop("owner_approval")
            self.assertFalse(self.result(spec)["datasets"]["example"]["open"])

    def test_only_official_owner_approved_open_support_accepts_entries(self):
        spec = self.official()
        self.assertTrue(self.result(spec)["datasets"]["example"]["open"])
        spec["scoring_support"]["submissions_open"] = False
        self.assertFalse(self.result(spec)["datasets"]["example"]["open"])

    def test_hidden_dataset_is_omitted_even_if_its_contract_opens(self):
        self.assertEqual(self.result(self.official(), hidden=True)["datasets"], {})

    def test_dev_candidates_stay_closed_to_official_and_production_intake(self):
        spec = {"status": "candidate_native_support", "scoring_support": {
            "status": "owner_review_required", "submissions_open": False,
            "candidate_manifest": {"manifest_sha256": "b" * 64}}}
        for slug in ("ahmedml", "windsorml", "drivaerml", "drivaernetplusplus"):
            availability = self.result(spec, slug=slug)["datasets"][slug]
            self.assertTrue(availability["dev_candidate"])
            self.assertFalse(availability["open"])
            self.assertTrue(availability["guide"])
            self.assertFalse(self.result(spec, slug=slug, branch="main")["datasets"][slug]["dev_candidate"])
        for slug in ("hiliftaeroml", "airfrans"):
            self.assertFalse(self.result(spec, slug=slug)["datasets"][slug]["dev_candidate"])

    def test_snapshot_records_exact_source_and_contract_without_scores(self):
        result = self.result(self.official())
        self.assertEqual(result["source_commit"], "a" * 40)
        self.assertEqual(len(result["manifest_sha256"]), 64)
        self.assertEqual(len(result["datasets"]["example"]["specification_sha256"]), 64)
        self.assertNotIn("metrics", json.dumps(result))


if __name__ == "__main__":
    unittest.main()
