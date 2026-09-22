/* Explanations only: recorded scores and ranking never use these calculations. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FluidsBenchScores = api;
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";

  const numeric = (value) => typeof value === "number" && Number.isFinite(value);
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function contract(dataset = {}) {
    const declaration = dataset.overall_score_composite || {};
    const result = {
      available: false,
      reason: "This release does not publish an overall-score formula for this dataset.",
      metricId: declaration.metric_id || "overall_score",
      tolerance: numeric(declaration.tolerance) && declaration.tolerance >= 0 ? declaration.tolerance : 1e-6,
      components: [],
      groups: [],
      surfaceOnlyPolicy: declaration.surface_only_policy || null,
    };
    if (declaration.operation !== "weighted_component_scores" || !Array.isArray(declaration.components) || !declaration.components.length)
      return result;
    result.components = declaration.components.map((item) => ({ ...item }));
    if (declaration.status && declaration.status !== "active") {
      result.reason = "The overall-score formula is pending in this release.";
      return result;
    }
    const ids = new Set();
    let weightSum = 0;
    for (const item of result.components) {
      if (typeof item.metric_id !== "string" || !item.metric_id || ids.has(item.metric_id) || !numeric(item.weight) || item.weight < 0) {
        result.reason = "The published component IDs or weights are invalid.";
        return result;
      }
      ids.add(item.metric_id);
      weightSum += item.weight;
      if (item.transform === "bounded_error") {
        if (!numeric(item.cap) || item.cap <= 0) {
          result.reason = "An error cap is missing or invalid in this release.";
          return result;
        }
      } else if (item.transform === "bounded_quality") {
        if (Object.hasOwn(item, "cap")) {
          result.reason = "A quality component declares an unsupported error cap.";
          return result;
        }
      } else if (item.transform === "physics_null_skill") {
        if (!numeric(item.baseline_error) || item.baseline_error <= 0) {
          result.reason = "The physics-null baseline error has not been published as a positive value.";
          return result;
        }
      } else {
        result.reason = "This release uses a component transform that cannot be explained here yet.";
        return result;
      }
    }
    if (Math.abs(weightSum - 1) > 1e-12) {
      result.reason = "The published weights do not sum to 100%.";
      return result;
    }
    result.available = true;
    result.reason = "";
    const grouping = dataset.component_score_groups;
    if (grouping) {
      const grouped = new Set();
      const groupIds = new Set();
      const groups = Array.isArray(grouping.groups) ? grouping.groups : [];
      let valid = grouping.operation === "normalized_weighted_component_scores" && groups.length > 0;
      for (const group of groups) {
        const members = Array.isArray(group.component_metric_ids) ? group.component_metric_ids : [];
        if (!group.metric_id || groupIds.has(group.metric_id) || !members.length) valid = false;
        groupIds.add(group.metric_id);
        let weight = 0;
        for (const id of members) {
          if (!ids.has(id) || grouped.has(id)) valid = false;
          grouped.add(id);
          weight += result.components.find((item) => item.metric_id === id)?.weight || 0;
        }
        if (weight <= 0) valid = false;
        result.groups.push({ metricId: group.metric_id, weight, componentIds: members.slice() });
      }
      if (!valid || grouped.size !== ids.size) {
        result.groups = [];
        result.groupReason = "Component group totals are unavailable because the published grouping is incomplete.";
      }
    }
    return result;
  }

  function breakdown(dataset, row = {}) {
    const rules = contract(dataset);
    // Use the reported numbers before display rounding; never mutate the row.
    const values = row.metric_values || row.metricValues || {};
    const result = {
      rules,
      components: [],
      total: null,
      recorded: numeric(values[rules.metricId]) ? values[rules.metricId] : null,
      status: "unavailable",
      reason: rules.reason,
      ceiling: null,
    };
    if (!rules.available) return result;
    const fixedZero = new Set();
    if (row.prediction_scope === "surface_only") {
      const policy = rules.surfaceOnlyPolicy;
      if (
        !policy ||
        policy.unavailable_component_score !== 0 ||
        policy.component_weight_renormalization !== false ||
        !Array.isArray(policy.unavailable_component_metric_ids) ||
        policy.unavailable_component_metric_ids.some((id) => !rules.components.some((item) => item.metric_id === id))
      ) {
        result.reason = "A supported surface-only scoring policy is not published in this release.";
        return result;
      }
      policy.unavailable_component_metric_ids.forEach((id) => fixedZero.add(id));
      if (numeric(policy.maximum_overall_score)) result.ceiling = policy.maximum_overall_score;
    }
    result.components = rules.components.map((item) => {
      const raw = numeric(values[item.metric_id]) ? values[item.metric_id] : null;
      let score = null;
      let status = "reported";
      if (fixedZero.has(item.metric_id)) {
        score = 0;
        status = "scope_unavailable";
      } else if (raw === null) status = "missing";
      else if (item.transform === "bounded_error") score = clamp(100 * (1 - raw / item.cap), 0, 100);
      else if (item.transform === "bounded_quality") score = 100 * clamp(raw, 0, 1);
      else if (raw < 0) status = "invalid";
      else score = 100 * (1 - raw / item.baseline_error);
      // Protect the explanation from arithmetic overflow as well as bad inputs.
      if (score !== null && !numeric(score)) {
        score = null;
        status = "invalid";
      }
      return { ...item, raw: status === "scope_unavailable" ? null : raw, score, contribution: score === null ? null : item.weight * score, status };
    });
    if (result.components.some((item) => item.score === null)) {
      result.reason = "A complete total cannot be calculated from the metrics reported in this release.";
      return result;
    }
    result.total = result.components.reduce((sum, item) => sum + item.contribution, 0);
    if (!numeric(result.total)) {
      result.total = null;
      result.reason = "The reported metrics do not produce a finite total.";
      return result;
    }
    result.status = result.recorded === null ? "unreported" : Math.abs(result.total - result.recorded) <= rules.tolerance ? "match" : "mismatch";
    result.reason =
      result.status === "mismatch"
        ? "The reported overall score differs from this calculation. The leaderboard retains the recorded score and rank."
        : result.status === "unreported"
          ? "No overall score was reported for comparison."
          : "Matches the recorded overall score.";
    return result;
  }

  return { contract, breakdown };
});
