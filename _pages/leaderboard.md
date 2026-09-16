---
layout: page
permalink: /
title: leaderboard
description:
nav: false
hide_header: true
hide_header_background: true
wide: true
chart:
  chartjs: true
  vega_lite: true
---

<div class="leaderboard-page">
  <header class="leaderboard-masthead">
    <div class="leaderboard-masthead-copy">
      <h1>FluidsBench Leaderboard</h1>
      <p>Compare published surrogate-model results across fluid-dynamics datasets.</p>
    </div>
    <div class="leaderboard-source-row">
      <span id="submission-status" class="leaderboard-submit-status">Submissions are currently closed.</span>
      <button
        id="open-submission-repo"
        class="leaderboard-submit-button"
        type="button"
        aria-describedby="submission-status"
        disabled
      >Submit a result - coming soon</button>
    </div>
  </header>

  <aside id="leaderboard-data-warning" class="leaderboard-data-warning" role="note" aria-label="Leaderboard data status">
    <strong id="leaderboard-data-warning-title">Loading release status:</strong>
    <span id="leaderboard-data-warning-text">checking the selected leaderboard data release.</span>
  </aside>

  <details class="leaderboard-release-disclosure" id="leaderboard-release-details">
    <summary>
      <span id="leaderboard-release-compact">Loading release details...</span>
      <span class="leaderboard-summary-action">Release details and downloads</span>
    </summary>
    <div class="leaderboard-release-bar" aria-label="Leaderboard data release">
      <div class="leaderboard-release-summary">
        <span class="leaderboard-release-label">Full release identifier</span>
        <strong id="leaderboard-release-id">Loading...</strong>
        <span id="leaderboard-release-meta" class="leaderboard-release-meta"></span>
        <a id="leaderboard-release-source" href="#" target="_blank" rel="noopener noreferrer" hidden>View source</a>
      </div>
      <div class="leaderboard-release-actions" aria-label="Research data actions">
        <label class="leaderboard-export-scope" for="leaderboard-export-scope">
          <span>Download rows</span>
          <select id="leaderboard-export-scope">
            <option value="current">Current filtered view</option>
            <option value="full">Full selected split</option>
          </select>
        </label>
        <button id="export-leaderboard-csv" class="leaderboard-action-button" type="button" disabled>
          <i class="fa-solid fa-file-csv" aria-hidden="true"></i><span>CSV</span>
        </button>
        <button id="export-leaderboard-json" class="leaderboard-action-button" type="button" disabled>
          <i class="fa-solid fa-file-code" aria-hidden="true"></i><span>JSON</span>
        </button>
        <button
          id="open-citation-dialog"
          class="leaderboard-action-button"
          type="button"
          aria-describedby="leaderboard-claim-eligibility"
          disabled
          hidden
        >
          <i class="fa-solid fa-quote-left" aria-hidden="true"></i><span>Cite this release</span>
        </button>
      </div>
      <p id="leaderboard-claim-eligibility" class="leaderboard-claim-eligibility" role="status" hidden></p>
      <p id="leaderboard-release-action-status" class="leaderboard-sr-only" role="status"></p>
    </div>
  </details>
  <div id="leaderboard-release-warning" class="leaderboard-profile-warning" role="alert" hidden></div>

  <section class="leaderboard-controls" aria-label="Leaderboard filters">
    <div class="leaderboard-control">
      <label class="leaderboard-control-title" for="dataset-filter">Dataset</label>
      <select id="dataset-filter" data-leaderboard-dataset-select></select>
    </div>
    <div class="leaderboard-control">
      <label class="leaderboard-control-title" for="split-filter">Split</label>
      <select id="split-filter" data-leaderboard-split-select></select>
    </div>
    <div class="leaderboard-control">
      <label class="leaderboard-control-title" for="type-filter">Model type</label>
      <select id="type-filter"><option value="">All model types</option></select>
    </div>
    <div class="leaderboard-control leaderboard-version-control" id="leaderboard-version-control">
      <span class="leaderboard-control-title">Result versions</span>
      <label for="show-all-versions" class="leaderboard-version-toggle">
        <input id="show-all-versions" type="checkbox">
        <span>Show previous versions</span>
      </label>
    </div>
  </section>

  <div id="leaderboard-error" class="leaderboard-load-error" role="alert" hidden></div>
  <div id="leaderboard-load-status" class="leaderboard-load-status" role="status" hidden></div>
  <div id="leaderboard-profile-warning" class="leaderboard-profile-warning" role="status" hidden></div>

  <div class="leaderboard-table-area">
    <div class="leaderboard-table-toolbar">
      <div class="leaderboard-metric-view-controls" role="group" aria-label="Leaderboard metric detail level">
        <span class="leaderboard-column-controls-label">Metric columns</span>
        <button
          id="leaderboard-metric-view-toggle"
          class="leaderboard-metric-view-toggle"
          type="button"
          aria-controls="leaderboard-table leaderboard-column-controls"
          aria-expanded="false"
        >Show all metrics</button>
        <span id="leaderboard-metric-view-status" class="leaderboard-metric-view-status" role="status"></span>
      </div>
      <div
        class="leaderboard-column-controls"
        id="leaderboard-column-controls"
        role="group"
        aria-label="Visible full-view column groups"
        hidden
      >
        <span class="leaderboard-column-controls-label">Full-view groups</span>
        <div class="leaderboard-column-toggles" id="leaderboard-column-toggles"></div>
      </div>
    </div>

    <details class="leaderboard-radar-panel" id="leaderboard-radar-panel" open>
      <summary>
        <span class="leaderboard-radar-title">Compare model strengths</span>
        <span class="leaderboard-radar-subtitle">Published score transforms · 100 is better</span>
      </summary>
      <div class="leaderboard-radar-content">
        <div class="leaderboard-radar-visual">
          <div class="leaderboard-radar-chart-frame">
            <canvas
              id="radar-chart"
              role="img"
              aria-label="Normalized model performance radar chart"
              aria-describedby="radar-chart-summary radar-normalization-note"
            ></canvas>
            <p id="radar-chart-summary" class="leaderboard-sr-only"></p>
            <p id="radar-chart-unavailable" class="leaderboard-radar-unavailable" role="status" hidden></p>
          </div>
          <details class="leaderboard-radar-explanation">
            <summary>How these scores are normalized</summary>
            <p id="radar-normalization-note" class="leaderboard-radar-note">
              Axes use the selected dataset's published bounded-error or bounded-quality score transform. Raw metric values remain available in the
              tooltip and table; the overall score is shown separately and is not plotted as an axis.
            </p>
          </details>
        </div>
        <aside class="leaderboard-radar-controls" aria-labelledby="radar-model-heading">
          <div>
            <h3 id="radar-model-heading">Models compared</h3>
            <p>Choose up to four results. The leading three visible results are selected initially.</p>
          </div>
          <div class="leaderboard-radar-actions">
            <button id="select-top-radar-models" class="leaderboard-action-button" type="button">Select top 3</button>
            <button id="clear-radar-models" class="leaderboard-action-button" type="button">Clear</button>
            <span id="radar-model-count" role="status"></span>
          </div>
          <div id="radar-model-options" class="leaderboard-radar-model-options"></div>
          <ul id="radar-model-summary" class="leaderboard-radar-model-summary" aria-label="Selected model overall scores"></ul>
        </aside>
      </div>
      <details class="leaderboard-numeric-data leaderboard-radar-data">
        <summary>View normalized comparison data</summary>
        <div id="radar-data-table" class="leaderboard-data-table-wrap"></div>
      </details>
    </details>

    <section class="leaderboard-table-wrap" aria-label="CFD leaderboard table">
      <table class="leaderboard-table" id="leaderboard-table">
        <thead><tr id="leaderboard-header-row"></tr></thead>
        <tbody id="leaderboard-body"></tbody>
      </table>
    </section>
    <details class="leaderboard-ranking-disclosure">
      <summary>How ranking works</summary>
      <p id="leaderboard-ranking-policy" class="leaderboard-ranking-policy"></p>
    </details>

  </div>

  <details class="leaderboard-progressive-panel leaderboard-analysis" id="leaderboard-advanced-analysis">
    <summary>
      <span>Explore detailed figures</span>
      <small>Metric comparison, scatter plots and profile curves</small>
    </summary>
    <div class="leaderboard-progressive-body">
  <fieldset class="leaderboard-model-picker" aria-describedby="comparison-model-description">
    <legend>Models shown in detailed figures</legend>
    <p id="comparison-model-description">
      Choose models for the figures below. Up to twelve can be shown; any unavailable values are identified in the figure summary.
    </p>
    <div class="leaderboard-model-picker-actions">
      <button id="select-all-comparison-models" class="leaderboard-action-button" type="button">Select up to 12</button>
      <button id="clear-comparison-models" class="leaderboard-action-button" type="button">Clear</button>
      <span id="comparison-model-count" role="status"></span>
    </div>
    <div id="comparison-model-options" class="leaderboard-model-options"></div>
  </fieldset>

  <div class="leaderboard-analysis-tabs" role="tablist" aria-label="Detailed figure type">
    <button id="analysis-tab-comparison" type="button" role="tab" aria-selected="true" aria-controls="analysis-panel-comparison" data-analysis-tab="comparison">Metric comparison</button>
    <button id="analysis-tab-scatter" type="button" role="tab" aria-selected="false" aria-controls="analysis-panel-scatter" data-analysis-tab="scatter">Metric scatter</button>
    <button id="analysis-tab-profiles" type="button" role="tab" aria-selected="false" aria-controls="analysis-panel-profiles" data-analysis-tab="profiles">Profiles</button>
    <button id="analysis-tab-regional" type="button" role="tab" aria-selected="false" aria-controls="analysis-panel-regional" data-analysis-tab="regional">Field regions</button>
  </div>

  <section class="leaderboard-panel leaderboard-comparison-panel" id="analysis-panel-comparison" role="tabpanel" aria-labelledby="analysis-tab-comparison" data-analysis-panel="comparison">
    <div class="leaderboard-panel-heading">
      <div>
        <h3>Metric comparison</h3>
        <p id="comparison-description">Compare the leading submissions for one metric.</p>
      </div>
      <div class="chart-control-row">
        <div class="chart-control">
          <label class="chart-control-title" for="comparison-metric">Metric</label>
          <select id="comparison-metric"></select>
        </div>
      </div>
    </div>
    <div class="leaderboard-figure-toolbar" role="group" aria-label="Metric comparison figure actions">
      <button class="leaderboard-action-button" type="button" data-figure-key="comparison" data-figure-format="svg">SVG</button>
      <button class="leaderboard-action-button" type="button" data-figure-key="comparison" data-figure-format="png">High-res PNG</button>
      <button class="leaderboard-action-button" type="button" data-figure-key="comparison" data-figure-format="print">Print / save PDF</button>
      <button class="leaderboard-action-button" type="button" data-copy-caption="comparison">Copy caption</button>
    </div>
    <div class="chart-frame comparison-chart-frame">
      <canvas id="comparison-chart" role="img" aria-label="Leaderboard metric comparison chart" aria-describedby="comparison-chart-summary"></canvas>
      <p id="comparison-chart-summary" class="leaderboard-sr-only"></p>
    </div>
    <p id="comparison-figure-caption" class="leaderboard-figure-caption"></p>
    <details class="leaderboard-numeric-data">
      <summary>View numeric figure data</summary>
      <div id="comparison-data-table" class="leaderboard-data-table-wrap"></div>
    </details>
  </section>

  <section class="leaderboard-panel leaderboard-scatter-panel" id="analysis-panel-scatter" role="tabpanel" aria-labelledby="analysis-tab-scatter" data-analysis-panel="scatter" hidden>
    <div class="leaderboard-panel-heading">
      <div>
        <h3>Metric scatter</h3>
        <p>Choose any two numeric columns available for the selected dataset.</p>
      </div>
      <div class="chart-control-row">
        <div class="chart-control">
          <label class="chart-control-title" for="scatter-x-axis">X axis</label>
          <select id="scatter-x-axis"></select>
        </div>
        <div class="chart-control">
          <label class="chart-control-title" for="scatter-y-axis">Y axis</label>
          <select id="scatter-y-axis"></select>
        </div>
      </div>
    </div>
    <div class="leaderboard-figure-toolbar" role="group" aria-label="Metric scatter figure actions">
      <button class="leaderboard-action-button" type="button" data-figure-key="scatter" data-figure-format="svg">SVG</button>
      <button class="leaderboard-action-button" type="button" data-figure-key="scatter" data-figure-format="png">High-res PNG</button>
      <button class="leaderboard-action-button" type="button" data-figure-key="scatter" data-figure-format="print">Print / save PDF</button>
      <button class="leaderboard-action-button" type="button" data-copy-caption="scatter">Copy caption</button>
    </div>
    <div class="chart-frame scatter-chart-frame">
      <canvas id="scatter-chart" role="img" aria-label="Leaderboard metric scatter chart" aria-describedby="scatter-chart-summary"></canvas>
      <p id="scatter-chart-summary" class="leaderboard-sr-only"></p>
    </div>
    <p id="scatter-figure-caption" class="leaderboard-figure-caption"></p>
    <details class="leaderboard-numeric-data">
      <summary>View numeric figure data</summary>
      <div id="scatter-data-table" class="leaderboard-data-table-wrap"></div>
    </details>
  </section>

  <div id="analysis-panel-profiles" role="tabpanel" aria-labelledby="analysis-tab-profiles" data-analysis-panel="profiles" hidden>
    <div id="leaderboard-profile-panels" class="leaderboard-profile-panels"></div>
  </div>

  <section class="leaderboard-panel leaderboard-regional-panel" id="analysis-panel-regional" role="tabpanel" aria-labelledby="analysis-tab-regional" data-analysis-panel="regional" hidden>
    <div class="leaderboard-panel-heading">
      <div>
        <h3>Native field regions</h3>
        <p>Explore where selected DrivAerML, HiLiftAeroML, and AhmedML native-field errors occur. HiLift volume fields default to equal-case regional RMSE normalized by each case's whole-volume truth RMS; local relative L2 and R2 remain in the numeric diagnostics. These checksum-bound reports have zero official scoring weight.</p>
      </div>
      <div class="chart-control-row">
        <div class="chart-control">
          <label class="chart-control-title" for="regional-field">Field</label>
          <select id="regional-field">
            <option value="surface_pressure">Surface pressure</option>
            <option value="surface_wall_shear">Surface wall shear</option>
            <option value="volume_pressure">Volume pressure</option>
            <option value="volume_velocity">Volume velocity</option>
          </select>
        </div>
        <div class="chart-control">
          <label class="chart-control-title" for="regional-weighting">Regional aggregation</label>
          <select id="regional-weighting">
            <option value="primary">Official field weighting</option>
            <option value="equal_entity">Equal native entities</option>
            <option value="physical">Physical weighting</option>
          </select>
        </div>
      </div>
    </div>
    <p id="regional-status" class="leaderboard-regional-status" role="status">Select one or more compatible results to inspect their regional reports.</p>
    <div id="regional-zone-guide" class="leaderboard-regional-zone-guide"></div>
    <p id="regional-zone-note" class="leaderboard-regional-note"></p>
    <div class="leaderboard-figure-toolbar" role="group" aria-label="Regional figure actions">
      <button class="leaderboard-action-button" type="button" data-figure-key="regional" data-figure-format="svg">SVG</button>
      <button class="leaderboard-action-button" type="button" data-figure-key="regional" data-figure-format="png">High-res PNG</button>
      <button class="leaderboard-action-button" type="button" data-figure-key="regional" data-figure-format="print">Print / save PDF</button>
      <button class="leaderboard-action-button" type="button" data-copy-caption="regional">Copy caption</button>
    </div>
    <div class="chart-frame leaderboard-regional-chart-frame">
      <canvas id="regional-chart" role="img" aria-label="Regional field error chart" aria-describedby="regional-chart-summary"></canvas>
      <p id="regional-chart-summary" class="leaderboard-sr-only"></p>
    </div>
    <p id="regional-figure-caption" class="leaderboard-figure-caption"></p>
    <details class="leaderboard-numeric-data">
      <summary>View numeric regional data</summary>
      <div id="regional-data-table" class="leaderboard-data-table-wrap"></div>
    </details>
  </section>
    </div>
  </details>

  <details class="leaderboard-progressive-panel leaderboard-methodology" id="leaderboard-methodology">
    <summary>
      <span>Methodology and definitions</span>
      <small>Ranking, metrics, splits and training terminology</small>
    </summary>
    <div class="leaderboard-progressive-body leaderboard-definitions" aria-label="Leaderboard definitions">
    <details class="metric-definitions" id="metric-definitions">
      <summary>Metric definitions</summary>
      <div class="leaderboard-definition-body">
        <p id="metric-definitions-intro"></p>
        <div id="metric-definitions-list" class="leaderboard-definition-list"></div>
      </div>
    </details>

    <details class="metric-definitions" id="split-definitions">
      <summary>Split definitions</summary>
      <div class="leaderboard-definition-body">
        <p id="split-definitions-intro"></p>
        <dl id="split-definitions-list"></dl>
      </div>
    </details>

    <details class="metric-definitions" id="training-definitions">
      <summary>Training definitions</summary>
      <div class="leaderboard-definition-body">
        <p id="training-definitions-intro"></p>
        <dl id="training-definitions-list"></dl>
      </div>
    </details>

    </div>

  </details>

  <dialog class="details-dialog" id="details-dialog" aria-labelledby="details-dialog-title">
    <article class="details-dialog-card">
      <div class="details-dialog-header">
        <div>
          <p id="details-dialog-subtitle" class="details-dialog-subtitle"></p>
          <h3 id="details-dialog-title">Submission details</h3>
        </div>
        <button id="close-details-dialog" class="details-dialog-close" type="button" aria-label="Close details">&times;</button>
      </div>
      <div id="details-dialog-body" class="details-dialog-body"></div>
    </article>
  </dialog>

  <dialog class="details-dialog citation-dialog" id="citation-dialog" aria-labelledby="citation-dialog-title">
    <article class="details-dialog-card">
      <div class="details-dialog-header">
        <div>
          <p class="details-dialog-subtitle">Current leaderboard view</p>
          <h3 id="citation-dialog-title">Citation</h3>
        </div>
        <button id="close-citation-dialog" class="details-dialog-close" type="button" aria-label="Close citation">&times;</button>
      </div>
      <div class="citation-dialog-body">
        <section>
          <div class="citation-heading-row">
            <h4>Plain text</h4>
            <button id="copy-citation-text" class="leaderboard-action-button" type="button">
              <i class="fa-solid fa-copy" aria-hidden="true"></i><span>Copy</span>
            </button>
          </div>
          <p id="citation-text" class="citation-text"></p>
        </section>
        <section>
          <div class="citation-heading-row">
            <h4>BibTeX</h4>
            <button id="copy-citation-bibtex" class="leaderboard-action-button" type="button">
              <i class="fa-solid fa-copy" aria-hidden="true"></i><span>Copy</span>
            </button>
          </div>
          <pre class="citation-bibtex"><code id="citation-bibtex"></code></pre>
        </section>
        <p id="citation-copy-status" class="leaderboard-copy-status" role="status"></p>
      </div>
    </article>
  </dialog>

  <div id="column-help-popover" class="column-help-popover" role="dialog" aria-label="Column information" hidden></div>
