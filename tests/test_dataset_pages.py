from __future__ import annotations

import json
import sys
import unittest
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "bin"))

import check_dataset_pages  # noqa: E402


def catalog() -> dict[str, object]:
    return json.loads(check_dataset_pages.CATALOG_PATH.read_text(encoding="utf-8"))


class DatasetPageTests(unittest.TestCase):
    def test_catalog_pages_and_visual_assets_are_complete(self) -> None:
        self.assertEqual(check_dataset_pages.check_local(catalog()), [])

    def test_missing_getting_started_content_is_rejected(self) -> None:
        data = deepcopy(catalog())
        del data["airfrans"]["source"]["availability"]  # type: ignore[index]
        errors = check_dataset_pages.check_local(data)
        self.assertTrue(any("airfrans: missing source availability" in error for error in errors))

    def test_contract_digest_changes_when_scientific_definition_changes(self) -> None:
        spec = {
            "dataset_id": "example",
            "metrics": [{"id": "pressure", "weight": 0.5}],
            "notes": "Documentation-only text is outside the scientific digest.",
        }
        original = check_dataset_pages.contract_digest(spec)

        documentation_edit = deepcopy(spec)
        documentation_edit["notes"] = "Updated prose."
        self.assertEqual(check_dataset_pages.contract_digest(documentation_edit), original)

        scientific_edit = deepcopy(spec)
        scientific_edit["metrics"][0]["weight"] = 0.6  # type: ignore[index]
        self.assertNotEqual(check_dataset_pages.contract_digest(scientific_edit), original)


if __name__ == "__main__":
    unittest.main()
