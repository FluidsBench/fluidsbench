/* Display-only selectors over dataset-specific profile-location definitions. */
(() => {
  "use strict";

  const scenes = typeof module !== "undefined" && module.exports ? require("./profile-location-scenes.js") : window.FluidsBenchProfileLocationScenes;

  const palette = { V: "#007d76", U: "#3f65b4", L: "#b85b28", R: "#8a4b91", cp: "#007d76" };
  const escape = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  const number = (value) => Number(value.toFixed(6)).toString().replace("-", "−");
  const tuple = (point) => `(${point.map(number).join(", ")})`;
  const shortName = (station) => station.source_profile_id || station.label;

  // These reference outlines provide context only; they are not a case mesh or sampled Cp path.
  const upperBody = [
    [-0.82, 0, 0.06],
    [-0.76, 0, 0.4],
    [-0.45, 0, 0.5],
    [0.5, 0, 0.61],
    [1.1, 0, 1.2],
    [2.28, 0, 1.25],
    [2.72, 0, 1.08],
    [3.25, 0, 0.69],
    [3.58, 0, 0.6],
    [3.66, 0, 0.12],
  ];
  const lowerBody = [
    [-0.6, 0, -0.11],
    [3.45, 0, -0.11],
  ];
  const sideOutline = [...upperBody, [3.51, 0, 0.01], [-0.72, 0, 0.01]];
  const topOutline = [
    [-0.82, -0.58, 0],
    [-0.67, -0.83, 0],
    [0.3, -0.93, 0],
    [2.7, -0.93, 0],
    [3.53, -0.82, 0],
    [3.66, -0.56, 0],
    [3.66, 0.56, 0],
    [3.53, 0.82, 0],
    [2.7, 0.93, 0],
    [0.3, 0.93, 0],
    [-0.67, 0.83, 0],
    [-0.82, 0.58, 0],
  ];

  function projection(view) {
    const vertical = view === "side" ? [-0.7, 2.25] : [-1.75, 1.75];
    const scale = Math.min(640 / 7.3, 272 / (vertical[1] - vertical[0]));
    const left = 50 + (640 - 7.3 * scale) / 2;
    const top = 35 + (272 - (vertical[1] - vertical[0]) * scale) / 2;
    const point = (xyz) => [left + (xyz[0] + 1.4) * scale, top + (vertical[1] - xyz[view === "side" ? 2 : 1]) * scale];
    return { point, scale, left, top, vertical };
  }

  function path(points, project, close = false) {
    return (
      points
        .map((point, index) => {
          const [x, y] = project.point(point);
          return `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ") + (close ? " Z" : "")
    );
  }

  function car(view, project) {
    const body = `<path class="location-car-body" d="${path(view === "side" ? sideOutline : topOutline, project, true)}"/>`;
    if (view === "side") {
      const wheels = [0, 2.786]
        .map((x) => {
          const [cx, cy] = project.point([x, 0, 0]);
          return `<circle class="location-wheel" cx="${cx}" cy="${cy}" r="${0.3176 * project.scale}"/>
          <circle class="location-wheel-hub" cx="${cx}" cy="${cy}" r="${0.14 * project.scale}"/>`;
        })
        .join("");
      return (
        body +
        `<path class="location-car-window" d="${path(
          [
            [0.72, 0, 0.65],
            [1.18, 0, 1.1],
            [2.23, 0, 1.15],
            [2.92, 0, 0.75],
          ],
          project,
          true
        )}"/>` +
        wheels
      );
    }
    const roof = [
      [0.6, -0.7, 0],
      [1.1, -0.6, 0],
      [2.3, -0.6, 0],
      [3, -0.7, 0],
      [3, 0.7, 0],
      [2.3, 0.6, 0],
      [1.1, 0.6, 0],
      [0.6, 0.7, 0],
    ];
    const wheels = [0, 2.786]
      .flatMap((x) =>
        [-0.86, 0.86].map((y) => {
          const [cx, cy] = project.point([x, y, 0]);
          return `<rect class="location-wheel" x="${cx - 0.27 * project.scale}" y="${cy - 0.09 * project.scale}"
        width="${0.54 * project.scale}" height="${0.18 * project.scale}" rx="3"/>`;
        })
      )
      .join("");
    return body + `<path class="location-car-window" d="${path(roof, project, true)}"/>` + wheels;
  }

  function axes(view, project) {
    const baseline = 320;
    const x1 = project.point([-1.4, 0, 0])[0];
    const x2 = project.point([5.9, 0, 0])[0];
    const verticalBottom = project.top + (project.vertical[1] - project.vertical[0]) * project.scale;
    const ticks = [-1, 0, 1, 2, 3, 4, 5]
      .map((value) => {
        const x = project.point([value, 0, 0])[0];
        return `<line x1="${x}" y1="${baseline}" x2="${x}" y2="${baseline + 4}"/>
        <text x="${x}" y="${baseline + 19}" text-anchor="middle">${number(value)}</text>`;
      })
      .join("");
    const verticalTicks = (view === "side" ? [0, 1, 2] : [-1.5, 0, 1.5])
      .map((value) => {
        const y = project.point(view === "side" ? [0, 0, value] : [0, value, 0])[1];
        return `<line x1="${x1 - 6}" y1="${y}" x2="${x1 - 2}" y2="${y}"/>
        <text x="${x1 - 10}" y="${y + 4}" text-anchor="end">${number(value)}</text>`;
      })
      .join("");
    return `<g class="location-axes">
      <line x1="${x1}" y1="${baseline}" x2="${x2}" y2="${baseline}"/>
      <line x1="${x1 - 3}" y1="${project.top}" x2="${x1 - 3}" y2="${verticalBottom}"/>
      ${ticks}${verticalTicks}
      <text x="${x1 - 12}" y="${project.top - 13}">${view === "side" ? "z" : "y"} (m)</text>
      <text x="${x2}" y="${baseline + 36}" text-anchor="end">x (m) → downstream</text>
      ${
        view === "side"
          ? `<text x="${project.point([-0.3, 0, 0])[0]}" y="20" text-anchor="middle">FRONT</text>
        <text x="${project.point([3.2, 0, 0])[0]}" y="20" text-anchor="middle">REAR</text>`
          : ""
      }
    </g>`;
  }

  function velocityLine(station, view, project, selected) {
    const [ax, ay] = project.point(station.start_m);
    const [bx, by] = project.point(station.end_m);
    const name = shortName(station);
    const group = name[0];
    const collapsed = Math.hypot(bx - ax, by - ay) < 1;
    let tx = (ax + bx) / 2;
    let ty = Math.min(ay, by) - 12;
    if (group === "U" && view === "side") ty = ay + 23;
    if (group === "L") {
      tx = bx - 17;
      ty = by + 23;
    }
    if (group === "R") {
      tx = view === "side" ? bx + 15 : (ax + bx) / 2;
      ty = view === "side" ? by - 9 : by - 24 - (Number(name.slice(1)) - 1) * 18;
    }
    const title = `${name}: ${tuple(station.start_m)} → ${tuple(station.end_m)} m`;
    return `<g class="location-station${selected ? " is-selected" : ""}" style="--station-color:${palette[group]}"
      data-location-station="${escape(station.id)}" role="button" tabindex="0"
      aria-label="Select ${escape(title)}" aria-pressed="${selected}">
      <title>${escape(title)}</title>
      ${
        collapsed
          ? `<circle class="location-hit" cx="${ax}" cy="${ay}" r="12"/>
          <circle class="location-dot" cx="${ax}" cy="${ay}" r="${selected ? 5 : 3.5}"/>`
          : `<line class="location-hit" x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}"/>
          <line class="location-line" x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}"/>
          <circle class="location-dot" cx="${ax}" cy="${ay}" r="3"/>
          <circle class="location-dot" cx="${bx}" cy="${by}" r="3"/>`
      }
      <text class="location-station-label" data-family="${group}" data-alternate="${Number(name.slice(1)) % 2 === 0}"
        x="${tx}" y="${ty}" text-anchor="middle">${escape(name)}</text>
    </g>`;
  }

  function cpRegion(station, view, project, selected) {
    let points;
    const id = station.id;
    if (view === "side") {
      if (id === "upperbody_centerline") points = upperBody;
      else if (id === "underbody_centerline") points = lowerBody;
      else if (id === "sidewall_z_0_15")
        points = [
          [-0.78, 0, 0.15],
          [3.65, 0, 0.15],
        ];
      else
        points = Array.from({ length: 25 }, (_, i) => {
          const theta = Math.PI - (i * Math.PI) / 24;
          return [0.39 * Math.cos(theta), -0.6, 0.39 * Math.sin(theta)];
        });
    } else if (id === "upperbody_centerline")
      points = [
        [-0.75, 0, 0],
        [3.6, 0, 0],
      ];
    else if (id === "underbody_centerline")
      points = [
        [-0.6, 0, 0],
        [3.45, 0, 0],
      ];
    else if (id === "sidewall_z_0_15") points = topOutline;
    else
      points = [
        [-0.39, -0.6, 0],
        [0.39, -0.6, 0],
      ];
    // Both centreline cuts coincide in plan view, so render only the selected one there.
    if (view === "top" && !selected && id.includes("centerline")) return "";
    const closed = view === "top" && id === "sidewall_z_0_15";
    return `<g class="location-station location-cp-region${selected ? " is-selected" : ""}"
      style="--station-color:${palette.cp}" data-location-station="${escape(id)}"
      role="button" tabindex="0" aria-label="Select ${escape(station.label)}" aria-pressed="${selected}">
      <title>${escape(station.label)} · schematic surface region</title>
      <path class="location-hit" d="${path(points, project, closed)}"/>
      <path class="location-line" d="${path(points, project, closed)}"/>
    </g>`;
  }

  function cpPlane(station, view, project) {
    const plane = station.plane;
    if ((view === "side" && plane.axis !== "z") || (view === "top" && plane.axis !== "y")) return "";
    const points =
      plane.axis === "z"
        ? [
            [-1.2, 0, plane.value_m],
            [4, 0, plane.value_m],
          ]
        : [
            [-1.2, plane.value_m, 0],
            [4, plane.value_m, 0],
          ];
    const [x, y] = project.point(points[1]);
    return `<path class="location-cut-plane" d="${path(points, project)}"/>
      <text class="location-plane-label" x="${x + 7}" y="${y - 9}">${plane.axis} = ${number(plane.value_m)} m</text>`;
  }

  function cpLabels(view, project, selected) {
    if (view === "top") {
      const [x, y] = project.point([1.5, 1.2, 0]);
      const label =
        selected.anatomical_scope === "upper_body_external_surface"
          ? "Upper-body surface"
          : selected.anatomical_scope === "underbody_external_surface"
            ? "Underside of body"
            : selected.anatomical_scope === "vehicle_sidewall_external_surface"
              ? "Sidewall surface"
              : "Front-left wheelhouse";
      return `<text class="location-region-label" x="${x}" y="${y}" text-anchor="middle">${label}</text>`;
    }
    const labels = [
      ["upperbody_centerline", "Upper body", [1.7, 0, 1.55]],
      ["underbody_centerline", "Underbody", [1.7, 0, -0.52]],
      ["sidewall_z_0_15", "Sidewall", [4.45, 0, 0.25]],
      ["front_left_wheelhouse_y_neg_0_6", "Wheelhouse", [-0.38, 0, 0.8]],
    ];
    return labels
      .map(([id, label, xyz]) => {
        const [x, y] = project.point(xyz);
        return `<text class="location-region-label${selected.id === id ? " is-selected" : ""}"
        data-location-station="${id}" x="${x}" y="${y}" text-anchor="middle">${label}</text>`;
      })
      .join("");
  }

  function diagram(view, quantity, stations, selected, idPrefix) {
    const project = projection(view);
    const ordered = [...stations.filter((s) => s.id !== selected.id), selected];
    return `<div class="location-view" data-view="${view}">
      <h4>${view === "side" ? "Side view <span>x–z</span>" : "Top view <span>x–y · front at left</span>"}</h4>
      <svg viewBox="0 0 720 360" role="group" aria-labelledby="${idPrefix}-${view}-title ${idPrefix}-${view}-desc">
        <title id="${idPrefix}-${view}-title">${view === "side" ? "Side" : "Top"} view of fixed ${
          quantity === "velocity" ? "velocity lines" : "Cp cut locations"
        }</title>
        <desc id="${idPrefix}-${view}-desc">${
          quantity === "velocity"
            ? "Exact fixed line endpoints over an illustrative car outline."
            : "Cut planes and schematic surface regions over an illustrative car outline."
        } Select a location to update the profile chart.</desc>
        ${axes(view, project)}${car(view, project)}
        ${quantity === "cp" ? cpPlane(selected, view, project) : ""}
        ${ordered
          .map((station) =>
            quantity === "velocity"
              ? velocityLine(station, view, project, station.id === selected.id)
              : cpRegion(station, view, project, station.id === selected.id)
          )
          .join("")}
        ${quantity === "cp" ? cpLabels(view, project, selected) : ""}
      </svg>
    </div>`;
  }

  function guideMarkup(definitions, selection) {
    if (definitions.schema === "fluidsbench-profile-location-guide-v1") return scenes.guideMarkup(definitions, selection);
    if (selection.placement !== "constant") {
      return `<div class="location-heading"><div><h3>Profile locations</h3>
        <p>Geometry-relative locations · report only</p></div><span class="location-badge">Case-specific</span></div>
        <div class="location-unavailable"><strong>This guide currently shows fixed locations.</strong>
          <p>Geometry-relative lines and cuts move with each case. Their spatial coordinates have not yet been
            added to the guide; the profile chart below still shows the selected case's retained CFD data.</p>
          <button class="leaderboard-action-button" type="button" data-location-fixed>Show fixed locations</button></div>`;
    }
    const velocity = selection.quantity === "velocity";
    const available = velocity ? definitions.velocity_profiles.stations : definitions.pressure_cuts.stations;
    const stations = available.filter((station) => !selection.stationIds || selection.stationIds.includes(station.id));
    const selected = stations.find((s) => s.id === selection.stationId) || (!selection.stationId ? stations[0] : null);
    if (!selected) return `<p class="location-note">Location guide unavailable for this station. Profile curves remain available below.</p>`;
    const idPrefix = escape(selection.idPrefix || "profile-location");
    const labels = {
      upperbody_centerline: "Upper body",
      underbody_centerline: "Underbody",
      sidewall_z_0_15: "Sidewall",
      front_left_wheelhouse_y_neg_0_6: "Front-left wheelhouse",
    };
    const details = velocity
      ? `<div><dt>Start (x, y, z) · m</dt><dd>${tuple(selected.start_m)}</dd></div>
        <div><dt>End (x, y, z) · m</dt><dd>${tuple(selected.end_m)}</dd></div>
        <div><dt>Length</dt><dd>${number(selected.length_m)} m</dd></div>`
      : `<div><dt>Cutting plane</dt><dd>${selected.plane.axis} = ${number(selected.plane.value_m)} m</dd></div>
        <div><dt>Surface region</dt><dd>${escape(selected.anatomical_scope.replaceAll("_", " "))}</dd></div>`;
    return `<div class="location-heading"><div><h3>Profile locations</h3>
        <p>${velocity ? "Select a line to see where the velocity profile is sampled." : "Select a surface region to locate its Cp cut."}</p></div>
        <span class="location-badge">Fixed locations</span></div>
      <div class="location-views">${diagram("side", selection.quantity, stations, selected, idPrefix)}${diagram(
        "top",
        selection.quantity,
        stations,
        selected,
        idPrefix
      )}</div>
      <div class="location-station-key" role="group" aria-label="${velocity ? "Velocity lines" : "Cp cuts"}">
        ${stations
          .map(
            (station) => `<button type="button" class="location-chip${station.id === selected.id ? " is-selected" : ""}"
          style="--station-color:${velocity ? palette[shortName(station)[0]] : palette.cp}"
          data-location-station="${escape(station.id)}" aria-pressed="${station.id === selected.id}">
          <span aria-hidden="true"></span>${escape(velocity ? shortName(station) : labels[station.id])}</button>`
          )
          .join("")}
      </div>
      ${
        velocity
          ? `<p class="location-legend"><span style="--station-color:${palette.V}">V · vertical</span>
        <span style="--station-color:${palette.U}">U · spanwise</span><span style="--station-color:${palette.L}">L · streamwise</span>
        <span style="--station-color:${palette.R}">R · inclined</span></p>`
          : ""
      }
      <div class="location-details" aria-live="polite"><strong>${escape(selected.label)}</strong><dl>${details}</dl></div>
      <p class="location-note">${
        velocity
          ? "Line endpoints are the exact fixed definitions. The vehicle outline is schematic and stays the same for every case. The guide shows full reference lines; the chart below preserves gaps in CFD support."
          : "Cut planes are the exact fixed definitions. The vehicle and highlighted surface regions are schematic, not the sampled Cp paths. Upper-body and underbody cuts share y = 0 but use different surfaces."
      }</p>`;
  }

  class ProfileLocationGuide {
    constructor(container, { definitionsUrl, onSelect, onFixed }) {
      this.container = container;
      this.version = 0;
      this.definitions = fetch(definitionsUrl, { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error("location definitions could not be loaded");
        return response.json();
      });
      // Handle a load failure even if no imported result triggers the first update.
      this.definitions.catch(() => {});
      container.addEventListener("click", (event) => {
        const station = event.target.closest("[data-location-station]");
        if (station) onSelect(station.dataset.locationStation);
        if (event.target.closest("[data-location-fixed]")) onFixed();
      });
      container.addEventListener("keydown", (event) => {
        if (event.target.tagName.toLowerCase() === "button") return;
        const station = event.target.closest("[data-location-station]");
        if (station && ["Enter", " "].includes(event.key)) {
          event.preventDefault();
          onSelect(station.dataset.locationStation);
        }
      });
    }

    async update(selection) {
      const version = ++this.version;
      try {
        const definitions = await this.definitions;
        if (version !== this.version) return;
        const focusedStation = this.container.contains(document.activeElement) ? document.activeElement.dataset.locationStation : null;
        this.container.innerHTML = guideMarkup(definitions, { ...selection, idPrefix: this.container.id });
        if (focusedStation) {
          const chip = [...this.container.querySelectorAll("button[data-location-station]")].find(
            (button) => button.dataset.locationStation === focusedStation
          );
          chip?.focus({ preventScroll: true });
        }
      } catch (error) {
        if (version !== this.version) return;
        this.container.innerHTML = `<p class="location-note">Location guide unavailable: ${escape(
          error.message
        )}. Profile curves remain available below.</p>`;
      }
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { projection, guideMarkup, ProfileLocationGuide };
  } else {
    window.FluidsBenchProfileLocationGuide = ProfileLocationGuide;
  }
})();
