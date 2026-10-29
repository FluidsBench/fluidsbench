#!/usr/bin/env python3
"""Validate dataset pages against their catalog, submission contracts, and live sources."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "_data" / "dataset_catalog.json"
DATASET_IDS = {
    "ahmedml",
    "airfrans",
    "blendednet",
    "drivaerml",
    "drivaernetplusplus",
    "hiliftaeroml",
    "rotor37",
    "vki-ls59",
    "windsorml",
}
CONTRACT_KEYS = (
    "dataset_id",
    "dataset_name",
    "dataset_version",
    "status",
    "evaluation_reference_version",
    "scoring_support",
    "splits",
    "metrics",
    "overall_score_composite",
    "component_score_groups",
)
SHA256 = re.compile(r"^[0-9a-f]{64}$")


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def contract_digest(spec: dict[str, Any]) -> str:
    scientific_contract = {key: spec.get(key) for key in CONTRACT_KEYS if key in spec}
    payload = json.dumps(scientific_contract, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def check_local(catalog: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    require(set(catalog) == DATASET_IDS, f"catalog dataset IDs differ: {sorted(set(catalog) ^ DATASET_IDS)}", errors)

    for dataset_id in sorted(DATASET_IDS & set(catalog)):
        item = catalog[dataset_id]
        source = item.get("source", {})
        benchmark = item.get("benchmark", {})
        design_space = item.get("design_space", {})
        image = source.get("image", {})
        prefix = f"{dataset_id}:"

        require(item.get("name"), f"{prefix} missing display name", errors)
        require(item.get("summary"), f"{prefix} missing summary", errors)
        require(source.get("provider") in {"huggingface", "github", "dataverse"}, f"{prefix} invalid source provider", errors)
        require(str(source.get("url", "")).startswith("https://"), f"{prefix} source URL must be HTTPS", errors)
        require(str(source.get("revision_url", "")).startswith("https://"), f"{prefix} revision URL must be HTTPS", errors)
        require(source.get("repository_id"), f"{prefix} missing source repository ID", errors)
        require(source.get("revision"), f"{prefix} missing source revision", errors)
        require(source.get("checked_on"), f"{prefix} missing source check date", errors)
        require(source.get("license") and source.get("license_url"), f"{prefix} missing licence metadata", errors)
        require(source.get("availability") and source.get("contents"), f"{prefix} missing source availability/content description", errors)
        require(image.get("alt") and image.get("caption") and image.get("source_url"), f"{prefix} incomplete image attribution", errors)

        archetypes = design_space.get("archetypes")
        parameters = design_space.get("parameters")
        require(design_space.get("archetype_count"), f"{prefix} missing parent-shape/archetype count", errors)
        require(isinstance(archetypes, list) and bool(archetypes), f"{prefix} missing parent-shape/archetype definitions", errors)
        if isinstance(archetypes, list):
            for index, archetype in enumerate(archetypes, start=1):
                require(
                    isinstance(archetype, dict) and archetype.get("name") and archetype.get("description"),
                    f"{prefix} incomplete archetype {index}",
                    errors,
                )
        require(design_space.get("parameter_count"), f"{prefix} missing geometry-parameter count", errors)
        require(design_space.get("parameter_summary"), f"{prefix} missing geometry-parameter summary", errors)
        require(isinstance(parameters, list), f"{prefix} geometry parameters must be a list", errors)
        if isinstance(parameters, list):
            for index, parameter in enumerate(parameters, start=1):
                require(
                    isinstance(parameter, dict) and parameter.get("name") and parameter.get("range"),
                    f"{prefix} incomplete geometry parameter {index}",
                    errors,
                )
        require(design_space.get("operating_conditions"), f"{prefix} missing operating-condition coverage", errors)
        require(design_space.get("sampling"), f"{prefix} missing design-space sampling description", errors)
        require(design_space.get("coverage"), f"{prefix} missing benchmark design-space coverage", errors)
        require(
            str(design_space.get("source_url", "")).startswith("https://") and design_space.get("source_label"),
            f"{prefix} missing design-space source attribution",
            errors,
        )

        try:
            checked = dt.date.fromisoformat(str(source.get("checked_on")))
            require(checked <= dt.date.today(), f"{prefix} source check date is in the future", errors)
        except ValueError:
            errors.append(f"{prefix} invalid source check date")

        image_path = str(image.get("path", ""))
        require(image_path.startswith("/assets/img/datasets/"), f"{prefix} image must be a local dataset asset", errors)
        resolved_image = ROOT / image_path.lstrip("/")
        require(resolved_image.is_file(), f"{prefix} missing image asset {image_path}", errors)
        if resolved_image.is_file():
            require(resolved_image.stat().st_size <= 3_000_000, f"{prefix} image exceeds 3 MB", errors)

        require(benchmark.get("status") in {"owner_review_required", "official"}, f"{prefix} invalid benchmark status", errors)
        require(isinstance(benchmark.get("submissions_open"), bool), f"{prefix} submissions_open must be boolean", errors)
        require(benchmark.get("summary"), f"{prefix} missing FluidsBench evaluation summary", errors)
        require(benchmark.get("split_ids"), f"{prefix} missing split IDs", errors)
        require(SHA256.fullmatch(str(benchmark.get("contract_digest", ""))) is not None, f"{prefix} invalid contract digest", errors)

        page_path = ROOT / "_pages" / "datasets" / f"{dataset_id}.md"
        require(page_path.is_file(), f"{prefix} missing dataset page", errors)
        if page_path.is_file():
            page = page_path.read_text(encoding="utf-8")
            intro = f'{{% include dataset_intro.html slug="{dataset_id}" %}}'
            design_space = f'{{% include dataset_design_space.html slug="{dataset_id}" %}}'
            getting_started = f'dataset_getting_started.html'
            require(intro in page, f"{prefix} page does not use the structured intro", errors)
            require(getting_started in page and f'slug="{dataset_id}"' in page, f"{prefix} page lacks Getting started content", errors)
            require(design_space in page, f"{prefix} page does not expose structured design-space coverage", errors)
            require(
                page.index(getting_started) < page.index(design_space),
                f"{prefix} design-space detail must follow Getting started",
                errors,
            )

    if "airfrans" in catalog:
        airfrans = catalog["airfrans"]["benchmark"]["summary"].lower()
        require("not nut" in airfrans, "airfrans: catalog must distinguish source nut from scored fields", errors)
        require("not a current leaderboard metric" in airfrans, "airfrans: catalog must exclude pressure-profile scoring", errors)
    if "drivaerml" in catalog:
        getting_started = (ROOT / "_includes" / "dataset_getting_started.html").read_text(encoding="utf-8")
        require("force_mom_constref_1.csv" in getting_started, "drivaerml: starter must use constant-reference force truth", errors)
        require(".02.part" in getting_started, "drivaerml: starter must warn about three-part volumes", errors)

    return errors


def check_submission_contracts(catalog: dict[str, Any], submission_root: Path) -> list[str]:
    errors: list[str] = []
    for dataset_id in sorted(DATASET_IDS):
        spec_path = submission_root / "benchmark-specs" / dataset_id / "submission-spec.json"
        if not spec_path.is_file():
            errors.append(f"{dataset_id}: missing submission specification at {spec_path}")
            continue
        spec = load_json(spec_path)
        benchmark = catalog[dataset_id]["benchmark"]
        support = spec.get("scoring_support", {})
        prefix = f"{dataset_id}:"

        require(spec.get("dataset_id") == dataset_id, f"{prefix} submission dataset ID mismatch", errors)
        require(benchmark.get("status") == support.get("status"), f"{prefix} scoring-support status drifted", errors)
        require(benchmark.get("submissions_open") == support.get("submissions_open"), f"{prefix} submissions-open state drifted", errors)

        split_ids = [split.get("id") for split in spec.get("splits", [])]
        require(benchmark.get("split_ids") == split_ids, f"{prefix} split IDs drifted", errors)
        case_statuses = {split.get("case_id_status") for split in spec.get("splits", [])}
        if benchmark.get("case_id_status") == "mixed":
            require(benchmark.get("case_id_status_by_split") == {split["id"]: split.get("case_id_status") for split in spec["splits"]},
                    f"{prefix} per-split case-ID status drifted", errors)
        else:
            require(case_statuses == {benchmark.get("case_id_status")}, f"{prefix} case-ID status drifted: {sorted(case_statuses)}", errors)

        actual_digest = contract_digest(spec)
        require(
            benchmark.get("contract_digest") == actual_digest,
            f"{prefix} scientific contract drifted (catalog={benchmark.get('contract_digest')}, submission={actual_digest})",
            errors,
        )
    return errors


def get_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "fluidsbench-dataset-audit/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def check_live_sources(catalog: dict[str, Any], max_age_days: int) -> list[str]:
    errors: list[str] = []
    today = dt.date.today()
    for dataset_id in sorted(DATASET_IDS):
        source = catalog[dataset_id]["source"]
        provider = source["provider"]
        revision = source["revision"]
        repository_id = source["repository_id"]
        prefix = f"{dataset_id}:"

        try:
            checked = dt.date.fromisoformat(source["checked_on"])
            require((today - checked).days <= max_age_days, f"{prefix} source audit is older than {max_age_days} days", errors)

            if provider == "huggingface":
                url = f"https://huggingface.co/api/datasets/{urllib.parse.quote(repository_id, safe='/')}"
                live_revision = get_json(url).get("sha")
            elif provider == "github":
                url = f"https://api.github.com/repos/{urllib.parse.quote(repository_id, safe='/')}/commits/HEAD"
                live_revision = get_json(url).get("sha")
            else:
                persistent_id = urllib.parse.quote(f"doi:{repository_id}", safe=":/")
                url = f"https://dataverse.harvard.edu/api/datasets/:persistentId/?persistentId={persistent_id}"
                version = get_json(url)["data"]["latestVersion"]
                live_revision = f"{version['versionNumber']}.{version['versionMinorNumber']}"

            require(live_revision == revision, f"{prefix} live source moved (catalog={revision}, live={live_revision})", errors)
        except (KeyError, TypeError, ValueError, urllib.error.URLError, TimeoutError) as exc:
            errors.append(f"{prefix} live source check failed: {exc}")
    return errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submission-root", type=Path, help="compare catalog snapshots with fluidsbench-submission")
    parser.add_argument("--check-live-sources", action="store_true", help="compare recorded source revisions with their live repositories")
    parser.add_argument("--max-check-age-days", type=int, default=45, help="maximum source-audit age in live mode")
    parser.add_argument("--print-contract-digests", action="store_true", help="print normalized digests from --submission-root")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    catalog = load_json(CATALOG_PATH)

    if args.print_contract_digests:
        if not args.submission_root:
            raise SystemExit("--print-contract-digests requires --submission-root")
        for dataset_id in sorted(DATASET_IDS):
            spec_path = args.submission_root / "benchmark-specs" / dataset_id / "submission-spec.json"
            print(f"{dataset_id} {contract_digest(load_json(spec_path))}")
        return 0

    errors = check_local(catalog)
    if args.submission_root:
        errors.extend(check_submission_contracts(catalog, args.submission_root.resolve()))
    if args.check_live_sources:
        errors.extend(check_live_sources(catalog, args.max_check_age_days))

    if errors:
        print("Dataset page validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    checks = ["catalog/pages/assets"]
    if args.submission_root:
        checks.append("submission contracts")
    if args.check_live_sources:
        checks.append("live source revisions")
    print(f"Dataset page validation passed ({', '.join(checks)}; {len(DATASET_IDS)} datasets).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
