"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../assets/js/leaderboard.js"), "utf8");
function load(name, context) {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf("\n  function ", start + 1);
  assert.ok(start >= 0 && end > start);
  return vm.runInNewContext(`${source.slice(start, end)}\n${name}`, context);
}

test("a replaced prototype has no current rank even though its own series remains at v1", () => {
  const current = load("isLatestRevision", { resultRevision: (row) => row.result_revision });
  const row = { result_revision: { is_latest: true } };
  assert.equal(current(row), true);
  row.display_replacement = { replaced_by: "new-result-v1" };
  assert.equal(current(row), false);
  row.display_replacement = { replaces: "old-result-v1" };
  assert.equal(current(row), true);
});

test("replacement details link both directions and reject unsafe result identifiers", () => {
  const escapeHtml = (value) => String(value).replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const render = load("displayReplacementHtml", {
    escapeHtml,
    resultUrl: (row) => `https://fluidsbench.org/?result=${row.id}`,
    detailsLink: (label, url) => `<a href="${url}">${label}</a>`,
  });
  const replacement = { replaces: "old-result-v1", reason: "Same run <script>", review_url: "https://github.com/example/repo/pull/1" };
  const html = render({ display_replacement: replacement });
  assert.match(html, /View original prototype/);
  assert.match(html, /result=old-result-v1/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /Maintainer review/);
  assert.match(render({ display_replacement: { ...replacement, replaced_by: "new-result-v1" } }), /View replacement result/);
  assert.equal(render({ display_replacement: { ...replacement, replaces: "<script>" } }), "");
  assert.equal(render({}), "");
});

test("history accepts a verified replacement but rejects an unapproved or missing target", () => {
  const oldId = "old-result-v1";
  const newId = "new-result-v1";
  const row = (id) => ({
    submission_id: id,
    dataset_id: "airfrans",
    split_id: "aoa",
    result_revision: { series_id: id, version: 1, supersedes: null, is_latest: true, latest_submission_id: id, version_count: 1 },
  });
  const oldRow = {
    ...row(oldId),
    record_type: "pre_release_reference",
    display_replacement: { replaced_by: newId, source_submission_id: oldId, replacement_submission_id: newId },
  };
  const newRow = { ...row(newId), approval: { status: "approved" }, display_replacement: { replaces: oldId } };
  const release = { id: "dev", status: "prototype_dummy_data", generated_at: "2026-10-25T18:00:00Z" };
  const history = {
    release_id: release.id,
    release_status: release.status,
    generated_at: release.generated_at,
    schema_version: "1.0",
    record_count: 2,
    series_count: 2,
    records: [oldRow, newRow],
  };
  const isLatestRevision = load("isLatestRevision", { resultRevision: (entry) => entry.result_revision });
  const validate = load("validateRevisionHistory", {
    dataRelease: () => release,
    normalizedResultRevision: (entry) => entry.result_revision,
    isLatestRevision,
    state: { rows: new Map([["AirfRANS", [{ id: newId }]]]) },
  });
  const metadata = { schema_version: "1.0", record_count: 2, series_count: 2 };
  assert.doesNotThrow(() => validate(history, metadata));
  newRow.approval.status = "pending";
  assert.throws(() => validate(history, metadata), /invalid prototype display replacement/);
  newRow.approval.status = "approved";
  oldRow.display_replacement.replaced_by = "missing-v1";
  assert.throws(() => validate(history, metadata), /invalid prototype display replacement/);
});
