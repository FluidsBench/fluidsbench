---
layout: page
published: false
permalink: /datasets/blendednet/
title: BlendedNet dataset
page_title: BlendedNet dataset
page_description: Dataset overview and leaderboard submission format for BlendedNet.
nav: false
hide_header_background: true
compact_masthead: true
---

<div class="dataset-page">
  {% include dataset_intro.html slug="blendednet" %}

  <section class="dataset-panel dataset-getting-started">
    {% include dataset_getting_started.html heading=2 slug="blendednet" %}
  </section>

  {% include dataset_design_space.html slug="blendednet" %}

  <section class="dataset-section">
    <h2>Candidate benchmark split</h2>
    <p>
      The public release contains 8,830 converged cases across 999 geometries. The associated baseline uses a deterministic geometry-level 90/10
      training/validation division. FluidsBench currently proposes the ID below, but its 870 case IDs are prototype-generated and are not a separate
      official Dataverse test release.
    </p>
    <div class="dataset-table-wrap">
      <table class="dataset-table">
        <thead><tr><th>Split ID</th><th>Public source population</th><th>Candidate test size</th><th>Status</th></tr></thead>
        <tbody>
          <tr>
            <td><code>geometry_holdout</code></td>
            <td>8,830 cases from 999 geometries</td>
            <td>870 cases</td>
            <td>Prototype mapping; not active</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      Before activation, the exact geometry-disjoint train, validation, and test lists must be published against Dataverse version 1.0, together with
      the finalized evaluator and native surface-area support. Until then, this row documents intent and cannot be used for an official submission.
    </p>
  </section>

  <section class="dataset-section">
    {% include dataset_submission.html heading=2 slug="blendednet" dataset="BlendedNet" %}
  </section>

  <section class="dataset-section">
    {% include dataset_scoring_contract.html heading=2 slug="blendednet" dataset="BlendedNet" %}
  </section>

  <section class="dataset-section">
    <h2>Leaderboard metrics</h2>
    <p>
      The primary field error is the mean area-weighted relative L2 across <code>Cp</code>, <code>Cfx</code>,
      <code>Cfy</code>, and <code>Cfz</code>. Every field is evaluated at every vertex in the released VTK
      <code>POLYDATA</code> surface. An unweighted vertex relative L2 (each vertex counts equally) is reported alongside each primary value for source-paper
      and point-model comparison. Lower field error is better. The four-field aggregate is a FluidsBench display rule;
      the paper reports component metrics separately.
    </p>
    <p><code>MSE = (1/N) sum_i (yhat_i-y_i)^2</code></p>
    <p><code>MAE = (1/N) sum_i |yhat_i-y_i|</code></p>
    <p><code>L1_rel(%) = 100 sum_i |yhat_i-y_i| / sum_i |y_i|</code></p>
    <p><code>L2_rel(w, %) = 100 sqrt(sum_i w_i (yhat_i-y_i)^2) / sqrt(sum_i w_i y_i^2)</code></p>
    <p>
      Use deterministic mass-lumped dual surface areas for the primary value and <code>w_i = 1</code> for the secondary
      unweighted vertex value. Compute each complete case before macro-averaging cases.
    </p>
    <p><code>R2 = 1 - sum_i (y_i-yhat_i)^2 / sum_i (y_i-mean(y))^2</code></p>
    <p><code>surface_mean_L2 = (area_L2_Cp + area_L2_Cfx + area_L2_Cfy + area_L2_Cfz) / 4</code></p>
    <p>
      For the current prototype release, leaderboard rank uses the higher-is-better composite score
      <code>overall_score = clip(100 - surface_mean_L2, 0, 100)</code>. This provisional transformation preserves the
      ordering of the
      underlying four-field error while giving every FluidsBench dataset the same ranking-column ID. The component
      errors remain available for interpretation and comparison.
    </p>
  </section>

  <section class="dataset-section">
    <h2>Profile comparisons</h2>
    <p>
      BlendedNet publishes surface coefficient fields rather than full three-dimensional flow fields. The leaderboard
      therefore shows pressure and skin-friction cuts, but does not invent a velocity-profile comparison.
    </p>
    <p>
      Current ground-truth and submitted curves are clearly labelled illustrative dummy data. They must be replaced once
      FluidsBench publishes a canonical case, extraction coordinates, interpolation rule, and tolerance for each cut.
    </p>
  </section>

  <section class="dataset-section">
    <h2>Citation</h2>
    <p>
      Nicholas Sung, Steven Spreizer, Mohamed Elrefaie, Kaira Samuel, Matthew C. Jones, and Faez Ahmed. "BlendedNet: A
      Blended Wing Body Aircraft Dataset and Surrogate Model for Aerodynamic Predictions." Volume 3B: 51st Design
      Automation Conference, IDETC-CIE2025. ASME, August 2025.
    </p>
  </section>

  <section class="dataset-section">
    <h2>Related links</h2>
    <ul>
      <li><a href="https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/VJT9EP">BlendedNet dataset on Harvard Dataverse</a></li>
      <li><a href="https://doi.org/10.1115/DETC2025-168977">ASME conference paper</a></li>
      <li><a href="https://arxiv.org/abs/2509.07209">Open-access paper on arXiv</a></li>
      <li><a href="https://github.com/FluidsBench/fluidsbench-submission">FluidsBench submission repository</a></li>
    </ul>
  </section>
</div>
