import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "bin"))
from refresh_css_hashes import refresh


class StylesheetCacheTests(unittest.TestCase):
    def test_changed_purged_css_gets_a_new_url_without_changing_sass(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            css = root / "assets/css/main.css"
            css.parent.mkdir(parents=True)
            css.write_text(".launch-countdown-card{background:green}")
            page = root / "index.html"
            page.write_text(f'<link href="/review-test/assets/css/main.css?{"a" * 32}">')
            self.assertEqual(refresh(root, check=True), [page])
            refresh(root)
            first = page.read_text()
            self.assertEqual(refresh(root), [])
            css.write_text(css.read_text() + ".launch-clock{display:flex}")
            self.assertEqual(refresh(root, check=True), [page])
            self.assertEqual(page.read_text(), first)  # Check mode does not rewrite files.
            refresh(root)
            self.assertNotEqual(page.read_text(), first)
            digest = hashlib.sha256(css.read_bytes()).hexdigest()
            self.assertIn(f"/review-test/assets/css/main.css?{digest}", page.read_text())

    def test_only_local_fingerprinted_css_is_rewritten(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            css = root / "assets/css/main.css"
            css.parent.mkdir(parents=True)
            css.write_text("body{color:black}")
            old = "a" * 32
            untouched = (
                f'<link href="https://example.com/assets/css/main.css?{old}">'
                f'<link href="//example.com/assets/css/main.css?{old}">'
                '<link href="/assets/css/main.css?theme=dark">'
                f'<script src="/assets/js/launch.js?{old}"></script>'
            )
            page = root / "index.html"
            page.write_text(untouched + f"<link href='/assets/css/main.css?{old}#theme'>")
            refresh(root)
            self.assertTrue(page.read_text().startswith(untouched))
            digest = hashlib.sha256(css.read_bytes()).hexdigest()
            self.assertIn(f"href='/assets/css/main.css?{digest}#theme'", page.read_text())


if __name__ == "__main__":
    unittest.main()
