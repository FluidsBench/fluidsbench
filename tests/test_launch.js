const { test } = require("node:test");
const assert = require("node:assert/strict");
const { countdown } = require("../assets/js/launch.js");

test("UTC launch time is independent of the browser's local timezone", () => {
  assert.deepEqual(countdown("2026-11-24T15:00:00Z", Date.parse("2026-11-23T07:30:00-05:00")), {
    expired: false,
    days: 1,
    hours: 2,
    minutes: 30,
  });
});
test("exact launch boundary and late visits do not produce a negative clock", () => {
  for (const now of ["2026-11-24T15:00:00Z", "2027-01-01T00:00:00Z"]) {
    assert.deepEqual(countdown("2026-11-24T15:00:00Z", Date.parse(now)), {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
    });
  }
});
test("a final partial minute remains future time and invalid dates keep the date fallback", () => {
  assert.equal(countdown("2026-11-24T15:00:00Z", Date.parse("2026-11-24T14:59:59Z")).expired, false);
  assert.equal(countdown("not-a-date", Date.now()), null);
  assert.equal(countdown("2026-11-24T15:00:00Z", NaN), null);
});
