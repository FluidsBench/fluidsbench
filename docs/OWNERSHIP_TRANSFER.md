# Repository ownership and deployment

The move to the FluidsBench organisation is complete. The production sources are
[FluidsBench/fluidsbench](https://github.com/FluidsBench/fluidsbench) for the website
and [FluidsBench/fluidsbench-submission](https://github.com/FluidsBench/fluidsbench-submission)
for evaluation tools, submission contracts and result packages. Both use `main`.
The website is live at [fluidsbench.org](https://fluidsbench.org/).

## Completed migration

The new repositories started from the final reviewed source snapshots, without
inheriting the personal repositories' branch history or trial submissions.
Required scientific support releases and assets were mirrored under FluidsBench
with their original payload bytes and checksums. Trial model packages were not
promoted into the production submission directories or leaderboard feeds.

## Current change and publication process

- Propose changes on topic branches and open pull requests against `main`.
- Participant PRs add one new result directory in the submission repository;
  maintainers handle approval and official publication separately.
- Merging a website change runs the production build and deploys it through
  GitHub Pages. The custom domain is `fluidsbench.org`.
- The website's `_config.yml` selects the submission documentation revision and
  leaderboard data revision. Update the matching CI checkout and availability
  snapshot when advancing the submission documentation/contract pin.
- The public leaderboard preview uses a separately pinned empty feed. Keep that
  pin independent of future submissions and official result releases.
- Publish official results using the [immutable release workflow](../.github/workflows/RELEASE_SNAPSHOTS.md).
  The 5 December 2026 Anywhere on Earth cutoff does not publish results automatically.

Use the checks in [CONTRIBUTING.md](../CONTRIBUTING.md#local-checks) before merging.
Scientific changes spanning both repositories require coordinated pull requests.
The five open datasets and four coming-soon datasets are governed by the submission
contracts and the website's checked availability snapshot.

## Preserve scientific provenance

Active participant links, clone commands, help links and downloads use FluidsBench
ownership. Historical approval PRs, evaluator/source revisions, hash-bound support
manifests and validation evidence retain their original identities. Do not rewrite
those records solely to remove the former owner or a historical release suffix.
The submission repository's `reference/hosting.py` resolves original archive URLs
to checksum-identical FluidsBench mirrors where needed.

The website retains its MIT-licensed Jekyll/al-folio foundation. Submission code
and leaderboard metadata use Apache 2.0. Dataset and third-party asset licences
remain separate from these repository licences.
