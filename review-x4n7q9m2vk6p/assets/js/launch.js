/* The clock is informational. Only a checked site deployment can publish results. */
(function (root) {
  "use strict";
  function countdown(revealAt, now) {
    const target = Date.parse(revealAt);
    if (!Number.isFinite(target) || !Number.isFinite(now)) return null;
    const minutes = Math.max(0, Math.ceil((target - now) / 60000));
    return {
      expired: now >= target,
      days: Math.floor(minutes / 1440),
      hours: Math.floor((minutes % 1440) / 60),
      minutes: minutes % 60,
    };
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { countdown };
  if (!root.document) return;

  root.document.querySelectorAll("[data-countdown]").forEach(function (card) {
    const clock = card.querySelector("[data-clock]");
    const message = card.querySelector("[data-countdown-message]");
    const refresh = card.querySelector("[data-launch-refresh]");
    const label = card.querySelector("[data-cutoff-label]");
    const revealAt = card.dataset.revealAt;
    const local = card.querySelector("[data-local-time]");
    try {
      const formatter = new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
      if (new Date(revealAt).getTimezoneOffset() !== 0) local.textContent = "· " + formatter.format(new Date(revealAt)) + " your time";
    } catch (_) {
      /* The explicit UTC date remains the authoritative fallback. */
    }

    function update() {
      const now = Date.now();
      const remaining = countdown(revealAt, now);
      if (!remaining) return;
      clock.hidden = remaining.expired;
      refresh.hidden = !remaining.expired;
      if (remaining.expired) {
        message.textContent =
          card.dataset.confirmed === "true"
            ? "Preparing the first results. The leaderboard will appear after publication."
            : "The planned release date has passed. A new date will be confirmed here.";
      } else {
        ["days", "hours", "minutes"].forEach(function (unit) {
          card.querySelector('[data-unit="' + unit + '"]').textContent = String(remaining[unit]).padStart(2, "0");
        });
      }
      if (now >= Date.parse(card.dataset.cutoffAt)) label.textContent = "First-release cutoff";
    }
    update();
    root.setInterval(update, 1000);
    root.document.addEventListener("visibilitychange", update);
  });
})(typeof window !== "undefined" ? window : globalThis);
