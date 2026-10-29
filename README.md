# FluidsBench

FluidsBench is an open benchmark for evaluating machine-learning models on realistic fluid dynamics problems. It brings together public datasets, shared evaluation tools and leaderboards to compare prediction accuracy and computational cost across models. This repository contains the FluidsBench website and leaderboard interface.

## Start here

- **[Choose a dataset and submit a result](https://github.com/FluidsBench/fluidsbench-submission/tree/main)** — quickstarts, evaluation tools and submission instructions.
- **[Explore the website](https://fluidsbench.org/)** — dataset descriptions and benchmark information.
- **[Contribute to the website](CONTRIBUTING.md)** — setup, validation and development instructions.

## Evaluation and results

Evaluation partitions, case lists, ground truth, scoring locations, and metric definitions are public. Submitters run their
models, map predictions to official support, and calculate metrics and profiles using the published definitions. FluidsBench
validates the result package and publishes approved submitted values; it does not execute models or recompute base metrics
from full prediction fields.

Public code, models, environments, documentation, and predictions are optional. When supplied, their links, revisions, digests,
licences, and check status accompany the result. Their absence does not affect accuracy ranking, citation, or promotion eligibility.

Only the latest published version in a result series is ranked. Earlier versions can appear as unranked historical rows;
result details link the immutable v1/v2/v3 history with dates and change summaries. Current scalar feeds and claims remain
latest-only; the submission repository publishes the complete hash-bound history in `leaderboard/revisions.json`.

## Contributing to the website

This repository contains the website, leaderboard interface, public profile-truth data, release tooling, and copies of shared
data-contract schemas. The [submission repository](https://github.com/FluidsBench/fluidsbench-submission) owns benchmark
specifications, scoring-support releases, submission schemas, validators, and result packages. Shared contract changes need
coordinated PRs in both repositories.

See [CONTRIBUTING.md](CONTRIBUTING.md) for Docker/native setup, validation commands, preview builds, and the protected-branch workflow.

<a id="evaluation-approach"></a>
<a id="repository-responsibilities"></a>
<a id="result-versions"></a>
<a id="local-development"></a>
<a id="docker"></a>
<a id="native-jekyll"></a>
<a id="validation"></a>

The former setup and validation sections are now in the [contributor guide](CONTRIBUTING.md#local-development).

## Theme and licence

The website is built with [Jekyll](https://jekyllrb.com/), with a custom FluidsBench design on the retained
[al-folio](https://github.com/alshedivat/al-folio) layout and theme foundation.
The retained theme and website code use the [MIT License](LICENSE). Third-party libraries, datasets, photographs and other
assets retain their own licences or permissions; the repository licence does not override those terms.

## Contact

[admin@fluidsbench.org](mailto:admin@fluidsbench.org)

## Organising committee

| Name | Affiliation |
| --- | --- |
| Neil Ashton | Mistral |
| Paola Cinnella | Sorbonne University |
| Astrid Walle | Pasteur Labs |
| Mohamed Elrefaie | MIT |
| Jean Kossaifi | NVIDIA |
| Ricardo Vinuesa | University of Michigan |
| Daniel Leibovici | NVIDIA |
| Faez Ahmed | MIT |
| Emanuele Tamburini | Sorbonne University |
| Tyler Buchanan | TU Delft |

Meet the [organisers and contributors](https://fluidsbench.org/contributors/) and the
[scientific and industrial advisory board](https://fluidsbench.org/contributors/#advisory-board).

Visit the [FluidsBench website](https://fluidsbench.org/) for dataset information, benchmark news and community links.
