#!/usr/bin/env node

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createHash, webcrypto } = require("node:crypto");

const root = path.resolve(__dirname, "..");
const submissionRoot = path.resolve(process.env.FLUIDSBENCH_SUBMISSION_ROOT || path.resolve(root, "../fluidsbench-submission"));
const scriptPath = path.join(root, "assets/js/leaderboard.js");
const displayConfig = JSON.parse(fs.readFileSync(path.join(root, "_data/leaderboard_display.json"), "utf8"));
const source = fs.readFileSync(scriptPath, "utf8");

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

// Keep the contract check independent of Node's optional undici/WebAssembly
// implementation.  The CI nodes used for this repository can have a strict
// virtual-memory limit even when ample physical memory is available.
class TestResponse {
  constructor(body = "", options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
  }

  async arrayBuffer() {
    const bytes = Buffer.isBuffer(this.body) ? this.body : Buffer.from(String(this.body));
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }

  async blob() {
    return new Blob([this.body]);
  }
}

const marker = "})();";
const markerIndex = source.lastIndexOf(marker);
assert.notEqual(markerIndex, -1, "leaderboard script must end with its IIFE");
const instrumented = `${source.slice(0, markerIndex)}
window.__FluidsBenchClaimTest = {
  activeColumns,
  activeMetricDefinitions,
  bibtexEscape,
  bindProfileCoordinateIdentities,
  buildHiLiftCompactSeries,
  caseIds,
  canonicalResultPermalink,
  citationValues,
  claimEligibility,
  decimalHalfUp,
  defaultProfileCoordinateView,
  decodeHiLiftVelocityStorage,
  ensureRegionalReport,
  ensureClaimRecord,
  ensureClaimsIndex,
  exactNativeTruthSource,
  exportMetadataColumns,
  exportProvenance,
  fallbackRankings,
  generatedRankingMatches,
  groundTruthIndex,
  headlineMetricDefinitions,
  hiLiftProfileAxisRanges,
  indexedProfileCase,
  materializeHiLiftCompactPrediction,
  materializeHiLiftCompactTruth,
  leaderboardManifestProvenance,
  claimRecordCheck,
  nativeProfileIndexSplitId,
  nativeProfileTruthVersion,
  normalizeRow,
  nativeSegmentIds,
  openDetails,
  predictionArtifactStatus,
  predictionAvailability,
  predictionMetricRecomputation,
  profileFamilies,
  profileCoordinateViews,
  profilePlotValues,
  profileTooltipLines,
  projectProfileSeries,
  profileSeries,
  profileSeriesCompatibility,
  profileStations,
  regionalBinding,
  regionalDatasetDefinition,
  regionalDefinition,
  regionalErrorShare,
  regionalCaseMacro,
  regionalCaseStatistic,
  regionalFields,
  regionalFieldsForDataset,
  regionalFieldReport,
  regionalPooled,
  regionalPrimaryMetricValue,
  regionalPrimaryWeighting,
  regionalReportMatches,
  regionalReportUrl,
  regionalRules,
  regionalScope,
  regionalUsesWholeSupportMetric,
  validAhmedRegionalReport,
  resolvedProfileCoordinateView,
  radarMetricAxes,
  radarNormalizedValue,
  representationSummary,
  reproducibilityArtifactAvailability,
  mappingSummary,
  metricDefinition,
  resultRevision,
  resultRowById,
  revisionRowsForActiveSplit,
  versionsForRow,
  rowRanking,
  renderReleaseMetadata,
  renderSubmissionAvailability,
  scoringSupportSummary,
  rowsForActiveSplit,
  sourceSubmission,
  state,
  verifyManifestSha256,
};
${source.slice(markerIndex)}`;

const elements = new Map();
const context = {
  ArrayBuffer,
  Blob,
  DataView,
  DecompressionStream,
  Map,
  Set,
  TextDecoder,
  TextEncoder,
  URL,
  URLSearchParams,
  Uint8Array,
  Response: TestResponse,
  console,
  document: {
    readyState: "loading",
    addEventListener() {},
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, {
          hidden: false,
          open: false,
          textContent: "",
          setAttribute(name, value) {
            this[name] = value;
            if (name === "open") this.open = true;
          },
        });
      }
      return elements.get(id);
    },
  },
  async fetch(value) {
    const url = new URL(value);
    const groundTruthMarker = "/profile-ground-truth/";
    const groundTruthOffset = decodeURIComponent(url.pathname).lastIndexOf(groundTruthMarker);
    if (groundTruthOffset >= 0) {
      const relative = decodeURIComponent(url.pathname).slice(groundTruthOffset + groundTruthMarker.length);
      const groundTruthRoot = path.resolve(root, "assets/data/profile-ground-truth");
      const target = path.resolve(groundTruthRoot, relative);
      if (!target.startsWith(`${groundTruthRoot}${path.sep}`) || !fs.existsSync(target)) {
        return new TestResponse("not found", { status: 404 });
      }
      return new TestResponse(fs.readFileSync(target), { status: 200 });
    }
    const assetRoots = ["leaderboard/", "submissions/", "evaluation/", "validation/"];
    const decodedPath = decodeURIComponent(url.pathname);
    const offsets = assetRoots.map((assetRoot) => decodedPath.lastIndexOf(`/${assetRoot}`)).filter((offset) => offset >= 0);
    if (!offsets.length) return new TestResponse("not found", { status: 404 });
    const relative = decodedPath.slice(Math.min(...offsets) + 1);
    const target = path.resolve(submissionRoot, relative);
    if (!target.startsWith(`${submissionRoot}${path.sep}`) || !fs.existsSync(target)) return new TestResponse("not found", { status: 404 });
    return new TestResponse(fs.readFileSync(target), { status: 200 });
  },
  navigator: {},
  window: {
    FluidsBenchLeaderboardBaseUrl: "https://example.test/assets/",
    FluidsBenchLeaderboardManifestUrl: "https://example.test/assets/leaderboard/manifest.json",
    FluidsBenchLeaderboardManifestSha256: "9".repeat(64),
    FluidsBenchLeaderboardDisplay: displayConfig,
    FluidsBenchProfileGroundTruthBaseUrl: "https://example.test/profile-ground-truth/",
    addEventListener() {},
    clearTimeout,
    crypto: webcrypto,
    location: { href: "https://fluidsbench.org/", hostname: "fluidsbench.org" },
    setTimeout,
  },
};
vm.createContext(context);
vm.runInContext(instrumented, context, { filename: scriptPath });

const api = context.window.__FluidsBenchClaimTest;
assert.equal(api.verifyManifestSha256("9".repeat(64)).verified, true);
assert.equal(api.verifyManifestSha256("a".repeat(64), "").required, false);
assert.throws(() => api.verifyManifestSha256("8".repeat(64)), /publication-time release snapshot SHA-256/);
assert.match(source, /release\.status === "official" && !expectedManifestSha256/);
assert.equal(api.decimalHalfUp(1.25, 1), 1.3);
assert.equal(api.decimalHalfUp(-1.25, 1), -1.3);
assert.equal(api.decimalHalfUp(9926.64999999999, 1), 9926.6);
assert.equal(api.decimalHalfUp(-91.4564999999999, 3), -91.456);

const regionalBinding = {
  format: "drivaerml-regional-aggregate-v2",
  file: "regional-diagnostics.json",
  sha256: "a".repeat(64),
  contract_sha256: "2bfd372817989112642056e4c76cfb418dbdcee445c57ee20ca37ee9ca158583",
  case_count: 50,
  role: "report_only",
  weight: 0,
  official_score_changed: false,
};
const regionalRow = {
  id: "regional-demo-v1",
  dataset_id: "drivaerml",
  prediction_scope: "surface_only",
  regional_diagnostics: regionalBinding,
};
assert.deepEqual(api.regionalBinding(regionalRow), regionalBinding);
assert.equal(api.regionalScope(regionalRow), "surface_only");
assert.match(api.regionalReportUrl(regionalRow), /submissions\/drivaerml\/regional-demo-v1\/regional-diagnostics\.json$/);
assert.equal(api.regionalBinding({ ...regionalRow, regional_diagnostics: { ...regionalBinding, weight: 1 } }), null);
const regionalReport = {
  supports: {
    "drivaerml-surface-four-geometric-regions-v1": {
      definition: {
        regions_in_code_order: [{ region_id: "low_z_horizontal_normal", predicate: "z < 0.75" }],
      },
      fields: { surface_pressure: { regions: [] } },
    },
  },
};
assert.deepEqual(api.regionalFieldReport(regionalReport, { supportId: "drivaerml-surface-four-geometric-regions-v1", id: "surface_pressure" }), {
  regions: [],
});
assert.deepEqual(api.regionalFieldReport(regionalReport, api.regionalFields.surface_pressure), { regions: [] });
assert.deepEqual(Array.from(api.regionalRules(regionalReport, { supportId: "drivaerml-surface-four-geometric-regions-v1" })), [
  { region_id: "low_z_horizontal_normal", predicate: "z < 0.75" },
]);

const hiLiftRegionalBinding = {
  format: "hiliftaeroml-regional-diagnostics-aggregate-v2",
  file: "regional-diagnostics.json",
  sha256: "b".repeat(64),
  contract_sha256: "8cf926d06706b8cc7fd58d821f395bf8cb6565ef1f3aabe6be18e0a279101da4",
  definition_id: "hiliftaeroml-native-geometric-regions-v1",
  case_count: 360,
  role: "report_only",
  weight: 0,
  official_score_changed: false,
};
const hiLiftRegionalRow = {
  id: "hilift-regional-demo-v1",
  dataset_id: "hiliftaeroml",
  split_id: "full",
  prediction_scope: "surface_and_volume",
  regional_diagnostics: hiLiftRegionalBinding,
};
assert.deepEqual(api.regionalBinding(hiLiftRegionalRow), hiLiftRegionalBinding);
assert.equal(api.regionalDatasetDefinition("HiLiftAeroML").schemaVersion, 2);
assert.equal(api.regionalFieldsForDataset("hiliftaeroml").surface_pressure.reportFieldId, "pressure");
assert.equal(api.regionalFieldsForDataset("hiliftaeroml").volume_velocity.primaryWeighting, "equal_entity");
assert.equal(
  api.regionalBinding({
    ...hiLiftRegionalRow,
    regional_diagnostics: { ...hiLiftRegionalBinding, definition_id: "wrong-definition" },
  }),
  null
);
const hiLiftRegionalReport = {
  dataset_id: "hiliftaeroml",
  surface: {
    support_id: "surface_native_points",
    fields: {
      pressure: {
        regions: [
          {
            region_id: "nacelle_installation_envelope_proxy",
            whole_support_normalized_rmse_percent: 4.1,
            relative_l2_percent: 6.2,
            r2: -0.25,
            squared_error_fraction: 0.25,
            case_macro: {
              whole_support_normalized_rmse_percent: { value: 3.7, defined_case_count: 360 },
            },
            case_distribution: {
              whole_support_normalized_rmse_percent: {
                defined_case_count: 360,
                minimum: 1.0,
                median: 3.5,
                p90: 6.0,
                maximum: 8.0,
              },
            },
          },
        ],
      },
    },
  },
};
const hiLiftSurfacePressure = api.regionalFieldsForDataset("hiliftaeroml").surface_pressure;
assert.equal(api.regionalFieldReport(hiLiftRegionalReport, hiLiftSurfacePressure).regions.length, 1);
assert.equal(api.regionalPooled(hiLiftRegionalReport.surface.fields.pressure.regions[0], "physical").relative_l2_percent, 6.2);
assert.equal(api.regionalErrorShare(hiLiftRegionalReport.surface.fields.pressure.regions[0], "physical"), 25);
assert.equal(api.regionalPrimaryWeighting(hiLiftRegionalReport.surface.fields.pressure, hiLiftSurfacePressure), "physical");
assert.equal(api.regionalRules(hiLiftRegionalReport, hiLiftSurfacePressure).length, 4);
assert.equal(api.regionalDefinition(hiLiftRegionalReport, hiLiftSurfacePressure).guide, "hilift_surface");
const hiLiftVolumePressure = api.regionalFieldsForDataset("hiliftaeroml").volume_pressure;
const hiLiftRegionFixture = hiLiftRegionalReport.surface.fields.pressure.regions[0];
assert.equal(api.regionalUsesWholeSupportMetric(hiLiftVolumePressure), true);
assert.equal(api.regionalUsesWholeSupportMetric(hiLiftSurfacePressure), false);
assert.equal(api.regionalPrimaryMetricValue(hiLiftRegionFixture, "equal_entity", hiLiftVolumePressure), 3.7);
assert.equal(api.regionalCaseStatistic(hiLiftRegionFixture, "equal_entity", "p90", "whole_support_normalized_rmse_percent"), 6.0);

function ahmedRegionalMetric(relativeL2, errorFraction) {
  const scalar = relativeL2 / 100;
  return {
    absolute_error: scalar,
    squared_error: scalar * scalar,
    squared_truth: 1,
    total_weight: 1,
    relative_l2_percent: relativeL2,
    mae: scalar,
    rmse: scalar,
    fraction_of_support_squared_error: errorFraction,
  };
}

function ahmedRegionalField(regionIds, primaryWeighting) {
  const fraction = 1 / regionIds.length;
  return {
    case_count: 1,
    entity_count: regionIds.length,
    physical_weight: regionIds.length,
    primary_weighting: primaryWeighting,
    quantity: "fixture",
    unit: "fixture",
    regions: regionIds.map((regionId, code) => {
      const metric = ahmedRegionalMetric(10, fraction);
      const summary = {
        pooled: { ...metric },
        macro_case_mean: { relative_l2_percent: 10, mae: 0.1, rmse: 0.1 },
        case_distribution: Object.fromEntries(
          ["relative_l2_percent", "mae", "rmse"].map((metricId) => {
            const value = metricId === "relative_l2_percent" ? 10 : 0.1;
            return [
              metricId,
              {
                minimum: value,
                median: value,
                p90: value,
                maximum: value,
                method: "linear_order_statistics_over_complete_cases",
              },
            ];
          })
        ),
      };
      return {
        region_id: regionId,
        code,
        entity_count: 1,
        entity_fraction: fraction,
        physical_weight: 1,
        physical_weight_fraction: fraction,
        equal_entity: summary,
        physical: JSON.parse(JSON.stringify(summary)),
      };
    }),
  };
}

