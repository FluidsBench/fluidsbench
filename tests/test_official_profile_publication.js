"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createHash, webcrypto } = require("node:crypto");

const root = path.resolve(__dirname, "..");
const submissionRoot = path.resolve(process.env.FLUIDSBENCH_SUBMISSION_ROOT || path.join(root, "../fluidsbench-submission"));
const read = (name) => JSON.parse(fs.readFileSync(name, "utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const manifest = read(path.join(submissionRoot, "leaderboard/manifest.json"));
// Exercise compatibility with evaluator checkouts issued before publication metadata was added.
const binding = manifest.data_release.profile_ground_truth_publication || {
  release_id: "profile-truth-publication-v1",
  manifest_url:
    "https://raw.githubusercontent.com/FluidsBench/fluidsbench/profile-truth-publication-v1/assets/data/profile-ground-truth/profile-truth-publication-v1/manifest.json",
  manifest_sha256: sha(fs.readFileSync(path.join(root, "assets/data/profile-ground-truth/profile-truth-publication-v1/manifest.json"))),
};
const publicationPath = path.join(root, "assets/data/profile-ground-truth", binding.release_id, "manifest.json");

function runtime(mutate = null) {
  const selected = structuredClone(manifest);
  selected.data_release.profile_ground_truth_publication = structuredClone(binding);
  selected.data_release.status = "official";
  selected.data_release.release_view_url = "https://fluidsbench.org/releases/local-test/";
  const publication = read(publicationPath);
  if (mutate) mutate(publication, selected);
  const publicationBytes = Buffer.from(JSON.stringify(publication));
  if (selected.data_release.profile_ground_truth_publication)
    selected.data_release.profile_ground_truth_publication.manifest_sha256 = sha(publicationBytes);
  const fetcher = async (value) => {
    const url = new URL(value);
    const marker = "/assets/";
    const offset = url.pathname.indexOf(marker);
    const target = path.resolve(root, offset >= 0 ? url.pathname.slice(offset + 1) : "absent");
    const exists = target.startsWith(root + path.sep) && fs.existsSync(target);
    const bytes = target === publicationPath ? publicationBytes : exists ? fs.readFileSync(target) : Buffer.alloc(0);
    return {
      ok: exists,
      status: exists ? 200 : 404,
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    };
  };
  const window = {
    crypto: webcrypto,
    location: { hostname: "fluidsbench.org", href: "https://fluidsbench.org/" },
    FluidsBenchLeaderboardBaseUrl: "https://example.test/",
    FluidsBenchProfileGroundTruthBaseUrl: "https://fluidsbench.org/assets/data/profile-ground-truth/",
    FluidsBenchLeaderboardManifestSha256: "a".repeat(64),
  };
  for (const [slug, variable] of [
    ["airfrans", "FluidsBenchAirfransNativeProfiles"],
    ["drivaernetplusplus", "FluidsBenchDrivaernetplusplusNativeProfiles"],
  ]) {
    const config = read(path.join(root, `_data/${slug}_native_profiles.json`));
    config.manifest_url = "https://fluidsbench.org/" + config.manifest_path;
    window[variable] = config;
  }
  const context = {
    window,
    crypto: webcrypto,
    fetch: fetcher,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    ArrayBuffer,
    Uint8Array,
    DataView,
    Blob,
    DecompressionStream,
    Map,
    Set,
    console,
    setTimeout,
    clearTimeout,
    document: { readyState: "loading", addEventListener() {} },
  };
  vm.createContext(context);
  for (const slug of ["airfrans", "drivaernetplusplus"]) {
    vm.runInContext(fs.readFileSync(path.join(root, `assets/js/${slug}-profiles.js`), "utf8"), context);
  }
  let source = fs.readFileSync(path.join(root, "assets/js/leaderboard.js"), "utf8");
  const end = source.lastIndexOf("})();");
  source =
    source.slice(0, end) +
    `
    refreshCitationEligibilityUi = () => {};
    window.audit = { state, ensureGroundTruthManifest, groundTruthManifestVerified, groundTruthIndex,
      indexedProfileCase, publicationDataset, claimEligibility };
  ` +
    source.slice(end);
  vm.runInContext(source, context);
  window.audit.state.manifest = selected;
  return window.audit;
}

test("official publication loads native CFD reference indices for every open dataset", async () => {
  const api = runtime();
  await api.ensureGroundTruthManifest();
  assert.equal(api.groundTruthManifestVerified(), true);
  for (const dataset of api.state.manifest.datasets.filter((entry) => entry.scoring_support?.submissions_open)) {
    api.state.dataset = dataset.name;
    api.state.split = dataset.splits[0].name;
    const index = await api.groundTruthIndex(dataset.name, api.state.split);
    assert.ok(index, dataset.slug);
    const published = api.publicationDataset({ dataset_id: dataset.slug });
    const truth = published.submission_profile_ground_truth;
    assert.equal(
      truth.release_id,
      dataset.slug === "airfrans" ? "airfrans-native-profile-truth-v1" : manifest.data_release.profile_ground_truth.release_id
    );
    assert.ok(index.caseSetId || index.index, dataset.slug);
  }
  assert.equal(api.publicationDataset({ dataset_id: "hiliftaeroml" }), undefined, "closed dataset is not promoted");
});

test("official publication rejects changed references even when their manifest checksum is updated", async () => {
  for (const mutate of [
    (p) => {
      p.data_release.status = "prototype_dummy_data";
    },
    (p) => {
      p.data_release.source_commit = null;
    },
    (p) => {
      p.catalog.manifest_sha256 = "f".repeat(64);
    },
    (p) => {
      p.datasets.pop();
    },
    (p) => {
      p.datasets.push(structuredClone(p.datasets[0]));
    },
    (p) => {
      p.datasets.find((d) => d.id === "ahmedml").browser_profile_truth.dataset.case_sets[0].index_sha256 = "f".repeat(64);
    },
    (p) => {
      p.datasets.find((d) => d.id === "airfrans").submission_profile_ground_truth.manifest_sha256 = "f".repeat(64);
    },
    (p) => {
      p.datasets.find((d) => d.id === "drivaernetplusplus").browser_profile_truth.manifest_sha256 = "f".repeat(64);
    },
  ]) {
    const api = runtime(mutate);
    await assert.rejects(api.ensureGroundTruthManifest(), /publication|reference/);
    assert.equal(api.groundTruthManifestVerified(), false);
  }
});

test("result citation checks honour each dataset's evaluated reference, including AirfRANS", async () => {
  const api = runtime();
  await api.ensureGroundTruthManifest();
  api.state.feedVerified = true;
  api.state.manifestPinVerified = true;
  for (const dataset of api.state.manifest.datasets.filter((d) => d.scoring_support?.submissions_open)) {
    api.state.dataset = dataset.name;
    api.state.split = dataset.splits[0].name;
    const truth = api.publicationDataset({ dataset_id: dataset.slug }).submission_profile_ground_truth;
    const profile = {
      profile_ground_truth_release_id: truth.release_id,
      profile_ground_truth_manifest_sha256: truth.manifest_sha256,
      case_set_id: "local-test",
      index_file: "submissions/local-test/profiles/index.json",
      index_sha256: "b".repeat(64),
    };
    const validation = {
      schema_version: "3.0",
      contract_version: "open-reproducibility-3.0",
      status: "validated",
      validation_scope: "submitted_data_only",
      model_execution: "not_performed",
      metric_recomputation: "not_performed",
      ...profile,
      scoring_support_release_id: dataset.scoring_support.release_id,
      scoring_support_manifest_sha256: dataset.scoring_support.manifest_sha256,
      discretization_sha256: "c".repeat(64),
      case_metrics_sha256: "d".repeat(64),
      profile_index_sha256: profile.index_sha256,
      evaluation_evidence_sha256: "e".repeat(64),
      evidence_sha256: "f".repeat(64),
    };
    const row = {
      id: "local-test-v1",
      submission_id: "local-test-v1",
      dataset_id: dataset.slug,
      dataset: dataset.name,
      metricValues: { overall_score: 1 },
      schema_version: "3.0",
      result_revision: { series_id: "local-test", version: 1, supersedes: null, is_latest: true },
      reproducibility: { contract_version: "open-reproducibility-3.0" },
      approval: { status: "approved", validation },
      scoring_support: dataset.scoring_support,
      profile_data: profile,
      maintainer_validation: validation,
      spatial_discretization: { file: "discretization.json", sha256: validation.discretization_sha256 },
      case_metrics: { file: "metrics/cases.json", sha256: validation.case_metrics_sha256 },
      evaluation: { evidence_sha256: validation.evaluation_evidence_sha256 },
      claim_eligibility: { academic_citation: true, promotion: true },
    };
    let reasons = api.claimEligibility(row).browser_verification.reason_codes;
    assert.equal(reasons.includes("ground_truth_binding_mismatch"), false, dataset.slug);
    row.profile_data.profile_ground_truth_manifest_sha256 = "1".repeat(64);
    reasons = api.claimEligibility(row).browser_verification.reason_codes;
    assert.equal(reasons.includes("ground_truth_binding_mismatch"), true, dataset.slug);
  }
});

test("an official result cannot use the prototype catalog without its verified publication", async () => {
  const api = runtime((_p, selected) => {
    delete selected.data_release.profile_ground_truth_publication;
  });
  await assert.rejects(api.ensureGroundTruthManifest(), /official results require profile ground truth/);
});

test("closing submission intake preserves the immutable official reference release", async () => {
  const api = runtime((_p, selected) => {
    for (const dataset of selected.datasets) if (dataset.scoring_support) dataset.scoring_support.submissions_open = false;
  });
  await api.ensureGroundTruthManifest();
  assert.equal(api.groundTruthManifestVerified(), true);
});
