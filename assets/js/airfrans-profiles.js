/* Lossless native AirfRANS display data, independently pinned for the dev viewer. */
(function (root) {
  "use strict";
  const requireValue = (condition, message) => {
    if (!condition) throw new Error(`AirfRANS profiles: ${message}`);
  };
  const sha256 = async (bytes) =>
    Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (x) => x.toString(16).padStart(2, "0")).join("");

  function validateCase(data, entry) {
    requireValue(
      data.schema === "airfrans-browser-native-case-v1" &&
        data.case_id === entry.case_ids[0] &&
        data.source_extraction_sha256 === entry.source_extraction_sha256,
      "case source binding differs"
    );
    const expected = new Set(
      ["upper_x_0_25c", "upper_x_0_50c", "upper_x_0_75c", "upper_x_0_95c"].flatMap((station) =>
        ["velocity_x_ratio", "velocity_y_ratio"].map((quantity) => `${station}/${quantity}`)
      )
    );
    requireValue(Array.isArray(data.series) && data.series.length === 8, "eight native series are required");
    for (const series of data.series) {
      const key = `${series.station_id}/${series.quantity_id}`;
      requireValue(series.panel_id === "velocity_profiles" && expected.delete(key), "unexpected or duplicate series");
      requireValue(
        [series.coordinate, series.value].every((a) => Array.isArray(a) && a.length === 1001 && a.every(Number.isFinite)),
        "incomplete native samples"
      );
      requireValue(
        series.coordinate.every((x, i) => Math.abs(x - i * 0.0001) <= 1e-12),
        "native coordinates differ"
      );
    }
    return data;
  }

  function createLoader(binding, fetcher = fetch) {
    const cache = new Map();
    async function verified(url, expected, gzip = false) {
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
            const decoded = gzip
              ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text()
              : new TextDecoder().decode(bytes);
            return JSON.parse(decoded);
          })().catch((error) => {
            cache.delete(key);
            throw error;
          })
        );
      return cache.get(key);
    }
    async function getIndex(splitId) {
      requireValue(["full", "scarce", "aoa_extrapolation"].includes(splitId), "this split is closed");
      const manifest = await verified(binding.manifest_url, binding.manifest_sha256);
      requireValue(
        manifest.schema === "airfrans-browser-native-profiles-v1" &&
          manifest.dataset_id === "airfrans" &&
          manifest.source_release?.manifest_sha256 === binding.source_manifest_sha256 &&
          manifest.case_count === 355 &&
          manifest.samples_per_series === 1001 &&
          manifest.series_per_case === 8,
        "release binding differs"
      );
      const caseSetId = splitId === "aoa_extrapolation" ? "aoa_extrapolation" : "standard";
      const ids = manifest.case_sets?.[caseSetId];
      const count = splitId === "aoa_extrapolation" ? 196 : 200;
      requireValue(
        manifest.splits?.[splitId] === caseSetId && Array.isArray(ids) && ids.length === count && new Set(ids).size === count,
        "incomplete split coverage"
      );
      requireValue(
        Array.isArray(manifest.chunks) && manifest.chunks.length === 355 && new Set(manifest.chunks.map((c) => c.case_ids?.[0])).size === 355,
        "duplicate or missing case artifacts"
      );
      const chunks = ids.map((id) => {
        const entry = manifest.chunks.find((c) => c.case_ids?.length === 1 && c.case_ids[0] === id);
        requireValue(entry && /^case-[0-9]{3}\.json\.gz$/.test(entry.file), "missing case artifact");
        return entry;
      });
      return {
        index: { chunks },
        indexUrl: binding.manifest_url,
        indexSha256: binding.manifest_sha256,
        caseSetId,
        airfransNativeTruth: true,
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
        _fluidsbenchAirfransNativeProfileTruth: true,
        _fluidsbenchProvenance: {
          index_url: context.indexUrl,
          index_sha256: context.indexSha256,
          chunk_url: url,
          chunk_declared_sha256: entry.sha256,
          chunk_downloaded_sha256: entry.sha256,
          source_release: context.sourceRelease,
          source_extraction_sha256: entry.source_extraction_sha256,
        },
      };
    }
    return { getIndex, getCase };
  }
  const api = { createLoader, validateCase };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.FluidsBenchAirfransProfiles = api;
})(typeof window !== "undefined" ? window : globalThis);
