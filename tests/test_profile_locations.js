const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { projection, guideMarkup } = require("../assets/js/profile-locations.js");
const { buildScene, projection: sceneProjection } = require("../assets/js/profile-location-scenes.js");
const readGuide = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, `../assets/data/profile-locations/${name}.json`)));
const ahmed = readGuide("ahmedml-v1");
const windsor = readGuide("windsorml-v2");
const hilift = readGuide("hiliftaeroml-v1");

const payload = fs.readFileSync(path.join(__dirname, "../assets/data/profile-locations/drivaerml-v9.json"));
const definitions = JSON.parse(payload);
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("display definitions match the pinned FluidsBench v9 profile contract byte for byte", () => {
  assert.equal(createHash("sha256").update(payload).digest("hex"), "df22bc807b62f925c32659d681ac44064e6acf46449038b8431b1e9139aba1e8");
  assert.equal(definitions.velocity_profiles.stations.length, 16);
  assert.equal(definitions.pressure_cuts.stations.length, 4);
});

test("orthographic projections preserve metre scale and distinguish collapsed lines", () => {
  for (const view of ["side", "top"]) {
    const p = projection(view);
    const origin = p.point([0, 0, 0]);
    near(distance(origin, p.point([1, 0, 0])), p.scale);
    near(distance(origin, p.point(view === "side" ? [0, 0, 1] : [0, 1, 0])), p.scale);
    assert.ok(p.point([1, 0, 0])[0] > origin[0]);
    assert.ok(p.point(view === "side" ? [0, 0, 1] : [0, 1, 0])[1] < origin[1]);
    for (const station of definitions.velocity_profiles.stations) {
      for (const endpoint of [station.start_m, station.end_m]) {
        const [x, y] = p.point(endpoint);
        assert.ok(x > 0 && x < 720 && y > 0 && y < 320, station.id);
      }
    }
  }
  const v3 = definitions.velocity_profiles.stations.find((s) => s.source_profile_id === "V3");
  const u1 = definitions.velocity_profiles.stations.find((s) => s.source_profile_id === "U1");
  const side = projection("side");
  const top = projection("top");
  near(distance(side.point(v3.start_m), side.point(v3.end_m)), 2 * side.scale);
  near(distance(top.point(v3.start_m), top.point(v3.end_m)), 0);
  near(distance(side.point(u1.start_m), side.point(u1.end_m)), 0);
  near(distance(top.point(u1.start_m), top.point(u1.end_m)), 3 * top.scale);
});

test("all fixed stations are selectable and their detail coordinates come from the contract", () => {
  for (const station of definitions.velocity_profiles.stations) {
    const html = guideMarkup(definitions, { placement: "constant", quantity: "velocity", stationId: station.id });
    assert.ok(html.includes(`<strong>${station.label}</strong>`));
    assert.ok(html.includes(`data-location-station="${station.id}" aria-pressed="true"`));
    for (const candidate of definitions.velocity_profiles.stations) {
      assert.ok(html.includes(`data-location-station="${candidate.id}"`));
    }
  }
});

test("Cp centreline cuts retain separate anatomical regions despite sharing one plane", () => {
  const upper = definitions.pressure_cuts.stations.find((s) => s.id === "upperbody_centerline");
  const lower = definitions.pressure_cuts.stations.find((s) => s.id === "underbody_centerline");
  assert.deepEqual(upper.plane, { axis: "y", value_m: 0 });
  assert.deepEqual(lower.plane, upper.plane);
  assert.notEqual(lower.anatomical_scope, upper.anatomical_scope);
  for (const station of definitions.pressure_cuts.stations) {
    const html = guideMarkup(definitions, { placement: "constant", quantity: "cp", stationId: station.id });
    assert.ok(html.includes(station.anatomical_scope.replaceAll("_", " ")));
    assert.ok(html.includes("not the sampled Cp paths"));
    assert.ok(html.includes(`data-location-station="${station.id}" aria-pressed="true"`));
  }
});

test("relative mode never presents fixed endpoints as case-specific locations", () => {
  for (const quantity of ["velocity", "cp"]) {
    const html = guideMarkup(definitions, { placement: "relative", quantity, stationId: "V3" });
    assert.ok(html.includes("spatial coordinates have not yet been"));
    assert.ok(!html.includes("<svg"));
    assert.ok(!html.includes("4.007"));
  }
});

