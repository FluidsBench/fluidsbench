---
layout: page
permalink: /datasets/hiliftaeroml/
title: HiLiftAeroML dataset
page_title: HiLiftAeroML dataset
page_description: Dataset overview and leaderboard submission format for HiLiftAeroML.
description:
nav: false
hide_header_background: true
compact_masthead: true
---

<div class="dataset-page">
  {% include dataset_intro.html slug="hiliftaeroml" %}

  <section class="dataset-panel">
    <h3>Current benchmark status</h3>
    <p>
      HiLiftAeroML is a <strong>closed schema-v3 candidate</strong>. All fourteen official evaluation labels are bound to eight exact ordered
      case sets, covering 1,355 unique cases. The evaluator is frozen at
      <a href="https://github.com/neilashton/fluidsbench-submission/tree/68899f780d96b70f2badb5658971c87af0b17172">revision 68899f7</a>
      for local candidate dry runs. Public submissions remain closed pending the final source-content pins, scoring-support publication and
      benchmark-owner approval.
    </p>
    <p>
      The development leaderboard contains 23 retained real-model previews: eleven Transolver and twelve GeoTransolver results. These are
      pre-release references, not official or citable benchmark results. Public Cp and velocity plot truth covers all 1,355 cases; that plotting
      derivative omits scoring weights and cannot replace the evaluator's separate scoring-truth release.
    </p>
  </section>

  <section class="dataset-panel">
    <h3>Dataset summary</h3>
    <dl class="dataset-facts">
      <div>
        <dt>Geometry</dt>
        <dd>NASA CRM-HL high-lift aircraft with parameterized slat and flap deflections and gaps.</dd>
      </div>
      <div>
        <dt>Cases</dt>
        <dd>1,800 simulations: 180 geometry variants across 10 angles of attack from 4 degrees to 22 degrees.</dd>
      </div>
      <div>
        <dt>Solver</dt>
        <dd>Fidelity Charles explicit unstructured finite-volume solver with Fidelity Stitch Voronoi meshing.</dd>
      </div>
      <div>
        <dt>Fidelity</dt>
        <dd>Wall-Modeled Large-Eddy Simulation (WMLES) with solution-adapted grids.</dd>
      </div>
      <div>
        <dt>Flow conditions</dt>
        <dd>Mach 0.2 and chord-based Reynolds number 1.6 x 10<sup>6</sup>.</dd>
      </div>
      <div>
        <dt>Mesh scale</dt>
        <dd>Solution-adapted grids between roughly 300M and 500M control volumes; exported volume meshes are octree-based.</dd>
      </div>
      <div>
        <dt>License</dt>
        <dd>CC BY 4.0, as stated by the dataset source.</dd>
      </div>
    </dl>
  </section>

  <section id="dataset-start" class="dataset-panel dataset-getting-started">
    {% include dataset_getting_started.html slug="hiliftaeroml" %}
  </section>

