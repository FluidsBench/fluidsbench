const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseStart, seek } = require("../assets/js/session-recording.js");

test("recording timestamps accept chapter offsets and reject malformed or negative links", () => {
  assert.equal(parseStart("0"), 0);
  assert.equal(parseStart("3073"), 3073);
  assert.equal(parseStart("3072.875"), 3072.875);
  for (const value of [null, "", "-1", "Infinity", "NaN", "51:13", "3073junk", "1e309"]) {
    assert.equal(parseStart(value), null);
  }
});

test("a shared chapter link waits for video metadata and seeks without autoplay", () => {
  const listeners = {};
  let played = false;
  let loaded = false;
  const video = {
    readyState: 0,
    duration: 3269.888,
    currentTime: 0,
    addEventListener: (event, callback) => (listeners[event] = callback),
    load: () => (loaded = true),
    play: () => (played = true),
  };
  seek(video, 3073, false, () => {});
  assert.equal(loaded, true);
  assert.equal(video.currentTime, 0);
  listeners.loadedmetadata();
  assert.equal(video.currentTime, 3073);
  assert.equal(played, false);
});

test("chapter clicks play at the requested point and stale offsets stay inside the recording", async () => {
  let played = 0;
  let errors = 0;
  const video = {
    readyState: 1,
    duration: 3269.888,
    play: () => {
      played += 1;
      return Promise.reject(new Error("Playback needs another user gesture"));
    },
  };
  seek(video, 99999, true, () => (errors += 1));
  await Promise.resolve();
  assert.ok(video.currentTime < video.duration);
  assert.equal(played, 1);
  assert.equal(errors, 1);
});
