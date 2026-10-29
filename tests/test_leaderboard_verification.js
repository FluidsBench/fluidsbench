"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { summarize } = require("../assets/js/leaderboard-verification.js");
const trusted = { feedVerified: true, manifestVerified: true, expectedCaseCount: 50 };
const copy = (value) => JSON.parse(JSON.stringify(value));
const result = () => ({
  schema_version: "3.0",
  submission_id: "example-v1",
  dataset_id: "example",
  split_id: "full",
  scoring_support: { release_id: "example-support-v1", manifest_sha256: "e".repeat(64) },
  methodology: { record_kind: "submitter_reported" },
  metric_values: { overall_score: 82.3 },
  ranking: { rank: 1 },
  claim_eligibility: { academic_citation: true, promotion: true },
  prediction_artifacts: [
    {
      artifact_id: "predictions",
      kind: "scored_predictions",
      split_id: "full",
      support_release_id: "example-support-v1",
      support_manifest_sha256: "e".repeat(64),
      coverage: { kind: "complete_split", case_count: 50 },
      revision: "a".repeat(40),
      manifest_sha256: "b".repeat(64),
    },
  ],
  prediction_artifact_status: {
    maintainer_check_status: "recorded",
    check_file: "submissions/example/example-v1/prediction-artifact-checks.json",
    check_sha256: "c".repeat(64),
    checks: [
      {
        artifact_id: "predictions",
        status: "metrics_recomputed",
        metric_recomputation: "performed",
        repository_revision: "a".repeat(40),
        manifest_sha256: "b".repeat(64),
        expected_case_count: 50,
        checked_case_count: 50,
        recomputed_case_count: 50,
        checked_by: "Example maintainer",
        checked_at: "2026-09-23T12:00:00Z",
      },
    ],
  },
});

test("complete maintainer checks produce an optional, scoped badge without changing results", () => {
  const row = result();
  const before = copy(row);
  const badge = summarize(row, trusted);
  assert.equal(badge.label, "Metrics verified");
  assert.equal(badge.caseCount, 50);
  assert.match(badge.description, /shared scored predictions across all 50 test cases/);
  assert.match(badge.description, /exact scope/);
  assert.deepEqual(badge.checks, [{ artifactId: "predictions", checkedBy: "Example maintainer", checkedAt: "2026-09-23T12:00:00Z" }]);
  assert.deepEqual(row, before, "displaying verification must not mutate scores, ranks or eligibility");
  delete row.prediction_artifact_status;
  assert.equal(summarize(row, trusted), null);
  assert.deepEqual(row.metric_values, before.metric_values);
  assert.deepEqual(row.ranking, before.ranking);
  assert.deepEqual(row.claim_eligibility, before.claim_eligibility);
});

test("neither hashes alone, package approval nor a free-text verified claim awards a badge", () => {
  const row = result();
  row.verified = true;
  row.prediction_metric_recomputation = "performed";
  row.approval = { status: "approved" };
  for (const status of ["not_checked", "accessible", "format_checked", "failed"]) {
    row.prediction_artifact_status.checks[0].status = status;
    assert.equal(summarize(row, trusted), null, status);
  }
});

test("partial, mismatched, incomplete and illustrative evidence never receives a blue tick", () => {
  const mutations = [
    (row) => (row.prediction_artifact_status.checks[0].metric_recomputation = "partial"),
    (row) => (row.prediction_artifact_status.checks[0].recomputed_case_count = 49),
    (row) => (row.prediction_artifact_status.checks[0].expected_case_count = 51),
    (row) => (row.prediction_artifacts[0].coverage.kind = "example_cases"),
    (row) => (row.prediction_artifacts[0].coverage.case_count = 49),
    (row) => (row.prediction_artifacts[0].kind = "direct_model_outputs"),
    (row) => (row.prediction_artifacts[0].split_id = "another-split"),
    (row) => (row.prediction_artifacts[0].support_release_id = "another-release"),
    (row) => (row.prediction_artifacts[0].support_manifest_sha256 = "f".repeat(64)),
    (row) => (row.prediction_artifact_status.checks[0].repository_revision = "d".repeat(40)),
    (row) => (row.prediction_artifact_status.checks[0].manifest_sha256 = "d".repeat(64)),
    (row) => (row.prediction_artifact_status.check_file = "submissions/example/another-v1/prediction-artifact-checks.json"),
    (row) => (row.prediction_artifact_status.check_sha256 = null),
    (row) => (row.prediction_artifact_status.checks[0].checked_by = ""),
    (row) => (row.prediction_artifact_status.checks[0].checked_at = "not recorded"),
    (row) => row.prediction_artifact_status.checks.push(copy(row.prediction_artifact_status.checks[0])),
    (row) => row.prediction_artifacts.push({ ...copy(row.prediction_artifacts[0]), artifact_id: "unchecked-surface" }),
    (row) => (row.methodology.record_kind = "prototype_fixture"),
    (row) => (row.record_type = "development_fixture"),
  ];
  mutations.forEach((mutate, index) => {
    const row = result();
    mutate(row);
    assert.equal(summarize(row, trusted), null, `invalid evidence case ${index}`);
  });
});

test("verification requires the pinned feed and the independently declared split count", () => {
  const row = result();
  assert.equal(summarize(row), null);
  for (const changes of [
    { feedVerified: false },
    { manifestVerified: false },
    { expectedCaseCount: null },
    { expectedCaseCount: 51 },
    { expectedCaseCount: "50" },
  ]) {
    assert.equal(summarize(row, { ...trusted, ...changes }), null);
  }
});
