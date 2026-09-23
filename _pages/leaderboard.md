---
layout: page
permalink: /
title: Fluidsbench leaderboard
description: Assess physics AI surrogate models across realistic fluid dynamics datasets.
og_image: /assets/img/datasets/drivaerml-flow.png
nav: false
hide_header: true
hide_header_background: true
wide: true
chart:
  chartjs: true
  vega_lite: true
---

{% if site.launch.leaderboard_visible or page.committee_review %}

<div class="leaderboard-page ux-leaderboard">
  <header class="leaderboard-masthead">
    <div class="leaderboard-masthead-copy">
      {% if page.committee_review %}
      <p class="ux-eyebrow" id="committee-review-notice" role="note">Committee preview · Prototype results</p>
      {% else %}
      <p class="ux-eyebrow">Open benchmarks for scientific machine learning</p>
      {% endif %}
      <h1>Fluidsbench leaderboard</h1>
      <p>Assess physics AI surrogate models across realistic fluid dynamics datasets</p>
    </div>
    <div class="leaderboard-source-row">
      <span id="submission-status" class="leaderboard-submit-status"></span>
      <button
        id="open-submission-repo"
        class="leaderboard-submit-button"
        type="button"
        aria-describedby="submission-status"
        disabled
      >Submissions opening soon</button>
    </div>
  </header>

  <aside id="leaderboard-data-warning" class="leaderboard-data-warning" role="note" aria-label="Leaderboard data status">
    <strong id="leaderboard-data-warning-title">Loading release status:</strong>
    <span id="leaderboard-data-warning-text">checking the selected leaderboard data release.</span>
  </aside>

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
    <details class="ux-filters ux-menu">
      <summary>More filters <span aria-hidden="true">⌄</span></summary>
      <div class="ux-menu-content">    <div class="leaderboard-control">
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
      </div>
    </details>
    <a id="ux-dataset-link" class="ux-dataset-link" data-dataset-base-url="{{ '/datasets/' | relative_url }}" href="{{ '/datasets/' | relative_url }}">About this dataset <span aria-hidden="true">↗</span></a>
  </section>

  <div id="leaderboard-error" class="leaderboard-load-error" role="alert" hidden></div>
  <div id="leaderboard-load-status" class="leaderboard-load-status" role="status" hidden></div>
  <div id="leaderboard-profile-warning" class="leaderboard-profile-warning" role="status" hidden></div>

  <div class="ux-workspace-tabs" role="tablist" aria-label="Benchmark workspace">
    <button id="ux-tab-leaderboard" type="button" role="tab" aria-selected="true" aria-controls="ux-panel-leaderboard" data-workspace-tab="leaderboard">Leaderboard</button>
    <button id="ux-tab-compare" type="button" role="tab" aria-selected="false" aria-controls="leaderboard-advanced-analysis" data-workspace-tab="compare">Compare <span id="ux-compare-count">0</span></button>
    <button id="ux-tab-compute" type="button" role="tab" aria-selected="false" aria-controls="ux-panel-compute" data-workspace-tab="compute">Compute</button>
    <button id="ux-tab-methodology" type="button" role="tab" aria-selected="false" aria-controls="leaderboard-methodology" data-workspace-tab="methodology">Methodology</button>
  </div>
  <div class="leaderboard-table-area" id="ux-panel-leaderboard" role="tabpanel" aria-labelledby="ux-tab-leaderboard" data-workspace-panel="leaderboard">
    <div class="ux-results-heading"><div><h2>Model results</h2><p id="ux-results-summary">Loading results…</p></div><span class="ux-score-hint">Select models to compare</span></div>
    <div class="leaderboard-table-toolbar">
      <label class="ux-sort-label" for="ux-sort">Sort by <select id="ux-sort"></select></label>
      <button id="ux-sort-direction" class="leaderboard-action-button" type="button" aria-label="Reverse sort direction">↑</button>
      <div class="leaderboard-metric-view-controls" role="group" aria-label="Leaderboard metric detail level">

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



    <details class="ux-menu ux-table-download"><summary>Download results <span aria-hidden="true">↓</span></summary><div class="ux-menu-content">      <div class="leaderboard-release-actions" aria-label="Research data actions">
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
      </div></div></details>
    <section class="leaderboard-table-wrap" aria-label="CFD leaderboard table">
      <table class="leaderboard-table" id="leaderboard-table">
        <thead><tr id="leaderboard-header-row"></tr></thead>
        <tbody id="leaderboard-body"></tbody>
      </table>
    </section>

  </div>

  <div class="ux-result-footer">  <details class="leaderboard-release-disclosure" id="leaderboard-release-details">
    <summary>
      <span id="leaderboard-release-compact">Loading release details...</span>
      <span class="leaderboard-summary-action">Release details</span>
    </summary>
    <div class="leaderboard-release-bar" aria-label="Leaderboard data release">
      <div class="leaderboard-release-summary">
        <span class="leaderboard-release-label">Full release identifier</span>
        <strong id="leaderboard-release-id">Loading...</strong>
        <span id="leaderboard-release-meta" class="leaderboard-release-meta"></span>
        <a id="leaderboard-release-source" href="#" target="_blank" rel="noopener noreferrer" hidden>View source</a>
      </div>

      <p id="leaderboard-claim-eligibility" class="leaderboard-claim-eligibility" role="status" hidden></p>
      <p id="leaderboard-release-action-status" class="leaderboard-sr-only" role="status"></p>
    </div>

  </details></div>
  <details class="leaderboard-progressive-panel leaderboard-analysis" id="leaderboard-advanced-analysis" data-workspace-panel="compare" role="tabpanel" aria-labelledby="ux-tab-compare" open hidden>
    <summary>
      <span>Explore detailed figures</span>
      <small>Metric comparison, scatter plots and profile curves</small>
    </summary>
    <div class="leaderboard-progressive-body">
  <fieldset class="leaderboard-model-picker" aria-describedby="comparison-model-description">
    <legend>Compare models</legend>
    <p id="comparison-model-description">
      Select up to 12 models in the leaderboard. Your selection applies to every chart.
    </p>
    <div class="leaderboard-model-picker-actions">
      <button id="select-all-comparison-models" class="leaderboard-action-button" type="button">Select top 3</button>
      <button id="clear-comparison-models" class="leaderboard-action-button" type="button">Clear</button>
      <span id="comparison-model-count" role="status"></span>
    </div>
    <button class="leaderboard-action-button" type="button" data-open-workspace="leaderboard">Edit selection</button>
    <div id="ux-selected-models" class="ux-selected-models"></div>
  </fieldset>

  <div class="leaderboard-analysis-tabs" role="tablist" aria-label="Detailed figure type">
    <button id="analysis-tab-comparison" type="button" role="tab" aria-selected="true" aria-controls="analysis-panel-comparison" data-analysis-tab="comparison">Metrics</button>
    <button id="analysis-tab-radar" type="button" role="tab" aria-selected="false" aria-controls="leaderboard-radar-panel" data-analysis-tab="radar">Radar</button>
    <button id="analysis-tab-scatter" type="button" role="tab" aria-selected="false" aria-controls="analysis-panel-scatter" data-analysis-tab="scatter">Trade-offs</button>
    <button id="analysis-tab-profiles" type="button" role="tab" aria-selected="false" aria-controls="analysis-panel-profiles" data-analysis-tab="profiles">Profiles</button>
    <button id="analysis-tab-regional" type="button" role="tab" aria-selected="false" aria-controls="analysis-panel-regional" data-analysis-tab="regional">Regions</button>
  </div>

    <section class="leaderboard-radar-panel" id="leaderboard-radar-panel" role="tabpanel" aria-labelledby="analysis-tab-radar" data-analysis-panel="radar" hidden>
      <header class="leaderboard-radar-heading">
        <h3 class="leaderboard-radar-title">Radar comparison</h3>
        <p class="leaderboard-radar-subtitle">Normalised scores · 100 is better</p>
      </header>
      <p id="ux-radar-selection-note" class="ux-chart-notes"></p>
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

      </div>
      <details class="leaderboard-numeric-data leaderboard-radar-data">
        <summary>View normalized comparison data</summary>
        <div id="radar-data-table" class="leaderboard-data-table-wrap"></div>
      </details>
    </section>

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
    <label class="ux-profile-view" for="ux-profile-view">Profile quantity <select id="ux-profile-view" aria-label="Profile quantity"></select></label>
    <div id="leaderboard-profile-panels" class="leaderboard-profile-panels"></div>
  </div>

  <section class="leaderboard-panel leaderboard-regional-panel" id="analysis-panel-regional" role="tabpanel" aria-labelledby="analysis-tab-regional" data-analysis-panel="regional" hidden>
    <div class="leaderboard-panel-heading">
      <div>
        <h3>Where do models make errors?</h3>
        <p>Regional diagnostics show where predictions differ from native CFD. These plots do not affect the benchmark score.</p><details class="ux-chart-notes"><summary>Aggregation details</summary><p>Available for DrivAerML, HiLiftAeroML and AhmedML. HiLift volume fields use equal-case regional RMSE, normalised by each case's whole-volume truth RMS. Local relative L2 and R2 remain in the numeric diagnostics.</p></details>
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

  <section id="ux-panel-compute" class="ux-compute" data-workspace-panel="compute" role="tabpanel" aria-labelledby="ux-tab-compute" hidden>
    <div class="ux-compute-heading">
      <div><p class="ux-eyebrow">Resources behind the results</p><h2>Explore the compute trade-off</h2><p>Compare physics scores with the time and hardware each model uses.</p></div>
      <div class="ux-compute-modes" role="group" aria-label="Compute view">
        <button type="button" data-compute-mode="inference" aria-pressed="true">Inference</button>
        <button type="button" data-compute-mode="training" aria-pressed="false">Training</button>
      </div>
    </div>
    <div class="ux-compute-controls">
      <label><span id="compute-hardware-label">GPU model</span> <select id="compute-hardware" aria-label="Filter compute by GPU or device model"><option value="">All GPU models</option></select></label>
      <label id="compute-axis-control">Compare by <select id="compute-axis"><option value="wall">Elapsed time / case</option><option value="device">Device time / case</option></select></label>
      <span id="compute-coverage" role="status"></span>
    </div>
    <section class="ux-compute-chart-card" aria-labelledby="compute-chart-title">
      <div class="ux-compute-chart-heading"><h3 id="compute-chart-title">Score vs inference time</h3><span id="compute-chart-direction">Less time ← · Higher score ↑</span></div>
      <p id="compute-chart-context" class="ux-compute-caption"></p>
      <div class="ux-compute-chart-frame" id="compute-chart-frame"><canvas id="compute-chart" role="img" aria-label="Physics score versus compute" aria-describedby="compute-chart-summary"></canvas></div>
      <div id="compute-empty" class="ux-compute-empty" hidden><strong>No timings reported yet</strong><p>Models will appear here as compute measurements become available.</p></div>
      <p id="compute-chart-summary" class="ux-compute-caption"></p>
    </section>
    <div class="ux-compute-table-heading"><h3>Model resources</h3><label>Sort by <select id="compute-sort"></select></label></div>
    <div class="ux-compute-table-wrap" tabindex="0" role="region" aria-label="Model compute measurements, scroll horizontally on small screens">
      <table class="ux-compute-table"><caption class="leaderboard-sr-only" id="compute-table-caption">Reported compute measurements for the current dataset and split.</caption><thead id="compute-table-head"></thead><tbody id="compute-table-body"></tbody></table>
    </div>
    <p class="ux-compute-footnote">Submitter-reported compute; hardware and timing scope may differ. Compute does not affect the physics score or leaderboard rank.</p>
    <details class="ux-compute-guide"><summary>How to read these numbers</summary><div>
      <p><strong>Elapsed time / case</strong> is campaign wall time divided by the number of cases. Parallel work makes this a campaign average, not the latency of one prediction. <strong>Device time / case</strong> is total reported device-seconds divided by cases.</p>
      <p><strong>Training device-hours</strong> sum the reported allocation across submitter training stages, including the runs covered by each stage. Upstream pretraining is excluded and flagged separately. Elapsed stage times are kept separate because stages can overlap.</p>
      <p><strong>GPU count</strong> shows maximum concurrent devices across the inference campaign, or the largest reported maximum for a training stage. It does not describe how many GPUs one prediction needs. Unconfirmed GPU models stay unconfirmed; the original hardware descriptions and any per-job counts are in measurement notes.</p>
      <p>Compare within the same dataset and split, and check hardware, device counts and preprocessing/mapping scope. Device-hours on different hardware are not equivalent. Missing or incomplete measurements are never treated as zero. Open a model for its full measurement notes.</p>
    </div></details>
  </section>

  <details class="leaderboard-progressive-panel leaderboard-methodology" id="leaderboard-methodology" data-workspace-panel="methodology" role="tabpanel" aria-labelledby="ux-tab-methodology" open hidden>
    <summary>
      <span>Methodology and definitions</span>
      <small>Ranking, metrics, splits and training terminology</small>
    </summary>
    <div class="leaderboard-progressive-body leaderboard-definitions" aria-label="Leaderboard definitions">
    <div class="ux-methodology-intro"><p class="ux-eyebrow">Understand the benchmark</p><h2>What do the scores mean?</h2><p>Compare results within the same dataset and split. The benchmark score combines the published metrics; it is not a percentage accuracy.</p></div>
    <details class="leaderboard-ranking-disclosure" open>
      <summary>How ranking works</summary>
      <p id="leaderboard-ranking-policy" class="leaderboard-ranking-policy"></p>
    </details>
    <details class="metric-definitions ux-score-methodology" id="score-calculation">
      <summary>How the overall score is calculated</summary>
      <div id="score-calculation-body" class="leaderboard-definition-body"></div>
    </details>
    <details class="metric-definitions" id="metric-definitions">
      <summary>Metric definitions</summary>
      <div class="leaderboard-definition-body">
        <p id="metric-definitions-intro"></p>
        <div id="metric-definitions-list" class="leaderboard-definition-list"></div>
      </div>
    </details>

    <details class="metric-definitions" id="pressure-definition">
      <summary>Pressure definition</summary>
      <div id="pressure-definition-body" class="leaderboard-definition-body"></div>
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
    {{ site.leaderboard_base_url | default: "https://raw.githubusercontent.com/FluidsBench/fluidsbench-submission/main/" | jsonify }};
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
  window.FluidsBenchLeaderboardPreviewMode = {{ site.preview_mode | default: false | jsonify }};
  window.FluidsBenchLeaderboardManifestSha256 =
    {{ site.leaderboard_manifest_sha256 | default: "" | jsonify }};
  window.FluidsBenchSubmissionSourceRef =
    {{ site.submission_source_ref | default: "main" | jsonify }};
  window.FluidsBenchLeaderboardDisplay =
    {{ site.data.leaderboard_display | default: empty | jsonify }};
  window.FluidsBenchPressureReferences = {{ site.data.pressure_references | jsonify }};
  window.FluidsBenchPressureReferenceUrl = {{ '/pressure-references/' | relative_url | jsonify }};
  window.FluidsBenchProfileGroundTruthBaseUrl =
    new URL("{{ '/assets/data/profile-ground-truth/' | relative_url }}", window.location.origin).href;
</script>
<script defer src="{{ '/assets/js/leaderboard-compute.js' | relative_url | bust_file_cache }}"></script>
<script defer src="{{ '/assets/js/leaderboard-scores.js' | relative_url | bust_file_cache }}"></script>
<script defer src="{{ '/assets/js/leaderboard-verification.js' | relative_url | bust_file_cache }}"></script>
<script defer src="{{ '/assets/js/leaderboard.js' | relative_url | bust_file_cache }}"></script>

{% else %}
{% include launch.liquid %}
{% endif %}
