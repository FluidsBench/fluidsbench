/* Display-only compute summaries. These values never participate in ranking. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FluidsBenchCompute = api;
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";

  const number = (value) => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null);
  const positive = (value) => (number(value) > 0 ? value : null);
  const text = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);
  const count = (value) => (Number.isInteger(value) && value > 0 ? value : null);

  function accelerator(compute = {}) {
    // Optional shared schema-v3 fields; older records retain an unknown identity.
    compute = compute && typeof compute === "object" ? compute : {};
    const identity = compute.accelerator || {};
    const description = text(compute.hardware);
    const type = text(identity.type)?.toLowerCase() || (description && /\bGPUs?\b/i.test(description) ? "gpu" : null);
    const model = text(identity.model);
    const vendor = text(identity.vendor);
    // Do not infer a GPU model from cluster names, vendor names or narrative notes.
    const label =
      model ||
      (type === "mixed"
        ? "Mixed accelerators"
        : type === "gpu"
          ? "GPU model unconfirmed"
          : type === "cpu"
            ? "CPU model unconfirmed"
            : type === "tpu"
              ? "TPU model unconfirmed"
              : description || type
                ? "Device model unconfirmed"
                : "Not reported");
    return {
      type,
      model,
      vendor,
      label,
      filterKey: model ? `${type || "device"}:${vendor || ""}:${model}`.toLowerCase() : label,
      filterLabel: model ? [vendor, model].filter(Boolean).join(" ") : label,
      identityBasis: text(compute.hardware_identity_basis) || "Not specified",
      devices: count(compute.max_concurrent_device_count),
      devicesPerJob: count(compute.devices_per_job),
    };
  }

  function trainingAccelerator(stages) {
    if (!stages.length) return accelerator();
    const devices = stages.map((stage) => accelerator(stage.compute));
    const first = devices[0];
    const same = devices.every(
      (item) => item.filterKey === first.filterKey && item.type === first.type && item.vendor?.toLowerCase() === first.vendor?.toLowerCase()
    );
    return {
      ...first,
      label: same ? first.label : "Mixed / partly reported",
      filterKey: same ? first.filterKey : "mixed",
      filterLabel: same ? first.filterLabel : "Mixed / partly reported",
      type: devices.every((item) => item.type === first.type) ? first.type : "mixed",
      devices: same && devices.every((item) => item.devices !== null) ? Math.max(...devices.map((item) => item.devices)) : null,
      devicesPerJob: null,
      mixed: !same,
    };
  }

  function measurementBasis(compute = {}) {
    return ["measured", "estimated"].includes(compute?.measurement_basis) ? compute?.measurement_basis : "unknown";
  }

  function summarize(row) {
    const methodology = row.methodology || {};
    const illustrative = ["prototype_fixture", "format_example"].includes(methodology.record_kind);
    const source = methodology.inference_compute || {};
    const measured = !illustrative && source.status === "measured";
    const cases = measured ? count(source.case_count) : null;
    const wall = measured ? positive(source.campaign_wall_time_seconds) : null;
    const device = measured ? number(source.aggregate_device_time_seconds) : null;
    const preprocessing = measured && typeof source.includes_preprocessing === "boolean" ? source.includes_preprocessing : null;
    const mapping = measured && typeof source.includes_mapping === "boolean" ? source.includes_mapping : null;
    const stages = Array.isArray(methodology.training?.stages) ? methodology.training.stages : [];
    const submitted = illustrative ? [] : stages.filter((stage) => stage.status === "performed_by_submitter");
    const reported = submitted.filter((stage) => number(stage.compute?.aggregate_device_hours) !== null);
    const upstreamCount = stages.filter((stage) => stage.status === "performed_upstream").length;
    const unknownCount = stages.filter((stage) => !["performed_by_submitter", "performed_upstream"].includes(stage.status)).length;
    const complete = submitted.length > 0 && reported.length === submitted.length && unknownCount === 0;
    const hardware = [...new Set(submitted.map((stage) => text(stage.compute?.hardware)).filter(Boolean))];
    const hardwareComplete = submitted.length > 0 && submitted.every((stage) => text(stage.compute?.hardware));
    const knownDeviceHours = reported.length ? reported.reduce((sum, stage) => sum + stage.compute.aggregate_device_hours, 0) : null;

    const bases = submitted.map((stage) => measurementBasis(stage.compute));
    const trainingBasis = bases.includes("estimated")
      ? "estimated"
      : bases.length && bases.every((basis) => basis === "measured")
        ? "measured"
        : "unknown";
    const trainingBasisLabel =
      trainingBasis === "estimated" ? "Includes estimates" : trainingBasis === "measured" ? "Measured allocation" : "Measurement basis not specified";
    const protocol = measured ? text(source.timing_protocol) || "legacy_reported" : null;
    const protocolLabel = protocol === "fluidsbench-complete-case-v1" ? "Complete-case v1 (declared)" : "Legacy / unspecified protocol";
    const execution = measured ? source.execution || {} : {};
    const precision = text(execution.precision);
    const fields = methodology.architecture?.predicted_fields || [];
    const outputSupport =
      text(row.prediction_scope) || (fields.length ? [...new Set(fields.map((field) => field.domain).filter(Boolean))].sort().join(" + ") : null);
    // This filter narrows declared timing conditions. It is not certification of comparability.
    const conditionsLabel = [
      protocolLabel,
      precision && precision !== "unknown" ? precision.toUpperCase() : "Precision not reported",
      outputSupport?.replaceAll("_", " ") || "Output support not reported",
    ].join(" · ");
    const conditionsKey = JSON.stringify([
      protocol,
      precision,
      outputSupport,
      preprocessing,
      mapping,
      fields.map((field) => [field.field_id, field.domain, field.component_count]).sort(),
    ]);

    return {
      inference: {
        status: measured ? "reported" : "not_reported",
        cases,
        wallSeconds: wall,
        deviceSeconds: device,
        // Campaign average: this is not single-case latency. Device time is
        // reported independently; max concurrency cannot reconstruct it.
        casesPerSecond: cases !== null && wall !== null ? cases / wall : null,
        wallSecondsPerCase: cases !== null && wall !== null ? wall / cases : null,
        deviceSecondsPerCase: cases !== null && device !== null ? device / cases : null,
        hardware: measured ? text(source.hardware) : null,
        devices: measured ? positive(source.max_concurrent_device_count) : null,
        accelerator: accelerator(measured ? source : {}),
        preprocessing,
        mapping,
        scope:
          preprocessing === null || mapping === null
            ? "Scope not reported"
            : preprocessing && mapping
              ? "Preprocessing + inference + mapping"
              : [preprocessing ? "Preprocessing" : "", "Inference", mapping ? "mapping" : ""].filter(Boolean).join(" + "),
        protocol,
        protocolLabel,
        conditionsKey,
        conditionsLabel,
        outputSupport,
        precision: precision && precision !== "unknown" ? precision.toUpperCase() : "Not reported",
        execution,
        repetitions: Array.isArray(source.campaign_runs) && measured ? source.campaign_runs.length : null,
        setupSeconds: measured ? number(source.setup_wall_time_seconds) : null,
        peakMemoryBytes: measured ? number(source.peak_device_memory_bytes) : null,
        concurrentJobs: measured ? count(source.max_concurrent_jobs) : null,
        notes: text(measured ? source.measurement_notes : source.reason),
      },
      training: {
        stages,
        submittedStages: submitted,
        upstreamCount,
        unknownCount,
        reportedStageCount: reported.length,
        // Sum the reported device allocation, once per stage. Neither elapsed
        // stage times nor run counts can be used to infer total device time.
        deviceHours: complete ? knownDeviceHours : null,
        // Keep the chart consistent with the table. Marker shape and fill
        // disclose the measurement basis without hiding reported estimates.
        plotDeviceHours: complete ? knownDeviceHours : null,
        plotPointStyle: { measured: "circle", estimated: "triangle", unknown: "rectRot" }[trainingBasis],
        measurementBasis: trainingBasis,
        measurementBasisLabel: trainingBasisLabel,
        knownDeviceHours,
        complete,
        hardware: hardwareComplete ? (hardware.length === 1 ? hardware[0] : "Mixed hardware") : null,
        hardwareList: hardware,
        accelerator: trainingAccelerator(submitted),
        scope: upstreamCount ? "Submitter stages only · upstream excluded" : submitted.length ? "Submitter stages only" : "Scope not reported",
      },
    };
  }

  function compareNumbers(left, right, descending = false) {
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    return descending ? right - left : left - right;
  }

  return { summarize, compareNumbers, accelerator, measurementBasis };
});