{% include dataset_design_space.html slug="hiliftaeroml" %}

  <section class="dataset-panel">
    <h3>Source correction: mean force and moment coefficients</h3>
    <p>
      The 2 September 2026 source release corrects the mean <code>cd</code>, <code>cl</code>, <code>cm</code>, <code>clp</code>,
      <code>clv</code>, <code>cdp</code>, and <code>cdv</code> values for six cases. The replacements are canonically integrated from the
      released time-averaged surface pressure and wall-shear fields; the meshes, fields, geometry, split manifests, and the other 1,794 cases are
      unchanged.
    </p>
    <p>
      The affected cases are <code>geo_LHC012_AoA_16</code>, <code>geo_LHC018_AoA_16</code>, <code>geo_LHC028_AoA_18</code>,
      <code>geo_LHC028_AoA_22</code>, <code>geo_LHC129_AoA_4</code>, and <code>geo_LHC172_AoA_22</code>. Their retained
      <code>*_stdev</code>, <code>*_stderr</code>, and <code>*_ci95</code> columns are original solver-monitor diagnostics, not uncertainty
      estimates for the replaced means. See the
      <a href="https://huggingface.co/datasets/nvidia/HiLiftAeroML/blob/bbec30bcfc6103309c1375c5228b3ad0a586bfaf/force_mom_surface_overrides_v1.json">source correction manifest</a>
      for the exact old and new values, method, and hashes.
    </p>
    <p>
      These tables document source provenance. The candidate evaluator obtains both prediction and truth loads by integrating the corresponding
      complete native surface fields with the same convention. It does not substitute the corrected CSV values for the scored truth loads.
    </p>
  </section>

  <section class="dataset-panel">
    <h3>Published source splits</h3>
    <p>
      The Hugging Face source publishes these fourteen deterministic split families over all 1,800 cases. The table gives the exact manifest IDs and
      counts. The corresponding FluidsBench evaluation files contain official case IDs. Each package declares one label and preserves the exact
      order in its FluidsBench split file; that order differs from the source manifest's display order.
    </p>
    <p>
      Full, Medium, Scarce and Super scarce share one 360-case test set. The four Geometry labels share another 360-case test set. Their different
      training regimes remain distinct tasks. Use the matching source training and validation definitions, and reserve all test fields for evaluation.
    </p>

    <div class="dataset-table-wrap">
      <table class="dataset-table compact">
        <thead>
          <tr>
            <th>Split</th>
            <th>Manifest ID</th>
            <th>Type</th>
            <th>Purpose</th>
            <th>Train</th>
            <th>Validation</th>
            <th>Test</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>Full</code></td>
            <td><code>full</code></td>
            <td>In-dist</td>
            <td>Random case-level baseline split.</td>
            <td>1260</td>
            <td>180</td>
            <td>360</td>
          </tr>
          <tr>
            <td><code>Medium</code></td>
            <td><code>medium</code></td>
            <td>In-dist</td>
            <td>Intermediate data-efficiency split between Full and Scarce.</td>
            <td>510</td>
            <td>180</td>
            <td>360</td>
          </tr>
          <tr>
            <td><code>Scarce</code></td>
            <td><code>scarce</code></td>
            <td>In-dist</td>
            <td>Data-efficiency split using one sixth of the Full training data.</td>
            <td>210</td>
            <td>180</td>
            <td>360</td>
          </tr>
          <tr>
            <td><code>Super scarce</code></td>
            <td><code>super_scarce</code></td>
            <td>In-dist</td>
            <td>Extreme data-efficiency split using one thirty-sixth of the Full training data.</td>
            <td>35</td>
            <td>180</td>
            <td>360</td>
          </tr>
          <tr>
            <td><code>Geometry</code></td>
            <td><code>geometry</code></td>
            <td>In-dist</td>
            <td>Generalization to unseen geometries, with all 10 AoAs per selected geometry.</td>
            <td>1260</td>
            <td>180</td>
            <td>360</td>
          </tr>
          <tr>
            <td><code>Geometry medium</code></td>
            <td><code>geometry_medium</code></td>
            <td>In-dist</td>
            <td>Unseen-geometry generalization from 51 training geometries.</td>
            <td>510</td>
            <td>180</td>
            <td>360</td>
          </tr>
          <tr>
            <td><code>Geometry scarce</code></td>
            <td><code>geometry_scarce</code></td>
            <td>In-dist</td>
            <td>Unseen-geometry generalization from 21 training geometries.</td>
            <td>210</td>
            <td>180</td>
            <td>360</td>
          </tr>
          <tr>
            <td><code>Geometry super scarce</code></td>
            <td><code>geometry_super_scarce</code></td>
            <td>In-dist</td>
            <td>Unseen-geometry generalization from 4 training geometries.</td>
            <td>40</td>
            <td>180</td>
            <td>360</td>
          </tr>
          <tr>
            <td><code>AoA 4</code></td>
            <td><code>single_aoa_4</code></td>
            <td>In-dist</td>
            <td>Single-AoA geometry generalization at 4 degrees, representative of pre-stall flow.</td>
            <td>126</td>
            <td>18</td>
            <td>36</td>
          </tr>
          <tr>
            <td><code>AoA 12</code></td>
            <td><code>single_aoa_12</code></td>
            <td>In-dist</td>
            <td>Single-AoA geometry generalization at 12 degrees, representative of mid-range flow.</td>
            <td>126</td>
            <td>18</td>
            <td>36</td>
          </tr>
          <tr>
            <td><code>AoA 22</code></td>
            <td><code>single_aoa_22</code></td>
            <td>In-dist</td>
            <td>Single-AoA geometry generalization at 22 degrees, representative of post-stall flow.</td>
            <td>126</td>
            <td>18</td>
            <td>36</td>
          </tr>
          <tr>
            <td><code>AoA extrapolation</code></td>
            <td><code>aoa</code></td>
            <td>OOD</td>
            <td>Train and validate on AoA &lt;= 12 degrees, then test on AoA &gt;= 14 degrees.</td>
            <td>788</td>
            <td>112</td>
            <td>900</td>
          </tr>
          <tr>
            <td><code>Deflection</code></td>
            <td><code>deflection</code></td>
            <td>OOD</td>
            <td>Geometry extrapolation from low mean deflection to high deflection settings.</td>
            <td>1260</td>
            <td>180</td>
            <td>360</td>
          </tr>
          <tr>
            <td><code>Stall</code></td>
            <td><code>stall</code></td>
            <td>OOD</td>
            <td>Flow-regime extrapolation from pre-stall training cases to post-stall test cases.</td>
            <td>942</td>
            <td>135</td>
            <td>723</td>
          </tr>
        </tbody>
      </table>
    </div>

  </section>

  <section class="dataset-panel">
    {% include dataset_hiliftaeroml_submission.html %}

  </section>

  <section id="dataset-evaluation" class="dataset-panel">
    {% include dataset_scoring_contract.html slug="hiliftaeroml" dataset="HiLiftAeroML" %}
  </section>

  <section class="dataset-panel">
    <h3>Cp stations</h3>
    <p>
      The evaluator derives all ten CRM-HL wing pressure rows A through J from the complete native surface prediction.
      Figure 15 of the <a href="https://arxiv.org/abs/2605.19565">HiLiftAeroML paper</a> plots A, D, G, and I as a
      validation subset; those four examples are not the complete workshop station set. Rows run progressively from
      inboard to outboard. The frozen support supplies the exact geometry, graph identities and coordinates in inches; retain them in the required
      profile format rather than constructing or sorting a new pressure trace.
    </p>
    <div class="dataset-table-wrap">
      <table class="dataset-table compact">
        <thead>
          <tr><th>Station ID</th><th>Row</th><th>Wing dog-leg x (in)</th><th>Case 2 elements</th></tr>
        </thead>
        <tbody>
          <tr><td><code>pressure_belt_a</code></td><td>A</td><td>1126.61</td><td>Slat, main wing, flap</td></tr>
          <tr><td><code>pressure_belt_b</code></td><td>B</td><td>1199.86</td><td>Slat, main wing, flap</td></tr>
          <tr><td><code>pressure_belt_c</code></td><td>C</td><td>1266.16</td><td>Main wing, flap; no Case 2 slat cut</td></tr>
          <tr><td><code>pressure_belt_d</code></td><td>D</td><td>1332.41</td><td>Slat, main wing, flap</td></tr>
          <tr><td><code>pressure_belt_e</code></td><td>E</td><td>1402.17</td><td>Slat, main wing, flap</td></tr>
          <tr><td><code>pressure_belt_f</code></td><td>F</td><td>1478.90</td><td>Slat, main wing, flap</td></tr>
          <tr><td><code>pressure_belt_g</code></td><td>G</td><td>1555.64</td><td>Slat, main wing, flap</td></tr>
          <tr><td><code>pressure_belt_h</code></td><td>H</td><td>1621.91</td><td>Slat and main wing; no flap row</td></tr>
          <tr><td><code>pressure_belt_i</code></td><td>I</td><td>1709.11</td><td>Slat and main wing; no flap row</td></tr>
          <tr><td><code>pressure_belt_j</code></td><td>J</td><td>1778.87</td><td>Slat and main wing; no flap row</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      The <a href="https://aiaa-hlpw.org/HLPW/index-workshop5.html">HLPW-5 workshop archive</a> provides the source cutting-plane definitions.
      For FluidsBench, use the evaluator-owned extraction support and retain every disconnected physical graph and its segment lengths. Do not
      join separate branches or bridge gaps. Development curves pair checksum-bound retained model predictions with public plot-only CFD truth.
    </p>
  </section>

  <section class="dataset-panel">
    <h3>Velocity stations</h3>
    <p>
      The candidate uses exactly five HLPW-5 locations: <strong>B.2, B.3, C.1, C.2 and C.3</strong>. Each station has 801 requested rows on
      evaluator-owned support, with an authoritative validity mask and explicit gaps. Profiles compare velocity magnitude
      <code>|U| / |U_inf|</code>. The display uses full-scale coordinates in inches and <code>z_offset_in = z - z_surface</code>.
      The source station geometry is documented in the
      <a href="https://aiaa-hlpw.org/HLPW/index-workshop5.html">HLPW-5 workshop archive</a>.
    </p>
    <div class="dataset-table-wrap">
      <table class="dataset-table compact">
        <thead>
          <tr><th>Station ID</th><th>HLPW-5 label</th><th>x (in)</th><th>y (in)</th><th>z surface (in)</th></tr>
        </thead>
        <tbody>
          <tr><td><code>hlpw5_b_2</code></td><td>B.2</td><td>1203.7442</td><td>374.8077</td><td>208.4231</td></tr>
          <tr><td><code>hlpw5_b_3</code></td><td>B.3</td><td>1398.1731</td><td>360.8769</td><td>205.5577</td></tr>
          <tr><td><code>hlpw5_c_1</code></td><td>C.1</td><td>1699.5212</td><td>964.3962</td><td>258.4827</td></tr>
          <tr><td><code>hlpw5_c_2</code></td><td>C.2</td><td>1730.9519</td><td>956.0558</td><td>258.5019</td></tr>
          <tr><td><code>hlpw5_c_3</code></td><td>C.3</td><td>1762.3500</td><td>949.1462</td><td>255.5058</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      Preserve the evaluator's valid rows and segment boundaries. Invalid rows carry zero scoring weight; do not fill them or create integration
      edges across gaps. Evaluator support retains invalid rows explicitly, while the sole participant format, compact-v2, stores only the evaluator-selected valid predictions.
    </p>
  </section>

  <section class="dataset-panel">
    <h3>Metric definitions</h3>
    <dl class="metric-definition-list">
      <div>
        <dt>Relative L2 error</dt>
        <dd>
          For each evaluation case, use the nondimensional field bases below and calculate
          \(100\sqrt{\sum_i w_i\lVert\hat q_i-q_i\rVert^2 / \sum_i w_i\lVert q_i\rVert^2}\).
          Surface primary metrics use the published nodal dual areas, with equal-node values as secondary diagnostics. Volume metrics use one unit
          per retained valid native point; no volume-weighted secondary metric is required. Sum the numerator and denominator across all chunks before
          taking the square root, then macro-average the complete-case percentages equally.
        </dd>
      </div>
      <div>
        <dt>Relative L1 error</dt>
        <dd>
          Supplementary relative L1 uses the same nondimensional fields and primary spatial weights. For vectors, accumulate absolute errors and
          absolute truth over all three components. Calculate the complete-case percentage before the equal-case macro average.
        </dd>
      </div>
      <div>
        <dt>Field bases and dimensional diagnostics</dt>
        <dd>
          Relative L1/L2 use <code>(P-p_inf)/q_inf</code>, <code>tau_wall/q_inf</code> and <code>U/|U_inf|</code>, using each case's freestream
          references. Undo model-specific standardization to reach these bases. Separate MAE/RMSE diagnostics are inverse-scaled per case to Pa for
          pressure and wall shear, and m/s for velocity, before equal-case aggregation. Vector relative L2 uses the full three-component magnitude;
          vector MAE/RMSE use the evaluator's per-component convention.
        </dd>
      </div>
      <div>
        <dt>Surface pressure relative L1/L2</dt>
        <dd>
          Relative L1/L2 for <code>Cp = (P-p_inf)/q_inf</code> at every native boundary point. This is a full-surface field metric; the separate
          Cp-cut metric uses evaluator-derived one-dimensional traces.
        </dd>
      </div>
      <div>
        <dt>Surface wall-shear relative L1/L2</dt>
        <dd>
          Relative L1/L2 for all three components of <code>tau_wall/q_inf</code> at every native boundary point, with the published nodal dual areas.
        </dd>
      </div>
      <div>
        <dt>Volume velocity relative L1/L2</dt>
        <dd>
          Relative L1/L2 for the three-component vector <code>U/|U_inf|</code> on every retained native volume point. The evaluator retains a point
          when raw Float32 <code>avg(P) != 0.0</code>, before normalization; predictions cannot change this mask.
        </dd>
      </div>
      <div>
        <dt>Volume pressure relative L1/L2</dt>
        <dd>Relative L1/L2 for <code>(P-p_inf)/q_inf</code> on the same retained valid volume points, each with one equal weight.</dd>
      </div>
      <div>
        <dt>Coefficient of determination</dt>
        <dd>
          \(R^2 = 1 - \mathrm{SSE}/\mathrm{SST}\), using the weights, truth-centering groups and case aggregation specified for each metric below.
          Higher is better; 1.0 is perfect. Profile metrics do not use one mean across all cases and samples.
        </dd>
      </div>
      <div>
        <dt>C<sub>d</sub> and C<sub>l</sub> R<sup>2</sup></dt>
        <dd>
          Separate equal-case R<sup>2</sup> values over the selected split. The evaluator integrates pressure and viscous loads from the complete
          native surface prediction and uses the same integration for truth. It applies each case's <code>qRef</code>, <code>areaRef</code> and angle
          convention, including the <code>q_inf/qRef</code> conversion exactly once; a separately predicted force head cannot replace this integration.
        </dd>
      </div>
      <div>
        <dt>Load diagnostics</dt>
        <dd>
          Drag, lift and pitching-moment MAE are required diagnostics. Pitching moment uses exact degree-two surface integration about
          <code>forcesCoR</code> with <code>qRef * areaRef * chordRef</code> normalization. It has no additional composite weight.
        </dd>
      </div>
      <div>
        <dt>Cp cut R<sup>2</sup></dt>
        <dd>
          Within each case, center truth independently in every connected physical cut graph. Use physical arc-length weights and pool graph SSE
          and SST across rows A–J to calculate one case R<sup>2</sup>. Macro-average those complete-case R<sup>2</sup> values equally across the split.
          The leaderboard station selector chooses a displayed row; it does not restrict scoring to that row.
        </dd>
      </div>
      <div>
        <dt>Velocity profile R<sup>2</sup></dt>
        <dd>
          Compare <code>|U| / |U_inf|</code> at B.2, B.3, C.1, C.2 and C.3. Center truth within each station, use physical polyline arc-length
          weights and pool station SSE and SST within the case. Macro-average the complete-case R<sup>2</sup> values equally. Invalid rows and gaps
          follow the frozen support and receive no invented values or connecting edges.
        </dd>
      </div>
    </dl>
  </section>

  <section class="dataset-panel">
    <h3>Candidate overall score</h3>
    <p>
      The closed candidate computes a bounded 0–100 score with 50% field, 25% force and 25% profile weight. These preview values are not official
      leaderboard claims. Each field error <code>E_q</code> below is a relative-L2 percentage on the stated nondimensional basis.
    </p>
    <p>
      Relative L1, dimensional MAE/RMSE and pitching-moment MAE are supplementary diagnostics. Complete regional reports may also be included at zero
      weight; none of these adds a component to the score below.
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
            <td>Surface Cp, area-weighted relative L2</td>
            <td>15%</td>
            <td>15% cap</td>
          </tr>
          <tr>
            <td>Surface tau_wall/q_inf, area-weighted relative L2</td>
            <td>10%</td>
            <td>20% cap</td>
          </tr>
          <tr>
            <td>Volume U/|U_inf|, equal-valid-point relative L2</td>
            <td>15%</td>
            <td>12% cap</td>
          </tr>
          <tr>
            <td>Volume (P-p_inf)/q_inf, equal-valid-point relative L2</td>
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
            <td>10%</td>
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
      <li><a href="https://caemldatasets.org/hiliftaeroml/">HiLiftAeroML dataset page</a></li>
      <li><a href="https://arxiv.org/abs/2605.19565">HiLiftAeroML paper</a></li>
      <li><a href="https://huggingface.co/datasets/nvidia/HiLiftAeroML">HiLiftAeroML Hugging Face dataset</a></li>
      <li><a href="https://huggingface.co/datasets/nvidia/HiLiftAeroML/blob/bbec30bcfc6103309c1375c5228b3ad0a586bfaf/splits/README.md">HiLiftAeroML split README</a></li>
      <li><a href="https://aiaa-hlpw.org/HLPW/index-workshop5.html">HLPW-5 workshop archive and submission templates</a></li>
      <li><a href="https://ntrs.nasa.gov/citations/20240014255">NASA HLPW-5 workshop summary</a></li>
      <li><a href="{{ '/' | relative_url }}?dataset=hiliftaeroml">CFD leaderboard prototype</a></li>
    </ul>
  </section>
</div>
