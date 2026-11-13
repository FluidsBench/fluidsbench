(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (!root.document) return;
  function initialise() {
    root.document.querySelectorAll("[data-session-recording]").forEach((element) => api.mount(element, root));
  }
  if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", initialise);
  else initialise();
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";

  function parseStart(value) {
    if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) return null;
    const seconds = Number(value);
    return Number.isFinite(seconds) ? seconds : null;
  }

  function seek(video, seconds, play, onPlaybackError) {
    function apply() {
      const last = Number.isFinite(video.duration) ? Math.max(0, video.duration - 0.05) : seconds;
      video.currentTime = Math.min(seconds, last);
      if (play) {
        const request = video.play();
        if (request && request.catch) request.catch(onPlaybackError);
      }
    }
    if (video.readyState >= 1) apply();
    else {
      video.addEventListener("loadedmetadata", apply, { once: true });
      video.load();
    }
  }

  function mount(element, root) {
    const video = element.querySelector("video");
    const feedback = element.querySelector("[data-recording-feedback]");
    if (!video) return;
    function message(text) {
      if (!feedback) return;
      feedback.textContent = text;
      feedback.hidden = false;
    }
    function playbackError() {
      message("Press play on the video to continue from this chapter.");
    }
    function seekFromURL() {
      const seconds = parseStart(new URL(root.location.href).searchParams.get("t"));
      if (seconds !== null) seek(video, seconds, false, playbackError);
    }
    element.querySelectorAll("[data-recording-seek]").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const seconds = parseStart(link.dataset.recordingSeek);
        if (seconds === null) return;
        event.preventDefault();
        root.history.pushState(null, "", link.href);
        if (feedback) feedback.hidden = true;
        seek(video, seconds, true, playbackError);
        element.scrollIntoView({ block: "start" });
        video.focus({ preventScroll: true });
      });
    });
    video.addEventListener("error", () => message("The video could not be loaded. Use the download link below to watch the recording."));
    root.addEventListener("popstate", seekFromURL);
    seekFromURL();
  }

  return { parseStart, seek, mount };
});
