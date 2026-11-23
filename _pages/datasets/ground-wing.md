---
layout: page
dataset_id: ground-wing
permalink: /datasets/ground-wing/
title: Ground-Wing dataset
page_title: Ground-Wing dataset
page_description: Dataset overview and leaderboard submission format for Ground-Wing.
nav: false
hide_header_background: true
compact_masthead: true
---

{% if site.data.leaderboard_display["ground-wing"].coming_soon %}
{% include dataset_coming_soon.html slug="ground-wing" %}
{% else %}

<div class="dataset-page">
  {% include dataset_intro.html slug="ground-wing" %}

  <section class="dataset-panel dataset-getting-started">
    {% include dataset_getting_started.html heading=2 slug="ground-wing" %}
  </section>

{% include dataset_design_space.html slug="ground-wing" %}

  <section class="dataset-section">
    <h2>Candidate benchmark splits</h2>
    <p>
      The source paper defines three splits over 194 geometries and 770 cases. Every ride height of a geometry stays in the same subset, so no
      test geometry is seen during training at another ride height. The case IDs bound by FluidsBench are prototype-generated and cannot be used
      for an official submission.
    </p>
    <div class="dataset-table-wrap">
      <table class="dataset-table">
        <thead><tr><th>Split ID</th><th>Train</th><th>Validation</th><th>Test</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td><code>stratified</code></td><td>547</td><td>72</td><td>71</td><td>Primary benchmark</td></tr>
          <tr><td><code>drag_outlier</code></td><td>558</td><td>68</td><td>64</td><td>Extremes of the aerodynamic envelope</td></tr>
          <tr><td><code>interpolated</code></td><td>547</td><td>72</td><td>80</td><td>Unseen airfoil profiles</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="dataset-section">
    {% include dataset_submission.html heading=2 slug="ground-wing" dataset="Ground-Wing" %}
  </section>

  <section class="dataset-section">
    <h2>Profile comparisons</h2>
    <p>The current reference and prediction curves are illustrative dummy data for interface testing.</p>
  </section>

  <section class="dataset-section">
    <h2>Related links</h2>
    <ul>
      <li><a href="https://huggingface.co/datasets/andreacenzato/Ground-Wing">Ground-Wing dataset on Hugging Face</a></li>
      <li><a href="https://arxiv.org/abs/2611.04571">Ground-Wing paper on arXiv</a></li>
      <li><a href="{{ site.submission_repository_url }}">FluidsBench submission repository</a></li>
    </ul>
  </section>
</div>
{% endif %}
