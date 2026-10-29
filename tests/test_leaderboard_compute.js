"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { summarize, compareNumbers, accelerator } = require("../assets/js/leaderboard-compute.js");

const inference = {
  status: "measured",
  case_count: 10,
  campaign_wall_time_seconds: 100,
  aggregate_device_time_seconds: 250,
  max_concurrent_device_count: 8,
  hardware: "Test accelerator",
  includes_preprocessing: true,
  includes_mapping: false,
};
const stage = (hours, extra = {}) => ({
  status: "performed_by_submitter",
  run_count: 3,
  compute: { aggregate_device_hours: hours, campaign_wall_time_hours: 5, hardware: "Test accelerator", ...extra },
});
const row = (stages = []) => ({ methodology: { record_kind: "submitter_reported", inference_compute: { ...inference }, training: { stages } } });

test("campaign average uses reported device time, independently of maximum concurrency", () => {
  const result = summarize(row()).inference;
  assert.equal(result.wallSecondsPerCase, 10);
  assert.equal(result.deviceSecondsPerCase, 25);
  assert.notEqual(result.deviceSecondsPerCase, result.wallSecondsPerCase * result.devices);
  assert.equal(result.scope, "Preprocessing + Inference");
});

test("missing, invalid and illustrative timings never become measured zeros", () => {
  for (const value of [null, undefined, "", "25", -1, Infinity, NaN]) {
    const input = row();
    input.methodology.inference_compute.campaign_wall_time_seconds = value;
    assert.equal(summarize(input).inference.wallSecondsPerCase, null);
  }
  for (const count of [0, -1, null, undefined]) {
    const input = row();
    input.methodology.inference_compute.case_count = count;
    assert.equal(summarize(input).inference.wallSecondsPerCase, null);
  }
  const input = row([stage(12)]);
  input.methodology.inference_compute.status = "not_measured";
  assert.equal(summarize(input).inference.deviceSecondsPerCase, null);
  input.methodology.record_kind = "format_example";
  input.methodology.inference_compute.status = "measured";
  assert.equal(summarize(input).inference.wallSecondsPerCase, null);
  assert.equal(summarize(input).training.deviceHours, null);
  assert.equal(summarize({}).inference.wallSecondsPerCase, null);
  assert.equal(summarize({}).training.deviceHours, null);
});

test("training sums stage allocation once and excludes upstream without claiming it is zero", () => {
  const input = row([stage(12), stage(8), { status: "performed_upstream", upstream_reference: "Upstream model" }]);
  const before = JSON.stringify(input);
  const result = summarize(input).training;
  assert.equal(result.deviceHours, 20);
  assert.equal(result.upstreamCount, 1);
  assert.match(result.scope, /upstream excluded/);
  assert.equal(result.hardware, "Test accelerator");
  assert.equal(JSON.stringify(input), before, "display summary must not mutate result or scoring inputs");
});

test("incomplete stages retain known allocation but cannot be plotted as a complete total", () => {
  const result = summarize(row([stage(12), stage(undefined)])).training;
  assert.equal(result.deviceHours, null);
  assert.equal(result.knownDeviceHours, 12);
  assert.equal(result.reportedStageCount, 1);
  assert.equal(result.complete, false);
  assert.equal(summarize(row([stage(12), { status: "prototype_not_recorded" }])).training.deviceHours, null);
  assert.equal(summarize(row([{ status: "performed_upstream" }])).training.deviceHours, null);
});

test("mixed or partially recorded hardware is not silently treated as one accelerator", () => {
  assert.equal(summarize(row([stage(12), stage(8, { hardware: "Different accelerator" })])).training.hardware, "Mixed hardware");
  assert.equal(summarize(row([stage(12), stage(8, { hardware: null })])).training.hardware, null);
});

test("missing values always sort last, even when sorting high to low", () => {
  assert.deepEqual(
    [null, 10, 5, 0].sort((a, b) => compareNumbers(a, b)),
    [0, 5, 10, null]
  );
  assert.deepEqual(
    [null, 10, 5, 0].sort((a, b) => compareNumbers(a, b, true)),
    [10, 5, 0, null]
  );
});

test("GPU descriptions give a count without inventing a model or per-job allocation", () => {
  const result = accelerator({
    hardware: "NVIDIA GPU Slurm nodes; exact accelerator SKU requires owner confirmation",
    max_concurrent_device_count: 40,
  });
  assert.equal(result.label, "GPU model unconfirmed");
  assert.equal(result.devices, 40);
  assert.equal(result.devicesPerJob, null);
  assert.equal(result.model, null);
  assert.equal(accelerator({ hardware: "NVIDIA H200 or H100; not yet confirmed" }).model, null);
  assert.equal(accelerator({}).label, "Not reported");
  assert.equal(accelerator({ max_concurrent_device_count: 1.5 }).devices, null);
});

test("structured identity keeps GPU model, campaign peak and per-job count distinct", () => {
  const result = accelerator({
    accelerator: { type: "gpu", vendor: "NVIDIA", model: "H200" },
    max_concurrent_device_count: 40,
    devices_per_job: 4,
  });
  assert.equal(result.label, "H200");
  assert.equal(result.filterLabel, "NVIDIA H200");
  assert.equal(result.devices, 40);
  assert.equal(result.devicesPerJob, 4);
  assert.equal(accelerator({ accelerator: { type: "gpu", vendor: "AMD", model: "MI300X" } }).label, "MI300X");
});

