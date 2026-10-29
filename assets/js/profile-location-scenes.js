/* Display-only geometry context. Profile samples and scoring remain owned by the evaluator. */
((root) => {
  "use strict";
  const colors = { cp: "#007d76", vertical: "#007d76", lateral: "#3f65b4", probe: "#8a4b91" };
  const escape = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  const number = (value, digits = 5) => Number(value.toFixed(digits)).toString().replace("-", "−");
  const pair = (a, b) => `${number(a)} → ${number(b)}`;
  const line = (a, b) => [a, b];
  const detail = (label, value) => [label, value];

  function projection(view) {
    const [x, y] = view.bounds;
    const scale = Math.min(580 / (x[1] - x[0]), 235 / (y[1] - y[0]));
    const left = 70 + (580 - scale * (x[1] - x[0])) / 2;
    const top = 45 + (235 - scale * (y[1] - y[0])) / 2;
    return { scale, point: ([a, b]) => [left + (a - x[0]) * scale, top + (y[1] - b) * scale] };
  }

  function ahmedScene(bundle, selection) {
    const geometry = bundle.cases[selection.caseId];
    if (!geometry) return { unavailable: "Choose a supported test case to locate its profiles." };
    if (selection.caseSupportSha256 && selection.caseSupportSha256 !== geometry.case_support_sha256) {
      return { unavailable: "The selected case uses different geometry support. Its location guide is unavailable." };
    }
    const parameters = geometry.geometry_parameters_mm_or_degrees;
    const L = parameters["body-length"] / 1000;
    const H = parameters["body-height"] / 1000;
    const W = parameters["body-width"] / 1000;
    const dx = parameters["slant-angle-length"] / 1000;
    const dz = parameters["slant-angle-height"] / 1000;
    const [, , , , bottom, top] = geometry.surface_bounds_m;
    const roof = [
      [-L, bottom + H * 0.65],
      [-L * 0.94, top],
      [-dx, top],
    ];
    const sideBody = [...roof, [0, top - dz], [0, bottom], [-L, bottom]];
    const topBody = [
      [-L, -W / 2],
      [0, -W / 2],
      [0, W / 2],
      [-L, W / 2],
    ];
    const velocity = selection.quantity === "velocity";
    const definitions = bundle.definition.panels.find((panel) => panel.panel_id === (velocity ? "velocity_profiles" : "pressure_profiles")).stations;
    const stations = definitions.map((station, index) => {
      const id = station.station_id;
      const common = { id, color: velocity && index === 3 ? colors.lateral : colors.cp, details: [detail("Target rule", station.target_rule)] };
      if (velocity) {
        const lateral = index === 3;
        const fraction = lateral ? 0.5 : [0.25, 0.5, 1][index];
        const x = fraction * L;
        const z = bottom + 0.5 * H;
        return {
          ...common,
          label: `${lateral ? "Lateral" : "Vertical"} wake · x/L = ${fraction}`,
          short: `${lateral ? "L" : "V"} · ${fraction}L`,
          paths: { side: [lateral ? [[x, z]] : line([x, 0], [x, 2 * H])], top: [lateral ? line([x, -W], [x, W]) : [[x, 0]]] },
          labelOffsets: { side: [0, lateral ? 27 : index % 2 ? -38 : -12], top: [0, lateral ? -12 : index % 2 ? 51 : 25] },
          details: [
            detail("x (m)", number(x)),
            detail(lateral ? "y (m)" : "z (m)", lateral ? pair(-W, W) : pair(0, 2 * H)),
            detail(lateral ? "z (m)" : "y (m)", lateral ? number(z) : "0"),
            ...common.details,
          ],
        };
      }
      const shape = index === 0 ? roof : index === 1 ? line([-L, bottom], [0, bottom]) : line([-dx, top], [0, top - dz]);
      return {
        ...common,
        label: ["Upper-body centreline", "Underbody centreline", "Rear-slant centreline"][index],
        short: ["Upper body", "Underbody", "Rear slant"][index],
        paths: { side: [shape], top: [line([index === 2 ? -dx : -L, 0], [index === 0 ? -dx : 0, 0])] },
        selectedOnlyViews: index === 1 ? ["top"] : [],
        labelOffsets: { side: index === 1 ? [0, 24] : index === 2 ? [45, 6] : [0, -13], top: [0, index === 1 ? 24 : -14] },
      };
    });
    return {
      title: "Ahmed body profile locations",
      badge: "Geometry-relative",
      stations,
      views: [
        {
          id: "side",
          title: "Side view",
          subtitle: "x–z · front at left",
          bounds: [
            [-1.18 * L, 1.18 * L],
            [-0.12 * H, 2.35 * H],
          ],
          outlines: [sideBody],
          xLabel: "x (m) → downstream",
          yLabel: "z (m)",
          xTicks: [-L, 0, 0.5 * L, L],
          yTicks: [0, H, 2 * H],
        },
        {
          id: "top",
          title: "Top view",
          subtitle: "x–y · symmetry at y = 0",
          bounds: [
            [-1.18 * L, 1.18 * L],
            [-1.3 * W, 1.3 * W],
          ],
          outlines: [topBody],
          xLabel: "x (m) → downstream",
          yLabel: "y (m)",
          xTicks: [-L, 0, 0.5 * L, L],
          yTicks: [-W, 0, W],
        },
      ],
      context: `${selection.caseId} · L = ${number(L)} m · H = ${number(H)} m · W = ${number(W)} m`,
      note: velocity
        ? "Line locations use this case’s published dimensions and surface bounds. The body outline is schematic; the chart uses the retained native CFD samples."
        : "Surface highlights are schematic regions, not the sampled Cp paths. Body dimensions and the target rules belong to this case; the evaluator uses frozen nearest-polygon mappings.",
    };
  }

  function windsorScene(bundle, selection) {
    const definition = bundle.definition;
    const height = selection.bodyHeight;
    if (!Number.isFinite(height) || height <= 0) return { unavailable: "Loading this case’s verified body height to locate its profiles…" };
    const relative = selection.placement === "relative";
    if (!relative && selection.placement !== "constant") return { unavailable: "Location guide unavailable for this profile family." };
    const mode = relative ? "relative" : "constant";
    const { nose_x_m: nose, base_x_m: base, half_width_m: half } = definition.geometry_invariants;
    const roof = [
      [nose, 0.06],
      [nose + 0.04, height * 0.8],
      [nose + 0.15, height],
      [base, height],
    ];
    const sideBody = [...roof, [base, 0.05], [nose, 0.05]];
    const topBody = [
      [nose, -half * 0.8],
      [nose + 0.06, -half],
      [base, -half],
      [base, half],
      [nose + 0.06, half],
      [nose, half * 0.8],
    ];
    const velocity = selection.quantity === "velocity";
    const source = velocity ? definition.velocity_stations[mode] : definition.pressure_stations[mode];
    // Keep the staggered wake labels in view even for the tallest relative cases.
    const sideTop = relative && velocity ? Math.max(0.98, source[0].interval_eta[1] * height + 0.45) : 0.98;
    const stations = source.map((station, index) => {
      const common = { id: station.id, color: velocity && index === 4 ? colors.lateral : colors.cp };
      if (velocity) {
        const lateral = station.varying === "z";
        const interval = station.interval_eta ? station.interval_eta.map((v) => v * height) : station.interval_m;
        const y = relative ? station.eta * height : station.y_m;
        const fixed = definition.velocity_stations.constant[index];
        return {
          ...common,
          label: `${lateral ? "Lateral" : "Vertical"} wake · ${fixed.x_over_l}L behind base`,
          short: `${lateral ? "L" : "V"} · ${fixed.x_over_l}L`,
          paths: {
            side: [lateral ? [[station.x_m, y]] : line([station.x_m, interval[0]], [station.x_m, interval[1]])],
            top: [lateral ? line([station.x_m, interval[0]], [station.x_m, interval[1]]) : [[station.x_m, 0]]],
          },
          labelOffsets: { side: [0, lateral ? 25 : -12 - 26 * index], top: [0, lateral ? -14 : 22 + 26 * index] },
          details: [
            detail("x (m)", number(station.x_m)),
            detail(lateral ? "z (m)" : "y (m)", pair(...interval)),
            detail(lateral ? "y (m)" : "z (m)", lateral ? number(y) : "0"),
            ...(relative ? [detail("Height rule", lateral ? `y/h = ${station.eta}` : `y/h = ${pair(...station.interval_eta)}`)] : []),
          ],
        };
      }
      const cutY = relative ? definition.relative_frame.horizontal_cut_eta * height : 0.194;
      const upper = index === 0;
      const baseCut = index === 1;
      const targetTop = relative ? height : definition.pressure_stations.constant[1].interval_m[1];
      return {
        ...common,
        label: ["Upper centreline, nose to base", "Base vertical centreline", relative ? "Side cut · y/h = 0.56491" : "Side cut · y = 0.194 m"][
          index
        ],
        short: ["Upper body", "Base", "Side cut"][index],
        paths: {
          side: [upper ? roof : baseCut ? line([base, 0], [base, targetTop]) : line([nose, cutY], [base, cutY])],
          top: [upper ? line([nose, 0], [base, 0]) : baseCut ? [[base, 0]] : line([nose, half], [base, half])],
        },
        labelOffsets: { side: upper ? [0, -12] : baseCut ? [35, 0] : [0, 23], top: [0, baseCut ? 24 : -13] },
        details: [
          detail("Selection rule", station.rule),
          ...(baseCut ? [detail("Target y (m)", pair(0, targetTop))] : !upper ? [detail("Cut y (m)", number(cutY))] : []),
        ],
      };
    });
    return {
      title: "Windsor body profile locations",
      badge: relative ? "Height-relative · report only" : "Fixed locations",
      stations,
      views: [
        {
          id: "side",
          title: "Side view",
          subtitle: "x–y · y is vertical",
          bounds: [
            [-0.67, 1.14],
            [-0.07, sideTop],
          ],
          outlines: [sideBody],
          xLabel: "x (m) → downstream",
          yLabel: "y (m)",
          xTicks: [-0.5, 0, 0.5, 1],
          yTicks: [0, 0.3, 0.6, 0.9],
        },
        {
          id: "top",
          title: "Top view",
          subtitle: "x–z · z is lateral",
          bounds: [
            [-0.67, 1.14],
            [-0.45, 0.45],
          ],
          outlines: [topBody],
          xLabel: "x (m) → downstream",
          yLabel: "z (m)",
          xTicks: [-0.5, 0, 0.5, 1],
          yTicks: [-0.3, 0, 0.3],
        },
      ],
      context: `${selection.caseId} · body height h = ${number(height)} m`,
      note: `The outline is schematic and uses this case’s verified height. ${
        velocity
          ? "Lines show the defined sampling locations."
          : "Surface highlights show regions and target extents, not the sampled Cp paths; targets outside the body map to native surface points."
      } ${relative ? "Relative locations follow body height and remain report-only." : "Fixed sampling coordinates stay unchanged between cases."}`,
    };
  }

  function hiliftScene(bundle, selection) {
    const velocity = selection.quantity === "velocity";
    const source = bundle.panels.find((panel) => panel.id === (velocity ? "velocity_profiles" : "pressure_profiles")).stations;
    if (!velocity) {
      // Ordinal placement deliberately has no physical axes: the public plot payload
      // retains x, not complete 3-D pressure-cut paths or case-specific wing meshes.
      const stations = source.map((station, index) => {
        const span = 0.14 + index * 0.078;
        const leading = 0.86 - span * 0.38;
        const trailing = 0.22 - span * 0.12;
        return {
          id: station.id,
          label: station.label,
          short: station.id.slice(-1).toUpperCase(),
          color: colors.cp,
          paths: { wing: [line([span, leading], [span, trailing])] },
          labelOffsets: { wing: [0, -12] },
          details: [
            detail("Wing dog-leg x (in)", number(station.dog_leg_x_in)),
            detail("Case 2 elements", station.elements.map((s) => s.replaceAll("_", " ")).join(", ")),
          ],
        };
      });
      return {
        title: "Wing pressure rows",
        badge: "Schematic row locations",
        stations,
        views: [
          {
            id: "wing",
            title: "CRM-HL wing",
            subtitle: "rows A–J · inboard to outboard",
            bounds: [
              [0, 1.1],
              [0, 1],
            ],
            outlines: [
              [
                [0.06, 0.86],
                [1, 0.48],
                [1, 0.1],
                [0.55, 0.13],
                [0.06, 0.22],
              ],
            ],
            xLabel: "Inboard → outboard",
            yLabel: "",
            xTicks: [],
            yTicks: [],
          },
        ],
        context: "Select a row on the wing or use the buttons below.",
        note: "The wing and row spacing are schematic. A–J preserve the published inboard-to-outboard order; the dog-leg x values are published full-scale inches, not span coordinates. Curves retain the selected case’s separate slat, wing and flap branches.",
      };
    }
    const selected = source.find((station) => station.id === selection.stationId) || source[0];
    const group = selected.id.startsWith("hlpw5_b") ? "B" : "C";
    const cluster = source.filter((station) => station.id.startsWith(`hlpw5_${group.toLowerCase()}`));
    const minX = Math.min(...cluster.map((s) => s.x_in));
    const maxX = Math.max(...cluster.map((s) => s.x_in));
    const minY = Math.min(...cluster.map((s) => s.y_in));
    const maxY = Math.max(...cluster.map((s) => s.y_in));
    const pad = group === "B" ? 35 : 15;
    const stations = source.map((station, index) => ({
      id: station.id,
      label: station.label,
      short: station.label.replace("HLPW-5 ", ""),
      color: colors.probe,
      paths: { plan: [[[station.y_in, station.x_in]]], zoom: cluster.includes(station) ? [[[station.y_in, station.x_in]]] : [] },
      labelOffsets: { plan: index > 1 ? [(index - 2) * 32 - 30, index % 2 ? 22 : -13] : [index ? -20 : 20, index ? -14 : 20], zoom: [0, -14] },
      details: [
        detail("x (in)", number(station.x_in)),
        detail("y (in)", number(station.y_in)),
        detail("Surface z (in)", number(station.surface_z_in)),
      ],
    }));
    return {
      title: "Wing velocity probe locations",
      badge: "Published HLPW-5 locations",
      stations,
      views: [
        {
          id: "plan",
          title: "Wing plan view",
          subtitle: "y–x · full-scale inches",
          bounds: [
            [0, 1180],
            [950, 2000],
          ],
          outlines: [
            [
              [100, 1020],
              [1120, 1760],
              [1120, 1940],
              [580, 1700],
              [100, 1480],
            ],
          ],
          xLabel: "Span y (in) → outboard",
          yLabel: "x (in)",
          xTicks: [0, 400, 800, 1100],
          yTicks: [1000, 1400, 1800],
        },
        {
          id: "zoom",
          title: `Probe group ${group}`,
          subtitle: "detail · same physical coordinates",
          bounds: [
            [minY - pad, maxY + pad],
            [minX - pad, maxX + pad],
          ],
          outlines: [],
          xLabel: "y (in)",
          yLabel: "x (in)",
          xTicks: [Math.round(minY - pad), Math.round(maxY + pad)],
          yTicks: [Math.round(minX), Math.round(maxX)],
        },
      ],
      context: "Select a probe to show its velocity profile; the detail view follows the selected group.",
      note: "Probe markers use the published full-scale x/y coordinates. The wing outline is schematic and does not represent the selected case’s mesh or deflections. The chart preserves its case-specific validity mask and gaps.",
    };
  }

  function buildScene(definitions, selection) {
    if (definitions.dataset_id !== selection.datasetId) return { unavailable: "Location guide does not match this dataset." };
    const builders = { ahmedml: ahmedScene, windsorml: windsorScene, hiliftaeroml: hiliftScene };
    const scene = builders[selection.datasetId]?.(definitions, selection);
    if (!scene || scene.unavailable) return scene || { unavailable: "Location guide unavailable for this dataset." };
    scene.stations = scene.stations.filter((station) => !selection.stationIds || selection.stationIds.includes(station.id));
    scene.selected = scene.stations.find((station) => station.id === selection.stationId);
    if (!scene.selected) return { unavailable: "Location guide unavailable for this station. Profile curves remain available below." };
    return scene;
  }

  function path(points, project, closed = false) {
    return (
      points
        .map(
          (point, index) =>
            `${index ? "L" : "M"}${project
              .point(point)
              .map((v) => v.toFixed(2))
              .join(",")}`
        )
        .join(" ") + (closed ? " Z" : "")
    );
  }

  function diagram(view, scene, prefix) {
    const project = projection(view);
    const axes = `<g class="location-axes">${view.xTicks
      .map((value) => {
        const x = project.point([value, view.bounds[1][0]])[0];
        return `<text x="${x}" y="312" text-anchor="middle">${number(value, 3)}</text>`;
      })
      .join("")}${view.yTicks
      .map((value) => {
        const [x, y] = project.point([view.bounds[0][0], value]);
        return `<text x="${x - 10}" y="${y + 4}" text-anchor="end">${number(value, 3)}</text>`;
      })
      .join("")}<text x="${project.point([view.bounds[0][0], 0])[0]}" y="24">${escape(
      view.yLabel
    )}</text><text x="360" y="342" text-anchor="middle">${escape(view.xLabel)}</text></g>`;
    const stations = [...scene.stations.filter((s) => s !== scene.selected), scene.selected]
      .map((station) => {
        const selected = station === scene.selected;
        const paths = station.paths[view.id] || [];
        if (!paths.length || (!selected && station.selectedOnlyViews?.includes(view.id))) return "";
        const marks = paths
          .map((points) => {
            if (points.length === 1) {
              const [x, y] = project.point(points[0]);
              return `<circle class="location-hit" cx="${x}" cy="${y}" r="13"/><circle class="location-dot" cx="${x}" cy="${y}" r="${
                selected ? 6 : 4
              }"/>`;
            }
            const d = path(points, project);
            return `<path class="location-hit" d="${d}"/><path class="location-line" d="${d}"/>`;
          })
          .join("");
        const points = paths[0];
        const anchor = points.reduce((a, p) => [a[0] + p[0] / points.length, a[1] + p[1] / points.length], [0, 0]);
        // Place vertical-line labels at their upper endpoint; other labels use a midpoint.
        if (points.length > 1 && points.every((p) => p[0] === points[0][0])) anchor[1] = Math.max(...points.map((p) => p[1]));
        const [x, y] = project.point(anchor);
        const [dx, dy] = station.labelOffsets?.[view.id] || [0, -12];
        return `<g class="location-station${selected ? " is-selected" : ""}" style="--station-color:${station.color}" data-location-station="${escape(
          station.id
        )}" role="button" tabindex="0" aria-label="Select ${escape(station.label)}" aria-pressed="${selected}"><title>${escape(
          station.label
        )}</title>${marks}<text class="location-station-label" x="${x + dx}" y="${y + dy}" text-anchor="middle">${escape(station.short)}</text></g>`;
      })
      .join("");
    return `<div class="location-view" data-view="${view.id}"><h4>${escape(view.title)} <span>${escape(view.subtitle)}</span></h4>
      <svg viewBox="0 0 720 360" role="group" aria-labelledby="${prefix}-${view.id}-title ${prefix}-${view.id}-desc"><title id="${prefix}-${
        view.id
      }-title">${escape(scene.title)} · ${escape(view.title)}</title><desc id="${prefix}-${view.id}-desc">${escape(
        scene.note
      )} Select a location to update the profile chart.</desc>${axes}${view.outlines
        .map((outline) => `<path class="location-car-body" d="${path(outline, project, true)}"/>`)
        .join("")}${stations}</svg></div>`;
  }

  function guideMarkup(definitions, selection) {
    const scene = buildScene(definitions, selection);
    if (scene.unavailable) return `<p class="location-note" role="status">${escape(scene.unavailable)}</p>`;
    const prefix = escape(selection.idPrefix || "profile-location");
    return `<div class="location-heading"><div><h3>${escape(
      scene.title
    )}</h3><p>Select a location to display its profile below.</p></div><span class="location-badge">${escape(scene.badge)}</span></div>
      <p class="location-context">${escape(scene.context)}</p><div class="location-views${
        scene.views.length === 1 ? " location-single-view" : ""
      }">${scene.views.map((view) => diagram(view, scene, prefix)).join("")}</div>
      <div class="location-station-key" role="group" aria-label="Profile locations">${scene.stations
        .map(
          (station) =>
            `<button type="button" class="location-chip${station === scene.selected ? " is-selected" : ""}" style="--station-color:${
              station.color
            }" data-location-station="${escape(station.id)}" aria-pressed="${station === scene.selected}" aria-label="Select ${escape(
              station.label
            )}"><span aria-hidden="true"></span>${escape(station.short)}</button>`
        )
        .join("")}</div>
      <div class="location-details" aria-live="polite"><strong>${escape(scene.selected.label)}</strong><dl>${scene.selected.details
        .map(([key, value]) => `<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`)
        .join("")}</dl></div><p class="location-note">${escape(scene.note)}</p>`;
  }
  const api = { projection, buildScene, guideMarkup };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FluidsBenchProfileLocationScenes = api;
})(typeof window !== "undefined" ? window : globalThis);