test("panel-specific SVG labels remain unique across velocity and Cp guides", () => {
  const velocity = guideMarkup(definitions, {
    placement: "constant",
    quantity: "velocity",
    stationId: "autocfd5_v3",
    idPrefix: "profile-1-locations",
  });
  const cp = guideMarkup(definitions, { placement: "constant", quantity: "cp", stationId: "upperbody_centerline", idPrefix: "profile-0-locations" });
  const ids = [...(velocity + cp).matchAll(/\bid="([^" ]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(velocity.includes('aria-labelledby="profile-1-locations-side-title profile-1-locations-side-desc"'));
  assert.ok(cp.includes('aria-labelledby="profile-0-locations-top-title profile-0-locations-top-desc"'));
});

test("unknown or missing support cannot be replaced by another station's location", () => {
  const unknown = guideMarkup(definitions, { placement: "constant", quantity: "velocity", stationId: "prototype_0_25l" });
  assert.ok(unknown.includes("unavailable for this station"));
  assert.ok(!unknown.includes("<svg"));
  const filtered = guideMarkup(definitions, { placement: "constant", quantity: "velocity", stationId: "autocfd5_v3", stationIds: ["autocfd5_v3"] });
  assert.ok(filtered.includes('data-location-station="autocfd5_v3"'));
  assert.ok(!filtered.includes('data-location-station="autocfd5_v1"'));
});

function checkScene(scene, definitions, selection) {
  assert.ok(!scene.unavailable, scene.unavailable);
  const html = guideMarkup(definitions, selection);
  for (const station of scene.stations) {
    assert.ok(html.includes(`data-location-station="${station.id}"`), station.id);
    for (const view of scene.views) {
      const project = sceneProjection(view);
      for (const point of (station.paths[view.id] || []).flat()) {
        const [x, y] = project.point(point);
        assert.ok(Number.isFinite(x) && x >= 60 && x <= 660, `${station.id}: x=${x}`);
        assert.ok(Number.isFinite(y) && y >= 35 && y <= 290, `${station.id}: y=${y}`);
      }
    }
  }
  assert.ok(html.includes(`data-location-station="${scene.selected.id}" aria-pressed="true"`));
  for (const [, x, y] of html.matchAll(/class="location-station-label" x="([^"]+)" y="([^"]+)"/g)) {
    assert.ok(Number(x) >= 30 && Number(x) <= 690 && Number(y) >= 20 && Number(y) <= 330, `Label outside diagram: ${x}, ${y}`);
  }
  assert.ok(!html.includes("undefined") && !html.includes("NaN"));
}

test("AhmedML guides cover every native case and keep roof, underbody and slant distinct", () => {
  assert.equal(Object.keys(ahmed.cases).length, 316);
  for (const [caseId, support] of Object.entries(ahmed.cases)) {
    for (const quantity of ["cp", "velocity"]) {
      const stationIds = ahmed.definition.panels
        .find((p) => p.panel_id === (quantity === "cp" ? "pressure_profiles" : "velocity_profiles"))
        .stations.map((s) => s.station_id);
      const selection = {
        datasetId: "ahmedml",
        caseId,
        quantity,
        stationId: stationIds[0],
        stationIds,
        caseSupportSha256: support.case_support_sha256,
      };
      const scene = buildScene(ahmed, selection);
      checkScene(scene, ahmed, selection);
      if (quantity === "cp") assert.notDeepEqual(scene.stations[0].paths, scene.stations[2].paths);
      else {
        const L = support.geometry_parameters_mm_or_degrees["body-length"] / 1000;
        const H = support.geometry_parameters_mm_or_degrees["body-height"] / 1000;
        const W = support.geometry_parameters_mm_or_degrees["body-width"] / 1000;
        assert.deepEqual(scene.stations[0].paths.side[0], [
          [0.25 * L, 0],
          [0.25 * L, 2 * H],
        ]);
        assert.deepEqual(scene.stations[3].paths.top[0], [
          [0.5 * L, -W],
          [0.5 * L, W],
        ]);
      }
    }
  }
});

test("WindsorML uses vertical y and lateral z; relative locations follow verified case height", () => {
  for (const height of [0.29957, 0.34342, 0.48888]) {
    for (const placement of ["constant", "relative"]) {
      for (const quantity of ["cp", "velocity"]) {
        const source = quantity === "cp" ? windsor.definition.pressure_stations : windsor.definition.velocity_stations;
        for (const station of source[placement]) {
          const selection = { datasetId: "windsorml", caseId: "case", bodyHeight: height, placement, quantity, stationId: station.id };
          const scene = buildScene(windsor, selection);
          checkScene(scene, windsor, selection);
          assert.equal(scene.views[0].yLabel, "y (m)");
          assert.equal(scene.views[1].yLabel, "z (m)");
          if (quantity === "velocity") {
            near(scene.stations[0].paths.side[0][1][1], placement === "constant" ? 0.6 : 1.74713 * height);
            near(scene.stations[4].paths.side[0][0][1], placement === "constant" ? 0.194 : 0.56491 * height);
            assert.deepEqual(scene.stations[4].paths.top[0], [
              [0.58765, -0.35],
              [0.58765, 0.35],
            ]);
          }
        }
      }
    }
  }
});

test("HiLift preserves all A–J rows and exact published probe coordinates with a selectable detail view", () => {
  for (const panel of hilift.panels) {
    assert.equal(panel.stations.length, panel.id === "pressure_profiles" ? 10 : 5);
    for (const station of panel.stations) {
      const selection = { datasetId: "hiliftaeroml", quantity: panel.id === "pressure_profiles" ? "cp" : "velocity", stationId: station.id };
      const scene = buildScene(hilift, selection);
      checkScene(scene, hilift, selection);
      if (selection.quantity === "velocity") {
        assert.deepEqual(scene.selected.paths.plan[0], [[station.y_in, station.x_in]]);
        assert.equal(scene.selected.paths.zoom[0].length, 1);
      } else {
        assert.ok(scene.note.includes("not span coordinates"));
        assert.equal(scene.views[0].xTicks.length, 0);
      }
    }
  }
});

test("new guides never substitute missing geometry, another dataset, family or station", () => {
  for (const selection of [
    { datasetId: "ahmedml", caseId: "missing", quantity: "cp", stationId: "upper_body_centerline" },
    { datasetId: "ahmedml", caseId: "run_331", caseSupportSha256: "wrong", quantity: "cp", stationId: "upper_body_centerline" },
    { datasetId: "windsorml", caseId: "run_331", quantity: "cp", stationId: "upper_body_centerline" },
    { datasetId: "ahmedml", caseId: "run_331", quantity: "cp", stationId: "unknown" },
    { datasetId: "ahmedml", caseId: "run_331", quantity: "cp", stationId: "upper_body_centerline", stationIds: [] },
  ])
    assert.ok(!guideMarkup(ahmed, selection).includes("<svg"));
  for (const bodyHeight of [undefined, null, 0, -1, NaN]) {
    assert.ok(buildScene(windsor, { datasetId: "windsorml", bodyHeight }).unavailable);
  }
});

test("SVG and button activation send the exact station; delayed loads keep the latest selection", async () => {
  const { ProfileLocationGuide } = require("../assets/js/profile-locations.js");
  const oldFetch = global.fetch;
  const oldDocument = global.document;
  let resolve;
  global.fetch = () =>
    new Promise((done) => {
      resolve = done;
    });
  global.document = { activeElement: null };
  try {
    const events = {};
    const selected = [];
    const container = {
      id: "guide",
      innerHTML: "",
      contains: () => false,
      addEventListener: (name, fn) => {
        events[name] = fn;
      },
    };
    const guide = new ProfileLocationGuide(container, { definitionsUrl: "guide.json", onSelect: (id) => selected.push(id), onFixed: () => {} });
    const station = { dataset: { locationStation: "pressure_belt_j" } };
    events.click({ target: { closest: (selector) => (selector === "[data-location-station]" ? station : null) } });
    let prevented = false;
    events.keydown({
      target: { tagName: "g", closest: () => station },
      key: "Enter",
      preventDefault: () => {
        prevented = true;
      },
    });
    assert.deepEqual(selected, ["pressure_belt_j", "pressure_belt_j"]);
    assert.ok(prevented);
    const first = guide.update({ datasetId: "hiliftaeroml", quantity: "cp", stationId: "pressure_belt_a" });
    const second = guide.update({ datasetId: "hiliftaeroml", quantity: "cp", stationId: "pressure_belt_j" });
    resolve({ ok: true, json: async () => hilift });
    await Promise.all([first, second]);
    assert.ok(container.innerHTML.includes('data-location-station="pressure_belt_j" aria-pressed="true"'));
    assert.ok(!container.innerHTML.includes('data-location-station="pressure_belt_a" aria-pressed="true"'));
  } finally {
    global.fetch = oldFetch;
    global.document = oldDocument;
  }
});
