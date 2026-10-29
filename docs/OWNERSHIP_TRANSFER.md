# Repository ownership transfer checklist

This checklist prepares the website and submission repositories for transfer to the `fluidsbench` organisation while retaining the current `dev` workflow. Transferring ownership and publishing the official release are separate operations. The documentation cleanup does not perform either operation.

## Before transfer

- Confirm the destination repository names and organisation access for maintainers, dataset owners and automation.
- Preserve branches, tags, releases, release assets, commit history and branch protections. Record Pages, custom-domain, deployment environment, secret and token settings so they can be checked after transfer.
- Keep participant links pointing at the current repositories until the transfer is complete. Relative links within each repository already follow its owner and branch.

## Update active destinations

- In the website `_config.yml`, update `submission_repository_url` and `website_repository_url`. These settings control participant page, footer and leaderboard submission links.
- Update active links in both repository READMEs, contributor instructions, issue/PR templates and clone examples. GitHub renders these files directly, so they do not use the website's Liquid configuration.
- Review cross-repository checkout destinations in `.github/workflows/`. Preserve each pinned revision while changing its repository destination.
- Review raw feed URLs in `_config.yml`, `_config_preview.yml` and `_config_leaderboard_review.yml`. Keep the preview on its intended branch and production on its intended immutable release. Update Git remotes and verify deployment permissions, Pages settings and the `fluidsbench.org` custom domain.

Search both repositories for `neilashton/fluidsbench` and `raw.githubusercontent.com/neilashton/fluidsbench` to find remaining references. Classify each match before changing it.

## Preserve scientific and historical identities

Historical PR references, immutable evaluator/source revisions, approved support manifests, published package hashes and release records are not navigation settings. Preserve their meaning and verify that their URLs still resolve after transfer. Download URLs embedded in hash-bound support manifests require the documented support-release process if they must change; do not bulk-rewrite or regenerate those records solely to remove the former owner name.

## Verify before promoting the website

1. Run the submission repository checks and the website checks in [CONTRIBUTING.md](../CONTRIBUTING.md#local-checks), including a complete preview build.
2. From a fresh checkout or fork under the new owner, follow **Start here → dataset index → quickstart → package validation → submission PR**. Check the actual PR target, contributor CI permissions and support downloads.
3. Confirm an accepted result can complete maintainer review, registration or approval, feed generation and preview publication. Inspect the row, score, replacement/history behaviour and profile plots.
4. Check the deployed preview's dataset availability, documentation links, clone commands and submission buttons. Confirm the 5 December Anywhere on Earth cutoff remains unchanged.
5. Promote the reviewed website through the repository's protected-branch process only when the launch decision is made. Ownership transfer alone does not open closed datasets or turn preview references into official results.
