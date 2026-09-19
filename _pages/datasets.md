---
layout: page
permalink: /datasets/
title: datasets
page_title: Datasets
description:
nav: true
nav_order: 6
hide_header_background: true
compact_masthead: true
---

<div class="datasets-page">
  <p class="datasets-intro">
    Each page separates the current public source release from the immutable FluidsBench scoring contract. Start with a representative image and
    download example, then use the complete-support definition, split notes, and metric equations when preparing an evaluation.
  </p>

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
      <a class="dataset-card-link" href="{{ '/datasets/' | append: slug | append: '/' | relative_url }}">View dataset page</a>
    </article>
    {% endunless %}
    {% endfor %}
  </section>
</div>
