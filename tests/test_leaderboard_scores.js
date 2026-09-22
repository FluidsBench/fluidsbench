"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { contract, breakdown } = require("../assets/js/leaderboard-scores.js");

const dataset = (components, extra = {}) => ({
  overall_score_composite: { metric_id: "overall_score", operation: "weighted_component_scores", components, tolerance: 1e-6, ...extra },
});
const error = (weight = 1, cap = 15) => ({ metric_id: "error", weight, cap, transform: "bounded_error" });
const quality = (weight = 1) => ({ metric_id: "quality", weight, transform: "bounded_quality" });
const row = (values) => ({ metric_values: values });
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-10, `${message}: ${actual} vs ${expected}`);

test("error caps, quality clipping and full-precision contributions", () => {
  for (const [raw, expected] of [
    [0, 100],
    [3, 80],
    [15, 0],
    [30, 0],
    [-1, 100],
  ]) {
    near(breakdown(dataset([error()]), row({ error: raw })).total, expected, "bounded error");
  }
  for (const [raw, expected] of [
    [-0.4, 0],
    [0, 0],
    [0.8, 80],
    [1, 100],
    [1.4, 100],
  ]) {
    near(breakdown(dataset([quality()]), row({ quality: raw })).total, expected, "bounded quality");
  }
  const rules = dataset([error(0.15), quality(0.85)]);
  const input = row({ error: 3, quality: 0.734567891, overall_score: 74.438270735 });
  const before = JSON.stringify(input);
  const result = breakdown(rules, input);
  assert.equal(result.components[0].contribution, 12);
  near(result.total, input.metric_values.overall_score, "unrounded total");
  assert.equal(result.status, "match");
  assert.equal(JSON.stringify(input), before, "explaining a score must not mutate it");
  assert.notEqual(result.total, breakdown(rules, row({ error: 3, quality: 0.735 })).total);
});

test("missing and invalid metrics are never fabricated as zeros", () => {
  for (const value of [null, undefined, "", "3", NaN, Infinity, false]) {
    const result = breakdown(dataset([error()]), row({ error: value, overall_score: 80 }));
    assert.equal(result.status, "unavailable");
    assert.equal(result.components[0].score, null);
    assert.equal(result.total, null);
    assert.equal(result.recorded, 80);
  }
  const result = breakdown(dataset([error()]), row({ error: 3, overall_score: 90 }));
  assert.equal(result.status, "mismatch");
  assert.equal(result.recorded, 90);
  assert.equal(result.total, 80);
  assert.match(result.reason, /retains the recorded score and rank/);
});

test("surface-only policy retains weights and distinguishes unavailable metrics", () => {
  const rules = dataset([error(0.6), quality(0.4)], {
    surface_only_policy: {
      unavailable_component_metric_ids: ["quality"],
      unavailable_component_score: 0,
      component_weight_renormalization: false,
      maximum_overall_score: 60,
    },
  });
  const result = breakdown(rules, { ...row({ error: 0, overall_score: 60 }), prediction_scope: "surface_only" });
  assert.equal(result.total, 60);
  assert.equal(result.ceiling, 60);
  assert.equal(result.components[1].status, "scope_unavailable");
  assert.equal(result.components[1].raw, null);
  assert.equal(result.components[1].contribution, 0);
  assert.equal(result.components[1].weight, 0.4);
  assert.equal(breakdown(rules, row({ error: 0 })).total, null, "ordinary missing data has no fixed-zero exemption");
  assert.equal(breakdown(dataset([error()]), { prediction_scope: "surface_only", ...row({ error: 0 }) }).total, null);
});

test("pending or unsupported rules and absent baselines cannot produce a claimed total", () => {
  assert.equal(contract({}).available, false);
  assert.equal(contract(dataset([error()], { status: "pending" })).available, false);
  assert.equal(contract(dataset([error(0.4)])).available, false);
  assert.equal(contract(dataset([error(0.5), error(0.5)])).available, false);
  assert.equal(contract(dataset([{ ...quality(), cap: 1 }])).available, false);
  for (const baseline_error of [null, 0, -1, "2", Infinity]) {
    assert.equal(contract(dataset([{ metric_id: "error", weight: 1, transform: "physics_null_skill", baseline_error }])).available, false);
  }
  const rules = dataset([{ metric_id: "error", weight: 1, transform: "physics_null_skill", baseline_error: 2 }]);
  assert.equal(breakdown(rules, row({ error: 3 })).total, -50, "physics-null skill is not clipped");
  assert.equal(breakdown(rules, row({ error: -1 })).total, null);
});

