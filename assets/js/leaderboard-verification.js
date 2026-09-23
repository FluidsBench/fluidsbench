(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FluidsBenchVerification = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const digest = /^[a-f0-9]{64}$/;
  const revision = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
  const icon =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12 3 3 6-6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Descriptive only: this must never participate in ranking or eligibility.
  // Use the maintainer records carried by the checksum-verified feed, not the
  // permissive display aliases or a submitter-supplied "verified" flag.
  function summarize(row, { feedVerified = false, manifestVerified = false, expectedCaseCount } = {}) {
    if (!feedVerified || !manifestVerified || !Number.isInteger(expectedCaseCount) || expectedCaseCount < 1) return null;
    if (row?.schema_version !== "3.0" || row.record_type === "development_fixture" || row.methodology?.record_kind !== "submitter_reported")
      return null;
    const status = row.prediction_artifact_status;
    const id = row.submission_id || row.id;
    const checkFile = `submissions/${row.dataset_id}/${id}/prediction-artifact-checks.json`;
    if (status?.maintainer_check_status !== "recorded" || status.check_file !== checkFile || !digest.test(status.check_sha256 || "")) return null;
    const artifacts = (Array.isArray(row.prediction_artifacts) ? row.prediction_artifacts : []).filter(
      (artifact) => artifact?.kind === "scored_predictions"
    );
    const checks = Array.isArray(status.checks) ? status.checks : [];
    if (!artifacts.length || new Set(artifacts.map((artifact) => artifact.artifact_id)).size !== artifacts.length) return null;
    const complete = artifacts.every((artifact) => {
      const matching = checks.filter((check) => check?.artifact_id === artifact.artifact_id);
      if (matching.length !== 1) return false;
      const check = matching[0];
      return (
        artifact.coverage?.kind === "complete_split" &&
        artifact.coverage.case_count === expectedCaseCount &&
        artifact.split_id === row.split_id &&
        typeof row.split_id === "string" &&
        artifact.support_release_id === row.scoring_support?.release_id &&
        typeof artifact.support_release_id === "string" &&
        artifact.support_manifest_sha256 === row.scoring_support?.manifest_sha256 &&
        digest.test(artifact.support_manifest_sha256 || "") &&
        revision.test(artifact.revision || "") &&
        digest.test(artifact.manifest_sha256 || "") &&
        check.repository_revision === artifact.revision &&
        check.manifest_sha256 === artifact.manifest_sha256 &&
        check.status === "metrics_recomputed" &&
        check.metric_recomputation === "performed" &&
        check.expected_case_count === expectedCaseCount &&
        check.checked_case_count === expectedCaseCount &&
        check.recomputed_case_count === expectedCaseCount &&
        typeof check.checked_by === "string" &&
        check.checked_by.trim().length > 0 &&
        typeof check.checked_at === "string" &&
        Number.isFinite(Date.parse(check.checked_at))
      );
    });
    if (!complete) return null;
    return {
      label: "Metrics verified",
      caseCount: expectedCaseCount,
      checkFile,
      tooltip: "Metrics verified: FluidsBench recomputed shared prediction metrics across the complete test split. View check details.",
      description: `FluidsBench recorded metric recomputation from the shared scored predictions across all ${expectedCaseCount.toLocaleString(
        "en-GB"
      )} test cases. See the check record for the exact scope.`,
    };
  }

  return { summarize, icon };
});
