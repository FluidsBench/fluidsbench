# FluidsBench

**An open benchmark for the next generation of Computational Fluid Dynamics AI models.**

FluidsBench brings together dataset-specific benchmark definitions, public scored ground truth, structured result validation, and versioned leaderboards for academic comparison.

- [FluidsBench website](https://fluidsbench.org/)
- [Development review site](https://fluidsbench.org/review-x4n7q9m2vk6p/) — work in progress
- [Result specifications and submission repository](https://github.com/neilashton/fluidsbench-submission)

## Current status

**Submissions are currently closed.**

The current leaderboard is a prototype. Displayed rows and profile curves are illustrative dummy data, not official results, and should not be cited or promoted as leaderboard claims.

## Evaluation approach

FluidsBench follows an open reproducibility track: evaluation partitions, scored case lists, ground truth, scoring locations, and metric definitions are public.

Submitters run their own models, map predictions to each dataset's official scoring support, calculate the required metrics and profiles using the published definitions, and provide a structured result package. FluidsBench validates that package and publishes approved values, tables, figures, and comparisons. It does not execute submitted models or recompute the base metrics from full prediction fields.

Public code, model, environment, documentation, and prediction artifacts are optional. When supplied, their stable links, revisions, digests, licences, and validation status can be reported alongside the result. Their absence does not affect accuracy ranking, citation eligibility, or promotion eligibility.

## Repository responsibilities

This repository contains the FluidsBench website, leaderboard interface, public profile-ground-truth data, release tooling, and website copies of shared data-contract schemas.

The companion [fluidsbench-submission repository](https://github.com/neilashton/fluidsbench-submission) contains dataset benchmark specifications, public scoring-support releases, schemas, validation tooling, and structured result packages.

Changes that alter a shared schema or dataset contract normally require coordinated pull requests in both repositories.

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

## Validation

With `fluidsbench-submission` cloned alongside this repository:

```bash
python3 bin/check_profile_contract.py \
  --submission-root ../fluidsbench-submission
node bin/check_leaderboard_claim_ui.js
python3 -m unittest discover -s tests -p "test_release_snapshot.py"
bundle exec jekyll build --lsi
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the protected-branch workflow and review-deployment checks.

## Theme and licence

The website is built with [Jekyll](https://jekyllrb.com/) and uses [al-folio](https://github.com/alshedivat/al-folio) as its theme foundation. The retained theme and website code are distributed under the repository's [MIT License](LICENSE).

## Contact

Questions can be sent to [admin@fluidsbench.org](mailto:admin@fluidsbench.org).
