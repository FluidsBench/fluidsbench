---
layout: page
dataset_id: vki-ls59
permalink: /datasets/vki-ls59/
title: VKI-LS59 dataset
page_title: VKI-LS59 dataset
page_description: Dataset overview and leaderboard submission format for VKI-LS59.
nav: false
hide_header_background: true
compact_masthead: true
---

{% if site.data.leaderboard_display["vki-ls59"].coming_soon %}
{% include dataset_coming_soon.html slug="vki-ls59" %}
{% else %}
<div class="dataset-page">
  {% include dataset_intro.html slug="vki-ls59" %}

  <section id="dataset-start" class="dataset-panel dataset-getting-started">
    {% include dataset_getting_started.html heading=2 slug="vki-ls59" %}
  </section>

{% include dataset_design_space.html slug="vki-ls59" %}

  <section class="dataset-section">
    <h2>Published source splits</h2>
    <p>
      These source-compatible IDs document the PLAID training regimes. Reduced VKI-LS59 training sets use the first
      <em>N</em> entries of the published training index sequence. The table's evaluation column records the source
      benchmark for compatibility, not an open FluidsBench scoring set.
    </p>
    <div class="dataset-table-wrap">
      <table class="dataset-table">
        <thead><tr><th>Split ID</th><th>Train</th><th>Source evaluation (targets not public)</th></tr></thead>
        <tbody>
          <tr><td><code>train</code></td><td>671</td><td>168</td></tr>
          <tr><td><code>train_500</code></td><td>500</td><td>168</td></tr>
          <tr><td><code>train_250</code></td><td>250</td><td>168</td></tr>
          <tr><td><code>train_125</code></td><td>125</td><td>168</td></tr>
          <tr><td><code>train_64</code></td><td>64</td><td>168</td></tr>
          <tr><td><code>train_32</code></td><td>32</td><td>168</td></tr>
          <tr><td><code>train_16</code></td><td>16</td><td>168</td></tr>
          <tr><td><code>train_8</code></td><td>8</td><td>168</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="dataset-section">
    {% include dataset_submission.html heading=2 slug="vki-ls59" dataset="VKI-LS59" %}
  </section>

  <section id="dataset-evaluation" class="dataset-section">
    {% include dataset_scoring_contract.html heading=2 slug="vki-ls59" dataset="VKI-LS59" %}
  </section>

  <section class="dataset-section">
    <h2>Leaderboard metrics</h2>
    <p>
      The current prototype retains <code>total_error</code>, the arithmetic mean of the PLAID RRMSE values for
      <code>mach</code>, <code>nut</code>, and the six scalar outputs, as a source-compatible display. On the future
      public-ground-truth FluidsBench split, the scored <code>mach</code> and <code>nut</code> domain fields will also have paired complete-domain
      relative-L2 values: unweighted vertex L2 (each vertex counts equally) is primary and area-weighted L2 is secondary. The
      one-dimensional <code>M_iso</code> curve reverses the order: length-weighted L2 is primary and unweighted vertex L2 is
      secondary. Calculate each case over every required vertex, then macro-average the cases. Lower
      <code>total_error</code> is better.
    </p>
    <p><code>RRMSE_field = sqrt((1/n) sum_i [((1/N_i) ||fhat_i - f_i||_2^2) / ||f_i||_inf^2])</code></p>
    <p><code>RRMSE_scalar = sqrt((1/n) sum_i [|shat_i - s_i|^2 / |s_i|^2])</code></p>
    <p><code>total_error = (1/m) sum_j RRMSE_j</code></p>
    <p><code>L1_rel(%) = 100 sum_i w_i |yhat_i-y_i| / sum_i w_i |y_i|</code></p>
    <p><code>L2_rel(%) = 100 sqrt(sum_i w_i (yhat_i-y_i)^2) / sqrt(sum_i w_i y_i^2)</code></p>
    <p><code>R2 = 1 - sum_i (y_i-yhat_i)^2 / sum_i (y_i-mean(y))^2</code></p>
    <p>
      For the current prototype release, leaderboard rank uses the higher-is-better composite score
      <code>overall_score = clip(100 * (1 - total_error), 0, 100)</code>. This provisional transformation preserves the
      ordering of the
      source-compatible eight-quantity error while giving every FluidsBench dataset the same ranking-column ID.
      <code>total_error</code> and all component metrics remain visible alongside it.
    </p>
    <p>
      Dimensional MAE/RMSE columns are intentionally not enabled until FluidsBench fixes a canonical public
      denormalization and unit convention for every VKI-LS59 output.
    </p>
  </section>

  <section class="dataset-section">
    <h2>Profile comparisons</h2>
    <p>
      The planned submitter-provided profile format uses <code>pressure_side</code> and <code>suction_side</code> for
      <code>M_iso</code> against normalized chord.
    </p>
    <p>
      The current curves are clearly labelled prototype data for interface testing. FluidsBench does not define a
      downstream-velocity profile because that quantity is not part of the confirmed public field target.
    </p>
  </section>

  <section class="dataset-section">
    <h2>Related links</h2>
    <ul>
      <li><a href="https://huggingface.co/datasets/PLAID-datasets/VKI-LS59">PLAID VKI-LS59 dataset</a></li>
      <li><a href="https://zenodo.org/records/14840512">VKI-LS59 archive on Zenodo</a></li>
      <li><a href="https://arxiv.org/abs/2505.02974">PLAID benchmark paper</a></li>
      <li><a href="https://github.com/neilashton/fluidsbench-submission">FluidsBench submission repository</a></li>
    </ul>
  </section>
</div>
{% endif %}
