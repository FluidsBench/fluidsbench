---
layout: support
title: About
permalink: /about/
page_title: About FluidsBench
page_description: A shared foundation for assessing physics AI surrogate models.
description: The purpose, evaluation principles and people behind FluidsBench.
hide_header_background: true
---

<p class="ux-page-lead">FluidsBench provides a common evaluation framework for AI surrogate models in fluid dynamics. Shared test splits, reference evaluation tools and published metrics support systematic comparison of predictive accuracy and generalisation across research and engineering applications.</p>

<div class="ux-feature-grid">
  <section class="ux-feature">
    <span class="ux-section-number" aria-hidden="true">01</span>
    <h2>Realistic flows</h2>
    <p>Explore datasets spanning vehicle, aircraft and turbomachinery aerodynamics, with evaluation that respects each physical problem.</p>
    <a href="{{ '/datasets/' | relative_url }}">Explore datasets <span aria-hidden="true">→</span></a>
  </section>
  <section class="ux-feature">
    <span class="ux-section-number" aria-hidden="true">02</span>
    <h2>Comparable evaluations</h2>
    <p>Defined test cases, scoring locations and metrics give models a common basis for comparison within each benchmark.</p>
    <a href="{{ '/run/' | relative_url }}">See the evaluation process <span aria-hidden="true">→</span></a>
  </section>
  <section class="ux-feature">
    <span class="ux-section-number" aria-hidden="true">03</span>
    <h2>Evidence behind results</h2>
    <p>Inspect reported metrics, flow profiles and validation records. Versioned releases keep results tied to the evaluation that produced them.</p>
    <a href="{{ '/' | relative_url }}{% unless site.launch.leaderboard_visible %}#leaderboard-tour{% endunless %}">{% if site.launch.leaderboard_visible %}Explore the leaderboard{% else %}Leaderboard and metrics{% endif %} <span aria-hidden="true">→</span></a>
  </section>
</div>

<aside class="ux-page-notice" aria-label="Current benchmark status">
  {% if site.launch.can_submit %}
  <strong>Submissions are open for {{ site.launch.open_count }} datasets</strong>
  <p>Choose a dataset and follow its participant guide. {% unless site.launch.leaderboard_visible %}The first leaderboard is planned for {{ site.launch.reveal_at | date: '%-d %B %Y' }} Anywhere on Earth (UTC−12).{% endunless %} <a href="{{ '/run/' | relative_url }}">See open datasets and submission instructions →</a></p>
  {% else %}
  <strong>Submissions in preparation</strong>
  <p>Each dataset opens when its evaluation rules and scoring support are ready. <a href="{{ '/run/' | relative_url }}">Check submission availability →</a></p>
  {% endif %}
</aside>

{% include scoring_explainer.liquid %}

<div class="ux-info-grid">
  <section>
    <h2>People and governance</h2>
    <p>The organising committee develops FluidsBench with scientific and industrial advisers. Dataset teams define the evaluation requirements; maintainers review result packages before publication.</p>
    <a href="{{ '/contributors/' | relative_url }}">Meet the contributors <span aria-hidden="true">→</span></a>
  </section>
  <section>
    <h2>Get in touch</h2>
    <p>For questions about the project, collaborations or adding a dataset, contact <a href="mailto:admin@fluidsbench.org">admin@fluidsbench.org</a>.</p>
    <a href="{{ '/community/' | relative_url }}">Join the community <span aria-hidden="true">→</span></a>
  </section>
</div>
