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
