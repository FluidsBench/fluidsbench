---
layout: support
title: Contributors
permalink: /contributors/
page_title: Contributors
page_description: The people and teams building FluidsBench across research and industry.
description: Meet the FluidsBench organising committee and advisers, explore dataset credits and find ways to contribute.
support_class: ux-contributors-page
hide_header_background: true
---

<div class="ux-page-actions"><a class="ux-primary-link" href="#contribute">How to contribute <span aria-hidden="true">↓</span></a></div>

{% include people_grid.liquid people=site.data.people.organisers id="organisers" heading="Organising committee" variant="organisers" %}

{% include people_grid.liquid people=site.data.people.advisory_board id="advisory-board" heading="Scientific and industrial advisory board" variant="advisory" %}

<section class="ux-support-section" aria-labelledby="dataset-teams-title">
  <h2 id="dataset-teams-title">Dataset and software contributors</h2>
  <p>FluidsBench builds on the work of the original dataset authors and maintainers. Each dataset guide links to its source project and publications.</p>
  <div class="ux-dataset-credits">
    {% assign dataset_order = 'ahmedml,drivaerml,drivaernetplusplus,windsorml,hiliftaeroml,airfrans,blendednet,vki-ls59,rotor37' | split: ',' %}
    {% for slug in dataset_order %}
      {% unless site.data.leaderboard_display[slug].hidden %}
        {% if site.data.leaderboard_display[slug].coming_soon %}
        <span class="dataset-coming-soon dataset-credit-coming-soon" data-dataset-id="{{ slug }}" data-dataset-status="coming-soon">{{ site.data.dataset_catalog[slug].name }} <span class="dataset-coming-soon-badge">Coming soon</span></span>
        {% else %}
        <a href="{{ '/datasets/' | append: slug | append: '/' | relative_url }}">{{ site.data.dataset_catalog[slug].name }} <span aria-hidden="true">↗</span></a>
        {% endif %}
      {% endunless %}
    {% endfor %}
  </div>
  <p class="ux-small-note">Explore the contribution history for the <a href="https://github.com/neilashton/fluidsbench-submission/graphs/contributors">evaluation tools</a> and the <a href="https://github.com/neilashton/fluidsbench/graphs/contributors">website</a>.</p>
</section>

<section class="ux-support-section" id="contribute" aria-labelledby="contribute-title">
  <h2 id="contribute-title">Help build the benchmark</h2>
  <div class="ux-feature-grid">
    <article class="ux-feature"><h3>Evaluate a model</h3><p>Explore the reference tools and prepare your evaluation for when dataset submissions open.</p><a href="{{ '/run/' | relative_url }}">Get started <span aria-hidden="true">→</span></a></article>
    <article class="ux-feature"><h3>Propose a dataset</h3><p>Share the physical problem, available data and proposed evaluation with the organising team.</p><a href="mailto:admin@fluidsbench.org?subject=FluidsBench%20dataset%20proposal">Contact the team <span aria-hidden="true">→</span></a></article>
    <article class="ux-feature"><h3>Improve the tools</h3><p>Report an issue or contribute to the evaluation code, documentation or website.</p><a href="https://github.com/neilashton/fluidsbench-submission/issues">Evaluation issues <span aria-hidden="true">↗</span></a><a href="https://github.com/neilashton/fluidsbench/issues">Website issues <span aria-hidden="true">↗</span></a></article>
  </div>
</section>