const ahmedRegionalBinding = {
  format: "ahmedml-regional-diagnostics-aggregate-v2",
  file: "regional-diagnostics.json",
  sha256: "c".repeat(64),
  contract_sha256: "467cf92356aa7bca0f6b1745f0ae756b1e3dacdb02d29ce61bc25da653e5b4b6",
  definition_id: "ahmedml-native-regions-v2-candidate",
  case_count: 1,
  role: "report_only",
  weight: 0,
  official_score_changed: false,
};
const ahmedRegionalRow = {
  id: "ahmed-regional-demo-v2",
  dataset_id: "ahmedml",
  split_id: "full",
  prediction_scope: "surface_and_volume",
  regional_diagnostics: ahmedRegionalBinding,
};
const ahmedSurfaceIds = ["streamwise_facing", "lateral_facing", "upward_facing", "downward_facing"];
const ahmedVolumeIds = ["near_body", "wake", "farfield"];
function ahmedSupport(definitionSha256, guide, regionIds, fields) {
  return {
    definition_sha256: definitionSha256,
    definition: {
      definition_id: `${guide}-fixture`,
      support_id: `${guide}-native-fixture`,
      guide,
      coordinate_frame: "fixture",
      region_source: "fixture",
      partition_properties: "mutually_exclusive_and_exhaustive",
      regions_in_code_order: regionIds.map((regionId, code) => ({ region_id: regionId, code, predicate: `fixture-${code}` })),
      scoring_role: "report_only_zero_weight",
      scoring_weight: 0,
      semantic_limit: "fixture",
    },
    fields,
  };
}
const ahmedRegionalReport = {
  schema: "ahmedml-regional-diagnostics-aggregate-v2",
  schema_version: 2,
  status: "complete_report_only",
  definition_id: "ahmedml-native-regions-v2-candidate",
  contract_sha256: ahmedRegionalBinding.contract_sha256,
  dataset_id: "ahmedml",
  split_id: "full",
  prediction_scope: "surface_and_volume",
  case_count: 1,
  case_ids: ["run_1"],
  scoring: {
    official_metric_inputs_changed: false,
    official_score_changed: false,
    role: "report_only",
    weight: 0,
  },
  validation: {
    all_case_reports_strictly_validated: true,
    all_regional_sums_reconstruct_unchanged_global_field_sums: true,
    exact_case_order_and_membership: true,
    regional_values_consumed_by_official_score: false,
  },
  supports: {
    "ahmedml-surface-four-normal-regions-v1": ahmedSupport(
      ahmedRegionalBinding.contract_sha256,
      "ahmed_surface",
      ahmedSurfaceIds,
      {
        surface_pressure: ahmedRegionalField(ahmedSurfaceIds, "physical"),
        surface_wall_shear: ahmedRegionalField(ahmedSurfaceIds, "physical"),
      }
    ),
    "ahmedml-volume-three-geometric-regions-v1": ahmedSupport(
      "338db5b806caec2883e2583e491b751546624d3f101c04ae644cf9357b1275d7",
      "ahmed_volume",
      ahmedVolumeIds,
      {
        volume_pressure: ahmedRegionalField(ahmedVolumeIds, "equal_entity"),
        volume_velocity: ahmedRegionalField(ahmedVolumeIds, "equal_entity"),
      }
    ),
  },
};
assert.deepEqual(api.regionalBinding(ahmedRegionalRow), ahmedRegionalBinding);
const ahmedDefinition = api.regionalDatasetDefinition("AhmedML");
assert.equal(api.validAhmedRegionalReport(ahmedRegionalReport, ahmedRegionalRow, ahmedRegionalBinding, ahmedDefinition), true);
assert.equal(api.regionalReportMatches(ahmedRegionalReport, ahmedRegionalRow, ahmedRegionalBinding, ahmedDefinition), true);
assert.equal(api.regionalFieldsForDataset("ahmedml").surface_pressure.supportId, "ahmedml-surface-four-normal-regions-v1");
assert.equal(api.regionalRules(ahmedRegionalReport, api.regionalFieldsForDataset("ahmedml").surface_pressure).length, 4);
const tamperedAhmedReport = JSON.parse(JSON.stringify(ahmedRegionalReport));
tamperedAhmedReport.supports["ahmedml-surface-four-normal-regions-v1"].fields.surface_pressure.regions[0].physical.pooled.fraction_of_support_squared_error += 0.2;
assert.equal(api.validAhmedRegionalReport(tamperedAhmedReport, ahmedRegionalRow, ahmedRegionalBinding, ahmedDefinition), false);

api.state.metrics = new Map([["score", { id: "score", unit: "" }]]);
const policy = {
  metric_id: "score",
  direction: "higher",
  decimal_places: 1,
  rounding: "decimal_half_up",
  method: "competition",
  scope: "exact_data_release_dataset_split",
};
const rows = [
  { id: "first", metricValues: { score: 10 } },
  { id: "tie-b", metricValues: { score: 9.94 } },
  { id: "tie-a", metricValues: { score: 9.93 } },
  { id: "fourth", metricValues: { score: 9.8 } },
];
const ranked = api.fallbackRankings(rows, policy);
assert.deepEqual(
  Array.from(ranked, ({ row, ranking }) => [row.id, ranking.rank]),
  [
    ["first", 1],
    ["tie-a", 2],
    ["tie-b", 2],
    ["fourth", 4],
  ]
);
assert.equal(ranked[1].ranking.tied, true);
assert.equal(ranked[1].ranking.tie_count, 2);
assert.equal(api.generatedRankingMatches({ ...ranked[1].ranking }, ranked[1].ranking), true);
assert.equal(api.generatedRankingMatches({ ...ranked[1].ranking, rank: 3 }, ranked[1].ranking), false);

assert.equal(api.bibtexEscape("A_B & 50% {x}\\# $^~"), "A\\_B \\& 50\\% \\{x\\}\\textbackslash{}\\# \\$\\textasciicircum{}\\textasciitilde{}");
assert.match(source, /author = \{\{\$\{bibtexEscape\(author\)\}\}\}/);

