#!/usr/bin/env python3
"""Prepare and validate an immutable FluidsBench release-site snapshot."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urljoin, urlsplit


SITE_ORIGIN = "https://fluidsbench.org"
SUBMISSION_REPOSITORY = "https://github.com/FluidsBench/fluidsbench-submission"
# The transfer preserves historical manifests and their content hashes.
SUBMISSION_REPOSITORY_ALIASES = {
    SUBMISSION_REPOSITORY,
    "https://github.com/neilashton/fluidsbench-submission",
}
SAFE_RELEASE_ID = re.compile(r"^[a-z0-9](?:[a-z0-9.-]{0,158}[a-z0-9])?$")
FULL_GIT_SHA = re.compile(r"^[0-9a-f]{40}$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
DATASET_ID = re.compile(r"^[a-z0-9][a-z0-9-]*$")
SAFE_ASSET_PATH = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]*$")
URL_ATTRIBUTES = {"action", "href", "poster", "src"}
UNSCOPED_STATIC_PATHS = (
    Path("assets/html"),
    Path("assets/jupyter"),
    Path("assets/plotly"),
    Path("leaderboards"),
)


class SnapshotHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[str] = []
        self.canonical_urls: list[str] = []
        self.has_noindex = False
        self.metadata: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "meta" and values.get("name", "").lower() in {"robots", "googlebot"}:
            directives = {item.strip().lower() for item in values.get("content", "").split(",")}
            self.has_noindex = self.has_noindex or "noindex" in directives
        if tag == "meta" and values.get("name") and values.get("content") is not None:
            self.metadata[values["name"]] = values["content"]
        if tag == "link" and "canonical" in values.get("rel", "").lower().split():
            canonical = values.get("href")
            if canonical:
                self.canonical_urls.append(canonical)

        for name, value in attrs:
            if value is None:
                continue
            if name in URL_ATTRIBUTES:
                self.links.append(value)
            elif name == "srcset":
                self.links.extend(candidate.strip().split()[0] for candidate in value.split(",") if candidate.strip())


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def validate_release_id(release_id: str) -> list[str]:
    if not SAFE_RELEASE_ID.fullmatch(release_id):
        return [
            "release ID must be at most 160 characters, start and end with a lowercase letter or digit, "
            "and otherwise contain only lowercase letters, digits, dots, and hyphens"
        ]
    return []


def clean_https_directory_url(value: object) -> bool:
    if (
        not isinstance(value, str)
        or value != value.strip()
        or any(ord(character) < 32 or ord(character) == 127 for character in value)
    ):
        return False
    try:
        parsed = urlsplit(value)
        parsed.port
    except ValueError:
        return False
    return (
        parsed.scheme == "https"
        and bool(parsed.netloc)
        and parsed.username is None
        and parsed.password is None
        and parsed.query == ""
        and parsed.fragment == ""
        and parsed.path.endswith("/")
        and "//" not in parsed.path
    )


def clean_https_url(value: object) -> bool:
    if (
        not isinstance(value, str)
        or value != value.strip()
        or any(ord(character) < 32 or ord(character) == 127 for character in value)
    ):
        return False
    try:
        parsed = urlsplit(value)
        parsed.port
    except ValueError:
        return False
    return (
        parsed.scheme == "https"
        and bool(parsed.netloc)
        and parsed.username is None
        and parsed.password is None
        and parsed.query == ""
        and parsed.fragment == ""
    )


def safe_asset_path(value: object) -> bool:
    if not isinstance(value, str) or not SAFE_ASSET_PATH.fullmatch(value) or value.startswith("/") or "\\" in value:
        return False
    return all(segment not in {"", ".", ".."} for segment in value.split("/"))


def scoring_support_bindings(manifest: object) -> list[dict[str, object]]:
    if not isinstance(manifest, dict) or not isinstance(manifest.get("datasets"), list):
        return []
    bindings: list[dict[str, object]] = []
    for dataset in manifest["datasets"]:
        if not isinstance(dataset, dict) or not isinstance(dataset.get("scoring_support"), dict):
            continue
        bindings.append({"dataset_id": dataset.get("slug"), **dataset["scoring_support"]})
    return bindings


def validate_manifest(manifest: object, release_id: str, artifact_commit: str) -> list[str]:
    errors = validate_release_id(release_id)
    if not FULL_GIT_SHA.fullmatch(artifact_commit):
        errors.append("submission artifact commit must be a full lowercase 40-character Git SHA")
    if not isinstance(manifest, dict):
        return errors + ["leaderboard manifest must be a JSON object"]

    release = manifest.get("data_release")
    if not isinstance(release, dict):
        return errors + ["leaderboard manifest has no data_release object"]

    if release.get("id") != release_id:
        errors.append(f"manifest data_release.id must equal requested release ID {release_id!r}")
    if release.get("status") != "official":
        errors.append("manifest data_release.status must be official")
    source_commit = release.get("source_commit")
    if not isinstance(source_commit, str) or not FULL_GIT_SHA.fullmatch(source_commit):
        errors.append("manifest data_release.source_commit must be a full lowercase 40-character Git SHA")
    if str(release.get("source_repository", "")).rstrip("/") not in SUBMISSION_REPOSITORY_ALIASES:
        errors.append(f"manifest data_release.source_repository must be {SUBMISSION_REPOSITORY}")

    expected_release_view = f"{SITE_ORIGIN}/releases/{release_id}/"
    if release.get("release_view_url") != expected_release_view:
        errors.append(f"manifest data_release.release_view_url must equal {expected_release_view}")

    asset_base_url = release.get("asset_base_url")
    if not clean_https_directory_url(asset_base_url):
        errors.append("manifest data_release.asset_base_url must be a clean HTTPS directory URL")
    elif unquote(urlsplit(asset_base_url).path.rstrip("/").split("/")[-1]) != release_id:
        errors.append("manifest data_release.asset_base_url must end with the release ID as its final path segment")

    feed_file = manifest.get("all_file")
    feed_sha256 = release.get("feed_sha256")
    if not safe_asset_path(feed_file):
        errors.append("manifest all_file must be a safe repository-relative asset path")
    if not isinstance(feed_sha256, str) or not SHA256.fullmatch(feed_sha256):
        errors.append("manifest data_release.feed_sha256 must be a lowercase SHA-256 digest")

    claims = release.get("claims")
    if not isinstance(claims, dict):
        errors.append("manifest data_release.claims must describe the immutable claim index")
    else:
        if not safe_asset_path(claims.get("index_file")):
            errors.append("manifest data_release.claims.index_file must be a safe repository-relative asset path")
        if not isinstance(claims.get("index_sha256"), str) or not SHA256.fullmatch(claims["index_sha256"]):
            errors.append("manifest data_release.claims.index_sha256 must be a lowercase SHA-256 digest")

    revision_history = release.get("revision_history")
    if not isinstance(revision_history, dict):
        errors.append("manifest data_release.revision_history must describe the immutable version history")
    else:
        if not safe_asset_path(revision_history.get("file")):
            errors.append("manifest data_release.revision_history.file must be a safe repository-relative asset path")
        if not isinstance(revision_history.get("sha256"), str) or not SHA256.fullmatch(revision_history["sha256"]):
            errors.append("manifest data_release.revision_history.sha256 must be a lowercase SHA-256 digest")
        for key in ("record_count", "series_count"):
            if not isinstance(revision_history.get(key), int) or isinstance(revision_history[key], bool) or revision_history[key] < 0:
                errors.append(f"manifest data_release.revision_history.{key} must be a non-negative integer")

    ground_truth = release.get("profile_ground_truth")
    if not isinstance(ground_truth, dict):
        errors.append("manifest data_release.profile_ground_truth must pin a public manifest")
    else:
        if not clean_https_url(ground_truth.get("manifest_url")):
            errors.append("manifest data_release.profile_ground_truth.manifest_url must be a clean HTTPS URL")
        if not isinstance(ground_truth.get("manifest_sha256"), str) or not SHA256.fullmatch(ground_truth["manifest_sha256"]):
            errors.append("manifest data_release.profile_ground_truth.manifest_sha256 must be a lowercase SHA-256 digest")

    support_bindings = scoring_support_bindings(manifest)
    if support_bindings:
        dataset_ids = {
            dataset.get("slug")
            for dataset in manifest.get("datasets", [])
            if isinstance(dataset, dict) and isinstance(dataset.get("slug"), str)
        }
        support_dataset_ids = {binding.get("dataset_id") for binding in support_bindings}
        if support_dataset_ids != dataset_ids:
            errors.append("manifest scoring-support bindings must cover every dataset exactly once")
        for binding in support_bindings:
            dataset_id = binding.get("dataset_id")
            if not isinstance(dataset_id, str) or not DATASET_ID.fullmatch(dataset_id):
                errors.append("manifest scoring-support binding has an invalid dataset ID")
            status = binding.get("status")
            if status not in {"owner_review_required", "official", "retired"}:
                errors.append(f"manifest {dataset_id} scoring-support status is invalid")
            has_release_binding = any(binding.get(key) is not None for key in ("release_id", "manifest_url", "manifest_sha256"))
            if status in {"official", "retired"} or has_release_binding:
                if not isinstance(binding.get("release_id"), str) or not binding["release_id"].strip():
                    errors.append(f"manifest {dataset_id} scoring-support release_id must be a non-empty string")
                if not clean_https_url(binding.get("manifest_url")):
                    errors.append(f"manifest {dataset_id} scoring-support manifest_url must be a clean HTTPS URL")
                if not isinstance(binding.get("manifest_sha256"), str) or not SHA256.fullmatch(binding["manifest_sha256"]):
                    errors.append(f"manifest {dataset_id} scoring-support manifest_sha256 must be a lowercase SHA-256 digest")
            submissions_open = binding.get("submissions_open")
            if not isinstance(submissions_open, bool):
                errors.append(f"manifest {dataset_id} scoring-support submissions_open must be boolean")
            elif submissions_open and status != "official":
                errors.append(f"manifest {dataset_id} cannot open submissions without official scoring support")
            if submissions_open is False and not isinstance(binding.get("closed_reason"), str):
                errors.append(f"manifest {dataset_id} closed scoring support must give a closed_reason")
            owner_approval = binding.get("owner_approval")
            if status == "official" and (
                not isinstance(owner_approval, dict)
                or any(
                    not isinstance(owner_approval.get(key), str) or not owner_approval[key].strip()
                    for key in ("approved_by", "approved_at", "pull_request_url")
                )
            ):
                errors.append(f"manifest {dataset_id} official scoring support must record complete dataset-owner approval")
    return errors


def release_config(
    release_id: str,
    asset_base_url: str,
    manifest_sha256: str,
    artifact_commit: str,
    website_commit: str,
) -> dict[str, object]:
    return {
        "url": SITE_ORIGIN,
        "baseurl": f"/releases/{release_id}",
        "leaderboard_base_url": asset_base_url,
        "leaderboard_manifest_sha256": manifest_sha256,
        "submission_source_ref": artifact_commit,
        "launch": {"phase": "live", "dates_confirmed": True, "release_id": release_id},
        "preview_mode": False,
        "release_snapshot": True,
        "release_snapshot_id": release_id,
        "release_snapshot_submission_commit": artifact_commit,
        "release_snapshot_website_commit": website_commit,
    }


def validate_config(
    config: object,
    manifest: dict[str, Any],
    manifest_sha256: str,
    release_id: str,
    artifact_commit: str,
    website_commit: str,
) -> list[str]:
    expected = release_config(
        release_id,
        manifest["data_release"]["asset_base_url"],
        manifest_sha256,
        artifact_commit,
        website_commit,
    )
    if config != expected:
        return ["release build configuration does not exactly match the validated manifest and snapshot path"]
    return []


def internal_path(url: str, page_url: str) -> str | None:
    candidate = url.strip()
    if not candidate or candidate.startswith(("#", "data:", "javascript:", "mailto:", "tel:")):
        return None
    try:
        parsed = urlsplit(urljoin(page_url, candidate))
    except ValueError:
        return None
    if parsed.scheme != "https" or parsed.netloc != urlsplit(SITE_ORIGIN).netloc:
        return None
    return parsed.path


def deployed_page_url(relative: Path, baseurl: str) -> str:
    relative_url = relative.as_posix()
    if relative_url == "index.html":
        relative_url = ""
    elif relative_url.endswith("/index.html"):
        relative_url = relative_url[: -len("index.html")]
    return urljoin(f"{SITE_ORIGIN}{baseurl}/", relative_url)


def validate_build(
    root: Path,
    config: dict[str, Any],
    manifest: dict[str, Any],
    manifest_sha256: str,
    release_id: str,
    artifact_commit: str,
    website_commit: str,
) -> list[str]:
    errors = validate_config(config, manifest, manifest_sha256, release_id, artifact_commit, website_commit)
    baseurl = f"/releases/{release_id}"
    release_view_url = f"{SITE_ORIGIN}{baseurl}/"
    html_files = sorted(root.rglob("*.html"))
    if not html_files:
        return errors + [f"{root} contains no HTML files"]

    for relative_path in UNSCOPED_STATIC_PATHS:
        if (root / relative_path).exists():
            errors.append(f"release build contains unscoped static content that must be removed: {relative_path}")

    index_path = root / "index.html"
    if not index_path.is_file():
        errors.append("release build has no root index.html leaderboard snapshot")

    for path in html_files:
        parser = SnapshotHTMLParser()
        parser.feed(path.read_text(encoding="utf-8"))
        relative = path.relative_to(root)
        page_url = deployed_page_url(relative, baseurl)
        if parser.has_noindex:
            errors.append(f"{relative} unexpectedly declares noindex")
        expected_metadata = {
            "fluidsbench-release-id": release_id,
            "fluidsbench-submission-commit": artifact_commit,
            "fluidsbench-website-commit": website_commit,
            "fluidsbench-manifest-sha256": manifest_sha256,
        }
        for name, expected_value in expected_metadata.items():
            if parser.metadata.get(name) != expected_value:
                errors.append(f"{relative} has missing or incorrect {name} snapshot provenance")
        if len(parser.canonical_urls) != 1:
            errors.append(f"{relative} must declare exactly one canonical URL")
        for canonical in parser.canonical_urls:
            canonical_path = internal_path(canonical, page_url)
            if canonical_path is None or not (
                canonical_path == baseurl or canonical_path.startswith(f"{baseurl}/")
            ):
                errors.append(f"{relative} has a canonical URL outside the immutable release: {canonical}")
        for link in parser.links:
            path_value = internal_path(link, page_url)
            if path_value is not None and not (path_value == baseurl or path_value.startswith(f"{baseurl}/")):
                errors.append(f"{relative} escapes the immutable release prefix: {link}")

    if index_path.is_file():
        index_text = index_path.read_text(encoding="utf-8")
        asset_base_url = manifest["data_release"]["asset_base_url"]
        if json.dumps(asset_base_url) not in index_text:
            errors.append("leaderboard page does not embed the official manifest asset_base_url")
        if json.dumps(manifest_sha256) not in index_text:
            errors.append("leaderboard page does not embed the publication-time manifest SHA-256")
        index_parser = SnapshotHTMLParser()
        index_parser.feed(index_text)
        if index_parser.canonical_urls != [release_view_url]:
            errors.append(f"leaderboard canonical URL must equal {release_view_url}")
    return errors


def print_errors(errors: list[str]) -> int:
    if not errors:
        return 0
    for error in errors:
        print(f"ERROR: {error}")
    return 1


def write_github_outputs(path: Path, values: dict[str, str]) -> None:
    with path.open("a", encoding="utf-8") as handle:
        for name, value in values.items():
            if "\n" in value or "\r" in value:
                raise ValueError(f"GitHub output {name} contains a newline")
            handle.write(f"{name}={value}\n")


def claim_assets(args: argparse.Namespace) -> int:
    repository_root = args.repository_root.resolve()
    manifest = load_json(args.manifest.resolve())
    if not isinstance(manifest, dict) or not isinstance(manifest.get("data_release"), dict):
        return print_errors(["leaderboard manifest has no data_release object"])
    release = manifest["data_release"]
    claims = release.get("claims", {})
    index_file = claims.get("index_file")
    expected_index_sha256 = claims.get("index_sha256")
    errors: list[str] = []
    if not safe_asset_path(index_file):
        errors.append("manifest claim-index path is unsafe")
    if not isinstance(expected_index_sha256, str) or not SHA256.fullmatch(expected_index_sha256):
        errors.append("manifest claim-index SHA-256 is invalid")
    if errors:
        return print_errors(errors)

    index_path = repository_root / index_file
    if index_path.is_symlink() or not index_path.is_file() or not index_path.resolve().is_relative_to(repository_root):
        return print_errors([f"claim index does not exist: {index_file}"])
    if hashlib.sha256(index_path.read_bytes()).hexdigest() != expected_index_sha256:
        errors.append("local claim-index bytes do not match the manifest digest")
    index = load_json(index_path)
    records = index.get("records") if isinstance(index, dict) else None
    if not isinstance(records, list):
        errors.append("claim index records must be an array")
        return print_errors(errors)
    if claims.get("record_count") != len(records) or index.get("record_count") != len(records):
        errors.append("claim record count differs between the release manifest, index, and records array")

    assets: list[tuple[str, str]] = []
    seen: set[str] = set()
    for position, entry in enumerate(records):
        if not isinstance(entry, dict):
            errors.append(f"claim index record {position} must be an object")
            continue
        file = entry.get("file")
        digest = entry.get("sha256")
        if not safe_asset_path(file):
            errors.append(f"claim index record {position} has an unsafe file path")
            continue
        if file in seen:
            errors.append(f"claim index contains duplicate file path {file}")
            continue
        seen.add(file)
        if not isinstance(digest, str) or not SHA256.fullmatch(digest):
            errors.append(f"claim index record {position} has an invalid SHA-256 digest")
            continue
        local_path = repository_root / file
        if local_path.is_symlink() or not local_path.is_file() or not local_path.resolve().is_relative_to(repository_root):
            errors.append(f"claim record does not exist: {file}")
            continue
        if hashlib.sha256(local_path.read_bytes()).hexdigest() != digest:
            errors.append(f"local claim record does not match its index digest: {file}")
            continue
        assets.append((file, digest))
    if errors:
        return print_errors(errors)
    args.output.write_text("".join(f"{file}\t{digest}\n" for file, digest in assets), encoding="utf-8")
    print(f"Validated and listed {len(assets)} locally hash-pinned claim records.")
    return 0


def scoring_support_manifests(args: argparse.Namespace) -> int:
    manifest = load_json(args.manifest.resolve())
    bindings = scoring_support_bindings(manifest)
    errors: list[str] = []
    seen: set[str] = set()
    rows: list[tuple[str, str, str]] = []
    for binding in bindings:
        dataset_id = binding.get("dataset_id")
        url = binding.get("manifest_url")
        digest = binding.get("manifest_sha256")
        if not isinstance(dataset_id, str) or not DATASET_ID.fullmatch(dataset_id):
            errors.append("scoring-support binding has an invalid dataset ID")
            continue
        if dataset_id in seen:
            errors.append(f"duplicate scoring-support binding for {dataset_id}")
            continue
        seen.add(dataset_id)
        if binding.get("status") == "owner_review_required" and url is None and digest is None:
            continue
        if not clean_https_url(url):
            errors.append(f"{dataset_id}: scoring-support manifest URL is invalid")
            continue
        if not isinstance(digest, str) or not SHA256.fullmatch(digest):
            errors.append(f"{dataset_id}: scoring-support manifest SHA-256 is invalid")
            continue
        rows.append((dataset_id, url, digest))
    if errors:
        return print_errors(errors)
    args.output.write_text("".join(f"{dataset_id}\t{url}\t{digest}\n" for dataset_id, url, digest in rows), encoding="utf-8")
    print(f"Validated and listed {len(rows)} scoring-support manifests.")
    return 0


def prepare(args: argparse.Namespace) -> int:
    manifest_path = args.manifest.resolve()
    manifest = load_json(manifest_path)
    errors = validate_manifest(manifest, args.release_id, args.artifact_commit)
    if not FULL_GIT_SHA.fullmatch(args.website_commit):
        errors.append("website commit must be a full lowercase 40-character Git SHA")
    if errors:
        return print_errors(errors)

    release = manifest["data_release"]
    manifest_sha256 = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
    config = release_config(
        args.release_id,
        release["asset_base_url"],
        manifest_sha256,
        args.artifact_commit,
        args.website_commit,
    )
    args.config_out.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    outputs = {
        "release_id": args.release_id,
        "release_baseurl": config["baseurl"],
        "release_view_url": release["release_view_url"],
        "asset_base_url": release["asset_base_url"],
        "source_commit": release["source_commit"],
        "artifact_commit": args.artifact_commit,
        "website_commit": args.website_commit,
        "manifest_sha256": manifest_sha256,
        "feed_file": manifest["all_file"],
        "feed_sha256": release["feed_sha256"],
        "claims_index_file": release["claims"]["index_file"],
        "claims_index_sha256": release["claims"]["index_sha256"],
        "revision_history_file": release["revision_history"]["file"],
        "revision_history_sha256": release["revision_history"]["sha256"],
        "ground_truth_manifest_url": release["profile_ground_truth"]["manifest_url"],
        "ground_truth_manifest_sha256": release["profile_ground_truth"]["manifest_sha256"],
    }
    if args.github_output:
        write_github_outputs(args.github_output, outputs)
    print(
        f"Prepared immutable snapshot {args.release_id} from submission artifact "
        f"{args.artifact_commit[:12]} (source {release['source_commit'][:12]})."
    )
    return 0


def check_build(args: argparse.Namespace) -> int:
    manifest_path = args.manifest.resolve()
    manifest = load_json(manifest_path)
    manifest_sha256 = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
    config = load_json(args.config.resolve())
    errors = validate_manifest(manifest, args.release_id, args.artifact_commit)
    if not FULL_GIT_SHA.fullmatch(args.website_commit):
        errors.append("website commit must be a full lowercase 40-character Git SHA")
    if not errors:
        errors.extend(
            validate_build(
                args.root.resolve(),
                config,
                manifest,
                manifest_sha256,
                args.release_id,
                args.artifact_commit,
                args.website_commit,
            )
        )
    if errors:
        return print_errors(errors)
    count = len(list(args.root.resolve().rglob("*.html")))
    print(f"Validated {count} HTML files under immutable snapshot /releases/{args.release_id}/.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    prepare_parser = subparsers.add_parser("prepare", help="validate a release manifest and write its Jekyll override")
    prepare_parser.add_argument("--manifest", type=Path, required=True)
    prepare_parser.add_argument("--release-id", required=True)
    prepare_parser.add_argument("--artifact-commit", required=True)
    prepare_parser.add_argument("--website-commit", required=True)
    prepare_parser.add_argument("--config-out", type=Path, required=True)
    prepare_parser.add_argument("--github-output", type=Path)
    prepare_parser.set_defaults(func=prepare)

    build_parser = subparsers.add_parser("check-build", help="validate a generated release snapshot without deploying it")
    build_parser.add_argument("--root", type=Path, required=True)
    build_parser.add_argument("--config", type=Path, required=True)
    build_parser.add_argument("--manifest", type=Path, required=True)
    build_parser.add_argument("--release-id", required=True)
    build_parser.add_argument("--artifact-commit", required=True)
    build_parser.add_argument("--website-commit", required=True)
    build_parser.set_defaults(func=check_build)

    claims_parser = subparsers.add_parser(
        "list-claim-assets", help="validate local claim-record bytes and write a safe path/digest list for publication checks"
    )
    claims_parser.add_argument("--manifest", type=Path, required=True)
    claims_parser.add_argument("--repository-root", type=Path, required=True)
    claims_parser.add_argument("--output", type=Path, required=True)
    claims_parser.set_defaults(func=claim_assets)
    supports_parser = subparsers.add_parser(
        "list-scoring-support-manifests",
        help="write the dataset scoring-support manifest URLs and SHA-256 pins for publication checks",
    )
    supports_parser.add_argument("--manifest", type=Path, required=True)
    supports_parser.add_argument("--output", type=Path, required=True)
    supports_parser.set_defaults(func=scoring_support_manifests)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        return args.func(args)
    except (OSError, ValueError, json.JSONDecodeError, KeyError) as error:
        print(f"ERROR: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
