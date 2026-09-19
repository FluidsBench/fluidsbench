---
layout: page
permalink: /datasets/drivaerml/
title: DrivAerML dataset
page_title: DrivAerML dataset
page_description: Dataset overview and leaderboard submission format for DrivAerML.
description:
nav: false
hide_header_background: true
compact_masthead: true
---

<div class="dataset-page">
  {% include dataset_intro.html slug="drivaerml" %}

  <section class="dataset-panel">
    <h3>Dataset summary</h3>
    <dl class="dataset-facts">
      <div>
        <dt>Geometry</dt>
        <dd>Parametrically morphed DrivAer notchback road-car variants.</dd>
      </div>
      <div>
        <dt>Cases</dt>
        <dd>500 designed simulations; 484 complete cases are currently public and bound by the candidate contract.</dd>
      </div>
      <div>
        <dt>Solver</dt>
        <dd>OpenFOAM v2212 finite-volume simulations with custom workflow modifications.</dd>
      </div>
      <div>
        <dt>Fidelity</dt>
        <dd>Scale-resolving hybrid RANS-LES representative of industrial automotive aerodynamic workflows.</dd>
      </div>
      <div>
        <dt>Mesh scale</dt>
        <dd>Approximately 140 million volume grid cells and 8.8 million surface points per case.</dd>
      </div>
      <div>
        <dt>License</dt>
        <dd>CC BY-SA 4.0, as stated by the dataset source.</dd>
      </div>
    </dl>
  </section>

  <section id="dataset-start" class="dataset-panel dataset-getting-started">
    {% include dataset_getting_started.html slug="drivaerml" %}
  </section>