test("group weights come from components and invalid partitions are not presented", () => {
  const rules = dataset([error(0.15), quality(0.85)]);
  rules.component_score_groups = {
    operation: "normalized_weighted_component_scores",
    groups: [
      { metric_id: "fields", component_metric_ids: ["error"] },
      { metric_id: "forces", component_metric_ids: ["quality"] },
    ],
  };
  assert.deepEqual(
    contract(rules).groups.map((group) => group.weight),
    [0.15, 0.85]
  );
  rules.component_score_groups.groups[1].component_metric_ids = ["error"];
  assert.equal(contract(rules).groups.length, 0);
  assert.match(contract(rules).groupReason, /incomplete/);
});

const submissionRoot = path.resolve(process.env.FLUIDSBENCH_SUBMISSION_ROOT || path.join(__dirname, "../../fluidsbench-submission"));
test(
  "every loaded result and edge case agrees with the independent Python reference scorer",
  {
    skip: !fs.existsSync(path.join(submissionRoot, "reference/scores.py")) && "Set FLUIDSBENCH_SUBMISSION_ROOT to the pinned submission checkout",
  },
  (t) => {
    const manifest = JSON.parse(fs.readFileSync(path.join(submissionRoot, "leaderboard/manifest.json")));
    const cases = [];
    for (const definition of manifest.datasets) {
      const rows = JSON.parse(fs.readFileSync(path.join(submissionRoot, definition.file)));
      for (const entry of rows) cases.push({ definition, entry, name: entry.submission_id });
    }
    const feedCount = cases.length;
    const drivaer = manifest.datasets.find((item) => item.name === "DrivAerML");
    assert.ok(drivaer, "the pinned release includes the DrivAerML scope policy");
    const excluded = drivaer.overall_score_composite.surface_only_policy.unavailable_component_metric_ids;
    const perfectSurface = Object.fromEntries(
      drivaer.overall_score_composite.components
        .filter((item) => !excluded.includes(item.metric_id))
        .map((item) => [item.metric_id, item.transform === "bounded_quality" ? 1 : 0])
    );
    const surfaceRow = { prediction_scope: "surface_only", ...row({ ...perfectSurface, overall_score: 60 }) };
    near(breakdown(drivaer, surfaceRow).total, 60, "published surface-only ceiling");
    cases.push({ definition: drivaer, entry: surfaceRow, name: "DrivAerML perfect surface-only fixture" });
    for (const raw of [-0.5, 0, 0.456789123456, 1, 1.4, 3, 15, 30]) {
      for (const component of [error(), quality(), { metric_id: "error", weight: 1, transform: "physics_null_skill", baseline_error: 2 }]) {
        if (raw < 0 && component.transform === "physics_null_skill") continue;
        cases.push({ definition: dataset([component]), entry: row({ [component.metric_id]: raw }), name: `${component.transform} ${raw}` });
      }
    }
    const oracleCases = cases.map(({ definition, entry }) => ({
      declaration: definition.overall_score_composite,
      values: entry.metric_values,
      fixedZero:
        entry.prediction_scope === "surface_only" ? definition.overall_score_composite.surface_only_policy.unavailable_component_metric_ids : [],
    }));
    const run = spawnSync("python3", [path.join(__dirname, "score_reference.py"), submissionRoot], {
      input: JSON.stringify(oracleCases),
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    assert.equal(run.status, 0, run.stderr);
    const expected = JSON.parse(run.stdout);
    const mismatches = [];
    const unavailable = [];
    cases.forEach(({ definition, entry, name }, index) => {
      const before = JSON.stringify(entry);
      const actual = breakdown(definition, entry);
      if (expected[index].error) {
        assert.equal(actual.total, null, name);
        unavailable.push(name);
      } else {
        near(actual.total, expected[index].total, name);
        actual.components.forEach((component, j) => near(component.score, expected[index].components[j], `${name} / ${component.metric_id}`));
        if (actual.status === "mismatch") mismatches.push(name);
      }
      assert.equal(JSON.stringify(entry), before, `${name}: result and rank unchanged`);
    });
    t.diagnostic(
      `${feedCount} feed rows checked; existing mismatches: ${mismatches.join(", ") || "none"}; unavailable: ${unavailable.join(", ") || "none"}`
    );
  }
);
