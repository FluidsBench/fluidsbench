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

  <section class="dataset-list" aria-label="Available datasets">
    {% for slug in dataset_order %} {% assign dataset = site.data.dataset_catalog[slug] %}
    {% unless site.data.leaderboard_display[slug].hidden %}
    <article class="dataset-card">
      <a class="dataset-card-image" href="{{ '/datasets/' | append: slug | append: '/' | relative_url }}" tabindex="-1" aria-hidden="true">
        <img src="{{ dataset.source.image.path | relative_url }}" alt="" loading="lazy" decoding="async">
      </a>
      <div class="dataset-card-copy">
        <p class="dataset-kicker">{{ dataset.category }}</p>
        <h3>{{ dataset.name }}</h3>
        <p>{{ dataset.summary }}</p>
      </div>
      <div class="ux-dataset-actions">
        {% if site.launch.leaderboard_visible %}<a class="ux-dataset-results" href="{{ '/' | relative_url }}?dataset={{ dataset.name | slugify }}">View leaderboard <span aria-hidden="true">↗</span></a>{% else %}<a class="ux-dataset-results" href="{{ '/run/' | relative_url }}#{{ slug }}">Submission status <span aria-hidden="true">↗</span></a>{% endif %}
        <a class="dataset-card-link" href="{{ '/datasets/' | append: slug | append: '/' | relative_url }}">Dataset guide →</a>
      </div>
    </article>
    {% endunless %}
    {% endfor %}
  </section>
</div>
