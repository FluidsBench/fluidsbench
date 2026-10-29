"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { summarize } = require("../assets/js/leaderboard-compute.js");

// Execute the production chart renderer with DOM/Chart adapters, without
// loading datasets or depending on a canvas implementation in Node.
const source = fs.readFileSync(path.join(__dirname, "../assets/js/leaderboard.js"), "utf8");
const functions = ["computeQuantity", "computeAxisValue", "renderComputeChart"].map((name) => {
  const start = source.indexOf(`  function ${name}(`);
  assert.ok(start >= 0);
  const end = source.indexOf("\n  function ", start + 1);
  assert.ok(end > start);
  return source.slice(start, end);
}).join("\n");

function render(items, mode = "training") {
  const elements = new Map();
  const context = {
    Intl,
    state: { computeMode: mode, computeAxis: "throughput", dataset: "DrivAerNet++", split: "official_test", charts: {} },
    element: (id) => {
      if (!elements.has(id)) elements.set(id, { setAttribute() {} });
      return elements.get(id);
    },
    destroyChart() {},
    dataRelease: () => ({ status: "prototype_dummy_data" }),
    chartTextColor: () => "#222222",
    chartGridColor: () => "#dddddd",
    rowLabel: (row) => row.model,
    Chart: function (canvas, config) { this.config = config; },
  };
  vm.createContext(context);
  vm.runInContext(functions, context);
  context.renderComputeChart(items, "Score", true);
  return { config: context.state.charts.compute?.config, elements };
}

function item(model, hours, basis, selected = false) {
  const row = { model, methodology: { record_kind: "submitter_reported", training: { stages: [{
    status: "performed_by_submitter", compute: { aggregate_device_hours: hours, measurement_basis: basis },
  }] }, inference_compute: { status: "not_measured", reason: "Only a partial interval was recorded." } } };
  return { row, ...summarize(row), score: 80, color: "#0088cc", selected };
}

// These are the three selections in the reported URL, plus the sole measured
// result that previously survived the training-chart filter.
const reportedSelection = () => [
  item("FNO", 0.88, "estimated", true),
  item("Transolver", 8.12, "estimated", true),
  item("Transolver-Large", 20.4, "estimated", true),
  item("TripNet", 45.54, "measured"),
];

test("selected estimated models appear beside the measured result with distinct markers", () => {
  const { config, elements } = render(reportedSelection());
  const dataset = config.data.datasets[0];
  assert.deepEqual(Array.from(dataset.data, p => p.x), [0.88, 8.12, 20.4, 45.54]);
  assert.deepEqual(Array.from(dataset.pointStyle), ["triangle", "triangle", "triangle", "circle"]);
  assert.deepEqual(Array.from(dataset.backgroundColor), ["transparent", "transparent", "transparent", "#0088cc"]);
  assert.deepEqual(Array.from(dataset.pointRadius), [8, 8, 8, 5]);
  assert.match(elements.get("compute-chart-summary").textContent, /4 results plotted/);
  assert.match(elements.get("compute-chart-summary").textContent, /Hollow triangles: includes estimates/);
});

test("unspecified basis is plotted as a hollow diamond; incomplete totals and missing scores remain excluded", () => {
  const unknown = item("Historical total", 10, undefined);
  const incomplete = item("Incomplete", undefined, "measured");
  const noScore = { ...item("Missing score", 4, "estimated"), score: null };
  const { config, elements } = render([unknown, incomplete, noScore]);
  assert.equal(config.data.datasets[0].data.length, 1);
  assert.equal(config.data.datasets[0].pointStyle[0], "rectRot");
  assert.equal(config.data.datasets[0].backgroundColor[0], "transparent");
  assert.match(elements.get("compute-chart-summary").textContent, /2 without a complete training total or score/);
});

test("training estimates never fabricate unavailable inference timings", () => {
  const { config, elements } = render(reportedSelection(), "inference");
  assert.equal(config, undefined);
  assert.equal(elements.get("compute-empty").hidden, false);
  assert.match(elements.get("compute-empty").innerHTML, /No measured timings to plot/);
});

test("training empty state explains genuinely missing totals rather than excluding estimates", () => {
  const { config, elements } = render([item("Missing total", undefined, "estimated")]);
  assert.equal(config, undefined);
  assert.match(elements.get("compute-empty").innerHTML, /No complete training totals to plot/);
});
