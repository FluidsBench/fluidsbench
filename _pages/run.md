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
{% if site.launch.dev_intake %}{% assign source_ref = 'dev' %}{% endif %}
{% assign submission_branch = site.submission_target_branch | default: 'main' %}
{% assign source_root = site.submission_repository_url | append: '/tree/' | append: source_ref %}
{% comment %}Current process guidance is separate from the frozen evaluation/data revision.{% endcomment %}
{% assign verification_ref = 'main' %}{% if site.preview_mode %}{% assign verification_ref = 'dev' %}{% endif %}
{% assign verification_guide_url = site.submission_repository_url | append: '/blob/' | append: verification_ref | append: '/docs/OPTIONAL_VERIFICATION.md' %}
{% if site.optional_verification_guide_url %}{% assign verification_guide_url = site.optional_verification_guide_url %}{% endif %}

<aside class="ux-page-notice" aria-label="Submission status">
  {% if site.launch.can_submit %}
    <strong>Submissions are open for the datasets below</strong>
    <p>Choose a dataset and follow its participant quickstart. {% if site.launch.deadline_passed or site.launch.phase == 'reviewing' or site.launch.phase == 'live' %}New submissions will be considered for subsequent releases.{% else %}Submit a complete package by {{ site.launch.cutoff_at | date: '%-d %B %Y, %H:%M:%S' }} AoE (Anywhere on Earth, UTC−12) for consideration in the first release.{% endif %}</p>
  {% else %}
    <strong>Submissions in preparation</strong>
    <p>Explore the tools now. Each dataset opens after its evaluation rules and scoring release are approved.{% if site.launch.phase == 'announced' %} Opening is planned for {{ site.launch.opens_at | date: '%-d %B %Y' }}.{% endif %}</p>
  {% endif %}
</aside>

<section id="datasets" aria-labelledby="submission-datasets-title">
  <p class="ux-page-eyebrow">Start here</p>
  <h2 id="submission-datasets-title">Choose a dataset</h2>
  <p>Start with one dataset and one supported split. Its guide sets out the required evaluation cases.</p>
  {% if site.launch.can_submit %}
  <p class="ux-small-note">To open a submission PR, first push your submission to a branch in your fork. On GitHub, select <strong>compare across forks</strong>, choose your fork and submission branch, and target <code>{{ site.submission_repository_url | remove: 'https://github.com/' }}:{{ submission_branch }}</code>.</p>
  {% endif %}
  <div class="launch-submission-grid">
    {% for entry in site.data.submission_status.datasets %}{% assign slug = entry[0] %}{% assign availability = entry[1] %}
      {% unless site.data.leaderboard_display[slug].hidden %}
      {% assign coming_soon = site.data.leaderboard_display[slug].coming_soon %}
      {% assign dev_candidate = false %}{% if site.launch.dev_intake and availability.dev_candidate %}{% assign dev_candidate = true %}{% endif %}
      <article class="launch-submission-card{% if coming_soon %} dataset-coming-soon{% endif %}" id="{{ slug }}" data-dataset-id="{{ slug }}"{% if coming_soon %} data-dataset-status="coming-soon"{% endif %}>
        {% if coming_soon %}
        <h3>{{ site.data.dataset_catalog[slug].name }} <span class="dataset-coming-soon-badge">Coming soon</span></h3>
        <p>The dataset guide and leaderboard will be available here when ready.</p>
        {% else %}
        <h3>{{ site.data.dataset_catalog[slug].name }} <span>{% if dev_candidate %}Accepting for preview{% elsif availability.open and site.launch.accepting_submissions %}Open for submissions{% elsif availability.open %}Ready for opening{% else %}Coming soon{% endif %}</span></h3>
        {% if availability.open and site.launch.accepting_submissions %}
        <p>Open splits: {% for split in availability.open_splits %}{{ split.label }}{% unless forloop.last %}, {% endunless %}{% endfor %}.</p>
        {% if slug == 'airfrans' %}<p>Reynolds extrapolation is closed. <a href="{{ source_root }}/benchmark-specs/airfrans/RELEASES.md">Support downloads and submission guide ↗</a></p>{% endif %}
        {% endif %}
        {% if availability.guide %}<p><a href="{{ source_root }}/{{ availability.guide }}">Participant quickstart ↗</a></p>{% endif %}
        <div class="launch-submit-links"><a href="{{ '/datasets/' | append: slug | append: '/' | relative_url }}">Dataset guide →</a><a href="{{ source_root }}/benchmark-specs/{{ slug }}">Evaluation requirements ↗</a>
        {% if dev_candidate or availability.open and site.launch.accepting_submissions %}<a href="{{ site.submission_repository_url }}/compare">Open a submission PR ↗</a>{% endif %}</div>
        {% endif %}
      </article>
      {% endunless %}
    {% endfor %}
  </div>
