#!/usr/bin/env python3
"""Build and validate an isolated synthetic release; never publish test artifacts."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

from check_release_snapshot import release_config, validate_build, validate_manifest

ROOT = Path(__file__).resolve().parents[1]


def main():
    manifest = json.loads((ROOT / 'tests/fixtures/official-release-manifest.json').read_text())
    release = manifest['data_release']
    release['archive_url'] = 'https://example.test/archive/' + release['id']
    artifact_commit, website_commit = 'b' * 40, 'f' * 40
    errors = validate_manifest(manifest, release['id'], artifact_commit)
    if errors:
        raise SystemExit('\n'.join(errors))
    manifest_sha = hashlib.sha256(json.dumps(manifest).encode()).hexdigest()
    config = release_config(release['id'], release['asset_base_url'], manifest_sha,
                            artifact_commit, website_commit)
    with tempfile.TemporaryDirectory(prefix='fluidsbench-release-build-') as temporary:
        source = Path(temporary) / 'source'
        destination = Path(temporary) / 'site'
        # Copy current tracked working files, including uncommitted edits under review.
        # Avoid .git, node_modules, local model data and previous builds.
        files = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
        for name in filter(None, files):
            original = ROOT / name
            if not original.is_file():
                continue
            target = source / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(original, target)
        status_path = source / '_data/submission_status.json'
        status = json.loads(status_path.read_text())
        status.update(source_commit=artifact_commit, manifest_sha256=manifest_sha, release=release)
        status_path.write_text(json.dumps(status))
        config_path = Path(temporary) / 'release.yml'
        config_path.write_text(json.dumps({**config, 'enable_google_analytics': False}))
        result = subprocess.run([
            'bundle', 'exec', 'jekyll', 'build', '--source', str(source),
            '--config', f'{source / "_config.yml"},{config_path}',
            '--destination', str(destination),
        ], cwd=ROOT, env={**os.environ, 'JEKYLL_ENV': 'production'},
            text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        if result.returncode:
            raise SystemExit(result.stdout[-6000:])
        errors = validate_build(destination, config, manifest, manifest_sha,
                                release['id'], artifact_commit, website_commit)
        if (destination / 'leaderboard-preview').exists():
            errors.append('release snapshot must not contain the empty prelaunch preview')
        if (destination / 'organisers').exists():
            errors.append('release snapshot must omit the layout-free organisers redirect')
        if errors:
            raise SystemExit('\n'.join(errors))
        print('Complete synthetic release build passed: all HTML has release provenance and scoped links; no prelaunch preview or redirect.')


if __name__ == '__main__':
    main()