api.state.manifest = {
  data_release: {
    status: "official",
    reproducibility_contract_version: "open-reproducibility-2.0",
    license: { spdx_id: "CC-BY-4.0", name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/", scope: "Test" },
  },
};
api.renderReleaseMetadata();
assert.equal(elements.get("leaderboard-data-warning-title").textContent, "Official release");
assert.equal(elements.get("leaderboard-data-warning-text").textContent, " — submitted packages are validated and maintainer-approved.");
assert.match(elements.get("leaderboard-data-warning").className, /is-official/);

api.state.manifest = {
  data_release: {
    id: "prototype-copy-test",
    status: "prototype",
    feed_sha256: "a".repeat(64),
    license: {
      spdx_id: "Apache-2.0",
      name: "Apache License 2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0",
      scope: "Test",
    },
  },
};
api.state.feedVerified = true;
api.state.loadedFeedSha256 = "a".repeat(64);
api.state.dataset = "";
api.renderReleaseMetadata();
assert.doesNotMatch(elements.get("leaderboard-data-warning-text").textContent, /Public code, model, and environment artifacts are optional/);
assert.match(elements.get("leaderboard-release-meta").textContent, /licence Apache License 2\.0/);
assert.doesNotMatch(elements.get("leaderboard-release-meta").textContent, /Apache-2\.0 — Apache License 2\.0/);
assert.doesNotMatch(elements.get("leaderboard-release-meta").textContent, /feed bytes verified/);
assert.doesNotMatch(elements.get("leaderboard-release-meta").textContent, /no immutable archive/);
assert.doesNotMatch(elements.get("leaderboard-release-meta").textContent, /no immutable release view/);
assert.equal(
  elements.get("leaderboard-claim-eligibility").textContent,
  "This data release is not declared eligible for academic citation or promotion."
);

const manifest = JSON.parse(fs.readFileSync(path.join(submissionRoot, "leaderboard/manifest.json"), "utf8"));
const feed = JSON.parse(fs.readFileSync(path.join(submissionRoot, manifest.all_file), "utf8"));
const leaderboardPageSource = fs.readFileSync(path.join(root, "_pages/leaderboard.md"), "utf8");
api.state.manifest = manifest;
api.state.metrics = new Map(manifest.metric_definitions.map((definition) => [definition.id, definition]));
api.state.rows = new Map(manifest.datasets.map((dataset) => [dataset.name, []]));
api.state.feedVerified = true;

function nativeProfileSeries(overrides = {}) {
  const series = {
    panel_id: "velocity_profiles",
    family_id: "drivaerml-velocity-relative-v3",
    placement_mode: "relative",
    station_id: "V1",
    quantity_id: "velocity_ratio",
    quantity: "velocity_magnitude_ratio",
    units: "1",
    scoring_role: "report_only",
    representation: "materialized",
    support_identity_sha256: "1".repeat(64),
    placement_receipt_identity_sha256: "2".repeat(64),
    coordinate_id: "normalized_arc_length",
    coordinate_unit: "1",
    coordinate_identity_sha256: "5".repeat(64),
    value_identity_sha256: "6".repeat(64),
    series_identity_sha256: "7".repeat(64),
    sample_index: [0, 1, 2, 4],
    raw_native_cell_id: [10, 11, 12, 14],
    coordinate: [0, 0.3, 0.6, 1],
    value: [0.1, 0.2, 0.3, 0.4],
    segments: [
      {
        segment_id: "supported",
        emitted_index_start: 0,
        emitted_index_stop: 3,
        sample_index_start: 0,
        sample_index_stop: 3,
        coordinate_start: 0,
        coordinate_stop: 0.6,
      },
      {
        segment_id: "supported",
        emitted_index_start: 3,
        emitted_index_stop: 4,
        sample_index_start: 4,
        sample_index_stop: 5,
        coordinate_start: 1,
        coordinate_stop: 1,
      },
    ],
    unsupported_samples: [{ sample_index: 3, coordinate: 0.8, reason: "unsupported" }],
    ...overrides,
  };
  Object.defineProperty(series, "_fluidsbenchCoordinateIdentitySha256", {
    enumerable: false,
    value: series.coordinate_identity_sha256,
  });
  return series;
}

function currentProfileSeries(overrides = {}) {
  const series = {
    panel_id: "velocity_profiles",
    family_id: "drivaerml-velocity-relative-v3",
    placement_mode: "relative",
    station_id: "V1",
    quantity_id: "velocity_ratio",
    scoring_role: "report_only",
    representation: "materialized",
    support_identity_sha256: "1".repeat(64),
    placement_receipt_identity_sha256: "2".repeat(64),
    coordinate_id: "normalized_arc_length",
    coordinate_unit: "1",
    coordinate: [0, 0.3, 0.6, 1],
    prediction: [0.11, 0.21, 0.31, 0.41],
    ...overrides,
  };
  Object.defineProperty(series, "_fluidsbenchCoordinateIdentitySha256", {
    enumerable: false,
    value: overrides.computedCoordinateIdentity || "5".repeat(64),
  });
  delete series.computedCoordinateIdentity;
  return series;
}

function nativeV3CpSeries(overrides = {}) {
  const series = nativeProfileSeries({
    panel_id: "pressure_profiles",
    family_id: "drivaerml_cp_relative_v1",
    placement_mode: "relative",
    station_id: "sidewall_front_wheelhouse_relative",
    quantity_id: "cp",
    quantity: "pressure_coefficient",
    scoring_role: "report_only",
    coordinate_id: "arc_length_m",
    coordinate_unit: "m",
    display_coordinate_id: "streamwise_x_m",
    display_coordinate_unit: "m",
    display_coordinate_identity_sha256: "b".repeat(64),
    display_coordinate: [-0.8, -0.9, -0.7, -0.6],
    ...overrides,
  });
  Object.defineProperty(series, "_fluidsbenchDisplayCoordinateIdentitySha256", {
    enumerable: false,
    value: overrides.computedDisplayCoordinateIdentity || series.display_coordinate_identity_sha256,
  });
  delete series.computedDisplayCoordinateIdentity;
  return series;
}

{
  api.state.dataset = "DrivAerML";
  const drivaerml = manifest.datasets.find((dataset) => dataset.slug === "drivaerml");
  const velocityPanel = drivaerml.diagnostic_panels.find((panel) => panel.id === "velocity_profiles");
  const families = api.profileFamilies(velocityPanel);
  assert.deepEqual(
    Array.from(families, (family) => [family.id, family.label]),
    [
      ["drivaerml-autocfd5-constant-v1", "Fixed locations"],
      ["drivaerml-velocity-relative-v3", "Geometry-relative locations — diagnostic, not scored"],
    ],
    "DrivAerML velocity placement choices must remain separate and relative placement must be labelled report-only"
  );
  assert.equal(api.nativeProfileIndexSplitId("standard", "medium"), "full", "shared standard test cases must use the one canonical full thin index");
  assert.equal(api.nativeProfileIndexSplitId("geometry", "geometry"), "geometry");
  assert.equal(api.profileStations(velocityPanel, families[0])[0].id, "autocfd5_v1");
  assert.equal(api.profileStations(velocityPanel, families[1])[0].id, "V1");
  assert.deepEqual(Array.from(api.profileCoordinateViews(velocityPanel), (view) => view.id), ["support"]);
  assert.equal(api.defaultProfileCoordinateView(velocityPanel), "support", "velocity profiles must retain their one existing coordinate");
  assert.deepEqual(
    Array.from(
      api.caseIds({
        schema: "fluidsbench-drivaerml-native-profile-truth-split-index-v2",
        schema_version: "2.0",
        chunk_refs: [{ case_ids: ["run_1"] }, { case_ids: ["run_3"] }],
      })
    ),
    ["run_1", "run_3"]
  );
  assert.equal(
    api.exactNativeTruthSource({
      source_kind: "native_cfd",
      analytical_dummy: false,
      native_quantity_source: "pinned_drivaerml_cell_data",
    }),
    true
  );
  assert.equal(
    api.exactNativeTruthSource({
      source_kind: "native_cfd",
      analytical_dummy: true,
      native_quantity_source: "pinned_drivaerml_cell_data",
    }),
    false
  );

  const quantity = velocityPanel.quantities[0];
  const truthSource = {
    case_id: "run_419",
    _fluidsbenchNativeProfileTruth: true,
    series: [nativeProfileSeries()],
  };
  const predictionSource = {
    case_id: "run_419",
    _fluidsbenchRelativeProfileV3: true,
    series: [currentProfileSeries()],
  };
  const truth = api.profileSeries(truthSource, velocityPanel, "V1", quantity, families[1]);
  const prediction = api.profileSeries(predictionSource, velocityPanel, "V1", quantity, families[1]);
  assert.equal(api.profileSeriesCompatibility(truth, prediction), true);
  assert.equal(truth.points.length, 4);
  assert.equal(truth.chartPoints.length, 5, "a null point must preserve the unsupported interior gap");
  assert.equal(truth.chartPoints[3].x, null);
  assert.deepEqual(
    Array.from(truth.points, (point) => point.segmentId),
    ["supported", "supported", "supported", "supported"]
  );
  assert.deepEqual(
    Array.from(truth.points, (point) => point.segmentOrdinal),
    [0, 0, 0, 1]
  );
  assert.deepEqual(
    Array.from(truth.points, (point) => point.gapBefore),
    [false, false, false, true]
  );

  const wrongSupport = api.profileSeries(
    {
      case_id: "run_419",
      _fluidsbenchRelativeProfileV3: true,
      series: [currentProfileSeries({ support_identity_sha256: "8".repeat(64) })],
    },
    velocityPanel,
    "V1",
    quantity,
    families[1]
  );
  assert.throws(() => api.profileSeriesCompatibility(truth, wrongSupport), /support identity differs/);
  const wrongReceipt = api.profileSeries(
    {
      case_id: "run_419",
      _fluidsbenchRelativeProfileV3: true,
      series: [currentProfileSeries({ placement_receipt_identity_sha256: "8".repeat(64) })],
    },
    velocityPanel,
    "V1",
    quantity,
    families[1]
  );
  assert.throws(() => api.profileSeriesCompatibility(truth, wrongReceipt), /placement-receipt identity differs/);
  const wrongCoordinates = api.profileSeries(
    {
      case_id: "run_419",
      _fluidsbenchRelativeProfileV3: true,
      series: [currentProfileSeries({ coordinate: [0, 0.4, 0.6, 1] })],
    },
    velocityPanel,
    "V1",
    quantity,
    families[1]
  );
  assert.throws(() => api.profileSeriesCompatibility(truth, wrongCoordinates), /ordered coordinates differ/);
  assert.equal(
    api.profileSeries(truthSource, velocityPanel, "autocfd5_v1", quantity, families[0]),
    null,
    "the fixed tab must never fall back to a geometry-relative series"
  );

  const cpPanel = drivaerml.diagnostic_panels.find((panel) => panel.id === "pressure_profiles");
  const cpQuantity = cpPanel.quantities[0];
  const canonical = nativeProfileSeries({
    panel_id: "pressure_profiles",
    family_id: "drivaerml_cp_constant_v1",
    placement_mode: "constant",
    station_id: "upperbody_centerline",
    quantity_id: "cp",
    quantity: "pressure_coefficient",
    coordinate_id: "arc_length_m",
    coordinate_unit: "m",
    scoring_role: "inherits_parent_candidate",
  });
  const alias = {
    panel_id: "pressure_profiles",
    family_id: "drivaerml_cp_relative_v1",
    placement_mode: "relative",
    station_id: "upperbody_centerline",
    quantity_id: "cp",
    quantity: "pressure_coefficient",
    units: "1",
    scoring_role: "report_only",
    representation: "shared_alias",
    placement_receipt_identity_sha256: "9".repeat(64),
    series_identity_sha256: "a".repeat(64),
    shared_support_ref: {
      canonical_family_id: "drivaerml_cp_constant_v1",
      canonical_station_id: "upperbody_centerline",
      canonical_support_identity_sha256: canonical.support_identity_sha256,
      shared_support_id: "drivaerml-cp-upperbody-centerline-y0-v1",
    },
  };
  const resolvedAlias = api.profileSeries(
    { case_id: "run_419", _fluidsbenchNativeProfileTruth: true, series: [canonical, alias] },
    cpPanel,
    "upperbody_centerline",
    cpQuantity,
    { id: "drivaerml_cp_relative_v1", placementMode: "relative" }
  );
  assert.equal(resolvedAlias.representation, "shared_alias");
  assert.deepEqual(Array.from(resolvedAlias.coordinates), canonical.coordinate);
}
assert.match(source, /native profile chunk is unavailable because its SHA-256 bytes could not be verified/);
assert.match(source, /spanGaps: false/);
assert.match(source, /detail: \[\{ field: "series" \}, \{ field: "segment_ordinal" \}\]/);
assert.match(source, /legacy profile series cannot be overlaid on identity-bound native ground truth/);
assert.match(source, /Native CFD ground truth/);
assert.match(source, /fluidsbench-profile-plot-export-v3/);
assert.match(source, /"coordinate",\s*\n\s*"display_coordinate"/);

async function verifyNativeV3CpDisplayCoordinates() {
  api.state.dataset = "DrivAerML";
  const drivaerml = manifest.datasets.find((dataset) => dataset.slug === "drivaerml");
  const cpPanel = drivaerml.diagnostic_panels.find((panel) => panel.id === "pressure_profiles");
  const cpFamily = api.profileFamilies(cpPanel).find((family) => family.id === "drivaerml_cp_relative_v1");
  const cpStation = api.profileStations(cpPanel, cpFamily).find(
    (station) => station.id === "sidewall_front_wheelhouse_relative"
  );
  const quantity = cpPanel.quantities[0];
  const materialized = nativeV3CpSeries();
  const truthSource = {
    case_id: "run_419",
    _fluidsbenchNativeProfileTruth: true,
    _fluidsbenchNativeProfileTruthVersion: 3,
    series: [materialized],
  };
  const truth = api.profileSeries(truthSource, cpPanel, materialized.station_id, quantity, cpFamily);
  assert.deepEqual(
    Array.from(api.profileCoordinateViews(cpPanel), (view) => [view.id, view.label]),
    [
      ["physical_x", "Physical streamwise x coordinate, m"],
      ["arc_length", "Surface arc length (scoring coordinate), m"],
    ],
    "Cp must expose physical-x and arc-length coordinate views"
  );
  assert.equal(api.defaultProfileCoordinateView(cpPanel), "physical_x", "Cp must default to physical x");
  assert.deepEqual(Array.from(truth.displayCoordinates), materialized.display_coordinate);
  assert.equal(truth.displayCoordinateId, "streamwise_x_m");
  assert.equal(truth.displayCoordinateUnit, "m");

  const byteBound = JSON.parse(JSON.stringify(nativeV3CpSeries()));
  const byteBoundCase = { series: [byteBound] };
  await api.bindProfileCoordinateIdentities(byteBoundCase);
  byteBound.coordinate_identity_sha256 = byteBound._fluidsbenchCoordinateIdentitySha256;
  byteBound.display_coordinate_identity_sha256 = byteBound._fluidsbenchDisplayCoordinateIdentitySha256;
  assert.ok(
    api.profileSeries(
      {
        case_id: "run_419",
        _fluidsbenchNativeProfileTruth: true,
        _fluidsbenchNativeProfileTruthVersion: 3,
        series: [byteBound],
      },
      cpPanel,
      byteBound.station_id,
      quantity,
      cpFamily
    ),
    "native-v3 Cp must parse when both coordinate identities bind their canonical binary64 bytes"
  );
  byteBound.display_coordinate[0] = 1234.0;
  await assert.rejects(
    api.bindProfileCoordinateIdentities(byteBoundCase),
    /cached profile display-coordinate identity differs from recomputed bytes/
  );

  const physicalView = api.resolvedProfileCoordinateView(cpPanel, "physical_x", truth, cpStation);
  const physical = api.projectProfileSeries(truth, physicalView);
  assert.deepEqual(Array.from(physical.points, (point) => point.x), materialized.display_coordinate);
  assert.equal(physical.chartPoints[3].x, null, "physical-x projection must retain the native segment gap");
  assert.deepEqual(
    Array.from(physical.points, (point) => point.sourcePointIndex),
    [0, 1, 2, 3],
    "physical-x projection must not sort a non-monotone physical coordinate"
  );
  const exportedRows = api.profilePlotValues(
    [
      {
        label: "Native CFD",
        seriesRole: "public_ground_truth",
        submissionId: null,
        lineStyle: "solid",
        finitePoints: physical.points,
        sourcePointCount: truth.sourcePointCount,
        droppedPointCount: truth.droppedPointCount,
        segmentCount: truth.segmentCount,
        unsupportedSampleCount: truth.unsupportedSampleCount,
        profileIdentity: truth,
        sourceProvenance: {},
      },
    ],
    physicalView
  );
  assert.equal(exportedRows[0].coordinate_view, "physical_x");
  assert.equal(exportedRows[0].coordinate, materialized.coordinate[0]);
  assert.equal(exportedRows[0].display_coordinate, materialized.display_coordinate[0]);
  assert.equal(exportedRows[0].x, materialized.display_coordinate[0]);
  assert.equal(exportedRows[0].coordinate_identity_sha256, materialized.coordinate_identity_sha256);
  assert.equal(exportedRows[0].display_coordinate_identity_sha256, materialized.display_coordinate_identity_sha256);
  assert.deepEqual(
    Array.from(exportedRows, (row) => [row.source_point_index, row.segment_ordinal, row.gap_before]),
    [
      [0, 0, false],
      [1, 0, false],
      [2, 0, false],
      [3, 1, true],
    ],
    "JSON/CSV row projection must preserve exact source order and segment provenance"
  );

  const arcView = api.resolvedProfileCoordinateView(cpPanel, "arc_length", truth, cpStation);
  const arc = api.projectProfileSeries(truth, arcView);
  assert.deepEqual(Array.from(arc.points, (point) => point.x), materialized.coordinate);
  assert.equal(arc.chartPoints[3].x, null, "arc projection must retain the same native segment gap");
  assert.deepEqual(
    Array.from(api.profileTooltipLines({ label: "Native CFD" }, physical.points[0], cpPanel, quantity, physicalView)),
    [
      "Native CFD",
      `Physical streamwise x coordinate, m: ${materialized.display_coordinate[0]}`,
      `Surface arc length (scoring coordinate), m: ${materialized.coordinate[0]}`,
      `${quantity.y_label}: ${materialized.value[0]}`,
    ]
  );

  const predictionSeries = currentProfileSeries({
    panel_id: "pressure_profiles",
    family_id: materialized.family_id,
    placement_mode: "relative",
    station_id: materialized.station_id,
    quantity_id: "cp",
    scoring_role: "report_only",
    coordinate_id: "arc_length_m",
    coordinate_unit: "m",
  });
  const prediction = api.profileSeries(
    { case_id: "run_419", _fluidsbenchRelativeProfileV3: true, series: [predictionSeries] },
    cpPanel,
    materialized.station_id,
    quantity,
    cpFamily
  );
  assert.equal(api.profileSeriesCompatibility(truth, prediction), true);
  assert.deepEqual(Array.from(prediction.displayCoordinates), materialized.display_coordinate);
  assert.deepEqual(
    Array.from(api.projectProfileSeries(prediction, physicalView).points, (point) => point.x),
    materialized.display_coordinate,
    "current submissions must inherit physical-x display data only after exact support compatibility"
  );

  const wrongDisplayIdentity = nativeV3CpSeries({ computedDisplayCoordinateIdentity: "c".repeat(64) });
  assert.throws(
    () =>
      api.profileSeries(
        {
          case_id: "run_419",
          _fluidsbenchNativeProfileTruth: true,
          _fluidsbenchNativeProfileTruthVersion: 3,
          series: [wrongDisplayIdentity],
        },
        cpPanel,
        wrongDisplayIdentity.station_id,
        quantity,
        cpFamily
      ),
    /display-coordinate identity does not bind/
  );
  const unalignedDisplay = nativeV3CpSeries({ display_coordinate: [-0.8, -0.9, -0.7] });
  assert.throws(
    () =>
      api.profileSeries(
        {
          case_id: "run_419",
          _fluidsbenchNativeProfileTruth: true,
          _fluidsbenchNativeProfileTruthVersion: 3,
          series: [unalignedDisplay],
        },
        cpPanel,
        unalignedDisplay.station_id,
        quantity,
        cpFamily
      ),
    /unaligned coordinate, display-coordinate/
  );

  const canonical = nativeV3CpSeries({
    family_id: "drivaerml_cp_constant_v1",
    placement_mode: "constant",
    station_id: "upperbody_centerline",
    scoring_role: "inherits_parent_candidate",
  });
  const alias = {
    panel_id: "pressure_profiles",
    family_id: "drivaerml_cp_relative_v1",
    placement_mode: "relative",
    station_id: "upperbody_centerline",
    quantity_id: "cp",
    quantity: "pressure_coefficient",
    units: "1",
    scoring_role: "report_only",
    representation: "shared_alias",
    placement_receipt_identity_sha256: "9".repeat(64),
    series_identity_sha256: "a".repeat(64),
    shared_support_ref: {
      canonical_family_id: "drivaerml_cp_constant_v1",
      canonical_station_id: "upperbody_centerline",
      canonical_support_identity_sha256: canonical.support_identity_sha256,
      shared_support_id: "drivaerml-cp-upperbody-centerline-y0-v1",
    },
  };
  const resolvedAlias = api.profileSeries(
    {
      case_id: "run_419",
      _fluidsbenchNativeProfileTruth: true,
      _fluidsbenchNativeProfileTruthVersion: 3,
      series: [canonical, alias],
    },
    cpPanel,
    alias.station_id,
    quantity,
    cpFamily
  );
  assert.equal(resolvedAlias.representation, "shared_alias");
  assert.deepEqual(Array.from(resolvedAlias.displayCoordinates), canonical.display_coordinate);
  assert.equal(resolvedAlias.seriesIdentity, alias.series_identity_sha256, "a shared alias must retain its own series identity");
  const aliasRows = api.profilePlotValues(
    [
      {
        label: "Native CFD alias",
        seriesRole: "public_ground_truth",
        submissionId: null,
        lineStyle: "solid",
        finitePoints: api.projectProfileSeries(resolvedAlias, physicalView).points,
        sourcePointCount: resolvedAlias.sourcePointCount,
        droppedPointCount: resolvedAlias.droppedPointCount,
        segmentCount: resolvedAlias.segmentCount,
        unsupportedSampleCount: resolvedAlias.unsupportedSampleCount,
        profileIdentity: resolvedAlias,
        sourceProvenance: {},
      },
    ],
    physicalView
  );
  assert.equal(
    aliasRows[0].series_identity_sha256,
    alias.series_identity_sha256,
    "plot exports must identify the selected alias rather than its canonical materialization"
  );
  assert.notEqual(aliasRows[0].series_identity_sha256, canonical.series_identity_sha256);

  assert.equal(
    api.nativeProfileTruthVersion(
      {
        schema: "fluidsbench-drivaerml-native-profile-truth-split-index-v3",
        schema_version: "3.0",
      },
      "split"
    ),
    3
  );
}

async function verifyCurrentRun419ProfileFixture() {
  api.state.dataset = "DrivAerML";
  const fixturePath = path.join(
    submissionRoot,
    "benchmark-specs/drivaerml/evidence/transolver-run419-current-relative-profile-v3/profiles/chunk-000.json"
  );
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  assert.equal(fixture.schema_version, "3.0-drivaerml-relative-candidate");
  assert.equal(fixture.cases.length, 1);
  const profileCase = {
    ...fixture.cases[0],
    _fluidsbenchRelativeProfileV3: true,
  };
  await api.bindProfileCoordinateIdentities(profileCase);
  assert.equal(profileCase.case_id, "run_419");
  assert.equal(profileCase.series.length, 40);

  const drivaerml = manifest.datasets.find((dataset) => dataset.slug === "drivaerml");
  const parsedKeys = [];
  profileCase.series.forEach((series) => {
    const panel = drivaerml.diagnostic_panels.find((candidate) => candidate.id === series.panel_id);
    const family = api.profileFamilies(panel).find((candidate) => candidate.id === series.family_id);
    const quantity = panel.quantities.find((candidate) => candidate.id === series.quantity_id);
    assert.ok(family, `fixture family ${series.family_id} must be exposed by the profile controls`);
    assert.ok(
      api.profileStations(panel, family).some((station) => station.id === series.station_id),
      `fixture station ${series.family_id}/${series.station_id} must be exposed by the profile controls`
    );
    const parsed = api.profileSeries(profileCase, panel, series.station_id, quantity, family);
    assert.ok(parsed, `fixture series ${series.family_id}/${series.station_id} must parse`);
    assert.equal(parsed.points.length, parsed.coordinates.length);
    assert.ok(/^[0-9a-f]{64}$/.test(parsed.coordinateIdentity));
    parsedKeys.push(`${series.family_id}/${series.station_id}/${series.representation}`);
  });
  assert.equal(new Set(parsedKeys).size, 40, "the real run_419 fixture must retain 40 unique family/station/representation keys");

  const cpPanel = drivaerml.diagnostic_panels.find((panel) => panel.id === "pressure_profiles");
  assert.deepEqual(
    Array.from(api.profileFamilies(cpPanel), (family) => [family.id, family.label]),
    [
      ["drivaerml_cp_constant_v1", "Fixed locations"],
      ["drivaerml_cp_relative_v1", "Geometry-relative locations — diagnostic, not scored"],
    ]
  );
}

async function verifyDrivaerLegacyTruthFailsClosed() {
  const previousManifest = api.state.groundTruthManifest;
  const previousProvenance = api.state.groundTruthManifestProvenance;
  const previousIndexes = api.state.groundTruthIndexes;
  const indexSha256 = "b".repeat(64);
  const baseUrl = "https://example.test/profile-ground-truth/";
  api.state.groundTruthManifest = {
    datasets: [
      {
        id: "stale-or-missing-drivaerml-id",
        name: "DrivAerML",
        splits: [{ id: "full", label: "Full", case_set_id: "standard" }],
        case_sets: [
          {
            id: "standard",
            index_file: "datasets/drivaerml/standard/index.json",
            index_sha256: indexSha256,
          },
        ],
      },
    ],
  };
  api.state.groundTruthManifestProvenance = { base_url: baseUrl };
  api.state.groundTruthIndexes = new Map([
    [
      new URL("datasets/drivaerml/standard/index.json", baseUrl).href,
      {
        sha256: indexSha256,
        data: {
          schema: "fluidsbench-profile-ground-truth-index-v1",
          chunks: [{ case_ids: ["run_419"] }],
        },
      },
    ],
  ]);
  try {
    await assert.rejects(
      api.groundTruthIndex("DrivAerML", "Full"),
      /must use a checksum-bound native CFD v2 or v3 release; legacy or analytical indexes are unavailable/,
      "DrivAerML must never fall back to the former analytical v1 ground truth"
    );
  } finally {
    api.state.groundTruthManifest = previousManifest;
    api.state.groundTruthManifestProvenance = previousProvenance;
    api.state.groundTruthIndexes = previousIndexes;
  }
}

async function verifyNativeRun419AgainstCurrentFixture(nativeRecord) {
  const nativeCase = {
    ...nativeRecord,
    _fluidsbenchNativeProfileTruth: true,
    _fluidsbenchNativeProfileTruthVersion: 3,
  };
  await api.bindProfileCoordinateIdentities(nativeCase);
  assert.equal(nativeCase.case_id, "run_419");
  assert.equal(nativeCase.series.length, 40);

  const currentPath = path.join(
    submissionRoot,
    "benchmark-specs/drivaerml/evidence/transolver-run419-current-relative-profile-v3/profiles/chunk-000.json"
  );
  const currentChunk = JSON.parse(fs.readFileSync(currentPath, "utf8"));
  const currentCase = {
    ...currentChunk.cases[0],
    _fluidsbenchRelativeProfileV3: true,
  };
  await api.bindProfileCoordinateIdentities(currentCase);

  const drivaerml = manifest.datasets.find((dataset) => dataset.slug === "drivaerml");
  const compared = [];
  let materializedCpCount = 0;
  nativeCase.series.forEach((series) => {
    const panel = drivaerml.diagnostic_panels.find((candidate) => candidate.id === series.panel_id);
    const family = api.profileFamilies(panel).find((candidate) => candidate.id === series.family_id);
    const station = api.profileStations(panel, family).find((candidate) => candidate.id === series.station_id);
    const quantity = panel.quantities.find((candidate) => candidate.id === series.quantity_id);
    const truth = api.profileSeries(nativeCase, panel, series.station_id, quantity, family);
    const prediction = api.profileSeries(currentCase, panel, series.station_id, quantity, family);
    assert.ok(truth, `native run_419 series ${series.family_id}/${series.station_id} must parse`);
    assert.ok(prediction, `current run_419 series ${series.family_id}/${series.station_id} must parse`);
    assert.equal(api.profileSeriesCompatibility(truth, prediction), true);
    assert.equal(prediction.lineageInheritedFromNativeTruth, true);
    assert.equal(prediction.points.length, truth.points.length);
    if (series.panel_id === "pressure_profiles" && series.representation === "materialized") {
      materializedCpCount += 1;
      const physicalView = api.resolvedProfileCoordinateView(panel, "physical_x", truth, station);
      const arcView = api.resolvedProfileCoordinateView(panel, "arc_length", truth, station);
      const physical = api.projectProfileSeries(truth, physicalView);
      const arc = api.projectProfileSeries(truth, arcView);
      const physicalPrediction = api.projectProfileSeries(prediction, physicalView);
      const arcPrediction = api.projectProfileSeries(prediction, arcView);
      assert.equal(physicalView.id, "physical_x");
      assert.equal(arcView.id, "arc_length");
      assert.deepEqual(Array.from(physical.points, (point) => point.x), Array.from(series.display_coordinate));
      assert.deepEqual(Array.from(arc.points, (point) => point.x), Array.from(series.coordinate));
      assert.deepEqual(
        Array.from(physicalPrediction.points, (point) => point.x),
        Array.from(series.display_coordinate),
        `${series.family_id}/${series.station_id} prediction must inherit physical x only after compatibility passes`
      );
      assert.deepEqual(Array.from(arcPrediction.points, (point) => point.x), Array.from(series.coordinate));
      assert.deepEqual(
        Array.from(physical.points, (point) => point.sourcePointIndex),
        Array.from(arc.points, (point) => point.sourcePointIndex),
        `${series.family_id}/${series.station_id} coordinate views must preserve producer source order`
      );
      assert.equal(
        physical.chartPoints.filter((point) => point.gapSeparator).length,
        series.segments.length - 1,
        `${series.family_id}/${series.station_id} physical x must preserve every producer segment break`
      );
      assert.equal(
        arc.chartPoints.filter((point) => point.gapSeparator).length,
        series.segments.length - 1,
        `${series.family_id}/${series.station_id} arc length must preserve every producer segment break`
      );
      assert.equal(
        physicalPrediction.chartPoints.filter((point) => point.gapSeparator).length,
        series.segments.length - 1,
        `${series.family_id}/${series.station_id} prediction must inherit every producer segment break`
      );
    }
    compared.push(`${series.family_id}/${series.station_id}/${series.representation}`);
  });
  assert.equal(new Set(compared).size, 40, "native and current run_419 fixtures must match all 40 exact series");
  assert.equal(materializedCpCount, 6, "real native-v3 run_419 must exercise all six materialized Cp series in both coordinate views");
}

async function verifyRetainedNativeRun419Bundle() {
  const groundTruthRoot = path.join(root, "assets/data/profile-ground-truth");
  const groundTruthManifest = JSON.parse(fs.readFileSync(path.join(groundTruthRoot, "manifest.json"), "utf8"));
  const drivaerml = groundTruthManifest.datasets.find((dataset) => dataset.id === "drivaerml");
  const declaration = drivaerml.native_profile_truth;
  assert.deepEqual(declaration, {
    source_kind: "native_cfd",
    analytical_dummy: false,
    dataset_revision: "7a5c0948ce27be709b1116a3a190f806e7a8f79f",
    native_source_pin_sha256: "4fc9077f8f23f4994c98f4d0e7a17aef7b998de4c996638e3a8a616b6d923fdd",
    case_count: 484,
    master_index_file: "datasets/drivaerml/native-v3/index.json",
    master_index_sha256: "e7cf14f161fc7dbf22794e6f66db4e157329be960d2a4368140e08cf0608a5ae",
  });

  const masterPath = path.join(groundTruthRoot, declaration.master_index_file);
  assert.equal(sha256File(masterPath), declaration.master_index_sha256);
  const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));
  assert.equal(master.case_count, 484);
  assert.equal(new Set(master.case_ids).size, 484);
  const location = master.case_locations.find((candidate) => candidate.case_id === "run_419");
  assert.ok(location, "native master index must locate run_419");
  const chunkBinding = master.chunks.find((candidate) => candidate.chunk_id === location.chunk_id);
  assert.ok(chunkBinding, "native run_419 chunk must be bound by the master index");
  assert.equal(location.chunk_path, chunkBinding.path);
  assert.equal(location.chunk_sha256, chunkBinding.sha256);
  const chunkPath = path.join(path.dirname(masterPath), chunkBinding.path);
  assert.equal(sha256File(chunkPath), chunkBinding.sha256);
  const chunk = JSON.parse(fs.readFileSync(chunkPath, "utf8"));
  assert.equal(chunk.case_ids[location.case_offset], "run_419");
  assert.equal(chunk.cases[location.case_offset].case_id, "run_419");
  await verifyNativeRun419AgainstCurrentFixture(chunk.cases[location.case_offset]);

  const extremeExpectations = {
    run_95: {
      "drivaerml-autocfd5-constant-v1": [16, 0, 3644, 112, 17],
      "drivaerml-velocity-relative-v3": [16, 0, 3676, 80, 17],
      drivaerml_cp_constant_v1: [4, 0, 6884, 0, 4],
      drivaerml_cp_relative_v1: [2, 2, 2045, 0, 4],
    },
    run_356: {
      "drivaerml-autocfd5-constant-v1": [16, 0, 3664, 92, 17],
      "drivaerml-velocity-relative-v3": [16, 0, 3680, 76, 17],
      drivaerml_cp_constant_v1: [4, 0, 5339, 0, 4],
      drivaerml_cp_relative_v1: [2, 2, 1290, 0, 4],
    },
    run_393: {
      "drivaerml-autocfd5-constant-v1": [16, 0, 3505, 251, 22],
      "drivaerml-velocity-relative-v3": [16, 0, 3673, 83, 17],
      drivaerml_cp_constant_v1: [4, 0, 5929, 0, 4],
      drivaerml_cp_relative_v1: [2, 2, 1805, 0, 4],
    },
  };
  const profileDefinition = manifest.datasets.find((dataset) => dataset.slug === "drivaerml");
  api.state.dataset = "DrivAerML";
  for (const [caseId, expected] of Object.entries(extremeExpectations)) {
    const extremeLocation = master.case_locations.find((candidate) => candidate.case_id === caseId);
    assert.ok(extremeLocation, `native master index must locate ${caseId}`);
    const extremeChunkPath = path.join(path.dirname(masterPath), extremeLocation.chunk_path);
    assert.equal(sha256File(extremeChunkPath), extremeLocation.chunk_sha256);
    const extremeChunk = JSON.parse(fs.readFileSync(extremeChunkPath, "utf8"));
    const extremeCase = {
      ...extremeChunk.cases[extremeLocation.case_offset],
      _fluidsbenchNativeProfileTruth: true,
      _fluidsbenchNativeProfileTruthVersion: 3,
    };
    assert.equal(extremeCase.case_id, caseId);
    assert.equal(extremeCase.series.length, 40);
    await api.bindProfileCoordinateIdentities(extremeCase);
    const actual = {};
    for (const series of extremeCase.series) {
      const panel = profileDefinition.diagnostic_panels.find((candidate) => candidate.id === series.panel_id);
      const family = api.profileFamilies(panel).find((candidate) => candidate.id === series.family_id);
      const quantity = panel.quantities.find((candidate) => candidate.id === series.quantity_id);
      const parsed = api.profileSeries(extremeCase, panel, series.station_id, quantity, family);
      assert.ok(parsed, `${caseId}/${series.family_id}/${series.station_id} must be browser-renderable`);
      assert.equal(parsed.points.length, parsed.coordinates.length);
      assert.equal(
        parsed.chartPoints.length,
        parsed.points.length + parsed.segmentCount - 1,
        `${caseId}/${series.family_id}/${series.station_id} must insert a null chart point at every producer segment boundary`
      );
      const familyStats = actual[series.family_id] || [0, 0, 0, 0, 0];
      if (series.representation === "shared_alias") {
        familyStats[1] += 1;
      } else {
        familyStats[0] += 1;
        familyStats[2] += series.coordinate.length;
        familyStats[3] += series.unsupported_samples.length;
        familyStats[4] += series.segments.length;
      }
      actual[series.family_id] = familyStats;
    }
    assert.deepEqual(actual, expected, `${caseId} extreme-case resolution and gap topology must remain exact`);
  }
}

