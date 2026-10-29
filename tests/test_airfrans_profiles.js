const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { createLoader, validateCase } = require("../assets/js/airfrans-profiles.js");
const root = path.resolve(__dirname, "..");
const binding = {
  ...JSON.parse(fs.readFileSync(path.join(root, "_data/airfrans_native_profiles.json"))),
  manifest_url: "https://example.test/assets/data/airfrans-native-profiles/manifest.json",
};
const fileFetch = async (url) => new Response(fs.readFileSync(path.join(root, new URL(url).pathname)));
const original = JSON.parse(fs.readFileSync(path.join(root, binding.manifest_path)));

test("Full and Scarce expose 200 cases, AoA 196, and every native artifact loads intact", async () => {
  const loader = createLoader(binding, fileFetch);
  const full = await loader.getIndex("full");
  const scarce = await loader.getIndex("scarce");
  const aoa = await loader.getIndex("aoa_extrapolation");
  assert.equal(full.index.chunks.length, 200);
  assert.deepEqual(scarce.index, full.index);
  assert.equal(aoa.index.chunks.length, 196);
  const seen = new Set();
  for (const context of [full, aoa])
    for (const entry of context.index.chunks) {
      if (seen.has(entry.case_ids[0])) continue;
      const result = await loader.getCase(context, entry.case_ids[0]);
      assert.equal(result._fluidsbenchAirfransNativeProfileTruth, true);
      assert.equal(result.series.length, 8);
      seen.add(result.case_id);
    }
  assert.equal(seen.size, 355);
  await assert.rejects(loader.getIndex("reynolds_extrapolation"), /closed/);
  await assert.rejects(loader.getCase(full, "not-a-test-case"), /outside/);
});

test("corrupt manifests, case files and incomplete splits fail closed", async () => {
  await assert.rejects(createLoader({ ...binding, manifest_sha256: "0".repeat(64) }, fileFetch).getIndex("full"), /checksum/);
  const bad = structuredClone(original);
  bad.case_sets.standard.pop();
  const bytes = Buffer.from(JSON.stringify(bad));
  const modified = { ...binding, manifest_sha256: createHash("sha256").update(bytes).digest("hex") };
  await assert.rejects(createLoader(modified, async () => new Response(bytes)).getIndex("full"), /coverage/);
  const corrupt = createLoader(binding, async (url) => (url.endsWith(".gz") ? new Response("corrupted") : fileFetch(url)));
  const index = await corrupt.getIndex("full");
  await assert.rejects(corrupt.getCase(index, index.index.chunks[0].case_ids[0]), /checksum/);
  const loader = createLoader(binding, fileFetch);
  const context = await loader.getIndex("full");
  const entry = context.index.chunks[0];
  const sample = structuredClone(await loader.getCase(context, entry.case_ids[0]));
  sample.series[0].value.pop();
  assert.throws(() => validateCase(sample, entry), /samples/);
});

test("viewer truth is bound to the current submission contract and official case lists", { skip: !process.env.FLUIDSBENCH_SUBMISSION_ROOT }, () => {
  const source = process.env.FLUIDSBENCH_SUBMISSION_ROOT;
  const spec = JSON.parse(fs.readFileSync(path.join(source, "benchmark-specs/airfrans/submission-spec.json")));
  assert.equal(binding.source_manifest_sha256, spec.profile_definition.profile_ground_truth.manifest_sha256);
  assert.deepEqual(original.source_release, spec.profile_definition.profile_ground_truth);
  const truthRoot = path.join(
    source,
    "benchmark-specs/airfrans/releases/airfrans-evaluation-v1/airfrans/profile-truth/airfrans-native-profile-truth-v1"
  );
  const master = JSON.parse(fs.readFileSync(path.join(truthRoot, "index.json")));
  for (const [set, ids] of Object.entries(original.case_sets)) {
    assert.deepEqual(ids, JSON.parse(fs.readFileSync(path.join(truthRoot, "case-sets", `${set}.json`))).case_ids);
  }
  for (const chunk of original.chunks) assert.equal(chunk.source_extraction_sha256, master.case_locations[chunk.case_ids[0]].truth_artifact.sha256);
});