</div>

<script>
  const localLeaderboard = ["127.0.0.1", "localhost"].includes(window.location.hostname);
  const configuredLeaderboardBaseUrl =
    {{ site.leaderboard_base_url | default: "https://raw.githubusercontent.com/neilashton/fluidsbench-submission/main/" | jsonify }};
  const configuredLocalLeaderboardBaseUrl =
    {{ site.leaderboard_local_base_url | default: "http://127.0.0.1:4100/" | jsonify }};
  const selectedLeaderboardBaseUrl = localLeaderboard
    ? configuredLocalLeaderboardBaseUrl
    : configuredLeaderboardBaseUrl;
  window.FluidsBenchLeaderboardBaseUrl = selectedLeaderboardBaseUrl.endsWith("/")
    ? selectedLeaderboardBaseUrl
    : selectedLeaderboardBaseUrl + "/";
  window.FluidsBenchLeaderboardManifestUrl =
    window.FluidsBenchLeaderboardBaseUrl + "leaderboard/manifest.json";
  window.FluidsBenchLeaderboardManifestSha256 =
    {{ site.leaderboard_manifest_sha256 | default: "" | jsonify }};
  window.FluidsBenchSubmissionSourceRef =
    {{ site.submission_source_ref | default: "main" | jsonify }};
  window.FluidsBenchLeaderboardDisplay =
    {{ site.data.leaderboard_display | default: empty | jsonify }};
  window.FluidsBenchProfileGroundTruthBaseUrl =
    new URL("{{ '/assets/data/profile-ground-truth/' | relative_url }}", window.location.origin).href;
</script>
<script defer src="{{ '/assets/js/leaderboard.js' | relative_url | bust_file_cache }}"></script>
