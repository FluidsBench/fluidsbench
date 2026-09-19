---
layout: page
permalink: /datasets/airfrans/
title: AirfRANS dataset
page_title: AirfRANS dataset
page_description: Dataset overview and leaderboard submission format for AirfRANS.
description:
nav: false
hide_header_background: true
compact_masthead: true
---

<div class="dataset-page">
  {% include dataset_intro.html slug="airfrans" %}

  <section class="dataset-panel">
    <h3>Dataset summary</h3>
    <dl class="dataset-facts">
      <div>
        <dt>Geometry</dt>
        <dd>NACA 4- and 5-digit airfoils.</dd>
      </div>
      <div>
        <dt>Cases</dt>
        <dd>1,000 two-dimensional RANS simulations.</dd>
      </div>
      <div>
        <dt>Flow regime</dt>
        <dd>Subsonic, steady-state, incompressible RANS.</dd>
      </div>
      <div>
        <dt>Conditions</dt>
        <dd>Reynolds numbers between 2 million and 6 million, with angles of attack between -5 and 15 degrees.</dd>
      </div>
      <div>
        <dt>Benchmark splits</dt>
        <dd><code>Full</code>, <code>Scarce</code>, <code>Reynolds extrapolation</code>, and <code>AoA extrapolation</code>.</dd>
      </div>
      <div>
        <dt>Source fields</dt>
        <dd>
          Velocity <code>U</code>, reduced or kinematic pressure <code>p</code>, and turbulent kinematic viscosity <code>nut</code>. FluidsBench
          currently scores <code>U</code> and <code>p</code>, not <code>nut</code>.
        </dd>
      </div>
    </dl>
  </section>

  <section id="dataset-start" class="dataset-panel dataset-getting-started">
    {% include dataset_getting_started.html slug="airfrans" %}
  </section>

