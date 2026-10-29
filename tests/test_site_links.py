import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("site_links", Path(__file__).resolve().parents[1] / "bin/check_site_links.py")
links = importlib.util.module_from_spec(spec)
spec.loader.exec_module(links)


class SiteLinksTest(unittest.TestCase):
    def test_rendered_links_include_root_relative_and_same_origin_targets(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            (root / "dataset").mkdir()
            (root / "dataset/index.html").write_text('<a href="../">Home</a>')
            (root / "index.html").write_text('<a href="/dataset/">Dataset</a><a href="https://fluidsbench.org/dataset/">Canonical</a><a href="https://example.org/outside">External</a>')
            self.assertEqual(links.validate(root), [])
            (root / "dataset/index.html").unlink()
            self.assertEqual(len(links.validate(root)), 2)

    def test_missing_asset_and_parent_escape_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            (root / "index.html").write_text('<img src="/missing.png"><a href="../outside.html">Outside</a>')
            self.assertEqual(len(links.validate(root)), 2)
