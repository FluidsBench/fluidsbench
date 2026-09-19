---
layout: support
title: Run benchmark
permalink: /run/
page_title: Run benchmark
page_description: From your model's predictions to a result you can inspect and compare.
description: Get started with the FluidsBench reference tools, evaluation workflow and result package.
hide_header_background: true
---

{% assign source_ref = site.submission_source_ref | default: 'main' %}
{% assign source_root = 'https://github.com/neilashton/fluidsbench-submission/tree/' | append: source_ref %}

<aside class="ux-page-notice" aria-label="Submission status">
  <strong>Submissions are closed</strong>
  <p>You can explore the tools now. Public submissions open only when a dataset's scoring release is marked official and open on the leaderboard.</p>
</aside>

<section class="ux-quickstart" aria-labelledby="quickstart-title">
  <div>
    <p class="ux-page-eyebrow">Start here</p>
    <h2 id="quickstart-title">Try the reference example</h2>
    <p>A small synthetic example checks your setup and demonstrates metric calculation. It runs locally without downloading a CFD dataset or training a model.</p>
    <a href="{{ source_root }}/reference">Reference documentation <span aria-hidden="true">↗</span></a>
  </div>
  <div class="ux-code-panel">
    <div class="ux-code-label">Terminal <span>Python 3 · macOS / Linux</span></div>
    <pre><code>git clone https://github.com/neilashton/fluidsbench-submission.git
cd fluidsbench-submission
git checkout {{ source_ref }}
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 -m reference.example_calculation</code></pre>
  </div>
</section>

<section class="ux-workflow" aria-labelledby="workflow-title">
  <h2 id="workflow-title">Evaluate your model</h2>
  <ol class="ux-steps">
    <li><div><h3>Choose a dataset and split</h3><p>Read its guide, download a representative case and check the evaluation requirements before planning a full run.</p><a href="{{ '/datasets/' | relative_url }}">Browse dataset guides <span aria-hidden="true">→</span></a></div></li>
    <li><div><h3>Generate predictions</h3><p>Run your model on the specified evaluation cases. Map predictions onto every required scoring location, even if your model uses a different mesh or representation.</p><a href="{{ source_root }}/benchmark-specs">Dataset specifications <span aria-hidden="true">↗</span></a></div></li>
    <li><div><h3>Evaluate and package the evidence</h3><p>Use the reference tools and dataset instructions to calculate metrics, extract profiles and record your model, evaluation and spatial coverage.</p><a href="{{ source_root }}/examples/v3-template">Result package template <span aria-hidden="true">↗</span></a><span class="ux-link-separator" aria-hidden="true">·</span><a href="{{ source_root }}/METHODOLOGY.md">Methodology guide <span aria-hidden="true">↗</span></a></div></li>
    <li><div><h3>Validate, then submit when open</h3><p>For an open dataset, validate your result directory before proposing it through a pull request. Replace the placeholders below with your dataset and submission IDs.</p><pre class="ux-inline-code"><code>python3 scripts/validate_submission.py --contributor-stage \
  submissions/&lt;dataset-id&gt;/&lt;submission-id&gt;</code></pre><p class="ux-small-note">The contributor validator requires an official, open scoring release. Passing validation alone does not approve a result for publication.</p></div></li>
  </ol>
</section>

<details class="ux-page-disclosure" id="validation">
  <summary>What does FluidsBench validate?</summary>
  <div>
    <p>Maintainers check the submitted package's structure, required coverage, metadata, file hashes and internal consistency. Model authors run their own models and calculate the reported metrics using the dataset's evaluation rules.</p>
    <p>Required approval does not include executing your model or recomputing base metrics from prediction fields. Optional prediction checks are reported separately. Public code, model and environment artifacts are optional.</p>
    <a href="{{ source_root }}/OPEN_REPRODUCIBILITY.md">Read the evaluation and validation policy <span aria-hidden="true">↗</span></a>
  </div>
</details>
