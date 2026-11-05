const { test } = require("node:test");
const assert = require("node:assert/strict");
const { phase, refresh } = require("../assets/js/open-session.js");

const starts = "2026-11-11T16:30:00Z";
const ends = "2026-11-11T17:30:00Z";

test("the public notice and join links expire at the end of the session in every timezone", () => {
  assert.equal(phase(starts, ends, Date.parse("2026-11-11T11:29:59-05:00")), "upcoming");
  assert.equal(phase(starts, ends, Date.parse("2026-11-11T17:30:00+01:00")), "live");
  assert.equal(phase(starts, ends, Date.parse("2026-11-11T17:29:59Z")), "live");
  assert.equal(phase(starts, ends, Date.parse("2026-11-11T09:30:00-08:00")), "ended");
  assert.equal(phase(starts, ends, Date.parse("2026-12-05T16:30:00Z")), "ended");
});

test("an already-open page hides promotions and swaps joining controls for follow-up information", () => {
  const join = { dataset: { eventPhase: "upcoming live" }, hidden: false };
  const live = { dataset: { eventPhase: "live" }, hidden: true };
  const followup = { dataset: { eventPhase: "ended" }, hidden: true };
  const notice = {
    dataset: { eventStart: starts, eventEnd: ends, eventHideEnded: "true" },
    hidden: false,
    querySelectorAll: () => [join, live, followup],
    querySelector: () => null,
  };
  refresh(notice, Date.parse(starts));
  assert.equal(notice.hidden, false);
  assert.equal(live.hidden, false);
  assert.equal(join.hidden, false);
  refresh(notice, Date.parse(ends));
  assert.equal(notice.hidden, true);
  assert.equal(join.hidden, true);
  assert.equal(live.hidden, true);
  assert.equal(followup.hidden, false);
});

test("unparseable timing keeps the server-rendered date fallback", () => {
  assert.equal(phase("invalid", ends, Date.now()), null);
  assert.equal(phase(starts, starts, Date.now()), null);
  assert.equal(phase(starts, ends, NaN), null);
});