{% include dataset_design_space.html slug="drivaerml" %}

  <section class="dataset-panel">
    <h3>Official source and candidate benchmark splits</h3>
    <p>
      These eight case lists are published by the source and marked <code>official</code> in the candidate FluidsBench contract. They exclude all 16
      unavailable or held-back run IDs. Submissions remain closed until the evaluator and complete scoring-support release pass the remaining
      activation gates.
    </p>

    <div class="dataset-table-wrap">
      <table class="dataset-table compact">
        <thead>
          <tr>
            <th>Split</th>
            <th>Purpose</th>
            <th>Train</th>
            <th>Validation</th>
            <th>Test</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>full</code></td>
            <td>Seed-42 random public baseline split.</td>
            <td>400</td>
            <td>34</td>
            <td>50</td>
          </tr>
          <tr>
            <td><code>medium</code></td>
            <td>Nested data-efficiency subset with fixed validation and test cases.</td>
            <td>133</td>
            <td>34</td>
            <td>50</td>
          </tr>
          <tr>
            <td><code>scarce</code></td>
            <td>Smaller nested data-efficiency subset with fixed validation and test cases.</td>
            <td>67</td>
            <td>34</td>
            <td>50</td>
          </tr>
          <tr>
            <td><code>super_scarce</code></td>
            <td>Minimum-data nested training subset with fixed validation and test cases.</td>
            <td>11</td>
            <td>34</td>
            <td>50</td>
          </tr>
          <tr>
            <td><code>geometry</code></td>
            <td>STL-surface Chamfer geometry out-of-distribution split.</td>
            <td>339</td>
            <td>48</td>
            <td>97</td>
          </tr>
          <tr>
            <td><code>high_drag</code></td>
            <td>High-drag force-regime out-of-distribution split.</td>
            <td>339</td>
            <td>48</td>
            <td>97</td>
          </tr>
          <tr>
            <td><code>low_drag</code></td>
            <td>Low-drag force-regime out-of-distribution split.</td>
            <td>339</td>
            <td>48</td>
            <td>97</td>
          </tr>
          <tr>
            <td><code>rear_separation</code></td>
            <td>Image-derived low-speed wake and rear-separation out-of-distribution split.</td>
            <td>339</td>
            <td>48</td>
            <td>97</td>
          </tr>
        </tbody>
      </table>
    </div>

  </section>

  <section class="dataset-panel">
    {% include dataset_submission.html slug="drivaerml" dataset="DrivAerML" %}

  </section>

  <section id="dataset-evaluation" class="dataset-panel">
    {% include dataset_scoring_contract.html slug="drivaerml" dataset="DrivAerML" %}
  </section>

  <section class="dataset-panel">
    <h3>Candidate continuous Cp cuts</h3>
    <p>
      These four FluidsBench cuts follow the validation regions used by DrivAerML but are defined as continuous intersections of each participant's
      complete native surface prediction. They are distinct from the 209 discrete AutoCFD5 pressure taps, which are explicitly excluded from the
      DrivAerML submission and score. Publishing the all-case native reference curves does not activate profile scoring; scoring remains behind a
      separate reviewed activation change.
    </p>
    <p>
      Leaderboard Cp plots default to the producer-bound segment-midpoint streamwise x coordinate in metres so native CFD and submitted predictions can be compared
      directly with AutoCFD and published figures. Cumulative surface arc length remains the unchanged scoring and reproducibility coordinate and is
      available from the horizontal-axis selector. The display never sorts, interpolates, resamples, or joins across a retained cut-segment break.
    </p>
    <div class="dataset-table-wrap">
      <table class="dataset-table compact">
        <thead><tr><th>Station ID</th><th>Published trace</th></tr></thead>
        <tbody>
          <tr><td><code>upperbody_centerline</code></td><td>Upper-body centreline, y = 0 m (Figure 17a).</td></tr>
          <tr><td><code>underbody_centerline</code></td><td>Underbody centreline, y = 0 m (Figure 17b).</td></tr>
          <tr><td><code>sidewall_z_0_15</code></td><td>Sidewall, z = 0.15 m (Figure 22a).</td></tr>
          <tr><td><code>front_left_wheelhouse_y_neg_0_6</code></td><td>Front-left wheelhouse, y = -0.6 m (Figure 22b).</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="dataset-panel">
    <h3>Candidate AutoCFD5 velocity profiles</h3>
    <p>
      The velocity diagnostic uses all 16 AutoCFD5 lines: <code>V1</code>–<code>V6</code>, <code>U1</code>–<code>U6</code>, <code>L1</code>, and
      <code>R1</code>–<code>R3</code>. The fixed-locations view uses physical distance in metres on the current primary/candidate 10 mm support; the
      geometry-relative view uses normalized arc length on its distinct retained support and is labelled diagnostic, not scored. Both display native
      <code>|UMeanTrim| / 38.889</code> values. Unsupported rows remain explicit gaps, and the dashboard never substitutes or overlays one placement
      family's support for the other. The candidate fixed-family reduction is an equal-case, equal-line global R² with normalized trapezoidal
      arclength support per line; normalized RMSE and the experimental subset are report-only diagnostics. Displaying either all-case native view does
      not activate relative scoring or open submissions.
    </p>
  </section>

  <section class="dataset-panel">
    <h3>Metric definitions</h3>
    <dl class="metric-definition-list">
      <div>
        <dt>Relative L2 error</dt>
        <dd>
          For each evaluation/test geometry, map predictions to every entity in the release-bound public field support and return predictions and
          targets to their release-native representation, \(q^\ast = T_q^{-1}(q)\). Calculate both paired relative-L2 values from the accumulated
          sufficient statistics: area-weighted L2 is primary on the boundary, while unweighted cell L2 (each cell counts equally) is primary in the flow volume.
          Report the complete-case percentages first, then take the arithmetic mean of the geometry-level values.
        </dd>
      </div>
      <div>
        <dt>MAE and RMSE diagnostics</dt>
        <dd>
          The current candidate reports area-weighted and equal-polygon MAE/RMSE for both surface arrays, and equal-cell MAE/RMSE for both volume
          arrays. Relative L1 is not part of the active DrivAerML metric list.
        </dd>
      </div>
      <div>
        <dt>Release-native evaluation</dt>
        <dd>
          Field metrics are not computed on normalized or standardized training targets. If
          a model predicts normalized values, the submission/evaluator must undo that transform before scoring.
          <code>pMeanTrim</code> and <code>wallShearStressMeanTrim</code> are stored in m²/s², while <code>UMeanTrim</code> is in m/s.
          Force and Cp-cut comparisons remain coefficient-based by definition.
        </dd>
      </div>
      <div>
        <dt>Surface pressure relative L2</dt>
        <dd>
          Area-weighted primary and equal-polygon secondary relative L2 for <code>pMeanTrim</code> on every native boundary VTP cell. Cp is derived
          only for the continuous-cut comparison.
        </dd>
      </div>
      <div>
        <dt>Surface wall-shear relative L2</dt>
        <dd>
          Area-weighted primary and equal-polygon secondary relative L2 for the three-component
          <code>wallShearStressMeanTrim</code> array on every native boundary VTP cell.
        </dd>
      </div>
      <div>
        <dt>Volume velocity relative L2</dt>
        <dd>
          Equal-native-cell relative L2 for the three-component <code>UMeanTrim</code> array on every cell in the release-bound reconstructed VTU.
        </dd>
      </div>
      <div>
        <dt>Volume pressure relative L2</dt>
        <dd>Equal-native-cell relative L2 for <code>pMeanTrim</code> on every cell in that same reconstructed VTU.</dd>
      </div>
      <div>
        <dt>AB-UPT convention</dt>
        <dd>
          The secondary unweighted polygon relative L2 (each polygon counts equally) is the AB-UPT-compatible value: targets may be normalized for training,
          but evaluation uses unnormalized predictions and targets. FluidsBench additionally uses the area-weighted
          boundary value as its primary surface metric.
        </dd>
      </div>
      <div>
        <dt>Coefficient of determination</dt>
        <dd>
          For scalar values \(y_i\), \(R^2 = 1 - \sum_i(\hat{y}_i - y_i)^2 / \sum_i(y_i - \bar{y})^2\). Higher is
          better; 1.0 is perfect.
        </dd>
      </div>
      <div>
        <dt>C<sub>d</sub>, C<sub>l</sub>, and C<sub>m,pitch</sub> R<sup>2</sup></dt>
        <dd>
          Separate equal-case R² values computed from forces and moments integrated from the submitted complete surface fields. The authoritative truth
          is <code>force_mom_constref_all.csv</code>; pitching moment is reconstructed casewise as <code>(clf - clr) / 2</code>. Cd, Cl, and pitch
          weights are 15%, 5%, and 5% of the overall score respectively.
        </dd>
      </div>
      <div>
        <dt>Force score</dt>
        <dd>Normalized weighted mean of the bounded C<sub>d</sub>, C<sub>l</sub>, and C<sub>m,pitch</sub> component scores.</dd>
      </div>
      <div>
        <dt>Cp cut R<sup>2</sup></dt>
        <dd>
          Equal-case, equal-cut global R² over the four continuous native-surface intersections, with normalized native intersection-segment length
          within each cut. The report-only companion is <code>cp_cut_rmse</code>.
        </dd>
      </div>
      <div>
        <dt>Cp cut comparisons</dt>
        <dd>
          Per-case and per-cut R<sup>2</sup> values can be reported as profile comparisons, but the leaderboard ranking should use
          the global held-out score so that cases with low Cp variance do not dominate through unstable per-case
          averages.
        </dd>
      </div>
      <div>
        <dt>Velocity profile R<sup>2</sup></dt>
        <dd>
          Equal-case, equal-line global R² for <code>|UMeanTrim| / 38.889</code> over all 16 fixed AutoCFD5 lines, using normalized trapezoidal
          arclength support within each line.
        </dd>
      </div>
    </dl>
  </section>

  <section class="dataset-panel">
    <h3>Default overall score</h3>
    <p>
      The leaderboard can be ranked by any individual metric. Its default ranking is a bounded 0-100 weighted score:
    </p>
    <p>
      The four field components contribute 50%, the three field-integrated force components 25%, and the two profile components 25%. Diagnostic
      MAE/RMSE values remain visible but do not enter the composite.
    </p>
    <pre><code>S_error(q) = 100 * max(0, 1 - E_q / cap_q)
