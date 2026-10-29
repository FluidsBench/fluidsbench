---
layout: page
permalink: /datasets/
title: datasets
page_title: Datasets
description: Explore FluidsBench datasets, download guides and evaluation requirements.
nav: true
nav_order: 6
hide_header_background: true
compact_masthead: true
wide: true
---

<div class="datasets-page">
  <div class="ux-catalogue-intro">
    <p class="datasets-intro">Choose a physical problem. Explore the data and evaluation requirements.</p>
    <a href="{{ '/run/' | relative_url }}">How to run a benchmark <span aria-hidden="true">→</span></a>
  </div>

{% assign dataset_order = "ahmedml,drivaerml,drivaernetplusplus,windsorml,hiliftaeroml,airfrans,blendednet,vki-ls59,rotor37" | split: "," %}

  <section class="dataset-list" aria-label="Benchmark datasets">
    {% for slug in dataset_order %} {% assign dataset = site.data.dataset_catalog[slug] %}
    {% unless site.data.leaderboard_display[slug].hidden %}
    {% assign coming_soon = site.data.leaderboard_display[slug].coming_soon %}
    <article class="dataset-card{% if coming_soon %} dataset-coming-soon{% endif %}" data-dataset-id="{{ slug }}"{% if coming_soon %} data-dataset-status="coming-soon"{% endif %}>
      {% if coming_soon %}
      <div class="dataset-card-image">
        <img src="{{ dataset.source.image.path | relative_url }}" alt="" loading="lazy" decoding="async">
      </div>
      {% else %}
      <a class="dataset-card-image" href="{{ '/datasets/' | append: slug | append: '/' | relative_url }}" tabindex="-1" aria-hidden="true">
        <img src="{{ dataset.source.image.path | relative_url }}" alt="" loading="lazy" decoding="async">
      </a>
      {% endif %}
      <div class="dataset-card-copy">
        <p class="dataset-kicker">{{ dataset.category }}</p>
        <h3>{{ dataset.name }}</h3>
        <p>{{ dataset.summary }}</p>
      </div>
      <div class="ux-dataset-actions">
        {% if coming_soon %}
        <span class="dataset-coming-soon-badge">Coming soon</span>
        {% else %}
        {% if site.launch.leaderboard_visible %}<a class="ux-dataset-results" href="{{ '/' | relative_url }}?dataset={{ dataset.name | slugify }}">View leaderboard <span aria-hidden="true">↗</span></a>{% else %}<a class="ux-dataset-results" href="{{ '/run/' | relative_url }}#{{ slug }}">Submission status <span aria-hidden="true">↗</span></a>{% endif %}
        <a class="dataset-card-link" href="{{ '/datasets/' | append: slug | append: '/' | relative_url }}">Dataset guide →</a>
        {% endif %}
      </div>
    </article>
    {% endunless %}
    {% endfor %}
  </section>
</div>
