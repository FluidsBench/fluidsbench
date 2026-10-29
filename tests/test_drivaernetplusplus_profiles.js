const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { createLoader, validateCase, validatePrediction } = require("../assets/js/drivaernetplusplus-profiles.js");
const root = path.resolve(__dirname, "..");
const read = (p) => JSON.parse(fs.readFileSync(p));
const hash = (data) => createHash("sha256").update(data).digest("hex");
const binding = {
  ...read(path.join(root, "_data/drivaernetplusplus_native_profiles.json")),
  manifest_url: "https://example.test/assets/data/drivaernetplusplus-native-profiles/manifest.json",
};
const fileFetch = async (url) => new Response(fs.readFileSync(path.join(root, new URL(url).pathname)));
const manifest = read(path.join(root, binding.manifest_path));

test("all 1,154 cases load with three verified native Cp traces", async () => {
  const loader = createLoader(binding, fileFetch);
  const context = await loader.getIndex("official_test");
  assert.equal(context.index.chunks.length, 1154);
  let count = 0;
  for (const entry of context.index.chunks) {
    const result = await loader.getCase(context, entry.case_ids[0]);
    assert.equal(result._fluidsbenchDrivaernetplusplusNativeProfileTruth, true);
    count += result.series.length;
  }
  assert.equal(count, 3462);
  await assert.rejects(loader.getIndex("default"), /official_test/);
  await assert.rejects(loader.getIndex("train"), /official_test/);
  await assert.rejects(loader.getCase(context, "outside-the-split"), /outside/);
});

test("corrupt bytes, altered source identities and incomplete native traces fail closed", async () => {
  await assert.rejects(createLoader({ ...binding, manifest_sha256: "0".repeat(64) }, fileFetch).getIndex("official_test"), /checksum/);
  const changed = structuredClone(manifest);
  changed.case_ids.pop();
  const bytes = Buffer.from(JSON.stringify(changed));
  await assert.rejects(
    createLoader({ ...binding, manifest_sha256: hash(bytes) }, async () => new Response(bytes)).getIndex("official_test"),
    /coverage/
  );
  const corrupt = createLoader(binding, async (url) => (url.endsWith(".gz") ? new Response("corrupt") : fileFetch(url)));
  const context = await corrupt.getIndex("official_test");
  await assert.rejects(corrupt.getCase(context, context.index.chunks[0].case_ids[0]), /checksum/);
  const original = await createLoader(binding, fileFetch).getCase(context, context.index.chunks[0].case_ids[0]);
  const entry = context.index.chunks[0];
  const missing = structuredClone(original);
  missing.series[0].value.pop();
  assert.throws(() => validateCase(missing, entry), /samples/);
  const wrongSource = structuredClone(original);
  wrongSource.source_support_npz_sha256 = "0".repeat(64);
  assert.throws(() => validateCase(wrongSource, entry), /source binding/);
  const prediction = { case_id: original.case_id, series: original.series.map((s) => ({ ...s, prediction: [...s.value] })) };
  const row = { split_id: "official_test", scoring_support: binding.source_release };
  validatePrediction(prediction, original, row);
  prediction.series[0].coordinate = [...prediction.series[0].coordinate];
  prediction.series[0].coordinate[0] += 1e-6;
  assert.throws(() => validatePrediction(prediction, original, row), /coordinates/);
  assert.throws(() => validatePrediction(prediction, original, { ...row, split_id: "default" }), /support or split/);
});

test(
  "native truth and submitted predictions match current support records and official case order",
  {
    skip: !process.env.FLUIDSBENCH_SUBMISSION_ROOT,
  },
  async () => {
    const source = process.env.FLUIDSBENCH_SUBMISSION_ROOT;
    const specRoot = path.join(source, "benchmark-specs/drivaernetplusplus");
    const spec = read(path.join(specRoot, "submission-spec.json"));
    assert.equal(binding.source_release.manifest_sha256, spec.scoring_support.candidate_manifest.manifest_sha256);
    assert.equal(binding.source_release.release_id, spec.scoring_support.candidate_manifest.release_id);
    const splitBytes = fs.readFileSync(path.join(specRoot, "splits/official_test.json"));
    assert.equal(binding.split_sha256, hash(splitBytes));
    assert.deepEqual(manifest.case_ids, JSON.parse(splitBytes).case_ids);
    const recordsRoot = path.join(specRoot, "scoring-support", binding.source_release.release_id, "case-sets/official_test/case-artifacts");
    const loader = createLoader(binding, fileFetch);
    const context = await loader.getIndex("official_test");
    const submissions = read(path.join(source, "leaderboard/datasets/drivaernetplusplus.json")).map((row) => {
      const indexPath = path.join(source, row.profile_data.index_file);
      const indexBytes = fs.readFileSync(indexPath);
      assert.equal(hash(indexBytes), row.profile_data.index_sha256);
      const predictions = new Map();
      for (const chunk of JSON.parse(indexBytes).chunks) {
        const payload = fs.readFileSync(path.join(path.dirname(indexPath), chunk.file));
        assert.equal(hash(payload), chunk.sha256);
        for (const item of JSON.parse(payload).cases) predictions.set(item.case_id, item);
      }
      assert.equal(predictions.size, 1154);
      return { row, predictions };
    });
    for (const entry of manifest.chunks) {
      const id = entry.case_ids[0];
      const bytes = fs.readFileSync(path.join(recordsRoot, id, "case-support.json"));
      assert.equal(entry.source_case_support_sha256, hash(bytes));
      const record = JSON.parse(bytes);
      assert.equal(entry.source_support_npz_sha256, record.support_npz.sha256);
      assert.equal(entry.native_point_count, record.native.point_count);
      for (const station of manifest.station_ids) assert.equal(entry.station_point_counts[station], record.profile_stations[station].point_count);
      const truth = await loader.getCase(context, id);
      for (const {row, predictions} of submissions) validatePrediction(predictions.get(id), truth, row);
    }
  }
);