assert.deepEqual(
  Object.keys(displayConfig).sort(),
  manifest.datasets.map((dataset) => dataset.slug).sort(),
  "every dataset must have exactly one headline-metric configuration"
);
manifest.datasets.forEach((dataset) => {
  api.state.dataset = dataset.name;
  const configuredIds = displayConfig[dataset.slug].headline_metric_ids;
  assert.equal(configuredIds.length, 5, `${dataset.name} must declare five headline metrics`);
  assert.equal(configuredIds[0], dataset.ranking.metric_id, `${dataset.name} must foreground its ranking metric`);
  configuredIds.forEach((metricId) => {
    assert.ok(dataset.metric_ids.includes(metricId), `${dataset.name} headline metric ${metricId} must exist in its feed`);
  });
  const configuredRadarIds = displayConfig[dataset.slug].radar_metric_ids;
  const compositeComponents = new Map((dataset.overall_score_composite?.components || []).map((component) => [component.metric_id, component]));
  assert.equal(new Set(configuredRadarIds).size, configuredRadarIds.length, `${dataset.name} radar axes must be unique`);
  configuredRadarIds.forEach((metricId) => {
    assert.ok(dataset.metric_ids.includes(metricId), `${dataset.name} radar metric ${metricId} must exist in its feed`);
    assert.ok(compositeComponents.has(metricId), `${dataset.name} radar metric ${metricId} must use a published score transform`);
  });
  if (configuredRadarIds.length < 3) {
    assert.match(
      displayConfig[dataset.slug].radar_unavailable_reason || "",
      /scored/i,
      `${dataset.name} must explain why a radar chart is scientifically unavailable`
    );
  } else {
    assert.equal(configuredRadarIds.length, 4, `${dataset.name} must declare four radar axes`);
  }
  assert.deepEqual(
    Array.from(api.radarMetricAxes(), (axis) => axis.definition.id),
    configuredRadarIds,
    `${dataset.name} radar order must follow its display configuration`
  );
  assert.deepEqual(
    Array.from(api.headlineMetricDefinitions(), (definition) => definition.id),
    configuredIds,
    `${dataset.name} summary metric order must follow its display configuration`
  );
  api.state.metricView = "summary";
  assert.deepEqual(
    Array.from(
      api
        .activeColumns()
        .filter((column) => column.definition)
        .map((column) => column.definition.id)
    ),
    configuredIds,
    `${dataset.name} summary table must contain only its headline metrics`
  );
  api.state.metricView = "full";
  api.state.visibleGroups = new Set(["absolute", "relative", "integral", "diagnostics", "scores", "model-details"]);
  assert.equal(
    api.activeColumns().filter((column) => column.definition).length,
    dataset.metric_ids.length,
    `${dataset.name} full table must retain every metric`
  );
});
api.state.metricView = "summary";

