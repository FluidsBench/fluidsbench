from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "bin"))
import check_launch_build


class LaunchBuildTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.write("index.html", '<div data-launch-phase="announced" data-countdown></div>')
        self.write("run/index.html", "Submission guide")
        self.write("datasets/index.html", "Dataset catalogue")
        self.review = (
            '<meta name="robots" content="noindex, nofollow">'
            '<p id="committee-review-notice">Committee preview · Prototype results</p>'
            '<table id="leaderboard-table"></table>'
            '<script>window.FluidsBenchLeaderboardPreviewMode = true;</script>'
            '<script src="/review-x4n7q9m2vk6p/assets/js/leaderboard.js"></script>'
        )

    def write(self, relative, content):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)

    def errors(self, enabled=True):
        return check_launch_build.validate(self.root, "announced", enabled)

    def test_only_explicit_dev_build_allows_the_committee_page(self):
        self.assertEqual(self.errors(False), [])
        self.assertIn("committee review page is missing", self.errors())
        self.write(check_launch_build.COMMITTEE_REVIEW, self.review)
        self.assertEqual(self.errors(), [])
        self.assertIn("committee review page is not enabled for this build", self.errors(False))
        self.write(check_launch_build.COMMITTEE_REVIEW, self.review.replace("= true", "=!0"))
        self.assertEqual(self.errors(), [])

    def test_review_requires_noindex_prototype_label_and_preview_mode(self):
        for text in ('noindex', 'id="committee-review-notice"', 'Prototype results', '= true'):
            with self.subTest(text=text):
                self.write(check_launch_build.COMMITTEE_REVIEW, self.review.replace(text, ""))
                self.assertTrue(self.errors())

    def test_review_exception_cannot_expose_rankings_on_another_page(self):
        self.write(check_launch_build.COMMITTEE_REVIEW, self.review)
        self.write("run/index.html", self.review)
        self.assertIn("prelaunch build exposes a leaderboard in run/index.html", self.errors())

    def test_navigation_links_to_review_are_rejected(self):
        self.write(check_launch_build.COMMITTEE_REVIEW, self.review)
        for link in (
            "/review-x4n7q9m2vk6p/committee-leaderboard/",
            "https://fluidsbench.org/review-x4n7q9m2vk6p/committee-leaderboard/?dataset=drivaerml",
            "../committee-leaderboard/index.html",
        ):
            with self.subTest(link=link):
                self.write("datasets/index.html", f'<a href="{link}">Leaderboard</a>')
                self.assertIn("datasets/index.html links to the unlisted committee review", self.errors())

    def test_discovery_files_cannot_list_review(self):
        self.write(check_launch_build.COMMITTEE_REVIEW, self.review)
        self.write("sitemap.xml", "<loc>https://fluidsbench.org/review-x4n7q9m2vk6p/committee-leaderboard/</loc>")
        self.assertIn("sitemap.xml exposes the unlisted committee review", self.errors())

    def test_coming_soon_mentions_require_status_and_cannot_link_to_results(self):
        for slug, name in check_launch_build.COMING_SOON.items():
            with self.subTest(slug=slug):
                self.write("datasets/index.html", f"<article>{name}</article>")
                self.assertTrue(any("without its Coming soon status" in error for error in self.errors(False)))
                card = f'<article class="dataset-coming-soon" data-dataset-id="{slug}" data-dataset-status="coming-soon">{name} · Coming soon</article>'
                self.write("datasets/index.html", card)
                self.assertEqual(self.errors(False), [])
                self.write("datasets/index.html", card + f'<a href="/?dataset={slug}">Results</a>')
                self.assertTrue(any("links to results for coming-soon dataset" in error for error in self.errors(False)))
        self.write("datasets/index.html", "Dataset catalogue")

    def test_coming_soon_direct_page_cannot_expose_the_evaluation_guide(self):
        slug, name = next(iter(check_launch_build.COMING_SOON.items()))
        card = f'<section class="dataset-coming-soon" data-dataset-id="{slug}" data-dataset-status="coming-soon">{name} · Coming soon</section>'
        self.write(f"datasets/{slug}/index.html", card)
        self.assertEqual(self.errors(False), [])
        self.write(f"datasets/{slug}/index.html", card + '<section id="dataset-start">Download predictions</section>')
        self.assertTrue(any("instead of evaluation instructions" in error for error in self.errors(False)))


if __name__ == "__main__":
    unittest.main()
