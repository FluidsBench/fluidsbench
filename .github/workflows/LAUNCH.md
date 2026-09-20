# Staged leaderboard launch

The campaign is configured in `_data/launch.yml`. The current dates are **provisional**: opening 6 October 2026 at 15:00 UTC,
first-release cutoff 17 November at 23:59 UTC, and reveal 24 November at 15:00 UTC. These are development settings, not an
announcement that datasets are accepting submissions. The website production branch is named `master`; submission production is `main`.

## Phases

| Phase        | Homepage                   | Submission behaviour                                                                |
| ------------ | -------------------------- | ----------------------------------------------------------------------------------- |
| `announced`  | Announcement and countdown | Prepare using the guides; no submission CTA, even if a dataset is ready.            |
| `collecting` | Announcement and countdown | Only owner-approved, official, open datasets get a submission CTA.                  |
| `reviewing`  | Announcement and countdown | Review the frozen first cohort; new submissions remain possible for later releases. |
| `live`       | Existing leaderboard       | Rolling submissions to open datasets; use a checked, immutable official release.    |

Time passing never changes dataset approval or publishes a ranking. The clock displays a pending-publication message at expiry.
For provisional dates it instead explains that the date needs confirmation. No URL query parameter bypasses prelaunch mode.
Retired standalone result demos are excluded from site builds. Public source repositories remain public.

## Before announcing or collecting

1. Agree the two deadlines and a reveal time, set `dates_confirmed: true`, and nominate a release maintainer and backup, dataset
   reviewers, and a community contact. Set `community_discord_url` when a public invite exists. The site already has GitHub/contact fallbacks.
2. Select datasets whose owners have completed the actual scientific activation requirements. Exercise a complete external-style
   submission for each one. Site configuration cannot open a closed scoring contract. BlendedNet remains hidden.
3. Promote the tested submission contract to submission `main` before directing real participants to submit against it. Pin the
   matching source commit in website `_config.yml`, `_config_preview.yml`, `_config_leaderboard_review.yml` (local data URL), and the
   checkout in `profile-contract.yml`. Keep the raw data URLs consistent with that pin. Regenerate the score-free availability snapshot:

   ```sh
   python3 bin/prepare_submission_status.py --submission-root ../fluidsbench-submission
   python3 bin/prepare_submission_status.py --submission-root ../fluidsbench-submission --check
   ```

4. Review the announcement and submission pages on `dev`. Set `phase: collecting` only when ready to receive entries. Promote the
   reviewed website to production separately, when authorised; pushing `dev` publishes only the review prefix.

Availability is generated from each specification's official status, official scoring-support status, open flag and complete owner
approval. The Ruby build guard rejects mismatched source pins. CI compares the generated snapshot against the pinned repository.

## Review first; publish the cohort together

Use the submission repository's existing contributor PR checks. Merge a valid participant package while it is **unapproved** and
therefore absent from public feeds. Use PR review/comments or workflow labels to communicate received, changes requested and review
complete. Those operational labels are not formal approval. Maintainers may review throughout the collection window.

The existing **Maintainer approve and regenerate** workflow prepares a draft approval PR and regenerated feeds. Keep that draft
unmerged until preparing the publication cohort. If preparing approval documents separately, the existing
`manage_leaderboard.py approve --skip-feed-build` command supports that operation; it does not constitute publication by itself.
Do not reuse prototype statuses for genuine results waiting for publication.

At cutoff, set `phase: reviewing` and record the eligible PRs and exact participant commits. Packages must meet the published rules
at cutoff; review/CI queue time alone does not make them late. Substantive later changes go into the next cohort. Incomplete or
invalid submissions stay pending. Keep dataset gates open for later entries.

Prepare formal approvals and the first official feed in a reviewed release branch. The release must use the existing official
manifest, evidence and immutable-asset contracts. Finalise approvals and regenerate the complete feed once for the chosen new
release ID before publishing any official claim index. Do not add one submission at a time to an already sealed official release.
The builder rejects changes under an existing official release ID; every later publication needs a new release ID.

## Reveal

1. Finish scientific review and source checks. Publish the immutable assets using the existing release process and verify their bytes.
2. Run **Publish immutable leaderboard release snapshot** from website production `master`, using the exact artifact commit and
   release ID. It checks source provenance, immutable hashes and published assets, then publishes `/releases/<id>/`. It also prepares
   the score-free availability data for that same artifact commit. It cannot publish from `dev` or overwrite an existing snapshot.
3. Prepare the root-site change on `dev`: set `phase: live`, confirmed dates, and `release_id`; regenerate availability from that exact
   artifact commit; set `submission_source_ref`, `leaderboard_base_url` to the immutable asset base, and
   `leaderboard_manifest_sha256` to the exact manifest digest. Update preview pins and CI together. Never select floating `main` as a live feed.
4. Review and validate the resulting site. Merge the prepared production change at the agreed reveal time. The GitHub Pages deployment
   takes time; the countdown is informational and safely waits if publication is delayed. Do not rely on an exact-second cron trigger.
5. Check the public homepage, ranks, profiles, dataset links, result permalinks and first-release archive, then announce that it is live.
   Keep a backup maintainer available. To roll back a failed root deployment, deploy the last good announcement commit; preserve published
   immutable release directories and use a new release ID for any result corrections.

The live build fails if the selected release is a prototype, the ID differs, the feed is not the pinned immutable asset base, or the
manifest digest differs. Approval, metadata checks and optional additional prediction checks retain their existing meanings.

## Local review and checks

For a normal announcement build, use `_config.yml` (plus `_config_preview.yml` for the hosted dev prefix). For the preserved full
leaderboard, build a separate local destination:

```sh
bundle exec jekyll build --config _config.yml,_config_leaderboard_review.yml --destination /tmp/fluidsbench-leaderboard-review
python3 -m http.server 8092 --bind 127.0.0.1 --directory /tmp/fluidsbench-leaderboard-review
```

The local leaderboard override requires a loopback site URL, `preview_mode` and `local_ux_preview`. It is rejected on the public dev URL.

```sh
ruby bin/check_launch_contract.rb
node --test tests/test_launch.js
python3 -m unittest discover -s tests -p 'test_*.py'
python3 bin/prepare_submission_status.py --submission-root ../fluidsbench-submission --check
python3 bin/check_launch_build.py _site --phase announced
```

The hosted preview also runs its existing noindex/path checks. Check desktop/mobile, dark mode, the countdown's expired state,
no-JavaScript date fallback, hidden-dataset exclusions, and the real preserved leaderboard before release. Community setup, actual
dataset activation and outward launch communications are separate operational steps; developing this site does not perform them.