assert.equal(api.radarNormalizedValue(0, { transform: "bounded_error", cap: 20 }), 100);
assert.equal(api.radarNormalizedValue(10, { transform: "bounded_error", cap: 20 }), 50);
assert.equal(api.radarNormalizedValue(25, { transform: "bounded_error", cap: 20 }), 0);
assert.equal(api.radarNormalizedValue(0.82, { transform: "bounded_quality" }), 82);
assert.equal(api.radarNormalizedValue(-0.3, { transform: "bounded_quality" }), 0);
assert.equal(api.radarNormalizedValue(null, { transform: "bounded_quality" }), null);
assert.ok(
  leaderboardPageSource.indexOf('id="leaderboard-metric-view-toggle"') < leaderboardPageSource.indexOf('id="leaderboard-radar-panel"') &&
    leaderboardPageSource.indexOf('id="leaderboard-radar-panel"') < leaderboardPageSource.indexOf('class="leaderboard-table-wrap"'),
  "radar comparison must sit between the metric-view controls and leaderboard table"
);
assert.match(leaderboardPageSource, /id="leaderboard-release-details"/);
assert.match(leaderboardPageSource, /id="leaderboard-advanced-analysis"/);
assert.match(leaderboardPageSource, /data-analysis-tab="comparison"/);
assert.match(leaderboardPageSource, /data-analysis-panel="profiles"/);
assert.match(leaderboardPageSource, /id="leaderboard-methodology"/);
assert.match(leaderboardPageSource, /site\.leaderboard_local_base_url/);
assert.match(leaderboardPageSource, /configuredLocalLeaderboardBaseUrl/);
assert.match(leaderboardPageSource, /default: "http:\/\/127\.0\.0\.1:4100\/"/);
assert.match(source, /Technical provenance and validation/);
assert.match(source, /leaderboard-result-summary/);

const baseSurfacePressureDefinition = api.state.metrics.get("surface_pressure_rel_l2");
const baseSurfacePressureSnapshot = JSON.stringify(baseSurfacePressureDefinition);
const expectedSurfaceWeighting = new Map([
  ["AhmedML", "area-weighted"],
  ["AirfRANS", "length-weighted"],
  ["DrivAerML", "area-weighted"],
  ["DrivAerNet++", "area-weighted"],
  ["HiLiftAeroML", "area-weighted"],
  ["WindsorML", "area-weighted"],
]);
expectedSurfaceWeighting.forEach((weighting, datasetName) => {
  api.state.dataset = datasetName;
  const definition = api.metricDefinition("surface_pressure_rel_l2");
  assert.match(definition.label, new RegExp(`\\(${weighting}\\)$`));
  assert.match(definition.description, new RegExp(`^(?:Per-case )?${weighting}`, "i"));
  assert.notStrictEqual(definition, baseSurfacePressureDefinition, `${datasetName} must receive a resolved presentation copy`);
});
assert.equal(
  JSON.stringify(baseSurfacePressureDefinition),
  baseSurfacePressureSnapshot,
  "dataset presentation overrides must not mutate the shared metric definition"
);
manifest.datasets.forEach((dataset) => {
  api.state.dataset = dataset.name;
  api.activeMetricDefinitions().forEach((definition) => {
    assert.doesNotMatch(definition.label, /area- or length-weighted/i, `${dataset.name}/${definition.id} must use exact weighting wording`);
    assert.doesNotMatch(
      definition.description || "",
      /area- or length-weighted/i,
      `${dataset.name}/${definition.id} must use exact weighting wording`
    );
    assert.doesNotMatch(definition.label, /flow-domain (?:velocity|pressure)/i, `${dataset.name}/${definition.id} must use simple quantity names`);
    assert.doesNotMatch(
      definition.description || "",
      /flow-domain (?:velocity|pressure)/i,
      `${dataset.name}/${definition.id} must use simple quantity names`
    );
  });
});

feed.map(api.normalizeRow).forEach((row) => api.state.rows.get(row.dataset)?.push(row));
manifest.datasets.forEach((dataset) => {
  api.state.dataset = dataset.name;
  dataset.splits.forEach((split) => {
    api.state.split = split.name;
    const rankedRows = api.rowsForActiveSplit();
    rankedRows.forEach((row) => {
      if (row.record_type === "development_fixture") {
        assert.equal(row.rank, null, `${dataset.name}/${split.name}/${row.id} development fixture must not receive a rank`);
        assert.equal(
          row._ranking.source,
          "non_ranked_development_fixture",
          `${dataset.name}/${split.name}/${row.id} must retain explicit non-ranked fixture provenance`
        );
        return;
      }
      assert.equal(
        row._ranking.source,
        "verified_generated_release",
        `${dataset.name}/${split.name}/${row.id} generated ranking must match an independent full-split calculation`
      );
    });
  });
});

api.state.manifest = {
  data_release: { release_view_url: "https://fluidsbench.org/releases/release-1/" },
};
assert.equal(
  api.canonicalResultPermalink({ id: "model-1", dataset_id: "ahmedml", split_id: "full" }),
  "https://fluidsbench.org/releases/release-1/?view=result&dataset=ahmedml&split=full&result=model-1"
);

async function verifyGeneratedClaimRecords() {
  api.state.manifest = manifest;
  api.state.loadedFeedSha256 = manifest.data_release.feed_sha256;
  const claimIndex = await api.ensureClaimsIndex();
  assert.ok(claimIndex, "claim index must pass browser-equivalent hash and binding verification");
  for (const dataset of manifest.datasets) {
    api.state.dataset = dataset.name;
    for (const split of dataset.splits) {
      api.state.split = split.name;
      for (const row of api.rowsForActiveSplit()) {
        await api.ensureClaimRecord(row);
        if (row.record_type === "development_fixture") {
          assert.equal(
            api.claimRecordCheck(row)?.status,
            "not_listed",
            `${dataset.name}/${split.name}/${row.id} development fixture must not publish a claim record`
          );
          const eligibility = api.claimEligibility(row);
          assert.equal(eligibility.academic_citation, false);
          assert.equal(eligibility.promotion, false);
          continue;
        }
        assert.equal(api.claimRecordCheck(row)?.status, "verified", `${dataset.name}/${split.name}/${row.id} claim record must verify`);
      }
    }
  }
}

