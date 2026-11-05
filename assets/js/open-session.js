(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (!root.document) return;
  function update() {
    root.document.querySelectorAll("[data-open-session]").forEach((element) => api.refresh(element, Date.now()));
  }
  if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", update);
  else update();
  root.setInterval(update, 30000);
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";
  function phase(startsAt, endsAt, now) {
    const starts = Date.parse(startsAt);
    const ends = Date.parse(endsAt);
    if (!Number.isFinite(starts) || !Number.isFinite(ends) || !Number.isFinite(now) || ends <= starts) return null;
    return now >= ends ? "ended" : now >= starts ? "live" : "upcoming";
  }
  function refresh(element, now) {
    const state = phase(element.dataset.eventStart, element.dataset.eventEnd, now);
    if (!state) return;
    if (element.dataset.eventHideEnded === "true") element.hidden = state === "ended";
    element.querySelectorAll("[data-event-phase]").forEach((node) => {
      node.hidden = !node.dataset.eventPhase.split(" ").includes(state);
    });
    const local = element.querySelector("[data-event-local-time]");
    if (local && !local.textContent) {
      try {
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const date = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: zone });
        const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", timeZone: zone, timeZoneName: "short" });
        const start = new Date(element.dataset.eventStart);
        local.textContent = `In your timezone (${zone}): ${date.format(start)}, ${time.format(start)}–${time.format(
          new Date(element.dataset.eventEnd)
        )}.`;
        local.hidden = false;
      } catch (_) {
        // Keep the explicit GMT/UTC and reference timezone table as the fallback.
      }
    }
  }
  return { phase, refresh };
});