S_R2(q)    = 100 * min(1, max(0, R2_q))
S_overall  = sum(weight_q * S_q)</code></pre>
    <div class="dataset-table-wrap">
      <table class="dataset-table compact">
        <thead>
          <tr>
            <th>Component</th>
            <th>Weight</th>
            <th>Cap or transform</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Surface <code>pMeanTrim</code>, area-weighted relative L2</td>
            <td>15%</td>
            <td>15% cap</td>
          </tr>
          <tr>
            <td>Surface <code>wallShearStressMeanTrim</code>, area-weighted relative L2</td>
            <td>10%</td>
            <td>20% cap</td>
          </tr>
          <tr>
            <td>Volume <code>UMeanTrim</code>, equal-cell relative L2</td>
            <td>15%</td>
            <td>12% cap</td>
          </tr>
          <tr>
            <td>Volume <code>pMeanTrim</code>, equal-cell relative L2</td>
            <td>10%</td>
            <td>15% cap</td>
          </tr>
          <tr>
            <td>C<sub>d</sub> R<sup>2</sup></td>
            <td>15%</td>
            <td>Clamped to [0, 1]</td>
          </tr>
          <tr>
            <td>C<sub>l</sub> R<sup>2</sup></td>
            <td>5%</td>
            <td>Clamped to [0, 1]</td>
          </tr>
          <tr>
            <td>C<sub>m,pitch</sub> R<sup>2</sup></td>
            <td>5%</td>
            <td>Clamped to [0, 1]</td>
          </tr>
          <tr>
            <td>Velocity profile R<sup>2</sup></td>
            <td>15%</td>
            <td>Clamped to [0, 1]</td>
          </tr>
          <tr>
            <td>Cp cut R<sup>2</sup></td>
            <td>10%</td>
            <td>Clamped to [0, 1]</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="dataset-panel">
    <h3>Links</h3>
    <ul>
      <li><a href="https://caemldatasets.org/drivaerml/">DrivAerML dataset page</a></li>
      <li><a href="https://arxiv.org/abs/2408.11969">DrivAerML paper</a></li>
      <li><a href="{{ '/' | relative_url }}?dataset=drivaerml">Automotive CFD leaderboard prototype</a></li>
    </ul>
  </section>
</div>