test("training groups GPU models independently of narrative descriptions and never adds concurrent counts", () => {
  const a = stage(12, { hardware: "First NVIDIA GPU training task", max_concurrent_device_count: 32 });
  const b = stage(8, { hardware: "Second NVIDIA GPU training task", max_concurrent_device_count: 16 });
  const result = summarize(row([a, b])).training.accelerator;
  assert.equal(result.label, "GPU model unconfirmed");
  assert.equal(result.devices, 32);
  assert.equal(result.mixed, false);
  b.compute.max_concurrent_device_count = undefined;
  assert.equal(summarize(row([a, b])).training.accelerator.devices, null);
  a.compute.accelerator = { type: "gpu", vendor: "NVIDIA", model: "H200" };
  b.compute.accelerator = { type: "gpu", vendor: "AMD", model: "MI300X" };
  assert.equal(summarize(row([a, b])).training.accelerator.label, "Mixed / partly reported");
  assert.equal(summarize(row([a, b])).training.accelerator.devices, null);
  a.compute.accelerator.model = null;
  b.compute.accelerator.model = null;
  assert.equal(summarize(row([a, b])).training.accelerator.mixed, true, "different known vendors must remain mixed even without model names");
});

test("mixed, unknown and CPU records do not acquire GPU labels", () => {
  assert.equal(accelerator({ accelerator: { type: "mixed", vendor: null, model: null } }).label, "Mixed accelerators");
  assert.equal(accelerator({ accelerator: { type: "unknown", vendor: null, model: null } }).label, "Device model unconfirmed");
  assert.equal(accelerator({ accelerator: { type: "cpu", vendor: null, model: null } }).label, "CPU model unconfirmed");
  const result = summarize(row([stage(12, { accelerator: { type: "cpu", vendor: "AMD", model: "EPYC 9654" } })])).training.accelerator;
  assert.equal(result.type, "cpu");
  assert.equal(result.label, "EPYC 9654");
});

test("complete-case throughput is the reciprocal of campaign average, never device time", () => {
  const result = summarize(row()).inference;
  assert.equal(result.casesPerSecond, 0.1);
  for (const value of [0, null, -1, Infinity, NaN, "100"]) {
    const input = row();
    input.methodology.inference_compute.campaign_wall_time_seconds = value;
    assert.equal(summarize(input).inference.casesPerSecond, null);
  }
  const input = row();
  input.methodology.inference_compute.case_count = 1.5;
  assert.equal(summarize(input).inference.casesPerSecond, null);
  input.methodology.record_kind = "prototype_fixture";
  assert.equal(summarize(input).inference.casesPerSecond, null);
});

test("complete training totals match the table while markers disclose their measurement basis", () => {
  assert.equal(summarize(row([stage(12)])).training.plotDeviceHours, 12);
  assert.equal(summarize(row([stage(12)])).training.plotPointStyle, "rectRot");
  const measured = stage(12, { measurement_basis: "measured" });
  assert.equal(summarize(row([measured])).training.plotDeviceHours, 12);
  assert.equal(summarize(row([measured])).training.plotPointStyle, "circle");
  for (const basis of [undefined, "estimated", "unknown"]) {
    const result = summarize(row([measured, stage(8, { measurement_basis: basis })])).training;
    assert.equal(result.deviceHours, 20);
    assert.equal(result.plotDeviceHours, result.deviceHours, "chart and table use the same complete reported total");
    assert.equal(result.plotPointStyle, basis === "estimated" ? "triangle" : "rectRot");
  }
  const incomplete = summarize(row([measured, stage(undefined, { measurement_basis: "measured" })])).training;
  assert.equal(incomplete.plotDeviceHours, null);
});

test("GB200 example preserves historical timing and owner-attested hardware", () => {
  const fixture = require("./fixtures/hilift-gb200-compute.json");
  const before = JSON.stringify(fixture);
  const { inference: inf, training: train } = summarize(fixture);
  assert.equal(inf.casesPerSecond, 36 / 14351);
  assert.equal(inf.wallSecondsPerCase, 14351 / 36);
  assert.equal(inf.deviceSecondsPerCase, 53880 / 36);
  assert.equal(inf.accelerator.label, "GB200");
  assert.equal(inf.accelerator.identityBasis, "owner_confirmed");
  assert.equal(inf.accelerator.devicesPerJob, 4);
  assert.equal(inf.devices, 8);
  assert.equal(inf.precision, "FP32");
  assert.equal(inf.protocol, "legacy_reported");
  assert.equal(inf.repetitions, null);
  assert.equal(inf.execution.warmup_cases, null);
  assert.equal(train.measurementBasis, "estimated");
  assert.equal(train.deviceHours, 239.731732 + 265.816752);
  assert.equal(train.plotDeviceHours, train.deviceHours);
  assert.equal(train.plotPointStyle, "triangle");
  assert.equal(JSON.stringify(fixture), before, "compute display cannot mutate source data");
});

test("timing condition filters distinguish protocols, precision and output support", () => {
  const input = row();
  const legacy = summarize(input).inference;
  input.methodology.inference_compute.timing_protocol = "fluidsbench-complete-case-v1";
  input.methodology.inference_compute.execution = { precision: "fp32" };
  const v1 = summarize(input).inference;
  assert.notEqual(v1.conditionsKey, legacy.conditionsKey);
  assert.match(v1.protocolLabel, /declared/);
  input.prediction_scope = "surface_only";
  const surface = summarize(input).inference;
  input.prediction_scope = "surface_and_volume";
  assert.notEqual(summarize(input).inference.conditionsKey, surface.conditionsKey);
  input.methodology.inference_compute.execution.precision = "bf16";
  assert.notEqual(summarize(input).inference.conditionsKey, v1.conditionsKey);
  assert.equal(legacy.precision, "Not reported");
  input.methodology.inference_compute.campaign_runs = [{}, {}, {}];
  assert.equal(summarize(input).inference.repetitions, 3);
  assert.equal(summarize(input).inference.casesPerSecond, 0.1, "repetitions do not multiply unique cases");
});