</section>

<section class="ux-quickstart" aria-labelledby="quickstart-title">
  <div>
    <p class="ux-page-eyebrow">Check your setup</p>
    <h2 id="quickstart-title">Try the reference example</h2>
    <p>A small synthetic example checks your setup and demonstrates metric calculation. It runs locally without downloading a CFD dataset or training a model.</p>
    <a href="{{ source_root }}/reference">Reference documentation <span aria-hidden="true">↗</span></a>
  </div>
  <div class="ux-code-panel">
    <div class="ux-code-label">Terminal <span>Python 3 · macOS / Linux</span></div>
    <pre><code>git clone {{ site.submission_repository_url }}.git
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
    <li><div><h3>Validate your package</h3><p>Validate the generated result directory before opening a pull request. Replace the placeholders with your dataset and submission IDs.</p><pre class="ux-inline-code"><code>python3 scripts/validate_submission.py {% if site.launch.dev_intake %}--dev-intake {% endif %}--contributor-stage \
  submissions/&lt;dataset-id&gt;/&lt;submission-id&gt;</code></pre><p class="ux-small-note">Use this command for a dataset currently accepting submissions above. Maintainers review the package before publication.</p></div></li>
  </ol>
</section>

<p>Open a pull request against <code>{{ submission_branch }}</code> containing only your new submission directory.
Follow <a href="{{ source_root }}/SUBMITTING.md">Submitting a result</a> for the checklist and review process.</p>

{% unless site.launch.dev_intake %}

<details class="ux-page-disclosure" id="first-release-dates">
  <summary>First-release dates</summary>
  <div>
  <ul class="launch-date-list">
    <li><span>Submission opening</span><time datetime="{{ site.launch.opens_at }}">{{ site.launch.opens_at | date: '%-d %B %Y, %H:%M' }} UTC</time></li>
    <li><span>First-release cutoff</span><time datetime="{{ site.launch.cutoff_at }}">{{ site.launch.cutoff_at | date: '%-d %B %Y, %H:%M:%S' }} AoE (Anywhere on Earth, UTC−12)</time></li>
    <li><span>Leaderboard reveal</span><time datetime="{{ site.launch.reveal_at }}">{{ site.launch.reveal_at | date: '%-d %B %Y, %H:%M:%S' }} AoE (Anywhere on Earth, UTC−12)</time></li>
  </ul>
  {% unless site.launch.dates_confirmed %}<p class="ux-small-note">These dates are provisional and will be confirmed before submissions open.</p>{% endunless %}
  </div>
</details>

<details class="ux-page-disclosure" id="first-release-policy">
  <summary>How does inclusion in the first release work?</summary>
  <div>
    <p>For an open dataset, propose one new result directory through a pull request against <code>{{ submission_branch }}</code> in the submission repository. Contributions and reviews are public, including the submitted scores.</p>
    <p>A complete package must satisfy the published evaluation rules at the first-release cutoff. Maintainers record its exact commit and finish their review before publication. Waiting for a maintainer or an automated check does not by itself make an otherwise complete package late.</p>
    <p>Submission does not guarantee acceptance. Incomplete packages or substantive changes after the cutoff are considered for a later release. The benchmark continues accepting submissions after the first leaderboard is published.</p>
  </div>
</details>

{% endunless %}

<details class="ux-page-disclosure" id="optional-verification">
  <summary>How do I request the blue Metrics verified badge?</summary>
  <div>
    <p>Tick the optional verification request in your submission PR and link versioned scored predictions covering the complete test split. A maintainer must recompute the reported metrics before the badge appears.</p>
    <p>Verification does not change scores, ranks or eligibility. Code and model weights remain optional. The badge verifies metrics from shared predictions; it does not certify model execution or training-data use.</p>
    <a href="{{ verification_guide_url }}">Request and checking process <span aria-hidden="true">↗</span></a>
  </div>
</details>

<details class="ux-page-disclosure" id="validation">
  <summary>What does FluidsBench validate?</summary>
  <div>
    <p>Maintainers check the submitted package's structure, required coverage, metadata, file hashes and internal consistency. Model authors run their own models and calculate the reported metrics using the dataset's evaluation rules.</p>
    <p>Required approval does not include executing your model or recomputing base metrics from prediction fields. Optional prediction checks are reported separately. Public code, model and environment artifacts are optional.</p>
    <a href="{{ source_root }}/OPEN_REPRODUCIBILITY.md">Read the evaluation and validation policy <span aria-hidden="true">↗</span></a>
  </div>
</details>
