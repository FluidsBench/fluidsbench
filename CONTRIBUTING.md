# Contributing to FluidsBench

This repository contains the public website and leaderboard interface. Dataset contracts, scoring-support releases, submission schemas, validators, and result packages belong in [fluidsbench-submission](https://github.com/neilashton/fluidsbench-submission). A change that crosses that boundary should use two linked pull requests.

## Workflow

The `dev` and `master` branches are protected. Do not push directly to either branch or edit the generated `gh-pages` branch.

1. Update your local `dev` branch.
2. Create a focused feature branch.
3. Make the change and run the relevant checks.
4. Open a pull request targeting `dev`.
5. Resolve automated checks and CODEOWNER review.
6. Inspect the merged change on the [development review site](https://fluidsbench.org/review-x4n7q9m2vk6p/).
7. Promote reviewed changes to `master` through a separate pull request.

For dataset-scientific changes, the dataset owner's recorded approval is distinct from the repository CODEOWNER approval and protected-branch merge.

## Local development

### Docker

Docker is the simplest way to run the website locally:

```bash
git clone https://github.com/neilashton/fluidsbench.git
cd fluidsbench
git switch dev
docker compose pull
docker compose up
```

Open <http://localhost:8080>. Changes are rebuilt automatically.

### Native Jekyll

With Ruby 3.2, Bundler, Python, and Jupyter available:

```bash
bundle install
python3 -m pip install --upgrade jupyter
bundle exec jekyll serve --lsi
```

Open <http://localhost:4000>.

## Local checks

Install the pinned Node dependencies and confirm the Ruby bundle:

```bash
npm ci
bundle check
```

With `fluidsbench-submission` cloned alongside this repository, run the website and leaderboard checks. Match the data revision pinned in `.github/workflows/profile-contract.yml` when reproducing CI. Create a second checkout named `fluidsbench-submission-schemas` at that workflow's schema revision: optional contract additions can advance independently of the immutable results feed. Both schema equality and result integrity are checked.

```bash
npx prettier . --check
node bin/check_leaderboard_claim_ui.js
python3 -m unittest discover -s tests -p "test_*.py"
python3 bin/check_dataset_pages.py \
  --submission-root ../fluidsbench-submission
python3 bin/check_profile_contract.py \
  --submission-root ../fluidsbench-submission \
  --schema-root ../fluidsbench-submission-schemas
python3 bin/prepare_submission_status.py \
  --submission-root ../fluidsbench-submission --check
ruby bin/check_launch_contract.rb
node --test tests/test_launch.js tests/test_leaderboard_compute.js
JEKYLL_ENV=production bundle exec jekyll build --lsi
```

The dataset-page check verifies source snapshots, visual assets, getting-started guides, split status, and scientific-contract digests.
For a development build without production settings, use `bundle exec jekyll build --lsi`.

When refreshing a source dataset description or image, also run the live revision audit:

```bash
python3 bin/check_dataset_pages.py --check-live-sources
```

To reproduce the review deployment:

```bash
JEKYLL_ENV=production bundle exec jekyll build --lsi \
  --config _config.yml,_config_preview.yml
rm -f _site/CNAME _site/feed.xml _site/robots.txt _site/sitemap.xml
rm -rf _site/assets/html _site/assets/jupyter _site/assets/plotly _site/leaderboards
python3 bin/check_preview_build.py _site /review-x4n7q9m2vk6p
```

## Pull-request scope

A pull request should explain:

- what changed and why;
- the user or developer impact;
- any paired pull request in `fluidsbench-submission`;
- which checks were run;
- any scientific decision, unresolved assumption, or prototype data affected.

Keep unrelated changes in separate pull requests.

## Licence

By contributing, you agree that your contribution is distributed under the [repository licence](LICENSE).
