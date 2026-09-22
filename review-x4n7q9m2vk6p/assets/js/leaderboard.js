(function () {
  "use strict";

  const baseUrl = window.FluidsBenchLeaderboardBaseUrl;
  const manifestUrl = window.FluidsBenchLeaderboardManifestUrl;
  const expectedManifestSha256 = String(window.FluidsBenchLeaderboardManifestSha256 || "").trim();
  const groundTruthBaseUrl = window.FluidsBenchProfileGroundTruthBaseUrl;
  const leaderboardDisplay = window.FluidsBenchLeaderboardDisplay || {};
  const palette = [
    "#0072b2",
    "#d55e00",
    "#009e73",
    "#cc79a7",
    "#e69f00",
    "#56b4e9",
    "#f0e442",
    "#000000",
    "#6f4e7c",
    "#2f4b7c",
    "#8c564b",
    "#17becf",
  ];
  const maxFigureModels = palette.length;
  const maxRadarModels = 4;
  const defaultRadarModels = 3;
  const nativeProfileTruthSchemas = {
    2: {
      index: "fluidsbench-drivaerml-native-profile-truth-index-v2",
      split: "fluidsbench-drivaerml-native-profile-truth-split-index-v2",
      chunk: "fluidsbench-drivaerml-native-profile-truth-chunk-v2",
      version: "2.0",
    },
    3: {
      index: "fluidsbench-drivaerml-native-profile-truth-index-v3",
      split: "fluidsbench-drivaerml-native-profile-truth-split-index-v3",
      chunk: "fluidsbench-drivaerml-native-profile-truth-chunk-v3",
      version: "3.0",
    },
  };
  const drivaermlRelativeProfileSchemaVersion = "3.0-drivaerml-relative-candidate";
  const hiLiftCompactTruthSchemas = {
    master: "fluidsbench-hiliftaeroml-compact-profile-truth-master-index-v1",
    index: "fluidsbench-hiliftaeroml-compact-profile-truth-index-v1",
    chunk: "fluidsbench-hiliftaeroml-compact-profile-truth-chunk-v1",
    format: "fluidsbench-hiliftaeroml-compact-profile-truth-v1",
    version: "1.0",
  };
  const hiLiftCompactPredictionFormat = "fluidsbench-hiliftaeroml-compact-profile-chunks-v2-candidate";
  const hiLiftCompactProfileContractId = "hiliftaeroml-compact-profile-predictions-v2-candidate";
  const hiLiftCompactProfileContractSha256 = "b1fd29b2cb6c1c84c694ddffc5d85f6cd68fd175b79c3695a443aa78bf962c2f";
  const hiLiftVelocityStorageEncoding = "little_endian_float32_bits_unsigned_delta_modulo_2pow32_byte_shuffle_v1";
  const hiLiftCompactTruthReleaseId = "hiliftaeroml-compact-profile-truth-all1355-v1";
  const hiLiftCompactTruthCaseCount = 1355;
  const hiLiftCompactTruthCaseSetCount = 8;
  const ahmedNativeTruthSchemas = {
    master: "fluidsbench-ahmedml-native-profile-truth-master-index-v1",
    index: "fluidsbench-ahmedml-native-profile-truth-index-v1",
    chunk: "fluidsbench-ahmedml-native-profile-truth-chunk-v1",
    version: "1.0",
  };
  const ahmedNativeTruthReleaseId = "ahmedml-native-profile-truth-all316-v1-candidate";
  const ahmedNativeDatasetRevision = "02688c727cdb8dc8678e28abc6bbbb7e93c5fa15";
  const ahmedNativeSourceIdentitySha256 = "56a620a5b335cef6cb0587e186df321eb907bbe46e8b81aa4de302b8fe73cf44";
  const ahmedNativeProfileDefinitionSha256 = "1048a0380f70de778e3e51db07d6910579f720d6f2dd1d9ad7179dbfe88d1cae";
  const ahmedNativeTruthSource = {
    source_kind: "native_cfd",
    analytical_dummy: false,
    native_quantity_source: "pinned_ahmedml_cell_data_via_frozen_evaluator_mapping",
  };
  const ahmedNativeSeriesContract = [
    ["pressure_profiles", "upper_body_centerline", "cp", "x_over_l", 0, 1],
    ["pressure_profiles", "underbody_centerline", "cp", "x_over_l", 0, 1],
    ["pressure_profiles", "rear_slant_centerline", "cp", "s_over_slant", 0, 1],
    ["velocity_profiles", "wake_vertical_x_0p25_l", "ux_over_uinf", "z_over_h", 0, 2],
    ["velocity_profiles", "wake_vertical_x_0p50_l", "ux_over_uinf", "z_over_h", 0, 2],
    ["velocity_profiles", "wake_vertical_x_1p00_l", "ux_over_uinf", "z_over_h", 0, 2],
    ["velocity_profiles", "wake_lateral_x_0p50_l_z_0p50_h", "ux_over_uinf", "y_over_w", -1, 1],
  ];
  const hiLiftCpStationIds = Array.from("abcdefghij", (letter) => `pressure_belt_${letter}`);
  const hiLiftVelocityStations = [
    ["B.2", "hlpw5_b_2"],
    ["B.3", "hlpw5_b_3"],
    ["C.1", "hlpw5_c_1"],
    ["C.2", "hlpw5_c_2"],
    ["C.3", "hlpw5_c_3"],
  ];
  const nativeDrivaermlDatasetRevision = "7a5c0948ce27be709b1116a3a190f806e7a8f79f";
  const nativeDrivaermlSourcePinSha256 = "4fc9077f8f23f4994c98f4d0e7a17aef7b998de4c996638e3a8a616b6d923fdd";
  const coordinateIdentityDomain = "fluidsbench-drivaerml-coordinate-array-v1\u0000";
  const nativeProfileTruthSource = {
    source_kind: "native_cfd",
    analytical_dummy: false,
    native_quantity_source: "pinned_drivaerml_cell_data",
  };
  const sha256Pattern = /^[a-f0-9]{64}$/;
  const regionalPalette = ["#0072b2", "#d55e00", "#009e73", "#cc79a7"];
  const regionalDatasets = {
    drivaerml: {
      reportSchema: "drivaerml-regional-aggregate-v2",
      schemaVersion: 2,
      contractSha256: "2bfd372817989112642056e4c76cfb418dbdcee445c57ee20ca37ee9ca158583",
      layout: "supports",
      fields: {
        surface_pressure: {
          id: "surface_pressure",
          reportFieldId: "surface_pressure",
          label: "Surface pressure",
          domain: "surface",
          supportId: "drivaerml-surface-four-geometric-regions-v1",
          globalMetricId: "surface_pressure_rel_l2",
        },
        surface_wall_shear: {
          id: "surface_wall_shear",
          reportFieldId: "surface_wall_shear",
          label: "Surface wall shear",
          domain: "surface",
          supportId: "drivaerml-surface-four-geometric-regions-v1",
          globalMetricId: "surface_wall_shear_rel_l2",
        },
        volume_pressure: {
          id: "volume_pressure",
          reportFieldId: "volume_pressure",
          label: "Volume pressure",
          domain: "volume",
          supportId: "drivaerml-volume-four-geometric-regions-v1",
          globalMetricId: "volume_pressure_rel_l2",
        },
        volume_velocity: {
          id: "volume_velocity",
          reportFieldId: "volume_velocity",
          label: "Volume velocity",
          domain: "volume",
          supportId: "drivaerml-volume-four-geometric-regions-v1",
          globalMetricId: "volume_velocity_rel_l2",
        },
      },
    },
    ahmedml: {
      reportSchema: "ahmedml-regional-diagnostics-aggregate-v2",
      schemaVersion: 2,
      contractSha256: "467cf92356aa7bca0f6b1745f0ae756b1e3dacdb02d29ce61bc25da653e5b4b6",
      definitionId: "ahmedml-native-regions-v2-candidate",
      layout: "supports",
      supports: {
        "ahmedml-surface-four-normal-regions-v1": {
          definitionSha256: "467cf92356aa7bca0f6b1745f0ae756b1e3dacdb02d29ce61bc25da653e5b4b6",
          primaryWeighting: "physical",
          regions: ["streamwise_facing", "lateral_facing", "upward_facing", "downward_facing"],
        },
        "ahmedml-volume-three-geometric-regions-v1": {
          definitionSha256: "338db5b806caec2883e2583e491b751546624d3f101c04ae644cf9357b1275d7",
          primaryWeighting: "equal_entity",
          regions: ["near_body", "wake", "farfield"],
        },
      },
      fields: {
        surface_pressure: {
          id: "surface_pressure",
          reportFieldId: "surface_pressure",
          label: "Surface pressure",
          domain: "surface",
          supportId: "ahmedml-surface-four-normal-regions-v1",
          globalMetricId: "surface_pressure_rel_l2",
        },
        surface_wall_shear: {
          id: "surface_wall_shear",
          reportFieldId: "surface_wall_shear",
          label: "Surface wall shear",
          domain: "surface",
          supportId: "ahmedml-surface-four-normal-regions-v1",
          globalMetricId: "surface_wall_shear_rel_l2",
        },
        volume_pressure: {
          id: "volume_pressure",
          reportFieldId: "volume_pressure",
          label: "Volume pressure",
          domain: "volume",
          supportId: "ahmedml-volume-three-geometric-regions-v1",
          globalMetricId: "volume_pressure_rel_l2",
        },
        volume_velocity: {
          id: "volume_velocity",
          reportFieldId: "volume_velocity",
          label: "Volume velocity",
          domain: "volume",
          supportId: "ahmedml-volume-three-geometric-regions-v1",
          globalMetricId: "volume_velocity_rel_l2",
        },
      },
    },
    hiliftaeroml: {
      reportSchema: "hiliftaeroml-regional-diagnostics-aggregate-v2",
      schemaVersion: 2,
      contractSha256: "8cf926d06706b8cc7fd58d821f395bf8cb6565ef1f3aabe6be18e0a279101da4",
      definitionId: "hiliftaeroml-native-geometric-regions-v1",
      layout: "domains",
      fields: {
        surface_pressure: {
          id: "surface_pressure",
          reportFieldId: "pressure",
          label: "Surface pressure",
          domain: "surface",
          supportId: "surface_native_points",
          primaryWeighting: "physical",
          primaryWeightingLabel: "dual-area weighting",
        },
        surface_wall_shear: {
          id: "surface_wall_shear",
          reportFieldId: "tau_wall",
          label: "Surface wall shear",
          domain: "surface",
          supportId: "surface_native_points",
          primaryWeighting: "physical",
          primaryWeightingLabel: "dual-area weighting",
        },
        volume_pressure: {
          id: "volume_pressure",
          reportFieldId: "pressure",
          label: "Volume pressure",
          domain: "volume",
          supportId: "volume_native_valid_points",
          primaryWeighting: "equal_entity",
          primaryWeightingLabel: "equal valid native points",
          primaryRegionalMetric: "case_macro_whole_support_normalized_rmse_percent",
        },
        volume_velocity: {
          id: "volume_velocity",
          reportFieldId: "velocity",
          label: "Volume velocity",
          domain: "volume",
          supportId: "volume_native_valid_points",
          primaryWeighting: "equal_entity",
          primaryWeightingLabel: "equal valid native points",
          primaryRegionalMetric: "case_macro_whole_support_normalized_rmse_percent",
        },
      },
      supports: {
        surface_native_points: {
          guide: "hilift_surface",
          semanticLimit:
            "These are frozen checkpoint-normalized Cartesian envelopes, not CAD-part, CFD-patch, slat, flap, wing, nacelle, or installation labels. The remainder contains every native surface point outside the first three proxy envelopes.",
          regions: [
            {
              region_id: "nacelle_installation_envelope_proxy",
              predicate: "−2.00 ≤ x < 0.25; −0.75 ≤ y < 0.05; −0.75 ≤ z < 0.10",
            },
            {
              region_id: "inboard_high_lift_envelope_proxy",
              predicate: "−1.75 ≤ x < 1.85; −1.35 ≤ y < −0.25; −0.35 ≤ z < 0.35; after higher-priority regions",
            },
            {
              region_id: "outboard_high_lift_envelope_proxy",
              predicate: "−1.75 ≤ x < 1.85; −0.25 ≤ y < 2.50; −0.35 ≤ z < 0.35; after higher-priority regions",
            },
            {
              region_id: "fuselage_tail_and_remaining",
              predicate: "All remaining native surface points",
            },
          ],
        },
        volume_native_valid_points: {
          guide: "hilift_volume",
          semanticLimit:
            "The aft-airframe wake is a frozen body-frame Cartesian proxy, not a streamline-, vortex-, boundary-layer-, or topology-derived wake label. Signed distance is measured to the complete case-local STL rather than to an individual high-lift component.",
          regions: [
            {
              region_id: "near_airframe_sdf_band",
              predicate: "|signed distance| < 0.02",
            },
            {
              region_id: "aft_airframe_wake_envelope_proxy",
              predicate: "1.50 ≤ x < 5.00; |y| < 2.75; −1.50 ≤ z < 1.50; outside the SDF band",
            },
            {
              region_id: "near_aircraft_flow_envelope",
              predicate: "−5.00 ≤ x < 5.00; |y| < 5.00; −4.00 ≤ z < 4.00; after higher-priority regions",
            },
            {
              region_id: "farfield_and_remaining",
              predicate: "All remaining retained native volume points",
            },
          ],
        },
      },
    },
  };
  // Retain the original exported alias for the contract test and older callers.
  const regionalFields = regionalDatasets.drivaerml.fields;
  const drivaermlRelativeVelocityStationIds = ["V1", "V2", "V3", "V4", "V5", "V6", "U1", "U2", "U3", "U4", "U5", "U6", "L1", "R1", "R2", "R3"];
  const drivaermlRelativeCpStationIds = [
    "upperbody_centerline",
    "underbody_centerline",
    "sidewall_front_wheelhouse_relative",
    "front_left_wheelhouse_relative",
  ];
  const reproducibilityContractVersions = {
    2: "open-reproducibility-2.0",
    3: "open-reproducibility-3.0",
  };
  const columnGroups = [
    { id: "absolute", label: "Absolute", className: "metric-group-absolute" },
    { id: "relative", label: "Relative", className: "metric-group-relative" },
    { id: "integral", label: "Integral forces / moments", className: "metric-group-integral" },
    { id: "diagnostics", label: "Diagnostics", className: "metric-group-diagnostics" },
    { id: "scores", label: "Scores", className: "metric-group-scores" },
    { id: "model-details", label: "Model details", className: "metric-group-neutral" },
  ];

  const state = {
    manifest: null,
    metrics: new Map(),
    rows: new Map(),
    revisionRows: new Map(),
    revisionHistoryLoaded: false,
    loadedRevisionHistorySha256: null,
    revisionHistoryVerified: false,
    loadedManifestSha256: null,
    manifestPinVerified: false,
    groundTruthManifest: null,
    groundTruthIndexes: new Map(),
    groundTruthChunks: new Map(),
    profileIndexes: new Map(),
    profileChunks: new Map(),
    profileArtifacts: new Map(),
    feedRowsLoaded: false,
    loadedFeedSha256: null,
    feedVerified: false,
    groundTruthManifestProvenance: null,
    groundTruthComparisonHealthy: false,
    groundTruthComparisonKey: "",
    groundTruthComparisonCaseSetId: "",
    validationEvidenceChecks: new Map(),
    validationEvidencePromises: new Map(),
    claimsIndex: null,
    claimsIndexProvenance: null,
    claimsIndexPromise: null,
    claimRecords: new Map(),
    claimRecordPromises: new Map(),
    dataset: "",
    split: "",
    modelType: "",
    showAllVersions: false,
    sortKey: "rank",
    sortDirection: "asc",
    metricView: "summary",
    workspaceView: "leaderboard",
    computeMode: "inference",
    computeAxis: "wall",
    computeHardware: "",
    computeSort: "score",
    analysisView: "comparison",
    profilePanelIndex: 0,
    visibleGroups: new Set(),
    exportScope: "current",
    radarModelIds: new Set(),
    comparedModelIds: new Set(),
    staleComparedModelIds: new Set(),
    comparisonMetric: "",
    scatterX: "",
    scatterY: "",
    panelSelections: new Map(),
    profileCaseIds: [],
    profileCase: "",
    groundTruthCase: null,
    profileCases: new Map(),
    profileCaseErrors: new Map(),
    regionalReports: new Map(),
    regionalReportPromises: new Map(),
    regionalLoadVersion: 0,
    charts: {},
    figureSpecs: new Map(),
    figureCaptions: new Map(),
    resultId: "",
    requestedReleaseId: "",
    requestedResultId: "",
    releaseMismatch: false,
    resultUnavailable: false,
    loadVersion: 0,
    profileLoadVersion: 0,
    profileReadyVersion: -1,
  };
  let helpHideTimer = null;
  let activeHelpButton = null;

  function element(id) {
    return document.getElementById(id);
  }

  function datasetSelects() {
    return document.querySelectorAll("[data-leaderboard-dataset-select]");
  }

  function splitSelects() {
    return document.querySelectorAll("[data-leaderboard-split-select]");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formattedMetricLabelHtml(value) {
    return escapeHtml(value).replace(/\bC_([DLM])\b/g, "C<sub>$1</sub>");
  }

  function appendFormattedMetricLabel(parent, value) {
    const label = document.createElement("span");
    label.className = "leaderboard-metric-label";
    label.innerHTML = formattedMetricLabelHtml(value);
    parent.appendChild(label);
  }

  function plainMetricLabel(definition) {
    return definition?.plain_label || definition?.label || "";
  }

  function slug(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function finiteNumber(value) {
    if (value === null || value === undefined || typeof value === "boolean") return null;
    if (typeof value === "string" && !value.trim()) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function validSha256(value) {
    return sha256Pattern.test(String(value || "")) && !/^0{64}$/.test(String(value));
  }

  function exactNativeTruthSource(value) {
    return (
      value?.source_kind === nativeProfileTruthSource.source_kind &&
      value?.analytical_dummy === false &&
      value?.native_quantity_source === nativeProfileTruthSource.native_quantity_source &&
      Object.keys(value || {}).length === 3
    );
  }

  function exactAhmedNativeTruthSource(value) {
    return (
      value?.source_kind === ahmedNativeTruthSource.source_kind &&
      value?.analytical_dummy === false &&
      value?.native_quantity_source === ahmedNativeTruthSource.native_quantity_source &&
      Object.keys(value || {}).length === 3
    );
  }

  function activeDatasetSlug() {
    return activeDataset()?.slug || slug(state.dataset || "");
  }

  function profileFamilies(panel) {
    if (activeDatasetSlug() === "windsorml") {
      return (panel.families || []).map((family) => ({
        id: family.id,
        placementMode: family.placement_mode,
        label: family.label,
        description: family.description,
        stations: family.stations,
      }));
    }
    if (activeDatasetSlug() !== "drivaerml") {
      return [
        {
          id: "",
          placementMode: "",
          label: "",
          description: "",
          stations: panel.stations || [],
        },
      ];
    }
    if (panel.id === "velocity_profiles") {
      const constantStations = panel.stations || [];
      const relativeStations = drivaermlRelativeVelocityStationIds.map((stationId) => {
        const constantId = `autocfd5_${stationId.toLowerCase()}`;
        const constantStation = constantStations.find((station) => station.id === constantId) || {};
        return {
          ...constantStation,
          id: stationId,
          label: `Geometry-relative ${stationId}`,
          x_label: "Normalized arc length along geometry-relative line",
          description: `${stationId} follows the retained geometry-relative placement for this case. This diagnostic is not scored.`,
        };
      });
      return [
        {
          id: "drivaerml-autocfd5-constant-v1",
          placementMode: "constant",
          label: "Fixed locations",
          description: "Pinned AutoCFD5 locations used by the current candidate diagnostic.",
          stations: constantStations,
        },
        {
          id: "drivaerml-velocity-relative-v3",
          placementMode: "relative",
          label: "Geometry-relative locations — diagnostic, not scored",
          description: "Geometry-relative placement is report-only and does not activate or change scoring.",
          stations: relativeStations,
        },
      ];
    }
    if (panel.id === "pressure_profiles") {
      const constantStations = (panel.stations || []).map((station) => ({
        ...station,
        description: "Continuous native-surface Cp cut on retained producer support.",
      }));
      const relativeStations = drivaermlRelativeCpStationIds.map((stationId) => {
        const canonical = constantStations.find((station) => station.id === stationId);
        if (canonical) {
          return {
            ...canonical,
            description: `${
              canonical.description || canonical.label
            } This shared centreline support is shown in the report-only geometry-relative family.`,
          };
        }
        const wheelhouse = stationId === "front_left_wheelhouse_relative";
        return {
          id: stationId,
          label: wheelhouse ? "Geometry-relative front-left wheelhouse" : "Geometry-relative sidewall / front wheelhouse",
          x_label: "Ordered local arc length within each disconnected native-surface interval, m",
          description: "Materialized moving native-surface Cp cut. Disconnected producer intervals remain separate. This diagnostic is not scored.",
        };
      });
      return [
        {
          id: "drivaerml_cp_constant_v1",
          placementMode: "constant",
          label: "Fixed locations",
          description: "",
          stations: constantStations,
        },
        {
          id: "drivaerml_cp_relative_v1",
          placementMode: "relative",
          label: "Geometry-relative locations — diagnostic, not scored",
          description: "Geometry-relative Cp placement is report-only and does not activate or change scoring.",
          stations: relativeStations,
        },
      ];
    }
    return [{ id: "", placementMode: "", label: "", description: "", stations: panel.stations || [] }];
  }

  function selectedProfileFamily(panel) {
    const families = profileFamilies(panel);
    const selection = panelSelection(panel);
    return families.find((family) => family.id === selection.family) || families[0];
  }

  function profileStations(panel, family = selectedProfileFamily(panel)) {
    return family?.stations || panel.stations || [];
  }

  function isDrivaermlCpPanel(panel) {
    return activeDatasetSlug() === "drivaerml" && panel?.id === "pressure_profiles";
  }

  function profileCoordinateViews(panel) {
    if (!isDrivaermlCpPanel(panel)) return [{ id: "support", label: "Profile coordinate" }];
    return [
      { id: "physical_x", label: "Physical streamwise x coordinate, m" },
      { id: "arc_length", label: "Surface arc length (scoring coordinate), m" },
    ];
  }

  function defaultProfileCoordinateView(panel) {
    return isDrivaermlCpPanel(panel) ? "physical_x" : "support";
  }

  function resolvedProfileCoordinateView(panel, requestedView, series = null, station = null) {
    if (!isDrivaermlCpPanel(panel)) {
      return {
        id: "support",
        label: station?.x_label || series?.coordinateId || "Profile coordinate",
        coordinateId: series?.coordinateId || null,
        coordinateUnit: series?.coordinateUnit || null,
      };
    }
    const requested = profileCoordinateViews(panel).some((view) => view.id === requestedView) ? requestedView : defaultProfileCoordinateView(panel);
    if (requested === "physical_x" && Array.isArray(series?.displayCoordinates)) {
      return {
        id: "physical_x",
        label: "Physical streamwise x coordinate, m",
        coordinateId: series.displayCoordinateId,
        coordinateUnit: series.displayCoordinateUnit,
      };
    }
    return {
      id: "arc_length",
      label: "Surface arc length (scoring coordinate), m",
      coordinateId: series?.coordinateId || "arc_length_m",
      coordinateUnit: series?.coordinateUnit || "m",
    };
  }

  function profilePointForCoordinateView(point, coordinateView) {
    if (point?.gapSeparator) return { ...point, x: null, y: null };
    const x = coordinateView?.id === "physical_x" ? point?.displayCoordinate : point?.coordinate;
    if (typeof x !== "number" || !Number.isFinite(x)) {
      throw new Error(`profile ${coordinateView?.id || "support"} coordinate is unavailable or non-finite`);
    }
    return { ...point, x };
  }

  function projectProfileSeries(series, coordinateView) {
    return {
      points: series.points.map((point) => profilePointForCoordinateView(point, coordinateView)),
      chartPoints: series.chartPoints.map((point) => profilePointForCoordinateView(point, coordinateView)),
    };
  }

  function profileTooltipLines(dataset, point, panel, quantity, coordinateView) {
    const lines = [dataset?.label || "Series"];
    if (isDrivaermlCpPanel(panel) && typeof point?.displayCoordinate === "number") {
      lines.push(`Physical streamwise x coordinate, m: ${point.displayCoordinate}`);
      lines.push(`Surface arc length (scoring coordinate), m: ${point.coordinate}`);
    } else {
      lines.push(`${coordinateView?.label || "Profile coordinate"}: ${point?.x}`);
    }
    lines.push(`${quantity?.y_label || quantity?.label || "Value"}: ${point?.y}`);
    return lines;
  }

  function isLocalUrl(value) {
    try {
      return ["127.0.0.1", "localhost", "::1"].includes(new URL(value, window.location.href).hostname);
    } catch (_error) {
      return false;
    }
  }

  function leaderboardAssetBaseUrl() {
    if (isLocalUrl(baseUrl) || window.FluidsBenchLeaderboardPreviewMode === true) return baseUrl;
    return safeHttpUrl(dataRelease().asset_base_url) || baseUrl;
  }

  function declaredLeaderboardAssetUrl(file) {
    const declaredBase = safeHttpUrl(dataRelease().asset_base_url);
    return declaredBase ? fileUrl(file, declaredBase) : "";
  }

  function fileUrl(file, root = leaderboardAssetBaseUrl()) {
    const normalizedRoot = root.endsWith("/") ? root : `${root}/`;
    return new URL(file, normalizedRoot).href;
  }

  function dataRelease() {
    return state.manifest?.data_release || {};
  }

  function resultDataOriginLabel() {
    const origin = publicationScope().result_data_origin;
    if (origin === "submitter_provided") return "submitter-provided";
    if (origin === "illustrative_dummy_data") return "illustrative prototype";
    return humanize(origin || "not supplied").toLowerCase();
  }

  function publicationScope() {
    const prototype = dataRelease().status === "prototype_dummy_data";
    return {
      result_data_origin: prototype ? "illustrative_dummy_data" : "submitter_provided",
      validation_scope: prototype ? "not_applicable" : "submitted_data_only",
      model_execution: "not_performed",
      metric_recomputation: prototype ? "not_applicable" : "result_specific",
    };
  }

  function submissionSchemaMajor(row) {
    const major = Number(String(row?.schema_version || "1").split(".")[0]);
    return Number.isInteger(major) ? major : 1;
  }

  function expectedReproducibilityContract(row) {
    return reproducibilityContractVersions[submissionSchemaMajor(row)] || null;
  }

  function supportedReproducibilityContract(value) {
    return Object.values(reproducibilityContractVersions).includes(value);
  }

  function releaseViewUrl() {
    return safeHttpUrl(dataRelease().release_view_url);
  }

  function groundTruthManifestVerified() {
    const expected = dataRelease().profile_ground_truth || {};
    const loaded = state.groundTruthManifestProvenance || {};
    return Boolean(
      expected.release_id && expected.manifest_sha256 && loaded.release_id === expected.release_id && loaded.sha256 === expected.manifest_sha256
    );
  }

  function releaseGroundTruthManifestUrl() {
    const declared = safeHttpUrl(dataRelease().profile_ground_truth?.manifest_url);
    const localOrPrototype = isLocalUrl(groundTruthBaseUrl) || dataRelease().status === "prototype_dummy_data";
    if (localOrPrototype) return fileUrl("manifest.json", groundTruthBaseUrl);
    return declared;
  }

  function currentGroundTruthComparisonKey() {
    return [dataRelease().id || "unversioned", state.dataset, state.split, state.profileCase].join("|");
  }

  function setGroundTruthComparisonHealth(healthy, caseSetId = "") {
    state.groundTruthComparisonHealthy = Boolean(healthy);
    state.groundTruthComparisonKey = healthy ? currentGroundTruthComparisonKey() : "";
    state.groundTruthComparisonCaseSetId = healthy ? caseSetId : "";
  }

  function activeSplitDefinition() {
    return splitOptions().find((split) => split.name === state.split);
  }

  function viewSearchParams(includeResult = true) {
    const params = new URLSearchParams();
    const dataset = activeDataset();
    const split = activeSplitDefinition();
    if (dataRelease().id) params.set("release", dataRelease().id);
    if (dataset) params.set("dataset", slug(dataset.name));
    if (split) params.set("split", split.id || slug(split.name));
    if (state.modelType) params.set("model_type", state.modelType);
    if (state.showAllVersions) params.set("versions", "all");
    params.set("sort", state.sortKey);
    params.set("direction", state.sortDirection);
    params.set("metric_view", state.metricView);
    params.set("view", state.workspaceView);
    if (state.computeMode !== "inference") params.set("compute", state.computeMode);
    if (state.computeAxis !== "wall") params.set("compute_axis", state.computeAxis);
    if (state.computeHardware) params.set("compute_hardware", state.computeHardware);
    if (state.computeSort !== "score") params.set("compute_sort", state.computeSort);
    params.set("analysis", state.analysisView);
    params.set("profile_view", String(state.profilePanelIndex));
    if (state.metricView === "full") {
      params.set(
        "columns",
        columnGroups
          .map(({ id }) => id)
          .filter((id) => state.visibleGroups.has(id))
          .join(",")
      );
    }
    params.set("models", Array.from(state.comparedModelIds).join(","));
    params.set(
      "radar_models",
      selectedRadarRows()
        .map((row) => row.id)
        .join(",")
    );
    if (state.comparisonMetric) params.set("comparison", state.comparisonMetric);
    if (state.scatterX) params.set("scatter_x", state.scatterX);
    if (state.scatterY) params.set("scatter_y", state.scatterY);
    if (state.profileCase) params.set("case", state.profileCase);
    (dataset?.diagnostic_panels || []).forEach((panel) => {
      const selection = panelSelection(panel);
      if (selection.family) params.set(`family_${panel.id}`, selection.family);
      if (selection.quantity) params.set(`quantity_${panel.id}`, selection.quantity);
      if (selection.station) params.set(`station_${panel.id}`, selection.station);
      if (selection.coordinateView) params.set(`coordinate_${panel.id}`, selection.coordinateView);
    });
    if (includeResult && state.resultId) params.set("result", state.resultId);
    return params;
  }

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    return {
      releaseId: params.get("release") || "",
      dataset: params.get("dataset") || "",
      split: params.get("split") || "",
      modelType: params.get("model_type") || "",
      showAllVersions: params.get("versions") === "all",
      sortKey: params.get("sort") || "",
      sortDirection: params.get("direction") || "",
      metricView: params.get("metric_view") === "full" ? "full" : "summary",
      hasMetricView: params.has("metric_view"),
      visibleGroups: (params.get("columns") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      hasVisibleGroups: params.has("columns"),
      comparedModelIds: (params.get("models") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      hasComparedModelIds: params.has("models"),
      radarModelIds: (params.get("radar_models") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      hasRadarModelIds: params.has("radar_models"),
      comparisonMetric: params.get("comparison") || "",
      scatterX: params.get("scatter_x") || "",
      scatterY: params.get("scatter_y") || "",
      profileCase: params.get("case") || "",
      resultId: params.get("result") || "",
      params,
    };
  }

  function updateUrl() {
    if (!state.dataset) return;
    const query = viewSearchParams().toString();
    window.history.replaceState(null, "", `${window.location.pathname}?${query}${window.location.hash}`);
  }

  function currentViewUrl(canonical = false, includeResult = true) {
    const root = canonical && dataRelease().canonical_url ? dataRelease().canonical_url : window.location.href;
    const url = new URL(root, window.location.href);
    url.search = viewSearchParams(includeResult).toString();
    url.hash = "";
    return url.href;
  }

  function resultUrl(row, canonical = false) {
    const verifiedClaim = verifiedClaimRecord(row);
    if (canonical && verifiedClaim?.result_permalink) return verifiedClaim.result_permalink;
    const immutablePermalink = canonicalResultPermalink(row);
    if (canonical && immutablePermalink) return immutablePermalink;
    const root = window.location.href;
    const url = new URL(root, window.location.href);
    const params = viewSearchParams(false);
    params.set("result", row.id);
    url.search = params.toString();
    url.hash = "";
    return url.href;
  }

  function canonicalResultPermalink(row) {
    if (!releaseViewUrl()) return "";
    const url = new URL(releaseViewUrl(), window.location.href);
    ["view", "dataset", "split", "result"].forEach((key) => url.searchParams.delete(key));
    url.searchParams.append("view", "result");
    url.searchParams.append("dataset", row.dataset_id || slug(row.dataset));
    url.searchParams.append("split", row.split_id || slug(row.split));
    url.searchParams.append("result", row.id);
    url.hash = "";
    return url.href;
  }

  function citedViewUrl() {
    const url = new URL(releaseViewUrl() || window.location.href, window.location.href);
    const params = new URLSearchParams();
    const dataset = activeDataset();
    const split = activeSplitDefinition();
    if (dataset) params.set("dataset", dataset.slug || slug(dataset.name));
    if (split) params.set("split", split.id || slug(split.name));
    url.search = params.toString();
    url.hash = "";
    return url.href;
  }

  async function sha256Hex(value) {
    if (!window.crypto?.subtle) return null;
    const digest = await window.crypto.subtle.digest("SHA-256", value);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function coordinateArrayIdentitySha256(values) {
    if (!Array.isArray(values) || values.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
      throw new Error("profile coordinate array cannot be encoded as finite binary64 values");
    }
    const domain = new TextEncoder().encode(coordinateIdentityDomain);
    const encoded = new ArrayBuffer(domain.length + 8 + values.length * 8);
    const bytes = new Uint8Array(encoded);
    bytes.set(domain);
    const view = new DataView(encoded);
    view.setBigUint64(domain.length, BigInt(values.length), false);
    values.forEach((rawValue, index) => {
      const value = Object.is(rawValue, -0) ? 0 : rawValue;
      view.setFloat64(domain.length + 8 + index * 8, value, false);
    });
    const identity = await sha256Hex(encoded);
    if (!validSha256(identity)) throw new Error("this browser cannot verify canonical profile coordinate identities");
    return identity;
  }

  async function bindProfileCoordinateIdentities(profileCase) {
    for (const series of profileCase?.series || []) {
      if (series?.representation !== "materialized") continue;
      const identity = await coordinateArrayIdentitySha256(series.coordinate);
      if (Object.hasOwn(series, "_fluidsbenchCoordinateIdentitySha256")) {
        if (series._fluidsbenchCoordinateIdentitySha256 !== identity) {
          throw new Error("cached profile coordinate identity differs from recomputed bytes");
        }
      } else {
        Object.defineProperty(series, "_fluidsbenchCoordinateIdentitySha256", {
          configurable: false,
          enumerable: false,
          value: identity,
          writable: false,
        });
      }
      if (Object.hasOwn(series, "display_coordinate")) {
        const displayIdentity = await coordinateArrayIdentitySha256(series.display_coordinate);
        if (Object.hasOwn(series, "_fluidsbenchDisplayCoordinateIdentitySha256")) {
          if (series._fluidsbenchDisplayCoordinateIdentitySha256 !== displayIdentity) {
            throw new Error("cached profile display-coordinate identity differs from recomputed bytes");
          }
        } else {
          Object.defineProperty(series, "_fluidsbenchDisplayCoordinateIdentitySha256", {
            configurable: false,
            enumerable: false,
            value: displayIdentity,
            writable: false,
          });
        }
      }
    }
    return profileCase;
  }

  function nativeProfileTruthVersion(document, kind) {
    for (const [rawVersion, schemas] of Object.entries(nativeProfileTruthSchemas)) {
      if (document?.schema === schemas[kind] && document?.schema_version === schemas.version) return Number(rawVersion);
    }
    return null;
  }

  function isNativeProfileTruthSplitIndex(index) {
    return nativeProfileTruthVersion(index, "split") !== null;
  }

  async function fetchJsonWithProvenance(url, label) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(bytes);
    return { data: JSON.parse(text), text, sha256: await sha256Hex(bytes) };
  }

  async function inflateRawProfileBytes(bytes, label) {
    if (typeof DecompressionStream !== "function") {
      throw new Error(`${label} requires browser support for raw DEFLATE streams`);
    }
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      const reader = stream.getReader();
      const chunks = [];
      let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
        chunks.push(chunk);
        size += chunk.length;
      }
      const inflated = new Uint8Array(size);
      let offset = 0;
      chunks.forEach((chunk) => {
        inflated.set(chunk, offset);
        offset += chunk.length;
      });
      return inflated;
    } catch (error) {
      throw new Error(`${label} contains an unreadable DEFLATE member: ${error.message}`);
    }
  }

  function parseNpyProfileArray(bytes, label) {
    const magic = [0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59];
    if (bytes.length < 10 || magic.some((value, index) => bytes[index] !== value)) {
      throw new Error(`${label} is not a NumPy NPY array`);
    }
    const major = bytes[6];
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let headerLength;
    let headerStart;
    if (major === 1) {
      headerLength = view.getUint16(8, true);
      headerStart = 10;
    } else if (major === 2 || major === 3) {
      if (bytes.length < 12) throw new Error(`${label} has a truncated NPY header`);
      headerLength = view.getUint32(8, true);
      headerStart = 12;
    } else {
      throw new Error(`${label} uses unsupported NPY version ${major}.${bytes[7]}`);
    }
    const dataStart = headerStart + headerLength;
    if (dataStart > bytes.length) throw new Error(`${label} has a truncated NPY header body`);
    const header = new TextDecoder(major === 3 ? "utf-8" : "latin1").decode(bytes.subarray(headerStart, dataStart));
    const dtype = header.match(/['"]descr['"]\s*:\s*['"]([^'"]+)['"]/)?.[1];
    const fortran = header.match(/['"]fortran_order['"]\s*:\s*(True|False)/)?.[1];
    const rawShape = header.match(/['"]shape['"]\s*:\s*\(([^)]*)\)/)?.[1];
    if (!dtype || fortran !== "False" || rawShape === undefined) {
      throw new Error(`${label} has an unsupported NPY header`);
    }
    const shape = rawShape
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map(Number);
    if (shape.length !== 1 || !Number.isSafeInteger(shape[0]) || shape[0] < 0) {
      throw new Error(`${label} must be a one-dimensional C-order array`);
    }
    const readers = {
      "<i2": { size: 2, read: (offset) => view.getInt16(offset, true) },
      "<i4": { size: 4, read: (offset) => view.getInt32(offset, true) },
      "|u1": { size: 1, read: (offset) => view.getUint8(offset) },
      "|b1": { size: 1, read: (offset) => Boolean(view.getUint8(offset)) },
      "<f4": { size: 4, read: (offset) => view.getFloat32(offset, true) },
    };
    const reader = readers[dtype];
    if (!reader) throw new Error(`${label} uses unsupported NumPy dtype ${dtype}`);
    if (dataStart + shape[0] * reader.size !== bytes.length) {
      throw new Error(`${label} NPY payload size differs from its declared shape and dtype`);
    }
    const values = new Array(shape[0]);
    for (let index = 0; index < values.length; index += 1) {
      values[index] = reader.read(dataStart + index * reader.size);
    }
    return { dtype, shape, values };
  }

  async function parseNpzProfileArtifact(buffer, label) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const arrays = new Map();
    let offset = 0;
    while (offset + 4 <= bytes.length) {
      const signature = view.getUint32(offset, true);
      if (signature === 0x02014b50 || signature === 0x06054b50) break;
      if (signature !== 0x04034b50 || offset + 30 > bytes.length) {
        throw new Error(`${label} has an unsupported or truncated ZIP member header`);
      }
      const flags = view.getUint16(offset + 6, true);
      const compression = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const uncompressedSize = view.getUint32(offset + 22, true);
      const nameLength = view.getUint16(offset + 26, true);
      const extraLength = view.getUint16(offset + 28, true);
      if (flags & 0x0001 || flags & 0x0008) throw new Error(`${label} uses encrypted or data-descriptor ZIP members`);
      if (compression !== 0 && compression !== 8) throw new Error(`${label} uses unsupported ZIP compression method ${compression}`);
      const nameStart = offset + 30;
      const dataStart = nameStart + nameLength + extraLength;
      const dataStop = dataStart + compressedSize;
      if (dataStop > bytes.length) throw new Error(`${label} has a truncated ZIP member`);
      const name = new TextDecoder("utf-8").decode(bytes.subarray(nameStart, nameStart + nameLength));
      if (!/^[A-Za-z0-9_]+\.npy$/.test(name)) throw new Error(`${label} contains unsupported member ${name || "<empty>"}`);
      const arrayName = name.slice(0, -4);
      if (arrays.has(arrayName)) throw new Error(`${label} contains duplicate array ${arrayName}`);
      const compressed = bytes.slice(dataStart, dataStop);
      const payload = compression === 0 ? compressed : await inflateRawProfileBytes(compressed, `${label}/${name}`);
      if (payload.length !== uncompressedSize) {
        throw new Error(`${label}/${name} uncompressed size ${payload.length} differs from its ZIP header ${uncompressedSize}`);
      }
      arrays.set(arrayName, parseNpyProfileArray(payload, `${label}/${name}`));
      offset = dataStop;
    }
    if (!arrays.size) throw new Error(`${label} contains no NumPy arrays`);
    return arrays;
  }

  async function fetchVerifiedProfileNpz(url, expectedSha256, label) {
    if (!validSha256(expectedSha256)) throw new Error(`${label} has no valid SHA-256 binding`);
    const key = `${url}|${expectedSha256}`;
    if (!state.profileArtifacts.has(key)) {
      state.profileArtifacts.set(
        key,
        (async () => {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
          const buffer = await response.arrayBuffer();
          const sha256 = await sha256Hex(buffer);
          if (sha256 !== expectedSha256) throw new Error(`${label} checksum does not match its JSON binding`);
          return { arrays: await parseNpzProfileArtifact(buffer, label), sha256, url, byteLength: buffer.byteLength };
        })()
      );
    }
    return state.profileArtifacts.get(key);
  }

  function regionalDatasetDefinition(value = activeDatasetSlug()) {
    return regionalDatasets[slug(value || "")] || null;
  }

  function regionalFieldsForDataset(value = activeDatasetSlug()) {
    return record(regionalDatasetDefinition(value)?.fields);
  }

  function regionalBinding(row) {
    const binding = record(row?.regional_diagnostics);
    const definition = regionalDatasetDefinition(row?.dataset_id);
    if (
      !definition ||
      binding.format !== definition.reportSchema ||
      binding.contract_sha256 !== definition.contractSha256 ||
      (definition.definitionId && binding.definition_id !== definition.definitionId) ||
      binding.role !== "report_only" ||
      binding.weight !== 0 ||
      binding.official_score_changed !== false ||
      !Number.isSafeInteger(binding.case_count) ||
      binding.case_count < 1 ||
      !validSha256(binding.sha256) ||
      typeof binding.file !== "string" ||
      !binding.file
    ) {
      return null;
    }
    return binding;
  }

  function regionalReportUrl(row) {
    const binding = regionalBinding(row);
    return binding ? fileUrl(submissionAssetPath(row, binding.file)) : "";
  }

  function regionalScope(row) {
    return row?.prediction_scope === "surface_only" ? "surface_only" : "surface_and_volume";
  }

  function fractionsReconstruct(regions, key) {
    const values = regions.map((region) => finiteNumber(region?.[key]));
    return values.every((value) => value !== null && value >= 0) && Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) <= 1e-8;
  }

  function validHiLiftCaseMacroMetric(value, caseCount, allowNegative = false) {
    const metric = record(value);
    const numeric = finiteNumber(metric.value);
    const count = metric.defined_case_count;
    return (
      Number.isSafeInteger(count) &&
      count >= 0 &&
      count <= caseCount &&
      ((count === 0 && numeric === null) || (count > 0 && numeric !== null && (allowNegative || numeric >= 0)))
    );
  }

  function validHiLiftCaseDistribution(value, caseCount, allowNegative = false) {
    const distribution = record(value);
    const count = distribution.defined_case_count;
    const values = ["minimum", "median", "p90", "maximum"].map((key) => finiteNumber(distribution[key]));
    if (!Number.isSafeInteger(count) || count < 0 || count > caseCount) return false;
    if (count === 0) return values.every((item) => item === null);
    if (values.some((item) => item === null || (!allowNegative && item < 0))) return false;
    return values.every((item, index) => index === 0 || values[index - 1] <= item);
  }

  function validHiLiftRegionalReport(report, row, binding, definition) {
    const reconstruction = record(report.reconstruction);
    if (
      report.definition_id !== definition.definitionId ||
      report.split_id !== row?.split_id ||
      report.case_count !== binding.case_count ||
      !Array.isArray(report.case_ids) ||
      report.case_ids.length !== binding.case_count ||
      new Set(report.case_ids).size !== binding.case_count ||
      reconstruction.status !== "pass" ||
      reconstruction.checked_case_count !== binding.case_count ||
      !Number.isSafeInteger(reconstruction.checked_field_count) ||
      reconstruction.checked_field_count < 4
    ) {
      return false;
    }
    for (const [supportId, supportDefinition] of Object.entries(definition.supports || {})) {
      const domain = supportId === "surface_native_points" ? "surface" : "volume";
      const support = record(report[domain]);
      const expectedRegions = supportDefinition.regions.map((region) => region.region_id);
      if (
        support.support_id !== supportId ||
        !Array.isArray(support.region_order) ||
        support.region_order.length !== expectedRegions.length ||
        support.region_order.some((regionId, index) => regionId !== expectedRegions[index])
      ) {
        return false;
      }
      const requiredFields = Object.values(definition.fields)
        .filter((field) => field.supportId === supportId)
        .map((field) => field.reportFieldId);
      for (const fieldId of requiredFields) {
        const field = record(record(support.fields)[fieldId]);
        const regions = Array.isArray(field.regions) ? field.regions : [];
        const globalRelativeL2 = finiteNumber(record(field.global).relative_l2_percent);
        const reconstructedRelativeL2 = Math.sqrt(
          regions.reduce((sum, region) => {
            const fraction = finiteNumber(region?.weight_fraction);
            const value = finiteNumber(region?.whole_support_normalized_rmse_percent);
            return sum + (fraction === null || value === null ? Number.NaN : fraction * value * value);
          }, 0)
        );
        if (
          regions.length !== expectedRegions.length ||
          regions.some((region, index) => region?.region_id !== expectedRegions[index]) ||
          regions.some((region) =>
            ["whole_support_normalized_rmse_percent", "relative_l2_percent", "mae", "rmse"].some((metric) => {
              const value = finiteNumber(region?.[metric]);
              return value === null || value < 0;
            })
          ) ||
          regions.some((region) => {
            const r2 = finiteNumber(region?.r2);
            const r2Status = region?.r2_status;
            const macro = record(region?.case_macro);
            const distribution = record(region?.case_distribution);
            return (
              !["ok", "empty", "zero_target_variance"].includes(r2Status) ||
              (r2Status === "ok") !== (r2 !== null) ||
              !validHiLiftCaseMacroMetric(macro.whole_support_normalized_rmse_percent, binding.case_count) ||
              !validHiLiftCaseMacroMetric(macro.relative_l2_percent, binding.case_count) ||
              !validHiLiftCaseMacroMetric(macro.r2, binding.case_count, true) ||
              !validHiLiftCaseMacroMetric(macro.mae, binding.case_count) ||
              !validHiLiftCaseMacroMetric(macro.rmse, binding.case_count) ||
              !validHiLiftCaseDistribution(distribution.whole_support_normalized_rmse_percent, binding.case_count) ||
              !validHiLiftCaseDistribution(distribution.relative_l2_percent, binding.case_count) ||
              !validHiLiftCaseDistribution(distribution.r2, binding.case_count, true)
            );
          }) ||
          !fractionsReconstruct(regions, "entity_fraction") ||
          !fractionsReconstruct(regions, "weight_fraction") ||
          !fractionsReconstruct(regions, "squared_error_fraction") ||
          globalRelativeL2 === null ||
          !Number.isFinite(reconstructedRelativeL2) ||
          Math.abs(reconstructedRelativeL2 - globalRelativeL2) > 1e-10 * Math.max(1, Math.abs(globalRelativeL2))
        ) {
          return false;
        }
      }
    }
    return true;
  }

  function closeRegionalValue(actual, expected) {
    return Math.abs(actual - expected) <= 2e-10 * Math.max(1, Math.abs(expected));
  }

  function validAhmedRegionalReport(report, row, binding, definition) {
    const validation = record(report.validation);
    if (
      report.definition_id !== definition.definitionId ||
      report.split_id !== row?.split_id ||
      report.case_count !== binding.case_count ||
      !Array.isArray(report.case_ids) ||
      report.case_ids.length !== binding.case_count ||
      new Set(report.case_ids).size !== binding.case_count ||
      validation.all_case_reports_strictly_validated !== true ||
      validation.all_regional_sums_reconstruct_unchanged_global_field_sums !== true ||
      validation.exact_case_order_and_membership !== true ||
      validation.regional_values_consumed_by_official_score !== false
    ) {
      return false;
    }
    const supports = record(report.supports);
    const expectedSupports = record(definition.supports);
    if (
      Object.keys(supports).length !== Object.keys(expectedSupports).length ||
      Object.keys(expectedSupports).some((supportId) => !Object.hasOwn(supports, supportId))
    ) {
      return false;
    }
    for (const [supportId, expectedSupport] of Object.entries(expectedSupports)) {
      const support = record(supports[supportId]);
      const supportDefinition = record(support.definition);
      const rules = Array.isArray(supportDefinition.regions_in_code_order) ? supportDefinition.regions_in_code_order : [];
      if (
        support.definition_sha256 !== expectedSupport.definitionSha256 ||
        supportDefinition.scoring_role !== "report_only_zero_weight" ||
        supportDefinition.scoring_weight !== 0 ||
        supportDefinition.partition_properties !== "mutually_exclusive_and_exhaustive" ||
        rules.length !== expectedSupport.regions.length ||
        rules.some(
          (rule, index) =>
            rule?.region_id !== expectedSupport.regions[index] || rule?.code !== index || typeof rule?.predicate !== "string" || !rule.predicate
        )
      ) {
        return false;
      }
      const fields = record(support.fields);
      const expectedFields = Object.values(definition.fields)
        .filter((field) => field.supportId === supportId)
        .map((field) => field.reportFieldId);
      if (Object.keys(fields).length !== expectedFields.length || expectedFields.some((fieldId) => !Object.hasOwn(fields, fieldId))) {
        return false;
      }
      for (const fieldId of expectedFields) {
        const field = record(fields[fieldId]);
        const regions = Array.isArray(field.regions) ? field.regions : [];
        if (
          field.case_count !== binding.case_count ||
          field.primary_weighting !== expectedSupport.primaryWeighting ||
          finiteNumber(field.entity_count) === null ||
          finiteNumber(field.entity_count) <= 0 ||
          finiteNumber(field.physical_weight) === null ||
          finiteNumber(field.physical_weight) <= 0 ||
          regions.length !== expectedSupport.regions.length ||
          regions.some(
            (region, index) =>
              region?.region_id !== expectedSupport.regions[index] ||
              region?.code !== index ||
              !Number.isSafeInteger(region?.entity_count) ||
              region.entity_count < 1 ||
              finiteNumber(region?.physical_weight) === null ||
              finiteNumber(region?.physical_weight) <= 0
          ) ||
          !fractionsReconstruct(regions, "entity_fraction") ||
          !fractionsReconstruct(regions, "physical_weight_fraction")
        ) {
          return false;
        }
        for (const weighting of ["equal_entity", "physical"]) {
          let errorFractionTotal = 0;
          let squaredErrorTotal = 0;
          for (const region of regions) {
            const metrics = record(record(region[weighting]).pooled);
            const absoluteError = finiteNumber(metrics.absolute_error);
            const squaredError = finiteNumber(metrics.squared_error);
            const squaredTruth = finiteNumber(metrics.squared_truth);
            const totalWeight = finiteNumber(metrics.total_weight);
            const relativeL2 = finiteNumber(metrics.relative_l2_percent);
            const mae = finiteNumber(metrics.mae);
            const rmse = finiteNumber(metrics.rmse);
            const errorFraction = finiteNumber(metrics.fraction_of_support_squared_error);
            const macro = record(region[weighting]).macro_case_mean;
            const distribution = record(region[weighting]).case_distribution;
            if (
              [absoluteError, squaredError, squaredTruth, totalWeight, relativeL2, mae, rmse, errorFraction].some(
                (value) => value === null || value < 0
              ) ||
              squaredTruth <= 0 ||
              totalWeight <= 0 ||
              !closeRegionalValue(relativeL2, 100 * Math.sqrt(squaredError / squaredTruth)) ||
              !closeRegionalValue(mae, absoluteError / totalWeight) ||
              !closeRegionalValue(rmse, Math.sqrt(squaredError / totalWeight))
            ) {
              return false;
            }
            for (const metricId of ["relative_l2_percent", "mae", "rmse"]) {
              const macroValue = finiteNumber(record(macro)[metricId]);
              const values = ["minimum", "median", "p90", "maximum"].map((key) => finiteNumber(record(record(distribution)[metricId])[key]));
              if (
                macroValue === null ||
                macroValue < 0 ||
                values.some((value) => value === null || value < 0) ||
                values.some((value, index) => index > 0 && values[index - 1] > value) ||
                record(record(distribution)[metricId]).method !== "linear_order_statistics_over_complete_cases"
              ) {
                return false;
              }
            }
            errorFractionTotal += errorFraction;
            squaredErrorTotal += squaredError;
          }
          if (!closeRegionalValue(errorFractionTotal, squaredErrorTotal === 0 ? 0 : 1)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function regionalReportMatches(report, row, binding, definition) {
    const scoring = record(report.scoring);
    if (
      report.schema !== definition.reportSchema ||
      report.schema_version !== definition.schemaVersion ||
      report.status !== "complete_report_only" ||
      report.dataset_id !== slug(row?.dataset_id || "") ||
      report.contract_sha256 !== binding.contract_sha256 ||
      report.prediction_scope !== regionalScope(row) ||
      scoring.role !== "report_only" ||
      scoring.weight !== 0 ||
      scoring.official_metric_inputs_changed !== false ||
      scoring.official_score_changed !== false
    ) {
      return false;
    }
    if (slug(row?.dataset_id || "") === "ahmedml") {
      return validAhmedRegionalReport(report, row, binding, definition);
    }
    if (definition.layout === "supports") {
      return record(report.validation).regional_values_consumed_by_official_score === false;
    }
    return validHiLiftRegionalReport(report, row, binding, definition);
  }

  async function ensureRegionalReport(row) {
    const binding = regionalBinding(row);
    const url = regionalReportUrl(row);
    if (!binding || !url) throw new Error("this result does not declare a compatible regional diagnostics file");
    const definition = regionalDatasetDefinition(row?.dataset_id);
    const cacheKey = `${row.dataset_id}:${row.id}:${binding.sha256}`;
    if (state.regionalReports.has(cacheKey)) return state.regionalReports.get(cacheKey);
    if (state.regionalReportPromises.has(cacheKey)) return state.regionalReportPromises.get(cacheKey);
    const promise = (async () => {
      const loaded = await fetchJsonWithProvenance(url, `${rowLabel(row)} regional diagnostics`);
      const report = record(loaded.data);
      if (loaded.sha256 !== binding.sha256) {
        throw new Error("regional diagnostics checksum does not match the hash-verified leaderboard feed");
      }
      if (!regionalReportMatches(report, row, binding, definition)) {
        throw new Error(`regional diagnostics do not match the result's zero-weight ${row.dataset_id} contract`);
      }
      state.regionalReports.set(cacheKey, report);
      return report;
    })();
    state.regionalReportPromises.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      state.regionalReportPromises.delete(cacheKey);
    }
  }

  function verifyManifestSha256(loadedSha256, expectedSha256 = expectedManifestSha256) {
    const expected = String(expectedSha256 || "").trim();
    const loaded = String(loadedSha256 || "").trim();
    if (expected && !/^[a-f0-9]{64}$/.test(expected)) {
      throw new Error("the release snapshot contains an invalid publication-time leaderboard manifest SHA-256");
    }
    if (!expected) return { required: false, expected_sha256: null, loaded_sha256: loaded || null, verified: false };
    if (!loaded) throw new Error("this browser cannot verify the publication-time leaderboard manifest SHA-256");
    if (loaded !== expected) {
      throw new Error("leaderboard manifest bytes do not match the publication-time release snapshot SHA-256");
    }
    return { required: true, expected_sha256: expected, loaded_sha256: loaded, verified: true };
  }

  function leaderboardManifestProvenance() {
    return {
      url: manifestUrl,
      publication_sha256: expectedManifestSha256 || null,
      loaded_sha256: state.loadedManifestSha256,
      pin_required: Boolean(expectedManifestSha256),
      pin_verified: state.manifestPinVerified,
    };
  }

  function releaseManifestSha256() {
    return expectedManifestSha256 || state.loadedManifestSha256 || "";
  }

  function claimsReleaseMetadata() {
    const claims = dataRelease().claims;
    return claims && typeof claims === "object" ? claims : {};
  }

  function jsonStructuresEqual(left, right) {
    if (left === right) return true;
    if (Array.isArray(left) || Array.isArray(right)) {
      return (
        Array.isArray(left) &&
        Array.isArray(right) &&
        left.length === right.length &&
        left.every((value, index) => jsonStructuresEqual(value, right[index]))
      );
    }
    if (left && right && typeof left === "object" && typeof right === "object") {
      const leftKeys = Object.keys(left).sort();
      const rightKeys = Object.keys(right).sort();
      return (
        leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && jsonStructuresEqual(left[key], right[key]))
      );
    }
    return false;
  }

  function claimRecordKey(row) {
    return [row?.id, row?.dataset_id || slug(row?.dataset), row?.split_id || slug(row?.split)].join("|");
  }

  function claimIndexEntry(row) {
    if (!Array.isArray(state.claimsIndex?.records)) return null;
    return (
      state.claimsIndex.records.find(
        (entry) =>
          entry.submission_id === row.id &&
          entry.dataset_id === (row.dataset_id || slug(row.dataset)) &&
          entry.split_id === (row.split_id || slug(row.split))
      ) || null
    );
  }

  function claimRecordCheck(row) {
    return state.claimRecords.get(claimRecordKey(row)) || null;
  }

  function verifiedClaimRecord(row) {
    const check = claimRecordCheck(row);
    return check?.status === "verified" ? check.data : null;
  }

  async function ensureClaimsIndex() {
    if (state.claimsIndex) return state.claimsIndex;
    if (state.claimsIndexPromise) return state.claimsIndexPromise;
    if (["failed", "not_configured"].includes(state.claimsIndexProvenance?.status)) return null;
    const declared = claimsReleaseMetadata();
    if (!declared.index_file || !declared.index_sha256) {
      state.claimsIndexProvenance = { status: "not_configured", url: null, sha256: null, error: null };
      return null;
    }
    state.claimsIndexProvenance = { status: "loading", url: fileUrl(declared.index_file), sha256: null, error: null };
    state.claimsIndexPromise = (async () => {
      try {
        const loaded = await fetchJsonWithProvenance(state.claimsIndexProvenance.url, "leaderboard claim index");
        if (!loaded.sha256 || loaded.sha256 !== declared.index_sha256) {
          throw new Error("claim index checksum does not match the selected data release");
        }
        if (loaded.data?.release_id !== dataRelease().id || loaded.data?.release_status !== dataRelease().status) {
          throw new Error("claim index release binding does not match the selected data release");
        }
        if (loaded.data?.feed_sha256 !== dataRelease().feed_sha256) {
          throw new Error("claim index feed binding does not match the hash-verified leaderboard feed");
        }
        if (loaded.data?.feed_file !== state.manifest?.all_file) {
          throw new Error("claim index feed path does not match the selected leaderboard manifest");
        }
        if (!jsonStructuresEqual(loaded.data?.ranking_contract, state.manifest?.ranking_contract)) {
          throw new Error("claim index ranking contract does not match the selected leaderboard manifest");
        }
        if (!Array.isArray(loaded.data?.records) || Number(loaded.data.record_count) !== loaded.data.records.length) {
          throw new Error("claim index record count is invalid");
        }
        if (declared.schema_version && loaded.data.schema_version !== declared.schema_version) {
          throw new Error("claim index schema version does not match the selected data release");
        }
        if (Number(declared.record_count) !== loaded.data.records.length) {
          throw new Error("claim index record count does not match the selected data release");
        }
        const eligibleRecordCount = loaded.data.records.filter((entry) => entry.eligible === true).length;
        if (Number(loaded.data.eligible_record_count) !== eligibleRecordCount || Number(declared.eligible_record_count) !== eligibleRecordCount) {
          throw new Error("claim index eligible-record count does not match its entries and release metadata");
        }
        loaded.data.records.forEach((entry) => {
          const expectedClaimId = [loaded.data.release_id, entry.dataset_id, entry.split_id, entry.submission_id].join("/");
          const expectedFile = `leaderboard/claims/${entry.dataset_id}/${entry.split_id}/${entry.submission_id}.json`;
          if (typeof entry.eligible !== "boolean") throw new Error("claim index eligibility values must be booleans");
          if (
            entry.claim_id !== expectedClaimId ||
            entry.file !== expectedFile ||
            !entry.series_id ||
            !Number.isInteger(entry.version) ||
            entry.version < 1 ||
            !/^[a-f0-9]{64}$/.test(entry.sha256 || "")
          ) {
            throw new Error("claim index contains an invalid claim identity, path, or checksum");
          }
        });
        const uniqueKeys = [
          ["result identity", (entry) => `${entry.submission_id}|${entry.dataset_id}|${entry.split_id}`],
          ["claim ID", (entry) => entry.claim_id],
          ["claim file", (entry) => entry.file],
        ];
        uniqueKeys.forEach(([label, keyFor]) => {
          const values = loaded.data.records.map(keyFor);
          if (new Set(values).size !== values.length) throw new Error(`claim index contains a duplicate ${label}`);
        });
        state.claimsIndex = loaded.data;
        state.claimsIndexProvenance = {
          status: "verified",
          url: state.claimsIndexProvenance.url,
          sha256: loaded.sha256,
          error: null,
        };
        return state.claimsIndex;
      } catch (error) {
        state.claimsIndexProvenance = {
          ...state.claimsIndexProvenance,
          status: "failed",
          sha256: null,
          error: error.message,
        };
        console.error(error);
        return null;
      } finally {
        state.claimsIndexPromise = null;
        refreshCitationEligibilityUi();
      }
    })();
    return state.claimsIndexPromise;
  }

  function matchingClaimRanking(recordRanking, row) {
    const expected = rowRanking(row);
    if (!recordRanking || !expected) return false;
    const fields = [
      "metric_id",
      "value",
      "ranked_value",
      "display_value",
      "unit",
      "direction",
      "decimal_places",
      "rounding",
      "method",
      "rank",
      "ranked_result_count",
      "tied",
      "tie_count",
    ];
    return fields.every((field) => String(recordRanking[field]) === String(expected[field]));
  }

  function matchingClaimEligibility(recordEligibility, row) {
    const expected = row.claim_eligibility;
    if (!recordEligibility || !expected) return false;
    return ["academic_citation", "promotion", "reason_code", "reason"].every(
      (field) => String(recordEligibility[field] ?? "") === String(expected[field] ?? "")
    );
  }

  async function verifyClaimBindings(record, row, entry) {
    const validation = maintainerValidation(row);
    const result = record.result || {};
    if (record.claim_id !== entry.claim_id) throw new Error("claim record ID does not match its index entry");
    if (
      record.release?.id !== dataRelease().id ||
      record.release?.status !== dataRelease().status ||
      record.release?.published_at !== dataRelease().generated_at ||
      (record.release?.archive_url || null) !== (dataRelease().archive_url || null) ||
      (record.release?.release_view_url || null) !== (dataRelease().release_view_url || null)
    ) {
      throw new Error("claim record release binding does not match the selected data release");
    }
    if (
      result.submission_id !== row.id ||
      result.dataset_id !== (row.dataset_id || slug(row.dataset)) ||
      result.split_id !== (row.split_id || slug(row.split)) ||
      result.model !== row.model ||
      result.dataset !== row.dataset ||
      result.split !== row.split ||
      !jsonStructuresEqual(result.result_revision, resultRevision(row))
    ) {
      throw new Error("claim record result binding does not match the hash-verified feed row");
    }
    if (!matchingClaimRanking(record.ranking, row)) throw new Error("claim record ranking does not match the hash-verified feed row");
    if (!matchingClaimEligibility(record.eligibility, row)) {
      throw new Error("claim record eligibility does not match the hash-verified feed row");
    }
    const declaredEligible = row.claim_eligibility?.academic_citation === true && row.claim_eligibility?.promotion === true;
    if (entry.eligible !== declaredEligible) {
      throw new Error("claim index eligibility does not match the hash-verified feed row");
    }
    if (entry.series_id !== resultRevision(row).series_id || Number(entry.version) !== resultRevision(row).version) {
      throw new Error("claim index revision metadata does not match the hash-verified feed row");
    }
    const bindings = record.bindings || {};
    const resultBinding = bindings.result || {};
    if (
      resultBinding.feed_file !== state.manifest?.all_file ||
      resultBinding.feed_sha256 !== dataRelease().feed_sha256 ||
      Number(resultBinding.row_index) !== row._feedIndex
    ) {
      throw new Error("claim record result binding does not select this exact row in the hash-verified feed");
    }
    const sourceBinding = bindings.source_submission || {};
    const expectedSourcePath = `submissions/${row.dataset_id}/${row.id}/submission.json`;
    if (sourceBinding.path !== expectedSourcePath || !/^[a-f0-9]{64}$/.test(sourceBinding.sha256 || "")) {
      throw new Error("claim record source-submission binding does not match the selected feed row");
    }
    const loadedSource = await fetchJsonWithProvenance(fileUrl(sourceBinding.path), `${rowLabel(row)} source submission`);
    if (loadedSource.sha256 !== sourceBinding.sha256) {
      throw new Error("source-submission bytes do not match the checksum-verified claim record");
    }
    const sourceModel = typeof loadedSource.data?.model === "string" ? loadedSource.data.model : loadedSource.data?.model?.name;
    if (
      loadedSource.data?.submission_id !== row.id ||
      loadedSource.data?.dataset_id !== row.dataset_id ||
      loadedSource.data?.split_id !== row.split_id ||
      sourceModel !== row.model
    ) {
      throw new Error("source-submission identity does not match the hash-verified leaderboard feed row");
    }
    const evaluationBinding = bindings.evaluation_evidence || {};
    const expectedEvaluationPath = `submissions/${row.dataset_id}/${row.id}/${row.evaluation?.evidence_file}`;
    if (
      evaluationBinding.path !== expectedEvaluationPath ||
      !row.evaluation?.evidence_sha256 ||
      evaluationBinding.sha256 !== row.evaluation.evidence_sha256
    ) {
      throw new Error("claim record evaluation-evidence binding does not match the hash-verified feed row");
    }
    const profileBinding = bindings.profile_index || {};
    if (
      profileBinding.path !== row.profile_data?.index_file ||
      !row.profile_data?.index_sha256 ||
      profileBinding.sha256 !== row.profile_data.index_sha256
    ) {
      throw new Error("claim record profile-index binding does not match the hash-verified feed row");
    }
    const schemaMajor = submissionSchemaMajor(row);
    const support = scoringSupportSummary(row);
    const supportBinding = bindings.scoring_support;
    if (schemaMajor >= 3 || supportBinding) {
      if (
        !support.release_id ||
        !support.manifest_url ||
        !support.manifest_sha256 ||
        supportBinding?.release_id !== support.release_id ||
        supportBinding?.manifest_url !== support.manifest_url ||
        supportBinding?.manifest_sha256 !== support.manifest_sha256
      ) {
        throw new Error("claim record scoring-support binding does not match the hash-verified feed row");
      }
    }
    const discretization = discretizationBinding(row);
    const discretizationClaimBinding = bindings.spatial_discretization;
    if (schemaMajor >= 3 || discretizationClaimBinding) {
      if (
        !bindingFile(discretization) ||
        !bindingSha256(discretization) ||
        discretizationClaimBinding?.path !== submissionAssetPath(row, bindingFile(discretization)) ||
        discretizationClaimBinding?.sha256 !== bindingSha256(discretization)
      ) {
        throw new Error("claim record spatial-discretization binding does not match the hash-verified feed row");
      }
    }
    const discretizationCases = discretizationCaseBinding(row);
    const discretizationCasesClaimBinding = bindings.discretization_cases;
    if (schemaMajor >= 3 || discretizationCasesClaimBinding) {
      if (
        !bindingFile(discretizationCases) ||
        !bindingSha256(discretizationCases) ||
        discretizationCasesClaimBinding?.path !== submissionAssetPath(row, bindingFile(discretizationCases)) ||
        discretizationCasesClaimBinding?.sha256 !== bindingSha256(discretizationCases)
      ) {
        throw new Error("claim record per-case discretization binding does not match the hash-verified feed row");
      }
    }
    const caseMetrics = caseMetricsBinding(row);
    const caseMetricsClaimBinding = bindings.case_metrics;
    if (schemaMajor >= 3 || caseMetricsClaimBinding) {
      if (
        !bindingFile(caseMetrics) ||
        !bindingSha256(caseMetrics) ||
        caseMetricsClaimBinding?.path !== submissionAssetPath(row, bindingFile(caseMetrics)) ||
        caseMetricsClaimBinding?.sha256 !== bindingSha256(caseMetrics)
      ) {
        throw new Error("claim record case-metrics binding does not match the hash-verified feed row");
      }
    }
    const validationBinding = bindings.maintainer_validation;
    if (validation && Object.keys(validation).length) {
      if (
        !validationBinding ||
        validationBinding.path !== validation.evidence_path ||
        validationBinding.sha256 !== validation.evidence_sha256 ||
        validationBinding.status !== validation.status ||
        validationBinding.validation_scope !== validation.validation_scope ||
        validationBinding.model_execution !== validation.model_execution ||
        validationBinding.metric_recomputation !== validation.metric_recomputation
      ) {
        throw new Error("claim record maintainer-validation binding does not match the hash-verified feed row");
      }
    } else if (validationBinding) {
      throw new Error("claim record supplies maintainer validation that is absent from the hash-verified feed row");
    }
    const expectedPermalink = canonicalResultPermalink(row) || null;
    if ((record.result_permalink || null) !== expectedPermalink) {
      throw new Error("claim record result permalink does not match the immutable release view");
    }
    const expectedClaimRecordUrl = dataRelease().status === "official" ? declaredLeaderboardAssetUrl(entry.file) || null : null;
    if ((record.claim_record_url || null) !== expectedClaimRecordUrl) {
      throw new Error("claim record URL does not match the immutable release view");
    }
  }

  async function ensureClaimRecord(row) {
    await ensureClaimsIndex();
    const key = claimRecordKey(row);
    const existing = claimRecordCheck(row);
    if (existing?.status === "verified") return verifiedClaimRecord(row);
    if (["failed", "not_listed"].includes(existing?.status)) return null;
    if (state.claimRecordPromises.has(key)) return state.claimRecordPromises.get(key);
    const entry = claimIndexEntry(row);
    if (!entry?.file || !entry.sha256) {
      state.claimRecords.set(key, { status: "not_listed", data: null, sha256: null, url: null, error: null });
      refreshCitationEligibilityUi();
      return null;
    }
    const recordUrl = fileUrl(entry.file);
    state.claimRecords.set(key, { status: "loading", data: null, sha256: null, url: recordUrl, error: null });
    const promise = (async () => {
      try {
        const loaded = await fetchJsonWithProvenance(recordUrl, `${rowLabel(row)} claim record`);
        if (!loaded.sha256 || loaded.sha256 !== entry.sha256) {
          throw new Error("claim record checksum does not match its verified index entry");
        }
        await verifyClaimBindings(loaded.data, row, entry);
        state.claimRecords.set(key, { status: "verified", data: loaded.data, sha256: loaded.sha256, url: recordUrl, error: null });
        return loaded.data;
      } catch (error) {
        state.claimRecords.set(key, { status: "failed", data: null, sha256: null, url: recordUrl, error: error.message });
        console.error(error);
        return null;
      } finally {
        state.claimRecordPromises.delete(key);
        refreshCitationEligibilityUi();
      }
    })();
    state.claimRecordPromises.set(key, promise);
    return promise;
  }

  function allDatasetEntries() {
    return Array.isArray(state.manifest?.datasets) ? state.manifest.datasets : [];
  }

  function datasetEntries() {
    return allDatasetEntries().filter((dataset) => leaderboardDisplay[dataset.slug || slug(dataset.name)]?.hidden !== true);
  }

  function activeDataset() {
    return datasetEntries().find((dataset) => dataset.name === state.dataset);
  }

  function metricDefinition(metricId) {
    const definition = state.metrics.get(metricId);
    if (!definition) return definition;
    const override = activeDataset()?.metric_definition_overrides?.[metricId];
    if (!override || typeof override !== "object" || Array.isArray(override)) return definition;
    const resolved = { ...definition };
    ["label", "description"].forEach((key) => {
      if (typeof override[key] === "string" && override[key].trim()) resolved[key] = override[key];
    });
    return resolved;
  }

  function trainingRegimeDefinitions() {
    return Array.isArray(state.manifest?.training_regimes) ? state.manifest.training_regimes : [];
  }

  function trainingRegimeDefinition(regimeId) {
    const normalizedId = regimeId === "zero_shot" ? "pretrained_zero_shot" : regimeId;
    return trainingRegimeDefinitions().find((definition) => definition.id === normalizedId);
  }

  function activeMetricDefinitions() {
    return (activeDataset()?.metric_ids || []).map(metricDefinition).filter(Boolean);
  }

  function splitOptions(dataset = activeDataset()) {
    return Array.isArray(dataset?.splits) ? dataset.splits : [];
  }

  function populateSelect(select, options, selectedValue) {
    if (!select) return "";
    const current = selectedValue ?? select.value;
    select.replaceChildren();
    options.forEach((option) => {
      const item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      if (option.title) item.title = option.title;
      select.appendChild(item);
    });
    const selected = options.some((option) => option.value === current) ? current : options[0]?.value || "";
    select.value = selected;
    return selected;
  }

  function syncDatasetSelects() {
    const options = datasetEntries().map((dataset) => ({ value: dataset.name, label: dataset.name }));
    datasetSelects().forEach((select) => populateSelect(select, options, state.dataset));
  }

  function syncSplitSelects() {
    const options = splitOptions().map((split) => ({
      value: split.name,
      label: split.label || split.name,
      title: split.description || "",
    }));
    if (!options.some((option) => option.value === state.split)) {
      state.split = options[0]?.value || "";
    }
    splitSelects().forEach((select) => populateSelect(select, options, state.split));
  }

  function normalizedResultRevision(entry) {
    const declared = record(entry?.result_revision);
    const submissionId = String(entry?.submission_id || entry?.id || "");
    const legacyMatch = submissionId.match(/^(.*)-v1$/);
    const version = Number.isInteger(declared.version) && declared.version > 0 ? declared.version : legacyMatch ? 1 : 1;
    const seriesId = String(declared.series_id || (legacyMatch ? legacyMatch[1] : submissionId));
    return {
      series_id: seriesId,
      version,
      supersedes: declared.supersedes ?? (version > 1 ? `${seriesId}-v${version - 1}` : null),
      change_summary: declared.change_summary ?? null,
      is_latest: declared.is_latest !== false,
      latest_submission_id: String(declared.latest_submission_id || submissionId),
      version_count: Math.max(1, Number(declared.version_count) || 1),
    };
  }

  function resultRevision(row) {
    return normalizedResultRevision(row);
  }

  function revisionLabel(row) {
    return `v${resultRevision(row).version}`;
  }

  function isLatestRevision(row) {
    return resultRevision(row).is_latest;
  }

  function normalizeRow(entry, feedIndex) {
    const metricValues = {};
    Object.entries(entry.metric_values || {}).forEach(([metricId, value]) => {
      const number = finiteNumber(value);
      if (number !== null) metricValues[metricId] = number;
    });
    const modelTypes = Array.isArray(entry.model_types) ? entry.model_types.filter(Boolean) : [entry.model_type].filter(Boolean);
    const normalized = {
      ...entry,
      _feedIndex: feedIndex,
      id: entry.submission_id || `${entry.dataset}-${entry.split}-${entry.model}`,
      model: entry.model || "Unnamed model",
      modelTypes,
      metricValues,
      parameterCount: finiteNumber(entry.parameter_count_millions ?? entry.parameter_count),
      submitter: entry.submitter_name || entry.institution || "Unknown submitter",
      date: entry.submitted_at || "",
      approvalStatus: entry.approval?.status || "not_supplied",
      result_revision: normalizedResultRevision(entry),
    };
    normalized.predictionDataRank = predictionAvailability(normalized).rank;
    return normalized;
  }

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function firstValue(...values) {
    return values.find((value) => value !== null && value !== undefined && value !== "");
  }

  function nestedValue(value, ...paths) {
    for (const path of paths) {
      let candidate = value;
      for (const key of path) candidate = record(candidate)[key];
      if (candidate !== null && candidate !== undefined && candidate !== "") return candidate;
    }
    return null;
  }

  function reproducibilityArtifactAvailability(row) {
    const reproducibility = record(row?.reproducibility);
    const objectAvailability = (value) => (Object.keys(record(value)).length ? "provided" : "not_supplied");
    const valueAvailability = (value) => (typeof value === "string" && value.trim() ? "provided" : "not_supplied");
    return {
      code: objectAvailability(reproducibility.code),
      model: objectAvailability(reproducibility.model_artifact),
      environment: objectAvailability(reproducibility.environment),
      documentation: valueAvailability(reproducibility.artifact_documentation_url),
    };
  }

  function optionalArtifactAvailabilityLabel(value) {
    return value === "provided" ? "Provided" : "Not supplied (optional)";
  }

  function scoringSupportBinding(row) {
    return record(
      firstValue(
        row?.scoring_support,
        row?.scoring_support_binding,
        row?.spatial_discretization?.scoring_support,
        row?.discretization?.scoring_support
      )
    );
  }

  function scoringSupportSummary(row) {
    const support = scoringSupportBinding(row);
    const supports = Array.isArray(support.supports) ? support.supports : [];
    const supportFor = (domain) => supports.find((candidate) => candidate?.domain === domain) || {};
    return {
      release_id: firstValue(support.release_id, support.id, support.scoring_support_release_id),
      status: support.status,
      manifest_url: firstValue(support.manifest_url, support.url),
      manifest_sha256: firstValue(support.manifest_sha256, support.sha256),
      surface_support_id: firstValue(support.surface_support_id, support.surface?.support_id, supportFor("surface").id),
      volume_support_id: firstValue(support.volume_support_id, support.volume?.support_id, supportFor("volume").id),
    };
  }

  function discretizationBinding(row) {
    return record(firstValue(row?.discretization, row?.spatial_discretization));
  }

  function discretizationSummary(row) {
    const binding = discretizationBinding(row);
    return record(firstValue(row?.discretization_summary, row?.spatial_discretization_summary, binding.summary, binding));
  }

  function discretizationCaseBinding(row) {
    const binding = discretizationBinding(row);
    const summary = discretizationSummary(row);
    return record(
      firstValue(
        row?.discretization_cases,
        row?.spatial_discretization_cases,
        binding.case_manifest,
        binding.cases,
        summary.case_manifest,
        summary.per_case_manifest
      )
    );
  }

  function caseMetricsBinding(row) {
    return record(firstValue(row?.case_metrics, row?.evaluation?.case_metrics, row?.evaluation?.per_case_metrics));
  }

  function bindingFile(value) {
    const binding = record(value);
    return firstValue(binding.file, binding.path, binding.report_file, binding.manifest_file);
  }

  function bindingSha256(value) {
    const binding = record(value);
    return firstValue(binding.sha256, binding.report_sha256, binding.manifest_sha256);
  }

  function submissionAssetPath(row, file) {
    if (!file) return "";
    return String(file).startsWith("submissions/") ? String(file) : `submissions/${row.dataset_id}/${row.id}/${file}`;
  }

  function predictionArtifacts(row) {
    const candidates = firstValue(
      row?.prediction_artifacts,
      row?.prediction_artifact ? [row.prediction_artifact] : null,
      row?.reproducibility?.prediction_artifacts
    );
    return Array.isArray(candidates) ? candidates.filter((value) => value && typeof value === "object") : [];
  }

  function primaryPredictionArtifact(row) {
    const artifacts = predictionArtifacts(row);
    const preferred = artifacts.filter((artifact) => ["scored_predictions", "both"].includes(artifact.kind));
    const candidates = preferred.length
      ? preferred
      : artifacts.filter((artifact) => artifact.kind === "direct_model_outputs").length
        ? artifacts.filter((artifact) => artifact.kind === "direct_model_outputs")
        : artifacts;
    return (
      [...candidates].sort((left, right) => {
        const leftCoverage = record(left.coverage);
        const rightCoverage = record(right.coverage);
        const leftComplete = leftCoverage.kind === "complete_split" ? 1 : 0;
        const rightComplete = rightCoverage.kind === "complete_split" ? 1 : 0;
        return rightComplete - leftComplete || (finiteNumber(rightCoverage.case_count) ?? 0) - (finiteNumber(leftCoverage.case_count) ?? 0);
      })[0] || {}
    );
  }

  function predictionArtifactProvider(artifact) {
    if (artifact?.provider) return humanize(artifact.provider);
    const url = safeHttpUrl(firstValue(artifact?.repository_url, artifact?.url));
    if (!url) return null;
    const host = new URL(url).hostname.toLowerCase();
    if (host === "huggingface.co" || host.endsWith(".huggingface.co")) return "Hugging Face";
    if (host === "github.com" || host.endsWith(".github.com")) return "GitHub";
    if (host === "zenodo.org" || host.endsWith(".zenodo.org")) return "Zenodo";
    return host;
  }

  function predictionArtifactCheck(row) {
    const checks = firstValue(row?.prediction_artifact_checks, row?.prediction_artifact_status?.checks);
    if (Array.isArray(checks)) {
      const artifactId = primaryPredictionArtifact(row).artifact_id;
      return record(checks.find((check) => check?.artifact_id === artifactId));
    }
    return record(
      firstValue(
        row?.prediction_artifact_check,
        checks,
        row?.prediction_artifact_validation,
        row?.approval?.prediction_artifact_check,
        row?.maintainer_validation?.prediction_artifact_check
      )
    );
  }

  function predictionArtifactChecks(row) {
    const checks = firstValue(row?.prediction_artifact_checks, row?.prediction_artifact_status?.checks);
    if (Array.isArray(checks)) {
      return checks.filter((check) => check && typeof check === "object");
    }
    const check = predictionArtifactCheck(row);
    return Object.keys(check).length ? [check] : [];
  }

  function predictionArtifactChecksBinding(row) {
    const status = record(row?.prediction_artifact_status);
    return record(
      firstValue(
        row?.prediction_artifact_checks_binding,
        status.check_file || status.check_sha256 ? { file: status.check_file, sha256: status.check_sha256 } : null
      )
    );
  }

  function splitTestCount(row) {
    const dataset = datasetEntries().find((candidate) => candidate.name === row?.dataset || candidate.slug === row?.dataset_id);
    const split = (dataset?.splits || []).find((candidate) => candidate.id === row?.split_id || candidate.name === row?.split);
    return finiteNumber(split?.test_count);
  }

  function predictionCoverage(row) {
    const artifact = primaryPredictionArtifact(row);
    const coverage = record(artifact.coverage);
    const caseIds = Array.isArray(coverage.case_ids) ? coverage.case_ids : [];
    const count = finiteNumber(firstValue(coverage.case_count, artifact.case_count, caseIds.length || null));
    const expected = finiteNumber(firstValue(coverage.expected_case_count, artifact.expected_case_count, splitTestCount(row)));
    const kind = firstValue(coverage.kind, artifact.coverage_kind);
    const complete = kind === "complete_split" || (count !== null && expected !== null && count === expected);
    return { kind: complete ? "complete_split" : "example_cases", count, expected };
  }

  function predictionAvailability(row) {
    if (!predictionArtifacts(row).length) {
      return { code: "not_shared", label: "Not shared", rank: 0, count: 0, expected: splitTestCount(row) };
    }
    const coverage = predictionCoverage(row);
    const count = coverage.count ?? "?";
    const expected = coverage.expected ?? "?";
    return {
      code: coverage.kind,
      label: coverage.kind === "complete_split" ? `Complete · ${count}/${expected}` : `Examples · ${count}/${expected}`,
      rank: coverage.kind === "complete_split" ? 2 : 1,
      count: coverage.count,
      expected: coverage.expected,
    };
  }

  function predictionArtifactStatus(row) {
    const artifact = primaryPredictionArtifact(row);
    if (!Object.keys(artifact).length) return { code: "not_applicable", label: "Not applicable" };
    const check = predictionArtifactCheck(row);
    const raw = String(firstValue(check.status, artifact.check_status, "not_checked")).toLowerCase();
    const codes = {
      not_applicable: ["not_applicable", "Not applicable"],
      not_checked: ["not_checked", "Not checked"],
      accessible: ["accessible", "Accessible"],
      format_checked: ["format_checked", "Format checked"],
      metrics_recomputed: ["format_checked", "Format checked"],
      metrics_reproduced: ["format_checked", "Format checked"],
      failed: ["failed", "Check failed"],
      check_failed: ["failed", "Check failed"],
    };
    const [code, label] = codes[raw] || codes.not_checked;
    return { code, label };
  }

  function predictionMetricRecomputation(row) {
    const check = predictionArtifactCheck(row);
    const declared = firstValue(check.metric_recomputation, row?.prediction_metric_recomputation);
    const recomputation = typeof declared === "string" ? { status: declared } : record(declared);
    const raw = String(
      firstValue(recomputation.status, ["metrics_recomputed", "metrics_reproduced"].includes(check.status) ? "complete_split" : "not_performed")
    ).toLowerCase();
    const count = finiteNumber(firstValue(recomputation.case_count, check.recomputed_case_count));
    const expected = finiteNumber(firstValue(recomputation.expected_case_count, check.expected_case_count, predictionCoverage(row).expected));
    if (["complete_split", "performed", "metrics_recomputed", "metrics_reproduced"].includes(raw)) {
      return {
        code: "complete_split",
        label: "Complete split recomputed by FluidsBench",
        count: count ?? expected,
        expected,
      };
    }
    if (["example_cases", "partial", "partial_cases"].includes(raw)) {
      return {
        code: "example_cases",
        label: `Example cases recomputed · ${count ?? "?"}/${expected ?? "?"}`,
        count,
        expected,
      };
    }
    return { code: "not_performed", label: "Not performed", count: 0, expected };
  }

  function compactJson(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "object") return String(value);
    try {
      return JSON.stringify(value);
    } catch (_error) {
      return String(value);
    }
  }

  function countSummary(value) {
    if (value === null || value === undefined || value === "") return null;
    const direct = finiteNumber(value);
    if (direct !== null) return direct.toLocaleString();
    const count = record(value);
    if (count.kind === "fixed" && finiteNumber(count.value) !== null) {
      return Number(count.value).toLocaleString();
    }
    if (count.kind === "per_case") {
      const minimum = finiteNumber(count.minimum);
      const median = finiteNumber(count.median);
      const maximum = finiteNumber(count.maximum);
      return `min/median/max ${minimum?.toLocaleString() ?? "?"}/${median?.toLocaleString() ?? "?"}/${maximum?.toLocaleString() ?? "?"}`;
    }
    return compactJson(value);
  }

  function fractionSummary(value) {
    if (value === null || value === undefined || value === "") return null;
    const fraction = record(value);
    if (fraction.kind === "fixed" && finiteNumber(fraction.value) !== null) {
      return `${(Number(fraction.value) * 100).toLocaleString()}%`;
    }
    if (fraction.kind === "per_case") {
      const values = [fraction.minimum, fraction.median, fraction.maximum].map(finiteNumber);
      return `min/median/max ${values.map((item) => (item === null ? "?" : `${(item * 100).toLocaleString()}%`)).join("/")}`;
    }
    const direct = finiteNumber(value);
    return direct === null ? compactJson(value) : `${(direct * 100).toLocaleString()}%`;
  }

  function representationSummary(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "object") return humanize(value);
    const item = record(value);
    if (item.used === false) return "Not used";
    const parts = [];
    if (item.id) parts.push(String(item.id));
    if (item.domain && typeof item.domain === "string") parts.push(humanize(item.domain));
    const representation = firstValue(typeof item.representation === "string" ? item.representation : null, item.kind, item.type);
    if (representation) parts.push(humanize(representation));
    if (item.representation && typeof item.representation === "object") {
      parts.push(representationSummary(item.representation));
    }
    if (item.entity) parts.push(humanize(item.entity));
    const count = countSummary(firstValue(item.count, item.count_per_case, item.median_count, item.count_median));
    if (count) parts.push(`${count} per case`);
    if (Array.isArray(item.entity_counts)) {
      item.entity_counts.forEach((entry) => {
        const entityCount = countSummary(entry?.count);
        if (entityCount) parts.push(`${humanize(entry.entity) || "entities"}: ${entityCount} per case`);
      });
    }
    const nativeFraction = fractionSummary(item.fraction_of_native);
    if (nativeFraction) parts.push(`${nativeFraction} of native support`);
    const nativeComparison = record(item.native_comparison);
    if (nativeComparison.status === "reported") {
      (nativeComparison.native_entity_counts || []).forEach((entry) => {
        const nativeCount = countSummary(entry?.count);
        if (nativeCount) parts.push(`native ${humanize(entry.entity) || "entities"}: ${nativeCount} per case`);
      });
      (nativeComparison.fractions || []).forEach((entry) => {
        const fraction = fractionSummary(entry?.fraction);
        if (fraction) parts.push(`${humanize(entry.entity) || "entities"}: ${fraction} of native`);
      });
    } else if (nativeComparison.status === "not_applicable") {
      parts.push("native comparison: not applicable");
    } else if (nativeComparison.status === "unknown_with_explanation") {
      parts.push(`native comparison unknown: ${nativeComparison.explanation}`);
    }
    if (Array.isArray(item.dimensions)) parts.push(item.dimensions.join(" × "));
    const minimum = finiteNumber(firstValue(item.minimum_count, item.count_min));
    const maximum = finiteNumber(firstValue(item.maximum_count, item.count_max));
    if (minimum !== null || maximum !== null) {
      parts.push(`range ${minimum === null ? "?" : minimum.toLocaleString()}–${maximum === null ? "?" : maximum.toLocaleString()}`);
    }
    if (item.sampling) {
      const sampling = record(item.sampling);
      const samplingKind = String(sampling.kind || "");
      const samplingLabel = samplingKind === "none" ? "none" : sampling.method || humanize(samplingKind) || compactJson(item.sampling);
      const resampled = samplingKind === "resampled_each_epoch" || sampling.resampled_each_epoch === true;
      parts.push(`sampling: ${samplingLabel}${resampled ? " (resampled each epoch)" : ""}`);
    }
    if (item.connectivity) parts.push(`connectivity: ${humanize(item.connectivity)}`);
    const domain = firstValue(item.domain && typeof item.domain === "object" ? item.domain : null, item.bounding_box, item.bbox);
    if (domain) {
      const domainRecord = record(domain);
      if (domainRecord.kind === "axis_aligned_box") {
        parts.push(
          `domain: [${(domainRecord.minimum || []).join(", ")}] to [${(domainRecord.maximum || []).join(", ")}] ${
            domainRecord.length_unit || ""
          } in ${domainRecord.coordinate_frame || "unspecified frame"}`
        );
      } else {
        parts.push(`domain: ${humanize(domainRecord.kind) || compactJson(domain)}`);
      }
    }
    const queries = countSummary(item.queries_per_forward_pass);
    if (queries) parts.push(`${queries} queries per forward pass`);
    return parts.length ? parts.join("; ") : compactJson(value);
  }

  function mappingMethodSummary(value) {
    if (!value) return null;
    if (typeof value === "string") return humanize(value);
    const method = record(value);
    if (method.kind === "reference_rule") {
      return `reference rule ${method.rule_id || "unspecified"}${method.rule_version ? ` (${method.rule_version})` : ""}`;
    }
    return humanize(method.kind) || compactJson(value);
  }

  function spatialComponent(row, ...paths) {
    return nestedValue(discretizationSummary(row), ...paths);
  }

  function inferenceDirectOutputs(row, domain = null) {
    const outputs = spatialComponent(row, ["inference", "direct_outputs"]);
    if (!Array.isArray(outputs)) return [];
    return domain ? outputs.filter((output) => output?.domain === domain) : outputs;
  }

  function directOutputSummary(row, domain) {
    const outputs = inferenceDirectOutputs(row, domain);
    return outputs.length ? outputs.map(representationSummary).join(" | ") : null;
  }

  function inferenceMappings(row) {
    const mappings = spatialComponent(
      row,
      ["inference", "mappings"],
      ["inference", "mapping_to_scoring_support"],
      ["mapping_to_scoring_support"],
      ["scoring_mapping"]
    );
    return Array.isArray(mappings) ? mappings : mappings ? [mappings] : [];
  }

  function mappingSummary(row) {
    const mappings = inferenceMappings(row);
    if (!mappings.length) return null;
    return mappings
      .map((mapping) => {
        const item = record(mapping);
        const coverage = finiteNumber(item.final_coverage_fraction);
        const unmapped = finiteNumber(item.unmapped_fraction);
        const extrapolated = finiteNumber(item.extrapolated_fraction);
        return [
          item.support_id ? `${item.support_id} from ${item.source_output_id || "declared output"}` : null,
          item.method ? `method: ${mappingMethodSummary(item.method)}` : null,
          coverage === null ? null : `coverage: ${(coverage * 100).toLocaleString()}%`,
          unmapped === null ? null : `unmapped: ${(unmapped * 100).toLocaleString()}%`,
          extrapolated === null ? null : `extrapolated: ${(extrapolated * 100).toLocaleString()}%`,
        ]
          .filter(Boolean)
          .join("; ");
      })
      .join(" | ");
  }

  function scoringCoverageSummary(row) {
    const mappings = inferenceMappings(row);
    if (!mappings.length) return null;
    return mappings
      .map((mapping) => {
        const item = record(mapping);
        const coverage = finiteNumber(item.final_coverage_fraction);
        const unmapped = finiteNumber(item.unmapped_fraction);
        const extrapolated = finiteNumber(item.extrapolated_fraction);
        return `${item.support_id || "support"}: ${coverage === null ? "coverage not supplied" : `${coverage * 100}% coverage`}, ${
          unmapped === null ? "unmapped fraction not supplied" : `${unmapped * 100}% unmapped`
        }, ${extrapolated === null ? "extrapolated fraction not supplied" : `${extrapolated * 100}% extrapolated`}`;
      })
      .join(" | ");
  }

  function revisionHistoryMetadata() {
    return record(dataRelease().revision_history);
  }

  function indexRevisionRows(records) {
    allDatasetEntries().forEach((entry) => state.revisionRows.set(entry.name, []));
    records
      .map((entry, index) => normalizeRow(entry, index))
      .forEach((row) => {
        if (state.revisionRows.has(row.dataset)) state.revisionRows.get(row.dataset).push(row);
      });
  }

  function validateRevisionHistory(history, metadata) {
    if (history?.release_id !== dataRelease().id || history?.release_status !== dataRelease().status) {
      throw new Error("revision history release binding does not match the selected data release");
    }
    if (history?.generated_at !== dataRelease().generated_at || history?.schema_version !== metadata.schema_version) {
      throw new Error("revision history metadata does not match the selected data release");
    }
    if (!Array.isArray(history?.records) || Number(history.record_count) !== history.records.length) {
      throw new Error("revision history record count is invalid");
    }
    if (Number(metadata.record_count) !== history.records.length) {
      throw new Error("revision history record count does not match the selected data release");
    }
    const submissionIds = history.records.map((entry) => entry.submission_id);
    if (new Set(submissionIds).size !== submissionIds.length) {
      throw new Error("revision history contains duplicate submission IDs");
    }
    const groups = new Map();
    history.records.forEach((entry) => {
      const revision = normalizedResultRevision(entry);
      const key = [entry.dataset_id, entry.split_id, revision.series_id].join("|");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ entry, revision });
    });
    if (Number(history.series_count) !== groups.size || Number(metadata.series_count) !== groups.size) {
      throw new Error("revision history series count does not match the selected data release");
    }
    groups.forEach((items) => {
      const ordered = items.slice().sort((left, right) => left.revision.version - right.revision.version);
      const versions = ordered.map(({ revision }) => revision.version);
      if (versions.some((version, index) => version !== index + 1)) {
        throw new Error("revision history contains a non-sequential result series");
      }
      const latest = ordered.filter(({ revision }) => revision.is_latest);
      if (latest.length !== 1 || latest[0].revision.version !== versions.at(-1)) {
        throw new Error("revision history does not identify exactly one latest version per series");
      }
      const latestSubmissionId = ordered.at(-1).entry.submission_id;
      ordered.forEach(({ entry, revision }, index) => {
        const expectedSupersedes = index === 0 ? null : ordered[index - 1].entry.submission_id;
        if (revision.supersedes !== expectedSupersedes) {
          throw new Error("revision history does not link each version to its exact predecessor");
        }
        if (revision.version_count !== ordered.length || revision.latest_submission_id !== latestSubmissionId) {
          throw new Error("revision history contains inconsistent derived version metadata");
        }
      });
    });
    const currentIds = new Set(
      Array.from(state.rows.values())
        .flat()
        .map((row) => row.id)
    );
    const historyLatestIds = new Set(
      history.records.filter((entry) => normalizedResultRevision(entry).is_latest).map((entry) => entry.submission_id)
    );
    if (currentIds.size !== historyLatestIds.size || Array.from(currentIds).some((id) => !historyLatestIds.has(id))) {
      throw new Error("ranked feed rows do not match the latest revision-history records");
    }
  }

  async function ensureRevisionHistory() {
    if (state.revisionHistoryLoaded) return state.revisionRows;
    const metadata = revisionHistoryMetadata();
    if (!metadata.file || !metadata.sha256) {
      indexRevisionRows(Array.from(state.rows.values()).flat());
      state.revisionHistoryLoaded = true;
      return state.revisionRows;
    }
    const loaded = await fetchJsonWithProvenance(fileUrl(metadata.file), "leaderboard revision history");
    if (!loaded.sha256 || loaded.sha256 !== metadata.sha256) {
      throw new Error("revision history checksum does not match the selected data release");
    }
    validateRevisionHistory(loaded.data, metadata);
    indexRevisionRows(loaded.data.records);
    state.loadedRevisionHistorySha256 = loaded.sha256;
    state.revisionHistoryVerified = true;
    state.revisionHistoryLoaded = true;
    return state.revisionRows;
  }

  async function ensureRows(dataset) {
    if (state.rows.has(dataset.name)) return state.rows.get(dataset.name);
    if (!state.feedRowsLoaded) {
      if (!state.manifest?.all_file) throw new Error("manifest does not declare the complete scalar feed");
      const loaded = await fetchJsonWithProvenance(fileUrl(state.manifest.all_file), "complete leaderboard feed");
      if (!Array.isArray(loaded.data)) throw new Error("complete leaderboard feed must be an array");
      if (!loaded.sha256) throw new Error("this browser cannot verify the leaderboard feed SHA-256 digest");
      const expectedSha256 = dataRelease().feed_sha256;
      if (!expectedSha256 || loaded.sha256 !== expectedSha256) {
        throw new Error("complete leaderboard feed checksum does not match the selected data release");
      }
      allDatasetEntries().forEach((entry) => state.rows.set(entry.name, []));
      loaded.data
        .map((entry, index) => normalizeRow(entry, index))
        .forEach((row) => {
          if (state.rows.has(row.dataset)) state.rows.get(row.dataset).push(row);
        });
      state.loadedFeedSha256 = loaded.sha256;
      state.feedVerified = true;
      state.feedRowsLoaded = true;
      await ensureRevisionHistory();
      await ensureClaimsIndex();
    }
    return state.rows.get(dataset.name) || [];
  }

  async function ensureGroundTruthManifest() {
    if (state.groundTruthManifest) return state.groundTruthManifest;
    const expected = dataRelease().profile_ground_truth;
    const selectedManifestUrl = releaseGroundTruthManifestUrl();
    if (!selectedManifestUrl) throw new Error("the selected release does not declare a profile ground-truth manifest URL");
    const loaded = await fetchJsonWithProvenance(selectedManifestUrl, "profile ground-truth manifest");
    if (!loaded.sha256) throw new Error("this browser cannot verify the profile ground-truth manifest SHA-256 digest");
    if (!expected?.manifest_sha256 || loaded.sha256 !== expected.manifest_sha256) {
      throw new Error("profile ground-truth manifest checksum does not match the selected data release");
    }
    if (!expected.release_id || loaded.data?.data_release?.id !== expected.release_id) {
      throw new Error("profile ground-truth release ID does not match the selected data release");
    }
    if (dataRelease().status === "official") {
      const groundTruthRelease = loaded.data?.data_release || {};
      if (groundTruthRelease.status !== "official" || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(groundTruthRelease.source_commit || "")) {
        throw new Error("official results require profile ground truth pinned to an immutable source commit");
      }
    }
    state.groundTruthManifestProvenance = {
      url: selectedManifestUrl,
      base_url: new URL(".", selectedManifestUrl).href,
      sha256: loaded.sha256,
      release_id: loaded.data?.data_release?.id || null,
    };
    state.groundTruthManifest = loaded.data;
    refreshCitationEligibilityUi();
    return state.groundTruthManifest;
  }

  const windsorNativeBinding = {
    schema_version: "1.0",
    release_id: "windsorml-native-profile-truth-v1-candidate",
    dataset_id: "windsorml",
    dataset_revision: "8a6ca32ae22c94f54df2186d1b0ccf9662a294c2",
    profile_support_manifest_sha256: "e660311ef82ec19347e91eeb1753c1f0af4c1bd65ba01491fb47ac960da51376",
    profile_definition_sha256: "d58014ae66d92ea5ffce3c4f3b8e206447873d563d8bc3ffb4cbeee81539e056",
    source_identity_sha256: "e9bc888931e26220a9c7bddc202a66ab96a043343bf9d70066d8de4ad8ba2cff",
    source_kind: "native_cfd",
    analytical_dummy: false,
    status: "candidate_owner_review_required",
    usage: "browser_visualization_only_not_metric_recomputation",
    series_per_case: 16,
    samples_per_series: 128,
  };
  const windsorCaseSets = {
    full: ["baseline-test", 35],
    medium: ["baseline-test", 35],
    scarce: ["baseline-test", 35],
    super_scarce: ["baseline-test", 35],
    geometry: ["geometry-test", 71],
    high_drag: ["high_drag-test", 70],
    low_drag: ["low_drag-test", 70],
    image_wake: ["image_wake-test", 71],
  };
  const windsorStationIds = {
    windsorml_velocity_constant_v1: [
      "wake_vertical_x_0p05l",
      "wake_vertical_x_0p10l",
      "wake_vertical_x_0p25l",
      "wake_vertical_x_0p50l",
      "wake_lateral_x_0p10l_y_0p194",
    ],
    windsorml_velocity_relative_v1: [
      "wake_vertical_x_0p05l_relative",
      "wake_vertical_x_0p10l_relative",
      "wake_vertical_x_0p25l_relative",
      "wake_vertical_x_0p50l_relative",
      "wake_lateral_x_0p10l_relative",
    ],
    windsorml_cp_constant_v1: ["cp_centreline_upper", "cp_base_vertical", "cp_side_horizontal_y_0p194"],
    windsorml_cp_relative_v1: ["cp_centreline_upper_relative", "cp_base_vertical_relative", "cp_side_horizontal_relative"],
  };

  function exactWindsorNativeBinding(value) {
    return Object.entries(windsorNativeBinding).every(([key, expected]) => value?.[key] === expected);
  }

  function validateWindsorNativeCase(profileCase) {
    const expected = Object.entries(windsorStationIds).flatMap(([family, stations]) => stations.map((station) => [family, station]));
    if (
      !validSha256(profileCase?.profile_support_sha256) ||
      !Number.isFinite(profileCase?.body_height_m) ||
      profileCase.body_height_m <= 0 ||
      profileCase?.reference_velocity_m_s !== 42.1 ||
      !Array.isArray(profileCase?.series) ||
      profileCase.series.length !== expected.length
    ) {
      throw new Error("WindsorML native profile case lacks complete pinned support");
    }
    for (const [index, [family, station]] of expected.entries()) {
      const series = profileCase.series[index];
      const velocity = family.includes("_velocity_");
      const relative = family.includes("_relative_");
      const ids = series?.[velocity ? "native_cell_ids" : "native_point_ids"];
      if (
        series?.family_id !== family ||
        series?.station_id !== station ||
        series?.panel_id !== (velocity ? "velocity_profiles" : "pressure_profiles") ||
        series?.quantity_id !== (velocity ? "ux_over_uinf" : "cp") ||
        series?.placement_mode !== (relative ? "relative" : "constant") ||
        series?.scoring_role !== (relative ? "report_only" : "ranked_candidate") ||
        series?.sample_count !== 128 ||
        !["m", "1"].includes(series?.coordinate_unit) ||
        !["x", "y", "z", "eta", "x_over_l"].includes(series?.coordinate_id) ||
        !Array.isArray(ids) ||
        ids.length !== 128 ||
        ids.some((id) => !Number.isSafeInteger(id) || id < 0) ||
        [series?.coordinate, series?.value].some(
          (array) => !Array.isArray(array) || array.length !== 128 || array.some((value) => !Number.isFinite(value))
        ) ||
        series.coordinate.some((value, i) => i > 0 && value <= series.coordinate[i - 1])
      ) {
        throw new Error(`WindsorML ${family}/${station} must contain the complete finite 128-point native series`);
      }
    }
  }

  async function groundTruthIndex(datasetName, splitName) {
    const manifest = await ensureGroundTruthManifest();
    const dataset = (manifest.datasets || []).find((candidate) => candidate.name === datasetName);
    const split = (dataset?.splits || []).find((candidate) => candidate.label === splitName);
    const caseSet = (dataset?.case_sets || []).find((candidate) => candidate.id === split?.case_set_id);
    if (!caseSet?.index_file) throw new Error(`${datasetName} / ${splitName} has no profile ground-truth index`);
    const indexUrl = fileUrl(caseSet.index_file, state.groundTruthManifestProvenance?.base_url || groundTruthBaseUrl);
    if (!state.groundTruthIndexes.has(indexUrl)) {
      state.groundTruthIndexes.set(indexUrl, await fetchJsonWithProvenance(indexUrl, `${datasetName} profile ground-truth index`));
    }
    const cached = state.groundTruthIndexes.get(indexUrl);
    if (!caseSet.index_sha256 || !cached.sha256 || cached.sha256 !== caseSet.index_sha256) {
      throw new Error(`${datasetName} profile ground-truth index checksum does not match its release manifest`);
    }
    const nativeTruthVersion = nativeProfileTruthVersion(cached.data, "split");
    const nativeProfileTruth = nativeTruthVersion !== null;
    const drivaermlDataset = datasetName === "DrivAerML" || dataset?.id === "drivaerml";
    const hiLiftDataset = datasetName === "HiLiftAeroML" || dataset?.id === "hiliftaeroml";
    const ahmedDataset = datasetName === "AhmedML" || dataset?.id === "ahmedml";
    const windsorDataset = datasetName === "WindsorML" || dataset?.id === "windsorml";
    const windsorNativeTruth = cached.data?.schema === "windsorml-native-profile-truth-index-v1";
    if (windsorDataset !== windsorNativeTruth) {
      throw new Error(`${datasetName} cannot use legacy, analytical, or another dataset's WindsorML truth index`);
    }
    if (windsorNativeTruth) {
      const declaration = dataset?.native_profile_truth;
      const expected = windsorCaseSets[split?.id];
      const indexedIds = caseIds(cached.data);
      if (
        !exactWindsorNativeBinding(declaration) ||
        declaration.case_count !== 233 ||
        declaration.case_set_count !== 5 ||
        !exactWindsorNativeBinding(cached.data) ||
        !expected ||
        caseSet.id !== expected[0] ||
        cached.data.case_set_id !== caseSet.id ||
        cached.data.case_id_status !== "official_intersected_with_published" ||
        split.case_count !== expected[1] ||
        caseSet.case_count !== expected[1] ||
        cached.data.case_count !== expected[1] ||
        !Array.isArray(cached.data.case_ids) ||
        cached.data.case_ids.length !== expected[1] ||
        indexedIds.length !== expected[1] ||
        new Set(indexedIds).size !== expected[1] ||
        indexedIds.some((id, i) => id !== cached.data.case_ids[i]) ||
        cached.data.chunks.some(
          (entry) => entry.case_ids.length !== 1 || entry.file !== `../cases/${entry.case_ids[0]}.json` || !validSha256(entry.sha256)
        )
      ) {
        throw new Error(`${datasetName} native CFD truth index has incomplete coverage or a stale contract binding`);
      }
    }
    const hiLiftCompactTruth =
      cached.data?.schema === hiLiftCompactTruthSchemas.index && cached.data?.schema_version === hiLiftCompactTruthSchemas.version;
    const ahmedNativeTruth = cached.data?.schema === ahmedNativeTruthSchemas.index && cached.data?.schema_version === ahmedNativeTruthSchemas.version;
    if (drivaermlDataset && !nativeProfileTruth) {
      throw new Error(
        `${datasetName} profile ground truth must use a checksum-bound native CFD v2 or v3 release; legacy or analytical indexes are unavailable`
      );
    }
    if (nativeProfileTruth && !drivaermlDataset) {
      throw new Error(`${datasetName} cannot use the DrivAerML native profile ground-truth schema`);
    }
    if (hiLiftCompactTruth && !hiLiftDataset) {
      throw new Error(`${datasetName} cannot use the HiLiftAeroML compact profile-truth schema`);
    }
    if (hiLiftDataset && !hiLiftCompactTruth) {
      throw new Error(`${datasetName} ground truth must use the checksum-bound compact Native CFD release for every official case set`);
    }
    if (ahmedNativeTruth && !ahmedDataset) {
      throw new Error(`${datasetName} cannot use the AhmedML native profile-truth schema`);
    }
    if (ahmedDataset && dataset?.native_profile_truth && !ahmedNativeTruth) {
      throw new Error(`${datasetName} ground truth must use its checksum-bound 128-point Native CFD release`);
    }
    let nativeChunkBaseUrl = null;
    let nativeMasterChunks = null;
    if (nativeProfileTruth) {
      if (
        cached.data.schema_version !== nativeProfileTruthSchemas[nativeTruthVersion].version ||
        cached.data.dataset_id !== "drivaerml" ||
        cached.data.dataset_revision !== nativeDrivaermlDatasetRevision ||
        !exactNativeTruthSource(cached.data.truth_source)
      ) {
        throw new Error(`${datasetName} native profile ground-truth index has an unsupported schema or dataset binding`);
      }
      const indexedIds = caseIds(cached.data);
      if (
        !Array.isArray(cached.data.case_ids) ||
        cached.data.case_count !== indexedIds.length ||
        cached.data.case_ids.length !== indexedIds.length ||
        new Set(indexedIds).size !== indexedIds.length ||
        cached.data.case_ids.some((caseId, index) => caseId !== indexedIds[index])
      ) {
        throw new Error(`${datasetName} native profile ground-truth thin index has incomplete, duplicate, or reordered case coverage`);
      }
      const declaration = dataset?.native_profile_truth;
      if (
        declaration?.source_kind !== "native_cfd" ||
        declaration?.analytical_dummy !== false ||
        declaration?.dataset_revision !== nativeDrivaermlDatasetRevision ||
        declaration?.native_source_pin_sha256 !== nativeDrivaermlSourcePinSha256 ||
        declaration?.case_count !== 484 ||
        !declaration?.master_index_file ||
        !validSha256(declaration?.master_index_sha256) ||
        Object.keys(declaration).length !== 7
      ) {
        throw new Error(`${datasetName} native profile ground truth lacks its non-analytical master-index declaration`);
      }
      const masterIndexUrl = fileUrl(declaration.master_index_file, state.groundTruthManifestProvenance?.base_url || groundTruthBaseUrl);
      if (!state.groundTruthIndexes.has(masterIndexUrl)) {
        state.groundTruthIndexes.set(
          masterIndexUrl,
          await fetchJsonWithProvenance(masterIndexUrl, `${datasetName} native profile ground-truth master index`)
        );
      }
      const masterLoaded = state.groundTruthIndexes.get(masterIndexUrl);
      if (!validSha256(masterLoaded.sha256) || masterLoaded.sha256 !== declaration.master_index_sha256) {
        throw new Error(`${datasetName} native profile ground-truth master index checksum does not match its declaration`);
      }
      const master = masterLoaded.data;
      if (
        master?.schema !== nativeProfileTruthSchemas[nativeTruthVersion].index ||
        master?.schema_version !== nativeProfileTruthSchemas[nativeTruthVersion].version ||
        master?.dataset_id !== "drivaerml" ||
        master?.dataset_revision !== nativeDrivaermlDatasetRevision ||
        cached.data.dataset_revision !== nativeDrivaermlDatasetRevision ||
        master?.case_count !== 484 ||
        !Array.isArray(master?.case_ids) ||
        master.case_ids.length !== 484 ||
        new Set(master.case_ids).size !== 484 ||
        master?.series_per_case !== 40 ||
        !exactNativeTruthSource(master?.truth_source)
      ) {
        throw new Error(`${datasetName} native profile ground-truth master index is incomplete or has a stale contract binding`);
      }
      const boundSplitId = nativeProfileIndexSplitId(caseSet.id, split?.id);
      const masterSplit = (master.splits || []).find((candidate) => candidate.split_id === boundSplitId);
      if (
        !masterSplit ||
        masterSplit.sha256 !== cached.sha256 ||
        new URL(masterSplit.path, new URL(".", masterIndexUrl)).href !== indexUrl ||
        masterSplit.case_count !== cached.data.case_count
      ) {
        throw new Error(`${datasetName} native thin index is not bound by the checksum-verified all-484 master index`);
      }
      const masterChunks = master.chunks || [];
      const masterChunkCaseIds = masterChunks.flatMap((entry) => entry.case_ids || []);
      if (
        !masterChunks.length ||
        masterChunkCaseIds.length !== master.case_ids.length ||
        masterChunkCaseIds.some((caseId, index) => caseId !== master.case_ids[index]) ||
        new Set(masterChunks.map((entry) => entry.chunk_id)).size !== masterChunks.length ||
        masterChunks.some(
          (entry) =>
            !validSha256(entry.sha256) ||
            !entry.path ||
            entry.case_count !== (entry.case_ids || []).length ||
            entry.series_count !== (entry.case_ids || []).length * 40
        )
      ) {
        throw new Error(`${datasetName} native profile master chunks are incomplete, duplicated, gapped, reordered, or unverified`);
      }
      nativeMasterChunks = new Map(masterChunks.map((entry) => [entry.chunk_id, entry]));
      for (const reference of cached.data.chunk_refs || []) {
        const masterChunk = nativeMasterChunks.get(reference.chunk_id);
        const referencedSet = new Set(reference.case_ids || []);
        const masterOrder = (masterChunk?.case_ids || []).filter((caseId) => referencedSet.has(caseId));
        if (
          !masterChunk ||
          reference.path !== masterChunk.path ||
          reference.sha256 !== masterChunk.sha256 ||
          !Array.isArray(reference.case_ids) ||
          reference.case_ids.length !== masterOrder.length ||
          reference.case_ids.some((caseId, index) => caseId !== masterOrder[index])
        ) {
          throw new Error(`${datasetName} native thin index contains an unbound or reordered shared chunk reference`);
        }
      }
      nativeChunkBaseUrl = new URL(".", masterIndexUrl).href;
    }
    if (hiLiftCompactTruth) {
      const declaration = dataset?.compact_profile_truth;
      const indexedIds = caseIds(cached.data);
      const indexedChunks = cached.data?.chunks || [];
      const masterIndexUrl = fileUrl(declaration?.master_index_file, state.groundTruthManifestProvenance?.base_url || groundTruthBaseUrl);
      if (
        declaration?.source_kind !== "native_cfd" ||
        declaration?.analytical_dummy !== false ||
        declaration?.plot_only !== true ||
        declaration?.release_id !== hiLiftCompactTruthReleaseId ||
        declaration?.format !== hiLiftCompactTruthSchemas.format ||
        declaration?.profile_contract_id !== hiLiftCompactProfileContractId ||
        declaration?.profile_contract_sha256 !== hiLiftCompactProfileContractSha256 ||
        declaration?.case_count !== hiLiftCompactTruthCaseCount ||
        declaration?.case_set_count !== hiLiftCompactTruthCaseSetCount ||
        !validSha256(declaration?.master_index_sha256)
      ) {
        throw new Error(`${datasetName} compact Native CFD truth lacks its exact public plot-release declaration`);
      }
      if (!state.groundTruthIndexes.has(masterIndexUrl)) {
        state.groundTruthIndexes.set(
          masterIndexUrl,
          await fetchJsonWithProvenance(masterIndexUrl, `${datasetName} compact profile-truth master index`)
        );
      }
      const masterLoaded = state.groundTruthIndexes.get(masterIndexUrl);
      const master = masterLoaded.data;
      const masterCaseSets = master?.case_sets || [];
      if (
        !masterLoaded.sha256 ||
        masterLoaded.sha256 !== declaration.master_index_sha256 ||
        master?.schema !== hiLiftCompactTruthSchemas.master ||
        master?.schema_version !== hiLiftCompactTruthSchemas.version ||
        master?.format !== hiLiftCompactTruthSchemas.format ||
        master?.release_id !== hiLiftCompactTruthReleaseId ||
        master?.status !== "public_plot_only_candidate" ||
        master?.usage !== "browser_visualization_only_not_metric_recomputation" ||
        master?.dataset_id !== "hiliftaeroml" ||
        master?.profile_contract_id !== hiLiftCompactProfileContractId ||
        master?.profile_contract_sha256 !== hiLiftCompactProfileContractSha256 ||
        master?.case_count !== hiLiftCompactTruthCaseCount ||
        !Array.isArray(master?.case_ids) ||
        master.case_ids.length !== hiLiftCompactTruthCaseCount ||
        new Set(master.case_ids).size !== hiLiftCompactTruthCaseCount ||
        master?.case_set_count !== hiLiftCompactTruthCaseSetCount ||
        !Array.isArray(masterCaseSets) ||
        masterCaseSets.length !== hiLiftCompactTruthCaseSetCount ||
        new Set(masterCaseSets.map((entry) => entry.case_set_id)).size !== hiLiftCompactTruthCaseSetCount ||
        !validSha256(master?.common_support?.sha256) ||
        master?.common_support?.row_count !== 4005 ||
        master?.common_support?.rows_per_station !== 801
      ) {
        throw new Error(`${datasetName} compact Native CFD master index has incomplete coverage or a stale contract binding`);
      }
      const masterCaseSet = masterCaseSets.find((entry) => entry.case_set_id === caseSet.id);
      if (
        !masterCaseSet ||
        masterCaseSet.sha256 !== cached.sha256 ||
        masterCaseSet.case_count !== caseSet.case_count ||
        new URL(masterCaseSet.file, new URL(".", masterIndexUrl)).href !== indexUrl
      ) {
        throw new Error(`${datasetName} compact truth case-set index is not bound by the checksum-verified all-1,355 master index`);
      }
      if (
        cached.data?.format !== hiLiftCompactTruthSchemas.format ||
        cached.data?.release_id !== hiLiftCompactTruthReleaseId ||
        cached.data?.status !== "public_plot_only_candidate" ||
        cached.data?.usage !== "browser_visualization_only_not_metric_recomputation" ||
        cached.data?.dataset_id !== "hiliftaeroml" ||
        cached.data?.case_set_id !== caseSet.id ||
        cached.data?.profile_contract_id !== hiLiftCompactProfileContractId ||
        cached.data?.profile_contract_sha256 !== hiLiftCompactProfileContractSha256 ||
        cached.data?.case_count !== caseSet.case_count ||
        cached.data?.case_count !== split?.case_count ||
        !Array.isArray(cached.data?.case_ids) ||
        cached.data.case_ids.length !== caseSet.case_count ||
        new Set(cached.data.case_ids).size !== caseSet.case_count ||
        indexedIds.length !== caseSet.case_count ||
        indexedIds.some((caseId, index) => caseId !== cached.data.case_ids[index]) ||
        !validSha256(cached.data?.common_support?.sha256) ||
        cached.data.common_support.sha256 !== master.common_support.sha256 ||
        cached.data?.common_support?.row_count !== 4005 ||
        cached.data?.common_support?.rows_per_station !== 801 ||
        !Array.isArray(indexedChunks) ||
        indexedChunks.length !== Math.ceil(caseSet.case_count / 10) ||
        indexedChunks.some(
          (entry) =>
            !entry?.file ||
            !validSha256(entry.sha256) ||
            entry.case_count !== (entry.case_ids || []).length ||
            entry.case_count < 1 ||
            entry.case_count > 10
        )
      ) {
        throw new Error(`${datasetName} compact Native CFD truth index has incomplete coverage or a stale contract binding`);
      }
    }
    if (ahmedNativeTruth) {
      const declaration = dataset?.native_profile_truth;
      const indexedIds = caseIds(cached.data);
      const indexedChunks = cached.data?.chunks || [];
      if (
        declaration?.source_kind !== "native_cfd" ||
        declaration?.analytical_dummy !== false ||
        declaration?.dataset_revision !== ahmedNativeDatasetRevision ||
        declaration?.source_identity_sha256 !== ahmedNativeSourceIdentitySha256 ||
        declaration?.profile_definition_sha256 !== ahmedNativeProfileDefinitionSha256 ||
        declaration?.release_id !== ahmedNativeTruthReleaseId ||
        declaration?.case_count !== 316 ||
        declaration?.case_set_count !== 5 ||
        declaration?.series_per_case !== 7 ||
        declaration?.samples_per_series !== 128 ||
        !declaration?.master_index_file ||
        !validSha256(declaration?.master_index_sha256)
      ) {
        throw new Error(`${datasetName} native CFD truth lacks its exact all-316 release declaration`);
      }
      if (
        cached.data?.release_id !== ahmedNativeTruthReleaseId ||
        cached.data?.status !== "candidate_owner_review_required" ||
        cached.data?.usage !== "browser_visualization_only_not_metric_recomputation" ||
        cached.data?.dataset_id !== "ahmedml" ||
        cached.data?.dataset_revision !== ahmedNativeDatasetRevision ||
        cached.data?.source_identity_sha256 !== ahmedNativeSourceIdentitySha256 ||
        cached.data?.profile_definition_sha256 !== ahmedNativeProfileDefinitionSha256 ||
        cached.data?.case_set_id !== caseSet.id ||
        cached.data?.case_id_status !== "official" ||
        cached.data?.case_count !== caseSet.case_count ||
        cached.data?.case_count !== split?.case_count ||
        cached.data?.series_per_case !== 7 ||
        cached.data?.samples_per_series !== 128 ||
        !exactAhmedNativeTruthSource(cached.data?.truth_source) ||
        !Array.isArray(cached.data?.case_ids) ||
        cached.data.case_ids.length !== caseSet.case_count ||
        indexedIds.length !== caseSet.case_count ||
        indexedIds.some((caseId, index) => caseId !== cached.data.case_ids[index]) ||
        new Set(indexedIds).size !== indexedIds.length ||
        !Array.isArray(indexedChunks) ||
        indexedChunks.some(
          (entry) =>
            !entry?.file ||
            !validSha256(entry.sha256) ||
            entry.case_count !== (entry.case_ids || []).length ||
            entry.series_count !== 7 * entry.case_count
        )
      ) {
        throw new Error(`${datasetName} native CFD truth index has incomplete coverage or a stale contract binding`);
      }
      const masterIndexUrl = fileUrl(declaration.master_index_file, state.groundTruthManifestProvenance?.base_url || groundTruthBaseUrl);
      if (!state.groundTruthIndexes.has(masterIndexUrl)) {
        state.groundTruthIndexes.set(
          masterIndexUrl,
          await fetchJsonWithProvenance(masterIndexUrl, `${datasetName} native profile-truth master index`)
        );
      }
      const masterLoaded = state.groundTruthIndexes.get(masterIndexUrl);
      const master = masterLoaded.data;
      const masterCaseSets = master?.case_sets || [];
      if (
        masterLoaded.sha256 !== declaration.master_index_sha256 ||
        master?.schema !== ahmedNativeTruthSchemas.master ||
        master?.schema_version !== ahmedNativeTruthSchemas.version ||
        master?.release_id !== ahmedNativeTruthReleaseId ||
        master?.status !== "candidate_owner_review_required" ||
        master?.usage !== "browser_visualization_only_not_metric_recomputation" ||
        master?.dataset_id !== "ahmedml" ||
        master?.dataset_revision !== ahmedNativeDatasetRevision ||
        master?.source_identity_sha256 !== ahmedNativeSourceIdentitySha256 ||
        master?.profile_definition_sha256 !== ahmedNativeProfileDefinitionSha256 ||
        master?.case_count !== 316 ||
        !Array.isArray(master?.case_ids) ||
        master.case_ids.length !== 316 ||
        new Set(master.case_ids).size !== 316 ||
        master?.case_set_count !== 5 ||
        !Array.isArray(masterCaseSets) ||
        masterCaseSets.length !== 5 ||
        new Set(masterCaseSets.map((entry) => entry.case_set_id)).size !== 5 ||
        master?.series_per_case !== 7 ||
        master?.samples_per_series !== 128 ||
        !exactAhmedNativeTruthSource(master?.truth_source)
      ) {
        throw new Error(`${datasetName} native CFD master index has incomplete or stale all-316 coverage`);
      }
      const masterCaseSet = masterCaseSets.find((entry) => entry.case_set_id === caseSet.id);
      if (
        !masterCaseSet ||
        masterCaseSet.sha256 !== cached.sha256 ||
        masterCaseSet.case_count !== caseSet.case_count ||
        masterCaseSet.case_id_status !== "official" ||
        new URL(masterCaseSet.file, new URL(".", masterIndexUrl)).href !== indexUrl
      ) {
        throw new Error(`${datasetName} case-set truth is not bound by the checksum-verified all-316 master index`);
      }
    }
    return {
      index: cached.data,
      indexUrl,
      indexSha256: cached.sha256,
      caseSetId: caseSet.id,
      nativeProfileTruth,
      nativeTruthVersion,
      datasetRevision: cached.data?.dataset_revision || null,
      nativeChunkBaseUrl,
      nativeMasterChunks,
      hiLiftCompactTruth,
      ahmedNativeTruth,
      windsorNativeTruth,
    };
  }

  async function submissionProfileIndex(row) {
    const indexFile = row.profile_data?.index_file;
    if (!indexFile) throw new Error(`${rowLabel(row)} has no profile index`);
    const indexUrl = fileUrl(indexFile);
    if (!state.profileIndexes.has(indexUrl)) {
      state.profileIndexes.set(indexUrl, await fetchJsonWithProvenance(indexUrl, `${rowLabel(row)} profile index`));
    }
    const cached = state.profileIndexes.get(indexUrl);
    if (!row.profile_data?.index_sha256 || !cached.sha256 || cached.sha256 !== row.profile_data.index_sha256) {
      throw new Error(`${rowLabel(row)} profile index checksum does not match the verified leaderboard feed`);
    }
    const hiLiftCompactPrediction = cached.data?.format === hiLiftCompactPredictionFormat;
    const expectedCaseSetId = row.profile_data?.case_set_id || row.case_set_id;
    const expectedCaseCount = row.profile_data?.case_count;
    const predictionCaseIds = caseIds(cached.data);
    if (
      hiLiftCompactPrediction &&
      (cached.data?.contract_id !== hiLiftCompactProfileContractId ||
        cached.data?.contract_sha256 !== hiLiftCompactProfileContractSha256 ||
        cached.data?.dataset_id !== "hiliftaeroml" ||
        !expectedCaseSetId ||
        cached.data?.case_set_id !== expectedCaseSetId ||
        !Number.isInteger(expectedCaseCount) ||
        cached.data?.case_count !== expectedCaseCount ||
        predictionCaseIds.length !== expectedCaseCount ||
        new Set(predictionCaseIds).size !== expectedCaseCount)
    ) {
      throw new Error(`${rowLabel(row)} compact HiLift profile index has incomplete coverage or a stale contract binding`);
    }
    return {
      index: cached.data,
      indexUrl,
      indexSha256: cached.sha256,
      caseSetId: expectedCaseSetId,
      hiLiftCompactPrediction,
    };
  }

  function caseIds(index) {
    const references = isNativeProfileTruthSplitIndex(index) ? index?.chunk_refs : index?.chunks;
    return (references || []).flatMap((chunk) => chunk.case_ids || []);
  }

  function nativeProfileIndexSplitId(caseSetId, selectedSplitId) {
    const canonicalSplitByCaseSet = {
      standard: "full",
      geometry: "geometry",
      high_drag: "high_drag",
      low_drag: "low_drag",
      rear_separation: "rear_separation",
    };
    return canonicalSplitByCaseSet[caseSetId] || selectedSplitId;
  }

  async function indexedProfileCase(context, caseId, cache, label) {
    const references = isNativeProfileTruthSplitIndex(context.index) ? context.index?.chunk_refs : context.index?.chunks;
    const entry = (references || []).find((chunk) => (chunk.case_ids || []).includes(caseId));
    if (!entry) return null;
    const chunkPath = entry.path || entry.file;
    if (!chunkPath) throw new Error(`${label} profile chunk reference has no repository path`);
    const chunkUrl = new URL(chunkPath, context.nativeChunkBaseUrl || context.indexUrl).href;
    if (context.nativeProfileTruth) {
      const masterChunk = context.nativeMasterChunks?.get(entry.chunk_id);
      if (!masterChunk || masterChunk.path !== chunkPath || masterChunk.sha256 !== entry.sha256) {
        throw new Error(`${label} native profile chunk is not bound by the verified all-484 master index`);
      }
    }
    if (!cache.has(chunkUrl)) cache.set(chunkUrl, await fetchJsonWithProvenance(chunkUrl, `${label} profile chunk`));
    const cached = cache.get(chunkUrl);
    if (context.nativeProfileTruth && (!validSha256(entry.sha256) || !validSha256(cached.sha256))) {
      throw new Error(`${label} native profile chunk is unavailable because its SHA-256 bytes could not be verified`);
    }
    if (!entry.sha256 || !cached.sha256 || entry.sha256 !== cached.sha256) {
      throw new Error(`${label} profile chunk checksum does not match its index`);
    }
    if (context.windsorNativeTruth) {
      if (
        cached.data?.schema !== "windsorml-native-profile-truth-chunk-v1" ||
        !exactWindsorNativeBinding(cached.data) ||
        !Array.isArray(cached.data.cases) ||
        cached.data.cases.length !== 1 ||
        cached.data.cases[0]?.case_id !== caseId
      ) {
        throw new Error(`${label} WindsorML native profile chunk has an unsupported or stale contract binding`);
      }
      validateWindsorNativeCase(cached.data.cases[0]);
    }
    if (context.hiLiftCompactTruth) {
      if (
        cached.data?.schema !== hiLiftCompactTruthSchemas.chunk ||
        cached.data?.schema_version !== hiLiftCompactTruthSchemas.version ||
        cached.data?.format !== hiLiftCompactTruthSchemas.format ||
        cached.data?.release_id !== hiLiftCompactTruthReleaseId ||
        cached.data?.dataset_id !== "hiliftaeroml" ||
        cached.data?.case_set_id !== context.caseSetId
      ) {
        throw new Error(`${label} compact Native CFD truth chunk has an unsupported or stale contract binding`);
      }
    }
    if (context.hiLiftCompactPrediction) {
      if (
        cached.data?.schema !== "hiliftaeroml-compact-profile-chunk-v2-candidate" ||
        cached.data?.schema_version !== "2.0" ||
        cached.data?.format !== hiLiftCompactPredictionFormat ||
        cached.data?.contract_id !== hiLiftCompactProfileContractId ||
        cached.data?.contract_sha256 !== hiLiftCompactProfileContractSha256 ||
        cached.data?.dataset_id !== "hiliftaeroml" ||
        cached.data?.case_set_id !== context.caseSetId
      ) {
        throw new Error(`${label} compact HiLift prediction chunk has an unsupported or stale contract binding`);
      }
    }
    if (context.ahmedNativeTruth) {
      const loadedCaseIds = (cached.data?.cases || []).map((candidate) => candidate.case_id);
      if (
        cached.data?.schema !== ahmedNativeTruthSchemas.chunk ||
        cached.data?.schema_version !== ahmedNativeTruthSchemas.version ||
        cached.data?.release_id !== ahmedNativeTruthReleaseId ||
        cached.data?.dataset_id !== "ahmedml" ||
        cached.data?.dataset_revision !== ahmedNativeDatasetRevision ||
        cached.data?.source_identity_sha256 !== ahmedNativeSourceIdentitySha256 ||
        cached.data?.profile_definition_sha256 !== ahmedNativeProfileDefinitionSha256 ||
        cached.data?.case_set_id !== context.caseSetId ||
        cached.data?.series_per_case !== 7 ||
        cached.data?.samples_per_series !== 128 ||
        !exactAhmedNativeTruthSource(cached.data?.truth_source) ||
        cached.data?.case_count !== loadedCaseIds.length ||
        loadedCaseIds.length !== (entry.case_ids || []).length ||
        (cached.data?.case_ids || []).some((loadedCaseId, index) => loadedCaseId !== loadedCaseIds[index]) ||
        loadedCaseIds.some((loadedCaseId, index) => loadedCaseId !== (entry.case_ids || [])[index]) ||
        (cached.data?.cases || []).some(
          (candidate) =>
            !exactAhmedNativeTruthSource(candidate?.truth_source) ||
            !Array.isArray(candidate?.series) ||
            candidate.series.length !== ahmedNativeSeriesContract.length ||
            candidate.series.some((series, seriesIndex) => {
              const [panelId, stationId, quantityId, coordinateId, start, end] = ahmedNativeSeriesContract[seriesIndex] || [];
              const coordinate = series?.coordinate;
              const values = series?.value;
              return (
                series?.panel_id !== panelId ||
                series?.station_id !== stationId ||
                series?.quantity_id !== quantityId ||
                series?.coordinate_id !== coordinateId ||
                series?.coordinate_unit !== "1" ||
                series?.source !== "evaluator_owned_frozen_native_cell_mapping" ||
                series?.sample_count !== 128 ||
                !Array.isArray(coordinate) ||
                !Array.isArray(values) ||
                coordinate.length !== 128 ||
                values.length !== 128 ||
                coordinate.some(
                  (value, sampleIndex) =>
                    !Number.isFinite(Number(value)) || Math.abs(Number(value) - (start + ((end - start) * sampleIndex) / 127)) > 1e-12
                ) ||
                values.some((value) => !Number.isFinite(Number(value)))
              );
            })
        )
      ) {
        throw new Error(`${label} AhmedML native profile chunk has an unsupported or stale contract binding`);
      }
    }
    if (context.hiLiftCompactTruth || context.hiLiftCompactPrediction) {
      const loadedCaseIds = (cached.data?.cases || []).map((candidate) => candidate.case_id);
      if (
        loadedCaseIds.length !== (entry.case_ids || []).length ||
        loadedCaseIds.some((loadedCaseId, index) => loadedCaseId !== entry.case_ids[index]) ||
        new Set(loadedCaseIds).size !== loadedCaseIds.length ||
        (context.hiLiftCompactTruth &&
          (cached.data?.case_count !== loadedCaseIds.length ||
            (cached.data?.case_ids || []).some((loadedCaseId, index) => loadedCaseId !== loadedCaseIds[index])))
      ) {
        throw new Error(`${label} compact HiLift chunk case order differs from its checksum-verified index`);
      }
    }
    if (context.nativeProfileTruth) {
      if (
        cached.data?.schema !== nativeProfileTruthSchemas[context.nativeTruthVersion]?.chunk ||
        cached.data?.schema_version !== nativeProfileTruthSchemas[context.nativeTruthVersion]?.version ||
        cached.data?.dataset_id !== "drivaerml" ||
        cached.data?.dataset_revision !== context.datasetRevision ||
        !exactNativeTruthSource(cached.data?.truth_source)
      ) {
        throw new Error(`${label} native profile chunk has an unsupported or stale contract binding`);
      }
      const declaredCaseIds = cached.data.case_ids || [];
      const loadedCaseIds = (cached.data.cases || []).map((candidate) => candidate.case_id);
      const referencedSet = new Set(entry.case_ids || []);
      const referencedMasterOrder = loadedCaseIds.filter((loadedCaseId) => referencedSet.has(loadedCaseId));
      if (
        declaredCaseIds.length !== loadedCaseIds.length ||
        declaredCaseIds.some((declaredId, index) => declaredId !== loadedCaseIds[index]) ||
        new Set(loadedCaseIds).size !== loadedCaseIds.length ||
        (entry.case_ids || []).length !== referencedMasterOrder.length ||
        (entry.case_ids || []).some((declaredId, index) => declaredId !== referencedMasterOrder[index])
      ) {
        throw new Error(`${label} native profile chunk case order differs from its checksum-verified thin index`);
      }
    }
    const matches = (cached.data?.cases || []).filter((candidate) => candidate.case_id === caseId);
    if (matches.length > 1) throw new Error(`${label} profile chunk contains duplicate case ${caseId}`);
    const profileCase = matches[0];
    if (!profileCase) return null;
    if (context.nativeProfileTruth && !exactNativeTruthSource(profileCase.truth_source)) {
      throw new Error(`${label} native profile case lacks its exact pinned non-analytical CFD truth declaration`);
    }
    if (context.ahmedNativeTruth && !exactAhmedNativeTruthSource(profileCase.truth_source)) {
      throw new Error(`${label} AhmedML profile case lacks its exact pinned non-analytical CFD truth declaration`);
    }
    const relativeProfileV3 = cached.data?.schema_version === drivaermlRelativeProfileSchemaVersion;
    if (context.nativeProfileTruth || relativeProfileV3) await bindProfileCoordinateIdentities(profileCase);
    return {
      ...profileCase,
      _fluidsbenchNativeProfileTruth: Boolean(context.nativeProfileTruth),
      _fluidsbenchNativeProfileTruthVersion: context.nativeTruthVersion || null,
      _fluidsbenchRelativeProfileV3: relativeProfileV3,
      _fluidsbenchHiLiftCompactTruth: Boolean(context.hiLiftCompactTruth),
      _fluidsbenchHiLiftCompactPrediction: Boolean(context.hiLiftCompactPrediction),
      _fluidsbenchAhmedNativeProfileTruth: Boolean(context.ahmedNativeTruth),
      _fluidsbenchWindsorNativeProfileTruth: Boolean(context.windsorNativeTruth),
      _fluidsbenchHiLiftIndex: context.hiLiftCompactTruth ? context.index : null,
      _fluidsbenchArtifactBaseUrl: context.hiLiftCompactTruth || context.hiLiftCompactPrediction ? new URL(".", context.indexUrl).href : baseUrl,
      _fluidsbenchProfileSchema: cached.data?.schema || cached.data?.schema_version || null,
      _fluidsbenchProvenance: {
        index_url: context.indexUrl,
        index_sha256: context.indexSha256 || null,
        chunk_url: chunkUrl,
        chunk_declared_sha256: entry.sha256 || null,
        chunk_downloaded_sha256: cached.sha256 || null,
      },
    };
  }

  function ranking() {
    return activeDataset()?.ranking || { metric_id: activeMetricDefinitions()[0]?.id, direction: "higher" };
  }

  function rankingDecimalPlaces() {
    const selectedRanking = ranking();
    const definition = metricDefinition(selectedRanking.metric_id);
    const configured =
      selectedRanking.decimal_places ?? selectedRanking.precision?.decimal_places ?? selectedRanking.precision_digits ?? definition?.digits ?? 2;
    const digits = finiteNumber(configured);
    return digits === null ? 2 : Math.max(0, Math.min(12, Math.trunc(digits)));
  }

  function rankingPolicy() {
    const selectedRanking = ranking();
    const contract = state.manifest?.ranking_contract || {};
    return {
      metric_id: selectedRanking.metric_id,
      direction: selectedRanking.direction === "lower" ? "lower" : "higher",
      decimal_places: rankingDecimalPlaces(),
      rounding: selectedRanking.precision?.rounding || selectedRanking.rounding || contract.rounding || "decimal_half_up",
      method: selectedRanking.method || contract.method || "competition",
      scope: "exact_data_release_dataset_split",
    };
  }

  function decimalHalfUp(value, decimalPlaces) {
    const number = finiteNumber(value);
    if (number === null) return null;
    const [coefficient, exponentText = "0"] = Math.abs(number).toString().toLowerCase().split("e");
    const [whole, fraction = ""] = coefficient.split(".");
    let digits = `${whole}${fraction}`;
    let decimalPosition = whole.length + Number(exponentText);
    if (decimalPosition < 0) {
      digits = `${"0".repeat(-decimalPosition)}${digits}`;
      decimalPosition = 0;
    }
    const cut = decimalPosition + decimalPlaces;
    if (digits.length <= cut) digits = digits.padEnd(cut + 1, "0");
    const retained = digits.slice(0, cut) || "0";
    const nextDigit = Number(digits[cut] || "0");
    const roundedInteger = BigInt(retained) + (nextDigit >= 5 ? 1n : 0n);
    const rounded = (number < 0 ? -1 : 1) * (Number(roundedInteger) / 10 ** decimalPlaces);
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  function rankedDisplayValue(value, policy = rankingPolicy()) {
    const rounded = decimalHalfUp(value, policy.decimal_places);
    return rounded === null ? "N/A" : rounded.toFixed(policy.decimal_places);
  }

  function isNonRankedDevelopmentFixture(row) {
    return row?.record_type === "development_fixture";
  }

  function nonRankedDevelopmentFixtureRanking(row, policy, rankedResultCount) {
    return {
      ...policy,
      value: finiteNumber(row?.metricValues?.[policy.metric_id]),
      ranked_value: null,
      display_value: "Non-ranked",
      unit: metricDefinition(policy.metric_id)?.unit || "",
      rank: null,
      ranked_result_count: rankedResultCount,
      tied: false,
      tie_count: 0,
      source: "non_ranked_development_fixture",
    };
  }

  function generatedRanking(row, policy) {
    if (isNonRankedDevelopmentFixture(row)) return null;
    const generated = row.ranking;
    if (!state.feedVerified || !generated || typeof generated !== "object") return null;
    const requiredNumberFields = ["value", "ranked_value", "rank", "ranked_result_count", "tie_count"];
    if (requiredNumberFields.some((field) => finiteNumber(generated[field]) === null)) return null;
    if (
      generated.metric_id !== policy.metric_id ||
      generated.direction !== policy.direction ||
      Number(generated.decimal_places) !== policy.decimal_places ||
      generated.rounding !== policy.rounding ||
      generated.method !== policy.method
    ) {
      return null;
    }
    return {
      metric_id: generated.metric_id,
      value: Number(generated.value),
      ranked_value: Number(generated.ranked_value),
      display_value: String(generated.display_value ?? rankedDisplayValue(generated.ranked_value, policy)),
      unit: String(generated.unit || ""),
      direction: generated.direction,
      decimal_places: policy.decimal_places,
      rounding: generated.rounding,
      method: generated.method,
      rank: Number(generated.rank),
      ranked_result_count: Number(generated.ranked_result_count),
      tied: Boolean(generated.tied),
      tie_count: Number(generated.tie_count),
      source: "hash_verified_feed",
    };
  }

  function fallbackRankings(rows, policy) {
    const ranked = rows
      .map((row) => ({
        row,
        value: finiteNumber(row.metricValues[policy.metric_id]),
        rankedValue: decimalHalfUp(row.metricValues[policy.metric_id], policy.decimal_places),
      }))
      .sort((a, b) => {
        const compared = compareNumbers(a.rankedValue, b.rankedValue, policy.direction);
        return compared || String(a.row.id).localeCompare(String(b.row.id));
      });
    const rankedResultCount = ranked.filter(({ rankedValue }) => rankedValue !== null).length;
    const tieCounts = new Map();
    ranked.forEach(({ rankedValue }) => {
      if (rankedValue === null) return;
      const key = String(rankedValue);
      tieCounts.set(key, (tieCounts.get(key) || 0) + 1);
    });
    let previousRankedValue = null;
    let competitionRank = null;
    let rankedPosition = 0;
    return ranked.map(({ row, value, rankedValue }) => {
      if (rankedValue === null) {
        return {
          row,
          ranking: {
            ...policy,
            value: null,
            ranked_value: null,
            display_value: "N/A",
            unit: metricDefinition(policy.metric_id)?.unit || "",
            rank: null,
            ranked_result_count: rankedResultCount,
            tied: false,
            tie_count: 0,
            source: "computed_fallback",
          },
        };
      }
      rankedPosition += 1;
      if (previousRankedValue === null || rankedValue !== previousRankedValue) competitionRank = rankedPosition;
      previousRankedValue = rankedValue;
      const tieCount = tieCounts.get(String(rankedValue)) || 1;
      return {
        row,
        ranking: {
          ...policy,
          value,
          ranked_value: rankedValue,
          display_value: rankedDisplayValue(rankedValue, policy),
          unit: metricDefinition(policy.metric_id)?.unit || "",
          rank: competitionRank,
          ranked_result_count: rankedResultCount,
          tied: tieCount > 1,
          tie_count: tieCount,
          source: "computed_fallback",
        },
      };
    });
  }

  function generatedRankingMatches(generated, fallback) {
    if (!generated || !fallback) return false;
    const fields = [
      "metric_id",
      "value",
      "ranked_value",
      "display_value",
      "unit",
      "direction",
      "decimal_places",
      "rounding",
      "method",
      "rank",
      "ranked_result_count",
      "tied",
      "tie_count",
    ];
    return fields.every((field) => String(generated[field]) === String(fallback[field]));
  }

  function compareNumbers(a, b, direction) {
    const aValue = finiteNumber(a);
    const bValue = finiteNumber(b);
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    return direction === "lower" ? aValue - bValue : bValue - aValue;
  }

  function rowsForActiveSplit() {
    const allRows = (state.rows.get(state.dataset) || []).filter((row) => row.split === state.split);
    const rankableRows = allRows.filter((row) => !isNonRankedDevelopmentFixture(row));
    const policy = rankingPolicy();
    const fallback = fallbackRankings(rankableRows, policy);
    const fallbackById = new Map(fallback.map((item) => [item.row.id, item.ranking]));
    const generated = rankableRows.map((row) => generatedRanking(row, policy));
    const generatedIsConsistent =
      generated.length && generated.every((item, index) => generatedRankingMatches(item, fallbackById.get(rankableRows[index].id)));
    let rankedRows;
    if (generatedIsConsistent) {
      const generatedById = new Map(rankableRows.map((row, index) => [row.id, generated[index]]));
      rankedRows = fallback.map(({ row }) => {
        const verifiedRanking = { ...generatedById.get(row.id), source: "verified_generated_release" };
        return { ...row, rank: verifiedRanking.rank, _ranking: verifiedRanking };
      });
    } else {
      const generatedWasPresent = rankableRows.some((row) => row.ranking && typeof row.ranking === "object");
      rankedRows = fallback.map(({ row, ranking: rowRanking }) => {
        const verifiedFallback = {
          ...rowRanking,
          source: generatedWasPresent ? "computed_fallback_generated_release_mismatch" : "computed_fallback_legacy_release",
        };
        return { ...row, rank: verifiedFallback.rank, _ranking: verifiedFallback };
      });
    }
    const rankedResultCount = fallback[0]?.ranking?.ranked_result_count || 0;
    const developmentFixtures = allRows.filter(isNonRankedDevelopmentFixture).map((row) => {
      const fixtureRanking = nonRankedDevelopmentFixtureRanking(row, policy, rankedResultCount);
      return { ...row, rank: null, _ranking: fixtureRanking };
    });
    return [...rankedRows, ...developmentFixtures];
  }

  function revisionRowsForActiveSplit() {
    const currentRows = rowsForActiveSplit();
    const currentById = new Map(currentRows.map((row) => [row.id, row]));
    return (state.revisionRows.get(state.dataset) || []).filter((row) => row.split === state.split).map((row) => currentById.get(row.id) || row);
  }

  function resultRowById(resultId) {
    if (!resultId) return null;
    return rowsForActiveSplit().find((row) => row.id === resultId) || revisionRowsForActiveSplit().find((row) => row.id === resultId) || null;
  }

  function versionsForRow(row) {
    const revision = resultRevision(row);
    return revisionRowsForActiveSplit()
      .filter((candidate) => resultRevision(candidate).series_id === revision.series_id)
      .sort((left, right) => resultRevision(right).version - resultRevision(left).version);
  }

  function rowRanking(row) {
    if (row && !isLatestRevision(row)) return null;
    return row?._ranking || generatedRanking(row, rankingPolicy()) || fallbackRankings([row], rankingPolicy())[0]?.ranking || null;
  }

  function rowsForCurrentModelType() {
    return rowsForActiveSplit().filter((row) => !state.modelType || row.modelTypes.includes(state.modelType));
  }

  function tableRowsForCurrentModelType() {
    const rows = state.showAllVersions ? revisionRowsForActiveSplit() : rowsForActiveSplit();
    return rows.filter((row) => !state.modelType || row.modelTypes.includes(state.modelType));
  }

  function figureRows() {
    return rowsForCurrentModelType().filter((row) => state.comparedModelIds.has(row.id));
  }

  function filteredRows() {
    const ranked = tableRowsForCurrentModelType();
    if (state.sortKey === "rank") {
      const direction = state.sortDirection === "asc" ? "lower" : "higher";
      return ranked.slice().sort((a, b) => compareNumbers(a.rank, b.rank, direction) || String(a.id).localeCompare(String(b.id)));
    }
    const direction = state.sortDirection === "asc" ? "lower" : "higher";
    return ranked.slice().sort((a, b) => {
      if (state.sortKey.startsWith("metric:")) {
        const metricId = state.sortKey.slice(7);
        return compareNumbers(a.metricValues[metricId], b.metricValues[metricId], direction);
      }
      if (state.sortKey === "parameters") {
        return compareNumbers(a.parameterCount, b.parameterCount, direction);
      }
      if (state.sortKey === "predictionData") {
        return compareNumbers(a.predictionDataRank, b.predictionDataRank, direction);
      }
      const aValue = String(a[state.sortKey] || "");
      const bValue = String(b[state.sortKey] || "");
      return aValue.localeCompare(bValue) * (state.sortDirection === "asc" ? 1 : -1);
    });
  }

  function rowLabel(row) {
    const duplicateModelCount = rowsForActiveSplit().filter((candidate) => candidate.model === row.model).length;
    return duplicateModelCount > 1 ? `${row.model} (${row.id})` : row.model;
  }

  function formatNumber(value, digits) {
    const number = finiteNumber(value);
    if (number === null) return "N/A";
    return number.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function formatMetric(value, definition) {
    const isRankingMetric = definition?.id && definition.id === ranking().metric_id;
    const digits = isRankingMetric ? rankingDecimalPlaces() : definition?.digits ?? 2;
    const displayValue = isRankingMetric ? decimalHalfUp(value, digits) : value;
    const formatted = formatNumber(displayValue, digits);
    if (formatted === "N/A" || !definition?.unit) return formatted;
    return `${formatted}${definition.unit === "%" ? "" : " "}${definition.unit}`;
  }

  function safeHttpUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function releaseArchiveUrl() {
    return safeHttpUrl(dataRelease().archive_url || dataRelease().doi_url);
  }

  function releaseLicenseMetadata() {
    const license = dataRelease().license;
    if (typeof license === "string" && license.trim()) {
      return { label: license.trim(), spdxId: "", name: license.trim(), url: "", scope: "Not supplied" };
    }
    if (license && typeof license === "object") {
      const spdxId = String(license.spdx_id || license.spdx || "").trim();
      const name = String(license.name || "").trim();
      const url = safeHttpUrl(license.url);
      const scope = String(license.scope || "Not supplied").trim();
      return {
        label: name || spdxId || "Not supplied",
        spdxId,
        name,
        url,
        scope,
      };
    }
    return {
      label: "Not supplied by this data release",
      spdxId: "",
      name: "",
      url: "",
      scope: "Not supplied; consult each upstream dataset and model artifact licence",
    };
  }

  function releaseStamp() {
    const release = dataRelease();
    const scope = publicationScope();
    const checksum = release.feed_sha256
      ? `verified feed SHA-256 ${state.feedVerified ? state.loadedFeedSha256 : release.feed_sha256}`
      : "feed checksum not supplied";
    const archive = releaseArchiveUrl() ? `archive ${releaseArchiveUrl()}` : "no immutable archive URL supplied";
    const manifestDigest = releaseManifestSha256();
    const manifest = manifestDigest ? `; release manifest SHA-256 ${manifestDigest}` : "";
    return `FluidsBench data release ${release.id || "unversioned"} (status: ${humanize(
      release.status || "not supplied"
    )}; ${checksum}${manifest}; ${archive}; result-data origin: ${humanize(scope.result_data_origin)})`;
  }

  function humanize(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  function formatReleaseDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return value;
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  }

  function releaseSourceUrl() {
    const release = dataRelease();
    const repository = String(release.source_repository || "").replace(/\/$/, "");
    if (!repository) return "";
    if (release.source_commit) return safeHttpUrl(`${repository}/commit/${release.source_commit}`);
    if (release.source_ref) return safeHttpUrl(`${repository}/tree/${encodeURIComponent(release.source_ref)}`);
    return safeHttpUrl(repository);
  }

  function renderSubmissionAvailability() {
    const dataset = activeDataset();
    const support = record(dataset?.scoring_support);
    const supportStatus = String(firstValue(support.status, dataset?.scoring_support_status, "not_published"));
    const workflowOpen = support.submissions_open === true;
    const open = supportStatus === "official" && workflowOpen;
    const status = element("submission-status");
    const button = element("open-submission-repo");
    if (status) {
      status.textContent = open ? "Submissions open" : "Submissions closed";
      status.className = `leaderboard-submit-status${open ? " is-open" : ""}`;
      status.title = open
        ? `${dataset.name} submissions use ${support.release_id || "the official scoring-support release"}.`
        : "This dataset is not currently accepting leaderboard submissions.";
    }
    if (button) {
      button.disabled = !open;
      button.hidden = !open;
      button.textContent = "Submit a result";
    }
  }

  function renderReleaseMetadata() {
    const release = dataRelease();
    renderSubmissionAvailability();
    const dataWarning = element("leaderboard-data-warning");
    const dataWarningTitle = element("leaderboard-data-warning-title");
    const dataWarningText = element("leaderboard-data-warning-text");
    const officialRelease = release.status === "official";
    const windsorTruthOnly = activeDatasetSlug() === "windsorml" && activeDataset()?.submission_count === 0;
    if (dataWarning) dataWarning.className = `leaderboard-data-warning${officialRelease ? " is-official" : ""}`;
    if (dataWarningTitle)
      dataWarningTitle.textContent = windsorTruthOnly ? "Native CFD ground truth" : officialRelease ? "Official release" : "Prototype results";
    if (dataWarningText) {
      dataWarningText.textContent = windsorTruthOnly
        ? " — all eight WindsorML splits are available below. No model results have been submitted; the benchmark is awaiting owner review."
        : officialRelease
          ? " — submitted packages are validated and maintainer-approved."
          : " — illustrative dummy data; not citable or suitable for leaderboard claims.";
    }
    element("leaderboard-release-id").textContent = release.id || "Unversioned";
    const details = [];
    if (release.status) details.push(humanize(release.status));
    if (release.generated_at) details.push(`generated ${formatReleaseDate(release.generated_at)}`);
    if (release.feed_sha256) details.push(`SHA-256 ${release.feed_sha256.slice(0, 12)}...`);
    if (release.revision_history?.sha256) details.push(`history SHA-256 ${release.revision_history.sha256.slice(0, 12)}...`);
    if (state.revisionHistoryVerified) details.push("version history verified");
    if (releaseManifestSha256()) details.push(`manifest SHA-256 ${releaseManifestSha256().slice(0, 12)}...`);
    if (state.manifestPinVerified) details.push("manifest bytes match snapshot pin");
    if (release.reproducibility_contract_version) details.push(release.reproducibility_contract_version);
    const license = releaseLicenseMetadata();
    details.push(`licence ${license.label}`);
    const meta = element("leaderboard-release-meta");
    meta.textContent = details.join(" | ");
    if (release.feed_sha256) meta.title = `Feed SHA-256: ${release.feed_sha256}`;
    const compact = element("leaderboard-release-compact");
    if (compact) {
      const compactDetails = [];
      if (release.generated_at) compactDetails.push(`Updated ${formatReleaseDate(release.generated_at)}`);
      if (state.feedVerified && (!expectedManifestSha256 || state.manifestPinVerified)) compactDetails.push("integrity checks passed");
      compact.textContent = compactDetails.join(" · ") || "Release details";
    }
    const source = element("leaderboard-release-source");
    const sourceUrl = releaseSourceUrl();
    source.hidden = !sourceUrl;
    if (sourceUrl) {
      source.href = sourceUrl;
      source.textContent = release.source_commit
        ? `Source ${String(release.source_commit).slice(0, 7)}`
        : `Source ${release.source_ref || "repository"}`;
    }
    ["export-leaderboard-csv", "export-leaderboard-json"].forEach((id) => {
      const button = element(id);
      if (button) button.disabled = !state.dataset || !state.feedVerified;
    });
    const citationButton = element("open-citation-dialog");
    if (citationButton) {
      const citedRow = resultRowById(state.resultId);
      const eligibility = claimEligibility(citedRow);
      const eligible = eligibility.academic_citation;
      citationButton.disabled = !state.dataset || !eligible;
      citationButton.hidden = !state.dataset || !eligible;
      citationButton.title = eligible
        ? citedRow
          ? "Cite this approved result from a hash-verified official release"
          : "Cite this hash-verified official release"
        : eligibility.reason;
      const status = element("leaderboard-claim-eligibility");
      if (status) {
        status.hidden = !state.dataset || eligible;
        status.textContent = eligible
          ? ""
          : eligibility.declared.academic_citation
            ? `Citation copying is temporarily unavailable because browser verification has not passed: ${eligibility.reason}`
            : eligibility.declared.reason;
      }
    }
    const warning = element("leaderboard-release-warning");
    if (warning) {
      warning.hidden = !state.releaseMismatch && !state.resultUnavailable;
      warning.textContent = state.releaseMismatch
        ? `This link requested data release ${state.requestedReleaseId}, but that release is not loaded. The page is showing ${
            release.id || "an unversioned release"
          }; the requested result has not been opened. Use the archived release URL to verify the original record.`
        : state.resultUnavailable
          ? `Result ${state.requestedResultId} is not present in data release ${
              release.id || "unversioned"
            }. The result link has not been silently redirected to another row.`
          : "";
    }
  }

  function csvCell(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
    let rendered = typeof value === "object" ? JSON.stringify(value) : String(value);
    if (/^[\t ]*[=+\-@]/.test(rendered)) rendered = `'${rendered}`;
    return /[",\r\n]/.test(rendered) ? `"${rendered.replaceAll('"', '""')}"` : rendered;
  }

  function tableExportRows() {
    return state.exportScope === "full" ? rowsForActiveSplit() : filteredRows();
  }

  function exportProvenance(rowCount) {
    const license = releaseLicenseMetadata();
    const currentView = state.exportScope === "current";
    return {
      export_scope: currentView ? "current_filtered_view" : "full_selected_split",
      row_count: rowCount,
      release_id: dataRelease().id || null,
      release_status: dataRelease().status || null,
      feed_sha256: dataRelease().feed_sha256 || null,
      loaded_feed_sha256: state.loadedFeedSha256,
      feed_verified: state.feedVerified,
      archive_url: releaseArchiveUrl() || null,
      release_view_url: releaseViewUrl() || null,
      asset_base_url: leaderboardAssetBaseUrl(),
      leaderboard_manifest: leaderboardManifestProvenance(),
      profile_ground_truth: {
        ...dataRelease().profile_ground_truth,
        loaded_manifest_sha256: state.groundTruthManifestProvenance?.sha256 || null,
        loaded_release_id: state.groundTruthManifestProvenance?.release_id || null,
      },
      source_repository: dataRelease().source_repository || null,
      source_ref: dataRelease().source_ref || null,
      source_commit: dataRelease().source_commit || null,
      reproducibility_contract_version: dataRelease().reproducibility_contract_version || null,
      ranking_contract: state.manifest?.ranking_contract || rankingPolicy(),
      claims_index: {
        ...claimsReleaseMetadata(),
        verification_status: state.claimsIndexProvenance?.status || "not_checked",
        loaded_sha256: state.claimsIndexProvenance?.sha256 || null,
        url: state.claimsIndexProvenance?.url || null,
      },
      revision_history: {
        ...revisionHistoryMetadata(),
        verified: state.revisionHistoryVerified,
        loaded_sha256: state.loadedRevisionHistorySha256,
      },
      publication_scope: publicationScope(),
      license: {
        spdx_id: license.spdxId || null,
        name: license.name || null,
        url: license.url || null,
        scope: license.scope,
        fallback_notice: license.spdxId ? null : license.label,
      },
      view_url: currentViewUrl(false, false),
      filters: {
        dataset: state.dataset,
        split: state.split,
        split_id: activeSplitDefinition()?.id || null,
        model_type: currentView ? state.modelType || null : null,
        result_versions: currentView && state.showAllVersions ? "all" : "latest_only",
        sort: currentView ? { key: state.sortKey, direction: state.sortDirection } : { key: "rank", direction: "asc" },
        visible_column_groups: Array.from(state.visibleGroups),
        compared_model_ids: figureRows().map((row) => row.id),
      },
    };
  }

  function exportMetadataColumns(provenance) {
    return [
      ["export_scope", () => provenance.export_scope],
      ["export_row_count", () => provenance.row_count],
      ["release_id", () => provenance.release_id],
      ["release_status", () => provenance.release_status],
      ["feed_sha256", () => provenance.feed_sha256],
      ["loaded_feed_sha256", () => provenance.loaded_feed_sha256],
      ["feed_verified", () => provenance.feed_verified],
      ["release_reproducibility_contract", () => provenance.reproducibility_contract_version],
      ["publication_scope_json", () => provenance.publication_scope],
      ["archive_url", () => provenance.archive_url],
      ["release_view_url", () => provenance.release_view_url],
      ["asset_base_url", () => provenance.asset_base_url],
      ["leaderboard_manifest_url", () => provenance.leaderboard_manifest.url],
      ["leaderboard_manifest_sha256", () => provenance.leaderboard_manifest.publication_sha256 || provenance.leaderboard_manifest.loaded_sha256],
      ["loaded_leaderboard_manifest_sha256", () => provenance.leaderboard_manifest.loaded_sha256],
      ["leaderboard_manifest_pin_required", () => provenance.leaderboard_manifest.pin_required],
      ["leaderboard_manifest_pin_verified", () => provenance.leaderboard_manifest.pin_verified],
      ["profile_ground_truth_json", () => provenance.profile_ground_truth],
      ["ranking_contract_json", () => provenance.ranking_contract],
      ["claims_index_json", () => provenance.claims_index],
      ["revision_history_json", () => provenance.revision_history],
      ["view_url", () => provenance.view_url],
      ["release_license_spdx", () => provenance.license.spdx_id],
      ["release_license_name", () => provenance.license.name],
      ["release_license_url", () => provenance.license.url],
      ["release_license_scope", () => provenance.license.scope],
      ["filters_json", () => provenance.filters],
      ["rank", (row) => row.rank],
      ["ranked_result_count", (row) => rowRanking(row)?.ranked_result_count],
      ["rank_tied", (row) => rowRanking(row)?.tied],
      ["rank_tie_count", (row) => rowRanking(row)?.tie_count],
      ["ranking_metric_id", (row) => rowRanking(row)?.metric_id],
      ["ranking_metric_label", (row) => plainMetricLabel(metricDefinition(rowRanking(row)?.metric_id))],
      ["ranking_metric_value", (row) => rowRanking(row)?.ranked_value],
      ["ranking_metric_display_value", (row) => rowRanking(row)?.display_value],
      ["ranking_metric_raw_value", (row) => rowRanking(row)?.value],
      ["ranking_metric_unit", (row) => rowRanking(row)?.unit],
      ["ranking_direction", (row) => rowRanking(row)?.direction],
      ["ranking_decimal_places", (row) => rowRanking(row)?.decimal_places],
      ["ranking_rounding", (row) => rowRanking(row)?.rounding],
      ["ranking_method", (row) => rowRanking(row)?.method],
      ["ranking_scope_release_id", () => provenance.release_id],
      ["ranking_scope_dataset", (row) => row.dataset],
      ["ranking_scope_dataset_id", (row) => row.dataset_id],
      ["ranking_scope_split", (row) => row.split],
      ["ranking_scope_split_id", (row) => row.split_id],
      ["declared_academic_citation_eligible", (row) => declaredClaimEligibility(row).academic_citation],
      ["declared_promotion_eligible", (row) => declaredClaimEligibility(row).promotion],
      ["declared_eligibility_reason_code", (row) => declaredClaimEligibility(row).reason_code],
      ["declared_eligibility_reason", (row) => declaredClaimEligibility(row).reason],
      ["browser_verification_passed", (row) => claimEligibility(row).browser_verification.passed],
      ["browser_verification_status", (row) => claimEligibility(row).browser_verification.status],
      ["browser_verification_reason_codes", (row) => claimEligibility(row).browser_verification.reason_codes],
      ["browser_verification_reasons", (row) => claimEligibility(row).browser_verification.reasons],
      ["academic_citation_copy_enabled", (row) => claimEligibility(row).academic_citation],
      ["promotion_copy_enabled", (row) => claimEligibility(row).promotion],
      ["claim_record_url", (row) => resultClaimRecordUrl(row)],
      ["claim_record_attempted_url", (row) => claimRecordCheck(row)?.url],
      ["claim_record_sha256", (row) => claimRecordCheck(row)?.sha256],
      ["claim_record_verification_status", (row) => claimRecordCheck(row)?.status || "not_checked"],
      ["claim_record_verification_error", (row) => claimRecordCheck(row)?.error],
      ["submission_id", (row) => row.id],
      ["result_series_id", (row) => resultRevision(row).series_id],
      ["result_version", (row) => resultRevision(row).version],
      ["result_is_latest", (row) => resultRevision(row).is_latest],
      ["result_supersedes", (row) => resultRevision(row).supersedes],
      ["result_latest_submission_id", (row) => resultRevision(row).latest_submission_id],
      ["result_version_count", (row) => resultRevision(row).version_count],
      ["result_change_summary", (row) => resultRevision(row).change_summary],
      ["dataset", (row) => row.dataset],
      ["dataset_version", (row) => row.dataset_version],
      ["split", (row) => row.split],
      ["split_id", (row) => row.split_id],
      ["model", (row) => row.model],
      ["submitted_by", (row) => row.submitter],
      ["institution", (row) => row.institution],
      ["model_types", (row) => row.modelTypes],
      ["training_regime", (row) => row.training_regime],
      ["target_data_used", (row) => row.target_data_used],
      ["external_pretraining", (row) => row.external_pretraining],
      ["pretraining_data", (row) => row.pretraining_data],
      ["training_regime_explanation", (row) => row.training_regime_explanation],
      ["parameter_count_millions", (row) => row.parameter_count_millions ?? row.parameterCount],
      ["methodology_format", (row) => row.methodology?.format],
      ["methodology_record_kind", (row) => row.methodology?.record_kind],
      ["methodology_total_parameter_count", (row) => row.methodology?.architecture?.total_parameter_count],
      ["methodology_json", (row) => row.methodology],
      ["submitted_at", (row) => row.date],
      ["evaluation_reference_version", (row) => row.evaluation?.reference_version],
      ["evaluation_code_revision", (row) => row.evaluation?.code_revision],
      ["evaluation_command", (row) => row.evaluation?.command],
      ["evaluation_evidence_file", (row) => row.evaluation?.evidence_file],
      ["evaluation_evidence_sha256", (row) => row.evaluation?.evidence_sha256],
      ["scoring_support_release_id", (row) => scoringSupportSummary(row).release_id],
      ["scoring_support_status", (row) => scoringSupportSummary(row).status],
      ["scoring_support_manifest_url", (row) => scoringSupportSummary(row).manifest_url],
      ["scoring_support_manifest_sha256", (row) => scoringSupportSummary(row).manifest_sha256],
      ["surface_scoring_support_id", (row) => scoringSupportSummary(row).surface_support_id],
      ["volume_scoring_support_id", (row) => scoringSupportSummary(row).volume_support_id],
      ["discretization_file", (row) => bindingFile(discretizationBinding(row))],
      ["discretization_sha256", (row) => bindingSha256(discretizationBinding(row))],
      ["discretization_cases_file", (row) => bindingFile(discretizationCaseBinding(row))],
      ["discretization_cases_sha256", (row) => bindingSha256(discretizationCaseBinding(row))],
      ["case_metrics_file", (row) => bindingFile(caseMetricsBinding(row))],
      ["case_metrics_sha256", (row) => bindingSha256(caseMetricsBinding(row))],
      ["case_metrics_case_count", (row) => caseMetricsBinding(row).case_count],
      [
        "training_surface_input_json",
        (row) => spatialComponent(row, ["training", "surface", "input"], ["training", "surface_input"], ["training_surface_input"]),
      ],
      [
        "training_surface_supervision_json",
        (row) => spatialComponent(row, ["training", "surface", "supervision"], ["training", "surface_supervision"], ["training_surface_supervision"]),
      ],
      [
        "training_volume_input_json",
        (row) => spatialComponent(row, ["training", "volume", "input"], ["training", "volume_input"], ["training_volume_input"]),
      ],
      [
        "training_volume_supervision_json",
        (row) => spatialComponent(row, ["training", "volume", "supervision"], ["training", "volume_supervision"], ["training_volume_supervision"]),
      ],
      [
        "inference_surface_input_json",
        (row) => spatialComponent(row, ["inference", "surface_input"], ["inference", "geometry_input", "surface"], ["inference_surface_input"]),
      ],
      [
        "inference_volume_input_json",
        (row) => spatialComponent(row, ["inference", "volume_input"], ["inference", "geometry_input", "volume"], ["inference_volume_input"]),
      ],
      [
        "inference_mesh_dependency",
        (row) =>
          spatialComponent(
            row,
            ["inference", "geometry_dependency"],
            ["inference", "mesh_dependency"],
            ["inference", "native_mesh_dependency"],
            ["inference_mesh_dependency"]
          ),
      ],
      [
        "direct_surface_output_json",
        (row) =>
          inferenceDirectOutputs(row, "surface").length
            ? inferenceDirectOutputs(row, "surface")
            : spatialComponent(row, ["inference", "surface_direct_output"], ["surface_direct_output"]),
      ],
      [
        "direct_volume_output_json",
        (row) =>
          inferenceDirectOutputs(row, "volume").length
            ? inferenceDirectOutputs(row, "volume")
            : spatialComponent(row, ["inference", "volume_direct_output"], ["volume_direct_output"]),
      ],
      ["scoring_mapping_json", (row) => inferenceMappings(row)],
      ["declared_scoring_coverage_json", (row) => scoringCoverageSummary(row)],
      ["prediction_data_status", (row) => predictionAvailability(row).label],
      ["prediction_artifacts_json", (row) => predictionArtifacts(row)],
      ["prediction_artifact_checks_json", (row) => predictionArtifactChecks(row)],
      ["prediction_coverage_kind", (row) => predictionAvailability(row).code],
      ["prediction_case_count", (row) => predictionAvailability(row).count],
      ["prediction_expected_case_count", (row) => predictionAvailability(row).expected],
      ["prediction_artifact_kind", (row) => primaryPredictionArtifact(row).kind],
      ["prediction_artifact_provider", (row) => predictionArtifactProvider(primaryPredictionArtifact(row))],
      ["prediction_artifact_repository_url", (row) => firstValue(primaryPredictionArtifact(row).repository_url, primaryPredictionArtifact(row).url)],
      ["prediction_artifact_revision", (row) => primaryPredictionArtifact(row).revision],
      ["prediction_artifact_manifest_file", (row) => primaryPredictionArtifact(row).manifest_file],
      ["prediction_artifact_manifest_sha256", (row) => primaryPredictionArtifact(row).manifest_sha256],
      ["prediction_artifact_format", (row) => primaryPredictionArtifact(row).format],
      ["prediction_artifact_license_spdx", (row) => primaryPredictionArtifact(row).license_spdx],
      ["prediction_artifact_check_status", (row) => predictionArtifactStatus(row).label],
      ["prediction_artifact_check_code", (row) => predictionArtifactStatus(row).code],
      ["prediction_artifact_checked_by", (row) => predictionArtifactCheck(row).checked_by],
      ["prediction_artifact_checked_at", (row) => predictionArtifactCheck(row).checked_at],
      ["prediction_artifact_check_record_file", (row) => bindingFile(predictionArtifactChecksBinding(row))],
      ["prediction_artifact_check_record_sha256", (row) => bindingSha256(predictionArtifactChecksBinding(row))],
      ["prediction_metric_recomputation", (row) => predictionMetricRecomputation(row).label],
      ["prediction_metric_recomputation_code", (row) => predictionMetricRecomputation(row).code],
      ["prediction_metric_recomputed_case_count", (row) => predictionMetricRecomputation(row).count],
      ["prediction_metric_recomputed_expected_case_count", (row) => predictionMetricRecomputation(row).expected],
      ["reproducibility_contract", (row) => row.reproducibility?.contract_version],
      ["reproducibility_access", (row) => row.reproducibility?.access],
      ["public_test_data_use", (row) => row.reproducibility?.public_test_data_use],
      ["result_data_license", (row) => row.reproducibility?.result_data_license_spdx],
      ["reproducibility_code_artifact_availability", (row) => reproducibilityArtifactAvailability(row).code],
      ["reproducibility_code_repository", (row) => row.reproducibility?.code?.repository_url],
      ["reproducibility_code_commit", (row) => row.reproducibility?.code?.commit],
      ["reproducibility_code_license", (row) => row.reproducibility?.code?.license_spdx],
      ["reproducibility_model_artifact_availability", (row) => reproducibilityArtifactAvailability(row).model],
      ["model_artifact_url", (row) => row.reproducibility?.model_artifact?.url],
      ["model_artifact_sha256", (row) => row.reproducibility?.model_artifact?.sha256],
      ["model_artifact_license", (row) => row.reproducibility?.model_artifact?.license_spdx],
      ["reproducibility_environment_artifact_availability", (row) => reproducibilityArtifactAvailability(row).environment],
      ["environment_kind", (row) => row.reproducibility?.environment?.kind],
      ["environment_url", (row) => row.reproducibility?.environment?.url],
      ["environment_sha256", (row) => row.reproducibility?.environment?.sha256],
      ["reproducibility_artifact_documentation_availability", (row) => reproducibilityArtifactAvailability(row).documentation],
      ["artifact_documentation_url", (row) => row.reproducibility?.artifact_documentation_url],
      ["approval_status", (row) => row.approval?.status],
      ["approved_by", (row) => row.approval?.approved_by],
      ["approved_at", (row) => row.approval?.approved_at],
      ["pull_request_url", (row) => row.approval?.pull_request_url],
      ["maintainer_validation_status", (row) => maintainerValidation(row).status],
      ["maintainer_validation_schema_version", (row) => maintainerValidation(row).schema_version],
      ["maintainer_validation_contract", (row) => maintainerValidation(row).contract_version],
      ["maintainer_validation_reference", (row) => maintainerValidation(row).reference_version],
      ["maintainer_validated_by", (row) => maintainerValidation(row).validated_by],
      ["maintainer_validated_at", (row) => maintainerValidation(row).validated_at],
      ["validation_scope", (row) => maintainerValidation(row).validation_scope],
      ["model_execution", (row) => maintainerValidation(row).model_execution],
      ["metric_recomputation", (row) => maintainerValidation(row).metric_recomputation],
      ["reviewed_submission_sha256", (row) => maintainerValidation(row).reviewed_submission_sha256],
      ["validated_evaluation_evidence_sha256", (row) => maintainerValidation(row).evaluation_evidence_sha256],
      ["validated_profile_index_sha256", (row) => maintainerValidation(row).profile_index_sha256],
      ["validated_case_set_id", (row) => maintainerValidation(row).case_set_id],
      ["validated_profile_ground_truth_release_id", (row) => maintainerValidation(row).profile_ground_truth_release_id],
      ["validated_profile_ground_truth_manifest_sha256", (row) => maintainerValidation(row).profile_ground_truth_manifest_sha256],
      ["validated_scoring_support_release_id", (row) => maintainerValidation(row).scoring_support_release_id],
      ["validated_scoring_support_manifest_sha256", (row) => maintainerValidation(row).scoring_support_manifest_sha256],
      ["validated_discretization_sha256", (row) => maintainerValidation(row).discretization_sha256],
      ["validated_case_metrics_sha256", (row) => maintainerValidation(row).case_metrics_sha256],
      ["maintainer_validation_evidence_path", (row) => maintainerValidation(row).evidence_path],
      ["maintainer_validation_evidence_sha256", (row) => maintainerValidation(row).evidence_sha256],
      ["paper_url", (row) => row.paper_url],
      ["code_url", (row) => row.code_url],
      ["profile_index_file", (row) => row.profile_data?.index_file],
      ["profile_index_sha256", (row) => row.profile_data?.index_sha256],
      ["profile_ground_truth_release_id", (row) => row.profile_data?.profile_ground_truth_release_id],
      ["profile_ground_truth_manifest_sha256", (row) => row.profile_data?.profile_ground_truth_manifest_sha256],
      ["result_permalink", (row) => resultUrl(row, Boolean(releaseViewUrl()))],
      ["note", (row) => row.note],
    ];
  }

  function exportFilename(extension) {
    const releaseId = slug(dataRelease().id || "unversioned");
    return `fluidsbench-${slug(state.dataset)}-${slug(state.split)}-${state.exportScope}-${releaseId}.${extension}`;
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    element("leaderboard-release-action-status").textContent = `Downloaded ${filename}.`;
  }

  function downloadText(filename, content, type) {
    downloadBlob(filename, new Blob([content], { type }));
  }

  async function verifiedTableExportRows() {
    const rows = tableExportRows();
    const snapshot = {
      dataset: state.dataset,
      split: state.split,
      exportScope: state.exportScope,
      modelType: state.modelType,
      sortKey: state.sortKey,
      sortDirection: state.sortDirection,
      loadVersion: state.loadVersion,
      viewQuery: viewSearchParams(false).toString(),
      rowIds: rows.map((row) => row.id),
    };
    const status = element("leaderboard-release-action-status");
    if (status) status.textContent = "Verifying claim and validation records for the table export...";
    await ensureClaimsIndex();
    await Promise.all(rows.flatMap((row) => [ensureClaimRecord(row), ensureValidationEvidence(row)]));
    const currentRowIds = tableExportRows().map((row) => row.id);
    if (
      state.dataset !== snapshot.dataset ||
      state.split !== snapshot.split ||
      state.exportScope !== snapshot.exportScope ||
      state.modelType !== snapshot.modelType ||
      state.sortKey !== snapshot.sortKey ||
      state.sortDirection !== snapshot.sortDirection ||
      state.loadVersion !== snapshot.loadVersion ||
      viewSearchParams(false).toString() !== snapshot.viewQuery ||
      currentRowIds.join("\u0000") !== snapshot.rowIds.join("\u0000")
    ) {
      throw new Error("The leaderboard selection changed while export records were being verified; export the current view again.");
    }
    return rows;
  }

  async function exportCsv() {
    try {
      const rows = await verifiedTableExportRows();
      const provenance = exportProvenance(rows.length);
      const metadata = exportMetadataColumns(provenance);
      const metrics = activeMetricDefinitions();
      const header = [...metadata.map(([label]) => label), ...metrics.map((definition) => definition.id)];
      const lines = [header.map(csvCell).join(",")];
      rows.forEach((row) => {
        const values = [...metadata.map(([, value]) => value(row)), ...metrics.map((definition) => row.metricValues[definition.id])];
        lines.push(values.map(csvCell).join(","));
      });
      downloadText(exportFilename("csv"), `${lines.join("\n")}\n`, "text/csv;charset=utf-8");
    } catch (error) {
      const status = element("leaderboard-release-action-status");
      if (status) status.textContent = `Could not export table CSV: ${error.message}`;
      console.error(error);
    }
  }

  function sourceSubmission(row) {
    const { id, rank, metricValues, modelTypes, parameterCount, submitter, date, _ranking, _feedIndex, ranking, claim_eligibility, ...source } = row;
    const eligibility = claimEligibility(row);
    const claimCheck = claimRecordCheck(row);
    return {
      rank,
      ranked_result_count: rowRanking(row)?.ranked_result_count ?? null,
      rank_tied: rowRanking(row)?.tied ?? false,
      rank_tie_count: rowRanking(row)?.tie_count ?? 0,
      ranking: rowRanking(row),
      claim_eligibility: claim_eligibility || declaredClaimEligibility(row),
      browser_verification: eligibility.browser_verification,
      copy_readiness: {
        academic_citation: eligibility.academic_citation,
        promotion: eligibility.promotion,
      },
      ...source,
      spatial_provenance: {
        scoring_support: scoringSupportSummary(row),
        discretization: {
          file: bindingFile(discretizationBinding(row)) || null,
          sha256: bindingSha256(discretizationBinding(row)) || null,
          cases_file: bindingFile(discretizationCaseBinding(row)) || null,
          cases_sha256: bindingSha256(discretizationCaseBinding(row)) || null,
          summary: discretizationSummary(row),
        },
        case_metrics: {
          file: bindingFile(caseMetricsBinding(row)) || null,
          sha256: bindingSha256(caseMetricsBinding(row)) || null,
          case_count: finiteNumber(caseMetricsBinding(row).case_count),
        },
      },
      prediction_evidence: {
        availability: predictionAvailability(row),
        artifacts: predictionArtifacts(row),
        artifact: primaryPredictionArtifact(row),
        maintainer_checks: {
          file: bindingFile(predictionArtifactChecksBinding(row)) || null,
          sha256: bindingSha256(predictionArtifactChecksBinding(row)) || null,
          checks: predictionArtifactChecks(row),
        },
        primary_artifact: primaryPredictionArtifact(row),
        primary_artifact_check: {
          ...predictionArtifactCheck(row),
          display_status: predictionArtifactStatus(row),
        },
        artifact_check: {
          ...predictionArtifactCheck(row),
          display_status: predictionArtifactStatus(row),
        },
        metric_recomputation: predictionMetricRecomputation(row),
      },
      reproducibility_artifact_availability: reproducibilityArtifactAvailability(row),
      result_permalink: resultUrl(row, Boolean(releaseViewUrl())),
      claim_record: {
        url: resultClaimRecordUrl(row) || null,
        attempted_url: claimCheck?.url || null,
        sha256: claimCheck?.sha256 || null,
        verification_status: claimCheck?.status || "not_checked",
        verification_error: claimCheck?.error || null,
      },
    };
  }

  async function exportJson() {
    try {
      const rows = await verifiedTableExportRows();
      const provenance = exportProvenance(rows.length);
      const payload = {
        schema_version: "fluidsbench-leaderboard-export-v4",
        exported_at: new Date().toISOString(),
        data_release: dataRelease(),
        provenance,
        ranking: rankingPolicy(),
        metric_definitions: activeMetricDefinitions(),
        submissions: rows.map(sourceSubmission),
      };
      downloadText(exportFilename("json"), `${JSON.stringify(payload, null, 2)}\n`, "application/json;charset=utf-8");
    } catch (error) {
      const status = element("leaderboard-release-action-status");
      if (status) status.textContent = `Could not export table JSON: ${error.message}`;
      console.error(error);
    }
  }

  function rankingValueText(context) {
    if (!context || context.ranked_value === null || context.ranked_value === undefined) return "not supplied";
    return `${context.display_value}${context.unit ? ` ${context.unit}` : ""}`;
  }

  function resultRankText(context) {
    if (!context || context.rank === null || context.rank === undefined) return "unranked";
    return `${context.tied ? "joint " : ""}rank ${context.rank} of ${context.ranked_result_count}`;
  }

  function resultClaimRecordUrl(row) {
    const check = claimRecordCheck(row);
    if (check?.status !== "verified") return "";
    const record = verifiedClaimRecord(row);
    return safeHttpUrl(record?.claim_record_url);
  }

  function bibtexEscape(value) {
    const escaped = {
      "\\": "\\textbackslash{}",
      "{": "\\{",
      "}": "\\}",
      "&": "\\&",
      "%": "\\%",
      _: "\\_",
      "#": "\\#",
      $: "\\$",
      "^": "\\textasciicircum{}",
      "~": "\\textasciitilde{}",
    };
    return Array.from(String(value ?? ""), (character) => escaped[character] || (/\s/.test(character) ? " " : character)).join("");
  }

  function metricRecomputationStatement(row) {
    if (!row) return "Metric recomputation is result-specific; consult each result record.";
    const recomputation = predictionMetricRecomputation(row);
    if (recomputation.code === "complete_split") {
      return "FluidsBench recomputed the complete evaluation/test split metrics from the shared scored predictions.";
    }
    if (recomputation.code === "example_cases") {
      return `FluidsBench recomputed ${recomputation.count ?? "some"}/${
        recomputation.expected ?? "?"
      } example evaluation/test cases; complete-split metric recomputation was not performed.`;
    }
    return "FluidsBench did not recompute base metrics from scored predictions.";
  }

  function citationValues() {
    const release = dataRelease();
    const citation = release.citation || {};
    const author = citation.author || "FluidsBench contributors";
    const title = citation.title || "FluidsBench Leaderboard";
    const publisher = citation.publisher || "FluidsBench";
    const year = citation.year || new Date(release.generated_at || Date.now()).getUTCFullYear();
    const releaseId = release.id || "unversioned";
    const checksum = release.feed_sha256 || "not supplied";
    const manifestChecksum = releaseManifestSha256() || "not supplied";
    const citedResult = resultRowById(state.resultId);
    const url = citedResult ? resultUrl(citedResult, true) : citedViewUrl();
    const validation = citedResult ? maintainerValidation(citedResult) : {};
    const resultRanking = citedResult ? rowRanking(citedResult) : null;
    const context = citedResult ? `${state.dataset}, ${state.split}, ${citedResult.model} (${citedResult.id})` : `${state.dataset}, ${state.split}`;
    const status = humanize(release.status || "not supplied");
    const resultNote = citedResult
      ? ` ${resultRankText(resultRanking)} by ${
          plainMetricLabel(metricDefinition(resultRanking?.metric_id)) || resultRanking?.metric_id || "the ranking metric"
        } (${rankingValueText(resultRanking)}; ${
          resultRanking?.direction || "direction not supplied"
        } is better), scoped to this exact dataset, split, and release. Result status: ${humanize(
          citedResult.approvalStatus
        )}; submission package validation ${validation.status || "not supplied"} (scope: ${
          validation.validation_scope || "not supplied"
        }; model execution: ${validation.model_execution || "not supplied"}; metric recomputation: ${
          validation.metric_recomputation || "not supplied"
        }; profile ground-truth release: ${validation.profile_ground_truth_release_id || "not supplied"}; profile ground-truth manifest SHA-256: ${
          validation.profile_ground_truth_manifest_sha256 || "not supplied"
        }), validation record SHA-256 ${validation.evidence_sha256 || "not supplied"}.`
      : "";
    const license = releaseLicenseMetadata();
    const archiveNote = releaseArchiveUrl() ? `Release data archive: ${releaseArchiveUrl()}.` : "No separate release data archive is supplied.";
    const releaseViewNote = releaseViewUrl() ? `Immutable release view: ${releaseViewUrl()}.` : "No immutable release view is supplied.";
    const bibtexKeyParts = ["fluidsbench", slug(state.dataset), slug(state.split)];
    if (citedResult) bibtexKeyParts.push(slug(citedResult.id));
    bibtexKeyParts.push(slug(releaseId));
    const bibtexKey = bibtexKeyParts.filter(Boolean).join("_").replaceAll("-", "_");
    const claimRecord = citedResult ? resultClaimRecordUrl(citedResult) : "";
    const recomputationNote = metricRecomputationStatement(citedResult);
    const promotion = citedResult
      ? `In FluidsBench data release ${releaseId}, ${citedResult.model} is recorded at ${resultRankText(resultRanking)} on ${state.dataset} / ${
          state.split
        }, ordered by ${
          plainMetricLabel(metricDefinition(resultRanking?.metric_id)) || resultRanking?.metric_id || "the ranking metric"
        } (${rankingValueText(resultRanking)}; ${
          resultRanking?.direction || "direction not supplied"
        } is better). The score is calculated on the declared evaluation/test split, not the training split. This rank applies only to that exact dataset, split, and release—not the changing current leaderboard. The result uses submitter-provided metrics and profile predictions; FluidsBench validated the submitted package and did not run the model. ${recomputationNote} Release manifest SHA-256: ${manifestChecksum}. ${url}${
          claimRecord ? ` Claim record: ${claimRecord}` : ""
        }`
      : "";
    const bibtexTitle = citedResult ? `FluidsBench result: ${citedResult.model} on ${state.dataset} / ${state.split}` : `${title}: ${context}`;
    const bibtexNote = `Exact data release ${releaseId}; status ${status}; release manifest SHA-256 ${manifestChecksum}; feed SHA-256 ${checksum}; licence ${
      license.label
    };${resultNote} model-result data are ${resultDataOriginLabel()}; FluidsBench model execution was not performed; ${recomputationNote} ${releaseViewNote} ${archiveNote}${
      claimRecord ? ` Claim record: ${claimRecord}.` : ""
    }`;
    return {
      plain: `${author} (${year}). ${title}: ${context}. ${publisher}, exact data release ${releaseId} (status: ${status}), release manifest SHA-256 ${manifestChecksum}, verified feed SHA-256 ${checksum}.${resultNote} Model-result data are ${resultDataOriginLabel()}; FluidsBench model execution was not performed. ${recomputationNote} Scores refer to the declared evaluation/test split, not the training split. Licence: ${
        license.label
      }; scope: ${license.scope}. ${releaseViewNote} ${archiveNote} ${claimRecord ? `Claim record: ${claimRecord}. ` : ""}${url}`,
      bibtex: `@misc{${bibtexKey},\n  author = {{${bibtexEscape(author)}}},\n  title = {${bibtexEscape(bibtexTitle)}},\n  year = {${bibtexEscape(
        year
      )}},\n  publisher = {${bibtexEscape(publisher)}},\n  version = {${bibtexEscape(releaseId)}},\n  url = {${bibtexEscape(
        url
      )}},\n  note = {${bibtexEscape(bibtexNote)}}\n}`,
      promotion,
    };
  }

  function openCitationDialog() {
    const citation = citationValues();
    element("citation-text").textContent = citation.plain;
    element("citation-bibtex").textContent = citation.bibtex;
    element("citation-copy-status").textContent = "";
    const dialog = element("citation-dialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  async function copyCitation(kind) {
    const value = citationValues()[kind];
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const input = document.createElement("textarea");
        input.value = value;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      element("citation-copy-status").textContent = `${kind === "bibtex" ? "BibTeX" : "Plain-text citation"} copied.`;
    } catch (error) {
      element("citation-copy-status").textContent = `Could not copy automatically: ${error.message}`;
    }
  }

  function staticHelp(key) {
    const types = Array.from(new Set((state.rows.get(state.dataset) || []).flatMap((row) => row.modelTypes))).join(", ");
    const policy = rankingPolicy();
    const rankMetric = metricDefinition(policy.metric_id);
    const trainingLabels = trainingRegimeDefinitions()
      .map((definition) => definition.label)
      .join(", ");
    const definitions = {
      rank: `Competition rank within this exact loaded release, dataset, and split, ordered by ${rankMetric?.label || "the ranking metric"} at ${
        policy.decimal_places
      } decimal place${
        policy.decimal_places === 1 ? "" : "s"
      }. Ties share a position (1, 2, 2, 4). Filters and table sorting do not change rank. Prototype rows are not official rankings.`,
      model: "Model name declared by the submitter. Open-code and model-artifact provenance appears in result details when supplied.",
      submitter: "Person, research group, institution, or company submitting the result.",
      split: `Declared ${state.dataset} benchmark split used for training and public-ground-truth evaluation.`,
      modelTypes: `One or more submitted architecture categories. Available here: ${types || "none"}.`,
      status:
        "Prototype rows are illustrative only. An official result requires a validated submission package and maintainer approval. Public code, model, and environment artifacts are optional and are reported when supplied; their absence does not affect rank, citation eligibility, or promotion eligibility.",
      predictionData:
        "Optional public scored predictions or direct model outputs. Complete means every case in the selected split is declared; Examples means only some cases are declared. Sharing does not affect accuracy rank, citation eligibility, or promotion eligibility. Open Details for the separate artifact-check and metric-recomputation statuses.",
      training: `How the model was initialized and whether target-dataset training data were used. Supported values: ${trainingLabels}.`,
      parameters: "Submitter-reported trainable parameter count in millions; a missing value remains missing rather than being treated as zero.",
      date: "Date associated with the submitted result.",
      details: "Opens a deep-linkable result record with submission, optional-artifact, validation, approval, and metric metadata.",
    };
    return definitions[key] || "";
  }

  function metricDescription(definition) {
    return String(definition.description || "")
      .replace(/\s*(?:Lower|Higher) is better\.?\s*$/i, "")
      .trim();
  }

  function metricHelp(definition) {
    const direction = definition.direction === "lower" ? "Lower is better." : "Higher is better.";
    const unit = definition.unit ? ` Unit: ${definition.unit}.` : "";
    return `${metricDescription(definition)} ${direction}${unit}`;
  }

  function metricColumnGroup(definition) {
    return definition.column_group || definition.group;
  }

  function groupClass(group) {
    return columnGroups.find((candidate) => candidate.id === group)?.className || "metric-group-neutral";
  }

  function columnGroupLabel(group, defaultLabel) {
    return activeDataset()?.column_group_labels?.[group] || defaultLabel;
  }

  function activeDatasetDisplay() {
    const dataset = activeDataset();
    const datasetSlug = dataset?.slug || slug(dataset?.name || "");
    const configured = leaderboardDisplay?.[datasetSlug];
    return configured && typeof configured === "object" && !Array.isArray(configured) ? configured : {};
  }

  function headlineMetricDefinitions() {
    const definitions = activeMetricDefinitions();
    if (!definitions.length) return [];
    const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
    const requested = Array.isArray(activeDatasetDisplay().headline_metric_ids) ? activeDatasetDisplay().headline_metric_ids : [];
    const orderedIds = [ranking().metric_id, ...requested];
    const selected = [];
    const selectedIds = new Set();
    orderedIds.forEach((metricId) => {
      if (!definitionsById.has(metricId) || selectedIds.has(metricId)) return;
      selected.push(definitionsById.get(metricId));
      selectedIds.add(metricId);
    });
    const targetCount = Math.min(5, definitions.length);
    definitions.forEach((definition) => {
      if (selected.length >= targetCount || selectedIds.has(definition.id)) return;
      selected.push(definition);
      selectedIds.add(definition.id);
    });
    return selected;
  }

  function headlineMetricIds() {
    return new Set(headlineMetricDefinitions().map((definition) => definition.id));
  }

  function radarMetricAxes() {
    const configuredIds = Array.isArray(activeDatasetDisplay().radar_metric_ids) ? activeDatasetDisplay().radar_metric_ids : [];
    const components = new Map((activeDataset()?.overall_score_composite?.components || []).map((component) => [component.metric_id, component]));
    return configuredIds
      .map((metricId) => {
        const definition = metricDefinition(metricId);
        const component = components.get(metricId);
        return definition && component ? { definition, component } : null;
      })
      .filter(Boolean);
  }

  function radarNormalizedValue(value, component) {
    const numericValue = finiteNumber(value);
    if (numericValue === null || !component) return null;
    if (component.transform === "bounded_quality") return Math.max(0, Math.min(100, 100 * numericValue));
    if (component.transform === "bounded_error") {
      const cap = finiteNumber(component.cap);
      if (cap === null || cap <= 0) return null;
      return Math.max(0, Math.min(100, 100 * (1 - numericValue / cap)));
    }
    return null;
  }

  function radarTransformDescription(axis) {
    if (axis.component.transform === "bounded_quality") return "quality clipped to 0–1";
    const cap = formatMetric(axis.component.cap, axis.definition);
    return `error cap ${cap}`;
  }

  function radarAxisLabel(definition) {
    const compact = plainMetricLabel(definition)
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/coefficient/gi, "coeff.")
      .replace(/relative/gi, "rel.")
      .replace(/\s+/g, " ")
      .trim();
    const words = compact.split(" ");
    const lines = [];
    words.forEach((word) => {
      const current = lines[lines.length - 1] || "";
      if (!current || `${current} ${word}`.length > 18) lines.push(word);
      else lines[lines.length - 1] = `${current} ${word}`;
    });
    return lines;
  }

  function allColumns() {
    const columns = [
      { key: "compare", label: "Compare" },
      { key: "rank", label: "Rank", sortKey: "rank" },
      { key: "model", label: "Model", sortKey: "model" },
      { key: "submitter", label: "Submitted by", sortKey: "submitter" },
      { key: "modelTypes", label: "Model type", sortKey: "modelTypes", group: "model-details" },
      { key: "training", label: "Training", sortKey: "training_regime", group: "model-details" },
      { key: "predictionData", label: "Prediction data", sortKey: "predictionData", group: "model-details" },
      { key: "status", label: "Result status", sortKey: "approvalStatus", group: "model-details" },
      { key: "split", label: "Split", sortKey: "split" },
    ];
    activeMetricDefinitions().forEach((definition) => {
      columns.push({
        key: definition.id,
        label: definition.label,
        plainLabel: plainMetricLabel(definition),
        sortKey: `metric:${definition.id}`,
        group: metricColumnGroup(definition),
        definition,
      });
    });
    columns.push(
      { key: "parameters", label: "Parameters (M)", sortKey: "parameters", group: "model-details" },
      { key: "date", label: "Date", sortKey: "date", group: "model-details" },
      { key: "details", label: "Details", group: "model-details" }
    );
    return columns;
  }

  function compactMetricDefinitions() {
    const score = metricDefinition(ranking().metric_id);
    return [
      score,
      ...headlineMetricDefinitions()
        .filter((definition) => definition.id !== score?.id)
        .slice(0, 2),
    ].filter(Boolean);
  }

  function compactMetricLabel(definition) {
    const labels = {
      overall_score: "Score / 100",
      surface_pressure_rel_l2: "Surface pressure error (%)",
      surface_pressure_equal_entity_rel_l2: "Surface pressure error · equal (%)",
      surface_wall_shear_rel_l2: "Surface wall shear error (%)",
      volume_velocity_rel_l2: "Volume velocity error (%)",
      flow_domain_velocity_rel_l2: "Flow-domain velocity error (%)",
      vki_mach_rrmse: "Flow-domain Mach RRMSE",
      vki_nut_rrmse: "Flow-domain turb. viscosity RRMSE",
      rotor_pressure_rrmse: "Surface pressure RRMSE",
      rotor_temperature_rrmse: "Surface temperature RRMSE",
    };
    return labels[definition.id] || plainMetricLabel(definition);
  }

  function activeColumns() {
    const columns = allColumns();
    if (state.metricView === "summary") {
      const keys = ["compare", "rank", "model", ...compactMetricDefinitions().map((definition) => definition.id), "details"];
      return keys
        .map((key) => columns.find((column) => column.key === key))
        .filter(Boolean)
        .map((column) =>
          column.definition ? { ...column, label: compactMetricLabel(column.definition), plainLabel: compactMetricLabel(column.definition) } : column
        );
    }
    return columns.filter((column) => !column.group || state.visibleGroups.has(column.group));
  }

  function initializeVisibleGroups() {
    state.visibleGroups = new Set(activeMetricDefinitions().map(metricColumnGroup));
    state.visibleGroups.add("model-details");
  }

  function renderMetricViewControls() {
    const button = element("leaderboard-metric-view-toggle");
    const status = element("leaderboard-metric-view-status");
    const fullViewControls = element("leaderboard-column-controls");
    const table = element("leaderboard-table");
    const headlineCount = compactMetricDefinitions().length;
    const totalCount = activeMetricDefinitions().length;
    const fullView = state.metricView === "full";
    const visibleFullMetricCount = activeMetricDefinitions().filter((definition) => state.visibleGroups.has(metricColumnGroup(definition))).length;
    if (button) {
      button.textContent = fullView ? "Compact view" : "All metrics";
      button.setAttribute("aria-expanded", String(fullView));
    }
    if (status) {
      status.textContent = fullView
        ? visibleFullMetricCount === totalCount
          ? `Showing the full ${totalCount}-metric table.`
          : `Showing ${visibleFullMetricCount} of ${totalCount} metrics in the customised full view.`
        : `Showing ${headlineCount} dataset-specific headline metric${headlineCount === 1 ? "" : "s"}.`;
    }
    if (fullViewControls) fullViewControls.hidden = !fullView;
    table?.classList.toggle("leaderboard-columns-reduced", !fullView);
  }

  function renderColumnToggles() {
    renderMetricViewControls();
    const container = element("leaderboard-column-toggles");
    if (!container) return;
    container.replaceChildren();
    const availableGroups = new Set(activeMetricDefinitions().map(metricColumnGroup));
    availableGroups.add("model-details");
    columnGroups
      .filter(({ id }) => availableGroups.has(id))
      .forEach(({ id: group, label: defaultLabel, className }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `leaderboard-column-toggle ${className}`;
        button.dataset.columnGroupToggle = group;
        button.textContent = columnGroupLabel(group, defaultLabel);
        button.setAttribute("aria-pressed", String(state.visibleGroups.has(group)));
        button.classList.toggle("is-active", state.visibleGroups.has(group));
        button.addEventListener("click", () => {
          if (state.visibleGroups.has(group)) state.visibleGroups.delete(group);
          else state.visibleGroups.add(group);
          renderColumnToggles();
          renderTable();
          updateUrl();
        });
        container.appendChild(button);
      });
  }

  function headerHelpButton(column) {
    const help = document.createElement("button");
    help.type = "button";
    help.className = "leaderboard-column-help";
    help.textContent = "i";
    if (column.key === (activeDataset()?.overall_score_composite?.metric_id || "overall_score")) {
      help.setAttribute("aria-label", "How the overall score is calculated");
      help.setAttribute("aria-controls", "score-calculation");
      help.addEventListener("click", (event) => {
        event.stopPropagation();
        openScoreMethodology();
      });
      return help;
    }
    help.setAttribute("aria-label", `About ${column.plainLabel || column.label}`);
    help.setAttribute("aria-controls", "column-help-popover");
    help.setAttribute("aria-expanded", "false");
    help.dataset.helpTitle = column.label;
    help.dataset.helpText = column.definition ? metricHelp(column.definition) : staticHelp(column.key);
    if (column.definition) {
      help.dataset.definitionHref = "#metric-definitions";
      help.dataset.definitionLabel = "Metric definitions";
    } else if (column.key === "split") {
      help.dataset.definitionHref = "#split-definitions";
      help.dataset.definitionLabel = "Split definitions";
    } else if (column.key === "training") {
      help.dataset.definitionHref = "#training-definitions";
      help.dataset.definitionLabel = "Training definitions";
    }
    help.addEventListener("click", () => showHelp(help));
    return help;
  }

  function renderHeader() {
    const row = element("leaderboard-header-row");
    row.replaceChildren();
    let previousGroup = null;
    activeColumns().forEach((column) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.dataset.columnKey = column.key;
      if (column.group) {
        th.dataset.columnGroup = column.group;
        th.classList.add(groupClass(column.group));
      }
      if (column.group && column.group !== previousGroup) th.classList.add("leaderboard-group-start");
      previousGroup = column.group || previousGroup;

      const wrapper = document.createElement("div");
      wrapper.className = "leaderboard-header-content";
      if (column.sortKey) {
        const sortButton = document.createElement("button");
        sortButton.type = "button";
        sortButton.className = "leaderboard-sort-button";
        const active = state.sortKey === column.sortKey;
        if (active) th.setAttribute("aria-sort", state.sortDirection === "asc" ? "ascending" : "descending");
        appendFormattedMetricLabel(sortButton, column.label);
        if (active) {
          const indicator = document.createElement("span");
          indicator.setAttribute("aria-hidden", "true");
          indicator.textContent = state.sortDirection === "asc" ? "  ↑" : "  ↓";
          sortButton.appendChild(indicator);
        }
        const nextDirection = active
          ? state.sortDirection === "asc"
            ? "descending"
            : "ascending"
          : defaultSortDirection(column) === "asc"
            ? "ascending"
            : "descending";
        sortButton.setAttribute("aria-label", `Sort by ${column.plainLabel || column.label}, ${nextDirection}`);
        sortButton.addEventListener("click", () => changeSort(column));
        wrapper.appendChild(sortButton);
      } else {
        const label = document.createElement("span");
        appendFormattedMetricLabel(label, column.label);
        wrapper.appendChild(label);
      }
      if (column.definition) wrapper.appendChild(headerHelpButton(column));
      th.appendChild(wrapper);
      row.appendChild(th);
    });
  }

  function defaultSortDirection(column) {
    if (column.key === "predictionData") return "desc";
    if (column.key === "rank" || ["model", "submitter", "split", "modelTypes", "training", "status", "date"].includes(column.key)) {
      return "asc";
    }
    if (column.definition) return column.definition.direction === "lower" ? "asc" : "desc";
    return column.key === "parameters" ? "asc" : "desc";
  }

  function changeSort(column) {
    if (state.sortKey === column.sortKey) {
      state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
    } else {
      state.sortKey = column.sortKey;
      state.sortDirection = defaultSortDirection(column);
    }
    renderTable();
    updateUrl();
  }

  function trainingLabel(row) {
    return trainingRegimeDefinition(row.training_regime)?.label || row.training_regime || "Not supplied";
  }

  function resultStatusLabel(row) {
    if (row?.record_type === "development_fixture") return "Development fixture · non-ranked";
    return humanize(row?.approvalStatus);
  }

  function targetDataLabel(value) {
    const labels = {
      none: "None",
      official_train: "Declared benchmark training partition",
      other: "Other target-dataset data",
    };
    return labels[value] || value || "Not supplied";
  }

  function pretrainingDataLabel(items) {
    if (!Array.isArray(items) || !items.length) return "None declared";
    return items
      .map((item) => {
        if (typeof item === "string") return item;
        const details = [
          item?.type,
          item?.samples ? `${item.samples} samples` : "",
          item?.public === true ? "public" : item?.public === false ? "non-public" : "",
        ]
          .filter(Boolean)
          .join(", ");
        const name = item?.name || "Unnamed pretraining dataset";
        return `${name}${details ? ` (${details})` : ""}${item?.notes ? `: ${item.notes}` : ""}`;
      })
      .join("; ");
  }

  function cellValue(row, column) {
    if (column.definition) return formatMetric(row.metricValues[column.key], column.definition);
    const values = {
      rank: row.rank,
      model: row.model,
      submitter: row.submitter,
      split: row.split,
      modelTypes: row.modelTypes.join(", ") || "Not supplied",
      training: trainingLabel(row),
      predictionData: predictionAvailability(row).label,
      status: resultStatusLabel(row),
      parameters: formatNumber(row.parameterCount, 2),
      date: row.date || "Not supplied",
    };
    return values[column.key] ?? "";
  }

  function chip(className, value) {
    const item = document.createElement("span");
    item.className = className;
    item.textContent = value;
    return item;
  }

  function appendCellContent(cell, submission, column) {
    if (column.key === "compare") {
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = submission.id;
      input.dataset.comparisonModel = "";
      input.checked = state.comparedModelIds.has(submission.id);
      input.disabled = !isLatestRevision(submission) || (!input.checked && state.comparedModelIds.size >= maxFigureModels);
      input.setAttribute("aria-label", `Compare ${submission.model}`);
      if (!isLatestRevision(submission)) input.title = "Comparison uses the latest result versions.";
      cell.appendChild(input);
      return;
    }
    if (column.key === "details") {
      const link = document.createElement("a");
      link.className = "leaderboard-detail-button";
      link.href = resultUrl(submission);
      link.textContent = "Details";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        openDetails(submission);
      });
      cell.appendChild(link);
      return;
    }
    if (column.key === "rank") {
      const context = rowRanking(submission);
      const rankChip = chip(
        `leaderboard-rank${isLatestRevision(submission) ? "" : " is-archived"}`,
        isLatestRevision(submission) ? submission.rank ?? "—" : "Archived"
      );
      if (!isLatestRevision(submission)) {
        rankChip.title = "This superseded version is retained for history and does not occupy a current ranking position.";
      }
      if (context?.tied) {
        rankChip.title = `Joint rank ${context.rank}; ${context.tie_count} results share this published value.`;
        rankChip.setAttribute("aria-label", `Joint rank ${context.rank} of ${context.ranked_result_count}, shared by ${context.tie_count} results`);
      }
      cell.appendChild(rankChip);
      return;
    }
    if (column.key === "model") {
      cell.classList.add("leaderboard-model");
      const link = document.createElement("a");
      link.className = "leaderboard-result-link";
      link.href = resultUrl(submission);
      link.textContent = cellValue(submission, column);
      link.addEventListener("click", (event) => {
        event.preventDefault();
        openDetails(submission);
      });
      cell.appendChild(link);
      if (state.metricView === "summary") {
        const byline = document.createElement("span");
        byline.className = "ux-model-byline";
        byline.textContent = submission.submitter || "Submitter not supplied";
        cell.appendChild(byline);
      }
      const revision = resultRevision(submission);
      const revisionBadge = chip(`leaderboard-revision-badge${revision.is_latest ? "" : " is-superseded"}`, revisionLabel(submission));
      revisionBadge.title = revision.is_latest
        ? `Latest version in this result series (${revision.version_count} version${revision.version_count === 1 ? "" : "s"})`
        : `Superseded by ${revision.latest_submission_id}`;
      if (!revision.is_latest || revision.version_count > 1) cell.appendChild(revisionBadge);
      return;
    } else if (column.key === "submitter") {
      cell.classList.add("leaderboard-submitter");
    } else if (column.key === "split") {
      cell.appendChild(chip("leaderboard-split", submission.split));
      return;
    } else if (column.key === "modelTypes") {
      const list = document.createElement("span");
      list.className = "leaderboard-chip-list";
      const types = submission.modelTypes.length ? submission.modelTypes : ["Not supplied"];
      types.forEach((type) => list.appendChild(chip("leaderboard-type", type)));
      cell.appendChild(list);
      return;
    } else if (column.key === "training") {
      cell.appendChild(chip("leaderboard-training", trainingLabel(submission)));
      return;
    } else if (column.key === "predictionData") {
      cell.appendChild(chip("leaderboard-training", predictionAvailability(submission).label));
      return;
    } else if (column.key === "status") {
      cell.appendChild(chip("leaderboard-training", resultStatusLabel(submission)));
      return;
    }
    cell.textContent = cellValue(submission, column);
  }

  function renderTable() {
    const focusedModel = document.activeElement?.closest?.("#leaderboard-body [data-comparison-model]")?.value;
    renderHeader();
    const body = element("leaderboard-body");
    body.replaceChildren();
    const rows = filteredRows();
    renderUxControls();
    if (!rows.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = Math.max(1, activeColumns().length);
      cell.className = "leaderboard-empty";
      cell.textContent =
        activeDatasetSlug() === "windsorml" && activeDataset()?.submission_count === 0
          ? "No WindsorML model results yet. Explore native CFD ground-truth profiles below."
          : "No leaderboard rows match this dataset, split, and model type.";
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }

    const columns = activeColumns();
    rows.forEach((submission) => {
      const row = document.createElement("tr");
      row.dataset.submissionId = submission.id;
      let previousGroup = null;
      columns.forEach((column) => {
        const cell = document.createElement("td");
        cell.dataset.label = column.plainLabel || column.label;
        cell.dataset.columnKey = column.key;
        if (column.group) {
          cell.dataset.columnGroup = column.group;
          cell.classList.add(groupClass(column.group));
        }
        if (column.group && column.group !== previousGroup) cell.classList.add("leaderboard-group-start");
        previousGroup = column.group || previousGroup;
        appendCellContent(cell, submission, column);
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
    if (focusedModel)
      Array.from(body.querySelectorAll("[data-comparison-model]"))
        .find((input) => input.value === focusedModel)
        ?.focus();
  }

  function renderTypeFilter() {
    const types = Array.from(new Set((state.rows.get(state.dataset) || []).flatMap((row) => row.modelTypes))).sort();
    const options = [{ value: "", label: "All model types" }, ...types.map((type) => ({ value: type, label: type }))];
    state.modelType = populateSelect(element("type-filter"), options, state.modelType);
  }

  function renderVersionControl() {
    const control = element("show-all-versions");
    if (!control) return;
    control.checked = state.showAllVersions;
    const dataset = activeDataset();
    const revisionCount = Number(dataset?.revision_count || 0);
    const currentCount = Number(dataset?.submission_count || 0);
    control.disabled = revisionCount <= currentCount;
    const wrapper = element("leaderboard-version-control");
    if (wrapper) wrapper.hidden = control.disabled;
    control.title = control.disabled
      ? "No previous result versions are published for this dataset yet."
      : "Include superseded versions as unranked historical rows.";
  }

  function radarCandidateRows() {
    return tableRowsForCurrentModelType()
      .slice()
      .sort((left, right) => {
        const latestOrder = Number(!isLatestRevision(left)) - Number(!isLatestRevision(right));
        if (latestOrder) return latestOrder;
        return compareNumbers(left.rank, right.rank, "lower") || String(left.id).localeCompare(String(right.id));
      });
  }

  function selectedRadarRows() {
    return figureRows().slice(0, maxRadarModels);
  }

  function setDefaultRadarModels() {
    state.radarModelIds = new Set(
      radarCandidateRows()
        .slice(0, defaultRadarModels)
        .map((row) => row.id)
    );
  }

  function renderRadarModelPicker() {
    const container = element("radar-model-options");
    const summary = element("radar-model-summary");
    if (!container || !summary) return;
    const pickerContext = [state.dataset, state.split, state.modelType, state.showAllVersions ? "all" : "latest"].join("|");
    const resetScroll = container.dataset.pickerContext !== pickerContext;
    container.replaceChildren();
    summary.replaceChildren();
    container.dataset.pickerContext = pickerContext;
    if (resetScroll) container.scrollTop = 0;
    const rows = radarCandidateRows();
    const selectedRows = rows.filter((row) => state.radarModelIds.has(row.id));
    const selectedCount = selectedRows.length;
    rows.forEach((row) => {
      const label = document.createElement("label");
      label.className = "leaderboard-radar-model-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = row.id;
      input.checked = state.radarModelIds.has(row.id);
      input.disabled = !input.checked && selectedCount >= maxRadarModels;
      input.dataset.radarModel = "";
      const swatch = document.createElement("span");
      swatch.className = "leaderboard-radar-swatch";
      swatch.setAttribute("aria-hidden", "true");
      const selectedIndex = selectedRows.findIndex((candidate) => candidate.id === row.id);
      swatch.style.backgroundColor = selectedIndex >= 0 ? palette[selectedIndex] : "transparent";
      const text = document.createElement("span");
      const context = rowRanking(row);
      const rankText = context?.rank ? `${context.tied ? "joint " : ""}rank ${context.rank}` : "previous version";
      text.textContent = `${rowLabel(row)} — ${rankText}`;
      label.classList.toggle("is-selected", input.checked);
      label.append(input, swatch, text);
      container.appendChild(label);
    });
    const count = element("radar-model-count");
    if (count) count.textContent = `${selectedCount} of ${rows.length} selected · maximum ${maxRadarModels}`;

    const overallDefinition = metricDefinition(ranking().metric_id);
    selectedRows.forEach((row, index) => {
      const item = document.createElement("li");
      const swatch = document.createElement("span");
      swatch.className = "leaderboard-radar-swatch";
      swatch.style.backgroundColor = palette[index];
      swatch.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.className = "leaderboard-radar-model-name";
      name.textContent = rowLabel(row);
      const score = document.createElement("strong");
      score.textContent = `Overall ${formatMetric(row.metricValues[ranking().metric_id], overallDefinition)}`;
      item.append(swatch, name, score);
      summary.appendChild(item);
    });
  }

  function updateRadarSelection() {
    renderRadarModelPicker();
    renderRadarChart();
    updateUrl();
  }

  function setDefaultComparedModels() {
    state.comparedModelIds = new Set(
      rowsForCurrentModelType()
        .slice()
        .sort((a, b) => compareNumbers(a.rank, b.rank, "lower"))
        .slice(0, 3)
        .map((row) => row.id)
    );
    state.staleComparedModelIds = new Set();
  }

  function renderComparisonModelPicker() {
    const count = element("comparison-model-count");
    if (!count) return;
    const staleCount = state.staleComparedModelIds.size;
    count.textContent = `${figureRows().length} selected · up to ${maxFigureModels}${
      staleCount ? ` · ${staleCount} requested result${staleCount === 1 ? " is" : "s are"} unavailable or above the limit` : ""
    }`;
  }

  function updateFigureSelection() {
    renderComparisonModelPicker();
    renderRadarChart();
    renderTable();
    renderComparisonChart();
    renderScatterChart();
    renderCompute();
    void prepareRegionalExplorer();
    void refreshProfileContext();
    updateUrl();
  }

  function comparisonDefinitions() {
    return activeMetricDefinitions().filter((definition) => definition.comparison_group);
  }

  function renderComparisonControls() {
    const definitions = comparisonDefinitions();
    if (!definitions.some((definition) => definition.id === state.comparisonMetric)) {
      const rankMetricId = ranking().metric_id;
      state.comparisonMetric = definitions.some((definition) => definition.id === rankMetricId) ? rankMetricId : definitions[0]?.id || "";
    }
    const options = definitions.map((definition) => {
      const groupLabel = definition.comparison_group_label || definition.group_label;
      const unit = definition.unit ? ` (${definition.unit})` : "";
      return {
        value: definition.id,
        label: `${groupLabel}: ${plainMetricLabel(definition)}${unit}`,
      };
    });
    state.comparisonMetric = populateSelect(element("comparison-metric"), options, state.comparisonMetric);
  }

  function chartTextColor() {
    return getComputedStyle(document.documentElement).getPropertyValue("--global-text-color").trim() || "#27313b";
  }

  function chartGridColor() {
    return getComputedStyle(document.documentElement).getPropertyValue("--global-divider-color").trim() || "rgba(90,100,110,.18)";
  }

  function destroyChart(key) {
    state.charts[key]?.destroy();
    state.charts[key] = null;
  }

  function profileFigureReady(key) {
    const values = state.figureSpecs.get(key)?.data?.values;
    return Boolean(
      key.startsWith("profile-") &&
        state.profileReadyVersion === state.profileLoadVersion &&
        Array.isArray(values) &&
        values.length &&
        state.figureCaptions.get(key)
    );
  }

  function assertProfileFigureCurrent(key, version) {
    if (!key.startsWith("profile-")) return;
    if (version !== state.profileLoadVersion || version !== state.profileReadyVersion || !profileFigureReady(key)) {
      throw new Error("The profile selection changed while this export was being prepared; try again after loading finishes");
    }
  }

  function syncProfileActionAvailability() {
    document.querySelectorAll('[data-figure-key^="profile-"], [data-copy-caption^="profile-"], [data-profile-data-index]').forEach((button) => {
      const key = button.dataset.figureKey || button.dataset.copyCaption || `profile-${button.dataset.profileDataIndex}`;
      button.disabled = !profileFigureReady(key);
    });
  }

  function invalidateProfileFigure(key, clearSummary = true) {
    state.figureSpecs.delete(key);
    state.figureCaptions.delete(key);
    destroyChart(key);
    const index = key.slice("profile-".length);
    const canvas = element(`${key}-chart`);
    if (canvas) canvas.hidden = true;
    const caption = element(`${key}-figure-caption`);
    if (caption) caption.textContent = "";
    const table = element(`${key}-data-table`);
    if (table) table.replaceChildren();
    if (clearSummary) setChartSummary(`${key}-chart-summary`, "");
    document.querySelectorAll(`[data-figure-key="${key}"], [data-copy-caption="${key}"], [data-profile-data-index="${index}"]`).forEach((button) => {
      button.disabled = true;
    });
  }

  function invalidateProfileFigures() {
    state.profileReadyVersion = -1;
    const keys = new Set(
      [...state.figureSpecs.keys(), ...state.figureCaptions.keys()]
        .filter((key) => key.startsWith("profile-"))
        .concat(Array.from(document.querySelectorAll("[data-profile-panel]"), (section) => `profile-${section.dataset.profilePanel}`))
    );
    keys.forEach((key) => invalidateProfileFigure(key));
    syncProfileActionAvailability();
  }

  function comparisonLabel(value, definition) {
    return formatMetric(value, definition);
  }

  function rowsForMetric(rows, definition) {
    return rows
      .filter((row) => finiteNumber(row.metricValues[definition.id]) !== null)
      .sort((a, b) => compareNumbers(a.metricValues[definition.id], b.metricValues[definition.id], definition.direction));
  }

  function omissionSentence(rows, reason) {
    if (!rows.length) return "";
    return ` Omitted selected result${rows.length === 1 ? "" : "s"} ${rows.map((row) => row.id).join(", ")} (${reason}).`;
  }

  function setChartSummary(id, text) {
    const summary = element(id);
    if (summary) summary.textContent = text;
  }

  function setFigureCaption(key, text, visibleText = text) {
    state.figureCaptions.set(key, text);
    const caption = element(`${key}-figure-caption`);
    if (caption) {
      caption.textContent = visibleText;
      caption.title = "The copied caption and exported figure retain the complete release provenance.";
    }
  }

  function renderNumericTable(containerId, captionText, columns, rows) {
    const container = element(containerId);
    if (!container) return;
    container.replaceChildren();
    const table = document.createElement("table");
    table.className = "leaderboard-data-table";
    const caption = document.createElement("caption");
    caption.textContent = captionText;
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    columns.forEach((column) => {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = column.label;
      headRow.appendChild(cell);
    });
    head.appendChild(headRow);
    const body = document.createElement("tbody");
    rows.forEach((row) => {
      const tableRow = document.createElement("tr");
      columns.forEach((column) => {
        const cell = document.createElement("td");
        const value = typeof column.value === "function" ? column.value(row) : row[column.value];
        cell.textContent = value === null || value === undefined ? "" : String(value);
        tableRow.appendChild(cell);
      });
      body.appendChild(tableRow);
    });
    table.append(caption, head, body);
    container.appendChild(table);
  }

  function figureFilename(key, extension) {
    return `fluidsbench-${slug(state.dataset)}-${slug(state.split)}-${slug(key)}-${slug(dataRelease().id || "unversioned")}.${extension}`;
  }

  function xmlEscape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  function figureExportSnapshot(key, format) {
    const spec = state.figureSpecs.get(key);
    if (!spec) throw new Error("No figure data are available for this selection");
    const captionEntry = state.figureCaptions.get(key);
    const caption = captionEntry || releaseStamp();
    const metadata = {
      schema_version: "fluidsbench-svg-metadata-v2",
      release: dataRelease(),
      leaderboard_manifest: leaderboardManifestProvenance(),
      loaded_feed_sha256: state.loadedFeedSha256,
      feed_verified: state.feedVerified,
      loaded_profile_ground_truth_manifest: state.groundTruthManifestProvenance ? { ...state.groundTruthManifestProvenance } : null,
      archive_url: releaseArchiveUrl() || null,
      license: releaseLicenseMetadata(),
      publication_scope: publicationScope(),
      view_url: currentViewUrl(false, false),
      selected_submission_ids: Array.from(new Set((spec.data?.values || []).map((row) => row.submission_id).filter(Boolean))),
      caption,
      figure_spec: spec,
    };
    return {
      key,
      spec,
      captionEntry,
      caption,
      metadata,
      svgTitle: `${state.dataset}: ${key}`,
      filename: format === "print" ? "" : figureFilename(key, format),
      profileVersion: key.startsWith("profile-") ? state.profileLoadVersion : null,
    };
  }

  function assertFigureExportCurrent(snapshot) {
    if (state.figureSpecs.get(snapshot.key) !== snapshot.spec || state.figureCaptions.get(snapshot.key) !== snapshot.captionEntry) {
      throw new Error("Figure selection changed while the export was being prepared; export again for the current view");
    }
    if (snapshot.profileVersion !== null) assertProfileFigureCurrent(snapshot.key, snapshot.profileVersion);
  }

  function decorateSvg(svg, snapshot) {
    const annotation = `<title>${xmlEscape(snapshot.svgTitle)}</title><desc>${xmlEscape(snapshot.caption)}</desc><metadata>${xmlEscape(
      JSON.stringify(snapshot.metadata)
    )}</metadata>`;
    return svg.replace(/<svg([^>]*)>/, `<svg$1>${annotation}`);
  }

  function figureSpecBase(title, values) {
    const release = dataRelease();
    const subtitle = [
      `Data release ${release.id || "unversioned"} · status ${humanize(release.status || "not supplied")}`,
      `Release manifest SHA-256: ${releaseManifestSha256() || "not supplied"}`,
      `Verified scalar feed SHA-256: ${state.loadedFeedSha256 || release.feed_sha256 || "not supplied"}`,
      `Result data: ${humanize(publicationScope().result_data_origin)} · FluidsBench model execution and base-metric recomputation: not performed`,
      releaseArchiveUrl() ? `Release data archive: ${releaseArchiveUrl()}` : "No separate release data archive supplied",
      releaseViewUrl() ? `Immutable release view: ${releaseViewUrl()}` : "No immutable release view supplied",
    ];
    if (release.profile_ground_truth?.release_id) {
      subtitle.push(
        `Profile ground truth: ${release.profile_ground_truth.release_id} · manifest SHA-256 ${
          release.profile_ground_truth.manifest_sha256 || "not supplied"
        }`
      );
    }
    if (release.status !== "official") subtitle.push("PROTOTYPE — NOT FOR CITATION OR PROMOTIONAL CLAIMS");
    return {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      width: 900,
      height: 480,
      background: "white",
      padding: 16,
      title: {
        text: title,
        subtitle,
        anchor: "start",
        color: "#111827",
        fontSize: 18,
        subtitleColor: "#4b5563",
        subtitleFontSize: 11,
        subtitleLineHeight: 15,
      },
      data: { values },
      config: {
        font: "Arial",
        axis: {
          domainColor: "#4b5563",
          gridColor: "#e5e7eb",
          labelColor: "#111827",
          titleColor: "#111827",
          titleFontWeight: 600,
        },
        legend: { labelColor: "#111827", titleColor: "#111827" },
        view: { stroke: null },
      },
      usermeta: {
        fluidsbench_release: dataRelease(),
        fluidsbench_archive_url: releaseArchiveUrl() || null,
        fluidsbench_license: releaseLicenseMetadata(),
        fluidsbench_publication_scope: publicationScope(),
        fluidsbench_view_url: currentViewUrl(false, false),
      },
    };
  }

  async function withVegaView(spec, callback) {
    if (typeof window.vegaEmbed !== "function") throw new Error("The vector export library is not available");
    const host = document.createElement("div");
    host.style.cssText = "left:-10000px;position:fixed;top:0;width:960px;";
    document.body.appendChild(host);
    let result;
    try {
      result = await window.vegaEmbed(host, spec, { actions: false, renderer: "svg" });
      await result.view.runAsync();
      return await callback(result.view);
    } finally {
      result?.view?.finalize();
      host.remove();
    }
  }

  function printFigureSvg(svg, caption) {
    element("leaderboard-print-figure")?.remove();
    const printArea = document.createElement("section");
    printArea.id = "leaderboard-print-figure";
    printArea.setAttribute("aria-label", "FluidsBench figure print view");
    printArea.innerHTML = svg;
    const captionElement = document.createElement("p");
    captionElement.textContent = caption;
    printArea.appendChild(captionElement);
    document.body.appendChild(printArea);
    const cleanup = () => {
      document.body.classList.remove("leaderboard-printing");
      printArea.remove();
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    document.body.classList.add("leaderboard-printing");
    window.print();
    window.setTimeout(() => {
      if (document.body.classList.contains("leaderboard-printing")) cleanup();
    }, 120000);
  }

  async function exportFigure(key, format) {
    const status = element("leaderboard-release-action-status");
    try {
      const snapshot = figureExportSnapshot(key, format);
      assertFigureExportCurrent(snapshot);
      if (status) status.textContent = `Preparing ${format === "print" ? "print view" : format.toUpperCase()}...`;
      if (format === "svg") {
        const renderedSvg = await withVegaView(snapshot.spec, (view) => view.toSVG());
        assertFigureExportCurrent(snapshot);
        const svg = decorateSvg(renderedSvg, snapshot);
        downloadText(snapshot.filename, svg, "image/svg+xml;charset=utf-8");
      } else if (format === "png") {
        const dataUrl = await withVegaView(snapshot.spec, (view) => view.toImageURL("png", 3));
        assertFigureExportCurrent(snapshot);
        const blob = await fetch(dataUrl).then((response) => response.blob());
        assertFigureExportCurrent(snapshot);
        downloadBlob(snapshot.filename, blob);
      } else if (format === "print") {
        const renderedSvg = await withVegaView(snapshot.spec, (view) => view.toSVG());
        assertFigureExportCurrent(snapshot);
        const svg = decorateSvg(renderedSvg, snapshot);
        printFigureSvg(svg, snapshot.caption);
        if (status) status.textContent = "Opened the browser print dialog; choose Save as PDF to create a PDF.";
      }
    } catch (error) {
      if (status) status.textContent = `Could not export figure: ${error.message}`;
      console.error(error);
    }
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.cssText = "opacity:0;position:fixed;";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  async function copyFigureCaption(key) {
    const caption = state.figureCaptions.get(key);
    if (!caption) return;
    const status = element("leaderboard-release-action-status");
    try {
      await copyText(caption);
      if (status) status.textContent = "Figure caption copied.";
    } catch (error) {
      if (status) status.textContent = `Could not copy caption: ${error.message}`;
    }
  }

  async function copyResultCitation(kind) {
    const status = element("result-citation-copy-status");
    const row = resultRowById(state.resultId);
    const eligibility = claimEligibility(row);
    const allowed = kind === "promotion" ? eligibility.promotion : eligibility.academic_citation;
    if (!row || !allowed) {
      const declaredAllowed = kind === "promotion" ? eligibility.declared.promotion : eligibility.declared.academic_citation;
      if (status) {
        status.textContent = declaredAllowed
          ? `Copying is temporarily unavailable because browser verification has not passed: ${eligibility.reason}`
          : `Copy unavailable under the release declaration: ${eligibility.declared.reason}`;
      }
      return;
    }
    try {
      await copyText(citationValues()[kind]);
      if (status) {
        status.textContent = `${kind === "bibtex" ? "Result BibTeX" : kind === "promotion" ? "Leaderboard claim" : "Result citation"} copied.`;
      }
    } catch (error) {
      if (status) status.textContent = `Could not copy result citation: ${error.message}`;
    }
  }

  const barValueLabels = {
    id: "barValueLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.fillStyle = chartTextColor();
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const definition = dataset.metricDefinition;
        chart.getDatasetMeta(datasetIndex).data.forEach((bar, index) => {
          const value = dataset.data[index];
          if (!Number.isFinite(value)) return;
          ctx.fillText(comparisonLabel(value, definition), bar.x, Math.max(chart.chartArea.top + 10, bar.y - 7));
        });
      });
      ctx.restore();
    },
  };

  function colorWithAlpha(color, alpha) {
    const suffix = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
      .toString(16)
      .padStart(2, "0");
    return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${suffix}` : color;
  }

  function renderRadarChart() {
    const canvas = element("radar-chart");
    const unavailable = element("radar-chart-unavailable");
    if (!canvas || !unavailable) return;
    destroyChart("radar");
    const axes = radarMetricAxes();
    const rows = selectedRadarRows();
    element("leaderboard-radar-panel")?.classList.toggle("ux-radar-unavailable", axes.length < 3 || !rows.length);
    const radarNote = element("ux-radar-selection-note");
    if (radarNote)
      radarNote.textContent =
        figureRows().length > maxRadarModels ? "The radar shows the first four selected models. All selected models appear in the other charts." : "";
    const overallDefinition = metricDefinition(ranking().metric_id);
    const tableColumns = [
      { label: "Model", value: (row) => rowLabel(row) },
      { label: "Submission ID", value: "id" },
      { label: "Overall score", value: (row) => formatMetric(row.metricValues[ranking().metric_id], overallDefinition) },
    ];
    axes.forEach((axis) => {
      tableColumns.push(
        {
          label: `${plainMetricLabel(axis.definition)} — raw`,
          value: (row) => formatMetric(row.metricValues[axis.definition.id], axis.definition),
        },
        {
          label: `${plainMetricLabel(axis.definition)} — normalized /100`,
          value: (row) => {
            const normalized = radarNormalizedValue(row.metricValues[axis.definition.id], axis.component);
            return normalized === null ? "N/A" : normalized.toFixed(1);
          },
        }
      );
    });
    renderNumericTable(
      "radar-data-table",
      `${state.dataset}, ${state.split}: raw metrics and stable normalized values used in the radar comparison.`,
      tableColumns,
      rows
    );

    if (axes.length < 3) {
      canvas.hidden = true;
      unavailable.hidden = false;
      unavailable.textContent =
        activeDatasetDisplay().radar_unavailable_reason ||
        "This dataset does not yet define enough independently scored components for a scientifically meaningful radar chart.";
      setChartSummary("radar-chart-summary", unavailable.textContent);
      return;
    }
    if (!rows.length) {
      canvas.hidden = true;
      unavailable.hidden = false;
      unavailable.textContent = "Select at least one model to draw the comparison.";
      setChartSummary("radar-chart-summary", unavailable.textContent);
      return;
    }
    if (typeof Chart === "undefined") return;
    canvas.hidden = false;
    unavailable.hidden = true;
    const missingValues = [];
    rows.forEach((row) => {
      axes.forEach((axis) => {
        if (radarNormalizedValue(row.metricValues[axis.definition.id], axis.component) === null) {
          missingValues.push(`${rowLabel(row)}: ${plainMetricLabel(axis.definition)}`);
        }
      });
    });
    const axisNames = axes.map((axis) => plainMetricLabel(axis.definition));
    const modelNames = rows.map(rowLabel);
    canvas.setAttribute("aria-label", `${state.dataset}, ${state.split} normalized performance comparison for ${modelNames.join(", ")}`);
    setChartSummary(
      "radar-chart-summary",
      `${state.dataset}, ${state.split} radar chart. Models: ${modelNames.join(", ")}. Axes: ${axisNames.join(", ")}. ` +
        "Each axis runs from 0 to 100, where 100 is better, using the published score transform. " +
        (missingValues.length ? `Unavailable values: ${missingValues.join("; ")}.` : "All selected values are available.")
    );
    state.charts.radar = new Chart(canvas, {
      type: "radar",
      data: {
        labels: axes.map((axis) => radarAxisLabel(axis.definition)),
        datasets: rows.map((row, index) => ({
          label: rowLabel(row),
          data: axes.map((axis) => radarNormalizedValue(row.metricValues[axis.definition.id], axis.component)),
          backgroundColor: colorWithAlpha(palette[index], 0.13),
          borderColor: palette[index],
          borderWidth: 2,
          pointBackgroundColor: palette[index],
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: palette[index],
          pointRadius: 3,
          pointHoverRadius: 5,
          spanGaps: false,
          submissionRow: row,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "nearest", intersect: false },
        scales: {
          r: {
            min: 0,
            max: 100,
            beginAtZero: true,
            angleLines: { color: chartGridColor() },
            grid: { color: chartGridColor() },
            pointLabels: {
              color: chartTextColor(),
              font: { family: "system-ui, sans-serif", size: 11, weight: "600" },
              padding: 10,
            },
            ticks: {
              backdropColor: "transparent",
              color: chartTextColor(),
              maxTicksLimit: 5,
              stepSize: 25,
              showLabelBackdrop: false,
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: chartTextColor(), boxHeight: 10, boxWidth: 18, padding: 16, usePointStyle: true },
          },
          tooltip: {
            callbacks: {
              title(contexts) {
                const axis = axes[contexts[0]?.dataIndex];
                return axis ? plainMetricLabel(axis.definition) : "Metric";
              },
              label(context) {
                const axis = axes[context.dataIndex];
                const row = context.dataset.submissionRow;
                const rawValue = finiteNumber(row?.metricValues?.[axis.definition.id]);
                if (rawValue === null) return `${context.dataset.label}: unavailable`;
                const normalized = radarNormalizedValue(rawValue, axis.component);
                return [
                  `${context.dataset.label}: ${normalized.toFixed(1)} / 100`,
                  `Raw: ${formatMetric(rawValue, axis.definition)}`,
                  `Scale: ${radarTransformDescription(axis)}`,
                ];
              },
            },
          },
        },
      },
    });
  }

  function renderComparisonChart() {
    const canvas = element("comparison-chart");
    if (!canvas || typeof Chart === "undefined") return;
    destroyChart("comparison");
    const definition = comparisonDefinitions().find((candidate) => candidate.id === state.comparisonMetric);
    if (!definition) return;
    const selectedRows = figureRows();
    const rows = rowsForMetric(selectedRows, definition);
    const omittedRows = selectedRows.filter((row) => finiteNumber(row.metricValues[definition.id]) === null);
    const directionText = `${definition.direction === "lower" ? "Lower" : "Higher"} is better`;
    const unitText = definition.unit ? ` Values are shown in ${definition.unit}.` : "";
    element("comparison-description").textContent = `${plainMetricLabel(definition)}: ${directionText.toLowerCase()}.${unitText}`;
    const rowsWithValues = rows;
    const bestRow = rowsWithValues[0];
    const bestText = bestRow
      ? ` Best displayed value: ${rowLabel(bestRow)}, ${formatMetric(bestRow.metricValues[definition.id], definition)}.`
      : " No numeric values are available for this selection.";
    canvas.setAttribute("aria-label", `${plainMetricLabel(definition)} comparison for ${state.dataset}, ${state.split}`);
    setChartSummary(
      "comparison-chart-summary",
      `${plainMetricLabel(definition)} bar chart for ${state.dataset}, ${state.split}. ${
        rowsWithValues.length
      } explicitly selected submissions displayed. ${directionText}.${bestText}${omissionSentence(omittedRows, "metric unavailable")}`
    );
    const caption = `${state.dataset}, ${state.split}: ${plainMetricLabel(definition)} for ${rows.length} explicitly selected model${
      rows.length === 1 ? "" : "s"
    }; ${directionText.toLowerCase()}.${omissionSentence(
      omittedRows,
      "metric unavailable"
    )} ${releaseStamp()}. Open reproducibility track with public scored ground truth.`;
    setFigureCaption(
      "comparison",
      caption,
      `${state.dataset} · ${state.split} · ${plainMetricLabel(definition)} · ${rows.length} selected model${rows.length === 1 ? "" : "s"}`
    );
    const figureValues = rows.map((row, index) => ({
      model: rowLabel(row),
      submission_id: row.id,
      rank: row.rank,
      value: row.metricValues[definition.id],
      order: index,
      ...validationMetadata(row),
    }));
    state.figureSpecs.set("comparison", {
      ...figureSpecBase(`${state.dataset}: ${plainMetricLabel(definition)}`, figureValues),
      mark: { type: "bar", color: palette[0], tooltip: true },
      encoding: {
        x: {
          field: "model",
          type: "nominal",
          sort: { field: "order", order: "ascending" },
          axis: { labelAngle: -25, labelLimit: 180, title: "Model" },
        },
        y: { field: "value", type: "quantitative", scale: { zero: true }, title: axisTitle(definition) },
        tooltip: [
          { field: "model", type: "nominal", title: "Model" },
          { field: "submission_id", type: "nominal", title: "Submission ID" },
          { field: "rank", type: "quantitative", title: "Overall rank" },
          { field: "value", type: "quantitative", title: plainMetricLabel(definition) },
        ],
      },
    });
    renderNumericTable(
      "comparison-data-table",
      `${plainMetricLabel(definition)} values used in the displayed figure.`,
      [
        { label: "Model", value: (row) => rowLabel(row) },
        { label: "Submission ID", value: "id" },
        { label: "Rank", value: "rank" },
        { label: plainMetricLabel(definition), value: (row) => String(row.metricValues[definition.id]) },
        { label: "Unit", value: () => definition.unit || "dimensionless" },
        { label: "Direction", value: () => `${definition.direction} is better` },
      ],
      rows
    );
    state.charts.comparison = new Chart(canvas, {
      type: "bar",
      data: {
        labels: rows.map(rowLabel),
        datasets: [
          {
            label: plainMetricLabel(definition),
            data: rows.map((row) => row.metricValues[definition.id]),
            backgroundColor: `${palette[0]}cc`,
            borderColor: palette[0],
            borderWidth: 1,
            metricDefinition: definition,
          },
        ],
      },
      plugins: [barValueLabels],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 34, right: 10 } },
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { ticks: { color: chartTextColor() }, grid: { display: false } },
          y: {
            beginAtZero: true,
            grace: "12%",
            title: { display: true, text: axisTitle(definition), color: chartTextColor() },
            ticks: { color: chartTextColor() },
            grid: { color: chartGridColor() },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.dataset.label}: ${comparisonLabel(context.raw, context.dataset.metricDefinition)}`;
              },
            },
          },
        },
      },
    });
  }

  function scatterDefinitions() {
    return [...activeMetricDefinitions(), { id: "parameters", label: "Parameters", unit: "M", digits: 2, direction: "neutral", kind: "metadata" }];
  }

  function renderScatterControls() {
    const definitions = scatterDefinitions();
    const options = definitions.map((definition) => ({ value: definition.id, label: plainMetricLabel(definition) }));
    const rankMetricId = ranking().metric_id;
    if (!definitions.some((definition) => definition.id === state.scatterY)) state.scatterY = rankMetricId;
    if (!definitions.some((definition) => definition.id === state.scatterX) || state.scatterX === state.scatterY) {
      state.scatterX = definitions.find((definition) => definition.id !== state.scatterY)?.id || state.scatterY;
    }
    state.scatterX = populateSelect(element("scatter-x-axis"), options, state.scatterX);
    state.scatterY = populateSelect(element("scatter-y-axis"), options, state.scatterY);
  }

  function scatterValue(row, metricId) {
    return metricId === "parameters" ? row.parameterCount : row.metricValues[metricId];
  }

  function axisTitle(definition) {
    const label = `${plainMetricLabel(definition)}${definition.unit ? ` (${definition.unit})` : ""}`;
    if (definition.direction === "neutral") return label;
    const direction = definition.direction === "lower" ? "lower is better" : "higher is better";
    return `${label}; ${direction}`;
  }

  function renderScatterChart() {
    const canvas = element("scatter-chart");
    if (!canvas || typeof Chart === "undefined") return;
    destroyChart("scatter");
    const definitions = new Map(scatterDefinitions().map((definition) => [definition.id, definition]));
    const xDefinition = definitions.get(state.scatterX);
    const yDefinition = definitions.get(state.scatterY);
    if (!xDefinition || !yDefinition) return;
    const rows = figureRows();
    const points = rows
      .map((row, index) => ({
        x: scatterValue(row, state.scatterX),
        y: scatterValue(row, state.scatterY),
        row,
        backgroundColor: palette[index % palette.length],
      }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    const plottedIds = new Set(points.map((point) => point.row.id));
    const omittedRows = rows.filter((row) => !plottedIds.has(row.id));
    const xValues = points.map((point) => point.x);
    const yValues = points.map((point) => point.y);
    const rangeText = points.length
      ? ` ${plainMetricLabel(xDefinition)} ranges from ${formatMetric(Math.min(...xValues), xDefinition)} to ${formatMetric(
          Math.max(...xValues),
          xDefinition
        )}; ${plainMetricLabel(yDefinition)} ranges from ${formatMetric(Math.min(...yValues), yDefinition)} to ${formatMetric(
          Math.max(...yValues),
          yDefinition
        )}.`
      : " No submissions have numeric values for both selected axes.";
    canvas.setAttribute(
      "aria-label",
      `${plainMetricLabel(xDefinition)} versus ${plainMetricLabel(yDefinition)} for ${state.dataset}, ${state.split}`
    );
    setChartSummary(
      "scatter-chart-summary",
      `Scatter chart for ${state.dataset}, ${state.split}, with ${points.length} explicitly selected submissions.${rangeText}${omissionSentence(
        omittedRows,
        "one or both axis values unavailable"
      )}`
    );
    const caption = `${state.dataset}, ${state.split}: ${plainMetricLabel(xDefinition)} versus ${plainMetricLabel(yDefinition)} for ${
      points.length
    } explicitly selected model${points.length === 1 ? "" : "s"}.${omissionSentence(
      omittedRows,
      "one or both axis values unavailable"
    )} ${releaseStamp()}. Open reproducibility track with public scored ground truth.`;
    setFigureCaption(
      "scatter",
      caption,
      `${state.dataset} · ${state.split} · ${plainMetricLabel(xDefinition)} versus ${plainMetricLabel(yDefinition)} · ${
        points.length
      } selected model${points.length === 1 ? "" : "s"}`
    );
    const figureValues = points.map((point, index) => ({
      model: rowLabel(point.row),
      submission_id: point.row.id,
      rank: point.row.rank,
      x: point.x,
      y: point.y,
      order: index,
      ...validationMetadata(point.row),
    }));
    state.figureSpecs.set("scatter", {
      ...figureSpecBase(`${state.dataset}: metric scatter`, figureValues),
      mark: { type: "point", filled: true, size: 120, tooltip: true },
      encoding: {
        x: { field: "x", type: "quantitative", title: axisTitle(xDefinition) },
        y: { field: "y", type: "quantitative", title: axisTitle(yDefinition) },
        color: {
          field: "model",
          type: "nominal",
          scale: { domain: figureValues.map((point) => point.model), range: palette.slice(0, figureValues.length) },
          legend: { title: "Model", labelLimit: 260 },
        },
        tooltip: [
          { field: "model", type: "nominal", title: "Model" },
          { field: "submission_id", type: "nominal", title: "Submission ID" },
          { field: "rank", type: "quantitative", title: "Overall rank" },
          { field: "x", type: "quantitative", title: plainMetricLabel(xDefinition) },
          { field: "y", type: "quantitative", title: plainMetricLabel(yDefinition) },
        ],
      },
    });
    renderNumericTable(
      "scatter-data-table",
      `Values used in the displayed ${plainMetricLabel(xDefinition)} versus ${plainMetricLabel(yDefinition)} figure.`,
      [
        { label: "Model", value: (point) => rowLabel(point.row) },
        { label: "Submission ID", value: (point) => point.row.id },
        { label: "Rank", value: (point) => point.row.rank },
        { label: plainMetricLabel(xDefinition), value: (point) => String(point.x) },
        { label: "X unit", value: () => xDefinition.unit || "dimensionless" },
        { label: plainMetricLabel(yDefinition), value: (point) => String(point.y) },
        { label: "Y unit", value: () => yDefinition.unit || "dimensionless" },
      ],
      points
    );
    state.charts.scatter = new Chart(canvas, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: `${plainMetricLabel(xDefinition)} vs ${plainMetricLabel(yDefinition)}`,
            data: points,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: points.map((point) => point.backgroundColor),
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        scales: {
          x: {
            title: { display: true, text: axisTitle(xDefinition), color: chartTextColor() },
            ticks: { color: chartTextColor() },
            grid: { color: chartGridColor() },
          },
          y: {
            title: { display: true, text: axisTitle(yDefinition), color: chartTextColor() },
            ticks: { color: chartTextColor() },
            grid: { color: chartGridColor() },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title(items) {
                return items[0]?.raw?.row ? rowLabel(items[0].raw.row) : "Submission";
              },
              label(context) {
                const point = context.raw;
                return [
                  `${plainMetricLabel(xDefinition)}: ${formatMetric(point.x, xDefinition)}`,
                  `${plainMetricLabel(yDefinition)}: ${formatMetric(point.y, yDefinition)}`,
                ];
              },
            },
          },
        },
      },
    });
  }

  function regionalFieldDefinition() {
    const fields = regionalFieldsForDataset();
    const requested = element("regional-field")?.value;
    return fields[requested] || fields.surface_pressure || Object.values(fields)[0] || null;
  }

  function configureRegionalFieldSelection() {
    const select = element("regional-field");
    const fields = Object.values(regionalFieldsForDataset());
    if (!select || !fields.length) return fields[0] || null;
    const requested = select.value;
    const selected = fields.some((field) => field.id === requested)
      ? requested
      : (fields.find((field) => field.id === "surface_pressure") || fields[0]).id;
    populateSelect(
      select,
      fields.map((field) => ({ value: field.id, label: field.label })),
      selected
    );
    return fields.find((field) => field.id === select.value) || fields[0];
  }

  function regionalPrimaryWeighting(fieldReport, field) {
    if (field?.primaryWeighting) return field.primaryWeighting;
    return fieldReport?.primary_weighting === "physical" ? "physical" : "equal_entity";
  }

  function regionalAvailableWeightings(fieldReport, field) {
    if (field?.primaryWeighting) return [field.primaryWeighting];
    const regions = Array.isArray(fieldReport?.regions) ? fieldReport.regions : [];
    return ["equal_entity", "physical"].filter((weighting) => regions.some((region) => record(record(region)[weighting]).pooled));
  }

  function regionalWeighting(fieldReport, field) {
    const requested = element("regional-weighting")?.value || "primary";
    const primary = regionalPrimaryWeighting(fieldReport, field);
    return requested === "primary" || !regionalAvailableWeightings(fieldReport, field).includes(requested) ? primary : requested;
  }

  function regionalWeightingLabel(weighting, field) {
    if (weighting === field?.primaryWeighting && field?.primaryWeightingLabel) return field.primaryWeightingLabel;
    return weighting === "physical" ? "physical weighting" : "equal native entities";
  }

  function configureRegionalWeighting(fieldReport, field) {
    const select = element("regional-weighting");
    if (!select) return;
    const primary = regionalPrimaryWeighting(fieldReport, field);
    const available = new Set(regionalAvailableWeightings(fieldReport, field));
    const primaryLabel = regionalWeightingLabel(primary, field);
    select.options[0].textContent = `Official field weighting (${primaryLabel})`;
    Array.from(select.options).forEach((option) => {
      if (option.value === "primary") {
        option.disabled = false;
      } else {
        option.disabled = !available.has(option.value) || (field?.primaryWeighting && option.value === primary);
      }
    });
    const selected = select.options[select.selectedIndex];
    if (selected?.disabled) select.value = "primary";
  }

  function regionalSupport(report, field) {
    const definition = regionalDatasetDefinition(report?.dataset_id);
    if (definition?.layout === "domains") {
      const support = record(report?.[field.domain]);
      return support.support_id === field.supportId ? support : {};
    }
    return record(record(report).supports)[field.supportId] || {};
  }

  function regionalFieldReport(report, field) {
    if (!field) return null;
    return record(regionalSupport(report, field).fields)[field.reportFieldId || field.id] || null;
  }

  function regionalDefinition(report, field) {
    const datasetDefinition = regionalDatasetDefinition(report?.dataset_id);
    if (datasetDefinition?.layout === "domains") return record(datasetDefinition.supports)[field.supportId] || {};
    return regionalSupport(report, field).definition || {};
  }

  function regionalRules(report, field) {
    const definition = regionalDefinition(report, field);
    const rules = definition.regions || definition.regions_in_code_order;
    return Array.isArray(rules) ? rules.filter((rule) => record(rule).region_id) : [];
  }

  function regionalLabel(regionId) {
    const labels = {
      low_z_horizontal_normal: "Low z · horizontal normal",
      low_z_other_normal: "Low z · other normal",
      high_z_horizontal_normal: "High z · horizontal normal",
      high_z_other_normal: "High z · other normal",
      underbody_and_wheels: "Underbody & wheels",
      near_body_upper: "Near-body upper",
      near_wake: "Near wake",
      upstream_and_outer: "Upstream & outer",
      nacelle_installation_envelope_proxy: "Nacelle installation envelope",
      inboard_high_lift_envelope_proxy: "Inboard high-lift envelope",
      outboard_high_lift_envelope_proxy: "Outboard high-lift envelope",
      fuselage_tail_and_remaining: "Fuselage, tail & remaining",
      near_airframe_sdf_band: "Near-airframe SDF band",
      aft_airframe_wake_envelope_proxy: "Aft-airframe wake envelope",
      near_aircraft_flow_envelope: "Near-aircraft flow envelope",
      farfield_and_remaining: "Farfield & remaining",
      near_body: "Near body",
      wake: "Wake envelope",
      farfield: "Farfield & remaining",
      streamwise_facing: "Streamwise-facing",
      lateral_facing: "Lateral-facing",
      upward_facing: "Upward-facing",
      downward_facing: "Downward-facing",
    };
    return labels[regionId] || humanize(regionId);
  }

  function regionalNumber(value) {
    const numeric = finiteNumber(value);
    return numeric === null ? "—" : `${formatNumber(numeric, 3)}%`;
  }

  function regionalScalarNumber(value) {
    const numeric = finiteNumber(value);
    return numeric === null ? "—" : formatNumber(numeric, 3);
  }

  function regionalPooled(region, weighting) {
    const nested = record(record(region)[weighting]).pooled;
    return nested && typeof nested === "object" ? nested : record(region);
  }

  function regionalErrorShare(region, weighting) {
    const pooled = regionalPooled(region, weighting);
    const fraction = finiteNumber(pooled?.fraction_of_support_squared_error ?? region?.squared_error_fraction);
    return fraction === null ? null : 100 * fraction;
  }

  function regionalEntityShare(region) {
    const fraction = finiteNumber(region?.entity_fraction);
    return fraction === null ? null : 100 * fraction;
  }

  function regionalWeightShare(region, weighting) {
    const fraction = finiteNumber(region?.weight_fraction ?? (weighting === "physical" ? region?.physical_weight_fraction : region?.entity_fraction));
    return fraction === null ? null : 100 * fraction;
  }

  function regionalCaseMacro(region, weighting, metricId) {
    const flat = record(record(record(region).case_macro)[metricId]);
    const flatValue = finiteNumber(flat.value);
    if (flatValue !== null) return flatValue;
    return finiteNumber(record(record(region)[weighting]).macro_case_mean?.[metricId]);
  }

  function regionalCaseStatistic(region, weighting, statistic, metricId = "relative_l2_percent") {
    const flat = finiteNumber(record(record(record(region).case_distribution)[metricId])[statistic]);
    if (flat !== null) return flat;
    return finiteNumber(record(record(record(region)[weighting]).case_distribution)[metricId]?.[statistic]);
  }

  function regionalUsesWholeSupportMetric(field) {
    return field?.primaryRegionalMetric === "case_macro_whole_support_normalized_rmse_percent";
  }

  function regionalPrimaryMetricValue(region, weighting, field) {
    if (regionalUsesWholeSupportMetric(field)) {
      return regionalCaseMacro(region, weighting, "whole_support_normalized_rmse_percent");
    }
    return finiteNumber(regionalPooled(region, weighting)?.relative_l2_percent);
  }

  function regionalGuideCard(rule, index) {
    const region = record(rule);
    return `<div class="leaderboard-regional-zone" style="--regional-zone-color:${regionalPalette[index % regionalPalette.length]}">
      <strong>${escapeHtml(regionalLabel(region.region_id))}</strong>
      <span>${escapeHtml(region.predicate || "Released geometric predicate")}</span>
    </div>`;
  }

  function regionalSurfaceGuide(rules) {
    const byId = new Map(rules.map((rule, index) => [rule.region_id, { rule, index }]));
    const card = (regionId) => {
      const item = byId.get(regionId);
      return item ? regionalGuideCard(item.rule, item.index) : "";
    };
    return `<div class="leaderboard-surface-region-grid" aria-label="Surface geometric-region partition">
      <div class="leaderboard-region-grid-corner">Face-centre z</div>
      <div class="leaderboard-region-grid-axis">|normal z| ≥ 0.5</div>
      <div class="leaderboard-region-grid-axis">|normal z| &lt; 0.5</div>
      <div class="leaderboard-region-grid-axis">z ≥ 0.75 m</div>
      ${card("high_z_horizontal_normal")}
      ${card("high_z_other_normal")}
      <div class="leaderboard-region-grid-axis">z &lt; 0.75 m</div>
      ${card("low_z_horizontal_normal")}
      ${card("low_z_other_normal")}
    </div>`;
  }

  function regionalVolumeGuide(rules) {
    const byId = new Map(rules.map((rule, index) => [rule.region_id, { rule, index }]));
    const color = (regionId) => regionalPalette[(byId.get(regionId)?.index || 0) % regionalPalette.length];
    return `<div class="leaderboard-volume-region-guide">
      <svg viewBox="0 0 760 235" role="img" aria-label="Volume regional partition in a streamwise x-z projection">
        <rect x="60" y="26" width="660" height="168" rx="8" fill="${color("upstream_and_outer")}1f" stroke="${color(
          "upstream_and_outer"
        )}" stroke-width="1.5"/>
        <rect x="155" y="145" width="375" height="49" fill="${color("underbody_and_wheels")}3d" stroke="${color(
          "underbody_and_wheels"
        )}" stroke-width="1.5"/>
        <rect x="155" y="65" width="375" height="80" fill="${color("near_body_upper")}3d" stroke="${color("near_body_upper")}" stroke-width="1.5"/>
        <rect x="530" y="26" width="190" height="168" fill="${color("near_wake")}3d" stroke="${color("near_wake")}" stroke-width="1.5"/>
        <g class="leaderboard-volume-region-labels">
          <text x="72" y="51">upstream / outer</text><text x="343" y="174" text-anchor="middle">underbody &amp; wheels</text>
          <text x="343" y="109" text-anchor="middle">near-body upper</text><text x="625" y="109" text-anchor="middle">near wake</text>
        </g>
        <g class="leaderboard-volume-region-axis"><line x1="60" y1="205" x2="720" y2="205"/>
          <text x="390" y="230" text-anchor="middle">streamwise x (m)</text><text x="60" y="220" text-anchor="middle">−2</text>
          <text x="155" y="220" text-anchor="middle">−0.85</text><text x="530" y="220" text-anchor="middle">3.65</text><text x="720" y="220" text-anchor="middle">6.0</text>
          <text x="52" y="148" text-anchor="end">z 0.75</text><text x="52" y="68" text-anchor="end">2.0</text><text x="52" y="29" text-anchor="end">2.5</text></g>
      </svg>
      <div class="leaderboard-regional-zone-list">${rules.map(regionalGuideCard).join("")}</div>
    </div>`;
  }

  function ahmedRegionalVolumeGuide(rules) {
    const byId = new Map(rules.map((rule, index) => [rule.region_id, { rule, index }]));
    const color = (regionId) => regionalPalette[(byId.get(regionId)?.index || 0) % regionalPalette.length];
    return `<div class="leaderboard-volume-region-guide">
      <svg viewBox="0 0 760 235" role="img" aria-label="AhmedML three-zone volume partition in a streamwise x-z projection">
        <rect x="55" y="25" width="665" height="168" rx="8" fill="${color("farfield")}1f" stroke="${color("farfield")}" stroke-width="1.5"/>
        <rect x="220" y="88" width="205" height="105" fill="${color("near_body")}46" stroke="${color("near_body")}" stroke-width="2"/>
        <rect x="425" y="88" width="245" height="105" fill="${color("wake")}46" stroke="${color("wake")}" stroke-width="2"/>
        <g class="leaderboard-volume-region-labels">
          <text x="82" y="52">farfield / remaining</text>
          <text x="322" y="142" text-anchor="middle">near body</text>
          <text x="548" y="142" text-anchor="middle">wake envelope</text>
        </g>
        <g class="leaderboard-volume-region-axis"><line x1="55" y1="205" x2="720" y2="205"/>
          <text x="390" y="230" text-anchor="middle">streamwise x / body length</text>
          <text x="220" y="220" text-anchor="middle">−1.25</text><text x="425" y="220" text-anchor="middle">0</text><text x="670" y="220" text-anchor="middle">2</text>
        </g>
      </svg>
      <div class="leaderboard-regional-zone-list">${rules.map(regionalGuideCard).join("")}</div>
    </div>`;
  }

  function ahmedRegionalSurfaceGuide(rules) {
    const byId = new Map(rules.map((rule, index) => [rule.region_id, { rule, index }]));
    const color = (regionId) => regionalPalette[(byId.get(regionId)?.index || 0) % regionalPalette.length];
    return `<div class="leaderboard-hilift-region-guide">
      <svg viewBox="0 0 760 285" role="img" aria-label="AhmedML dominant outward-normal surface orientation bins">
        <path d="M145 184 L208 88 L478 88 L590 132 L625 184 Z" fill="none" stroke="#667085" stroke-width="4"/>
        <path d="M145 184 L625 184" stroke="${color("downward_facing")}" stroke-width="16" opacity="0.82"/>
        <path d="M211 88 L474 88" stroke="${color("upward_facing")}" stroke-width="16" opacity="0.82"/>
        <path d="M583 130 L624 181" stroke="${color("streamwise_facing")}" stroke-width="16" opacity="0.82"/>
        <ellipse cx="350" cy="136" rx="235" ry="86" fill="none" stroke="${color(
          "lateral_facing"
        )}" stroke-width="8" stroke-dasharray="12 8" opacity="0.82"/>
        <g class="leaderboard-volume-region-labels">
          <text x="343" y="66" text-anchor="middle">upward-facing dominant normal</text>
          <text x="343" y="219" text-anchor="middle">downward-facing dominant normal</text>
          <text x="635" y="126">streamwise-facing</text>
          <text x="98" y="137" text-anchor="end">lateral-facing</text>
          <text x="380" y="260" text-anchor="middle">schematic orientation guide; bins follow each polygon's outward area vector</text>
        </g>
      </svg>
      <div class="leaderboard-regional-zone-list">${rules.map(regionalGuideCard).join("")}</div>
    </div>`;
  }

  function hiLiftRegionalSurfaceGuide(rules) {
    const byId = new Map(rules.map((rule, index) => [rule.region_id, { rule, index }]));
    const color = (regionId) => regionalPalette[(byId.get(regionId)?.index || 0) % regionalPalette.length];
    return `<div class="leaderboard-hilift-region-guide">
      <svg viewBox="0 0 760 300" role="img" aria-label="HiLiftAeroML surface region envelopes in a schematic normalized x-y plan view">
        <rect x="76" y="24" width="648" height="226" rx="8" fill="${color("fuselage_tail_and_remaining")}17" stroke="${color(
          "fuselage_tail_and_remaining"
        )}" stroke-width="1.5"/>
        <rect x="173" y="37" width="467" height="123" fill="${color("outboard_high_lift_envelope_proxy")}3d" stroke="${color(
          "outboard_high_lift_envelope_proxy"
        )}" stroke-width="1.5"/>
        <rect x="173" y="160" width="467" height="55" fill="${color("inboard_high_lift_envelope_proxy")}3d" stroke="${color(
          "inboard_high_lift_envelope_proxy"
        )}" stroke-width="1.5"/>
        <rect x="141" y="145" width="292" height="40" fill="${color("nacelle_installation_envelope_proxy")}59" stroke="${color(
          "nacelle_installation_envelope_proxy"
        )}" stroke-width="2"/>
        <g class="leaderboard-volume-region-labels">
          <text x="407" y="96" text-anchor="middle">outboard high-lift envelope</text>
          <text x="515" y="194" text-anchor="middle">inboard envelope</text>
          <text x="287" y="170" text-anchor="middle">nacelle / installation</text>
          <text x="88" y="48">remaining surface</text>
          <text x="400" y="270" text-anchor="middle">schematic plan view; each envelope also applies its released z bounds</text>
        </g>
        <g class="leaderboard-volume-region-axis">
          <line x1="76" y1="258" x2="724" y2="258"/><text x="400" y="292" text-anchor="middle">normalized longitudinal x →</text>
          <line x1="66" y1="250" x2="66" y2="24"/><text x="54" y="137" text-anchor="middle" transform="rotate(-90 54 137)">normalized spanwise y →</text>
        </g>
      </svg>
      <div class="leaderboard-regional-zone-list">${rules.map(regionalGuideCard).join("")}</div>
    </div>`;
  }

  function hiLiftRegionalVolumeGuide(rules) {
    const byId = new Map(rules.map((rule, index) => [rule.region_id, { rule, index }]));
    const color = (regionId) => regionalPalette[(byId.get(regionId)?.index || 0) % regionalPalette.length];
    return `<div class="leaderboard-hilift-region-guide">
      <svg viewBox="0 0 760 300" role="img" aria-label="HiLiftAeroML volume regions in a schematic normalized x-z projection">
        <rect x="76" y="24" width="648" height="226" rx="8" fill="${color("farfield_and_remaining")}17" stroke="${color(
          "farfield_and_remaining"
        )}" stroke-width="1.5"/>
        <rect x="108" y="37" width="583" height="200" fill="${color("near_aircraft_flow_envelope")}2e" stroke="${color(
          "near_aircraft_flow_envelope"
        )}" stroke-width="1.5"/>
        <rect x="487" y="99" width="204" height="75" fill="${color("aft_airframe_wake_envelope_proxy")}42" stroke="${color(
          "aft_airframe_wake_envelope_proxy"
        )}" stroke-width="1.5"/>
        <path d="M225 139 C265 112 365 108 468 127 C491 131 504 137 516 141 C489 146 465 151 431 153 C350 158 276 155 225 139 Z" fill="none" stroke="${color(
          "near_airframe_sdf_band"
        )}" stroke-width="13" stroke-linejoin="round" opacity="0.88"/>
        <g class="leaderboard-volume-region-labels">
          <text x="400" y="61" text-anchor="middle">near-aircraft flow envelope</text>
          <text x="589" y="139" text-anchor="middle">aft wake envelope</text>
          <text x="360" y="184" text-anchor="middle">near-airframe |SDF| band</text>
          <text x="88" y="48">farfield / remaining</text>
          <text x="400" y="270" text-anchor="middle">schematic x-z projection; released y bounds are listed below</text>
        </g>
        <g class="leaderboard-volume-region-axis">
          <line x1="76" y1="258" x2="724" y2="258"/><text x="400" y="292" text-anchor="middle">normalized longitudinal x →</text>
          <line x1="66" y1="250" x2="66" y2="24"/><text x="54" y="137" text-anchor="middle" transform="rotate(-90 54 137)">normalized vertical z →</text>
        </g>
      </svg>
      <div class="leaderboard-regional-zone-list">${rules.map(regionalGuideCard).join("")}</div>
    </div>`;
  }

  function renderRegionalGuide(report, field) {
    const rules = regionalRules(report, field);
    const definition = regionalDefinition(report, field);
    const guides = {
      hilift_surface: hiLiftRegionalSurfaceGuide,
      hilift_volume: hiLiftRegionalVolumeGuide,
      ahmed_surface: ahmedRegionalSurfaceGuide,
      ahmed_volume: ahmedRegionalVolumeGuide,
    };
    const guide = guides[definition.guide] || (field.domain === "surface" ? regionalSurfaceGuide : regionalVolumeGuide);
    element("regional-zone-guide").innerHTML = guide(rules);
    element("regional-zone-note").textContent =
      definition.semanticLimit || definition.semantic_limit || "Released geometric regions are mutually exclusive and exhaustive.";
  }

  function setRegionalActionAvailability(enabled) {
    document.querySelectorAll('[data-figure-key="regional"], [data-copy-caption="regional"]').forEach((button) => {
      button.disabled = !enabled;
    });
  }

  function clearRegionalExplorer(message) {
    destroyChart("regional");
    state.figureSpecs.delete("regional");
    state.figureCaptions.delete("regional");
    const canvas = element("regional-chart");
    if (canvas) canvas.hidden = true;
    element("regional-status").textContent = message;
    element("regional-zone-guide").innerHTML = `<div class="leaderboard-regional-empty">${escapeHtml(message)}</div>`;
    element("regional-zone-note").textContent = "";
    element("regional-figure-caption").textContent = "";
    element("regional-data-table").replaceChildren();
    setChartSummary("regional-chart-summary", message);
    setRegionalActionAvailability(false);
  }

  function renderRegionalChart(documents, field, weighting) {
    const canvas = element("regional-chart");
    if (!canvas || typeof Chart === "undefined") return;
    const rules = regionalRules(documents[0].report, field);
    const labels = rules.map((rule) => regionalLabel(rule.region_id));
    const wholeSupportPrimary = regionalUsesWholeSupportMetric(field);
    const primaryLabel = wholeSupportPrimary ? "Equal-case whole-volume-normalized regional RMSE (%)" : "Regional relative L² error (%)";
    const primaryCaption = wholeSupportPrimary
      ? "equal-case mean regional RMSE normalized by each case's whole-volume truth RMS"
      : "regional relative L² error";
    const caseDistributionMetric = wholeSupportPrimary ? "whole_support_normalized_rmse_percent" : "relative_l2_percent";
    const values = documents.flatMap(({ row, report }) => {
      const fieldReport = regionalFieldReport(report, field);
      return (fieldReport?.regions || []).map((region) => ({
        model: rowLabel(row),
        submission_id: row.id,
        scope: regionalScope(row),
        region_id: region.region_id,
        region: regionalLabel(region.region_id),
        primary_metric_percent: regionalPrimaryMetricValue(region, weighting, field),
        pooled_whole_support_normalized_rmse_percent: finiteNumber(regionalPooled(region, weighting)?.whole_support_normalized_rmse_percent),
        relative_l2_percent: finiteNumber(regionalPooled(region, weighting)?.relative_l2_percent),
        regional_r2: finiteNumber(regionalPooled(region, weighting)?.r2),
        entity_share_percent: regionalEntityShare(region),
        weight_share_percent: regionalWeightShare(region, weighting),
        error_share_percent: regionalErrorShare(region, weighting),
        macro_case_relative_l2_percent: regionalCaseMacro(region, weighting, "relative_l2_percent"),
        median_case_primary_metric_percent: regionalCaseStatistic(region, weighting, "median", caseDistributionMetric),
        p90_case_primary_metric_percent: regionalCaseStatistic(region, weighting, "p90", caseDistributionMetric),
      }));
    });
    const datasets = documents.map(({ row, report }, index) => {
      const byRegion = new Map((regionalFieldReport(report, field)?.regions || []).map((region) => [region.region_id, region]));
      const regionalValues = rules.map((rule) => byRegion.get(rule.region_id));
      return {
        label: rowLabel(row),
        data: regionalValues.map((region) => regionalPrimaryMetricValue(region, weighting, field)),
        regionalValues,
        backgroundColor: `${palette[index % palette.length]}cc`,
        borderColor: palette[index % palette.length],
        borderWidth: 1,
        borderRadius: 3,
      };
    });
    destroyChart("regional");
    canvas.hidden = false;
    canvas.setAttribute("aria-label", `${field.label} ${primaryCaption} in released native geometric regions`);
    state.charts.regional = new Chart(canvas, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { ticks: { color: chartTextColor(), maxRotation: 25, minRotation: 0 }, grid: { display: false } },
          y: {
            beginAtZero: true,
            title: { display: true, text: primaryLabel, color: chartTextColor() },
            ticks: { color: chartTextColor() },
            grid: { color: chartGridColor() },
          },
        },
        plugins: {
          legend: { labels: { color: chartTextColor() } },
          tooltip: {
            callbacks: {
              label(context) {
                const region = context.dataset.regionalValues?.[context.dataIndex];
                const lines = [`${context.dataset.label}: ${regionalNumber(context.raw)}`];
                if (wholeSupportPrimary) {
                  lines.push(
                    `Pooled whole-volume-normalized RMSE: ${regionalNumber(
                      regionalPooled(region, weighting)?.whole_support_normalized_rmse_percent
                    )}`,
                    `Pooled local relative L²: ${regionalNumber(regionalPooled(region, weighting)?.relative_l2_percent)}`,
                    `Pooled regional R²: ${regionalScalarNumber(regionalPooled(region, weighting)?.r2)}`
                  );
                }
                lines.push(
                  `Field squared-error share: ${regionalNumber(regionalErrorShare(region, weighting))}`,
                  `Native-entity share: ${regionalNumber(regionalEntityShare(region))}`
                );
                return lines;
              },
            },
          },
        },
      },
    });
    const weightingLabel = regionalWeightingLabel(weighting, field);
    const normalizationNote = wholeSupportPrimary
      ? " Each case uses its complete volume truth RMS as the denominator; pooled local relative L2 and regional R2 remain available in the tooltip and numeric table."
      : "";
    const caption = `${state.dataset}, ${state.split}: ${field.label} ${primaryCaption} for ${
      documents.length
    } explicitly selected compatible result${documents.length === 1 ? "" : "s"}, using ${weightingLabel}. The ${
      rules.length
    } released geometric regions are mutually exclusive and exhaustive.${normalizationNote} Regional diagnostics have zero official scoring weight and do not change the official field or overall score. ${releaseStamp()}.`;
    setChartSummary(
      "regional-chart-summary",
      `${field.label} ${primaryCaption} bar chart for ${state.dataset}, ${state.split}; ${documents.length} selected compatible submissions across ${rules.length} exhaustive regions. ${weightingLabel}; lower is better. Regional diagnostics have zero official scoring weight.`
    );
    setFigureCaption("regional", caption, caption);
    state.figureSpecs.set("regional", {
      ...figureSpecBase(`${state.dataset}: ${field.label} regional error`, values),
      mark: { type: "bar", tooltip: true },
      encoding: {
        x: { field: "region", type: "nominal", sort: labels, title: "Released geometric region" },
        y: { field: "primary_metric_percent", type: "quantitative", title: primaryLabel, scale: { zero: true } },
        color: { field: "model", type: "nominal", legend: { title: "Model", labelLimit: 260 } },
        tooltip: [
          { field: "model", type: "nominal", title: "Model" },
          { field: "submission_id", type: "nominal", title: "Submission ID" },
          { field: "scope", type: "nominal", title: "Prediction scope" },
          { field: "region", type: "nominal", title: "Region" },
          { field: "primary_metric_percent", type: "quantitative", title: primaryLabel },
          { field: "pooled_whole_support_normalized_rmse_percent", type: "quantitative", title: "Pooled whole-support-normalized RMSE (%)" },
          { field: "relative_l2_percent", type: "quantitative", title: "Pooled local relative L2 (%)" },
          { field: "regional_r2", type: "quantitative", title: "Pooled regional R2" },
          { field: "entity_share_percent", type: "quantitative", title: "Native-entity share (%)" },
          { field: "weight_share_percent", type: "quantitative", title: "Field-weight share (%)" },
          { field: "error_share_percent", type: "quantitative", title: "Share of field squared error (%)" },
        ],
      },
    });
    const columns = [
      { label: "Model", value: "model" },
      { label: "Submission ID", value: "submission_id" },
      { label: "Prediction scope", value: "scope" },
      { label: "Region", value: "region" },
    ];
    if (wholeSupportPrimary) {
      columns.push(
        { label: "Equal-case whole-volume NRMSE (%)", value: (value) => regionalNumber(value.primary_metric_percent) },
        { label: "Pooled whole-volume NRMSE (%)", value: (value) => regionalNumber(value.pooled_whole_support_normalized_rmse_percent) },
        { label: "Pooled local rel. L2 (%)", value: (value) => regionalNumber(value.relative_l2_percent) },
        { label: "Pooled regional R2", value: (value) => regionalScalarNumber(value.regional_r2) }
      );
    } else {
      columns.push({ label: "Regional rel. L2 (%)", value: (value) => regionalNumber(value.relative_l2_percent) });
      if (values.some((value) => value.regional_r2 !== null)) {
        columns.push({ label: "Regional R2", value: (value) => regionalScalarNumber(value.regional_r2) });
      }
    }
    columns.push(
      { label: "Native-entity share (%)", value: (value) => regionalNumber(value.entity_share_percent) },
      { label: "Field-weight share (%)", value: (value) => regionalNumber(value.weight_share_percent) },
      { label: "Field error share (%)", value: (value) => regionalNumber(value.error_share_percent) }
    );
    if (values.some((value) => value.median_case_primary_metric_percent !== null)) {
      columns.push(
        {
          label: wholeSupportPrimary ? "Median case whole-volume NRMSE (%)" : "Median case rel. L2 (%)",
          value: (value) => regionalNumber(value.median_case_primary_metric_percent),
        },
        {
          label: wholeSupportPrimary ? "P90 case whole-volume NRMSE (%)" : "P90 case rel. L2 (%)",
          value: (value) => regionalNumber(value.p90_case_primary_metric_percent),
        }
      );
    }
    renderNumericTable(
      "regional-data-table",
      `${field.label} regional diagnostics. All values are report-only and have zero official scoring weight.`,
      columns,
      values
    );
    setRegionalActionAvailability(true);
  }

  async function prepareRegionalExplorer() {
    const version = ++state.regionalLoadVersion;
    const datasetDefinition = regionalDatasetDefinition();
    if (!datasetDefinition) {
      clearRegionalExplorer("Regional native-field diagnostics are currently available for DrivAerML, HiLiftAeroML, and AhmedML.");
      return;
    }
    const field = configureRegionalFieldSelection() || regionalFieldDefinition();
    if (!field) {
      clearRegionalExplorer("This dataset does not define any regional fields.");
      return;
    }
    const selected = figureRows();
    const declared = selected.filter((row) => regionalBinding(row));
    if (!declared.length) {
      clearRegionalExplorer(
        selected.length
          ? "The selected results predate the checksum-bound regional report. Scores and profile figures remain available."
          : "Choose one or more models above to inspect their regional field diagnostics."
      );
      return;
    }
    element("regional-status").textContent = "Loading checksum-bound regional diagnostics…";
    const loaded = await Promise.all(
      declared.map(async (row) => {
        try {
          return { row, report: await ensureRegionalReport(row), error: null };
        } catch (error) {
          return { row, report: null, error };
        }
      })
    );
    if (version !== state.regionalLoadVersion) return;
    const compatible = loaded.filter(({ report }) => regionalFieldReport(report, field));
    if (!compatible.length) {
      const volume = field.domain === "volume";
      clearRegionalExplorer(
        volume
          ? "None of the selected checksum-verified reports contains this volume field. Surface-only results deliberately have no volume diagnostics."
          : `No selected regional report contains ${field.label.toLowerCase()}.`
      );
      return;
    }
    const firstFieldReport = regionalFieldReport(compatible[0].report, field);
    configureRegionalWeighting(firstFieldReport, field);
    const weighting = regionalWeighting(firstFieldReport, field);
    const weightingLabel = regionalWeightingLabel(weighting, field);
    renderRegionalGuide(compatible[0].report, field);
    renderRegionalChart(compatible, field, weighting);
    const unsupported = loaded.filter(({ report }) => report && !regionalFieldReport(report, field)).length;
    const failed = loaded.filter(({ error }) => error).length;
    element("regional-status").textContent = [
      `${compatible.length} checksum-verified result${compatible.length === 1 ? "" : "s"} shown using ${weightingLabel}.`,
      unsupported ? `${unsupported} selected result${unsupported === 1 ? "" : "s"} omitted because this field was not submitted.` : "",
      failed ? `${failed} report${failed === 1 ? "" : "s"} failed checksum or contract verification.` : "",
      "Regional values have zero official scoring weight.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function panelSelection(panel) {
    const key = `${state.dataset}:${panel.id}`;
    if (!state.panelSelections.has(key)) {
      const family = profileFamilies(panel)[0];
      state.panelSelections.set(key, {
        family: family?.id || "",
        quantity: panel.quantities?.[0]?.id || "",
        station: profileStations(panel, family)?.[0]?.id || "",
        coordinateView: defaultProfileCoordinateView(panel),
      });
    }
    return state.panelSelections.get(key);
  }

  function profileCaseSelects() {
    return document.querySelectorAll("[data-profile-case-select]");
  }

  function syncProfileCaseSelects() {
    const options = state.profileCaseIds.map((caseId) => ({ value: caseId, label: caseId }));
    profileCaseSelects().forEach((select) => {
      populateSelect(select, options, state.profileCase);
      select.disabled = options.length === 0;
    });
  }

  function setProfileStatus(message) {
    (activeDataset()?.diagnostic_panels || []).forEach((_, index) => {
      const status = element(`profile-${index}-status`);
      if (!status) return;
      status.hidden = !message;
      status.textContent = message;
    });
  }

  function renderPanelControls(index) {
    const panel = activeDataset()?.diagnostic_panels?.[index];
    const section = document.querySelector(`[data-profile-panel="${index}"]`);
    if (!panel) {
      if (section) section.hidden = true;
      return;
    }
    if (section) section.hidden = false;
    element(`profile-${index}-title`).textContent = panel.title;
    const selection = panelSelection(panel);
    const families = profileFamilies(panel);
    const family = families.find((candidate) => candidate.id === selection.family) || families[0];
    selection.family = family?.id || "";
    const hasPlaceholderStations = (panel.stations || []).some((station) => station.id.startsWith("prototype_"));
    let panelDescription = hasPlaceholderStations
      ? `${panel.description} These stations are illustrative placeholders, not official dataset locations.`
      : panel.description;
    if (activeDatasetSlug() === "drivaerml" && panel.id === "velocity_profiles") {
      panelDescription =
        family?.placementMode === "relative"
          ? "Sixteen geometry-relative native-profile locations on retained normalized-arc-length support; diagnostic and not scored."
          : "Sixteen fixed AutoCFD5 native-profile locations on pinned physical-distance support; the current primary/candidate placement view.";
    } else if (activeDatasetSlug() === "drivaerml" && panel.id === "pressure_profiles") {
      panelDescription =
        family?.placementMode === "relative"
          ? "Two centreline aliases plus two materialized geometry-relative Cp cuts on retained native support; diagnostic and not scored."
          : "Four continuous native-surface Cp cuts on pinned producer support; the 209 discrete AutoCFD taps are excluded.";
    }
    element(`profile-${index}-description`).textContent = panelDescription;
    const familyTabs = element(`profile-${index}-families`);
    if (familyTabs) {
      familyTabs.hidden = families.length <= 1;
      familyTabs.replaceChildren();
      families.forEach((candidate) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "profile-family-tab";
        button.dataset.profileFamily = candidate.id;
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", String(candidate.id === selection.family));
        button.textContent = candidate.label;
        button.title = candidate.description;
        familyTabs.appendChild(button);
      });
    }
    const familyNotice = element(`profile-${index}-family-notice`);
    if (familyNotice) {
      familyNotice.hidden = !family?.description;
      familyNotice.textContent = family?.description || "";
    }
    selection.quantity = populateSelect(
      element(`profile-${index}-quantity`),
      (panel.quantities || []).map((quantity) => ({ value: quantity.id, label: quantity.label })),
      selection.quantity
    );
    selection.station = populateSelect(
      element(`profile-${index}-station`),
      profileStations(panel, family).map((station) => {
        const isPlaceholder = station.id.startsWith("prototype_");
        return {
          value: station.id,
          label: isPlaceholder ? `Illustrative: ${station.label}` : station.label,
          title: isPlaceholder ? `${station.description} This is not an official dataset station.` : station.description,
        };
      }),
      selection.station
    );
    selection.coordinateView = populateSelect(
      element(`profile-${index}-coordinate`),
      profileCoordinateViews(panel).map((view) => ({ value: view.id, label: view.label })),
      selection.coordinateView || defaultProfileCoordinateView(panel)
    );
    const quantityControl = element(`profile-${index}-quantity`)?.closest(".chart-control");
    if (quantityControl) quantityControl.hidden = (panel.quantities || []).length <= 1;
    const coordinateControl = element(`profile-${index}-coordinate`)?.closest(".chart-control");
    if (coordinateControl) coordinateControl.hidden = !isDrivaermlCpPanel(panel);
    syncProfileCaseSelects();
  }

  function profilePanelElement(panel, index) {
    const section = document.createElement("section");
    section.className = "leaderboard-panel profile-panel";
    section.dataset.profilePanel = index;
    section.innerHTML = `
      <div class="leaderboard-panel-heading">
        <div>
          <h3 id="profile-${index}-title"></h3>
          <details class="ux-chart-notes"><summary>About these profiles</summary><p id="profile-${index}-description"></p></details>
        </div>
        <div class="chart-control-row">
          <div class="chart-control profile-case-control">
            <label class="chart-control-title" for="profile-${index}-case">Test case</label>
            <select id="profile-${index}-case" data-profile-case-select disabled></select>
          </div>
          <div class="chart-control">
            <label class="chart-control-title" for="profile-${index}-quantity">Quantity</label>
            <select id="profile-${index}-quantity"></select>
          </div>
          <div class="chart-control">
            <label class="chart-control-title" for="profile-${index}-station">Station</label>
            <select id="profile-${index}-station"></select>
          </div>
          <div class="chart-control profile-coordinate-control">
            <label class="chart-control-title" for="profile-${index}-coordinate">Horizontal coordinate</label>
            <select id="profile-${index}-coordinate"></select>
          </div>
        </div>
      </div>
      <div id="profile-${index}-families" class="profile-family-tabs" role="tablist" aria-label="Profile support family"></div>
      <p id="profile-${index}-family-notice" class="profile-family-notice"></p>
      <div class="leaderboard-figure-toolbar" role="group" aria-label="${escapeHtml(panel.title)} figure and data actions">
        <button class="leaderboard-action-button" type="button" data-figure-key="profile-${index}" data-figure-format="svg" disabled>SVG</button>
        <button class="leaderboard-action-button" type="button" data-figure-key="profile-${index}" data-figure-format="png" disabled>High-res PNG</button>
        <button class="leaderboard-action-button" type="button" data-figure-key="profile-${index}" data-figure-format="print" disabled>Print / save PDF</button>
        <button class="leaderboard-action-button" type="button" data-profile-data-index="${index}" data-profile-data-format="csv" disabled>Plot data CSV</button>
        <button class="leaderboard-action-button" type="button" data-profile-data-index="${index}" data-profile-data-format="json" disabled>Plot data JSON</button>
        <button class="leaderboard-action-button" type="button" data-copy-caption="profile-${index}" disabled>Copy caption</button>
      </div>
      <div class="chart-frame">
        <p id="profile-${index}-status" class="profile-chart-status" role="status">Loading profile data...</p>
        <canvas id="profile-${index}-chart" role="img" aria-label="${escapeHtml(
          panel.title
        )}" aria-describedby="profile-${index}-chart-summary profile-${index}-figure-caption"></canvas>
        <p id="profile-${index}-chart-summary" class="leaderboard-sr-only"></p>
      </div>
      <p id="profile-${index}-figure-caption" class="leaderboard-figure-caption"></p>
      <details class="leaderboard-numeric-data">
        <summary>View numeric figure data</summary>
        <div id="profile-${index}-data-table" class="leaderboard-data-table-wrap"></div>
      </details>`;
    return section;
  }

  function renderDiagnosticPanels() {
    Object.keys(state.charts)
      .filter((key) => key.startsWith("profile-"))
      .forEach(destroyChart);
    const container = element("leaderboard-profile-panels");
    if (!container) return;
    container.replaceChildren();
    const panels = activeDataset()?.diagnostic_panels || [];
    panels.forEach((panel, index) => {
      container.appendChild(profilePanelElement(panel, index));
      renderPanelControls(index);
      element(`profile-${index}-quantity`)?.addEventListener("change", (event) => {
        panelSelection(panel).quantity = event.target.value;
        renderProfileChart(index);
        updateUrl();
      });
      element(`profile-${index}-station`)?.addEventListener("change", (event) => {
        panelSelection(panel).station = event.target.value;
        renderProfileChart(index);
        updateUrl();
      });
      element(`profile-${index}-coordinate`)?.addEventListener("change", (event) => {
        panelSelection(panel).coordinateView = event.target.value;
        renderProfileChart(index);
        updateUrl();
      });
      element(`profile-${index}-families`)?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-profile-family]");
        if (!button) return;
        const family = profileFamilies(panel).find((candidate) => candidate.id === button.dataset.profileFamily);
        if (!family) return;
        const selection = panelSelection(panel);
        selection.family = family.id;
        selection.station = family.stations?.[0]?.id || "";
        renderPanelControls(index);
        renderProfileChart(index);
        updateUrl();
      });
    });
    syncDatasetSelects();
    syncSplitSelects();
    syncProfileCaseSelects();
    syncProfileActionAvailability();
  }

  function arraysExactlyEqual(left, right) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => value === right[index]);
  }

  function exactProfileArrayInventory(arrays, expected, label) {
    const observed = Array.from(arrays.keys());
    if (!arraysExactlyEqual(observed, expected)) {
      throw new Error(`${label} NumPy array inventory or order differs from its contract`);
    }
  }

  function requiredProfileArray(arrays, name, dtype, label) {
    const array = arrays.get(name);
    if (!array || array.dtype !== dtype || !Array.isArray(array.values)) {
      throw new Error(`${label}/${name} must be a one-dimensional ${dtype} NumPy array`);
    }
    return array.values;
  }

  function decodeHiLiftVelocityStorage(stored, expectedCount, label) {
    if (!Array.isArray(stored) || !Number.isSafeInteger(expectedCount) || expectedCount < 1 || stored.length !== expectedCount * 4) {
      throw new Error(`${label} compact velocity storage length differs from its contract`);
    }
    const buffer = new ArrayBuffer(expectedCount * 4);
    const view = new DataView(buffer);
    let word = 0;
    for (let index = 0; index < expectedCount; index += 1) {
      const delta =
        (stored[index] |
          (stored[expectedCount + index] << 8) |
          (stored[2 * expectedCount + index] << 16) |
          (stored[3 * expectedCount + index] << 24)) >>>
        0;
      word = (word + delta) >>> 0;
      view.setUint32(index * 4, word, true);
    }
    return Array.from({ length: expectedCount }, (_unused, index) => view.getFloat32(index * 4, true));
  }

  function verifiedProfileArtifactUrl(profileCase, artifact, label) {
    if (
      artifact?.format !== "numpy-npz-v1" ||
      typeof artifact?.file !== "string" ||
      !/^artifacts\/[A-Za-z0-9_.\/-]+\.npz$/.test(artifact.file) ||
      artifact.file.includes("..") ||
      !validSha256(artifact?.sha256) ||
      !Number.isSafeInteger(artifact?.byte_size) ||
      artifact.byte_size < 1
    ) {
      throw new Error(`${label} has an invalid checksum-bound NPZ declaration`);
    }
    const base = new URL(profileCase?._fluidsbenchArtifactBaseUrl);
    const url = new URL(artifact.file, base);
    if (url.origin !== base.origin || !url.href.startsWith(base.href)) {
      throw new Error(`${label} artifact path escapes its declared repository root`);
    }
    return url.href;
  }

  function requireHiLiftMetadataMatch(truthCase, predictionCase, sectionName, fields, label) {
    const truth = truthCase?.[sectionName] || {};
    const prediction = predictionCase?.[sectionName] || {};
    fields.forEach((field) => {
      const left = truth[field];
      const right = prediction[field];
      const equal = Array.isArray(left) ? arraysExactlyEqual(left, right) : left === right;
      if (!equal) throw new Error(`${label} ${sectionName}.${field} differs from public compact Native CFD support`);
    });
  }

  function hiLiftSeriesBase({ panelId, stationId, familyId, placementMode, quantityId, coordinateId, supportIdentity, predictionOrder }) {
    return {
      panel_id: panelId,
      station_id: stationId,
      family_id: familyId,
      placement_mode: placementMode,
      quantity_id: quantityId,
      representation: "materialized",
      scoring_role: "diagnostic_profile",
      coordinate_id: coordinateId,
      coordinate_unit: "in",
      support_identity_sha256: supportIdentity,
      prediction_order_sha256: predictionOrder,
    };
  }

  function buildHiLiftCompactSeries(support, cpValues, velocityValues, valueField) {
    const series = [];
    for (let rowCode = 0; rowCode < hiLiftCpStationIds.length; rowCode += 1) {
      const coordinate = [];
      const values = [];
      const sampleIndex = [];
      const segments = [];
      for (let branch = 0; branch < support.cpRows.length; branch += 1) {
        if (support.cpRows[branch] !== rowCode) continue;
        const sourceStart = support.cpOffsets[branch];
        const sourceStop = support.cpOffsets[branch + 1];
        const emittedStart = coordinate.length;
        for (let sourceIndex = sourceStart; sourceIndex < sourceStop; sourceIndex += 1) {
          coordinate.push(support.cpX[sourceIndex]);
          values.push(cpValues[sourceIndex]);
          sampleIndex.push(sourceIndex);
        }
        segments.push({
          emitted_index_start: emittedStart,
          emitted_index_stop: coordinate.length,
          segment_id: `row-${String.fromCharCode(65 + rowCode)}-branch-${branch}`,
        });
      }
      series.push({
        ...hiLiftSeriesBase({
          panelId: "pressure_profiles",
          stationId: hiLiftCpStationIds[rowCode],
          familyId: "hiliftaeroml_cp_compact_v2",
          placementMode: "fixed_hlpw5_rows",
          quantityId: "cp",
          coordinateId: "streamwise_x_in",
          supportIdentity: support.cpSupportIdentity,
          predictionOrder: support.cpPredictionOrder,
        }),
        coordinate,
        [valueField]: values,
        sample_index: sampleIndex,
        segments,
        unsupported_sample_count: 0,
      });
    }

    const denseVelocity = new Array(support.velocityMask.length).fill(null);
    let velocityCursor = 0;
    support.velocityMask.forEach((valid, index) => {
      if (valid) {
        denseVelocity[index] = velocityValues[velocityCursor];
        velocityCursor += 1;
      }
    });
    if (velocityCursor !== velocityValues.length) throw new Error("compact HiLift velocity values do not exhaust the shared validity mask");
    hiLiftVelocityStations.forEach(([, stationId], stationIndex) => {
      const sourceStart = support.velocityOffsets[stationIndex];
      const sourceStop = support.velocityOffsets[stationIndex + 1];
      const coordinate = [];
      const values = [];
      const sampleIndex = [];
      const segments = [];
      let activeSegmentStart = null;
      let run = 0;
      for (let sourceIndex = sourceStart; sourceIndex < sourceStop; sourceIndex += 1) {
        if (!support.velocityMask[sourceIndex]) {
          if (activeSegmentStart !== null) {
            segments.push({
              emitted_index_start: activeSegmentStart,
              emitted_index_stop: coordinate.length,
              segment_id: `${stationId}-valid-run-${run}`,
            });
            activeSegmentStart = null;
            run += 1;
          }
          continue;
        }
        if (activeSegmentStart === null) activeSegmentStart = coordinate.length;
        coordinate.push(support.velocityCoordinate[sourceIndex]);
        values.push(denseVelocity[sourceIndex]);
        sampleIndex.push(sourceIndex);
      }
      if (activeSegmentStart !== null) {
        segments.push({
          emitted_index_start: activeSegmentStart,
          emitted_index_stop: coordinate.length,
          segment_id: `${stationId}-valid-run-${run}`,
        });
      }
      series.push({
        ...hiLiftSeriesBase({
          panelId: "velocity_profiles",
          stationId,
          familyId: "hiliftaeroml_velocity_compact_v2",
          placementMode: "fixed_hlpw5_stations",
          quantityId: "velocity_ratio",
          coordinateId: "z_minus_surface_z_in",
          supportIdentity: support.velocitySupportIdentity,
          predictionOrder: support.velocityPredictionOrder,
        }),
        coordinate,
        [valueField]: values,
        sample_index: sampleIndex,
        segments,
        unsupported_sample_count: sourceStop - sourceStart - coordinate.length,
      });
    });
    return series;
  }

  function validateHiLiftPlotSupport(caseArrays, commonArrays, profileCase, label) {
    exactProfileArrayInventory(
      caseArrays,
      ["cp_x_in", "cp_truth", "cp_branch_point_offsets", "cp_branch_row_code", "velocity_truth_speed_over_u_inf"],
      label
    );
    exactProfileArrayInventory(commonArrays, ["velocity_coordinate_in", "velocity_valid_mask", "velocity_station_row_offsets"], label);
    const cpX = requiredProfileArray(caseArrays, "cp_x_in", "<f4", label);
    const cpTruth = requiredProfileArray(caseArrays, "cp_truth", "<f4", label);
    const cpOffsets = requiredProfileArray(caseArrays, "cp_branch_point_offsets", "<i4", label);
    const cpRows = requiredProfileArray(caseArrays, "cp_branch_row_code", "|u1", label);
    const velocityTruth = requiredProfileArray(caseArrays, "velocity_truth_speed_over_u_inf", "<f4", label);
    const velocityCoordinate = requiredProfileArray(commonArrays, "velocity_coordinate_in", "<f4", label);
    const velocityMask = requiredProfileArray(commonArrays, "velocity_valid_mask", "|b1", label);
    const velocityOffsets = requiredProfileArray(commonArrays, "velocity_station_row_offsets", "<i4", label);
    if (
      cpX.length !== cpTruth.length ||
      cpX.length !== profileCase?.surface_cp?.retained_point_count ||
      cpOffsets.length !== cpRows.length + 1 ||
      cpRows.length !== profileCase?.surface_cp?.retained_branch_count ||
      cpOffsets[0] !== 0 ||
      cpOffsets.at(-1) !== cpX.length ||
      cpOffsets.some((value, index) => index && value <= cpOffsets[index - 1]) ||
      cpRows.some((value) => !Number.isInteger(value) || value < 0 || value > 9) ||
      new Set(cpRows).size !== 10 ||
      cpX.some((value) => !Number.isFinite(value)) ||
      cpTruth.some((value) => !Number.isFinite(value))
    ) {
      throw new Error(`${label} Cp plotting arrays have invalid shape, coverage, order, or values`);
    }
    const expectedVelocityOffsets = [0, 801, 1602, 2403, 3204, 4005];
    const validVelocityCount = velocityMask.filter(Boolean).length;
    if (
      velocityCoordinate.length !== 4005 ||
      velocityMask.length !== 4005 ||
      !arraysExactlyEqual(velocityOffsets, expectedVelocityOffsets) ||
      velocityTruth.length !== validVelocityCount ||
      validVelocityCount !== profileCase?.volume_velocity?.valid_row_count ||
      velocityCoordinate.some((value) => !Number.isFinite(value)) ||
      velocityTruth.some((value) => !Number.isFinite(value) || value < 0)
    ) {
      throw new Error(`${label} velocity plotting arrays have invalid shape, gaps, order, or values`);
    }
    return {
      cpX,
      cpTruth,
      cpOffsets,
      cpRows,
      cpSupportIdentity: profileCase.surface_cp.support_identity_sha256,
      cpPredictionOrder: profileCase.surface_cp.prediction_order_sha256,
      velocityCoordinate,
      velocityMask,
      velocityOffsets,
      velocityTruth,
      velocitySupportIdentity: profileCase.volume_velocity.support_identity_sha256,
      velocityPredictionOrder: profileCase.volume_velocity.prediction_order_sha256,
    };
  }

  async function materializeHiLiftCompactTruth(profileCase, label) {
    if (!profileCase?._fluidsbenchHiLiftCompactTruth) return profileCase;
    if (
      profileCase?.truth_source?.source_kind !== "native_cfd" ||
      profileCase?.truth_source?.analytical_dummy !== false ||
      profileCase?.truth_source?.role !== "plot_only_not_scoring_source" ||
      !validSha256(profileCase?.surface_cp?.support_identity_sha256) ||
      !validSha256(profileCase?.surface_cp?.prediction_order_sha256) ||
      !validSha256(profileCase?.volume_velocity?.support_identity_sha256) ||
      !validSha256(profileCase?.volume_velocity?.prediction_order_sha256)
    ) {
      throw new Error(`${label} lacks its exact compact Native CFD truth and support declaration`);
    }
    const artifactUrl = verifiedProfileArtifactUrl(profileCase, profileCase.artifact, label);
    const common = profileCase?._fluidsbenchHiLiftIndex?.common_support;
    const commonUrl = verifiedProfileArtifactUrl(profileCase, common, `${label} common velocity support`);
    const [loadedCase, loadedCommon] = await Promise.all([
      fetchVerifiedProfileNpz(artifactUrl, profileCase.artifact.sha256, label),
      fetchVerifiedProfileNpz(commonUrl, common.sha256, `${label} common velocity support`),
    ]);
    if (loadedCase.byteLength !== profileCase.artifact.byte_size || loadedCommon.byteLength !== common.byte_size) {
      throw new Error(`${label} NPZ byte size differs from its JSON binding`);
    }
    const support = validateHiLiftPlotSupport(loadedCase.arrays, loadedCommon.arrays, profileCase, label);
    const materialized = {
      ...profileCase,
      series: buildHiLiftCompactSeries(support, support.cpTruth, support.velocityTruth, "value"),
      _fluidsbenchHiLiftPlotSupport: support,
      _fluidsbenchProvenance: {
        ...profileCase._fluidsbenchProvenance,
        artifact_url: artifactUrl,
        artifact_sha256: loadedCase.sha256,
        common_support_url: commonUrl,
        common_support_sha256: loadedCommon.sha256,
      },
    };
    await bindProfileCoordinateIdentities(materialized);
    return materialized;
  }

  async function materializeHiLiftCompactPrediction(profileCase, truthCase, label) {
    if (!profileCase?._fluidsbenchHiLiftCompactPrediction) return profileCase;
    if (!truthCase?._fluidsbenchHiLiftCompactTruth || !truthCase?._fluidsbenchHiLiftPlotSupport) {
      throw new Error(`${label} cannot decode compact predictions without the verified public HiLift plot support`);
    }
    if (profileCase.case_id !== truthCase.case_id) throw new Error(`${label} case ID differs from public compact Native CFD truth`);
    requireHiLiftMetadataMatch(
      truthCase,
      profileCase,
      "surface_cp",
      [
        "support_identity_sha256",
        "prediction_order_sha256",
        "physical_graph_count",
        "retained_branch_count",
        "retained_point_count",
        "maximum_points_per_physical_graph",
        "quantization_scale",
        "quantization_dtype",
        "delta_dtype",
        "prediction_array",
      ],
      label
    );
    requireHiLiftMetadataMatch(
      truthCase,
      profileCase,
      "volume_velocity",
      [
        "support_identity_sha256",
        "prediction_order_sha256",
        "station_order",
        "station_count",
        "row_count",
        "valid_row_count",
        "invalid_row_count",
        "prediction_dtype",
        "prediction_array",
        "storage_dtype",
        "storage_encoding",
        "stored_byte_count",
      ],
      label
    );
    const artifactUrl = verifiedProfileArtifactUrl(profileCase, profileCase.artifact, label);
    const loaded = await fetchVerifiedProfileNpz(artifactUrl, profileCase.artifact.sha256, label);
    if (loaded.byteLength !== profileCase.artifact.byte_size) throw new Error(`${label} NPZ byte size differs from its JSON binding`);
    exactProfileArrayInventory(loaded.arrays, ["cp_q_delta", "velocity_speed_over_u_inf"], label);
    const deltas = requiredProfileArray(loaded.arrays, "cp_q_delta", "<i2", label);
    const storedVelocity = requiredProfileArray(loaded.arrays, "velocity_speed_over_u_inf", "|u1", label);
    if (
      profileCase.volume_velocity.storage_dtype !== "uint8" ||
      profileCase.volume_velocity.storage_encoding !== hiLiftVelocityStorageEncoding ||
      profileCase.volume_velocity.stored_byte_count !== storedVelocity.length
    ) {
      throw new Error(`${label} compact velocity storage metadata differs from its contract`);
    }
    const velocity = decodeHiLiftVelocityStorage(storedVelocity, profileCase.volume_velocity.valid_row_count, label);
    const support = truthCase._fluidsbenchHiLiftPlotSupport;
    if (deltas.length !== support.cpX.length || velocity.length !== support.velocityTruth.length) {
      throw new Error(`${label} compact prediction lengths differ from public plot support`);
    }
    const cp = new Array(deltas.length);
    for (let branch = 0; branch < support.cpOffsets.length - 1; branch += 1) {
      const start = support.cpOffsets[branch];
      const stop = support.cpOffsets[branch + 1];
      let quantized = 0;
      for (let index = start; index < stop; index += 1) {
        quantized += deltas[index];
        if (quantized < -32768 || quantized > 32767) throw new Error(`${label} delta-coded Cp reconstruction overflows int16`);
        cp[index] = quantized / 1024;
      }
    }
    if (velocity.some((value) => !Number.isFinite(value) || value < 0)) {
      throw new Error(`${label} compact velocity prediction contains non-finite or negative values`);
    }
    const materialized = {
      ...profileCase,
      series: buildHiLiftCompactSeries(support, cp, velocity, "prediction"),
      _fluidsbenchProvenance: {
        ...profileCase._fluidsbenchProvenance,
        artifact_url: artifactUrl,
        artifact_sha256: loaded.sha256,
      },
    };
    await bindProfileCoordinateIdentities(materialized);
    return materialized;
  }

  function requiredSeriesIdentity(series, field, label) {
    const value = series?.[field];
    if (!validSha256(value)) throw new Error(`${label} has an invalid ${field}`);
    return value;
  }

  function sharedSupportReference(series, label) {
    const reference = series?.shared_support_ref;
    const expectedFields = ["canonical_family_id", "canonical_station_id", "canonical_support_identity_sha256", "shared_support_id"];
    if (
      !reference ||
      typeof reference !== "object" ||
      Array.isArray(reference) ||
      JSON.stringify(Object.keys(reference).sort()) !== JSON.stringify(expectedFields)
    ) {
      throw new Error(`${label} shared alias has no canonical support reference`);
    }
    const expectedSharedSupportIds = {
      upperbody_centerline: "drivaerml-cp-upperbody-centerline-y0-v1",
      underbody_centerline: "drivaerml-cp-underbody-centerline-y0-v1",
    };
    const familyId = reference.canonical_family_id;
    const stationId = reference.canonical_station_id;
    if (
      familyId !== "drivaerml_cp_constant_v1" ||
      stationId !== series.station_id ||
      reference.shared_support_id !== expectedSharedSupportIds[stationId] ||
      !validSha256(reference.canonical_support_identity_sha256)
    ) {
      throw new Error(`${label} shared alias has an incomplete or incorrect canonical support reference`);
    }
    return { familyId, stationId, supportIdentity: reference.canonical_support_identity_sha256 };
  }

  function nativeSegmentIds(segments, sampleIndex, coordinates, label) {
    if (!Array.isArray(segments) || !segments.length) throw new Error(`${label} has no explicit segment record`);
    const expectedFields = [
      "coordinate_start",
      "coordinate_stop",
      "emitted_index_start",
      "emitted_index_stop",
      "sample_index_start",
      "sample_index_stop",
      "segment_id",
    ];
    const segmentOrdinals = new Array(sampleIndex.length);
    let emittedStop = 0;
    segments.forEach((segment, segmentOrdinal) => {
      if (
        !segment ||
        typeof segment !== "object" ||
        Array.isArray(segment) ||
        JSON.stringify(Object.keys(segment).sort()) !== JSON.stringify(expectedFields)
      ) {
        throw new Error(`${label} segment ${segmentOrdinal} does not use the exact native segment schema`);
      }
      const start = segment.emitted_index_start;
      const stop = segment.emitted_index_stop;
      if (
        typeof segment.segment_id !== "string" ||
        !segment.segment_id ||
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(stop) ||
        start !== emittedStop ||
        stop <= start ||
        stop > sampleIndex.length
      ) {
        throw new Error(`${label} segment ${segmentOrdinal} has an invalid provenance label or non-contiguous emitted range`);
      }
      if (segment.sample_index_start !== sampleIndex[start] || segment.sample_index_stop !== sampleIndex[stop - 1] + 1) {
        throw new Error(`${label} segment ${segmentOrdinal} does not bind its half-open sample-index range`);
      }
      for (let index = start + 1; index < stop; index += 1) {
        if (sampleIndex[index] !== sampleIndex[index - 1] + 1) {
          throw new Error(`${label} contains an unsupported sample gap inside segment ${segmentOrdinal}`);
        }
        if (coordinates[index] <= coordinates[index - 1]) {
          throw new Error(`${label} coordinates are not strictly ordered within segment ${segmentOrdinal}`);
        }
      }
      if (segment.coordinate_start !== coordinates[start] || segment.coordinate_stop !== coordinates[stop - 1]) {
        throw new Error(`${label} segment ${segmentOrdinal} does not bind its coordinate endpoints`);
      }
      for (let index = start; index < stop; index += 1) segmentOrdinals[index] = segmentOrdinal;
      emittedStop = stop;
    });
    if (emittedStop !== sampleIndex.length || segmentOrdinals.some((segmentOrdinal) => !Number.isSafeInteger(segmentOrdinal))) {
      throw new Error(`${label} segments do not cover every emitted point exactly once`);
    }
    return segmentOrdinals;
  }

  function validateUnsupportedSamples(unsupportedSamples, emittedSampleIndex, label) {
    if (!Array.isArray(unsupportedSamples)) throw new Error(`${label} has no explicit unsupported-sample record`);
    const emitted = new Set(emittedSampleIndex);
    let previous = -1;
    unsupportedSamples.forEach((sample, index) => {
      if (
        !sample ||
        typeof sample !== "object" ||
        Array.isArray(sample) ||
        JSON.stringify(Object.keys(sample).sort()) !== JSON.stringify(["coordinate", "reason", "sample_index"])
      ) {
        throw new Error(`${label} unsupported sample ${index} does not use the exact native unsupported-sample schema`);
      }
      if (
        !Number.isSafeInteger(sample.sample_index) ||
        sample.sample_index < 0 ||
        sample.sample_index <= previous ||
        emitted.has(sample.sample_index) ||
        typeof sample.coordinate !== "number" ||
        !Number.isFinite(sample.coordinate) ||
        typeof sample.reason !== "string" ||
        !sample.reason
      ) {
        throw new Error(`${label} unsupported sample ${index} is invalid, duplicated, unordered, or still emitted`);
      }
      previous = sample.sample_index;
    });
  }

  function nativeCpDisplayCoordinateRequired(series, nativeTruthVersion) {
    return nativeTruthVersion === 3 && series?.panel_id === "pressure_profiles" && series?.quantity_id === "cp";
  }

  function nativeProfileSeriesFields(representation, valueField = "", series = null, nativeTruthVersion = 2) {
    const common = [
      "family_id",
      "panel_id",
      "placement_mode",
      "placement_receipt_identity_sha256",
      "quantity",
      "quantity_id",
      "representation",
      "scoring_role",
      "series_identity_sha256",
      "station_id",
      "units",
    ];
    if (representation === "shared_alias") return [...common, "shared_support_ref"].sort();
    const fields = [
      ...common,
      "coordinate",
      "coordinate_id",
      "coordinate_identity_sha256",
      "coordinate_unit",
      "raw_native_cell_id",
      "sample_index",
      "segments",
      "support_identity_sha256",
      "unsupported_samples",
      valueField,
      "value_identity_sha256",
    ];
    if (nativeCpDisplayCoordinateRequired(series, nativeTruthVersion)) {
      fields.push("display_coordinate", "display_coordinate_id", "display_coordinate_identity_sha256", "display_coordinate_unit");
    }
    return fields.sort();
  }

  function requireExactNativeSeriesFields(series, representation, valueField, label, nativeTruthVersion = 2) {
    const expected = nativeProfileSeriesFields(representation, valueField, series, nativeTruthVersion);
    if (JSON.stringify(Object.keys(series || {}).sort()) !== JSON.stringify(expected)) {
      throw new Error(`${label} does not use the exact native ${representation} series schema`);
    }
    ["quantity", "units", "scoring_role"].forEach((field) => {
      if (typeof series[field] !== "string" || !series[field]) throw new Error(`${label} has no ${field}`);
    });
  }

  function submittedProfileSeriesFields(representation) {
    const common = [
      "family_id",
      "panel_id",
      "placement_mode",
      "placement_receipt_identity_sha256",
      "quantity_id",
      "representation",
      "scoring_role",
      "station_id",
    ];
    if (representation === "shared_alias") return [...common, "shared_support_ref"].sort();
    return [...common, "coordinate", "coordinate_id", "coordinate_unit", "prediction", "support_identity_sha256"].sort();
  }

  function requireExactSubmittedSeriesFields(series, representation, label) {
    if (JSON.stringify(Object.keys(series || {}).sort()) !== JSON.stringify(submittedProfileSeriesFields(representation))) {
      throw new Error(`${label} does not use the exact current-v3 ${representation} prediction schema`);
    }
  }

  function requireProfileDescriptors(series, label, nativeTruth, nativeTruthVersion = 2) {
    const relative = ["drivaerml-velocity-relative-v3", "drivaerml_cp_relative_v1"].includes(series.family_id);
    const expectedPlacement = relative ? "relative" : "constant";
    const expectedRole = relative ? "report_only" : "inherits_parent_candidate";
    const velocity = ["drivaerml-autocfd5-constant-v1", "drivaerml-velocity-relative-v3"].includes(series.family_id);
    if (
      series.placement_mode !== expectedPlacement ||
      series.scoring_role !== expectedRole ||
      series.panel_id !== (velocity ? "velocity_profiles" : "pressure_profiles") ||
      series.quantity_id !== (velocity ? "velocity_ratio" : "cp")
    ) {
      throw new Error(`${label} family, placement, panel, quantity, or scoring role differs from the closed profile contract`);
    }
    if (nativeTruth) {
      const expectedQuantity = velocity ? "velocity_magnitude_ratio" : "pressure_coefficient";
      if (series.quantity !== expectedQuantity || series.units !== "1") {
        throw new Error(`${label} native quantity descriptor or unit differs from the closed profile contract`);
      }
    }
    if (series.representation !== "materialized") return;
    const expectedCoordinate =
      series.family_id === "drivaerml-autocfd5-constant-v1"
        ? ["distance_m", "m"]
        : series.family_id === "drivaerml-velocity-relative-v3"
          ? ["normalized_arc_length", "1"]
          : series.family_id === "drivaerml_cp_constant_v1"
            ? ["arc_length_m", "m"]
            : ["arc_length_m", "m"];
    if (series.coordinate_id !== expectedCoordinate[0] || series.coordinate_unit !== expectedCoordinate[1]) {
      throw new Error(`${label} coordinate ID or unit differs from the closed profile contract`);
    }
    if (
      nativeTruth &&
      nativeCpDisplayCoordinateRequired(series, nativeTruthVersion) &&
      (series.display_coordinate_id !== "streamwise_x_m" || series.display_coordinate_unit !== "m")
    ) {
      throw new Error(`${label} display-coordinate ID or unit differs from the native-v3 Cp contract`);
    }
  }

  function nativeMaterializedProfileSeries(series, label, nativeTruthVersion = 2) {
    requireExactNativeSeriesFields(series, "materialized", "value", label, nativeTruthVersion);
    requireProfileDescriptors(series, label, true, nativeTruthVersion);
    const coordinates = series.coordinate;
    const hasDisplayCoordinates = nativeCpDisplayCoordinateRequired(series, nativeTruthVersion);
    const displayCoordinates = hasDisplayCoordinates ? series.display_coordinate : null;
    const values = series.value;
    const sampleIndex = series.sample_index;
    const rawNativeCellId = series.raw_native_cell_id;
    if (
      !Array.isArray(coordinates) ||
      !Array.isArray(values) ||
      !Array.isArray(sampleIndex) ||
      !Array.isArray(rawNativeCellId) ||
      (hasDisplayCoordinates && !Array.isArray(displayCoordinates))
    ) {
      throw new Error(`${label} is unavailable because its coordinate, value, sample-index, or native-cell lineage is missing`);
    }
    if (
      !coordinates.length ||
      coordinates.length !== values.length ||
      coordinates.length !== sampleIndex.length ||
      coordinates.length !== rawNativeCellId.length ||
      (hasDisplayCoordinates && coordinates.length !== displayCoordinates.length)
    ) {
      throw new Error(`${label} has unaligned coordinate, display-coordinate, value, sample-index, or native-cell arrays`);
    }
    coordinates.forEach((coordinate, index) => {
      if (typeof coordinate !== "number" || !Number.isFinite(coordinate)) throw new Error(`${label} coordinate ${index} is not finite`);
    });
    values.forEach((value, index) => {
      if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} value ${index} is not finite`);
    });
    if (hasDisplayCoordinates) {
      displayCoordinates.forEach((coordinate, index) => {
        if (typeof coordinate !== "number" || !Number.isFinite(coordinate)) {
          throw new Error(`${label} display coordinate ${index} is not finite`);
        }
      });
    }
    sampleIndex.forEach((sample, index) => {
      if (!Number.isSafeInteger(sample) || sample < 0 || (index && sample <= sampleIndex[index - 1])) {
        throw new Error(`${label} sample_index is not strictly increasing non-negative integer lineage`);
      }
    });
    rawNativeCellId.forEach((cellId, index) => {
      if (!Number.isSafeInteger(cellId) || cellId < 0) throw new Error(`${label} raw_native_cell_id ${index} is invalid`);
    });
    const segmentOrdinals = nativeSegmentIds(series.segments, sampleIndex, coordinates, label);
    validateUnsupportedSamples(series.unsupported_samples, sampleIndex, label);
    const computedCoordinateIdentity = series._fluidsbenchCoordinateIdentitySha256;
    const identity = {
      supportIdentity: requiredSeriesIdentity(series, "support_identity_sha256", label),
      placementReceiptIdentity: requiredSeriesIdentity(series, "placement_receipt_identity_sha256", label),
      coordinateIdentity: requiredSeriesIdentity(series, "coordinate_identity_sha256", label),
      valueIdentity: requiredSeriesIdentity(series, "value_identity_sha256", label),
      seriesIdentity: requiredSeriesIdentity(series, "series_identity_sha256", label),
      displayCoordinateIdentity: hasDisplayCoordinates ? requiredSeriesIdentity(series, "display_coordinate_identity_sha256", label) : null,
    };
    if (!validSha256(computedCoordinateIdentity) || computedCoordinateIdentity !== identity.coordinateIdentity) {
      throw new Error(`${label} coordinate identity does not bind the submitted ordered coordinate bytes`);
    }
    const computedDisplayCoordinateIdentity = series._fluidsbenchDisplayCoordinateIdentitySha256;
    if (
      hasDisplayCoordinates &&
      (!validSha256(computedDisplayCoordinateIdentity) || computedDisplayCoordinateIdentity !== identity.displayCoordinateIdentity)
    ) {
      throw new Error(`${label} display-coordinate identity does not bind the ordered streamwise-x bytes`);
    }
    const points = [];
    const chartPoints = [];
    coordinates.forEach((coordinate, index) => {
      const segmentOrdinal = segmentOrdinals[index];
      const segmentId = series.segments[segmentOrdinal].segment_id;
      const gapBefore = index > 0 && segmentOrdinal !== segmentOrdinals[index - 1];
      if (gapBefore) {
        chartPoints.push({ x: null, y: null, gapSeparator: true });
      }
      const point = {
        x: Number(coordinate),
        y: Number(values[index]),
        coordinate: Number(coordinate),
        displayCoordinate: hasDisplayCoordinates ? Number(displayCoordinates[index]) : null,
        sourcePointIndex: index,
        sampleIndex: sampleIndex[index],
        rawNativeCellId: rawNativeCellId[index],
        segmentId,
        segmentOrdinal,
        gapBefore,
      };
      points.push(point);
      chartPoints.push(point);
    });
    return {
      points,
      chartPoints,
      sourcePointCount: coordinates.length,
      droppedPointCount: 0,
      segmentCount: series.segments.length,
      unsupportedSampleCount: series.unsupported_samples.length,
      coordinates,
      displayCoordinates: hasDisplayCoordinates ? displayCoordinates : null,
      sampleIndex,
      rawNativeCellId,
      segments: series.segments,
      unsupportedSamples: series.unsupported_samples,
      coordinateId: series.coordinate_id,
      coordinateUnit: series.coordinate_unit,
      displayCoordinateId: hasDisplayCoordinates ? series.display_coordinate_id : null,
      displayCoordinateUnit: hasDisplayCoordinates ? series.display_coordinate_unit : null,
      ...identity,
    };
  }

  function submittedMaterializedProfileSeries(series, label) {
    requireExactSubmittedSeriesFields(series, "materialized", label);
    requireProfileDescriptors(series, label, false);
    const coordinates = series.coordinate;
    const predictions = series.prediction;
    if (!Array.isArray(coordinates) || !Array.isArray(predictions) || coordinates.length < 2 || coordinates.length !== predictions.length) {
      throw new Error(`${label} current-v3 coordinate and prediction arrays must have equal length of at least two`);
    }
    coordinates.forEach((coordinate, index) => {
      if (typeof coordinate !== "number" || !Number.isFinite(coordinate)) throw new Error(`${label} coordinate ${index} is not finite`);
      if (series.family_id !== "drivaerml_cp_relative_v1" && index && coordinate <= coordinates[index - 1]) {
        throw new Error(`${label} coordinates are not strictly ordered`);
      }
    });
    predictions.forEach((value, index) => {
      if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} prediction ${index} is not finite`);
    });
    const coordinateIdentity = series._fluidsbenchCoordinateIdentitySha256;
    if (!validSha256(coordinateIdentity)) throw new Error(`${label} coordinate identity could not be recomputed from current-v3 bytes`);
    const points = coordinates.map((coordinate, index) => ({
      x: coordinate,
      y: predictions[index],
      coordinate,
      displayCoordinate: null,
      sourcePointIndex: index,
      sampleIndex: null,
      rawNativeCellId: null,
      segmentId: "unbound",
      segmentOrdinal: 0,
      gapBefore: false,
    }));
    return {
      points,
      chartPoints: points,
      sourcePointCount: coordinates.length,
      droppedPointCount: 0,
      segmentCount: 1,
      unsupportedSampleCount: 0,
      coordinates,
      displayCoordinates: null,
      sampleIndex: [],
      rawNativeCellId: [],
      segments: [],
      unsupportedSamples: [],
      supportIdentity: requiredSeriesIdentity(series, "support_identity_sha256", label),
      placementReceiptIdentity: requiredSeriesIdentity(series, "placement_receipt_identity_sha256", label),
      coordinateIdentity,
      coordinateId: series.coordinate_id,
      coordinateUnit: series.coordinate_unit,
      displayCoordinateIdentity: null,
      displayCoordinateId: null,
      displayCoordinateUnit: null,
    };
  }

  function hiLiftCompactMaterializedProfileSeries(series, label, nativeTruth) {
    const coordinates = series?.coordinate;
    const values = nativeTruth ? series?.value : series?.prediction;
    const sampleIndex = series?.sample_index;
    const segments = series?.segments;
    if (
      !Array.isArray(coordinates) ||
      !Array.isArray(values) ||
      !Array.isArray(sampleIndex) ||
      coordinates.length < 2 ||
      coordinates.length !== values.length ||
      coordinates.length !== sampleIndex.length ||
      coordinates.some((value) => typeof value !== "number" || !Number.isFinite(value)) ||
      values.some((value) => typeof value !== "number" || !Number.isFinite(value)) ||
      sampleIndex.some((value) => !Number.isSafeInteger(value) || value < 0)
    ) {
      throw new Error(`${label} compact HiLift coordinate/value/sample arrays are invalid or unaligned`);
    }
    if (!Array.isArray(segments) || !segments.length) throw new Error(`${label} compact HiLift series has no explicit branch/gap segments`);
    const segmentOrdinals = new Array(coordinates.length);
    let emittedStop = 0;
    segments.forEach((segment, ordinal) => {
      if (
        !segment ||
        typeof segment.segment_id !== "string" ||
        !segment.segment_id ||
        !Number.isSafeInteger(segment.emitted_index_start) ||
        !Number.isSafeInteger(segment.emitted_index_stop) ||
        segment.emitted_index_start !== emittedStop ||
        segment.emitted_index_stop <= segment.emitted_index_start ||
        segment.emitted_index_stop > coordinates.length
      ) {
        throw new Error(`${label} compact HiLift segment ${ordinal} is invalid or non-contiguous`);
      }
      for (let index = segment.emitted_index_start; index < segment.emitted_index_stop; index += 1) segmentOrdinals[index] = ordinal;
      emittedStop = segment.emitted_index_stop;
    });
    if (emittedStop !== coordinates.length) throw new Error(`${label} compact HiLift segments do not cover every emitted point`);
    const coordinateIdentity = series._fluidsbenchCoordinateIdentitySha256;
    if (!validSha256(coordinateIdentity)) throw new Error(`${label} compact HiLift coordinate identity could not be recomputed`);
    const points = coordinates.map((coordinate, index) => {
      const segmentOrdinal = segmentOrdinals[index];
      const segment = segments[segmentOrdinal];
      return {
        x: coordinate,
        y: values[index],
        coordinate,
        displayCoordinate: null,
        sourcePointIndex: index,
        sampleIndex: sampleIndex[index],
        rawNativeCellId: null,
        segmentId: segment.segment_id,
        segmentOrdinal,
        gapBefore: index === segment.emitted_index_start && index > 0,
      };
    });
    const chartPoints = [];
    points.forEach((point) => {
      if (point.gapBefore) chartPoints.push({ x: null, y: null, gapSeparator: true });
      chartPoints.push(point);
    });
    const unsupportedSampleCount = Number(series.unsupported_sample_count || 0);
    if (!Number.isSafeInteger(unsupportedSampleCount) || unsupportedSampleCount < 0) {
      throw new Error(`${label} compact HiLift unsupported-sample count is invalid`);
    }
    return {
      points,
      chartPoints,
      sourcePointCount: coordinates.length,
      droppedPointCount: 0,
      segmentCount: segments.length,
      unsupportedSampleCount,
      coordinates,
      displayCoordinates: null,
      sampleIndex,
      rawNativeCellId: [],
      segments,
      unsupportedSamples: [],
      supportIdentity: requiredSeriesIdentity(series, "support_identity_sha256", label),
      predictionOrder: requiredSeriesIdentity(series, "prediction_order_sha256", label),
      placementReceiptIdentity: null,
      coordinateIdentity,
      coordinateId: series.coordinate_id,
      coordinateUnit: series.coordinate_unit,
      displayCoordinateIdentity: null,
      displayCoordinateId: null,
      displayCoordinateUnit: null,
    };
  }

  function legacyProfileSeries(series) {
    const coordinates = series.coordinate || [];
    const values = series.prediction || series.value || [];
    const sourcePointCount = Math.max(coordinates.length, values.length);
    const points = [];
    for (let index = 0; index < sourcePointCount; index += 1) {
      const x = finiteNumber(coordinates[index]);
      const y = finiteNumber(values[index]);
      if (x !== null && y !== null) {
        points.push({
          x,
          y,
          coordinate: x,
          displayCoordinate: null,
          sourcePointIndex: index,
          sampleIndex: index,
          rawNativeCellId: null,
          segmentId: "legacy",
          segmentOrdinal: 0,
          gapBefore: false,
        });
      }
    }
    return points.length
      ? {
          points,
          chartPoints: points,
          sourcePointCount,
          droppedPointCount: sourcePointCount - points.length,
          segmentCount: 1,
          unsupportedSampleCount: 0,
          coordinates: points.map((point) => point.x),
          displayCoordinates: null,
          sampleIndex: points.map((point) => point.sourcePointIndex),
          rawNativeCellId: [],
          segments: [],
          unsupportedSamples: [],
          legacy: true,
        }
      : null;
  }

  function profileSeries(source, panel, stationId, quantity, family = null) {
    const expectedFamily = family?.id || "";
    const expectedPlacement = family?.placementMode || "";
    const allSeries = source?.series || [];
    let matches = allSeries.filter((candidate) => {
      return (
        candidate.panel_id === panel.id &&
        candidate.station_id === stationId &&
        candidate.quantity_id === quantity.id &&
        (!expectedFamily || candidate.family_id === expectedFamily) &&
        (!expectedPlacement || candidate.placement_mode === expectedPlacement)
      );
    });
    if (!matches.length && !source?._fluidsbenchNativeProfileTruth && expectedFamily) {
      matches = allSeries.filter((candidate) => {
        return (
          !candidate.family_id &&
          !candidate.placement_mode &&
          candidate.panel_id === panel.id &&
          candidate.station_id === stationId &&
          candidate.quantity_id === quantity.id
        );
      });
    }
    if (!matches.length) return null;
    const label = `${source?.case_id || "profile case"}/${panel.id}/${expectedFamily || "legacy"}/${stationId}/${quantity.id}`;
    if (matches.length !== 1) throw new Error(`${label} is ambiguous because ${matches.length} matching series were supplied`);
    const selected = matches[0];
    if (source?._fluidsbenchWindsorNativeProfileTruth) {
      validateWindsorNativeCase(source);
      const parsed = legacyProfileSeries(selected);
      return {
        ...parsed,
        legacy: false,
        familyId: selected.family_id,
        placementMode: selected.placement_mode,
        stationId: selected.station_id,
        quantityId: selected.quantity_id,
        scoringRole: selected.scoring_role,
        coordinateId: selected.coordinate_id,
        coordinateUnit: selected.coordinate_unit,
        supportIdentity: source.profile_support_sha256,
        representation: "materialized",
        nativeTruth: true,
        nativeTruthSource: windsorNativeBinding,
        nativeDatasetRevision: windsorNativeBinding.dataset_revision,
        selectedSeries: selected,
        materializedSeries: selected,
      };
    }
    if (!selected.family_id) {
      const legacy = legacyProfileSeries(selected);
      return legacy ? { ...legacy, selectedSeries: selected, materializedSeries: selected } : null;
    }
    const nativeTruth = source?._fluidsbenchNativeProfileTruth === true;
    const nativeTruthVersion = nativeTruth ? Number(source?._fluidsbenchNativeProfileTruthVersion || 2) : null;
    const currentPrediction = source?._fluidsbenchRelativeProfileV3 === true;
    const hiLiftCompactTruth = source?._fluidsbenchHiLiftCompactTruth === true;
    const hiLiftCompactPrediction = source?._fluidsbenchHiLiftCompactPrediction === true;
    if (!nativeTruth && !currentPrediction && !hiLiftCompactTruth && !hiLiftCompactPrediction) {
      throw new Error(`${label} namespaced series has no verified native truth or current prediction binding`);
    }
    let materialized = selected;
    if (selected.representation === "shared_alias") {
      if (nativeTruth) requireExactNativeSeriesFields(selected, "shared_alias", "", label, nativeTruthVersion);
      else requireExactSubmittedSeriesFields(selected, "shared_alias", label);
      requireProfileDescriptors(selected, label, nativeTruth, nativeTruthVersion);
      if (
        ["coordinate", "display_coordinate", "value", "prediction", "sample_index", "raw_native_cell_id", "segments", "unsupported_samples"].some(
          (field) => field in selected
        )
      ) {
        throw new Error(`${label} shared alias illegally materializes profile arrays`);
      }
      const reference = sharedSupportReference(selected, label);
      requiredSeriesIdentity(selected, "placement_receipt_identity_sha256", label);
      if (nativeTruth) requiredSeriesIdentity(selected, "series_identity_sha256", label);
      const canonicalMatches = allSeries.filter(
        (candidate) =>
          candidate.panel_id === panel.id &&
          candidate.family_id === reference.familyId &&
          candidate.station_id === reference.stationId &&
          candidate.quantity_id === quantity.id &&
          candidate.representation === "materialized"
      );
      if (canonicalMatches.length !== 1) throw new Error(`${label} shared alias does not resolve to exactly one canonical materialized support`);
      materialized = canonicalMatches[0];
      if (reference.supportIdentity !== materialized.support_identity_sha256) {
        throw new Error(`${label} shared alias support identity differs from its canonical materialized support`);
      }
    } else if (selected.representation !== "materialized") {
      throw new Error(`${label} has unsupported representation ${selected.representation || "missing"}`);
    }
    const parsed =
      hiLiftCompactTruth || hiLiftCompactPrediction
        ? hiLiftCompactMaterializedProfileSeries(materialized, label, hiLiftCompactTruth)
        : nativeTruth
          ? nativeMaterializedProfileSeries(materialized, label, nativeTruthVersion)
          : submittedMaterializedProfileSeries(materialized, label);
    return {
      ...parsed,
      legacy: false,
      familyId: selected.family_id,
      placementMode: selected.placement_mode,
      stationId: selected.station_id,
      quantityId: selected.quantity_id,
      representation: selected.representation,
      scoringRole: selected.scoring_role || null,
      supportIdentity: parsed.supportIdentity,
      placementReceiptIdentity: selected.placement_receipt_identity_sha256,
      seriesIdentity: nativeTruth ? selected.series_identity_sha256 : parsed.seriesIdentity,
      selectedSeries: selected,
      materializedSeries: materialized,
      nativeTruth: nativeTruth || hiLiftCompactTruth,
      nativeTruthSource: nativeTruth || hiLiftCompactTruth ? source.truth_source : null,
      nativeDatasetRevision: nativeTruth ? source.dataset_revision : hiLiftCompactTruth ? source?._fluidsbenchHiLiftIndex?.dataset_revision : null,
      nativeTruthVersion,
      hiLiftCompactTruth,
      hiLiftCompactPrediction,
    };
  }

  function profileSeriesCompatibility(reference, candidate) {
    if (!reference || !candidate) throw new Error("profile series is unavailable");
    if (reference.legacy || candidate.legacy) {
      if (!reference.legacy || !candidate.legacy) throw new Error("legacy profile series cannot be overlaid on identity-bound native ground truth");
      return true;
    }
    const exactFields = [
      ["familyId", "family"],
      ["placementMode", "placement"],
      ["stationId", "station"],
      ["quantityId", "quantity"],
      ["representation", "representation"],
      ["supportIdentity", "support identity"],
      ["predictionOrder", "prediction order"],
      ["placementReceiptIdentity", "placement-receipt identity"],
      ["coordinateIdentity", "coordinate identity"],
      ["coordinateId", "coordinate ID"],
      ["coordinateUnit", "coordinate unit"],
    ];
    exactFields.forEach(([field, description]) => {
      if (reference[field] !== candidate[field]) throw new Error(`${description} differs from checksum-verified native ground truth`);
    });
    if (!arraysExactlyEqual(reference.coordinates, candidate.coordinates)) {
      throw new Error("ordered coordinates differ from checksum-verified native ground truth");
    }
    candidate.points = candidate.points.map((point, index) => ({
      ...point,
      coordinate: reference.points[index].coordinate,
      displayCoordinate: reference.points[index].displayCoordinate,
      sampleIndex: reference.points[index].sampleIndex,
      rawNativeCellId: reference.points[index].rawNativeCellId,
      segmentId: reference.points[index].segmentId,
      segmentOrdinal: reference.points[index].segmentOrdinal,
      gapBefore: reference.points[index].gapBefore,
    }));
    candidate.chartPoints = [];
    candidate.points.forEach((point) => {
      if (point.gapBefore) candidate.chartPoints.push({ x: null, y: null, gapSeparator: true });
      candidate.chartPoints.push(point);
    });
    candidate.sampleIndex = reference.sampleIndex;
    candidate.displayCoordinates = reference.displayCoordinates;
    candidate.displayCoordinateIdentity = reference.displayCoordinateIdentity;
    candidate.displayCoordinateId = reference.displayCoordinateId;
    candidate.displayCoordinateUnit = reference.displayCoordinateUnit;
    candidate.rawNativeCellId = reference.rawNativeCellId;
    candidate.segments = reference.segments;
    candidate.unsupportedSamples = reference.unsupportedSamples;
    candidate.segmentCount = reference.segmentCount;
    candidate.unsupportedSampleCount = reference.unsupportedSampleCount;
    candidate.lineageInheritedFromNativeTruth = true;
    return true;
  }

  function profilePlotValues(datasets, coordinateView) {
    return datasets.flatMap((dataset, seriesIndex) =>
      dataset.finitePoints.map((point, pointIndex) => ({
        series: dataset.label,
        series_role: dataset.seriesRole,
        submission_id: dataset.submissionId,
        rank: dataset.rank ?? null,
        series_order: seriesIndex,
        line_style: dataset.lineStyle,
        point_index: pointIndex,
        source_point_index: point.sourcePointIndex,
        support_sample_index: point.sampleIndex,
        raw_native_cell_id: point.rawNativeCellId,
        segment_id: point.segmentId,
        segment_ordinal: point.segmentOrdinal,
        gap_before: point.gapBefore,
        segment_count: dataset.segmentCount,
        unsupported_sample_count: dataset.unsupportedSampleCount,
        source_point_count: dataset.sourcePointCount,
        dropped_point_count: dataset.droppedPointCount,
        family_id: dataset.profileIdentity?.familyId || null,
        placement_mode: dataset.profileIdentity?.placementMode || null,
        representation: dataset.profileIdentity?.representation || null,
        scoring_role: dataset.profileIdentity?.scoringRole || null,
        support_identity_sha256: dataset.profileIdentity?.supportIdentity || null,
        prediction_order_sha256: dataset.profileIdentity?.predictionOrder || null,
        placement_receipt_identity_sha256: dataset.profileIdentity?.placementReceiptIdentity || null,
        coordinate_id: dataset.profileIdentity?.coordinateId || null,
        coordinate_unit: dataset.profileIdentity?.coordinateUnit || null,
        coordinate_identity_sha256: dataset.profileIdentity?.coordinateIdentity || null,
        display_coordinate_id: dataset.profileIdentity?.displayCoordinateId || null,
        display_coordinate_unit: dataset.profileIdentity?.displayCoordinateUnit || null,
        display_coordinate_identity_sha256: dataset.profileIdentity?.displayCoordinateIdentity || null,
        value_identity_sha256: dataset.profileIdentity?.valueIdentity || null,
        series_identity_sha256: dataset.profileIdentity?.seriesIdentity || null,
        native_truth_source: dataset.profileIdentity?.nativeTruthSource || null,
        native_dataset_revision: dataset.profileIdentity?.nativeDatasetRevision || null,
        coordinate_view: coordinateView.id,
        coordinate: point.coordinate,
        display_coordinate: point.displayCoordinate,
        x: point.x,
        y: point.y,
        source_index_url: dataset.sourceProvenance?.index_url || null,
        source_index_sha256: dataset.sourceProvenance?.index_sha256 || null,
        source_chunk_url: dataset.sourceProvenance?.chunk_url || null,
        source_chunk_declared_sha256: dataset.sourceProvenance?.chunk_declared_sha256 || null,
        source_chunk_downloaded_sha256: dataset.sourceProvenance?.chunk_downloaded_sha256 || null,
        source_artifact_url: dataset.sourceProvenance?.artifact_url || null,
        source_artifact_sha256: dataset.sourceProvenance?.artifact_sha256 || null,
        ...(dataset.validationMetadata || validationMetadata(null)),
      }))
    );
  }

  function niceProfileAxisStep(span, targetIntervals = 8) {
    if (!Number.isFinite(span) || span <= 0) return 1;
    const roughStep = span / targetIntervals;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalized = roughStep / magnitude;
    const candidates = [1, 2, 2.5, 5, 10];
    const factor = candidates.reduce((best, candidate) =>
      Math.abs(Math.log(normalized / candidate)) < Math.abs(Math.log(normalized / best)) ? candidate : best
    );
    return factor * magnitude;
  }

  function niceProfileAxisRange(values, { floorAtZero = false } = {}) {
    const finite = values.filter((value) => typeof value === "number" && Number.isFinite(value));
    if (!finite.length) return null;
    const dataMin = Math.min(...finite);
    const dataMax = Math.max(...finite);
    let rangeMin = floorAtZero ? Math.min(0, dataMin) : dataMin;
    let rangeMax = dataMax;
    if (rangeMin === rangeMax) {
      const halfSpan = Math.max(Math.abs(rangeMin) * 0.05, 0.5);
      rangeMin -= halfSpan;
      rangeMax += halfSpan;
      if (floorAtZero) rangeMin = Math.max(0, rangeMin);
    }
    const span = rangeMax - rangeMin;
    const step = niceProfileAxisStep(span);
    let min = floorAtZero && rangeMin >= 0 ? 0 : Math.floor(rangeMin / step) * step;
    let max = Math.ceil(rangeMax / step) * step;
    const edgeTolerance = Math.max(span * 0.005, Math.abs(step) * 1e-9);
    if ((!floorAtZero || min > 0) && dataMin - min < edgeTolerance) min -= step;
    if (max - dataMax < edgeTolerance) max += step;
    const stable = (value) => {
      const rounded = Number(value.toPrecision(12));
      return Object.is(rounded, -0) ? 0 : rounded;
    };
    return {
      dataMin: stable(dataMin),
      dataMax: stable(dataMax),
      min: stable(min),
      max: stable(max),
      step: stable(step),
    };
  }

  function hiLiftProfileAxisRanges(datasets, panel) {
    if (activeDatasetSlug() !== "hiliftaeroml" || !["pressure_profiles", "velocity_profiles"].includes(panel?.id)) return null;
    const points = datasets.flatMap((dataset) => dataset.finitePoints || []);
    const velocity = panel.id === "velocity_profiles";
    const x = niceProfileAxisRange(
      points.map((point) => point.x),
      { floorAtZero: velocity }
    );
    const y = niceProfileAxisRange(
      points.map((point) => point.y),
      { floorAtZero: velocity }
    );
    return x && y ? { x, y } : null;
  }

  async function refreshProfileContext() {
    const version = ++state.profileLoadVersion;
    invalidateProfileFigures();
    const dataset = activeDataset();
    if (!dataset || !state.split) {
      setProfileStatus("No profile data are available for this selection.");
      return;
    }
    const rows = figureRows();
    setGroundTruthComparisonHealth(false);
    setProfileStatus("Loading profile data...");
    try {
      let groundTruthContext = null;
      let groundTruthError = null;
      let availableCaseIds = [];
      try {
        groundTruthContext = await groundTruthIndex(state.dataset, state.split);
        availableCaseIds = caseIds(groundTruthContext.index);
      } catch (error) {
        groundTruthError = error;
        showProfileWarning(error);
      }
      if (!availableCaseIds.length && rows.length) {
        const fallback = await submissionProfileIndex(rows[0]);
        availableCaseIds = caseIds(fallback.index);
      }
      if (version !== state.profileLoadVersion) return;
      state.profileCaseIds = availableCaseIds;
      if (!availableCaseIds.includes(state.profileCase)) state.profileCase = availableCaseIds[0] || "";
      syncProfileCaseSelects();
      if (!state.profileCase) {
        state.groundTruthCase = null;
        state.profileCases = new Map();
        state.profileCaseErrors = new Map();
        setProfileStatus("No profile cases are available for this dataset and split.");
        syncProfileActionAvailability();
        return;
      }

      const groundTruthRequest = groundTruthContext
        ? indexedProfileCase(groundTruthContext, state.profileCase, state.groundTruthChunks, `${state.dataset} ground truth`)
        : Promise.resolve(null);
      const rowRequests = rows.map(async (row) => {
        try {
          const context = await submissionProfileIndex(row);
          const value = await indexedProfileCase(context, state.profileCase, state.profileChunks, rowLabel(row));
          return { id: row.id, row, value, error: value ? null : "selected case is absent from the checksum-verified submitted profile package" };
        } catch (error) {
          console.error(error);
          return { id: row.id, row, value: null, error: error.message };
        }
      });
      const [groundTruthMetadata, rowMetadata] = await Promise.all([groundTruthRequest, Promise.all(rowRequests)]);
      const groundTruthCase = await materializeHiLiftCompactTruth(groundTruthMetadata, `${state.dataset} ground truth`);
      const rowCases = await Promise.all(
        rowMetadata.map(async ({ id, row, value, error }) => {
          if (!value || error) return { id, value, error };
          try {
            return { id, value: await materializeHiLiftCompactPrediction(value, groundTruthCase, rowLabel(row)), error: null };
          } catch (materializeError) {
            console.error(materializeError);
            return { id, value: null, error: materializeError.message };
          }
        })
      );
      if (version !== state.profileLoadVersion) return;
      state.groundTruthCase = groundTruthCase;
      state.profileCases = new Map(rowCases.map(({ id, value }) => [id, value]));
      state.profileCaseErrors = new Map(rowCases.filter(({ error }) => error).map(({ id, error }) => [id, error]));
      if (groundTruthError || !groundTruthCase) {
        if (!groundTruthError) showProfileWarning(new Error("the selected case is absent from the checksum-verified ground-truth package"));
        setGroundTruthComparisonHealth(false);
        setProfileStatus("Profile comparison is unavailable because the selected ground-truth case could not be verified.");
        syncProfileActionAvailability();
        return;
      }
      element("leaderboard-profile-warning").hidden = true;
      setGroundTruthComparisonHealth(true, groundTruthContext.caseSetId);
      state.profileReadyVersion = version;
      setProfileStatus("");
      dataset.diagnostic_panels.forEach((_, index) => renderProfileChart(index));
      syncProfileActionAvailability();
    } catch (error) {
      if (version !== state.profileLoadVersion) return;
      state.groundTruthCase = null;
      state.profileCases = new Map();
      state.profileCaseErrors = new Map();
      invalidateProfileFigures();
      setProfileStatus(`Profile data could not be loaded: ${error.message}`);
      showProfileWarning(error);
      setGroundTruthComparisonHealth(false);
      console.error(error);
    }
  }

  function verifiedNativeGroundTruthCase(profileCase) {
    return Boolean(
      profileCase?._fluidsbenchNativeProfileTruth ||
        profileCase?._fluidsbenchHiLiftCompactTruth ||
        profileCase?._fluidsbenchAhmedNativeProfileTruth ||
        profileCase?._fluidsbenchWindsorNativeProfileTruth
    );
  }

  function publicGroundTruthLabel(profileCase) {
    if (profileCase?._fluidsbenchHiLiftCompactTruth) return "Native CFD ground truth (plot-only)";
    return profileCase?._fluidsbenchNativeProfileTruth ||
      profileCase?._fluidsbenchAhmedNativeProfileTruth ||
      profileCase?._fluidsbenchWindsorNativeProfileTruth
      ? "Native CFD ground truth"
      : "Ground truth";
  }

  function renderProfileChart(index) {
    const figureKey = `profile-${index}`;
    invalidateProfileFigure(figureKey);
    const panel = activeDataset()?.diagnostic_panels?.[index];
    const canvas = element(`profile-${index}-chart`);
    if (state.profileReadyVersion !== state.profileLoadVersion || !panel || !canvas || typeof Chart === "undefined") return;
    const selection = panelSelection(panel);
    const family = selectedProfileFamily(panel);
    const quantity = (panel.quantities || []).find((candidate) => candidate.id === selection.quantity);
    const station = profileStations(panel, family).find((candidate) => candidate.id === selection.station);
    if (!quantity || !station) return;

    const datasets = [];
    const omittedProfiles = [];
    let groundTruthSeries = null;
    try {
      groundTruthSeries = profileSeries(state.groundTruthCase, panel, station.id, quantity, family);
    } catch (error) {
      const status = element(`profile-${index}-status`);
      if (status) {
        status.hidden = false;
        status.textContent = `Profile comparison is unavailable: ${error.message}`;
      }
      canvas.hidden = true;
      setChartSummary(`profile-${index}-chart-summary`, `Profile comparison unavailable: ${error.message}`);
      syncProfileActionAvailability();
      return;
    }
    if (verifiedNativeGroundTruthCase(state.groundTruthCase) && !groundTruthSeries) {
      const message = "the exact selected family, placement, station, and quantity are absent from checksum-verified native ground truth";
      const status = element(`profile-${index}-status`);
      if (status) {
        status.hidden = false;
        status.textContent = `Profile comparison is unavailable: ${message}`;
      }
      canvas.hidden = true;
      setChartSummary(`profile-${index}-chart-summary`, `Profile comparison unavailable: ${message}`);
      syncProfileActionAvailability();
      return;
    }
    const coordinateView = resolvedProfileCoordinateView(panel, selection.coordinateView, groundTruthSeries, station);
    if (selection.coordinateView !== coordinateView.id) {
      selection.coordinateView = coordinateView.id;
      const coordinateSelect = element(`profile-${index}-coordinate`);
      if (coordinateSelect) coordinateSelect.value = coordinateView.id;
    }
    if (groundTruthSeries) {
      const groundTruthLabel = publicGroundTruthLabel(state.groundTruthCase);
      const projected = projectProfileSeries(groundTruthSeries, coordinateView);
      datasets.push({
        label: groundTruthLabel,
        seriesRole: "public_ground_truth",
        submissionId: null,
        sourceProvenance: state.groundTruthCase?._fluidsbenchProvenance || {},
        lineStyle: "solid",
        data: projected.chartPoints,
        finitePoints: projected.points,
        sourcePointCount: groundTruthSeries.sourcePointCount,
        droppedPointCount: groundTruthSeries.droppedPointCount,
        segmentCount: groundTruthSeries.segmentCount,
        unsupportedSampleCount: groundTruthSeries.unsupportedSampleCount,
        profileIdentity: groundTruthSeries,
        borderColor: chartTextColor(),
        backgroundColor: chartTextColor(),
        borderWidth: 3,
        pointRadius: 0,
        tension: 0,
      });
    }
    figureRows().forEach((row, rowIndex) => {
      let series = null;
      try {
        series = profileSeries(state.profileCases.get(row.id), panel, station.id, quantity, family);
        if (series && groundTruthSeries) profileSeriesCompatibility(groundTruthSeries, series);
      } catch (error) {
        omittedProfiles.push({ row, reason: error.message });
        return;
      }
      if (!series) {
        omittedProfiles.push({
          row,
          reason: state.profileCaseErrors.get(row.id) || "requested panel, station, or quantity is unavailable",
        });
        return;
      }
      const projected = projectProfileSeries(series, coordinateView);
      datasets.push({
        label: rowLabel(row),
        seriesRole: "submission_prediction",
        submissionId: row.id,
        rank: row.rank,
        validationMetadata: validationMetadata(row),
        sourceProvenance: state.profileCases.get(row.id)?._fluidsbenchProvenance || {},
        lineStyle: rowIndex % 2 ? "dashed" : "solid",
        data: projected.chartPoints,
        finitePoints: projected.points,
        sourcePointCount: series.sourcePointCount,
        droppedPointCount: series.droppedPointCount,
        segmentCount: series.segmentCount,
        unsupportedSampleCount: series.unsupportedSampleCount,
        profileIdentity: series,
        borderColor: palette[rowIndex % palette.length],
        backgroundColor: palette[rowIndex % palette.length],
        borderWidth: 2,
        borderDash: rowIndex % 2 ? [6, 3] : [],
        pointRadius: 0,
        tension: 0,
      });
    });

    const submissionCurveCount = datasets.length - (groundTruthSeries ? 1 : 0);
    const profileOmissionText = omittedProfiles.length
      ? ` Omitted selected result${omittedProfiles.length === 1 ? "" : "s"}: ${omittedProfiles
          .map(({ row, reason }) => `${row.id} (${reason})`)
          .join("; ")}.`
      : "";
    const status = element(`profile-${index}-status`);
    if (status) {
      status.hidden = datasets.length > 0;
      status.textContent = datasets.length ? "" : `No curves are available for ${state.profileCase || "the selected geometry"} at this station.`;
    }
    canvas.hidden = datasets.length === 0;
    const familyLabel = family?.label ? `, ${family.label}` : "";
    canvas.setAttribute(
      "aria-label",
      `${panel.title}${familyLabel}: ${quantity.label} at ${station.label} for ${state.profileCase}, plotted against ${coordinateView.label}`
    );
    setChartSummary(
      `profile-${index}-chart-summary`,
      `${panel.title} for ${state.dataset}, ${state.split}, geometry ${state.profileCase}${familyLabel}. Showing ${quantity.label} at ${
        station.label
      } against ${coordinateView.label}. ${
        groundTruthSeries
          ? verifiedNativeGroundTruthCase(state.groundTruthCase)
            ? state.groundTruthCase?._fluidsbenchHiLiftCompactTruth
              ? "Checksum-bound plot-only Native CFD ground truth is included."
              : "Pinned Native CFD ground truth is included."
            : "Ground truth is included."
          : "Ground truth is unavailable."
      } ${submissionCurveCount} submission curves are displayed.${profileOmissionText}`
    );

    if (!datasets.length) {
      syncProfileActionAvailability();
      return;
    }
    const plottedValues = profilePlotValues(datasets, coordinateView);
    const axisRanges = hiLiftProfileAxisRanges(datasets, panel);
    const droppedPointCount = datasets.reduce((total, dataset) => total + dataset.droppedPointCount, 0);
    const gapCount = datasets.reduce((total, dataset) => total + Math.max(0, dataset.segmentCount - 1), 0);
    const nativeProfileContext = verifiedNativeGroundTruthCase(state.groundTruthCase);
    const lineProcessing = nativeProfileContext
      ? `Lines preserve checksum-bound native source order without smoothing, interpolation, resampling, or sorting. Unsupported samples create explicit segment breaks and are never bridged; ${
          gapCount || "no"
        } retained gap${gapCount === 1 ? " is" : "s are"} visible across the plotted series.`
      : "Lines preserve source coordinate/value order and join finite pairs without smoothing, interpolation, resampling, or sorting.";
    const caption = `${state.dataset}, ${state.split}, public evaluation geometry ${state.profileCase}: ${quantity.label} at ${station.label}${
      family?.label ? ` using ${family.label}` : ""
    }, plotted against ${coordinateView.label} and showing ${
      groundTruthSeries
        ? verifiedNativeGroundTruthCase(state.groundTruthCase)
          ? state.groundTruthCase?._fluidsbenchHiLiftCompactTruth
            ? "checksum-bound plot-only Native CFD ground truth on the compact 128-point-per-graph support and "
            : state.groundTruthCase?._fluidsbenchAhmedNativeProfileTruth
              ? `pinned 128-point Native CFD ground truth (${ahmedNativeDatasetRevision}) and `
              : `pinned Native CFD ground truth (${nativeDrivaermlDatasetRevision}) and `
          : "public ground truth and "
        : ""
    }${submissionCurveCount} explicitly selected ${resultDataOriginLabel()} model curve${submissionCurveCount === 1 ? "" : "s"}. ${lineProcessing} ${
      droppedPointCount || "no"
    } invalid or unpaired source point${droppedPointCount === 1 ? " was" : "s were"} omitted.${profileOmissionText} ${releaseStamp()}.`;
    setFigureCaption(figureKey, caption, `${state.dataset} · ${state.split} · ${panel.title} · ${station.label} · ${datasets.length} plotted series`);
    const domain = datasets.map((dataset) => dataset.label);
    const range = datasets.map((dataset) => dataset.borderColor);
    const coordinateTooltips = isDrivaermlCpPanel(panel)
      ? [
          { field: "display_coordinate", type: "quantitative", title: "Physical streamwise x coordinate, m" },
          { field: "coordinate", type: "quantitative", title: "Surface arc length (scoring coordinate), m" },
        ]
      : [{ field: "x", type: "quantitative", title: coordinateView.label }];
    state.figureSpecs.set(figureKey, {
      ...figureSpecBase(`${state.dataset}: ${panel.title}`, plottedValues),
      mark: { type: "line", interpolate: "linear", point: false, tooltip: true },
      encoding: {
        x: {
          field: "x",
          type: "quantitative",
          title: coordinateView.label,
          ...(axisRanges ? { scale: { domain: [axisRanges.x.min, axisRanges.x.max], nice: false, zero: false } } : {}),
        },
        y: {
          field: "y",
          type: "quantitative",
          title: quantity.y_label,
          scale: {
            reverse: Boolean(panel.reverse_y),
            zero: false,
            ...(axisRanges ? { domain: [axisRanges.y.min, axisRanges.y.max], nice: false } : {}),
          },
        },
        color: {
          field: "series",
          type: "nominal",
          scale: { domain, range },
          legend: { title: "Series", labelLimit: 260 },
        },
        strokeDash: {
          field: "line_style",
          type: "nominal",
          scale: {
            domain: ["solid", "dashed"],
            range: [
              [1, 0],
              [6, 3],
            ],
          },
          legend: null,
        },
        detail: [{ field: "series" }, { field: "segment_ordinal" }],
        order: { field: "source_point_index", type: "quantitative" },
        strokeWidth: {
          condition: { test: "datum.series_role === 'public_ground_truth'", value: 3 },
          value: 2,
        },
        tooltip: [
          { field: "series", type: "nominal", title: "Series" },
          { field: "submission_id", type: "nominal", title: "Submission ID" },
          ...coordinateTooltips,
          { field: "y", type: "quantitative", title: quantity.y_label },
        ],
      },
    });
    renderNumericTable(
      `${figureKey}-data-table`,
      nativeProfileContext
        ? "Checksum-bound native coordinate/value pairs used in the displayed figure. Segment IDs and gap boundaries are explicit; unsupported samples are not connected, interpolated, resampled, or sorted."
        : "Finite source coordinate/value pairs used in the displayed figure, in source order; omitted-point counts are explicit and no smoothing, interpolation, resampling, or sorting is applied.",
      [
        { label: "Series", value: "series" },
        { label: "Role", value: "series_role" },
        { label: "Line style", value: "line_style" },
        { label: "Submission ID", value: "submission_id" },
        { label: "Plotted point", value: "point_index" },
        { label: "Source point", value: "source_point_index" },
        { label: "Support sample", value: "support_sample_index" },
        { label: "Native cell", value: "raw_native_cell_id" },
        { label: "Segment provenance", value: "segment_id" },
        { label: "Segment ordinal", value: "segment_ordinal" },
        { label: "Gap before", value: "gap_before" },
        { label: "Source points", value: "source_point_count" },
        { label: "Dropped points", value: "dropped_point_count" },
        ...(isDrivaermlCpPanel(panel)
          ? [
              { label: "Physical streamwise x coordinate, m", value: "display_coordinate" },
              { label: "Surface arc length (scoring coordinate), m", value: "coordinate" },
            ]
          : [{ label: coordinateView.label, value: "x" }]),
        { label: quantity.y_label, value: "y" },
      ],
      plottedValues
    );

    state.charts[`profile-${index}`] = new Chart(canvas, {
      type: "line",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        interaction: { mode: "nearest", intersect: false },
        spanGaps: false,
        elements: { line: { spanGaps: false } },
        scales: {
          x: {
            type: "linear",
            ...(axisRanges
              ? {
                  min: axisRanges.x.min,
                  max: axisRanges.x.max,
                  bounds: "ticks",
                }
              : {}),
            title: { display: true, text: coordinateView.label, color: chartTextColor() },
            ticks: {
              color: chartTextColor(),
              ...(axisRanges ? { includeBounds: true, stepSize: axisRanges.x.step, maxTicksLimit: 11 } : {}),
            },
            grid: { color: chartGridColor() },
          },
          y: {
            reverse: Boolean(panel.reverse_y),
            ...(axisRanges
              ? {
                  min: axisRanges.y.min,
                  max: axisRanges.y.max,
                  bounds: "ticks",
                }
              : {}),
            title: { display: true, text: quantity.y_label, color: chartTextColor() },
            ticks: {
              color: chartTextColor(),
              ...(axisRanges ? { includeBounds: true, stepSize: axisRanges.y.step, maxTicksLimit: 11 } : {}),
            },
            grid: { color: chartGridColor() },
          },
        },
        plugins: {
          legend: { labels: { color: chartTextColor(), usePointStyle: true } },
          tooltip: {
            callbacks: {
              title: () => station.label,
              label: (context) => profileTooltipLines(context.dataset, context.raw, panel, quantity, coordinateView),
            },
          },
        },
      },
    });
    syncProfileActionAvailability();
  }

  function profileDataExport(index) {
    const figureKey = `profile-${index}`;
    if (!profileFigureReady(figureKey)) throw new Error("No current plotted profile data are available");
    const panel = activeDataset()?.diagnostic_panels?.[index];
    const selection = panel ? panelSelection(panel) : null;
    const family = panel ? selectedProfileFamily(panel) : null;
    const quantity = (panel?.quantities || []).find((candidate) => candidate.id === selection?.quantity);
    const station = panel ? profileStations(panel, family).find((candidate) => candidate.id === selection?.station) : null;
    const spec = state.figureSpecs.get(figureKey);
    const points = Array.isArray(spec?.data?.values) ? spec.data.values : [];
    if (!panel || !quantity || !station || !points.length) throw new Error("No plotted profile data are available");
    const license = releaseLicenseMetadata();
    return {
      schema_version: "fluidsbench-profile-plot-export-v3",
      exported_at: new Date().toISOString(),
      provenance: {
        export_scope: "exact_displayed_profile_figure",
        row_count: points.length,
        release_id: dataRelease().id || null,
        release_status: dataRelease().status || null,
        reproducibility_contract_version: dataRelease().reproducibility_contract_version || null,
        publication_scope: publicationScope(),
        leaderboard_manifest: leaderboardManifestProvenance(),
        feed_sha256: dataRelease().feed_sha256 || null,
        loaded_feed_sha256: state.loadedFeedSha256,
        feed_verified: state.feedVerified,
        archive_url: releaseArchiveUrl() || null,
        profile_ground_truth: {
          ...dataRelease().profile_ground_truth,
          loaded_manifest_sha256: state.groundTruthManifestProvenance?.sha256 || null,
          loaded_release_id: state.groundTruthManifestProvenance?.release_id || null,
        },
        view_url: currentViewUrl(false, false),
        license: {
          spdx_id: license.spdxId || null,
          name: license.name || null,
          url: license.url || null,
          scope: license.scope,
          fallback_notice: license.spdxId ? null : license.label,
        },
      },
      figure: {
        dataset: state.dataset,
        split: state.split,
        split_id: activeSplitDefinition()?.id || null,
        public_evaluation_case_id: state.profileCase,
        panel_id: panel.id,
        panel_title: panel.title,
        family_id: family?.id || null,
        family_label: family?.label || null,
        placement_mode: family?.placementMode || null,
        station_id: station.id,
        station_label: station.label,
        quantity_id: quantity.id,
        quantity_label: quantity.label,
        coordinate_view: selection.coordinateView,
        x_label: spec?.encoding?.x?.title || station.x_label,
        support_coordinate_id: points[0]?.coordinate_id || null,
        support_coordinate_unit: points[0]?.coordinate_unit || null,
        support_coordinate_identity_sha256: points[0]?.coordinate_identity_sha256 || null,
        display_coordinate_id: points[0]?.display_coordinate_id || null,
        display_coordinate_unit: points[0]?.display_coordinate_unit || null,
        display_coordinate_identity_sha256: points[0]?.display_coordinate_identity_sha256 || null,
        y_label: quantity.y_label,
        requested_model_ids: figureRows().map((row) => row.id),
        plotted_model_ids: Array.from(new Set(points.map((point) => point.submission_id).filter(Boolean))),
        processing: verifiedNativeGroundTruthCase(state.groundTruthCase)
          ? "Checksum- and identity-bound submitted/reference support and display coordinates with values in native source order; explicit support segments preserve unsupported-sample gaps; no smoothing, interpolation, resampling, sorting, or cross-family fallback"
          : "Finite submitted/reference coordinate-value pairs in source order; no smoothing, interpolation, resampling, or sorting; dropped and source point counts are recorded per row",
        caption: state.figureCaptions.get(`profile-${index}`),
      },
      points,
    };
  }

  function profileDataFilename(index, extension) {
    const panel = activeDataset()?.diagnostic_panels?.[index];
    const selection = panel ? panelSelection(panel) : {};
    return figureFilename(
      `profile-data-${panel?.id || index}-${selection.family || "legacy"}-${state.profileCase}-${selection.station || "station"}-${
        selection.quantity || "quantity"
      }-${selection.coordinateView || "support"}`,
      extension
    );
  }

  function exportProfileData(index, format) {
    const status = element("leaderboard-release-action-status");
    try {
      const payload = profileDataExport(index);
      if (format === "json") {
        downloadText(profileDataFilename(index, "json"), `${JSON.stringify(payload, null, 2)}\n`, "application/json;charset=utf-8");
        return;
      }
      const metadata = payload.provenance;
      const figure = payload.figure;
      const columns = [
        "export_scope",
        "export_row_count",
        "release_id",
        "release_status",
        "release_reproducibility_contract",
        "publication_scope_json",
        "feed_sha256",
        "loaded_feed_sha256",
        "feed_verified",
        "archive_url",
        "profile_ground_truth_json",
        "view_url",
        "release_license_spdx",
        "release_license_name",
        "release_license_url",
        "release_license_scope",
        "dataset",
        "split",
        "split_id",
        "public_evaluation_case_id",
        "panel_id",
        "family_id",
        "placement_mode",
        "station_id",
        "quantity_id",
        "coordinate_view",
        "x_label",
        "support_coordinate_id",
        "support_coordinate_unit",
        "support_coordinate_identity_sha256",
        "display_coordinate_id",
        "display_coordinate_unit",
        "display_coordinate_identity_sha256",
        "processing",
        "series",
        "series_role",
        "line_style",
        "submission_id",
        "rank",
        "series_order",
        "point_index",
        "source_point_index",
        "support_sample_index",
        "raw_native_cell_id",
        "segment_id",
        "segment_ordinal",
        "gap_before",
        "segment_count",
        "unsupported_sample_count",
        "source_point_count",
        "dropped_point_count",
        "representation",
        "scoring_role",
        "support_identity_sha256",
        "placement_receipt_identity_sha256",
        "coordinate_id",
        "coordinate_unit",
        "coordinate_identity_sha256",
        "coordinate",
        "display_coordinate",
        "value_identity_sha256",
        "series_identity_sha256",
        "native_truth_source",
        "native_dataset_revision",
        "source_index_url",
        "source_index_sha256",
        "source_chunk_url",
        "source_chunk_declared_sha256",
        "source_chunk_downloaded_sha256",
        "maintainer_validation_status",
        "validation_scope",
        "model_execution",
        "metric_recomputation",
        "validated_case_set_id",
        "submitted_profile_ground_truth_release_id",
        "submitted_profile_ground_truth_manifest_sha256",
        "validated_profile_ground_truth_release_id",
        "validated_profile_ground_truth_manifest_sha256",
        "maintainer_validation_evidence_sha256",
        "x",
        "y",
      ];
      const lines = [columns.map(csvCell).join(",")];
      payload.points.forEach((point) => {
        const values = [
          metadata.export_scope,
          metadata.row_count,
          metadata.release_id,
          metadata.release_status,
          metadata.reproducibility_contract_version,
          metadata.publication_scope,
          metadata.feed_sha256,
          metadata.loaded_feed_sha256,
          metadata.feed_verified,
          metadata.archive_url,
          metadata.profile_ground_truth,
          metadata.view_url,
          metadata.license.spdx_id,
          metadata.license.name,
          metadata.license.url,
          metadata.license.scope,
          figure.dataset,
          figure.split,
          figure.split_id,
          figure.public_evaluation_case_id,
          figure.panel_id,
          figure.family_id,
          figure.placement_mode,
          figure.station_id,
          figure.quantity_id,
          figure.coordinate_view,
          figure.x_label,
          figure.support_coordinate_id,
          figure.support_coordinate_unit,
          figure.support_coordinate_identity_sha256,
          figure.display_coordinate_id,
          figure.display_coordinate_unit,
          figure.display_coordinate_identity_sha256,
          figure.processing,
          point.series,
          point.series_role,
          point.line_style,
          point.submission_id,
          point.rank,
          point.series_order,
          point.point_index,
          point.source_point_index,
          point.support_sample_index,
          point.raw_native_cell_id,
          point.segment_id,
          point.segment_ordinal,
          point.gap_before,
          point.segment_count,
          point.unsupported_sample_count,
          point.source_point_count,
          point.dropped_point_count,
          point.representation,
          point.scoring_role,
          point.support_identity_sha256,
          point.placement_receipt_identity_sha256,
          point.coordinate_id,
          point.coordinate_unit,
          point.coordinate_identity_sha256,
          point.coordinate,
          point.display_coordinate,
          point.value_identity_sha256,
          point.series_identity_sha256,
          point.native_truth_source,
          point.native_dataset_revision,
          point.source_index_url,
          point.source_index_sha256,
          point.source_chunk_url,
          point.source_chunk_declared_sha256,
          point.source_chunk_downloaded_sha256,
          point.maintainer_validation_status,
          point.validation_scope,
          point.model_execution,
          point.metric_recomputation,
          point.validated_case_set_id,
          point.submitted_profile_ground_truth_release_id,
          point.submitted_profile_ground_truth_manifest_sha256,
          point.validated_profile_ground_truth_release_id,
          point.validated_profile_ground_truth_manifest_sha256,
          point.maintainer_validation_evidence_sha256,
          point.x,
          point.y,
        ];
        lines.push(values.map(csvCell).join(","));
      });
      downloadText(profileDataFilename(index, "csv"), `${lines.join("\n")}\n`, "text/csv;charset=utf-8");
    } catch (error) {
      if (status) status.textContent = `Could not export plotted data: ${error.message}`;
    }
  }

  function scoreNumberHtml(value, digits = 2, suffix = "") {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    const rounded = `${suffix === "%" ? value.toLocaleString("en-US", { maximumFractionDigits: digits }) : formatNumber(value, digits)}${suffix}`;
    const precise = `${value}${suffix}`;
    return `<span data-score-number data-rounded="${escapeHtml(rounded)}" data-precise="${escapeHtml(precise)}">${escapeHtml(rounded)}</span>`;
  }

  function applyScorePrecision(container, precise) {
    container.querySelectorAll("[data-score-number]").forEach((number) => {
      number.textContent = precise ? number.dataset.precise : number.dataset.rounded;
    });
  }

  function scoreMetricLabel(id) {
    let label = plainMetricLabel(metricDefinition(id)) || id;
    if (id.startsWith("volume_") && !/^volume\b/i.test(label)) label = `Volume ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
    return escapeHtml(label);
  }

  function scoreWeightText(weight) {
    return `${(weight * 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
  }

  function scoreContractLink() {
    const dataset = activeDataset();
    if (!dataset?.slug) return "";
    const url = new URL(`benchmark-specs/${dataset.slug}/submission-spec.json`, window.FluidsBenchLeaderboardBaseUrl).href;
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Dataset scoring specification</a>`;
  }

  function scoreScopeNote(policy) {
    if (!policy || policy.unavailable_component_score !== 0 || policy.component_weight_renormalization !== false) return "";
    const ceiling = Number.isFinite(policy.maximum_overall_score) ? ` The maximum overall score is ${policy.maximum_overall_score}.` : "";
    return `<p class="ux-score-note"><strong>Surface-only submissions:</strong> unavailable components contribute zero points. Their weights stay fixed; the remaining weights are not renormalized.${escapeHtml(
      ceiling
    )}</p>`;
  }

  function renderScoreMethodology() {
    const target = element("score-calculation-body");
    if (!target) return;
    const rules = window.FluidsBenchScores.contract(activeDataset());
    if (!rules.available) {
      target.innerHTML = `<p>${escapeHtml(rules.reason)}</p>${scoreContractLink()}`;
      return;
    }
    const transforms = new Set(rules.components.map((component) => component.transform));
    const groups = rules.groups
      .map((group) => `<span>${scoreMetricLabel(group.metricId)} <strong>${escapeHtml(scoreWeightText(group.weight))}</strong></span>`)
      .join("");
    const rows = rules.components
      .map((component) => {
        const definition = metricDefinition(component.metric_id);
        const unit = definition?.unit === "%" ? "%" : definition?.unit ? ` ${definition.unit}` : "";
        const transform =
          component.transform === "bounded_error"
            ? "Error → score"
            : component.transform === "bounded_quality"
              ? "Quality → score"
              : "Physics-null skill";
        const reference =
          component.transform === "bounded_error"
            ? `Cap: ${component.cap}${unit}`
            : component.transform === "physics_null_skill"
              ? `Baseline: ${component.baseline_error}${unit}`
              : "—";
        return `<tr><th scope="row">${scoreMetricLabel(component.metric_id)}</th><td>${escapeHtml(
          scoreWeightText(component.weight)
        )}</td><td>${transform}</td><td>${escapeHtml(reference)}</td></tr>`;
      })
      .join("");
    target.innerHTML = `<p>For ${escapeHtml(
      state.dataset
    )}, convert each reported metric to a component score, multiply by its weight, then add the points.</p>
      <p class="ux-score-formula">Overall score = ∑ (weight × component score)</p>
      ${groups ? `<div class="ux-score-groups" aria-label="Component group weights">${groups}</div>` : ""}
      <div class="ux-score-table-wrap" tabindex="0" role="region" aria-label="Overall score components, scroll horizontally on small screens">
        <table class="ux-score-table"><caption class="leaderboard-sr-only">${escapeHtml(
          state.dataset
        )} component weights and transforms from the loaded release.</caption>
        <thead><tr><th scope="col">Component</th><th scope="col">Weight</th><th scope="col">Conversion</th><th scope="col">Error cap / baseline</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      <dl class="ux-score-rules">
        ${
          transforms.has("bounded_error")
            ? "<div><dt>Error → score</dt><dd>100 × (1 − error / cap), clipped to 0–100. Zero error gives 100; at or above the cap gives 0; values in between are linear. The error and cap use the same units.</dd></div>"
            : ""
        }
        ${
          transforms.has("bounded_quality")
            ? "<div><dt>Quality → score</dt><dd>100 × R², with R² clipped to 0–1. Negative R² contributes zero points.</dd></div>"
            : ""
        }
        ${
          transforms.has("physics_null_skill")
            ? "<div><dt>Physics-null skill</dt><dd>100 × (1 − error / baseline error). This is not clipped: a result worse than the frozen baseline has negative skill.</dd></div>"
            : ""
        }
      </dl>
      ${scoreScopeNote(rules.surfaceOnlyPolicy)}
      ${rules.groupReason ? `<p class="ux-score-note">${escapeHtml(rules.groupReason)}</p>` : ""}
      <p class="ux-score-note">The overall score is not a percentage accuracy. Calculations use the reported values before display rounding.${
        groups ? " Group summaries use these same component weights and are not added a second time." : ""
      } Open a model’s Score breakdown to see its contributions.</p>
      <p class="ux-score-source">${scoreContractLink()}</p>`;
  }

  function scoreBreakdownHtml(row) {
    const result = window.FluidsBenchScores.breakdown(activeDataset(), row);
    const rows = result.components
      .map((component) => {
        const definition = metricDefinition(component.metric_id);
        const unit = definition?.unit ? ` ${definition.unit}` : "";
        const raw =
          component.status === "scope_unavailable"
            ? '<span class="ux-score-missing">Unavailable for this scope</span>'
            : component.status === "missing"
              ? '<span class="ux-score-missing">Not reported</span>'
              : component.status === "invalid"
                ? '<span class="ux-score-missing">Invalid value</span>'
                : scoreNumberHtml(component.raw, definition?.digits ?? 3, unit);
        return `<tr><th scope="row">${scoreMetricLabel(component.metric_id)}</th><td>${raw}</td><td>${scoreNumberHtml(component.score)}${
          component.status === "scope_unavailable" ? " <small>(fixed)</small>" : ""
        }</td><td>${scoreNumberHtml(component.weight * 100, 2, "%")}</td><td>${scoreNumberHtml(component.contribution)}</td></tr>`;
      })
      .join("");
    const warning = result.status !== "match";
    return `<details class="leaderboard-details-disclosure ux-score-breakdown">
      <summary>Score breakdown</summary>
      <div class="leaderboard-details-disclosure-body">
        <div class="ux-score-toolbar"><button class="leaderboard-action-button" type="button" data-open-score-methodology>Weights and formula →</button>${
          rows ? '<label><input type="checkbox" data-score-precision> Show full precision</label>' : ""
        }</div>
        ${
          rows
            ? `<div class="ux-score-table-wrap" tabindex="0" role="region" aria-label="Model score contributions, scroll horizontally on small screens"><table class="ux-score-table">
          <caption class="leaderboard-sr-only">${escapeHtml(row.model)} score breakdown</caption>
          <thead><tr><th scope="col">Component</th><th scope="col">Reported metric</th><th scope="col">Component score</th><th scope="col">Weight</th><th scope="col">Points contributed</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><th colspan="4" scope="row">Calculated total</th><td>${scoreNumberHtml(
            result.total
          )}</td></tr><tr><th colspan="4" scope="row">Recorded overall score</th><td>${scoreNumberHtml(result.recorded)}</td></tr></tfoot>
        </table></div>`
            : `<p>Recorded overall score: ${scoreNumberHtml(result.recorded)}</p>`
        }
        <p class="ux-score-status${warning ? " is-unavailable" : ""}" role="status">${escapeHtml(result.reason)}</p>
        ${
          row.prediction_scope === "surface_only" && result.components.some((component) => component.status === "scope_unavailable")
            ? scoreScopeNote(result.rules.surfaceOnlyPolicy)
            : ""
        }
        ${
          rows
            ? '<p class="ux-score-note">Points contributed = component score × weight. Calculated from the reported metrics at full precision; rounded rows may not add up exactly.</p>'
            : ""
        }
      </div>
    </details>`;
  }

  function openScoreMethodology() {
    element("details-dialog")?.close();
    hideHelp();
    activateWorkspace("methodology");
    const panel = element("leaderboard-methodology");
    if (panel) panel.open = true;
    const calculation = element("score-calculation");
    if (!calculation) return;
    calculation.open = true;
    calculation.querySelector("summary")?.focus();
    calculation.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function renderMetricDefinitions() {
    const list = element("metric-definitions-list");
    if (window.MathJax?.typesetClear) window.MathJax.typesetClear([list]);
    list.replaceChildren();
    const policy = rankingPolicy();
    const rankMetric = metricDefinition(policy.metric_id);
    element("metric-definitions-intro").textContent = `Metrics shown for ${
      state.dataset
    }. The selected dataset controls the table columns and all chart choices. ${
      plainMetricLabel(rankMetric) || policy.metric_id
    } is displayed and ranked at ${policy.decimal_places} decimal place${policy.decimal_places === 1 ? "" : "s"}.`;
    const headlineIds = headlineMetricIds();
    activeMetricDefinitions().forEach((definition) => {
      const wrapper = document.createElement("details");
      wrapper.className = `leaderboard-metric-definition ${groupClass(metricColumnGroup(definition))}`;
      const summary = document.createElement("summary");
      const label = document.createElement("span");
      appendFormattedMetricLabel(label, definition.label);
      if (definition.unit) label.appendChild(document.createTextNode(` (${definition.unit})`));
      const metadata = document.createElement("span");
      metadata.className = "leaderboard-metric-definition-meta";
      metadata.textContent = `${definition.direction === "lower" ? "Lower" : "Higher"} is better`;
      if (headlineIds.has(definition.id)) metadata.appendChild(definitionStatus("Headline"));
      summary.append(label, metadata);
      const description = document.createElement("div");
      description.className = "leaderboard-metric-definition-body";
      const explanation = document.createElement("p");
      explanation.appendChild(document.createTextNode(`${metricDescription(definition)} `));
      const direction = document.createElement("strong");
      direction.textContent = `${definition.direction === "lower" ? "Lower" : "Higher"} is better.`;
      explanation.appendChild(direction);
      description.appendChild(explanation);
      if (definition.equation) {
        const line = document.createElement("div");
        line.className = "leaderboard-metric-equation";
        line.textContent = `\\(${definition.equation}\\)`;
        description.appendChild(line);
      }
      wrapper.append(summary, description);
      list.appendChild(wrapper);
    });
    const typeset = () => {
      const result = window.MathJax?.typesetPromise?.([list]);
      result?.catch((error) => console.error("Could not typeset metrics", error));
    };
    if (window.MathJax?.typesetPromise) typeset();
    else element("MathJax-script")?.addEventListener("load", typeset, { once: true });
  }

  function definitionStatus(text) {
    const status = document.createElement("span");
    status.className = "leaderboard-definition-status";
    status.textContent = text;
    return status;
  }

  function splitCountsText(split) {
    const counts = [
      ["Train", split.train_count],
      ["Validation", split.validation_count],
      ["Test", split.test_count],
    ]
      .filter(([, value]) => finiteNumber(value) !== null)
      .map(([label, value]) => `${label}: ${Number(value).toLocaleString()}`);
    return counts.join(" / ");
  }

  function renderSplitDefinitions() {
    const list = element("split-definitions-list");
    list.replaceChildren();
    element("split-definitions-intro").textContent =
      `Splits available for ${state.dataset}. Changing any Split selector updates the table and every chart together.`;
    splitOptions().forEach((split) => {
      const wrapper = document.createElement("div");
      wrapper.className = "metric-group-neutral";
      const term = document.createElement("dt");
      term.appendChild(document.createTextNode(split.label || split.name));
      if (split.name === state.split) term.appendChild(definitionStatus("Selected"));
      const description = document.createElement("dd");
      description.appendChild(document.createTextNode(split.description || "No description supplied."));
      const counts = splitCountsText(split);
      if (counts) {
        const meta = document.createElement("span");
        meta.className = "leaderboard-definition-meta";
        meta.textContent = counts;
        description.appendChild(meta);
      }
      wrapper.append(term, description);
      list.appendChild(wrapper);
    });
  }

  function renderTrainingDefinitions() {
    const list = element("training-definitions-list");
    list.replaceChildren();
    element("training-definitions-intro").textContent =
      `Training values defined by the planned submission format. Each status is based on the loaded ${state.dataset} data and the selected ${state.split} table.`;
    const selectedRegimes = new Set(rowsForActiveSplit().map((row) => row.training_regime));
    const datasetRegimes = new Set((state.rows.get(state.dataset) || []).map((row) => row.training_regime));
    trainingRegimeDefinitions().forEach((definition) => {
      const wrapper = document.createElement("div");
      wrapper.className = "metric-group-neutral";
      const term = document.createElement("dt");
      term.appendChild(document.createTextNode(definition.label));
      const status = selectedRegimes.has(definition.id)
        ? "Shown in selected table"
        : datasetRegimes.has(definition.id)
          ? `Used in another ${state.dataset} split`
          : "Planned submission value";
      term.appendChild(definitionStatus(status));
      const description = document.createElement("dd");
      description.textContent = definition.description;
      wrapper.append(term, description);
      list.appendChild(wrapper);
    });
  }

  function renderDefinitions() {
    renderScoreMethodology();
    renderMetricDefinitions();
    renderSplitDefinitions();
    renderTrainingDefinitions();
  }

  function renderRankingPolicy() {
    const target = element("leaderboard-ranking-policy");
    if (!target) return;
    const policy = rankingPolicy();
    const definition = metricDefinition(policy.metric_id);
    const rows = rowsForActiveSplit();
    const rankedCount = rows[0] ? rowRanking(rows[0])?.ranked_result_count : 0;
    target.textContent = `Ranking policy for data release ${dataRelease().id || "unversioned"}, ${state.dataset} / ${state.split}: ${
      plainMetricLabel(definition) || policy.metric_id
    }, ${policy.direction} is better, compared at ${policy.decimal_places} decimal place${
      policy.decimal_places === 1 ? "" : "s"
    } using decimal-half-up rounding. Competition ranking gives tied values the same position (1, 2, 2, 4). The rank covers ${
      rankedCount || "all"
    } ranked result${rankedCount === 1 ? "" : "s"} in this exact dataset, split, and release; model-type filters and table sorting do not change it.`;
  }

  function detailsMetricGroups(row) {
    const groups = new Map();
    activeMetricDefinitions().forEach((definition) => {
      if (!groups.has(definition.group_label)) groups.set(definition.group_label, []);
      groups.get(definition.group_label).push({ definition, value: row.metricValues[definition.id] });
    });
    return groups;
  }

  function detailsRow(label, value, formatMetricLabel = false) {
    const renderedLabel = formatMetricLabel ? formattedMetricLabelHtml(label) : escapeHtml(label);
    const renderedValue = value === null || value === undefined || value === "" ? "Not supplied" : value;
    return `<div><dt>${renderedLabel}</dt><dd>${escapeHtml(renderedValue)}</dd></div>`;
  }

  function detailsLink(label, value) {
    const url = safeHttpUrl(value);
    return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>` : "";
  }

  function methodologyArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function methodologyBoolean(value) {
    if (value === true) return "Yes";
    if (value === false) return "No";
    return null;
  }

  function methodologyCount(value) {
    return finiteNumber(value) === null ? null : formatNumber(value, 0);
  }

  function methodologyComponentIds(value) {
    const ids = methodologyArray(value).filter((item) => typeof item === "string" && item.trim());
    return ids.length ? ids.join(", ") : null;
  }

  function methodologyCard(title, rows, description = "") {
    return `<article class="leaderboard-methodology-card">
      <h6>${escapeHtml(title)}</h6>
      <dl>${rows.join("")}</dl>
      ${description ? `<p>${escapeHtml(description)}</p>` : ""}
    </article>`;
  }

  function methodologyCards(items, render, emptyText) {
    if (!items.length) return `<p class="details-note">${escapeHtml(emptyText)}</p>`;
    return `<div class="leaderboard-methodology-card-grid">${items.map(render).join("")}</div>`;
  }

  function methodologyArchitectureHtml(methodology) {
    const architecture = record(methodology.architecture);
    const components = methodologyArray(architecture.components);
    const hyperparameters = methodologyArray(architecture.key_hyperparameters);
    const inputs = methodologyArray(architecture.input_features);
    const outputs = methodologyArray(architecture.predicted_fields);
    const componentCards = methodologyCards(
      components,
      (component) =>
        methodologyCard(
          `${component.id || "Unnamed component"} — ${component.family || "family not supplied"}`,
          [detailsRow("Role", component.role), detailsRow("Parameters", methodologyCount(component.parameter_count))],
          component.description
        ),
      "No architecture components were supplied."
    );
    const hyperparameterCards = methodologyCards(
      hyperparameters,
      (parameter) =>
        methodologyCard(
          parameter.name || parameter.id || "Unnamed hyperparameter",
          [detailsRow("Value", parameter.value), detailsRow("Components", methodologyComponentIds(parameter.component_ids))],
          parameter.description
        ),
      "No key hyperparameters were supplied."
    );
    const inputCards = methodologyCards(
      inputs,
      (input) =>
        methodologyCard(
          input.name || input.id || "Unnamed input",
          [
            detailsRow("Domain", humanize(input.domain)),
            detailsRow("Components per entity", methodologyCount(input.component_count)),
            detailsRow("Architecture components", methodologyComponentIds(input.component_ids)),
          ],
          input.description
        ),
      "No model inputs were supplied."
    );
    const outputCards = methodologyCards(
      outputs,
      (output) =>
        methodologyCard(
          output.field_id || "Unnamed predicted field",
          [
            detailsRow("Domain", humanize(output.domain)),
            detailsRow("Components per entity", methodologyCount(output.component_count)),
            detailsRow("Production", humanize(output.production)),
            detailsRow("Architecture components", methodologyComponentIds(output.component_ids)),
          ],
          output.description
        ),
      "No predicted fields were supplied."
    );
    return `<details class="leaderboard-methodology-disclosure">
      <summary>Architecture components, hyperparameters, inputs and outputs</summary>
      <div class="leaderboard-methodology-detail-body">
        <h5>Components</h5>${componentCards}
        <h5>Key hyperparameters</h5>${hyperparameterCards}
        <h5>Input features</h5>${inputCards}
        <h5>Predicted fields</h5>${outputCards}
      </div>
    </details>`;
  }

  function methodologyOptimizerSummary(procedure) {
    const optimizers = methodologyArray(record(procedure).optimizers);
    if (!optimizers.length) return null;
    return optimizers
      .map((optimizer) => {
        const fields = [optimizer.name];
        if (finiteNumber(optimizer.learning_rate) !== null) fields.push(`learning rate ${optimizer.learning_rate}`);
        if (optimizer.schedule) fields.push(optimizer.schedule);
        return fields.filter(Boolean).join(" · ");
      })
      .join("; ");
  }

  function methodologyDurationSummary(procedure) {
    const duration = record(record(procedure).duration);
    const values = [];
    if (finiteNumber(duration.epochs) !== null) values.push(`${formatNumber(duration.epochs, 0)} epochs`);
    if (finiteNumber(duration.optimizer_steps) !== null) values.push(`${formatNumber(duration.optimizer_steps, 0)} optimizer steps`);
    if (duration.description) values.push(duration.description);
    return values.length ? values.join(" · ") : null;
  }

  function methodologyTrainingStageCard(stage) {
    const procedure = record(stage.procedure);
    const loss = record(procedure.loss);
    const batch = record(procedure.batch);
    const compute = record(stage.compute);
    const batchSummary = finiteNumber(batch.value) === null ? null : `${formatNumber(batch.value, 0)} ${batch.unit || "items"}`;
    const rows = [
      detailsRow("Status", humanize(stage.status)),
      detailsRow("Architecture components", methodologyComponentIds(stage.component_ids)),
      detailsRow("Procedure", humanize(procedure.kind)),
      detailsRow("Procedure description", procedure.description),
      detailsRow("Loss", loss.description),
      detailsRow("Loss weighting", loss.weighting),
      detailsRow("Optimizer", methodologyOptimizerSummary(procedure)),
      detailsRow("Batch", batchSummary),
      detailsRow("Gradient accumulation", methodologyCount(batch.gradient_accumulation_steps)),
      detailsRow("Duration", methodologyDurationSummary(procedure)),
      detailsRow("Run count", methodologyCount(stage.run_count)),
      detailsRow("Stochastic", methodologyBoolean(stage.stochastic)),
      detailsRow("Random seeds", methodologyArray(stage.random_seeds).join(", ") || null),
      detailsRow("Upstream reference", stage.upstream_reference),
      detailsRow("Training hardware", compute.hardware),
      detailsRow("Maximum concurrent devices", methodologyCount(compute.max_concurrent_device_count)),
      detailsRow(
        "Campaign wall time",
        finiteNumber(compute.campaign_wall_time_hours) === null ? null : `${formatNumber(compute.campaign_wall_time_hours, 2)} hours`
      ),
      detailsRow(
        "Aggregate device time",
        finiteNumber(compute.aggregate_device_hours) === null ? null : `${formatNumber(compute.aggregate_device_hours, 2)} device-hours`
      ),
      detailsRow("Compute measurement notes", compute.measurement_notes),
    ];
    return methodologyCard(stage.id || "Unnamed training stage", rows, stage.description);
  }

  function methodologyCheckpointCard(checkpoint) {
    return methodologyCard(
      checkpoint.id || "Unnamed checkpoint",
      [
        detailsRow("Architecture components", methodologyComponentIds(checkpoint.component_ids)),
        detailsRow("SHA-256", checkpoint.sha256),
        detailsRow("Digest scope", humanize(checkpoint.digest_scope)),
        detailsRow("Bytes hashed", checkpoint.bytes_description),
        detailsRow("Role", checkpoint.role),
        detailsRow("Selection rule", checkpoint.selection_rule),
      ],
      ""
    );
  }

  function methodologyTrainingHtml(methodology) {
    const dataHandling = record(methodology.data_handling);
    const trainingStages = methodologyArray(record(methodology.training).stages);
    const checkpoints = methodologyArray(methodology.checkpoints);
    const inference = record(methodology.inference_compute);
    const trainingCards = methodologyCards(trainingStages, methodologyTrainingStageCard, "No training stages were supplied.");
    const checkpointCards = methodologyCards(
      checkpoints,
      methodologyCheckpointCard,
      "No retained model checkpoint is associated with this methodology record."
    );
    const measuredInference = inference.status === "measured";
    return `<details class="leaderboard-methodology-disclosure">
      <summary>Data handling, training, checkpoints and compute</summary>
      <div class="leaderboard-methodology-detail-body">
        <h5>Data handling</h5><dl>
          ${detailsRow("Normalization", dataHandling.normalization)}
          ${detailsRow("Preprocessing", dataHandling.preprocessing)}
          ${detailsRow("Sampling", dataHandling.sampling)}
        </dl>
        <h5>Training stages</h5>${trainingCards}
        <h5>Loaded checkpoints</h5>${checkpointCards}
        <h5>Inference compute</h5><dl>
          ${detailsRow("Measurement status", humanize(inference.status))}
          ${detailsRow("Reason not measured", inference.reason)}
          ${detailsRow("Hardware", inference.hardware)}
          ${detailsRow("Maximum concurrent devices", methodologyCount(inference.max_concurrent_device_count))}
          ${detailsRow("Cases timed", methodologyCount(inference.case_count))}
          ${detailsRow(
            "Campaign wall time",
            measuredInference && finiteNumber(inference.campaign_wall_time_seconds) !== null
              ? `${formatNumber(inference.campaign_wall_time_seconds, 2)} seconds`
              : null
          )}
          ${detailsRow(
            "Aggregate device time",
            measuredInference && finiteNumber(inference.aggregate_device_time_seconds) !== null
              ? `${formatNumber(inference.aggregate_device_time_seconds, 2)} device-seconds`
              : null
          )}
          ${detailsRow("Includes preprocessing", methodologyBoolean(inference.includes_preprocessing))}
          ${detailsRow("Includes scoring mapping", methodologyBoolean(inference.includes_mapping))}
          ${detailsRow("Measurement notes", inference.measurement_notes)}
        </dl>
      </div>
    </details>`;
  }

  function methodologySectionHtml(row) {
    const methodology = record(row.methodology);
    if (!Object.keys(methodology).length) {
      return `<section class="leaderboard-methodology"><h4>Detailed model methodology</h4><p class="details-note">Detailed methodology was not recorded under this result's schema.</p></section>`;
    }
    const architecture = record(methodology.architecture);
    const prototype = methodology.record_kind === "prototype_fixture";
    const noteTitle = prototype
      ? "Prototype fixture metadata — not author-verified"
      : methodology.record_kind === "format_example"
        ? "Illustrative format example — not a benchmark result"
        : "Submitter-reported methodology";
    return `<section class="leaderboard-methodology">
      <h4>Detailed model methodology</h4>
      <div class="leaderboard-methodology-note${prototype ? " is-prototype" : ""}" role="note">
        <strong>${escapeHtml(noteTitle)}</strong>
        <p>${escapeHtml(methodology.record_note || "No record note was supplied.")}</p>
      </div>
      <dl>
        ${detailsRow("Record format", methodology.format)}
        ${detailsRow("Record kind", humanize(methodology.record_kind))}
        ${detailsRow("Architecture", architecture.description)}
        ${detailsRow("Total parameters", methodologyCount(architecture.total_parameter_count))}
        ${detailsRow("Parameter-count basis", humanize(architecture.parameter_count_basis))}
        ${detailsRow("Submitter-verified trainable parameters", methodologyCount(architecture.submitter_trainable_parameter_count))}
      </dl>
      ${methodologyArchitectureHtml(methodology)}
      ${methodologyTrainingHtml(methodology)}
    </section>`;
  }

  function evaluationEvidenceUrl(row) {
    const indexFile = row.profile_data?.index_file;
    const evidenceFile = row.evaluation?.evidence_file;
    if (!indexFile || !evidenceFile) return "";
    try {
      return safeHttpUrl(new URL(`../${evidenceFile}`, fileUrl(indexFile)).href);
    } catch (_error) {
      return "";
    }
  }

  function maintainerValidation(row) {
    const validation = row?.maintainer_validation || row?.approval?.validation;
    return validation && typeof validation === "object" ? validation : {};
  }

  function validationMetadata(row) {
    const validation = maintainerValidation(row);
    return {
      maintainer_validation_status: validation.status || null,
      maintainer_validation_schema_version: validation.schema_version || null,
      validation_scope: validation.validation_scope || null,
      model_execution: validation.model_execution || null,
      metric_recomputation: validation.metric_recomputation || null,
      validated_case_set_id: validation.case_set_id || null,
      submitted_profile_ground_truth_release_id: row?.profile_data?.profile_ground_truth_release_id || null,
      submitted_profile_ground_truth_manifest_sha256: row?.profile_data?.profile_ground_truth_manifest_sha256 || null,
      validated_profile_ground_truth_release_id: validation.profile_ground_truth_release_id || null,
      validated_profile_ground_truth_manifest_sha256: validation.profile_ground_truth_manifest_sha256 || null,
      validated_scoring_support_release_id: validation.scoring_support_release_id || null,
      validated_scoring_support_manifest_sha256: validation.scoring_support_manifest_sha256 || null,
      validated_discretization_sha256: validation.discretization_sha256 || null,
      validated_case_metrics_sha256: validation.case_metrics_sha256 || null,
      maintainer_validation_evidence_sha256: validation.evidence_sha256 || null,
    };
  }

  function validationEvidenceUrl(row) {
    const evidencePath = maintainerValidation(row).evidence_path;
    if (!evidencePath) return "";
    try {
      return safeHttpUrl(fileUrl(evidencePath));
    } catch (_error) {
      return "";
    }
  }

  function validationEvidenceCheck(row) {
    const url = validationEvidenceUrl(row);
    return url ? state.validationEvidenceChecks.get(url) : null;
  }

  function validationEvidenceVerified(row) {
    const validation = maintainerValidation(row);
    const check = validationEvidenceCheck(row);
    return Boolean(check?.status === "verified" && check.sha256 === validation.evidence_sha256);
  }

  function declaredClaimEligibility(row = null) {
    if (!row) {
      const eligible = dataRelease().status === "official";
      return {
        academic_citation: eligible,
        promotion: eligible,
        reason_code: eligible ? "eligible" : "release_not_official",
        reason: eligible
          ? "This release is declared eligible for citation."
          : "This data release is not declared eligible for academic citation or promotion.",
        source: "data_release",
      };
    }
    if (!isLatestRevision(row)) {
      return {
        academic_citation: false,
        promotion: false,
        reason_code: "superseded_result_revision",
        reason: "This revision has been superseded and is retained for history; cite its original immutable release record.",
        source: "revision_history",
      };
    }
    const declared = row.claim_eligibility;
    if (!state.feedVerified || !declared || typeof declared !== "object") {
      return {
        academic_citation: false,
        promotion: false,
        reason_code: "claim_eligibility_missing",
        reason: "The hash-verified feed does not contain generated claim eligibility for this result.",
        source: "unavailable",
      };
    }
    return {
      academic_citation: declared.academic_citation === true,
      promotion: declared.promotion === true,
      reason_code: declared.reason_code || (declared.academic_citation && declared.promotion ? "eligible" : "not_eligible"),
      reason: declared.reason || "No declared eligibility reason was supplied.",
      source: verifiedClaimRecord(row) ? "verified_claim_record" : "hash_verified_feed",
    };
  }

  function claimEligibility(row = null) {
    const release = dataRelease();
    const blockers = [];
    const addBlocker = (code, reason, targets = ["academic_citation", "promotion"]) => {
      blockers.push({ code, reason, targets });
    };
    if (row && !isLatestRevision(row)) {
      addBlocker(
        "superseded_result_revision",
        "This revision is preserved for history but is not ranked in the current release; use its original immutable release to cite its former rank."
      );
    }
    if (release.status !== "official") addBlocker("release_not_official", "This data release is not official.");
    if (release.status === "official" && !expectedManifestSha256) {
      addBlocker(
        "manifest_pin_not_configured",
        "This page does not publish a SHA-256 pin for the leaderboard manifest; use the immutable release snapshot."
      );
    } else if (expectedManifestSha256 && !state.manifestPinVerified) {
      addBlocker("manifest_pin_not_verified", "The loaded leaderboard manifest bytes have not matched the publication-time SHA-256 pin.");
    }
    if (!supportedReproducibilityContract(release.reproducibility_contract_version)) {
      addBlocker(
        "release_contract_mismatch",
        `The release does not use a supported open-reproducibility contract (${Object.values(reproducibilityContractVersions).join(" or ")}).`
      );
    }
    if (!state.feedVerified) addBlocker("feed_not_verified", "The leaderboard feed bytes have not been SHA-256 verified.");
    if (!groundTruthManifestVerified()) {
      addBlocker("ground_truth_manifest_not_verified", "The release's public ground-truth manifest has not been SHA-256 verified.");
    }
    if (!releaseViewUrl()) {
      addBlocker("release_view_unavailable", "This release has no immutable release-view URL for later verification.");
    }
    if (state.releaseMismatch) {
      addBlocker("requested_release_not_loaded", "The release requested by this URL is not the release currently loaded.");
    }

    if (row && !blockers.length) {
      const validation = maintainerValidation(row);
      const profile = row.profile_data || {};
      const evaluation = row.evaluation || {};
      const expectedGroundTruth = release.profile_ground_truth || {};
      const loadedGroundTruth = state.groundTruthManifestProvenance || {};
      const schemaMajor = submissionSchemaMajor(row);
      const expectedContract = expectedReproducibilityContract(row);
      // Code, model, environment, and artifact-documentation fields are optional evidence.
      // Claim eligibility is bound to the contract and validated submitted data, not artifact presence.
      if (rowRanking(row)?.source === "computed_fallback_generated_release_mismatch") {
        addBlocker(
          "generated_ranking_mismatch",
          "The generated release ranking does not match an independent full-split competition-ranking calculation."
        );
      }
      if (!row.claim_eligibility || typeof row.claim_eligibility !== "object") {
        addBlocker("claim_eligibility_missing", "The hash-verified feed row does not contain generated claim eligibility metadata.");
      }
      if (
        row.approval?.status !== "approved" ||
        ![2, 3].includes(schemaMajor) ||
        row.schema_version !== `${schemaMajor}.0` ||
        row.reproducibility?.contract_version !== expectedContract ||
        release.reproducibility_contract_version !== expectedContract
      ) {
        addBlocker("result_not_approved", "The result is not an approved schema-v2 or schema-v3 open-contract submission.");
      }
      if (
        validation.schema_version !== `${schemaMajor}.0` ||
        validation.contract_version !== expectedContract ||
        validation.status !== "validated" ||
        validation.validation_scope !== "submitted_data_only" ||
        validation.model_execution !== "not_performed" ||
        validation.metric_recomputation !== "not_performed"
      ) {
        addBlocker("validation_contract_mismatch", "The maintainer validation metadata does not match the submitted-data-only contract.");
      }
      if (schemaMajor >= 3) {
        const support = scoringSupportSummary(row);
        const datasetSupport = record(activeDataset()?.scoring_support);
        const ownerApproval = record(datasetSupport.owner_approval);
        const ownerApprovalComplete = ["approved_by", "approved_at", "pull_request_url"].every(
          (field) => typeof ownerApproval[field] === "string" && ownerApproval[field].trim()
        );
        if (
          support.status !== "official" ||
          datasetSupport.status !== "official" ||
          !ownerApprovalComplete ||
          !support.release_id ||
          support.release_id !== datasetSupport.release_id ||
          !support.manifest_url ||
          support.manifest_url !== datasetSupport.manifest_url ||
          validation.scoring_support_release_id !== support.release_id ||
          !support.manifest_sha256 ||
          support.manifest_sha256 !== datasetSupport.manifest_sha256 ||
          validation.scoring_support_manifest_sha256 !== support.manifest_sha256 ||
          validation.discretization_sha256 !== bindingSha256(discretizationBinding(row)) ||
          validation.case_metrics_sha256 !== bindingSha256(caseMetricsBinding(row))
        ) {
          addBlocker(
            "spatial_evidence_binding_mismatch",
            "The schema-v3 result is not bound to owner-approved official scoring support, discretization, case metrics, and matching validation hashes."
          );
        }
      }
      if (
        !validation.profile_ground_truth_release_id ||
        validation.profile_ground_truth_release_id !== expectedGroundTruth.release_id ||
        validation.profile_ground_truth_release_id !== loadedGroundTruth.release_id ||
        validation.profile_ground_truth_release_id !== profile.profile_ground_truth_release_id ||
        !validation.profile_ground_truth_manifest_sha256 ||
        validation.profile_ground_truth_manifest_sha256 !== expectedGroundTruth.manifest_sha256 ||
        validation.profile_ground_truth_manifest_sha256 !== loadedGroundTruth.sha256 ||
        validation.profile_ground_truth_manifest_sha256 !== profile.profile_ground_truth_manifest_sha256 ||
        !validation.case_set_id ||
        validation.case_set_id !== profile.case_set_id
      ) {
        addBlocker(
          "ground_truth_binding_mismatch",
          "The result and validation record do not bind to this release's public ground truth and case set."
        );
      }
      if (
        !validation.profile_index_sha256 ||
        validation.profile_index_sha256 !== profile.index_sha256 ||
        !validation.evaluation_evidence_sha256 ||
        validation.evaluation_evidence_sha256 !== evaluation.evidence_sha256 ||
        !validation.evidence_sha256 ||
        validation.evidence_sha256 !== row.approval?.validation?.evidence_sha256
      ) {
        addBlocker("submitted_data_binding_mismatch", "The submitted profile, evaluation, approval, and validation hashes do not agree.");
      }
      if (state.claimsIndexProvenance?.status !== "verified") {
        const reason =
          state.claimsIndexProvenance?.status === "failed"
            ? `The release claim index failed verification: ${state.claimsIndexProvenance.error}`
            : state.claimsIndexProvenance?.status === "loading"
              ? "The release claim index is still being verified."
              : "The release does not provide a checksum-verified claim index.";
        addBlocker("claim_index_not_verified", reason);
      }
      const recordCheck = claimRecordCheck(row);
      if (recordCheck?.status !== "verified") {
        const reason =
          recordCheck?.status === "failed"
            ? `The result claim record failed verification: ${recordCheck.error}`
            : recordCheck?.status === "loading"
              ? "The result claim record is still being verified."
              : recordCheck?.status === "not_listed"
                ? "This result is not listed in the release claim index."
                : "The result claim record has not yet been verified.";
        addBlocker("claim_record_not_verified", reason);
      }
      const validationCheck = validationEvidenceCheck(row);
      if (!validationEvidenceVerified(row)) {
        const reason =
          validationCheck?.status === "failed"
            ? `The maintainer validation record failed verification: ${validationCheck.error}`
            : validationCheck?.status === "loading"
              ? "The maintainer validation record is still being verified."
              : "The maintainer validation record has not yet been checksum-verified.";
        addBlocker("validation_record_not_verified", reason);
      }
    }

    const reasonsFor = (target) => blockers.filter((blocker) => blocker.targets.includes(target));
    const academicBlockers = reasonsFor("academic_citation");
    const promotionBlockers = reasonsFor("promotion");
    const declared = declaredClaimEligibility(row);
    const uniqueBlockers = blockers.filter(
      (blocker, index) => blockers.findIndex((candidate) => candidate.code === blocker.code && candidate.reason === blocker.reason) === index
    );
    return {
      academic_citation: declared.academic_citation && academicBlockers.length === 0,
      promotion: declared.promotion && promotionBlockers.length === 0,
      declared,
      browser_verification: {
        passed: uniqueBlockers.length === 0,
        status: uniqueBlockers.length === 0 ? "verified" : "not_verified",
        reason_codes: uniqueBlockers.map((blocker) => blocker.code),
        reasons: uniqueBlockers.map((blocker) => blocker.reason),
      },
      reason_code: !declared.academic_citation || !declared.promotion ? declared.reason_code : uniqueBlockers[0]?.code || "eligible",
      reason:
        !declared.academic_citation || !declared.promotion
          ? declared.reason
          : uniqueBlockers.map((blocker) => blocker.reason).join(" ") || "Eligible for this exact release, dataset, and split.",
      reasons: uniqueBlockers,
      academic_reasons: academicBlockers,
      promotion_reasons: promotionBlockers,
    };
  }

  async function ensureValidationEvidence(row) {
    const url = validationEvidenceUrl(row);
    const validation = maintainerValidation(row);
    const approvalSha256 = row.approval?.validation?.evidence_sha256;
    if (!url || !validation.evidence_sha256 || !approvalSha256) return;
    const existing = state.validationEvidenceChecks.get(url);
    if (existing && existing.status !== "loading") return;
    if (state.validationEvidencePromises.has(url)) return state.validationEvidencePromises.get(url);
    state.validationEvidenceChecks.set(url, { status: "loading", sha256: null, error: null });
    const promise = (async () => {
      try {
        const loaded = await fetchJsonWithProvenance(url, `${rowLabel(row)} validation record`);
        if (!loaded.sha256 || loaded.sha256 !== validation.evidence_sha256 || loaded.sha256 !== approvalSha256) {
          throw new Error("validation record checksum does not match the hash-verified leaderboard feed");
        }
        const bindings = [
          ["schema_version", validation.schema_version],
          ["submission_id", row.id],
          ["dataset_id", row.dataset_id],
          ["split_id", row.split_id],
          ["status", validation.status],
          ["contract_version", validation.contract_version],
          ["reference_version", validation.reference_version],
          ["case_set_id", validation.case_set_id],
          ["profile_ground_truth_release_id", validation.profile_ground_truth_release_id],
          ["profile_ground_truth_manifest_sha256", validation.profile_ground_truth_manifest_sha256],
          ["validated_by", validation.validated_by],
          ["validated_at", validation.validated_at],
          ["validation_scope", validation.validation_scope],
          ["model_execution", validation.model_execution],
          ["metric_recomputation", validation.metric_recomputation],
          ["reviewed_submission_sha256", validation.reviewed_submission_sha256],
          ["evaluation_evidence_sha256", validation.evaluation_evidence_sha256],
          ["profile_index_sha256", validation.profile_index_sha256],
        ];
        if (submissionSchemaMajor(row) >= 3) {
          bindings.push(
            ["scoring_support_release_id", validation.scoring_support_release_id],
            ["scoring_support_manifest_sha256", validation.scoring_support_manifest_sha256],
            ["discretization_sha256", validation.discretization_sha256],
            ["case_metrics_sha256", validation.case_metrics_sha256]
          );
        }
        const mismatch = bindings.find(([key, expected]) => !expected || loaded.data?.[key] !== expected);
        if (mismatch) throw new Error(`validation record ${mismatch[0]} does not match the hash-verified leaderboard feed`);
        state.validationEvidenceChecks.set(url, { status: "verified", sha256: loaded.sha256, error: null });
      } catch (error) {
        state.validationEvidenceChecks.set(url, { status: "failed", sha256: null, error: error.message });
        console.error(error);
      } finally {
        state.validationEvidencePromises.delete(url);
        refreshCitationEligibilityUi();
      }
    })();
    state.validationEvidencePromises.set(url, promise);
    return promise;
  }

  function refreshCitationEligibilityUi() {
    if (!state.manifest) return;
    renderReleaseMetadata();
    const dialog = element("details-dialog");
    if (!dialog?.open || !state.resultId) return;
    const focused = document.activeElement;
    const focusWasInside = Boolean(focused && dialog.contains?.(focused));
    const focusedHref = focusWasInside && focused.tagName === "A" ? focused.href : "";
    const focusedCopyAction = focusWasInside ? focused.dataset?.copyResultCitation || "" : "";
    const computeNotesFocused = focusWasInside && focused.matches?.(".ux-compute-measurements > summary");
    const scoreFocused = focusWasInside && focused.matches?.(".ux-score-breakdown > summary");
    const precisionFocused = focusWasInside && focused.matches?.("[data-score-precision]");
    const row = resultRowById(state.resultId);
    if (!row) return;
    const computeNotesOpen = dialog.querySelector?.(".ux-compute-measurements")?.open;
    const scoreOpen = dialog.querySelector?.(".ux-score-breakdown")?.open;
    const scorePrecision = dialog.querySelector?.("[data-score-precision]")?.checked;
    openDetails(row, false);
    if (computeNotesOpen) dialog.querySelector(".ux-compute-measurements").open = true;
    if (scoreOpen) dialog.querySelector(".ux-score-breakdown").open = true;
    if (scorePrecision) {
      dialog.querySelector("[data-score-precision]").checked = true;
      applyScorePrecision(dialog, true);
    }
    const body = element("details-dialog-body");
    const replacement = focusedCopyAction
      ? body?.querySelector?.(`[data-copy-result-citation="${focusedCopyAction}"]`)
      : focusedHref
        ? Array.from(body?.querySelectorAll?.("a") || []).find((link) => link.href === focusedHref)
        : null;
    replacement?.focus();
    if (computeNotesFocused) body.querySelector(".ux-compute-measurements > summary").focus({ preventScroll: true });
    if (scoreFocused) body.querySelector(".ux-score-breakdown > summary").focus({ preventScroll: true });
    if (precisionFocused) body.querySelector("[data-score-precision]").focus({ preventScroll: true });
  }

  function revisionHistoryHtml(row) {
    const versions = versionsForRow(row);
    if (!versions.length) return "";
    const rankingDefinition = metricDefinition(ranking().metric_id);
    const items = versions
      .map((versionRow) => {
        const revision = resultRevision(versionRow);
        const selected = versionRow.id === row.id;
        const value = versionRow.metricValues?.[ranking().metric_id];
        const status = revision.is_latest ? "Latest and currently ranked" : `Superseded by ${revision.latest_submission_id}`;
        const summary = revision.change_summary || (revision.version === 1 ? "Initial published result." : "No legacy change summary supplied.");
        return `<li class="leaderboard-revision-item${selected ? " is-selected" : ""}">
          <a href="${escapeHtml(resultUrl(versionRow))}" data-result-revision="${escapeHtml(versionRow.id)}" ${
            selected ? 'aria-current="page"' : ""
          }>${escapeHtml(revisionLabel(versionRow))}</a>
          <span>${escapeHtml(versionRow.date || "Date not supplied")} · ${escapeHtml(status)}</span>
          <span>${escapeHtml(plainMetricLabel(rankingDefinition) || ranking().metric_id)}: ${escapeHtml(
            formatMetric(value, rankingDefinition)
          )}</span>
          <p>${escapeHtml(summary)}</p>
        </li>`;
      })
      .join("");
    return `<section><h4>Version history</h4><p class="details-note">Every published version is immutable. Only the latest version occupies a current leaderboard position.</p><ol class="leaderboard-revision-list">${items}</ol></section>`;
  }

  function openDetails(row, syncUrl = true) {
    state.resultId = row.id;
    if (syncUrl) updateUrl();
    renderReleaseMetadata();
    const dialog = element("details-dialog");
    const revision = resultRevision(row);
    element("details-dialog-title").textContent = `${row.model} — ${revisionLabel(row)}`;
    element("details-dialog-subtitle").textContent = `${row.dataset} / ${row.split} · ${
      revision.is_latest ? "latest version" : "superseded version"
    }`;
    const links = [
      detailsLink("Paper", row.paper_url),
      detailsLink("Legacy code link", row.code_url),
      detailsLink("Result permalink", resultUrl(row, Boolean(releaseViewUrl()))),
    ]
      .filter(Boolean)
      .join(" &middot; ");
    const evaluationLinks = [detailsLink("Submitter evaluation record", evaluationEvidenceUrl(row))].filter(Boolean).join(" &middot; ");
    const reproducibilityLinks = [
      detailsLink("Code repository (optional)", row.reproducibility?.code?.repository_url),
      detailsLink("Model artifact (optional)", row.reproducibility?.model_artifact?.url),
      detailsLink("Environment artifact (optional)", row.reproducibility?.environment?.url),
      detailsLink("Artifact documentation (optional)", row.reproducibility?.artifact_documentation_url),
    ]
      .filter(Boolean)
      .join(" &middot; ");
    const reproducibilityArtifacts = reproducibilityArtifactAvailability(row);
    const support = scoringSupportSummary(row);
    const regional = regionalBinding(row);
    const datasetSupport = record(activeDataset()?.scoring_support);
    const supportOwnerApproval = support.release_id && datasetSupport.release_id === support.release_id ? record(datasetSupport.owner_approval) : {};
    const supportLinks = [
      detailsLink("Official scoring-support manifest", support.manifest_url),
      detailsLink("Dataset-owner approval", supportOwnerApproval.pull_request_url),
    ]
      .filter(Boolean)
      .join(" &middot; ");
    const predictionArtifact = primaryPredictionArtifact(row);
    const predictionCheck = predictionArtifactCheck(row);
    const predictionLinks = predictionArtifacts(row)
      .map((artifact, index) =>
        detailsLink(
          predictionArtifacts(row).length === 1 ? "Public prediction repository" : `Public prediction repository ${index + 1}`,
          firstValue(artifact.repository_url, artifact.url)
        )
      )
      .filter(Boolean)
      .join(" &middot; ");
    const trainingSurfaceInput = spatialComponent(row, ["training", "surface", "input"], ["training", "surface_input"], ["training_surface_input"]);
    const trainingSurfaceSupervision = spatialComponent(
      row,
      ["training", "surface", "supervision"],
      ["training", "surface_supervision"],
      ["training_surface_supervision"]
    );
    const trainingVolumeInput = spatialComponent(row, ["training", "volume", "input"], ["training", "volume_input"], ["training_volume_input"]);
    const trainingVolumeSupervision = spatialComponent(
      row,
      ["training", "volume", "supervision"],
      ["training", "volume_supervision"],
      ["training_volume_supervision"]
    );
    const inferenceSurfaceInput = spatialComponent(
      row,
      ["inference", "surface_input"],
      ["inference", "geometry_input", "surface"],
      ["inference_surface_input"]
    );
    const inferenceVolumeInput = spatialComponent(
      row,
      ["inference", "volume_input"],
      ["inference", "geometry_input", "volume"],
      ["inference_volume_input"]
    );
    const inferenceMeshDependency = spatialComponent(
      row,
      ["inference", "geometry_dependency"],
      ["inference", "mesh_dependency"],
      ["inference", "native_mesh_dependency"],
      ["inference_mesh_dependency"]
    );
    const directSurfaceOutput =
      directOutputSummary(row, "surface") ||
      representationSummary(spatialComponent(row, ["inference", "surface_direct_output"], ["surface_direct_output"]));
    const directVolumeOutput =
      directOutputSummary(row, "volume") ||
      representationSummary(spatialComponent(row, ["inference", "volume_direct_output"], ["volume_direct_output"]));
    const scoringMapping = mappingSummary(row);
    const scoringCoverage = scoringCoverageSummary(row);
    const validation = maintainerValidation(row);
    void ensureValidationEvidence(row);
    if (revision.is_latest) void ensureClaimRecord(row);
    const validationCheck = validationEvidenceCheck(row);
    const claimCheck = claimRecordCheck(row);
    const eligibility = claimEligibility(row);
    const rankContext = rowRanking(row);
    const approvalLinks = [
      detailsLink("Approval pull request", row.approval?.pull_request_url),
      detailsLink("Validation record", validationEvidenceUrl(row)),
      detailsLink("Claim record", resultClaimRecordUrl(row)),
    ]
      .filter(Boolean)
      .join(" &middot; ");
    const headlineIds = headlineMetricIds();
    const metricSections = Array.from(detailsMetricGroups(row).entries())
      .map(([group, metrics]) => {
        const values = metrics
          .map(({ definition, value }) => {
            const headlineBadge = headlineIds.has(definition.id) ? '<span class="leaderboard-headline-metric-badge">Headline</span>' : "";
            return `<div><dt>${formattedMetricLabelHtml(definition.label)}${headlineBadge}</dt><dd>${escapeHtml(
              formatMetric(value, definition)
            )}</dd></div>`;
          })
          .join("");
        const containsRankingMetric = metrics.some(({ definition }) => definition.id === ranking().metric_id);
        return `<details class="leaderboard-metric-disclosure"${containsRankingMetric ? " open" : ""}>
          <summary><span>${escapeHtml(group)}</span><span>${metrics.length} metric${metrics.length === 1 ? "" : "s"}</span></summary>
          <div class="leaderboard-metric-detail-body"><dl>${values}</dl></div>
        </details>`;
      })
      .join("");
    const rankAndClaimSection = rankContext
      ? `<section><h4>Rank and claim context</h4><dl>
        ${detailsRow("Rank in this release", resultRankText(rankContext))}
        ${detailsRow("Ranked result count", rankContext.ranked_result_count)}
        ${detailsRow("Tied", rankContext.tied ? `Yes — ${rankContext.tie_count} results share this rank` : "No")}
        ${detailsRow("Ranking metric", plainMetricLabel(metricDefinition(rankContext.metric_id)) || rankContext.metric_id)}
        ${detailsRow("Published ranking value", rankingValueText(rankContext))}
        ${detailsRow("Submitter-provided ranking value", rankContext.value)}
        ${detailsRow("Ranking direction", `${humanize(rankContext.direction)} is better`)}
        ${detailsRow(
          "Published ranking precision",
          `${rankContext.decimal_places} decimal place${rankContext.decimal_places === 1 ? "" : "s"}; decimal-half-up rounding`
        )}
        ${detailsRow("Tie method", "Competition ranking (1, 2, 2, 4)")}
        ${detailsRow("Exact rank scope", `${state.dataset} / ${state.split} / ${dataRelease().id || "unversioned"}`)}
        ${detailsRow("Claim record SHA-256", claimCheck?.sha256)}
        ${detailsRow("Claim record bytes", humanize(claimCheck?.status || "not_checked"))}
        ${detailsRow("Claim record attempted URL", claimCheck?.url)}
        ${detailsRow("Claim record verification error", claimCheck?.error)}
      </dl><p class="details-note">This rank is fixed to the exact dataset, split, result version, and data release shown above. It is not a claim about a later leaderboard release.</p></section>`
      : `<section><h4>Revision status</h4><dl>
        ${detailsRow("Current rank", "Not ranked — superseded version")}
        ${detailsRow("Latest submission ID", revision.latest_submission_id)}
        ${detailsRow(
          "Original submitted score retained",
          formatMetric(row.metricValues?.[ranking().metric_id], metricDefinition(ranking().metric_id))
        )}
      </dl><p class="details-note">This immutable version remains available for audit and comparison, but it does not occupy a position in the current leaderboard. Any former rank belongs to the immutable release that originally published it.</p></section>`;
    const resultCitationActions = `<div class="leaderboard-result-citation-actions">
          <button class="leaderboard-action-button" type="button" data-copy-result-citation="plain" aria-describedby="result-citation-eligibility" ${
            eligibility.academic_citation ? "" : "disabled"
          }>Copy result citation</button>
          <button class="leaderboard-action-button" type="button" data-copy-result-citation="bibtex" aria-describedby="result-citation-eligibility" ${
            eligibility.academic_citation ? "" : "disabled"
          }>Copy result BibTeX</button>
          <button class="leaderboard-action-button" type="button" data-copy-result-citation="promotion" aria-describedby="result-citation-eligibility" ${
            eligibility.promotion ? "" : "disabled"
          }>Copy leaderboard claim</button>
          <p id="result-citation-eligibility" class="leaderboard-claim-eligibility" role="status">${escapeHtml(
            eligibility.academic_citation && eligibility.promotion
              ? "Copying is enabled for this exact release, dataset, and split."
              : eligibility.declared.academic_citation && eligibility.declared.promotion
                ? `Copying is temporarily unavailable because browser verification has not passed: ${eligibility.reason}`
                : `Declared claim eligibility: ${eligibility.declared.reason}`
          )}</p>
          <p id="result-citation-copy-status" class="leaderboard-copy-status" role="status"></p>
        </div>`;
    const summaryMetrics = activeMetricDefinitions()
      .filter((definition) => headlineIds.has(definition.id) && definition.id !== ranking().metric_id)
      .slice(0, 4)
      .map(
        (definition) =>
          `<div><dt>${formattedMetricLabelHtml(definition.label)}</dt><dd>${escapeHtml(
            formatMetric(row.metricValues?.[definition.id], definition)
          )}</dd></div>`
      )
      .join("");
    const summaryRank = rankContext
      ? `#${rankContext.rank} of ${rankContext.ranked_result_count}`
      : !isLatestRevision(row)
        ? "Superseded version"
        : row.record_type === "development_fixture"
          ? "Non-ranked development fixture"
          : "Not ranked";
    const summaryRankingLabel = plainMetricLabel(metricDefinition(ranking().metric_id)) || "Ranking score";
    const packageValidationLabel =
      dataRelease().status === "official" ? humanize(validation.status || "not recorded") : "Prototype fixture — not applicable";
    const summaryStatus = (label, value) =>
      `<span class="leaderboard-result-status"><strong>${escapeHtml(label)}</strong>${escapeHtml(value || "Not supplied")}</span>`;
    element("details-dialog-body").innerHTML = `
      <section class="leaderboard-result-summary" aria-label="Result summary">
        <div class="leaderboard-result-summary-heading">
          <div><span>Leaderboard position</span><strong>${escapeHtml(summaryRank)}</strong></div>
          <div><span>${escapeHtml(summaryRankingLabel)}</span><strong>${escapeHtml(
            formatMetric(row.metricValues?.[ranking().metric_id], metricDefinition(ranking().metric_id))
          )}</strong></div>
        </div>
        ${summaryMetrics ? `<dl class="leaderboard-result-headline-metrics">${summaryMetrics}</dl>` : ""}
        <dl class="leaderboard-result-identity">
          ${detailsRow("Submitted by", row.submitter)}
          ${detailsRow("Institution", row.institution)}
          ${detailsRow("Model types", row.modelTypes.join(", "))}
          ${detailsRow("Parameters", row.parameterCount === null ? null : `${formatNumber(row.parameterCount, 2)} M`)}
          ${detailsRow("Training", trainingLabel(row))}
          ${detailsRow("Published", row.date)}
        </dl>
        <div class="leaderboard-result-statuses" aria-label="Validation and artifact status">
          ${summaryStatus("Package validation", packageValidationLabel)}
          ${summaryStatus("Prediction data", predictionAvailability(row).label)}
          ${summaryStatus("Metric recomputation", predictionMetricRecomputation(row).label)}
          ${summaryStatus("Code", optionalArtifactAvailabilityLabel(reproducibilityArtifacts.code))}
          ${summaryStatus("Model artifact", optionalArtifactAvailabilityLabel(reproducibilityArtifacts.model))}
          ${summaryStatus("Environment", optionalArtifactAvailabilityLabel(reproducibilityArtifacts.environment))}
        </div>
      </section>
      ${scoreBreakdownHtml(row)}
      ${computeDetailsHtml(row)}
      <details class="leaderboard-details-disclosure">
        <summary>Ranking and submission record</summary>
        <div class="leaderboard-details-disclosure-body">
      ${rankAndClaimSection}
      ${revisionHistoryHtml(row)}
      <section><h4>Submission</h4><dl>
        ${detailsRow("Submission ID", row.id)}
        ${detailsRow("Result series", revision.series_id)}
        ${detailsRow("Version", revisionLabel(row))}
        ${detailsRow("Record type", row.record_type === "development_fixture" ? "Non-ranked development fixture" : humanize(row.record_type))}
        ${detailsRow("Supersedes", revision.supersedes)}
        ${detailsRow("Change summary", revision.change_summary || (revision.version === 1 ? "Initial published result." : null))}
        ${detailsRow("Dataset version", row.dataset_version)}
        ${detailsRow("Split ID", row.split_id)}
        ${detailsRow(
          "Prediction scope",
          regionalScope(row) === "surface_only" ? "Surface only (volume components fixed to zero)" : "Surface and volume"
        )}
        ${detailsRow("Submitted by", row.submitter)}
        ${detailsRow("Institution", row.institution)}
        ${detailsRow("Model types", row.modelTypes.join(", "))}
        ${detailsRow("Parameters", row.parameterCount === null ? null : `${formatNumber(row.parameterCount, 2)} M`)}
        ${detailsRow("Date", row.date)}
      </dl>${links ? `<p>${links}</p>` : ""}${row.note ? `<p>${escapeHtml(row.note)}</p>` : ""}</section>
        </div>
      </details>
      <details class="leaderboard-details-disclosure">
        <summary>Model and training methodology</summary>
        <div class="leaderboard-details-disclosure-body">
      ${methodologySectionHtml(row)}
      <section><h4>Training</h4><dl>
        ${detailsRow("Regime", trainingLabel(row))}
        ${detailsRow("Target-dataset data", targetDataLabel(row.target_data_used))}
        ${detailsRow("External pretraining", row.external_pretraining === true ? "Yes" : row.external_pretraining === false ? "No" : "Not supplied")}
        ${detailsRow("Pretraining data", pretrainingDataLabel(row.pretraining_data))}
        ${detailsRow("Protocol explanation", row.training_regime_explanation)}
      </dl></section>
        </div>
      </details>
      <details class="leaderboard-details-disclosure leaderboard-technical-provenance">
        <summary>Technical provenance and validation</summary>
        <div class="leaderboard-details-disclosure-body">
      <section><h4>Result scoring support</h4><dl>
        ${detailsRow("Scoring-support release", support.release_id)}
        ${detailsRow("Scoring-support status", humanize(support.status))}
        ${detailsRow("Manifest SHA-256", support.manifest_sha256)}
        ${detailsRow("Surface support ID", support.surface_support_id)}
        ${detailsRow("Volume support ID", support.volume_support_id)}
        ${detailsRow("Dataset-owner approved by", supportOwnerApproval.approved_by)}
        ${detailsRow("Dataset-owner approval date", supportOwnerApproval.approved_at)}
      </dl>${supportLinks ? `<p>${supportLinks}</p>` : ""}
      <p class="details-note">${
        support.release_id
          ? "These benchmark-owned locations, IDs, targets, and weights define where final errors are calculated on the declared evaluation/test split. They do not require the model to train or infer at those same locations."
          : "This historical result has no result-specific scoring-support binding. Do not infer that it used the active dataset's current support release."
      }</p></section>
      <section><h4>Submitter-reported spatial setup</h4><dl>
        ${detailsRow("Training surface input", representationSummary(trainingSurfaceInput))}
        ${detailsRow("Training surface supervision", representationSummary(trainingSurfaceSupervision))}
        ${detailsRow("Training volume input", representationSummary(trainingVolumeInput))}
        ${detailsRow("Training volume supervision", representationSummary(trainingVolumeSupervision))}
        ${detailsRow("Inference surface input", representationSummary(inferenceSurfaceInput))}
        ${detailsRow("Inference volume input", representationSummary(inferenceVolumeInput))}
        ${detailsRow("Inference mesh dependency", representationSummary(inferenceMeshDependency))}
        ${detailsRow("Direct surface output/query support", directSurfaceOutput)}
        ${detailsRow("Direct volume output/query support", directVolumeOutput)}
        ${detailsRow("Discretization report file", bindingFile(discretizationBinding(row)))}
        ${detailsRow("Discretization report SHA-256", bindingSha256(discretizationBinding(row)))}
        ${detailsRow("Per-case discretization file", bindingFile(discretizationCaseBinding(row)))}
        ${detailsRow("Per-case discretization SHA-256", bindingSha256(discretizationCaseBinding(row)))}
      </dl><p class="details-note">The model's direct inference locations are reported by the submitter; package validation does not observe the model's internal queries.</p></section>
      <section><h4>Scoring alignment</h4><dl>
        ${detailsRow("Declared mapping to official support", scoringMapping)}
        ${detailsRow("Declared final coverage (package-checked)", scoringCoverage)}
        ${detailsRow("Per-case metric file", bindingFile(caseMetricsBinding(row)))}
        ${detailsRow("Per-case metric SHA-256", bindingSha256(caseMetricsBinding(row)))}
        ${detailsRow("Regional diagnostics file", bindingFile(regional))}
        ${detailsRow("Regional diagnostics SHA-256", bindingSha256(regional))}
      </dl><p class="details-note">Only predictions are mapped. The reference evaluator loads the fixed ground truth and weights at the official support before calculating errors.</p></section>
      <section><h4>Optional public predictions</h4><dl>
        ${detailsRow("Prediction data", predictionAvailability(row).label)}
        ${detailsRow("Declared artifact count", predictionArtifacts(row).length)}
        ${detailsRow(
          "Declared artifact kinds",
          predictionArtifacts(row)
            .map((artifact) => humanize(artifact.kind))
            .join(", ")
        )}
        ${detailsRow("Primary artifact kind (used for status)", humanize(predictionArtifact.kind))}
        ${detailsRow("Provider", predictionArtifactProvider(predictionArtifact))}
        ${detailsRow("Pinned revision", predictionArtifact.revision)}
        ${detailsRow("Prediction manifest file", predictionArtifact.manifest_file)}
        ${detailsRow("Prediction manifest SHA-256", predictionArtifact.manifest_sha256)}
        ${detailsRow("Format", predictionArtifact.format)}
        ${detailsRow("Licence", predictionArtifact.license_spdx)}
        ${detailsRow("Artifact check", predictionArtifactStatus(row).label)}
        ${detailsRow("Checked by", predictionCheck.checked_by)}
        ${detailsRow("Checked at", predictionCheck.checked_at)}
        ${detailsRow("Maintainer check record", bindingFile(predictionArtifactChecksBinding(row)))}
        ${detailsRow("Maintainer check record SHA-256", bindingSha256(predictionArtifactChecksBinding(row)))}
        ${detailsRow("Metric recomputation", predictionMetricRecomputation(row).label)}
      </dl>${predictionLinks ? `<p>${predictionLinks}</p>` : ""}
      <p class="details-note">Prediction sharing and these checks are informational. They do not change accuracy rank, academic-citation eligibility, or promotion eligibility.</p></section>
      <section><h4>Submitter-reported evaluation provenance</h4><dl>
        ${detailsRow("Declared reference version", row.evaluation?.reference_version)}
        ${detailsRow("Declared code revision", row.evaluation?.code_revision)}
        ${detailsRow("Declared evaluation command", row.evaluation?.command)}
        ${detailsRow("Evaluation record file", row.evaluation?.evidence_file)}
        ${detailsRow("Evaluation record SHA-256", row.evaluation?.evidence_sha256)}
        ${detailsRow("Profile case set", row.profile_data?.case_set_id)}
        ${detailsRow("Profile case count", row.profile_data?.case_count)}
        ${detailsRow("Profile index SHA-256", row.profile_data?.index_sha256)}
        ${detailsRow("Profile ground-truth release", row.profile_data?.profile_ground_truth_release_id)}
        ${detailsRow("Profile ground-truth manifest SHA-256", row.profile_data?.profile_ground_truth_manifest_sha256)}
      </dl>${evaluationLinks ? `<p>${evaluationLinks}</p>` : ""}</section>
      <section><h4>Reproducibility record</h4><dl>
        ${detailsRow("Contract", row.reproducibility?.contract_version)}
        ${detailsRow("Submission-package access", humanize(row.reproducibility?.access))}
        ${detailsRow("Public evaluation-data use", humanize(row.reproducibility?.public_test_data_use))}
        ${detailsRow("Result-data licence", row.reproducibility?.result_data_license_spdx)}
        ${detailsRow("Code artifact availability", optionalArtifactAvailabilityLabel(reproducibilityArtifacts.code))}
        ${detailsRow("Code repository", row.reproducibility?.code?.repository_url)}
        ${detailsRow("Code commit", row.reproducibility?.code?.commit)}
        ${detailsRow("Code licence", row.reproducibility?.code?.license_spdx)}
        ${detailsRow("Model artifact availability", optionalArtifactAvailabilityLabel(reproducibilityArtifacts.model))}
        ${detailsRow("Model artifact", row.reproducibility?.model_artifact?.url)}
        ${detailsRow("Model SHA-256", row.reproducibility?.model_artifact?.sha256)}
        ${detailsRow("Model licence", row.reproducibility?.model_artifact?.license_spdx)}
        ${detailsRow("Environment artifact availability", optionalArtifactAvailabilityLabel(reproducibilityArtifacts.environment))}
        ${detailsRow("Environment kind", humanize(row.reproducibility?.environment?.kind))}
        ${detailsRow("Environment", row.reproducibility?.environment?.url)}
        ${detailsRow("Environment SHA-256", row.reproducibility?.environment?.sha256)}
        ${detailsRow("Artifact documentation availability", optionalArtifactAvailabilityLabel(reproducibilityArtifacts.documentation))}
        ${detailsRow("Artifact documentation", row.reproducibility?.artifact_documentation_url)}
      </dl>${reproducibilityLinks ? `<p>${reproducibilityLinks}</p>` : ""}
      <p class="details-note">Code, model, environment, and artifact-documentation links are optional. When supplied, this record reports their submitter-provided identifiers and metadata. Their absence does not affect accuracy rank, academic-citation eligibility, or promotion eligibility.</p></section>
      <section><h4>Result status and submitted-data validation</h4><dl>
        ${detailsRow("Status", humanize(row.approval?.status))}
        ${detailsRow(
          "Academic citation eligibility",
          eligibility.declared.academic_citation
            ? "Declared eligible for this exact release context"
            : `Declared not eligible — ${eligibility.declared.reason}`
        )}
        ${detailsRow(
          "Promotion eligibility",
          eligibility.declared.promotion
            ? "Declared eligible for this exact release context"
            : `Declared not eligible — ${eligibility.declared.reason}`
        )}
        ${detailsRow(
          "Browser verification",
          eligibility.browser_verification.passed
            ? "Passed"
            : `Not passed — ${eligibility.browser_verification.reasons.join(" ") || "verification has not completed"}`
        )}
        ${detailsRow("Approved by", row.approval?.approved_by)}
        ${detailsRow("Approval date", row.approval?.approved_at)}
        ${detailsRow("Approval note", row.approval?.note)}
        ${detailsRow("Package validation", humanize(validation.status))}
        ${detailsRow("Validation schema version", validation.schema_version)}
        ${detailsRow("Validation scope", humanize(validation.validation_scope))}
        ${detailsRow("Model execution by FluidsBench", humanize(validation.model_execution))}
        ${detailsRow("Base-metric recomputation by FluidsBench", humanize(validation.metric_recomputation))}
        ${detailsRow("Validated profile case set", validation.case_set_id)}
        ${detailsRow("Validated profile ground-truth release", validation.profile_ground_truth_release_id)}
        ${detailsRow("Validated profile ground-truth manifest SHA-256", validation.profile_ground_truth_manifest_sha256)}
        ${detailsRow("Validated scoring-support release", validation.scoring_support_release_id)}
        ${detailsRow("Validated scoring-support manifest SHA-256", validation.scoring_support_manifest_sha256)}
        ${detailsRow("Validated discretization SHA-256", validation.discretization_sha256)}
        ${detailsRow("Validated case-metrics SHA-256", validation.case_metrics_sha256)}
        ${detailsRow("Validation record SHA-256", validation.evidence_sha256)}
        ${detailsRow("Validation record bytes", humanize(validationCheck?.status || "not_checked"))}
      </dl>${approvalLinks ? `<p>${approvalLinks}</p>` : ""}${resultCitationActions}</section>
        </div>
      </details>
      <details class="leaderboard-details-disclosure leaderboard-result-metrics-disclosure">
        <summary>All submitted metrics</summary>
        <div class="leaderboard-details-disclosure-body">
      <section class="leaderboard-result-metrics"><h4>Metrics</h4>
        <p class="details-note">Headline metrics form the compact leaderboard view. Expand any group below to inspect every submitted metric.</p>
        ${metricSections}
      </section>
        </div>
      </details>`;
    if (dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function showHelp(button) {
    window.clearTimeout(helpHideTimer);
    const popover = element("column-help-popover");
    if (activeHelpButton && activeHelpButton !== button) activeHelpButton.setAttribute("aria-expanded", "false");
    activeHelpButton = button;
    button.setAttribute("aria-expanded", "true");
    const definitionLink = button.dataset.definitionHref
      ? ` <a href="${escapeHtml(button.dataset.definitionHref)}">${escapeHtml(button.dataset.definitionLabel)}</a>`
      : "";
    popover.innerHTML = `<strong>${formattedMetricLabelHtml(button.dataset.helpTitle)}</strong><p>${escapeHtml(
      button.dataset.helpText
    )}${definitionLink}</p>`;
    popover.hidden = false;
    const rect = button.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    popover.style.width = `${width}px`;
    popover.style.left = `${Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2))}px`;
    popover.style.top = `${Math.min(window.innerHeight - popover.offsetHeight - 12, rect.bottom + 8)}px`;
  }

  function hideHelp() {
    element("column-help-popover").hidden = true;
    activeHelpButton?.setAttribute("aria-expanded", "false");
    activeHelpButton = null;
  }

  function scheduleHelpHide() {
    window.clearTimeout(helpHideTimer);
    helpHideTimer = window.setTimeout(hideHelp, 160);
  }

  function applyRestoredState(restored) {
    if (!restored) return;
    const split = splitOptions().find((candidate) => {
      return candidate.id === restored.split || candidate.name === restored.split || slug(candidate.name) === restored.split;
    });
    if (split) state.split = split.name;

    const modelTypes = new Set((state.rows.get(state.dataset) || []).flatMap((row) => row.modelTypes));
    if (modelTypes.has(restored.modelType)) state.modelType = restored.modelType;
    state.showAllVersions = restored.showAllVersions;

    const sortKeys = new Set(
      allColumns()
        .map((column) => column.sortKey)
        .filter(Boolean)
    );
    if (sortKeys.has(restored.sortKey)) state.sortKey = restored.sortKey;
    if (["asc", "desc"].includes(restored.sortDirection)) state.sortDirection = restored.sortDirection;

    state.workspaceView = ["leaderboard", "compare", "compute", "methodology"].includes(restored.params.get("view"))
      ? restored.params.get("view")
      : "leaderboard";
    state.computeMode = restored.params.get("compute") === "training" ? "training" : "inference";
    state.computeAxis = restored.params.get("compute_axis") === "device" ? "device" : "wall";
    state.computeHardware = restored.params.get("compute_hardware") || "";
    state.computeSort = ["score", "wall", "device", "parameters", "model"].includes(restored.params.get("compute_sort"))
      ? restored.params.get("compute_sort")
      : "score";
    state.analysisView = restored.params.get("analysis") || "comparison";
    state.profilePanelIndex = Number(restored.params.get("profile_view")) || 0;
    state.metricView = restored.metricView;
    if (restored.hasVisibleGroups && !restored.hasMetricView) state.metricView = "full";

    if (restored.hasVisibleGroups) {
      const availableGroups = new Set(activeMetricDefinitions().map(metricColumnGroup));
      availableGroups.add("model-details");
      state.visibleGroups = new Set(restored.visibleGroups.filter((group) => availableGroups.has(group)));
    }

    const metricIds = new Set(activeMetricDefinitions().map((definition) => definition.id));
    if (metricIds.has(restored.comparisonMetric)) state.comparisonMetric = restored.comparisonMetric;

    const availableRowIds = new Set(rowsForActiveSplit().map((row) => row.id));
    if (restored.hasComparedModelIds) {
      const availableRequestedIds = restored.comparedModelIds.filter((id) => availableRowIds.has(id));
      state.comparedModelIds = new Set(availableRequestedIds.slice(0, maxFigureModels));
      state.staleComparedModelIds = new Set([
        ...restored.comparedModelIds.filter((id) => !availableRowIds.has(id)),
        ...availableRequestedIds.slice(maxFigureModels),
      ]);
    } else {
      setDefaultComparedModels();
    }

    const availableRadarIds = new Set(radarCandidateRows().map((row) => row.id));
    if (restored.hasRadarModelIds) {
      state.radarModelIds = new Set(restored.radarModelIds.filter((id) => availableRadarIds.has(id)).slice(0, maxRadarModels));
    } else {
      setDefaultRadarModels();
    }

    const scatterIds = new Set(scatterDefinitions().map((definition) => definition.id));
    if (scatterIds.has(restored.scatterX)) state.scatterX = restored.scatterX;
    if (scatterIds.has(restored.scatterY)) state.scatterY = restored.scatterY;
    state.profileCase = restored.profileCase;

    state.requestedResultId = restored.resultId;
    const resultExists = Boolean(resultRowById(restored.resultId));
    state.resultUnavailable = Boolean(restored.resultId && !state.releaseMismatch && !resultExists);
    state.resultId = restored.resultId && !state.releaseMismatch && resultExists ? restored.resultId : "";

    (activeDataset()?.diagnostic_panels || []).forEach((panel) => {
      const familyId = restored.params.get(`family_${panel.id}`);
      const quantity = restored.params.get(`quantity_${panel.id}`);
      const station = restored.params.get(`station_${panel.id}`);
      const coordinateView = restored.params.get(`coordinate_${panel.id}`);
      const selection = panelSelection(panel);
      const families = profileFamilies(panel);
      if (families.some((candidate) => candidate.id === familyId)) selection.family = familyId;
      if ((panel.quantities || []).some((candidate) => candidate.id === quantity)) selection.quantity = quantity;
      if (profileStations(panel, selectedProfileFamily(panel)).some((candidate) => candidate.id === station)) selection.station = station;
      if (profileCoordinateViews(panel).some((candidate) => candidate.id === coordinateView)) selection.coordinateView = coordinateView;
    });
  }

  function renderAll() {
    renderReleaseMetadata();
    renderColumnToggles();
    renderTable();
    renderRankingPolicy();
    renderTypeFilter();
    renderVersionControl();
    renderRadarModelPicker();
    renderComparisonModelPicker();
    renderComparisonControls();
    renderScatterControls();
    renderDiagnosticPanels();
    renderDefinitions();
    renderRadarChart();
    renderComparisonChart();
    renderScatterChart();
    void prepareRegionalExplorer();
    void refreshProfileContext();
    const truthOnly = activeDatasetSlug() === "windsorml" && activeDataset()?.submission_count === 0;
    element("leaderboard-radar-panel").hidden = truthOnly;
    element("comparison-model-description").closest("fieldset").hidden = truthOnly;
    if (truthOnly && state.workspaceView !== "compute") {
      element("leaderboard-advanced-analysis").open = true;
      state.workspaceView = "compare";
      state.analysisView = "profiles";
    }
    renderProfileExplorer();
    compactFigureActions();
    activateAnalysisTab(state.analysisView);
    activateWorkspace(state.workspaceView, false);
    renderUxControls();
  }

  function resizeVisibleCharts() {
    Object.values(state.charts).forEach((chart) => chart?.resize?.());
  }

  function activateAnalysisTab(name) {
    const activeName = ["comparison", "radar", "scatter", "profiles", "regional"].includes(name) ? name : "comparison";
    state.analysisView = activeName;
    document.querySelectorAll("[data-analysis-tab]").forEach((tab) => {
      const selected = tab.dataset.analysisTab === activeName;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll("[data-analysis-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.analysisPanel !== activeName;
    });
    window.requestAnimationFrame(resizeVisibleCharts);
    if (activeName === "regional") void prepareRegionalExplorer();
  }

  function showError(error, message = "Could not load leaderboard data") {
    const box = element("leaderboard-error");
    box.hidden = false;
    box.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = message;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "leaderboard-action-button";
    retry.textContent = "Retry";
    retry.addEventListener("click", () => window.location.reload());
    const detail = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Technical details";
    const text = document.createElement("p");
    text.textContent = error.message;
    detail.append(summary, text);
    box.append(title, retry, detail);
    if (!state.dataset) {
      element("leaderboard-data-warning").hidden = true;
      element("leaderboard-release-compact").textContent = "Release unavailable";
      element("ux-results-summary").textContent = "Results could not be loaded. Please retry.";
    }
  }

  function setLoading(datasetName = "") {
    const status = element("leaderboard-load-status");
    const isLoading = Boolean(datasetName);
    status.hidden = !isLoading;
    status.textContent = isLoading ? `Loading ${datasetName}...` : "";
    document.querySelector(".leaderboard-page")?.setAttribute("aria-busy", String(isLoading));
    datasetSelects().forEach((select) => {
      select.disabled = isLoading;
    });
  }

  function showProfileWarning(error) {
    const box = element("leaderboard-profile-warning");
    box.hidden = false;
    box.textContent = `Leaderboard results loaded, but reference profile curves are unavailable: ${error.message}`;
  }

  async function setDataset(datasetName, restored = null, syncUrl = true) {
    const dataset = datasetEntries().find((candidate) => candidate.name === datasetName);
    if (!dataset) return;
    const detailsDialog = element("details-dialog");
    if (detailsDialog?.open) {
      state.resultId = "";
      detailsDialog.close();
    }
    const version = ++state.loadVersion;
    const previousDataset = state.dataset;
    syncDatasetSelects();
    syncSplitSelects();
    element("leaderboard-error").hidden = true;
    element("leaderboard-profile-warning").hidden = true;
    setLoading(dataset.name);
    try {
      await ensureRows(dataset);
      if (version !== state.loadVersion) return;
      state.dataset = dataset.name;
      state.split = dataset.splits?.[0]?.name || "";
      state.modelType = "";
      state.showAllVersions = false;
      state.sortKey = "rank";
      state.sortDirection = "asc";
      state.metricView = "summary";
      state.comparisonMetric = dataset.ranking?.metric_id || "";
      state.scatterX = "";
      state.scatterY = dataset.ranking?.metric_id || "";
      state.radarModelIds = new Set();
      state.comparedModelIds = new Set();
      state.staleComparedModelIds = new Set();
      state.profileCaseIds = [];
      state.profileCase = "";
      state.groundTruthCase = null;
      state.profileCases = new Map();
      state.profileCaseErrors = new Map();
      state.resultId = "";
      state.resultUnavailable = false;
      if (!restored) {
        state.requestedReleaseId = "";
        state.requestedResultId = "";
        state.releaseMismatch = false;
      }
      initializeVisibleGroups();
      if (restored) applyRestoredState(restored);
      else {
        setDefaultRadarModels();
        setDefaultComparedModels();
      }
      syncDatasetSelects();
      syncSplitSelects();
      element("leaderboard-error").hidden = true;
      renderAll();
      if (state.resultId) {
        const targetRow = resultRowById(state.resultId);
        if (targetRow) openDetails(targetRow, false);
      }
      if (syncUrl) updateUrl();
    } catch (error) {
      if (version === state.loadVersion) {
        syncDatasetSelects();
        syncSplitSelects();
        const message = previousDataset ? `Could not load ${dataset.name}; ${previousDataset} remains selected` : `Could not load ${dataset.name}`;
        showError(error, message);
      }
      console.error(error);
    } finally {
      if (version === state.loadVersion) setLoading();
    }
  }

  function setSplit(splitName) {
    if (!splitOptions().some((split) => split.name === splitName)) return;
    const detailsDialog = element("details-dialog");
    if (detailsDialog?.open) {
      state.resultId = "";
      detailsDialog.close();
    }
    state.split = splitName;
    syncSplitSelects();
    state.sortKey = "rank";
    state.sortDirection = "asc";
    state.resultId = "";
    state.requestedResultId = "";
    state.resultUnavailable = false;
    state.staleComparedModelIds = new Set();
    setDefaultRadarModels();
    setDefaultComparedModels();
    state.profileCaseIds = [];
    state.profileCase = "";
    state.groundTruthCase = null;
    state.profileCases = new Map();
    state.profileCaseErrors = new Map();
    renderAll();
    updateUrl();
  }

  function renderUxControls() {
    const summary = element("ux-results-summary");
    if (!summary) return;
    const rows = filteredRows();
    summary.textContent = `${rows.length} result${rows.length === 1 ? "" : "s"} · ${state.dataset} · ${state.split}`;
    const link = element("ux-dataset-link");
    link.href = new URL(`${activeDatasetSlug()}/`, new URL(link.dataset.datasetBaseUrl, window.location.href)).href;
    const sort = element("ux-sort");
    const sortColumns = activeColumns().filter((column) => column.sortKey);
    if (!sortColumns.some((column) => column.sortKey === state.sortKey)) {
      const current = allColumns().find((column) => column.sortKey === state.sortKey);
      if (current) sortColumns.push(current);
    }
    populateSelect(
      sort,
      sortColumns.map((column) => ({ value: column.sortKey, label: column.plainLabel || column.label })),
      state.sortKey
    );
    const direction = element("ux-sort-direction");
    direction.textContent = state.sortDirection === "asc" ? "↑" : "↓";
    direction.setAttribute("aria-label", `Sort ${state.sortDirection === "asc" ? "descending" : "ascending"}`);
    const selected = figureRows();
    element("ux-compare-count").textContent = selected.length;
    const chips = element("ux-selected-models");
    chips.replaceChildren();
    selected.forEach((row, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ux-model-chip";
      button.style.setProperty("--model-color", palette[index]);
      button.textContent = `${row.model} ×`;
      button.setAttribute("aria-label", `Remove ${row.model} from comparison`);
      button.addEventListener("click", () => {
        state.comparedModelIds.delete(row.id);
        updateFigureSelection();
      });
      chips.appendChild(button);
    });
    if (!selected.length) chips.textContent = "No models selected. Choose results in the leaderboard, or use Select top 3.";
  }

  function computeQuantity(value, unit = "") {
    if (value === null || value === undefined) return "Not reported";
    const formatted = new Intl.NumberFormat("en-GB", { maximumSignificantDigits: 4 }).format(value);
    return `${formatted}${unit ? ` ${unit}` : ""}`;
  }

  function computeRecords() {
    const selected = figureRows().map((row) => row.id);
    let otherIndex = selected.length;
    return tableRowsForCurrentModelType().map((row) => {
      const selectedIndex = selected.indexOf(row.id);
      return {
        row,
        ...window.FluidsBenchCompute.summarize(row),
        score: finiteNumber(row.metricValues[ranking().metric_id]),
        selected: selectedIndex >= 0,
        color: palette[(selectedIndex >= 0 ? selectedIndex : otherIndex++) % palette.length],
      };
    });
  }

  function computeAxisValue(item) {
    if (state.computeMode === "training") return item.training.deviceHours;
    return state.computeAxis === "device" ? item.inference.deviceSecondsPerCase : item.inference.wallSecondsPerCase;
  }

  function renderCompute() {
    if (!element("compute-table-body") || state.workspaceView !== "compute") return;
    const training = state.computeMode === "training";
    const all = computeRecords();
    const hasNonGpu = all.some((item) => ["cpu", "tpu", "other", "mixed"].includes(item[state.computeMode].accelerator.type));
    const deviceLabel = hasNonGpu ? "GPU / device" : "GPU";
    element("compute-hardware-label").textContent = `${deviceLabel} model`;
    const hardwareOptions = [
      ...new Map(
        all.map((item) => {
          const gpu = item[state.computeMode].accelerator;
          return [gpu.filterKey, { value: gpu.filterKey, label: gpu.filterLabel }];
        })
      ).values(),
    ].sort((left, right) => left.label.localeCompare(right.label));
    state.computeHardware = populateSelect(
      element("compute-hardware"),
      [{ value: "", label: `All ${deviceLabel} models` }, ...hardwareOptions],
      state.computeHardware
    );
    const items = all.filter((item) => !state.computeHardware || item[state.computeMode].accelerator.filterKey === state.computeHardware);
    document
      .querySelectorAll("[data-compute-mode]")
      .forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.computeMode === state.computeMode)));
    element("compute-axis-control").hidden = training;
    element("compute-axis").value = state.computeAxis;
    const definition = metricDefinition(ranking().metric_id);
    const scoreLabel = plainMetricLabel(definition) || "Physics score";
    const higher = rankingPolicy().direction !== "lower";
    state.computeSort = populateSelect(
      element("compute-sort"),
      [
        { value: "score", label: `${scoreLabel} (${higher ? "high" : "low"} first)` },
        ...(!training ? [{ value: "wall", label: "Elapsed time (low first)" }] : []),
        { value: "device", label: "Device time (low first)" },
        { value: "parameters", label: "Parameters (low first)" },
        { value: "model", label: "Model (A–Z)" },
      ],
      state.computeSort
    );
    const sortValue = (item) =>
      ({
        score: item.score,
        wall: item.inference.wallSecondsPerCase,
        device: training ? item.training.deviceHours : item.inference.deviceSecondsPerCase,
        parameters: item.row.parameterCount,
      })[state.computeSort];
    items.sort(
      (left, right) =>
        (state.computeSort === "model"
          ? 0
          : window.FluidsBenchCompute.compareNumbers(sortValue(left), sortValue(right), state.computeSort === "score" && higher)) ||
        rowLabel(left.row).localeCompare(rowLabel(right.row))
    );
    const timed = items.filter((item) => computeAxisValue(item) !== null);
    element("compute-coverage").textContent = `${timed.length} of ${items.length} results with timings`;
    const headers = training
      ? ["Model", scoreLabel, "Parameters", "Training device-hours", "Reported stages", deviceLabel, "Count", "Training scope"]
      : ["Model", scoreLabel, "Parameters", "Elapsed time / case", "Device time / case", deviceLabel, "Count", "Timing scope"];
    element("compute-table-head").innerHTML = `<tr>${headers.map((label) => `<th scope="col">${escapeHtml(label)}</th>`).join("")}</tr>`;
    element("compute-table-caption").textContent = `${state.dataset} / ${state.split}: ${
      training ? "training" : "inference"
    } compute. Selected comparison models are marked. Open a model for measurement details.`;
    element("compute-table-body").innerHTML =
      items
        .map((item) => {
          const { row, inference: inf, training: train } = item;
          const gpu = item[state.computeMode].accelerator;
          const gpuCount = gpu.mixed ? "See stages" : computeQuantity(gpu.devices, gpu.type === "gpu" ? "GPUs" : "devices");
          const countScope = gpu.devices === null ? "" : training ? "max. per stage" : "max. concurrent";
          const stages = train.submittedStages.length ? `${train.reportedStageCount} / ${train.submittedStages.length}` : "Not reported";
          const partial =
            train.knownDeviceHours !== null && !train.complete
              ? `<small>${escapeHtml(computeQuantity(train.knownDeviceHours, "device-h"))} known · incomplete</small>`
              : "";
          const values = training
            ? [
                `${escapeHtml(computeQuantity(train.deviceHours, "device-h"))}${partial}`,
                `${stages}${train.upstreamCount ? `<small>+ ${train.upstreamCount} upstream</small>` : ""}`,
              ]
            : [escapeHtml(computeQuantity(inf.wallSecondsPerCase, "s")), escapeHtml(computeQuantity(inf.deviceSecondsPerCase, "device-s"))];
          return `<tr class="${item.selected ? "is-selected" : ""}">
        <th scope="row"><button class="ux-compute-model" type="button" data-compute-details="${escapeHtml(
          row.id
        )}"><span class="ux-compute-dot" style="--model-color:${item.color}" aria-hidden="true"></span>${escapeHtml(rowLabel(row))}</button><small>${
          item.selected ? "Selected for comparison · " : ""
        }${
          isLatestRevision(row) ? "" : "Previous version · "
        }<button class="ux-compute-notes-link" type="button" data-compute-notes data-compute-details="${escapeHtml(
          row.id
        )}" aria-label="Measurement notes for ${escapeHtml(rowLabel(row))}">Measurement notes ↗</button></small></th>
        <td>${escapeHtml(formatMetric(item.score, definition))}</td><td>${escapeHtml(computeQuantity(row.parameterCount, "M"))}</td>
        <td>${values[0]}</td><td>${values[1]}</td>
        <td class="ux-compute-hardware"><span>${escapeHtml(gpu.label)}</span>${
          gpu.model && gpu.vendor ? `<small>${escapeHtml(gpu.vendor)}</small>` : ""
        }</td>
        <td class="ux-compute-device-count">${escapeHtml(gpuCount)}<small>${escapeHtml(countScope)}</small></td>
        <td>${escapeHtml(training ? train.scope : inf.scope)}<small>${escapeHtml(
          training ? trainingLabel(row) : inf.cases !== null ? `${inf.cases} cases` : "Case count not reported"
        )}</small></td>
      </tr>`;
        })
        .join("") || `<tr><td colspan="8" class="ux-compute-no-rows">No results match these filters.</td></tr>`;
    renderComputeChart(items, scoreLabel, higher);
  }

  function renderComputeChart(items, scoreLabel, higher) {
    destroyChart("compute");
    const training = state.computeMode === "training";
    const axisLabel = training
      ? "Training device-hours · submitter stages"
      : state.computeAxis === "device"
        ? "Device time / case (device-s)"
        : "Elapsed time / case (s)";
    const points = items
      .filter((item) => computeAxisValue(item) !== null && item.score !== null)
      .map((item) => ({ x: computeAxisValue(item), y: item.score, item }));
    element("compute-chart-title").textContent = training ? "Score vs training compute" : "Score vs inference time";
    element("compute-chart-direction").textContent = `Less ${training ? "compute" : "time"} ← · ${higher ? "Higher" : "Lower"} score ${
      higher ? "↑" : "↓"
    }`;
    element("compute-chart-context").textContent = `${state.dataset} · ${state.split}${
      dataRelease().status !== "official" ? " · Preview timings may be provisional; see measurement notes." : ""
    }`;
    const available = points.length > 0 && typeof Chart !== "undefined";
    element("compute-chart-frame").hidden = !available;
    element("compute-empty").hidden = available;
    element("compute-empty").innerHTML = points.length
      ? "<strong>Chart unavailable</strong><p>All measurements are available in the table below.</p>"
      : `<strong>${items.length ? "No comparable timings reported yet" : "No results for this selection"}</strong><p>${
          training
            ? "Complete submitter-stage compute and a physics score are needed for this chart."
            : "Reported time, case count and a physics score are needed for this chart."
        }</p>`;
    const omitted = items.length - points.length;
    element("compute-chart-summary").textContent = `${points.length} result${points.length === 1 ? "" : "s"} plotted${
      omitted ? ` · ${omitted} missing a complete timing or score` : ""
    }. ${
      training ? "Submitter training only; upstream compute is excluded." : "Campaign average per case, not single-prediction latency."
    } Larger points mark your comparison selection. Values and measurement notes are in the table.`;
    if (!available) return;
    const canvas = element("compute-chart");
    canvas.setAttribute(
      "aria-label",
      `${scoreLabel} versus ${axisLabel}, ${state.dataset}, ${state.split}. ${points.length} results; values in the model resources table.`
    );
    state.charts.compute = new Chart(canvas, {
      type: "scatter",
      data: {
        datasets: [
          {
            data: points,
            pointRadius: points.map((point) => (point.item.selected ? 8 : 5)),
            pointHoverRadius: 10,
            backgroundColor: points.map((point) => point.item.color),
            borderColor: chartTextColor(),
            borderWidth: points.map((point) => (point.item.selected ? 2 : 0)),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        layout: { padding: { top: 22, right: 24 } },
        scales: {
          x: {
            beginAtZero: true,
            grace: "10%",
            title: { display: true, text: axisLabel, color: chartTextColor() },
            ticks: { color: chartTextColor() },
            grid: { color: chartGridColor() },
          },
          y: {
            grace: "20%",
            title: { display: true, text: scoreLabel, color: chartTextColor() },
            ticks: { color: chartTextColor() },
            grid: { color: chartGridColor() },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (contexts) => rowLabel(contexts[0].raw.item.row),
              label: (context) => [
                `${scoreLabel}: ${formatMetric(context.raw.y, metricDefinition(ranking().metric_id))}`,
                `${axisLabel}: ${computeQuantity(context.raw.x)}`,
                context.raw.item[state.computeMode].accelerator.filterLabel,
                `${computeQuantity(context.raw.item[state.computeMode].accelerator.devices)} maximum concurrent devices${
                  training ? " per stage" : ""
                }`,
                context.raw.item[state.computeMode].scope,
              ],
            },
          },
        },
      },
      plugins: [
        {
          id: "computeModelLabels",
          afterDatasetsDraw(chart) {
            if (points.length > 8) return;
            const ctx = chart.ctx;
            ctx.save();
            ctx.font = "500 12px Inter, sans-serif";
            ctx.fillStyle = chartTextColor();
            const occupied = [];
            chart.getDatasetMeta(0).data.forEach((point, index) => {
              const full = rowLabel(points[index].item.row);
              const label = full.length > 30 ? `${full.slice(0, 29)}…` : full;
              const width = ctx.measureText(label).width;
              const x = Math.max(chart.chartArea.left, Math.min(point.x + 12, chart.chartArea.right - width));
              const y = Math.max(chart.chartArea.top + 12, point.y - 14);
              if (occupied.some((box) => Math.abs(box.y - y) < 16 && x < box.x + box.width + 6 && x + width + 6 > box.x)) return;
              ctx.fillText(label, x, y);
              occupied.push({ x, y, width });
            });
            ctx.restore();
          },
        },
      ],
    });
  }

  function computeDetailsHtml(row) {
    const { inference: inf, training: train } = window.FluidsBenchCompute.summarize(row);
    const stageDetails = train.stages
      .map((stage) => {
        const compute = record(stage.compute);
        const submitted = train.submittedStages.includes(stage);
        return `<article class="ux-compute-stage"><h5>${escapeHtml(humanize(stage.id))}</h5><p>${escapeHtml(stage.description || "")}</p>${
          submitted
            ? `<dl>
        ${detailsRow("GPU / accelerator model", window.FluidsBenchCompute.accelerator(compute).filterLabel)}
        ${detailsRow("Hardware description", compute.hardware || "Not reported")}
        ${detailsRow("Devices per job", computeQuantity(window.FluidsBenchCompute.accelerator(compute).devicesPerJob))}
        ${detailsRow("Maximum concurrent devices", computeQuantity(finiteNumber(compute.max_concurrent_device_count)))}
        ${detailsRow("Stage elapsed time", computeQuantity(finiteNumber(compute.campaign_wall_time_hours), "hours"))}
        ${detailsRow("Stage device time", computeQuantity(finiteNumber(compute.aggregate_device_hours), "device-hours"))}
        ${detailsRow("Runs covered by this stage", computeQuantity(finiteNumber(stage.run_count)))}
      </dl><p class="ux-compute-measurement-note">${escapeHtml(compute.measurement_notes || "Measurement notes not reported.")}</p>`
            : `<p>${escapeHtml(
                stage.status === "performed_upstream"
                  ? `Upstream training · excluded from the submitter total. ${stage.upstream_reference || ""}`
                  : "Compute not reported for this stage."
              )}</p>`
        }</article>`;
      })
      .join("");
    return `<section class="ux-compute-details" aria-label="Compute summary">
      <div class="ux-compute-details-heading"><h4>Compute</h4><button class="leaderboard-action-button" type="button" data-open-compute>Explore compute →</button></div>
      <dl class="ux-compute-summary">
        ${detailsRow("Inference · elapsed / case", computeQuantity(inf.wallSecondsPerCase, "s"))}
        ${detailsRow("Inference · device / case", computeQuantity(inf.deviceSecondsPerCase, "device-s"))}
        ${detailsRow("Training · submitter stages", computeQuantity(train.deviceHours, "device-hours"))}
      </dl>
      <details class="ux-compute-measurements"><summary>Hardware, timing scope and measurement notes</summary><div>
        <h5>Inference</h5><dl>
          ${detailsRow("GPU / accelerator model", inf.accelerator.filterLabel)}
          ${detailsRow("Hardware description", inf.hardware || "Not reported")}
          ${detailsRow("Devices per inference job", computeQuantity(inf.accelerator.devicesPerJob))}
          ${detailsRow("Maximum concurrent devices", computeQuantity(inf.devices))}
          ${detailsRow("Cases in the campaign", computeQuantity(inf.cases))}
          ${detailsRow("Campaign elapsed time", computeQuantity(inf.wallSeconds, "s"))}
          ${detailsRow("Campaign device time", computeQuantity(inf.deviceSeconds, "device-s"))}
          ${detailsRow("Preprocessing included", inf.preprocessing === null ? "Not reported" : inf.preprocessing ? "Yes" : "No")}
          ${detailsRow("Mapping included", inf.mapping === null ? "Not reported" : inf.mapping ? "Yes" : "No")}
        </dl><p class="ux-compute-measurement-note">${escapeHtml(inf.notes || "Measurement notes not reported.")}</p>
        <h5>Training</h5><p>${escapeHtml(train.scope)}. ${
          train.complete ? "Device-hours sum all reported submitter stages." : "A complete submitter total is not reported."
        }${
          train.knownDeviceHours !== null && !train.complete
            ? ` ${escapeHtml(computeQuantity(train.knownDeviceHours, "device-hours"))} reported across ${train.reportedStageCount} stages.`
            : ""
        }</p>
        <p>Training regime: ${escapeHtml(trainingLabel(row))}. Target data: ${escapeHtml(targetDataLabel(row.target_data_used))}.</p>
        ${stageDetails || "<p>No training-stage compute reported.</p>"}
        <p class="details-note">Submitter-reported resources, separate from physics scoring. Per-case inference is a campaign average; upstream training is excluded. Hardware and accounting methods must match for a like-for-like comparison.</p>
      </div></details>
    </section>`;
  }

  function activateWorkspace(name, persist = true) {
    state.workspaceView = ["leaderboard", "compare", "compute", "methodology"].includes(name) ? name : "leaderboard";
    document.querySelectorAll("[data-workspace-tab]").forEach((tab) => {
      const active = tab.dataset.workspaceTab === state.workspaceView;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll("[data-workspace-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.workspacePanel !== state.workspaceView;
    });
    if (state.workspaceView === "compute") renderCompute();
    window.requestAnimationFrame(resizeVisibleCharts);
    if (persist) updateUrl();
  }

  function renderProfileExplorer() {
    const select = element("ux-profile-view");
    if (!select) return;
    const panels = activeDataset()?.diagnostic_panels || [];
    const selected = populateSelect(
      select,
      panels.map((panel, index) => ({ value: String(index), label: panel.title })),
      String(state.profilePanelIndex)
    );
    state.profilePanelIndex = Number(selected) || 0;
    select.closest("label").hidden = panels.length <= 1;
    document.querySelectorAll("[data-profile-panel]").forEach((panel) => {
      panel.hidden = Number(panel.dataset.profilePanel) !== state.profilePanelIndex;
    });
    window.requestAnimationFrame(resizeVisibleCharts);
  }

  function compactFigureActions() {
    document.querySelectorAll(".leaderboard-figure-toolbar").forEach((toolbar) => {
      if (toolbar.dataset.compact) return;
      toolbar.dataset.compact = "true";
      const menu = document.createElement("details");
      menu.className = "ux-menu";
      const summary = document.createElement("summary");
      summary.textContent = "Download ↓";
      const items = document.createElement("div");
      items.className = "ux-menu-content";
      Array.from(toolbar.children)
        .filter((button) => !button.hasAttribute("data-copy-caption"))
        .forEach((button) => items.appendChild(button));
      menu.append(summary, items);
      toolbar.prepend(menu);
    });
    document.querySelectorAll(".leaderboard-figure-caption").forEach((caption) => {
      if (caption.parentElement.classList.contains("ux-chart-notes")) return;
      const notes = document.createElement("details");
      notes.className = "ux-chart-notes";
      const summary = document.createElement("summary");
      summary.textContent = "Figure notes and provenance";
      caption.before(notes);
      notes.append(summary, caption);
    });
  }

  function configureUxEvents() {
    window.addEventListener("resize", () => {
      if (state.workspaceView === "compute") state.charts.compute?.resize();
    });
    document.querySelectorAll("[data-compute-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        state.computeMode = button.dataset.computeMode;
        state.computeHardware = "";
        state.computeSort = "score";
        renderCompute();
        updateUrl();
      });
    });
    [
      ["compute-hardware", "computeHardware"],
      ["compute-axis", "computeAxis"],
      ["compute-sort", "computeSort"],
    ].forEach(([id, key]) => {
      element(id)?.addEventListener("change", (event) => {
        state[key] = event.target.value;
        renderCompute();
        updateUrl();
      });
    });
    document.querySelectorAll("[data-workspace-tab]").forEach((tab) => {
      tab.addEventListener("click", () => activateWorkspace(tab.dataset.workspaceTab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        const tabs = Array.from(document.querySelectorAll("[data-workspace-tab]"));
        const index = tabs.indexOf(tab);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        event.preventDefault();
        tabs[next].focus();
        activateWorkspace(tabs[next].dataset.workspaceTab);
      });
    });
    document.querySelectorAll("[data-open-workspace]").forEach((button) => {
      button.addEventListener("click", () => {
        activateWorkspace(button.dataset.openWorkspace);
        element(`ux-tab-${button.dataset.openWorkspace}`)?.focus();
      });
    });
    element("ux-sort")?.addEventListener("change", (event) => {
      const column = allColumns().find((item) => item.sortKey === event.target.value);
      if (!column) return;
      state.sortKey = column.sortKey;
      state.sortDirection = defaultSortDirection(column);
      renderTable();
      updateUrl();
    });
    element("ux-sort-direction")?.addEventListener("click", () => {
      state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
      renderTable();
      updateUrl();
    });
    element("ux-profile-view")?.addEventListener("change", (event) => {
      state.profilePanelIndex = Number(event.target.value);
      renderProfileExplorer();
      updateUrl();
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-open-score-methodology]")) openScoreMethodology();
      const computeDetails = event.target.closest("[data-compute-details]");
      if (computeDetails) {
        const row = resultRowById(computeDetails.dataset.computeDetails);
        if (row) {
          openDetails(row);
          if (computeDetails.hasAttribute("data-compute-notes")) {
            const notes = element("details-dialog-body").querySelector(".ux-compute-measurements");
            notes.open = true;
            notes.querySelector("summary").focus();
            notes.closest(".ux-compute-details").scrollIntoView({ block: "start" });
          }
        }
      }
      if (event.target.closest("[data-open-compute]")) {
        element("details-dialog")?.close();
        state.computeHardware = "";
        activateWorkspace("compute");
        element("ux-tab-compute")?.focus();
      }
      if (event.target.closest("a[href='#metric-definitions'], a[href='#split-definitions'], a[href='#training-definitions']"))
        activateWorkspace("methodology");
      document.querySelectorAll(".ux-menu[open]").forEach((menu) => {
        if (!menu.contains(event.target) || event.target.closest("button")) menu.open = false;
      });
    });
    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-score-precision]")) applyScorePrecision(event.target.closest(".ux-score-breakdown"), event.target.checked);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape")
        document.querySelectorAll(".ux-menu[open]").forEach((menu) => {
          menu.open = false;
          menu.querySelector("summary").focus();
        });
    });
  }

  function configureEvents() {
    configureUxEvents();
    element("open-submission-repo")?.addEventListener("click", (event) => {
      if (event.currentTarget.disabled || !activeDataset()) return;
      const sourceRef = String(window.FluidsBenchSubmissionSourceRef || "main");
      window.open(
        `https://github.com/neilashton/fluidsbench-submission/tree/${encodeURIComponent(sourceRef)}/submissions/${activeDataset().slug}`,
        "_blank",
        "noopener,noreferrer"
      );
    });
    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-leaderboard-dataset-select]")) setDataset(event.target.value);
      else if (event.target.matches("[data-leaderboard-split-select]")) setSplit(event.target.value);
      else if (event.target.matches("[data-profile-case-select]")) {
        state.profileCase = event.target.value;
        syncProfileCaseSelects();
        void refreshProfileContext();
        updateUrl();
      } else if (event.target.matches("[data-comparison-model]")) {
        if (event.target.checked && state.comparedModelIds.size >= maxFigureModels) {
          event.target.checked = false;
          element("comparison-model-count").textContent = `Choose at most ${maxFigureModels} models for readable, color-consistent figures.`;
          return;
        }
        if (event.target.checked) state.comparedModelIds.add(event.target.value);
        else state.comparedModelIds.delete(event.target.value);
        state.staleComparedModelIds.delete(event.target.value);
        updateFigureSelection();
      } else if (event.target.matches("[data-radar-model]")) {
        if (event.target.checked && state.radarModelIds.size >= maxRadarModels) {
          event.target.checked = false;
          element("radar-model-count").textContent = `Choose at most ${maxRadarModels} models for a readable radar comparison.`;
          return;
        }
        if (event.target.checked) state.radarModelIds.add(event.target.value);
        else state.radarModelIds.delete(event.target.value);
        updateRadarSelection();
      }
    });
    element("type-filter")?.addEventListener("change", (event) => {
      state.modelType = event.target.value;
      setDefaultRadarModels();
      renderTable();
      renderRadarModelPicker();
      renderRadarChart();
      updateFigureSelection();
    });
    element("show-all-versions")?.addEventListener("change", (event) => {
      state.showAllVersions = event.target.checked;
      renderTable();
      renderRadarModelPicker();
      renderRadarChart();
      updateUrl();
    });
    element("leaderboard-metric-view-toggle")?.addEventListener("click", () => {
      if (state.metricView === "full") state.metricView = "summary";
      else {
        state.metricView = "full";
        initializeVisibleGroups();
      }
      renderColumnToggles();
      renderTable();
      updateUrl();
    });
    element("comparison-metric")?.addEventListener("change", (event) => {
      state.comparisonMetric = event.target.value;
      renderComparisonChart();
      updateUrl();
    });
    element("scatter-x-axis")?.addEventListener("change", (event) => {
      state.scatterX = event.target.value;
      renderScatterChart();
      updateUrl();
    });
    element("scatter-y-axis")?.addEventListener("change", (event) => {
      state.scatterY = event.target.value;
      renderScatterChart();
      updateUrl();
    });
    element("regional-field")?.addEventListener("change", () => void prepareRegionalExplorer());
    element("regional-weighting")?.addEventListener("change", () => void prepareRegionalExplorer());
    element("export-leaderboard-csv")?.addEventListener("click", exportCsv);
    element("export-leaderboard-json")?.addEventListener("click", exportJson);
    element("leaderboard-export-scope")?.addEventListener("change", (event) => {
      state.exportScope = event.target.value === "full" ? "full" : "current";
    });
    element("select-top-radar-models")?.addEventListener("click", () => {
      setDefaultRadarModels();
      updateRadarSelection();
    });
    element("clear-radar-models")?.addEventListener("click", () => {
      state.radarModelIds = new Set();
      updateRadarSelection();
    });
    element("select-all-comparison-models")?.addEventListener("click", () => {
      setDefaultComparedModels();
      updateFigureSelection();
    });
    element("clear-comparison-models")?.addEventListener("click", () => {
      state.comparedModelIds = new Set();
      state.staleComparedModelIds = new Set();
      updateFigureSelection();
    });
    document.querySelectorAll("[data-analysis-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        activateAnalysisTab(tab.dataset.analysisTab);
        updateUrl();
      });
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        const tabs = Array.from(document.querySelectorAll("[data-analysis-tab]"));
        const index = tabs.indexOf(event.currentTarget);
        const nextIndex =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        event.preventDefault();
        tabs[nextIndex]?.focus();
        activateAnalysisTab(tabs[nextIndex]?.dataset.analysisTab);
      });
    });
    element("leaderboard-advanced-analysis")?.addEventListener("toggle", (event) => {
      if (event.currentTarget.open) window.requestAnimationFrame(resizeVisibleCharts);
    });
    element("open-citation-dialog")?.addEventListener("click", openCitationDialog);
    element("copy-citation-text")?.addEventListener("click", () => void copyCitation("plain"));
    element("copy-citation-bibtex")?.addEventListener("click", () => void copyCitation("bibtex"));
    element("close-details-dialog")?.addEventListener("click", () => element("details-dialog").close());
    element("details-dialog")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    });
    element("details-dialog")?.addEventListener("close", () => {
      if (!state.resultId) return;
      state.resultId = "";
      updateUrl();
      renderReleaseMetadata();
    });
    element("close-citation-dialog")?.addEventListener("click", () => element("citation-dialog").close());
    element("citation-dialog")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    });
    document.addEventListener("click", (event) => {
      const revisionLink = event.target.closest("[data-result-revision]");
      if (revisionLink) {
        const revisionRow = resultRowById(revisionLink.dataset.resultRevision);
        if (revisionRow) {
          event.preventDefault();
          openDetails(revisionRow);
        }
        return;
      }
      const resultCitationButton = event.target.closest("[data-copy-result-citation]");
      if (resultCitationButton) {
        void copyResultCitation(resultCitationButton.dataset.copyResultCitation);
        return;
      }
      const figureButton = event.target.closest("[data-figure-key][data-figure-format]");
      if (figureButton) {
        void exportFigure(figureButton.dataset.figureKey, figureButton.dataset.figureFormat);
        return;
      }
      const captionButton = event.target.closest("[data-copy-caption]");
      if (captionButton) {
        void copyFigureCaption(captionButton.dataset.copyCaption);
        return;
      }
      const profileDataButton = event.target.closest("[data-profile-data-index][data-profile-data-format]");
      if (profileDataButton) {
        exportProfileData(Number(profileDataButton.dataset.profileDataIndex), profileDataButton.dataset.profileDataFormat);
      }
    });
    document.addEventListener("mouseover", (event) => {
      const button = event.target.closest(".leaderboard-column-help");
      if (button) showHelp(button);
    });
    document.addEventListener("focusin", (event) => {
      const button = event.target.closest(".leaderboard-column-help");
      if (button) showHelp(button);
    });
    document.addEventListener("mouseout", (event) => {
      if (event.target.closest(".leaderboard-column-help")) scheduleHelpHide();
    });
    document.addEventListener("focusout", (event) => {
      if (event.target.closest(".leaderboard-column-help")) scheduleHelpHide();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !element("column-help-popover").hidden) {
        const button = activeHelpButton;
        hideHelp();
        button?.focus();
      }
    });
    window.addEventListener("resize", hideHelp);
    window.addEventListener("popstate", () => {
      const restored = readUrlState();
      state.requestedReleaseId = restored.releaseId;
      state.releaseMismatch = Boolean(restored.releaseId && restored.releaseId !== dataRelease().id);
      const dataset = datasetEntries().find((candidate) => slug(candidate.name) === restored.dataset) || datasetEntries()[0];
      if (dataset) void setDataset(dataset.name, restored, false);
    });
    const helpPopover = element("column-help-popover");
    helpPopover?.addEventListener("mouseenter", () => window.clearTimeout(helpHideTimer));
    helpPopover?.addEventListener("mouseleave", scheduleHelpHide);
    helpPopover?.addEventListener("focusin", () => window.clearTimeout(helpHideTimer));
    helpPopover?.addEventListener("focusout", scheduleHelpHide);
    helpPopover?.addEventListener("click", (event) => {
      if (event.target.closest("a")) hideHelp();
    });
  }

  async function initialize() {
    configureEvents();
    try {
      const loadedManifest = await fetchJsonWithProvenance(manifestUrl, "leaderboard manifest");
      const manifestCheck = verifyManifestSha256(loadedManifest.sha256);
      state.loadedManifestSha256 = loadedManifest.sha256;
      state.manifestPinVerified = manifestCheck.verified;
      state.manifest = loadedManifest.data;
      if (!Array.isArray(state.manifest.metric_definitions) || !Array.isArray(state.manifest.training_regimes) || !datasetEntries().length) {
        throw new Error("manifest is missing dataset-driven leaderboard definitions");
      }
      state.metrics = new Map(state.manifest.metric_definitions.map((definition) => [definition.id, definition]));
      const restored = readUrlState();
      state.requestedReleaseId = restored.releaseId;
      state.releaseMismatch = Boolean(restored.releaseId && restored.releaseId !== dataRelease().id);
      const initial = datasetEntries().find((dataset) => slug(dataset.name) === restored.dataset) || datasetEntries()[0];
      await setDataset(initial.name, restored, false);
    } catch (error) {
      showError(error);
      console.error(error);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
