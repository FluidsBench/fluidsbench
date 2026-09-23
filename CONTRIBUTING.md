# Contributing to FluidsBench

Thank you for contributing to FluidsBench.

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

## Local checks

Install the pinned Node dependencies and confirm the Ruby bundle:

```bash
npm ci
bundle check
```

Run the website and leaderboard checks:

```bash
npx prettier . --check
node bin/check_leaderboard_claim_ui.js
python3 -m unittest discover -s tests -p "test_release_snapshot.py"
python3 bin/check_profile_contract.py \
  --submission-root ../fluidsbench-submission
JEKYLL_ENV=production bundle exec jekyll build --lsi
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