{% include dataset_design_space.html slug="airfrans" %}

  <section class="dataset-panel">
    {% include dataset_submission.html slug="airfrans" dataset="AirfRANS" %}

  </section>

  <section id="dataset-evaluation" class="dataset-panel">
    {% include dataset_scoring_contract.html slug="airfrans" dataset="AirfRANS" %}
  </section>

  <section class="dataset-panel">
    <h3>Required velocity-profile stations</h3>
    <p>
      Extract Cartesian <code>U_x/U_inf</code> and <code>U_y/U_inf</code> along a 0.1 m line normal to the extrados at each station. Every line
      contains 1,001 uniformly spaced samples, including both endpoints. The pinned extractor fixes surface selection, orientation, interpolation, and
      arclength checks.
    </p>
    <div class="dataset-table-wrap">
      <table class="dataset-table compact">
        <thead><tr><th>Station ID</th><th>Location</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td><code>upper_x_0_25c</code></td><td>Extrados, x/c = 0.25</td><td>Attached-flow boundary layer.</td></tr>
          <tr><td><code>upper_x_0_50c</code></td><td>Extrados, x/c = 0.50</td><td>Mid-chord boundary layer.</td></tr>
          <tr><td><code>upper_x_0_75c</code></td><td>Extrados, x/c = 0.75</td><td>Adverse-pressure-gradient region.</td></tr>
          <tr><td><code>upper_x_0_95c</code></td><td>Extrados, x/c = 0.95</td><td>Near-trailing-edge or separated-flow region.</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="dataset-panel">
    <h3>Metric definitions</h3>
    <dl class="metric-definition-list">
      <div>
        <dt>Relative L2 error</dt>
        <dd>
          For each case and target field <code>q</code>, map predictions to every required node and return predictions and
          targets to their release-native physical representation: <code>q* = inverse_transform(q)</code>. Report both the unweighted node and
          area- or length-weighted variants from the complete-case numerators and denominators, then macro-average the case
          percentages. The airfoil curve uses length weighting as primary; the two-dimensional flow domain uses
          unweighted node L2 (each node counts equally) as primary.
        </dd>
      </div>
      <div>
        <dt>Relative L1 error</dt>
        <dd>
          When reported as a supplementary metric, relative L1 uses the same complete dimensional support and the
          primary weighting for that domain. Calculate each case percentage first, then macro-average the cases.
        </dd>
      </div>
      <div>
        <dt>Release-native evaluation</dt>
        <dd>
          AirfRANS models are commonly trained on normalized fields. FluidsBench relative L1/L2 metrics should be
          computed after undoing those normalizations, not on the normalized fields reported by the original MSE tables. The released
          <code>p</code> values are kinematic pressure in m²/s², not pascals.
        </dd>
      </div>
      <div>
        <dt>Airfoil-curve pressure relative L1/L2</dt>
        <dd>
          Relative L1 and L2 error for release-native kinematic pressure <code>p</code> at every ordered node of the one-dimensional airfoil curve.
          Length-weighted relative L2 is primary; unweighted node relative L2 (each node counts equally) is secondary.
        </dd>
      </div>
      <div>
        <dt>Airfoil-curve wall-shear relative L1/L2</dt>
        <dd>
          Relative L1 and L2 error for the two-dimensional wall-shear vector derived at every ordered airfoil-curve node
          by the fixed AirfRANS procedure.
        </dd>
      </div>
      <div>
        <dt>Two-dimensional flow velocity and pressure relative L1/L2</dt>
        <dd>
          Each case uses the two components of <code>U</code> and kinematic pressure <code>p</code> at every node in the released internal VTU.
          Unweighted node relative L2 (each node counts equally) is primary and area-weighted relative L2 is secondary; cases are not
          flattened together before taking the norm.
        </dd>
      </div>
      <div>
        <dt>C<sub>d</sub> and C<sub>l</sub> R<sup>2</sup></dt>
        <dd>
          R<sup>2</sup> over all evaluated cases using drag and lift coefficients computed from the predicted fields. The
          original AirfRANS paper reports force relative errors and Spearman correlations; FluidsBench should compute
          R<sup>2</sup> directly when evaluator outputs are available.
        </dd>
      </div>
      <div>
        <dt>Velocity profile R<sup>2</sup></dt>
        <dd>
          One R<sup>2</sup> over the required <code>U_x/U_inf</code> and <code>U_y/U_inf</code> samples, flattened across the four stations, all
          evaluated cases, 1,001 sample points, and both Cartesian components.
        </dd>
      </div>
      <div>
        <dt>Explicit exclusions</dt>
        <dd>
          Turbulent viscosity <code>nut</code> and airfoil pressure-profile <code>cp_cut_r2</code> are not in the current FluidsBench metric list.
          Their presence in the source dataset must not be interpreted as an active leaderboard target.
        </dd>
      </div>
    </dl>
  </section>

  <section class="dataset-panel">
    <h3>Prototype values</h3>
    <p>
      The current leaderboard rows use the full-data-regime AirfRANS baseline tables from arXiv v3. The paper reports
      normalized-field MSE, force relative errors, Spearman correlations, and parameter counts. Because those are not the
      final FluidsBench dimensional relative L1/L2 and R<sup>2</sup> evaluator outputs, the displayed field and force
      scores are prototype conversions and should be replaced by official evaluator exports.
    </p>
  </section>

  <section class="dataset-panel">
    <h3>References</h3>
    <ul>
      <li><a href="https://arxiv.org/abs/2212.07564">AirfRANS paper</a></li>
      <li><a href="https://github.com/Extrality/AirfRANS">AirfRANS benchmark repository</a></li>
      <li><a href="https://github.com/Extrality/airfrans_lib">airfrans_lib</a></li>
      <li><a href="https://airfrans.readthedocs.io/en/latest/modules/dataset.html">AirfRANS documentation</a></li>
    </ul>
  </section>
</div>
