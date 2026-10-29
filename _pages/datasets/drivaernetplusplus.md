---
layout: page
permalink: /datasets/drivaernetplusplus/
title: DrivAerNet++ dataset
page_title: DrivAerNet++ dataset
page_description: Dataset overview and leaderboard submission format for DrivAerNet++.
description:
nav: false
hide_header_background: true
compact_masthead: true
---

<div class="dataset-page">
  {% include dataset_intro.html slug="drivaernetplusplus" %}

  <section class="dataset-panel">
    <h3>Dataset summary</h3>
    <dl class="dataset-facts">
      <div>
        <dt>Geometry</dt>
        <dd>Realistic DrivAer-derived car configurations, including fastback, notchback, and estateback categories.</dd>
      </div>
      <div>
        <dt>Cases</dt>
        <dd>8,150 pressure-release designs; 8,121 designs in the published multimodal splits.</dd>
      </div>
      <div>
        <dt>Primary CarBench task</dt>
        <dd>Surface kinematic pressure prediction from geometry.</dd>
      </div>
      <div>
        <dt>Current FluidsBench split</dt>
        <dd>
          <code>official_test</code> covers all 1,154 test designs and every native surface pressure point.
          The dataset owner has confirmed the scientific definition. See the submission guide for current availability.
        </dd>
      </div>
      <div>
        <dt>Reported CarBench metrics</dt>
        <dd>Surface pressure MSE, MAE, RMSE, pressure-field R<sup>2</sup>, relative L2, model size, memory, and latency.</dd>
      </div>
      <div>
        <dt>Current FluidsBench status</dt>
        <dd>
          Surface pressure in the released VTK <code>p</code> array is the only confirmed field task. Wall shear, full
          volume fields and forces are outside this pressure-only release. Three evaluator-extracted Cp profiles are available for comparison only.
        </dd>
      </div>
      <div>
        <dt>Licence</dt>
        <dd>CC BY-NC 4.0; downstream use must satisfy the source dataset's non-commercial terms.</dd>
      </div>
    </dl>
  </section>

  <section id="dataset-start" class="dataset-panel dataset-getting-started">
    {% include dataset_getting_started.html slug="drivaernetplusplus" %}
  </section>

{% include dataset_design_space.html slug="drivaernetplusplus" %}

  <section class="dataset-panel">
    {% include dataset_submission.html slug="drivaernetplusplus" dataset="DrivAerNet++" %}

  </section>

  <section id="dataset-evaluation" class="dataset-panel">
    {% include dataset_scoring_contract.html slug="drivaernetplusplus" dataset="DrivAerNet++" %}
  </section>

  <section class="dataset-panel">
    <h3>Cp stations</h3>
    <p>
      DrivAerNet++ publishes surface pressure over annotated vehicle components but not a canonical set of one-dimensional
      Cp traces. The evaluator extracts these three report-only traces at frozen native points on every test design,
      using <code>Cp = p / 450</code>. They do not contribute to the score. The dataset owner has confirmed these three
      stations and retirement of the wheelhouse trace, which could not be defined consistently across all test designs.
    </p>
    <div class="dataset-table-wrap">
      <table class="dataset-table compact">
        <thead><tr><th>Station ID</th><th>Displayed station</th></tr></thead>
        <tbody>
          <tr><td><code>upper_body_centerline</code></td><td>Upper-body component centreline.</td></tr>
          <tr><td><code>underbody_centerline</code></td><td>Smooth or detailed underbody centreline.</td></tr>
          <tr><td><code>rear_body_centerline</code></td><td>Fastback, notchback, or estateback rear-body centreline.</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="dataset-panel">
    <h3>Release decisions</h3>
    <p>
      Every native pressure point is scored as stored, including the documented localized pressure extremes;
      no points are masked. The 29 pressure-release designs absent from the published splits remain excluded
      because other data modalities were incomplete. The 1,154-case test list is unchanged.
      These decisions and the release preparation are recorded in the
      <a href="{{ site.submission_repository_url }}/blob/{{ site.submission_source_ref }}/benchmark-specs/drivaernetplusplus/OWNER_APPROVAL.md">dataset-owner approval record</a>.
    </p>
  </section>

  <section class="dataset-panel">
    <h3>Metric definitions</h3>
    <dl class="metric-definition-list">
      <div>
        <dt>Relative L2 error</dt>
        <dd>
          For each case, map dataset-native kinematic-pressure predictions to every point carrying <code>p</code> in the release-bound
          VTK surface. FluidsBench reports an area-weighted relative L2 as primary and unweighted point
          relative L2 (each point counts equally) as secondary. Calculate each complete-case percentage first, then macro-average the cases.
        </dd>
      </div>
      <div>
        <dt>Relative L1 error</dt>
        <dd>
          When reported as a supplementary metric, relative L1 uses every required pressure point and the same
          dual-area weighting as the primary relative L2.
        </dd>
      </div>
      <div>
        <dt>Surface pressure relative L2</dt>
        <dd>
          CarBench reports an unweighted point relative L2 (each point counts equally) on the DrivAerNet++ geometry-disjoint evaluation set. FluidsBench
          evaluates both area-weighted primary and equal-point secondary relative L2 on every native test point.
          Leaderboard results come from reviewed submission packages.
        </dd>
      </div>
      <div>
        <dt>Pressure-field R<sup>2</sup></dt>
        <dd>
          Coefficient of determination over flattened surface pressure samples:
          <code>1 - sum((q_pred - q_true)^2) / sum((q_true - mean(q_true))^2)</code>.
        </dd>
      </div>
    </dl>
    <p>
      The pressure-only benchmark reports the higher-is-better composite score
      <code>overall_score = clip(100 - surface_pressure_rel_l2, 0, 100)</code>, where
      <code>surface_pressure_rel_l2</code> is the primary
      area-weighted percentage error. The underlying pressure metrics remain visible alongside it.
    </p>
  </section>

  <section class="dataset-panel">
    <h3>Evaluate and submit</h3>
    <p>
      Generate native-point pressure predictions for all 1,154 test designs, download the prepared support,
      evaluate with recovery, and package the result using the
      <a href="{{ site.submission_repository_url }}/blob/{{ site.submission_source_ref }}/benchmark-specs/drivaernetplusplus/QUICKSTART.md">participant quickstart</a>. Follow the <a href="{{ '/run/' | relative_url }}#drivaernetplusplus">submission instructions</a> to propose the generated result directory for review.
    </p>
  </section>

  <section class="dataset-panel">
    <h3>References</h3>
    <ul>
      <li><a href="https://arxiv.org/abs/2512.07847">CarBench paper</a></li>
      <li><a href="https://github.com/Mohamedelrefaie/CarBench">CarBench code</a></li>
      <li><a href="https://github.com/Mohamedelrefaie/DrivAerNet">DrivAerNet++ repository</a></li>
      <li><a href="https://huggingface.co/datasets/MoElrefaie/DrivAerNet">DrivAerNet++ Hugging Face dataset</a></li>
    </ul>
  </section>
</div>
