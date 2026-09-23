from __future__ import annotations

import argparse
import hashlib
import json
import sys
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "bin"))

import check_release_snapshot  # noqa: E402


RELEASE_ID = "fluidsbench-2026-07"
ARTIFACT_COMMIT = "b" * 40
SOURCE_COMMIT = "a" * 40
WEBSITE_COMMIT = "f" * 40
MANIFEST_SHA256 = "d" * 64
ASSET_BASE_URL = f"https://raw.githubusercontent.com/neilashton/fluidsbench-submission/{RELEASE_ID}/"


def official_manifest() -> dict[str, object]:
    return deepcopy(json.loads((ROOT / "tests" / "fixtures" / "official-release-manifest.json").read_text(encoding="utf-8")))


class ReleaseSnapshotTests(unittest.TestCase):
    def test_official_manifest_and_config_are_accepted(self) -> None:
        manifest = official_manifest()
        self.assertEqual(check_release_snapshot.validate_manifest(manifest, RELEASE_ID, ARTIFACT_COMMIT), [])
        config = check_release_snapshot.release_config(
            RELEASE_ID, ASSET_BASE_URL, MANIFEST_SHA256, ARTIFACT_COMMIT, WEBSITE_COMMIT
        )
        self.assertEqual(
            check_release_snapshot.validate_config(
                config, manifest, MANIFEST_SHA256, RELEASE_ID, ARTIFACT_COMMIT, WEBSITE_COMMIT
            ),
            [],
        )

    def test_transferred_repository_and_historical_manifests_are_accepted(self) -> None:
        for owner in ("FluidsBench", "neilashton"):
            with self.subTest(owner=owner):
                manifest = official_manifest()
                manifest["data_release"]["source_repository"] = (
                    f"https://github.com/{owner}/fluidsbench-submission"
                )
                self.assertEqual(
                    check_release_snapshot.validate_manifest(
                        manifest, RELEASE_ID, ARTIFACT_COMMIT
                    ),
                    [],
                )
        manifest = official_manifest()
        manifest["data_release"]["source_repository"] = (
            "https://github.com/unrelated-owner/fluidsbench-submission"
        )
        self.assertTrue(any(
            "source_repository" in error
            for error in check_release_snapshot.validate_manifest(
                manifest, RELEASE_ID, ARTIFACT_COMMIT
            )
        ))

    def test_manifest_rejects_mutable_or_mismatched_release_metadata(self) -> None:
        manifest = official_manifest()
        manifest["data_release"]["status"] = "prototype_dummy_data"  # type: ignore[index]
        manifest["data_release"]["release_view_url"] = "https://fluidsbench.org/"  # type: ignore[index]
        manifest["data_release"]["asset_base_url"] = "https://example.test/latest/?release=1"  # type: ignore[index]
        errors = check_release_snapshot.validate_manifest(manifest, RELEASE_ID, ARTIFACT_COMMIT)
        self.assertTrue(any("status" in error for error in errors))
        self.assertTrue(any("release_view_url" in error for error in errors))
        self.assertTrue(any("asset_base_url" in error for error in errors))

    def test_manifest_accepts_and_validates_dataset_scoring_support(self) -> None:
        manifest = official_manifest()
        manifest["datasets"] = [  # type: ignore[index]
            {
                "name": "Example",
                "slug": "example",
                "scoring_support": {
                    "status": "official",
                    "release_id": "example-scoring-v1",
                    "manifest_url": "https://example.test/scoring-support/example/manifest.json",
                    "manifest_sha256": "1" * 64,
                    "submissions_open": True,
                    "owner_approval": {
                        "approved_by": "Dataset owner",
                        "approved_at": "2026-07-20T00:00:00Z",
                        "pull_request_url": "https://github.com/example/repository/pull/1",
                    },
                },
            }
        ]
        self.assertEqual(check_release_snapshot.validate_manifest(manifest, RELEASE_ID, ARTIFACT_COMMIT), [])

        manifest["datasets"][0]["scoring_support"]["manifest_url"] = "http://example.test/manifest.json"  # type: ignore[index]
        manifest["datasets"][0]["scoring_support"]["manifest_sha256"] = "invalid"  # type: ignore[index]
        errors = check_release_snapshot.validate_manifest(manifest, RELEASE_ID, ARTIFACT_COMMIT)
        self.assertTrue(any("scoring-support manifest_url" in error for error in errors))
        self.assertTrue(any("scoring-support manifest_sha256" in error for error in errors))

        manifest["datasets"][0]["scoring_support"]["manifest_url"] = (  # type: ignore[index]
            "https://example.test/scoring-support/example/manifest.json"
        )
        manifest["datasets"][0]["scoring_support"]["manifest_sha256"] = "1" * 64  # type: ignore[index]
        del manifest["datasets"][0]["scoring_support"]["owner_approval"]  # type: ignore[index]
        errors = check_release_snapshot.validate_manifest(manifest, RELEASE_ID, ARTIFACT_COMMIT)
        self.assertTrue(any("dataset-owner approval" in error for error in errors))

    def test_partial_scoring_support_coverage_is_rejected_when_configured(self) -> None:
        manifest = official_manifest()
        manifest["datasets"] = [  # type: ignore[index]
            {
                "name": "First",
                "slug": "first",
                "scoring_support": {
                    "status": "owner_review_required",
                    "release_id": "first-scoring-v1",
                    "manifest_url": "https://example.test/first/manifest.json",
                    "manifest_sha256": "1" * 64,
                    "submissions_open": False,
                    "closed_reason": "Owner approval pending.",
                },
            },
            {"name": "Second", "slug": "second"},
        ]
        errors = check_release_snapshot.validate_manifest(manifest, RELEASE_ID, ARTIFACT_COMMIT)
        self.assertTrue(any("cover every dataset" in error for error in errors))

    def test_owner_review_gate_does_not_claim_a_nonexistent_support_release(self) -> None:
        manifest = official_manifest()
        manifest["datasets"] = [  # type: ignore[index]
            {
                "name": "Pending",
                "slug": "pending",
                "scoring_support": {
                    "status": "owner_review_required",
                    "submissions_open": False,
                    "closed_reason": "Dataset-owner decisions remain outstanding.",
                    "owner_decisions_required": ["approve_support_locations"],
                },
            }
        ]
        self.assertEqual(check_release_snapshot.validate_manifest(manifest, RELEASE_ID, ARTIFACT_COMMIT), [])

    def test_release_id_cannot_escape_target_folder(self) -> None:
        self.assertTrue(check_release_snapshot.validate_release_id("../current"))
        self.assertTrue(check_release_snapshot.validate_release_id("Release_1"))
        self.assertEqual(check_release_snapshot.validate_release_id(RELEASE_ID), [])
        self.assertEqual(check_release_snapshot.validate_release_id("release.1-rc.2"), [])
        self.assertEqual(check_release_snapshot.validate_release_id("r" * 160), [])
        self.assertTrue(check_release_snapshot.validate_release_id("r" * 161))

    def test_build_checker_rejects_internal_links_outside_snapshot(self) -> None:
        manifest = official_manifest()
        config = check_release_snapshot.release_config(
            RELEASE_ID, ASSET_BASE_URL, MANIFEST_SHA256, ARTIFACT_COMMIT, WEBSITE_COMMIT
        )
        canonical = f"https://fluidsbench.org/releases/{RELEASE_ID}/"
        safe_html = f'''<!doctype html>
<html><head><link rel="canonical" href="{canonical}">
<meta name="fluidsbench-release-id" content="{RELEASE_ID}">
<meta name="fluidsbench-submission-commit" content="{ARTIFACT_COMMIT}">
<meta name="fluidsbench-website-commit" content="{WEBSITE_COMMIT}">
<meta name="fluidsbench-manifest-sha256" content="{MANIFEST_SHA256}"></head>
<body><a href="/releases/{RELEASE_ID}/datasets/">Datasets</a>
<script>const configuredLeaderboardBaseUrl = {json.dumps(ASSET_BASE_URL)};
const configuredManifestSha256 = {json.dumps(MANIFEST_SHA256)};</script></body></html>'''
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "index.html").write_text(safe_html, encoding="utf-8")
            self.assertEqual(
                check_release_snapshot.validate_build(
                    root, config, manifest, MANIFEST_SHA256, RELEASE_ID, ARTIFACT_COMMIT, WEBSITE_COMMIT
                ),
                [],
            )
            (root / "index.html").write_text(safe_html.replace("</body>", '<a href="../../current/">Current</a></body>'), encoding="utf-8")
            errors = check_release_snapshot.validate_build(
                root, config, manifest, MANIFEST_SHA256, RELEASE_ID, ARTIFACT_COMMIT, WEBSITE_COMMIT
            )
            self.assertTrue(any("escapes the immutable release prefix" in error for error in errors))

            unscoped = root / "assets" / "html"
            unscoped.mkdir(parents=True)
            (unscoped / "demo.html").write_text(safe_html, encoding="utf-8")
            errors = check_release_snapshot.validate_build(
                root, config, manifest, MANIFEST_SHA256, RELEASE_ID, ARTIFACT_COMMIT, WEBSITE_COMMIT
            )
            self.assertTrue(any("unscoped static content" in error for error in errors))

    def test_build_checker_rejects_tampered_config(self) -> None:
        manifest = official_manifest()
        config = deepcopy(
            check_release_snapshot.release_config(
                RELEASE_ID, ASSET_BASE_URL, MANIFEST_SHA256, ARTIFACT_COMMIT, WEBSITE_COMMIT
            )
        )
        config["leaderboard_base_url"] = "https://example.test/latest/"
        self.assertTrue(
            check_release_snapshot.validate_config(
                config, manifest, MANIFEST_SHA256, RELEASE_ID, ARTIFACT_COMMIT, WEBSITE_COMMIT
            )
        )

    def test_claim_asset_list_is_locally_hash_verified(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            record_path = root / "leaderboard" / "claims" / "dataset" / "split" / "model.json"
            record_path.parent.mkdir(parents=True)
            record_path.write_bytes(b'{"claim_id":"claim-1"}\n')
            record_sha256 = hashlib.sha256(record_path.read_bytes()).hexdigest()
            index = {
                "record_count": 1,
                "records": [{"file": "leaderboard/claims/dataset/split/model.json", "sha256": record_sha256}],
            }
            index_path = root / "leaderboard" / "claims" / "index.json"
            index_path.write_text(json.dumps(index), encoding="utf-8")
            manifest = {
                "data_release": {
                    "claims": {
                        "index_file": "leaderboard/claims/index.json",
                        "index_sha256": hashlib.sha256(index_path.read_bytes()).hexdigest(),
                        "record_count": 1,
                    }
                }
            }
            manifest_path = root / "leaderboard" / "manifest.json"
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            output = root / "claim-assets.tsv"
            result = check_release_snapshot.claim_assets(
                argparse.Namespace(repository_root=root, manifest=manifest_path, output=output)
            )
            self.assertEqual(result, 0)
            self.assertEqual(
                output.read_text(encoding="utf-8"),
                f"leaderboard/claims/dataset/split/model.json\t{record_sha256}\n",
            )

    def test_scoring_support_manifest_list_preserves_dataset_and_digest(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            manifest = {
                "datasets": [
                    {
                        "slug": "example",
                        "scoring_support": {
                            "status": "official",
                            "release_id": "example-scoring-v1",
                            "manifest_url": "https://example.test/scoring-support/manifest.json",
                            "manifest_sha256": "2" * 64,
                            "submissions_open": True,
                        },
                    }
                ]
            }
            manifest_path = root / "manifest.json"
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            output = root / "scoring-support.tsv"
            result = check_release_snapshot.scoring_support_manifests(
                argparse.Namespace(manifest=manifest_path, output=output)
            )
            self.assertEqual(result, 0)
            self.assertEqual(
                output.read_text(encoding="utf-8"),
                f"example\thttps://example.test/scoring-support/manifest.json\t{'2' * 64}\n",
            )

            manifest["datasets"][0]["scoring_support"] = {  # type: ignore[index]
                "status": "owner_review_required",
                "submissions_open": False,
                "closed_reason": "Owner approval pending.",
            }
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            self.assertEqual(
                check_release_snapshot.scoring_support_manifests(
                    argparse.Namespace(manifest=manifest_path, output=output)
                ),
                0,
            )
            self.assertEqual(output.read_text(encoding="utf-8"), "")


if __name__ == "__main__":
    unittest.main()