function verifyOfficialAcademicHappyPath() {
  const submissionId = "model-rd-v2";
  const releaseId = "release-2026-07";
  const assetBaseUrl = `https://assets.fluidsbench.org/releases/${releaseId}/`;
  const releaseViewUrl = `https://fluidsbench.org/releases/${releaseId}/`;
  const resultPermalink = `${releaseViewUrl}?view=result&dataset=example&split=full&result=${submissionId}`;
  const claimRecordUrl = `${assetBaseUrl}leaderboard/claims/example/full/${submissionId}.json`;
  const feedSha256 = "a".repeat(64);
  const groundTruthSha256 = "b".repeat(64);
  const validationSha256 = "c".repeat(64);
  const evaluationSha256 = "d".repeat(64);
  const profileSha256 = "e".repeat(64);
  const ranking = {
    metric_id: "score",
    value: 9.94,
    ranked_value: 9.9,
    display_value: "9.9",
    unit: "points",
    direction: "higher",
    decimal_places: 1,
    rounding: "decimal_half_up",
    method: "competition",
    rank: 1,
    ranked_result_count: 1,
    tied: false,
    tie_count: 1,
  };
  const validation = {
    schema_version: "2.0",
    status: "validated",
    contract_version: "open-reproducibility-2.0",
    reference_version: "reference-v1",
    case_set_id: "standard",
    profile_ground_truth_release_id: "ground-truth-2026-07",
    profile_ground_truth_manifest_sha256: groundTruthSha256,
    validated_by: "Maintainer",
    validated_at: "2026-07-22T00:00:00Z",
    validation_scope: "submitted_data_only",
    model_execution: "not_performed",
    metric_recomputation: "not_performed",
    reviewed_submission_sha256: "f".repeat(64),
    evaluation_evidence_sha256: evaluationSha256,
    profile_index_sha256: profileSha256,
    evidence_path: `submissions/example/${submissionId}/maintainer-validation.json`,
    evidence_sha256: validationSha256,
  };
  const row = {
    id: submissionId,
    submission_id: submissionId,
    schema_version: "2.0",
    model: "R&D_v2",
    dataset: "Example",
    dataset_id: "example",
    split: "Full",
    split_id: "full",
    metricValues: { score: 9.94 },
    metric_values: { score: 9.94 },
    modelTypes: ["Mesh"],
    model_types: ["Mesh"],
    parameterCount: 1,
    approvalStatus: "approved",
    approval: { status: "approved", validation: { evidence_sha256: validationSha256 } },
    reproducibility: { contract_version: "open-reproducibility-2.0" },
    evaluation: { evidence_file: "evaluation-evidence.json", evidence_sha256: evaluationSha256 },
    profile_data: {
      index_file: `submissions/example/${submissionId}/profiles/index.json`,
      index_sha256: profileSha256,
      case_set_id: "standard",
      profile_ground_truth_release_id: "ground-truth-2026-07",
      profile_ground_truth_manifest_sha256: groundTruthSha256,
    },
    scoring_support: {
      status: "official",
      release_id: "example-scoring-v1",
      manifest_url: "https://example.test/scoring-support/manifest.json",
      manifest_sha256: "6".repeat(64),
    },
    spatial_discretization: {
      format: "fluidsbench-discretization-v1",
      file: "discretization.json",
      sha256: "7".repeat(64),
      summary: {
        training: {
          surface_input: {
            used: true,
            representation: "point_cloud",
            entity_counts: [{ entity: "vertex", count: { kind: "fixed", value: 1024 } }],
            native_comparison: {
              status: "reported",
              native_entity_counts: [{ entity: "vertex", count: { kind: "fixed", value: 8192 } }],
              fractions: [{ entity: "vertex", fraction: { kind: "fixed", value: 0.125 } }],
            },
            sampling: { kind: "fixed", method: "farthest point", seed: 7 },
            domain: {
              kind: "axis_aligned_box",
              coordinate_frame: "vehicle",
              length_unit: "m",
              minimum: [-1, -2, -3],
              maximum: [4, 5, 6],
              boundary_inclusion: "closed",
            },
            connectivity: "none",
          },
          surface_supervision: {
            used: true,
            representation: "point_cloud",
            entity_counts: [{ entity: "vertex", count: { kind: "fixed", value: 2048 } }],
            native_comparison: { status: "not_applicable" },
            sampling: { kind: "none" },
            domain: { kind: "full_dataset_domain" },
            connectivity: "none",
          },
          volume_input: { used: false },
          volume_supervision: { used: false },
        },
        inference: {
          geometry_dependency: "surface_geometry",
          surface_input: {
            used: true,
            representation: "point_cloud",
            entity_counts: [{ entity: "vertex", count: { kind: "fixed", value: 1024 } }],
            native_comparison: { status: "not_applicable" },
            sampling: { kind: "none" },
            domain: { kind: "full_dataset_domain" },
            connectivity: "none",
          },
          volume_input: { used: false },
          direct_outputs: [
            {
              id: "surface-output",
              domain: "surface",
              representation: {
                used: true,
                representation: "query_points",
                entity_counts: [{ entity: "point", count: { kind: "fixed", value: 4096 } }],
                native_comparison: { status: "not_applicable" },
                sampling: { kind: "none" },
                domain: { kind: "full_dataset_domain" },
                connectivity: "none",
              },
              queries_per_forward_pass: { kind: "fixed", value: 1024 },
            },
          ],
          mappings: [
            {
              support_id: "surface-support",
              source_output_id: "surface-output",
              method: { kind: "nearest" },
              implementation: "evaluation/map.py",
              extrapolation_policy: "forbidden",
              unmapped_fraction: 0,
              extrapolated_fraction: 0,
              final_coverage_fraction: 1,
            },
          ],
        },
        case_manifest: {
          format: "jsonl",
          file: "discretization/cases.jsonl",
          sha256: "3".repeat(64),
          case_count: 1,
        },
      },
    },
    case_metrics: {
      format: "fluidsbench-case-metrics-v1",
      file: "metrics/cases.json",
      sha256: "8".repeat(64),
      case_count: 1,
    },
    prediction_artifacts: [
      {
        artifact_id: "scored",
        kind: "scored_predictions",
        provider: "huggingface",
        repository_url: "https://huggingface.co/datasets/example/predictions",
        revision: "4".repeat(40),
        manifest_file: "fluidsbench-predictions.json",
        manifest_sha256: "5".repeat(64),
        format: "fluidsbench-prediction-artifact-v1",
        support_release_id: "example-scoring-v1",
        support_manifest_sha256: "6".repeat(64),
        split_id: "full",
        coverage: { kind: "complete_split", case_count: 1, expected_case_count: 1 },
        license_spdx: "CC-BY-4.0",
      },
    ],
    prediction_artifact_status: {
      sharing: "declared",
      declared_artifact_count: 1,
      maintainer_check_status: "recorded",
      checked_artifact_count: 1,
      check_file: `submissions/example/${submissionId}/prediction-artifact-checks.json`,
      check_sha256: "0".repeat(64),
      checks: [
        {
          artifact_id: "scored",
          status: "format_checked",
          checked_at: "2026-07-22T00:00:00Z",
          checked_by: "FluidsBench",
          repository_revision: "4".repeat(40),
          manifest_sha256: "5".repeat(64),
          checked_case_count: 1,
          recomputed_case_count: 0,
          expected_case_count: 1,
          metric_recomputation: "not_performed",
        },
      ],
    },
    maintainer_validation: validation,
    ranking,
    claim_eligibility: {
      academic_citation: true,
      promotion: true,
      reason_code: "approved_submitted_data_result",
      reason: "Approved submitted-data result in this immutable release.",
    },
    result_revision: {
      series_id: "model-rd",
      version: 2,
      supersedes: "model-rd-v1",
      change_summary: "Updated training and evaluation mapping.",
      is_latest: true,
      latest_submission_id: submissionId,
      version_count: 2,
    },
  };
  const trainingSurfaceSummary = api.representationSummary(row.spatial_discretization.summary.training.surface_input);
  assert.match(trainingSurfaceSummary, /vertex: 1,024 per case/i);
  assert.match(trainingSurfaceSummary, /native vertex: 8,192 per case/i);
  assert.match(trainingSurfaceSummary, /vertex: 12\.5% of native/i);
  assert.match(trainingSurfaceSummary, /sampling: farthest point/);
  assert.match(trainingSurfaceSummary, /domain: \[-1, -2, -3\] to \[4, 5, 6\] m in vehicle/);
  assert.doesNotMatch(trainingSurfaceSummary, /\[object Object\]/);
  const directOutputSummary = api.representationSummary(row.spatial_discretization.summary.inference.direct_outputs[0]);
  assert.match(directOutputSummary, /point: 4,096 per case/i);
  assert.match(directOutputSummary, /1,024 queries per forward pass/);
  assert.doesNotMatch(directOutputSummary, /\[object Object\]/);
  const declaredMappingSummary = api.mappingSummary(row);
  assert.match(declaredMappingSummary, /method: Nearest/);
  assert.match(declaredMappingSummary, /coverage: 100%/);
  assert.doesNotMatch(declaredMappingSummary, /\[object Object\]/);

  api.state.manifest = {
    all_file: "leaderboard/all.json",
    ranking_contract: {
      version: "1.0",
      scope: ["release_id", "dataset_id", "split_id"],
      method: "competition",
      tie_sequence_example: [1, 2, 2, 4],
      comparison: "rounded_metric_value",
      rounding: "decimal_half_up",
    },
    data_release: {
      id: releaseId,
      status: "official",
      generated_at: "2026-07-22T00:00:00Z",
      feed_sha256: feedSha256,
      archive_url: "https://doi.org/10.0000/fluidsbench.example",
      release_view_url: releaseViewUrl,
      asset_base_url: assetBaseUrl,
      reproducibility_contract_version: "open-reproducibility-2.0",
      profile_ground_truth: {
        release_id: "ground-truth-2026-07",
        manifest_url: "https://fluidsbench.org/releases/ground-truth-2026-07/manifest.json",
        manifest_sha256: groundTruthSha256,
      },
      license: {
        spdx_id: "CC-BY-4.0",
        name: "Creative Commons Attribution 4.0",
        url: "https://creativecommons.org/licenses/by/4.0/",
        scope: "Published result metadata.",
      },
      citation: { author: "FluidsBench contributors", title: "FluidsBench Leaderboard", publisher: "FluidsBench", year: 2026 },
    },
    metric_definitions: [{ id: "score", label: "Score", plain_label: "Score", unit: "points", digits: 1, direction: "higher" }],
    datasets: [
      {
        name: "Example",
        slug: "example",
        metric_ids: ["score"],
        ranking: { metric_id: "score", direction: "higher", decimal_places: 1, rounding: "decimal_half_up", method: "competition" },
        splits: [{ id: "full", name: "Full" }],
      },
    ],
  };
  api.state.metrics = new Map(api.state.manifest.metric_definitions.map((definition) => [definition.id, definition]));
  api.state.rows = new Map([["Example", [row]]]);
  const previousRow = {
    ...row,
    id: "model-rd-v1",
    submission_id: "model-rd-v1",
    submitted_at: "2026-07-20",
    date: "2026-07-20",
    ranking: undefined,
    claim_eligibility: undefined,
    result_revision: {
      series_id: "model-rd",
      version: 1,
      supersedes: null,
      change_summary: "Initial published result.",
      is_latest: false,
      latest_submission_id: submissionId,
      version_count: 2,
    },
  };
  api.state.revisionRows = new Map([["Example", [previousRow, row]]]);
  api.state.dataset = "Example";
  api.state.split = "Full";
  api.state.resultId = submissionId;
  api.state.feedVerified = true;
  api.state.loadedFeedSha256 = feedSha256;
  api.state.loadedManifestSha256 = "9".repeat(64);
  api.state.manifestPinVerified = true;
  api.state.releaseMismatch = false;
  api.state.groundTruthManifestProvenance = {
    release_id: "ground-truth-2026-07",
    sha256: groundTruthSha256,
  };
  api.state.claimsIndexProvenance = { status: "verified", sha256: "1".repeat(64) };
  api.state.claimRecords = new Map([
    [
      `${submissionId}|example|full`,
      {
        status: "verified",
        sha256: "2".repeat(64),
        url: claimRecordUrl,
        data: { claim_record_url: claimRecordUrl, result_permalink: resultPermalink },
      },
    ],
  ]);
  const validationUrl = `${assetBaseUrl}${validation.evidence_path}`;
  api.state.validationEvidenceChecks = new Map([[validationUrl, { status: "verified", sha256: validationSha256 }]]);

  const rankedRow = api.rowsForActiveSplit()[0];
  assert.equal(rankedRow._ranking.source, "verified_generated_release");
  const eligibility = api.claimEligibility(rankedRow);
  assert.equal(eligibility.academic_citation, true);
  assert.equal(eligibility.promotion, true);
  assert.equal(eligibility.browser_verification.passed, true);
  const missingArtifactAvailability = api.reproducibilityArtifactAvailability(rankedRow);
  assert.equal(missingArtifactAvailability.code, "not_supplied");
  assert.equal(missingArtifactAvailability.model, "not_supplied");
  assert.equal(missingArtifactAvailability.environment, "not_supplied");
  assert.equal(missingArtifactAvailability.documentation, "not_supplied");
  assert.equal(
    api.claimEligibility(rankedRow).academic_citation,
    true,
    "missing optional code, model, and environment artifacts must not gate citation"
  );
  assert.equal(api.claimEligibility(rankedRow).promotion, true, "missing optional code, model, and environment artifacts must not gate promotion");
  assert.equal(api.versionsForRow(rankedRow).length, 2);
  assert.equal(api.rowRanking(previousRow), null, "superseded versions must not receive a current release rank");
  assert.equal(api.claimEligibility(previousRow).academic_citation, false);
  api.openDetails(previousRow, false);
  const previousVersionDetails = elements.get("details-dialog-body").innerHTML;
  assert.match(previousVersionDetails, /Not ranked — superseded version/);
  assert.match(previousVersionDetails, /Initial published result/);
  assert.match(previousVersionDetails, /data-result-revision="model-rd-v2"/);
  api.openDetails(rankedRow, false);
  const missingArtifactDetails = elements.get("details-dialog-body").innerHTML;
  assert.match(missingArtifactDetails, /Code artifact availability<\/dt><dd>Not supplied \(optional\)/);
  assert.match(missingArtifactDetails, /Model artifact availability<\/dt><dd>Not supplied \(optional\)/);
  assert.match(missingArtifactDetails, /Environment artifact availability<\/dt><dd>Not supplied \(optional\)/);
  assert.match(missingArtifactDetails, /Their absence does not affect accuracy rank, academic-citation eligibility, or promotion eligibility/);
  assert.match(missingArtifactDetails, /Detailed methodology was not recorded under this result's schema/);

  const rowWithPrototypeMethodology = {
    ...rankedRow,
    methodology: {
      format: "fluidsbench-method-v1",
      record_kind: "prototype_fixture",
      record_note: "Fixture only <not author-verified>.",
      architecture: {
        description: "A compact graph surrogate used to exercise the leaderboard interface.",
        total_parameter_count: 1250000,
        parameter_count_basis: "rounded_from_reported_millions",
        submitter_trainable_parameter_count: 0,
        components: [
          {
            id: "prototype-surrogate",
            family: "Graph neural network",
            role: "Surface-field predictor.",
            description: "Aggregate component; internal layers were not recorded.",
            parameter_count: 1250000,
          },
        ],
        key_hyperparameters: [
          {
            id: "reported-variant",
            component_ids: ["prototype-surrogate"],
            name: "reported_model_variant",
            value: "GraphNet",
            description: "Only the displayed model family was retained.",
          },
        ],
        input_features: [
          {
            id: "surface-coordinates",
            component_ids: ["prototype-surrogate"],
            name: "surface_coordinates",
            domain: "surface",
            component_count: 3,
            description: "Three-dimensional surface coordinates.",
          },
        ],
        predicted_fields: [
          {
            field_id: "surface.p",
            domain: "surface",
            component_count: 1,
            component_ids: ["prototype-surrogate"],
            production: "direct_model_output",
            description: "Surface pressure fixture output.",
          },
        ],
      },
      data_handling: {
        normalization: "Not recorded for this prototype fixture.",
        preprocessing: "Not recorded for this prototype fixture.",
        sampling: "Not recorded for this prototype fixture.",
      },
      training: {
        stages: [
          {
            id: "prototype-training-not-recorded",
            status: "prototype_not_recorded",
            component_ids: ["prototype-surrogate"],
            description: "No executable training run accompanies this fixture.",
          },
        ],
      },
      checkpoints: [],
      inference_compute: {
        status: "not_measured",
        reason: "No retained model checkpoint is associated with this fixture.",
      },
    },
  };
  api.openDetails(rowWithPrototypeMethodology, false);
  const prototypeMethodologyDetails = elements.get("details-dialog-body").innerHTML;
  assert.match(prototypeMethodologyDetails, /Prototype fixture metadata — not author-verified/);
  assert.match(prototypeMethodologyDetails, /Fixture only &lt;not author-verified&gt;\./);
  assert.match(prototypeMethodologyDetails, /1,250,000/);
  assert.match(prototypeMethodologyDetails, /surface\.p/);
  assert.match(prototypeMethodologyDetails, /No retained model checkpoint is associated with this methodology record/);
  assert.match(prototypeMethodologyDetails, /Reason not measured<\/dt><dd>No retained model checkpoint is associated with this fixture/);

  const citation = api.citationValues();
  assert.match(citation.plain, /exact data release release-2026-07/);
  assert.match(citation.plain, /release manifest SHA-256 9999/);
  assert.match(citation.bibtex, /author = \{\{FluidsBench contributors\}\}/);
  assert.match(citation.bibtex, /R\\&D\\_v2/);
  assert.match(citation.promotion, /rank 1 of 1/);
  assert.match(citation.promotion, /did not run the model/);
  assert.match(citation.promotion, /did not recompute base metrics/);

  const provenance = api.exportProvenance(1);
  const exportColumns = api.exportMetadataColumns(provenance);
  const columnNames = new Set(exportColumns.map(([name]) => name));
  [
    "release_id",
    "leaderboard_manifest_sha256",
    "leaderboard_manifest_pin_verified",
    "rank",
    "ranking_metric_id",
    "ranking_scope_release_id",
    "ranking_scope_dataset_id",
    "ranking_scope_split_id",
    "declared_academic_citation_eligible",
    "declared_promotion_eligible",
    "browser_verification_status",
    "claim_record_url",
    "scoring_support_release_id",
    "scoring_support_manifest_sha256",
    "discretization_sha256",
    "case_metrics_sha256",
    "prediction_data_status",
    "prediction_artifact_check_status",
    "prediction_metric_recomputation",
    "reproducibility_code_artifact_availability",
    "reproducibility_model_artifact_availability",
    "reproducibility_environment_artifact_availability",
    "reproducibility_artifact_documentation_availability",
    "methodology_format",
    "methodology_record_kind",
    "methodology_total_parameter_count",
    "methodology_json",
  ].forEach((name) => assert.equal(columnNames.has(name), true, `${name} must be present in CSV exports`));
  const exportValues = new Map(exportColumns.map(([name, value]) => [name, value(rankedRow)]));
  assert.equal(exportValues.get("prediction_artifact_check_record_file"), `submissions/example/${submissionId}/prediction-artifact-checks.json`);
  assert.equal(exportValues.get("prediction_artifact_check_record_sha256"), "0".repeat(64));
  assert.equal(exportValues.get("reproducibility_code_artifact_availability"), "not_supplied");
  assert.equal(exportValues.get("reproducibility_model_artifact_availability"), "not_supplied");
  assert.equal(exportValues.get("reproducibility_environment_artifact_availability"), "not_supplied");
  assert.equal(exportValues.get("reproducibility_artifact_documentation_availability"), "not_supplied");
  assert.equal(exportValues.get("reproducibility_code_repository"), undefined);
  assert.equal(exportValues.get("model_artifact_url"), undefined);
  assert.equal(exportValues.get("environment_url"), undefined);
  const exportedRow = api.sourceSubmission(rankedRow);
  assert.equal(exportedRow.ranking.rank, 1);
  assert.equal(exportedRow.claim_eligibility.academic_citation, true);
  assert.equal(exportedRow.browser_verification.passed, true);
  assert.equal(exportedRow.copy_readiness.promotion, true);
  assert.equal(exportedRow.claim_record.url, claimRecordUrl);
  assert.equal(exportedRow.spatial_provenance.scoring_support.release_id, "example-scoring-v1");
  assert.equal(exportedRow.spatial_provenance.discretization.sha256, "7".repeat(64));
  assert.equal(exportedRow.spatial_provenance.discretization.cases_file, "discretization/cases.jsonl");
  assert.equal(exportedRow.spatial_provenance.discretization.cases_sha256, "3".repeat(64));
  assert.equal(exportedRow.prediction_evidence.availability.label, "Complete · 1/1");
  assert.equal(exportedRow.prediction_evidence.artifact_check.display_status.label, "Format checked");
  assert.equal(exportedRow.prediction_evidence.metric_recomputation.label, "Not performed");
  assert.equal(exportedRow.prediction_evidence.maintainer_checks.file, `submissions/example/${submissionId}/prediction-artifact-checks.json`);
  assert.equal(exportedRow.prediction_evidence.maintainer_checks.sha256, "0".repeat(64));
  assert.equal(exportedRow.reproducibility_artifact_availability.code, "not_supplied");
  assert.equal(exportedRow.reproducibility_artifact_availability.model, "not_supplied");
  assert.equal(exportedRow.reproducibility_artifact_availability.environment, "not_supplied");
  assert.equal(exportedRow.reproducibility_artifact_availability.documentation, "not_supplied");
  assert.equal(api.claimEligibility(rankedRow).academic_citation, true, "optional prediction metadata must not gate citation");
  assert.equal(api.claimEligibility(rankedRow).promotion, true, "optional prediction metadata must not gate promotion");

  row.reproducibility.code = {
    repository_url: "https://github.com/example/model",
    commit: "a".repeat(40),
    license_spdx: "Apache-2.0",
  };
  row.reproducibility.model_artifact = {
    url: "https://huggingface.co/example/model",
    sha256: "a".repeat(64),
    license_spdx: "Apache-2.0",
  };
  row.reproducibility.environment = {
    kind: "lockfile",
    url: "https://github.com/example/model/blob/main/conda-lock.yml",
    sha256: "b".repeat(64),
  };
  row.reproducibility.artifact_documentation_url = "https://github.com/example/model/blob/main/README.md";
  const rowWithArtifacts = api.rowsForActiveSplit()[0];
  const providedArtifactAvailability = api.reproducibilityArtifactAvailability(rowWithArtifacts);
  assert.equal(providedArtifactAvailability.code, "provided");
  assert.equal(providedArtifactAvailability.model, "provided");
  assert.equal(providedArtifactAvailability.environment, "provided");
  assert.equal(providedArtifactAvailability.documentation, "provided");
  assert.equal(api.claimEligibility(rowWithArtifacts).academic_citation, true, "provided optional artifacts must not change citation eligibility");
  assert.equal(api.claimEligibility(rowWithArtifacts).promotion, true, "provided optional artifacts must not change promotion eligibility");
  const providedExportValues = new Map(exportColumns.map(([name, value]) => [name, value(rowWithArtifacts)]));
  assert.equal(providedExportValues.get("reproducibility_code_artifact_availability"), "provided");
  assert.equal(providedExportValues.get("reproducibility_code_repository"), "https://github.com/example/model");
  assert.equal(providedExportValues.get("reproducibility_model_artifact_availability"), "provided");
  assert.equal(providedExportValues.get("model_artifact_url"), "https://huggingface.co/example/model");
  assert.equal(providedExportValues.get("reproducibility_environment_artifact_availability"), "provided");
  assert.equal(providedExportValues.get("environment_url"), "https://github.com/example/model/blob/main/conda-lock.yml");
  assert.equal(providedExportValues.get("reproducibility_artifact_documentation_availability"), "provided");
  assert.equal(providedExportValues.get("artifact_documentation_url"), "https://github.com/example/model/blob/main/README.md");
  const providedExportedRow = api.sourceSubmission(rowWithArtifacts);
  assert.equal(providedExportedRow.reproducibility_artifact_availability.code, "provided");
  assert.equal(providedExportedRow.reproducibility.code.repository_url, "https://github.com/example/model");
  assert.equal(providedExportedRow.reproducibility.model_artifact.url, "https://huggingface.co/example/model");
  assert.equal(providedExportedRow.reproducibility.environment.url, "https://github.com/example/model/blob/main/conda-lock.yml");
  api.openDetails(rowWithArtifacts, false);
  const providedArtifactDetails = elements.get("details-dialog-body").innerHTML;
  assert.match(providedArtifactDetails, /Code artifact availability<\/dt><dd>Provided/);
  assert.match(providedArtifactDetails, /Model artifact availability<\/dt><dd>Provided/);
  assert.match(providedArtifactDetails, /Environment artifact availability<\/dt><dd>Provided/);
  assert.match(providedArtifactDetails, /Code repository \(optional\)/);
  assert.match(providedArtifactDetails, /Model artifact \(optional\)/);
  assert.match(providedArtifactDetails, /Environment artifact \(optional\)/);
  delete row.reproducibility.code;
  delete row.reproducibility.model_artifact;
  delete row.reproducibility.environment;
  delete row.reproducibility.artifact_documentation_url;

  row.prediction_artifact_status.checks[0].status = "metrics_recomputed";
  row.prediction_artifact_status.checks[0].metric_recomputation = "performed";
  row.prediction_artifact_status.checks[0].recomputed_case_count = 1;
  const recomputedCitation = api.citationValues();
  assert.match(recomputedCitation.promotion, /recomputed the complete evaluation\/test split metrics/);
  assert.doesNotMatch(recomputedCitation.promotion, /did not recompute base metrics/);

  row.schema_version = "3.0";
  row.reproducibility.contract_version = "open-reproducibility-3.0";
  validation.schema_version = "3.0";
  validation.contract_version = "open-reproducibility-3.0";
  validation.scoring_support_release_id = "example-scoring-v1";
  validation.scoring_support_manifest_sha256 = "6".repeat(64);
  validation.discretization_sha256 = "7".repeat(64);
  validation.case_metrics_sha256 = "8".repeat(64);
  api.state.manifest.data_release.reproducibility_contract_version = "open-reproducibility-3.0";
  api.state.manifest.datasets[0].scoring_support = {
    status: "official",
    submissions_open: false,
    closed_reason: "This immutable release is no longer accepting submissions.",
    owner_approval: {
      approved_by: "Dataset owner",
      approved_at: "2026-07-20T00:00:00Z",
      pull_request_url: "https://github.com/example/repository/pull/1",
    },
    ...row.scoring_support,
  };
  row.prediction_artifact_status.checks[0].status = "failed";
  row.prediction_artifact_status.checks[0].metric_recomputation = "not_performed";
  row.prediction_artifact_status.checks[0].recomputed_case_count = 0;
  const v3RankedRow = api.rowsForActiveSplit()[0];
  assert.equal(api.claimEligibility(v3RankedRow).academic_citation, true, "approved schema-v3 results remain citable after submissions close");
  assert.equal(api.claimEligibility(v3RankedRow).promotion, true, "optional prediction-check failure must not gate promotion");
  assert.equal(api.reproducibilityArtifactAvailability(v3RankedRow).code, "not_supplied");
  assert.equal(
    api.claimEligibility(v3RankedRow).academic_citation,
    true,
    "schema-v3 citations must not require optional code, model, or environment artifacts"
  );
  assert.equal(
    api.claimEligibility(v3RankedRow).promotion,
    true,
    "schema-v3 promotions must not require optional code, model, or environment artifacts"
  );
  const ownerApproval = api.state.manifest.datasets[0].scoring_support.owner_approval;
  delete api.state.manifest.datasets[0].scoring_support.owner_approval;
  assert.equal(api.claimEligibility(v3RankedRow).academic_citation, false, "schema-v3 claims require the frozen dataset-owner approval");
  api.state.manifest.datasets[0].scoring_support.owner_approval = ownerApproval;
  api.state.manifest.datasets[0].scoring_support.status = "owner_review_required";
  assert.equal(api.claimEligibility(v3RankedRow).academic_citation, false, "schema-v3 claims require official scoring support in the frozen release");
  api.state.manifest.datasets[0].scoring_support.status = "official";

  api.renderReleaseMetadata();
  assert.equal(elements.get("open-citation-dialog").disabled, false);
  assert.equal(elements.get("leaderboard-claim-eligibility").hidden, true);
  validation.status = "pending";
  api.renderReleaseMetadata();
  assert.equal(elements.get("open-citation-dialog").disabled, true);
  assert.equal(elements.get("leaderboard-claim-eligibility").hidden, false);
  assert.match(elements.get("leaderboard-claim-eligibility").textContent, /browser verification has not passed/);
  assert.match(elements.get("leaderboard-claim-eligibility").textContent, /submitted-data-only contract/);
}

function verifyPredictionEvidenceLabels() {
  const empty = { prediction_artifacts: [] };
  assert.equal(api.predictionAvailability(empty).label, "Not shared");
  assert.equal(api.predictionArtifactStatus(empty).label, "Not applicable");
  assert.equal(api.predictionMetricRecomputation(empty).label, "Not performed");

  const examples = {
    prediction_artifacts: [
      {
        artifact_id: "examples",
        kind: "scored_predictions",
        coverage: { kind: "example_cases", case_count: 3, expected_case_count: 50 },
      },
    ],
    prediction_artifact_status: {
      sharing: "declared",
      declared_artifact_count: 1,
      maintainer_check_status: "recorded",
      checked_artifact_count: 1,
      checks: [
        {
          artifact_id: "examples",
          status: "accessible",
          checked_case_count: 3,
          recomputed_case_count: 3,
          expected_case_count: 50,
          metric_recomputation: "partial",
        },
      ],
    },
  };
  assert.equal(api.predictionAvailability(examples).label, "Examples · 3/50");
  assert.equal(api.predictionArtifactStatus(examples).label, "Accessible");
  assert.equal(api.predictionMetricRecomputation(examples).label, "Example cases recomputed · 3/50");

  examples.prediction_artifact_status.checks[0].status = "failed";
  examples.prediction_artifact_status.checks[0].metric_recomputation = "not_performed";
  examples.prediction_artifact_status.checks[0].recomputed_case_count = 0;
  assert.equal(api.predictionArtifactStatus(examples).label, "Check failed");
  assert.equal(api.predictionMetricRecomputation(examples).label, "Not performed");

  const legacy = {
    ...examples,
    prediction_artifact_status: undefined,
    prediction_artifact_checks: [
      {
        artifact_id: "examples",
        status: "format_checked",
        checked_case_count: 3,
        recomputed_case_count: 0,
        expected_case_count: 50,
        metric_recomputation: "not_performed",
      },
    ],
  };
  assert.equal(api.predictionArtifactStatus(legacy).label, "Format checked");

  const multiple = {
    prediction_artifacts: [
      {
        artifact_id: "primary-complete",
        kind: "scored_predictions",
        coverage: { kind: "complete_split", case_count: 50, expected_case_count: 50 },
      },
      {
        artifact_id: "secondary-examples",
        kind: "direct_model_outputs",
        coverage: { kind: "example_cases", case_count: 3, expected_case_count: 50 },
      },
    ],
    prediction_artifact_status: {
      checks: [
        {
          artifact_id: "secondary-examples",
          status: "metrics_recomputed",
          checked_case_count: 3,
          recomputed_case_count: 3,
          expected_case_count: 50,
          metric_recomputation: "partial",
        },
      ],
    },
  };
  assert.equal(api.predictionAvailability(multiple).label, "Complete · 50/50");
  assert.equal(api.predictionArtifactStatus(multiple).label, "Not checked");
  assert.equal(api.predictionMetricRecomputation(multiple).label, "Not performed");
}

function verifyDatasetSubmissionAvailability() {
  api.state.manifest = {
    datasets: [
      {
        name: "Pending",
        slug: "pending",
        scoring_support: {
          status: "owner_review_required",
          submissions_open: false,
          closed_reason: "Dataset-owner scoring-support approval is pending",
        },
      },
    ],
  };
  api.state.dataset = "Pending";
  api.renderSubmissionAvailability();
  assert.equal(elements.get("open-submission-repo").disabled, true);
  assert.equal(elements.get("open-submission-repo").hidden, true);
  assert.equal(elements.get("submission-status").textContent, "Submissions closed");

  api.state.manifest.datasets[0].scoring_support = {
    status: "official",
    release_id: "pending-scoring-v1",
    submissions_open: true,
  };
  api.renderSubmissionAvailability();
  assert.equal(elements.get("open-submission-repo").disabled, false);
  assert.equal(elements.get("open-submission-repo").hidden, false);
  assert.equal(elements.get("submission-status").textContent, "Submissions open");
  assert.equal(
    api.scoringSupportSummary({ schema_version: "2.0" }).release_id,
    undefined,
    "historical rows must not inherit the active dataset scoring support"
  );
}

async function verifyHiLiftRegionalReport() {
  api.state.manifest = manifest;
  api.state.regionalReports.clear();
  api.state.regionalReportPromises.clear();
  const feedIndex = feed.findIndex((entry) => entry.submission_id === "hiliftaeroml-transolver-full360-candidate-v1");
  assert.notEqual(feedIndex, -1, "the retained HiLiftAeroML Full360 result must be present");
  const row = api.normalizeRow(feed[feedIndex], feedIndex);
  const binding = api.regionalBinding(row);
  assert.ok(binding, "the retained HiLiftAeroML regional binding must be accepted");
  const report = await api.ensureRegionalReport(row);
  assert.equal(report.case_count, 360);
  assert.equal(report.reconstruction.status, "pass");
  assert.equal(report.reconstruction.checked_field_count, 12);

  const surfacePressure = api.regionalFieldsForDataset("hiliftaeroml").surface_pressure;
  const surfaceReport = api.regionalFieldReport(report, surfacePressure);
  assert.equal(surfaceReport.regions.length, 4);
  assert.equal(api.regionalRules(report, surfacePressure)[0].region_id, "nacelle_installation_envelope_proxy");
  assert.ok(surfaceReport.regions.every((region) => Number.isFinite(api.regionalPooled(region, "physical").relative_l2_percent)));
  assert.ok(Math.abs(surfaceReport.regions.reduce((sum, region) => sum + api.regionalErrorShare(region, "physical"), 0) - 100) < 1e-6);

  const volumeVelocity = api.regionalFieldsForDataset("hiliftaeroml").volume_velocity;
  const volumeReport = api.regionalFieldReport(report, volumeVelocity);
  assert.equal(volumeReport.regions.length, 4);
  assert.equal(api.regionalPrimaryWeighting(volumeReport, volumeVelocity), "equal_entity");
  assert.ok(volumeReport.regions.every((region) => Number.isFinite(api.regionalPrimaryMetricValue(region, "equal_entity", volumeVelocity))));
  assert.ok(volumeReport.regions.every((region) => Number.isFinite(api.regionalPooled(region, "equal_entity").r2)));

  const volumePressure = api.regionalFieldsForDataset("hiliftaeroml").volume_pressure;
  const pressureReport = api.regionalFieldReport(report, volumePressure);
  const farfieldPressure = pressureReport.regions.find((region) => region.region_id === "farfield_and_remaining");
  assert.ok(farfieldPressure.relative_l2_percent > 100);
  assert.ok(api.regionalPrimaryMetricValue(farfieldPressure, "equal_entity", volumePressure) < 4);
  assert.ok(farfieldPressure.r2 < 0);

  const wrongHashRow = {
    ...row,
    id: `${row.id}-wrong-hash`,
    regional_diagnostics: { ...binding, sha256: "c".repeat(64) },
  };
  await assert.rejects(api.ensureRegionalReport(wrongHashRow), /checksum does not match/);
}

async function verifyHiLiftCompactProfileOverlay() {
  const groundTruthManifestPath = path.join(root, "assets/data/profile-ground-truth/manifest.json");
  const groundTruthManifest = JSON.parse(fs.readFileSync(groundTruthManifestPath, "utf8"));
  api.state.manifest = {
    data_release: {
      status: "prototype_dummy_data",
      profile_ground_truth: {
        release_id: groundTruthManifest.data_release.id,
        manifest_url: "https://example.test/profile-ground-truth/manifest.json",
        manifest_sha256: sha256File(groundTruthManifestPath),
      },
    },
  };
  api.state.groundTruthManifest = null;
  api.state.groundTruthManifestProvenance = null;
  api.state.groundTruthIndexes.clear();

  const truthContext = await api.groundTruthIndex("HiLiftAeroML", "Full");
  const caseId = truthContext.index.case_ids[0];
  const truthMetadata = await api.indexedProfileCase(truthContext, caseId, api.state.groundTruthChunks, "HiLiftAeroML ground truth");
  const truth = await api.materializeHiLiftCompactTruth(truthMetadata, "HiLiftAeroML ground truth");
  assert.equal(truth.series.length, 15);
  assert.equal(truth._fluidsbenchHiLiftCompactTruth, true);
  assert.match(truth._fluidsbenchProvenance.artifact_url, /plot-profile-truth\.npz$/);

  const aoa4Context = await api.groundTruthIndex("HiLiftAeroML", "AoA 4");
  assert.equal(aoa4Context.caseSetId, "caseset-7a743a20b3bd");
  assert.equal(aoa4Context.index.case_count, 36);
  const aoa4CaseId = aoa4Context.index.case_ids[0];
  const aoa4Metadata = await api.indexedProfileCase(aoa4Context, aoa4CaseId, api.state.groundTruthChunks, "HiLiftAeroML AoA 4 ground truth");
  const aoa4Truth = await api.materializeHiLiftCompactTruth(aoa4Metadata, "HiLiftAeroML AoA 4 ground truth");
  assert.equal(aoa4Truth.series.length, 15);
  assert.equal(aoa4Truth._fluidsbenchHiLiftCompactTruth, true);

  const expectedPreviewSplits = new Map([
    ["full", ["Full", "caseset-ac791749e527", 360]],
    ["scarce", ["Scarce", "caseset-ac791749e527", 360]],
    ["single_aoa_4", ["AoA 4", "caseset-7a743a20b3bd", 36]],
    ["single_aoa_12", ["AoA 12", "caseset-02fc12ff3494", 36]],
    ["single_aoa_22", ["AoA 22", "caseset-85ecccd9ccda", 36]],
    ["geometry", ["Geometry", "caseset-53990ea68fa6", 360]],
    ["geometry_scarce", ["Geometry scarce", "caseset-53990ea68fa6", 360]],
    ["geometry_super_scarce", ["Geometry super scarce", "caseset-53990ea68fa6", 360]],
    ["super_scarce", ["Super scarce", "caseset-ac791749e527", 360]],
    ["aoa", ["AoA extrapolation", "caseset-29693354ed8a", 900]],
    ["deflection", ["Deflection", "caseset-c0ecb14de138", 360]],
    ["stall", ["Stall", "caseset-804491c8956e", 723]],
  ]);
  const expectedRowsPerSplit = new Map(
    [...expectedPreviewSplits].map(([splitId]) => [
      splitId,
      splitId === "scarce" ? 1 : 2,
    ])
  );
  const previewRows = feed.filter((entry) => entry.dataset_id === "hiliftaeroml");
  assert.equal(
    previewRows.length,
    [...expectedRowsPerSplit.values()].reduce((sum, count) => sum + count, 0),
    "all 23 retained Transolver and GeoTransolver HiLiftAeroML previews must be present"
  );
  for (const [splitId, expectedCount] of expectedRowsPerSplit) {
    assert.equal(
      previewRows.filter((row) => row.split_id === splitId).length,
      expectedCount,
      `unexpected HiLiftAeroML preview count for ${splitId}`
    );
  }
  for (const row of previewRows) {
    const expected = expectedPreviewSplits.get(row.split_id);
    assert.ok(expected, `unexpected HiLiftAeroML preview split ${row.split_id}`);
    const [splitLabel, caseSetId, caseCount] = expected;
    assert.equal(row.split, splitLabel);
    assert.equal(row.case_set_id, caseSetId);
    assert.equal(row.profile_data?.case_count, caseCount);

    const splitTruthContext = await api.groundTruthIndex("HiLiftAeroML", splitLabel);
    assert.equal(splitTruthContext.caseSetId, caseSetId);
    const predictionIndexRelativeForSplit = row.profile_data.index_file;
    const predictionIndexPathForSplit = path.join(submissionRoot, predictionIndexRelativeForSplit);
    const predictionIndexForSplit = JSON.parse(fs.readFileSync(predictionIndexPathForSplit, "utf8"));
    assert.equal(predictionIndexForSplit.submission_id, row.submission_id);
    assert.equal(predictionIndexForSplit.split_id, row.split_id);
    assert.equal(predictionIndexForSplit.case_set_id, caseSetId);
    assert.equal(predictionIndexForSplit.case_count, caseCount);
    assert.equal(row.profile_data.index_sha256, sha256File(predictionIndexPathForSplit));

    const splitCaseId = predictionIndexForSplit.chunks[0].case_ids[0];
    const splitTruthMetadata = await api.indexedProfileCase(
      splitTruthContext,
      splitCaseId,
      api.state.groundTruthChunks,
      `HiLiftAeroML ${splitLabel} ground truth`
    );
    const splitTruth = await api.materializeHiLiftCompactTruth(
      splitTruthMetadata,
      `HiLiftAeroML ${splitLabel} ground truth`
    );
    const splitPredictionContext = {
      index: predictionIndexForSplit,
      indexUrl: `https://example.test/assets/${predictionIndexRelativeForSplit}`,
      indexSha256: sha256File(predictionIndexPathForSplit),
      caseSetId,
      hiLiftCompactPrediction: true,
    };
    const splitPredictionMetadata = await api.indexedProfileCase(
      splitPredictionContext,
      splitCaseId,
      api.state.profileChunks,
      `HiLiftAeroML ${row.submission_id}`
    );
    const splitPrediction = await api.materializeHiLiftCompactPrediction(
      splitPredictionMetadata,
      splitTruth,
      `HiLiftAeroML ${row.submission_id}`
    );
    assert.equal(splitTruth.series.length, 15);
    assert.equal(splitPrediction.series.length, 15);
    const splitFamily = { id: "", placementMode: "" };
    const splitTruthCp = api.profileSeries(splitTruth, { id: "pressure_profiles" }, "pressure_belt_a", { id: "cp" }, splitFamily);
    const splitPredictionCp = api.profileSeries(splitPrediction, { id: "pressure_profiles" }, "pressure_belt_a", { id: "cp" }, splitFamily);
    const splitTruthVelocity = api.profileSeries(splitTruth, { id: "velocity_profiles" }, "hlpw5_b_2", { id: "velocity_ratio" }, splitFamily);
    const splitPredictionVelocity = api.profileSeries(splitPrediction, { id: "velocity_profiles" }, "hlpw5_b_2", { id: "velocity_ratio" }, splitFamily);
    assert.equal(api.profileSeriesCompatibility(splitTruthCp, splitPredictionCp), true);
    assert.equal(api.profileSeriesCompatibility(splitTruthVelocity, splitPredictionVelocity), true);
  }

  const predictionIndexRelative = "submissions/hiliftaeroml/hiliftaeroml-transolver-full360-candidate-v1/profiles/index.json";
  const predictionIndexPath = path.join(submissionRoot, predictionIndexRelative);
  const predictionIndex = JSON.parse(fs.readFileSync(predictionIndexPath, "utf8"));
  const predictionContext = {
    index: predictionIndex,
    indexUrl: `https://example.test/assets/${predictionIndexRelative}`,
    indexSha256: sha256File(predictionIndexPath),
    caseSetId: "caseset-ac791749e527",
    hiLiftCompactPrediction: true,
  };
  const predictionMetadata = await api.indexedProfileCase(predictionContext, caseId, api.state.profileChunks, "HiLiftAeroML Transolver");
  const prediction = await api.materializeHiLiftCompactPrediction(predictionMetadata, truth, "HiLiftAeroML Transolver");
  assert.equal(prediction.series.length, 15);
  assert.match(prediction._fluidsbenchProvenance.artifact_url, /compact-profile-predictions\.npz$/);

  const family = { id: "", placementMode: "" };
  const cpPanel = { id: "pressure_profiles" };
  const cpQuantity = { id: "cp" };
  const truthCp = api.profileSeries(truth, cpPanel, "pressure_belt_a", cpQuantity, family);
  const predictionCp = api.profileSeries(prediction, cpPanel, "pressure_belt_a", cpQuantity, family);
  assert.ok(truthCp.points.length > 100);
  assert.equal(predictionCp.points.length, truthCp.points.length);
  assert.ok(truthCp.segmentCount > 1);
  assert.equal(api.profileSeriesCompatibility(truthCp, predictionCp), true);
  api.state.manifest.datasets = [{ name: "HiLiftAeroML", slug: "hiliftaeroml" }];
  api.state.dataset = "HiLiftAeroML";
  const cpAxes = api.hiLiftProfileAxisRanges(
    [
      { finitePoints: truthCp.points },
      { finitePoints: predictionCp.points },
    ],
    cpPanel
  );
  assert.equal(cpAxes.x.min, 1050);
  assert.equal(cpAxes.x.max, 1500);
  assert.equal(cpAxes.x.step, 50);
  assert.ok(cpAxes.x.min < cpAxes.x.dataMin);
  assert.ok(cpAxes.x.max > cpAxes.x.dataMax);
  assert.ok(cpAxes.y.min < cpAxes.y.dataMin);
  assert.ok(cpAxes.y.max > cpAxes.y.dataMax);
  assert.ok([...truthCp.points, ...predictionCp.points].every((point) => point.x >= cpAxes.x.min && point.x <= cpAxes.x.max));
  assert.ok([...truthCp.points, ...predictionCp.points].every((point) => point.y >= cpAxes.y.min && point.y <= cpAxes.y.max));

  const velocityPanel = { id: "velocity_profiles" };
  const velocityQuantity = { id: "velocity_ratio" };
  const truthVelocity = api.profileSeries(truth, velocityPanel, "hlpw5_b_2", velocityQuantity, family);
  const predictionVelocity = api.profileSeries(prediction, velocityPanel, "hlpw5_b_2", velocityQuantity, family);
  assert.ok(truthVelocity.points.length <= 801);
  assert.equal(predictionVelocity.points.length, truthVelocity.points.length);
  assert.equal(api.profileSeriesCompatibility(truthVelocity, predictionVelocity), true);
  const velocityAxes = api.hiLiftProfileAxisRanges(
    [
      { finitePoints: truthVelocity.points },
      { finitePoints: predictionVelocity.points },
    ],
    velocityPanel
  );
  assert.equal(velocityAxes.x.min, 0);
  assert.equal(velocityAxes.x.max, 22.5);
  assert.equal(velocityAxes.x.step, 2.5);
  assert.equal(velocityAxes.y.min, 0);
  assert.ok(velocityAxes.x.max > velocityAxes.x.dataMax);
  assert.ok(velocityAxes.y.max > velocityAxes.y.dataMax);

  const mismatched = {
    ...predictionMetadata,
    surface_cp: {
      ...predictionMetadata.surface_cp,
      support_identity_sha256: "0".repeat(64),
    },
  };
  await assert.rejects(api.materializeHiLiftCompactPrediction(mismatched, truth, "tampered HiLift prediction"), /support_identity_sha256 differs/);
}

function verifyHiLiftVelocityStorageDecoder() {
  const values = [0, -0, 0.625, 1, 1.0000001192092896, 16];
  const count = values.length;
  const bitsBuffer = new ArrayBuffer(count * 4);
  const bitsView = new DataView(bitsBuffer);
  values.forEach((value, index) => bitsView.setFloat32(index * 4, value, true));
  const words = values.map((_value, index) => bitsView.getUint32(index * 4, true));
  const deltas = words.map((word, index) =>
    index === 0 ? word : (word - words[index - 1]) >>> 0
  );
  const stored = new Array(count * 4);
  for (let index = 0; index < count; index += 1) {
    for (let lane = 0; lane < 4; lane += 1) {
      stored[lane * count + index] = (deltas[index] >>> (lane * 8)) & 0xff;
    }
  }
  const decoded = api.decodeHiLiftVelocityStorage(stored, count, "test velocity");
  const decodedBuffer = new ArrayBuffer(count * 4);
  const decodedView = new DataView(decodedBuffer);
  decoded.forEach((value, index) => decodedView.setFloat32(index * 4, value, true));
  assert.deepEqual(
    Array.from(decoded, (_value, index) => decodedView.getUint32(index * 4, true)),
    words
  );
  assert.throws(
    () => api.decodeHiLiftVelocityStorage(stored.slice(1), count, "bad velocity"),
    /storage length differs/
  );
}

verifyDrivaerLegacyTruthFailsClosed()
  .then(() => verifyNativeV3CpDisplayCoordinates())
  .then(() => verifyCurrentRun419ProfileFixture())
  .then(() => verifyRetainedNativeRun419Bundle())
  .then(() => verifyHiLiftRegionalReport())
  .then(() => verifyHiLiftVelocityStorageDecoder())
  .then(() => verifyHiLiftCompactProfileOverlay())
  .then(() => verifyGeneratedClaimRecords())
  .then(() => {
    verifyPredictionEvidenceLabels();
    verifyDatasetSubmissionAvailability();
    verifyOfficialAcademicHappyPath();
    console.log("leaderboard claim UI checks passed");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
