---
layout: page
permalink: /datasets/rotor37/
title: Rotor37 dataset
page_title: Rotor37 dataset
page_description: Dataset overview and leaderboard submission format for Rotor37.
nav: false
hide_header_background: true
compact_masthead: true
---

<div class="dataset-page">
  {% include dataset_intro.html slug="rotor37" %}

  <section id="dataset-start" class="dataset-panel dataset-getting-started">
    {% include dataset_getting_started.html heading=2 slug="rotor37" %}
  </section>

{% include dataset_design_space.html slug="rotor37" %}

  <section class="dataset-section">
    <h2>Published source splits</h2>
    <p>
      These source-compatible IDs document the PLAID training regimes. The reduced training sets use the published
      non-contiguous index selections; they must not be replaced by the first <em>N</em> cases. The table's evaluation
      column records the source benchmark for compatibility, not an open FluidsBench scoring set.
    </p>
    <div class="dataset-table-wrap">
      <table class="dataset-table">
        <thead><tr><th>Split ID</th><th>Train</th><th>Source evaluation (targets not public)</th></tr></thead>
        <tbody>
          <tr><td><code>train_1000</code></td><td>1,000</td><td>200</td></tr>
          <tr><td><code>train_500</code></td><td>500</td><td>200</td></tr>
          <tr><td><code>train_250</code></td><td>250</td><td>200</td></tr>
          <tr><td><code>train_125</code></td><td>125</td><td>200</td></tr>
          <tr><td><code>train_64</code></td><td>64</td><td>200</td></tr>
          <tr><td><code>train_32</code></td><td>32</td><td>200</td></tr>
          <tr><td><code>train_16</code></td><td>16</td><td>200</td></tr>
          <tr><td><code>train_8</code></td><td>8</td><td>200</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="dataset-section">
    {% include dataset_submission.html heading=2 slug="rotor37" dataset="Rotor37" %}
  </section>

  <section id="dataset-evaluation" class="dataset-section">
    {% include dataset_scoring_contract.html heading=2 slug="rotor37" dataset="Rotor37" %}
  </section>

  <section class="dataset-section">
    <h2>Leaderboard metrics</h2>
    <p>
      The current prototype retains <code>total_error</code>, the arithmetic mean of the six PLAID RRMSE values, as a
      source-compatible display. Lower <code>total_error</code> is better. On the future public-ground-truth FluidsBench
      split, every field will also have paired complete-surface relative-L2 values: deterministic dual-surface-area
      weighting is primary and unweighted vertex L2 (each vertex counts equally) is secondary. Both are calculated per case over every vertex in
      <code>/Base_2_3/Zone</code>, then macro-averaged. Dimensional MAE and RMSE remain available in <code>kg/m^3</code>,
      <code>Pa</code>, <code>K</code>, and <code>kg/s</code> where applicable; compression ratio and efficiency are
      dimensionless.
    </p>
    <p><code>RRMSE_field = sqrt((1/n) sum_i [((1/N_i) ||fhat_i - f_i||_2^2) / ||f_i||_inf^2])</code></p>
    <p><code>RRMSE_scalar = sqrt((1/n) sum_i [|shat_i - s_i|^2 / |s_i|^2])</code></p>
    <p><code>total_error = (1/6) sum_j RRMSE_j</code></p>
    <p><code>MAE = (1/N) sum_i |yhat_i-y_i|</code></p>
    <p><code>RMSE = sqrt((1/N) sum_i (yhat_i-y_i)^2)</code></p>
    <p><code>L1_rel(%) = 100 sum_i w_i |yhat_i-y_i| / sum_i w_i |y_i|</code></p>
    <p><code>L2_rel(%) = 100 sqrt(sum_i w_i (yhat_i-y_i)^2) / sqrt(sum_i w_i y_i^2)</code></p>
    <p><code>R2 = 1 - sum_i (y_i-yhat_i)^2 / sum_i (y_i-mean(y))^2</code></p>
    <p>
      For the current prototype release, leaderboard rank uses the higher-is-better composite score
      <code>overall_score = clip(100 * (1 - total_error), 0, 100)</code>. This provisional transformation preserves the
      ordering of the
      source-compatible six-quantity error while giving every FluidsBench dataset the same ranking-column ID.
      <code>total_error</code> and all component metrics remain visible alongside it.
    </p>
  </section>

  <section class="dataset-section">
    <h2>Profile comparisons</h2>
    <p>
      The station IDs are <code>span_10</code>, <code>span_50</code>, and <code>span_90</code>. At each station,
      submissions provide pressure ratio <code>p/P</code> against normalized chord, plus normalized temperature and
      density profiles. Rotor37 does not define a submitted velocity-profile comparison, so the leaderboard does not
      invent one.
    </p>
    <p>The current reference and prediction curves are illustrative dummy data for interface testing.</p>
  </section>

  <section class="dataset-section">
    <h2>Related links</h2>
    <ul>
      <li><a href="https://huggingface.co/datasets/PLAID-datasets/Rotor37">PLAID Rotor37 dataset</a></li>
      <li><a href="https://zenodo.org/records/14840190">Rotor37 archive on Zenodo</a></li>
      <li><a href="https://arxiv.org/abs/2505.02974">PLAID benchmark paper</a></li>
      <li><a href="https://arxiv.org/abs/2305.12871">MMGP Rotor37 study</a></li>
      <li><a href="https://github.com/neilashton/fluidsbench-submission">FluidsBench submission repository</a></li>
    </ul>
  </section>
</div>
