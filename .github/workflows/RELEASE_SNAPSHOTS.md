# Immutable leaderboard release snapshots

Run **Publish immutable leaderboard release snapshot** manually after an official release has been generated and its immutable
assets are already available at the manifest's `data_release.asset_base_url`.

Provide the official release ID (a lowercase release slug using letters, digits, dots, and hyphens), the full 40-character
`fluidsbench-submission` commit containing those release artifacts, and
the requested `publish:<release-id>` confirmation. The workflow validates the official manifest, its source provenance commit,
its exact release-view URL, and the bytes served by its asset base before building the whole site at
`/releases/<release-id>/`. The publication-time leaderboard-manifest SHA-256 is embedded in the snapshot and enforced by the
browser before academic citation or promotion copying can be enabled.

The packaging step removes the legacy `assets/html`, `assets/jupyter`, `assets/plotly`, and `leaderboards` demo directories.
Those standalone HTML files bypass the site layout, so they cannot carry the snapshot's release ID, manifest digest, or source
commit metadata. The checker rejects a snapshot if any of those unscoped directories remain.

The release builder's current-index seal is useful defense in depth, but it only knows the release represented by the current
index. It is not the durable memory of every historical release ID. The publication boundary is the serialized Pages workflow:
it checks `origin/gh-pages` for `releases/<release-id>` and refuses an existing target, then force-fetches and repeats that check
immediately before deployment. The normal root deployment preserves the complete `releases` directory.

For a local non-deploying validation, generate the release override and check a built site with:

```sh
python3 bin/check_release_snapshot.py prepare \
  --manifest ../fluidsbench-submission/leaderboard/manifest.json \
  --release-id <release-id> \
  --artifact-commit <full-release-artifact-commit> \
  --website-commit <full-fluidsbench-commit> \
  --config-out _config_release.yml
bundle exec jekyll build --lsi --config _config.yml,_config_release.yml
python3 bin/check_release_snapshot.py check-build \
  --root _site \
  --config _config_release.yml \
  --manifest ../fluidsbench-submission/leaderboard/manifest.json \
  --release-id <release-id> \
  --artifact-commit <full-release-artifact-commit> \
  --website-commit <full-fluidsbench-commit>
```
