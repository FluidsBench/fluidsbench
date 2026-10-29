/* Native, report-only DrivAerNet++ Cp traces from the frozen dev support. */
(function (root) {
  "use strict";
  const stations = ["upper_body_centerline", "underbody_centerline", "rear_body_centerline"];
  const requireValue = (condition, message) => {
    if (!condition) throw new Error(`DrivAerNet++ profiles: ${message}`);
  };
  const sha256 = async (bytes) =>
    Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (x) => x.toString(16).padStart(2, "0")).join("");
  const equal = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);

  function validateCase(data, entry) {
    requireValue(
      data.schema === "drivaernetplusplus-browser-native-case-v1" &&
        data.case_id === entry.case_ids[0] &&
        data.source_case_support_sha256 === entry.source_case_support_sha256 &&
        data.source_support_npz_sha256 === entry.source_support_npz_sha256 &&
        data.native_point_count === entry.native_point_count,
      "case source binding differs"
    );
    requireValue(
      equal(
        data.series?.map((s) => s.station_id),
        stations
      ),
      "three frozen stations are required"
    );
    for (const series of data.series) {
      const count = entry.station_point_counts[series.station_id];
      requireValue(
        Number.isSafeInteger(count) &&
          count >= 2 &&
          series.panel_id === "pressure_profiles" &&
          series.quantity_id === "cp" &&
          series.scoring_role === "report_only" &&
          series.coordinate_unit === "1" &&
          series.coordinate_id === (series.station_id === "rear_body_centerline" ? "z_over_L" : "x_over_L"),
        "station definition differs"
      );
      requireValue(
        [series.coordinate, series.value].every((a) => Array.isArray(a) && a.length === count && a.every(Number.isFinite)),
        "incomplete native samples"
      );
      requireValue(
        series.coordinate.every((x, i) => !i || x > series.coordinate[i - 1]),
        "unordered native coordinates"
      );
      requireValue(
        Array.isArray(series.native_point_ids) &&
          series.native_point_ids.length === count &&
          new Set(series.native_point_ids).size === count &&
          series.native_point_ids.every((id) => Number.isSafeInteger(id) && id >= 0 && id < data.native_point_count),
        "invalid native point identities"
      );
    }
    return data;
  }

  function validatePrediction(prediction, truth, row) {
    const source = truth?._fluidsbenchProvenance?.source_release;
    requireValue(
      source &&
        row?.scoring_support?.release_id === source.release_id &&
        row.scoring_support.manifest_sha256 === source.manifest_sha256 &&
        row.split_id === "official_test",
      "prediction uses a different scoring support or split"
    );
    requireValue(
      prediction?.case_id === truth.case_id &&
        equal(
          prediction.series?.map((s) => s.station_id),
          stations
        ),
      "prediction case or stations differ"
    );
    for (let i = 0; i < stations.length; i++) {
      const s = prediction.series[i],
        reference = truth.series[i];
      requireValue(
        s.panel_id === "pressure_profiles" && s.quantity_id === "cp" && equal(s.coordinate, reference.coordinate),
        "prediction coordinates differ from frozen native support"
      );
      requireValue(
        Array.isArray(s.prediction) && s.prediction.length === reference.value.length && s.prediction.every(Number.isFinite),
        "incomplete native predictions"
      );
    }
    return prediction;
  }

  function createLoader(binding, fetcher = fetch) {
    const cache = new Map();
    async function verified(url, expected, compressed = false) {
      requireValue(/^[0-9a-f]{64}$/.test(expected || ""), "missing checksum");
      const key = `${url}|${expected}`;
      if (!cache.has(key))
        cache.set(
          key,
          (async () => {
            const response = await fetcher(url, { cache: "no-store" });
            requireValue(response.ok, `download failed (${response.status})`);
            const bytes = await response.arrayBuffer();
            requireValue((await sha256(bytes)) === expected, "checksum mismatch");
            const text = compressed
              ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text()
              : new TextDecoder().decode(bytes);
            return JSON.parse(text);
          })().catch((error) => {
            cache.delete(key);
            throw error;
          })
        );
      return cache.get(key);
    }
    async function getIndex(splitId) {
      requireValue(splitId === "official_test", "only the official_test dev split is supported");
      const manifest = await verified(binding.manifest_url, binding.manifest_sha256);
      requireValue(
        manifest.schema === "drivaernetplusplus-browser-native-profiles-v1" &&
          manifest.dataset_id === "drivaernetplusplus" &&
          manifest.split_id === splitId &&
          manifest.split_sha256 === binding.split_sha256 &&
          manifest.case_count === 1154 &&
          manifest.series_per_case === 3 &&
          equal(manifest.station_ids, stations) &&
          manifest.scoring_role === "report_only" &&
          manifest.source_kind === "native_cfd" &&
          manifest.analytical_dummy === false &&
          ["release_id", "manifest_sha256", "rules_version"].every((k) => manifest.source_release?.[k] === binding.source_release?.[k]),
        "release binding differs"
      );
      requireValue(
        Array.isArray(manifest.case_ids) &&
          manifest.case_ids.length === 1154 &&
          new Set(manifest.case_ids).size === 1154 &&
          Array.isArray(manifest.chunks) &&
          manifest.chunks.length === 1154 &&
          manifest.chunks.every((c, i) => equal(c.case_ids, [manifest.case_ids[i]]) && c.file === `case-${String(i).padStart(4, "0")}.json.gz`),
        "incomplete or reordered split coverage"
      );
      return {
        index: { chunks: manifest.chunks },
        indexUrl: binding.manifest_url,
        indexSha256: binding.manifest_sha256,
        caseSetId: splitId,
        drivaernetplusplusNativeTruth: true,
        sourceRelease: manifest.source_release,
      };
    }
    async function getCase(context, caseId) {
      const entry = context.index.chunks.find((c) => c.case_ids[0] === caseId);
      requireValue(entry, "case is outside the selected split");
      const url = new URL(entry.file, context.indexUrl).href;
      const data = validateCase(await verified(url, entry.sha256, true), entry);
      return {
        ...data,
        _fluidsbenchDrivaernetplusplusNativeProfileTruth: true,
        _fluidsbenchProvenance: {
          index_url: context.indexUrl,
          index_sha256: context.indexSha256,
          chunk_url: url,
          chunk_declared_sha256: entry.sha256,
          chunk_downloaded_sha256: entry.sha256,
          source_release: context.sourceRelease,
          source_case_support_sha256: entry.source_case_support_sha256,
          source_support_npz_sha256: entry.source_support_npz_sha256,
        },
      };
    }
    return { getIndex, getCase };
  }
  const api = { createLoader, validateCase, validatePrediction };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.FluidsBenchDrivaernetplusplusProfiles = api;
})(typeof window !== "undefined" ? window : globalThis);
