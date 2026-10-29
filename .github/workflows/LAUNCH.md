# Production deployment and leaderboard publication

The production source is `FluidsBench/fluidsbench:main`. Participant submissions
and scientific contracts are in `FluidsBench/fluidsbench-submission:main`.
The website deploys through GitHub Actions Pages artifacts, without a generated
source branch. The `PUBLISH_SITE` repository variable enables deployment only
after launch checks and Pages hosting are configured.

## Collection phase

`phase: collecting` publishes the website and opens AirfRANS Full/Scarce/AoA,
AhmedML, WindsorML, DrivAerML and DrivAerNet++ submissions. Reynolds is closed.
HiLiftAeroML, BlendedNet, Rotor37 and VKI-LS59 remain coming soon.
The initial leaderboard contains zero results. Approval does not publish a result
while the submission manifest is `unreleased`.

The cutoff and planned first release are 5 December 2026, 23:59:59 Anywhere on
Earth (6 December 2026, 11:59:59 UTC). Expiry does not publish results.

## Coordinated changes

Run the submission tests, scoring-support validation and feed check. Pin
`submission_source_ref` and `leaderboard_base_url` in the website configuration
to the reviewed submission commit, regenerate `_data/submission_status.json` and
profile-location bindings, and synchronize changed schemas and the pressure audit.
Run website compatibility tests against both the pinned and current source.

The production build checks native profile bytes, fingerprints final CSS and
validates the launch phase before uploading a Pages artifact. Protect `main`
with required CI and pull-request review. Confirm the public website after deployment.

## First leaderboard release

Record eligible PRs and exact participant commits at the cutoff. Review packages
using contributor and maintainer checks. Prepare the cohort on a release branch,
publish immutable assets and verify their checksums. Run **Publish immutable
leaderboard release snapshot** from `main` with the exact artifact commit and
release ID. Set `phase: live`, `release_id`, the pinned `submission_source_ref`,
immutable `leaderboard_base_url` and `leaderboard_manifest_sha256` together.
The live build rejects unofficial or mismatched releases and floating feeds.
Corrections require new release IDs; preserve published snapshots.
