---
layout: page
permalink: /pressure-references/
title: Pressure definitions
page_title: Pressure definitions
page_description: Dataset-specific pressure units, reference values and evaluation conventions, with source evidence.
nav: false
hide_header_background: true
compact_masthead: true
---

<div class="dataset-page pressure-reference-page">
  <p>Pressure does not mean the same quantity in every dataset. These definitions distinguish the stored field, its reference and the quantity used for evaluation.</p>
  <p class="dataset-download-note">Reviewed {{ site.data.pressure_references.audited_on }} against the dev specifications. This documentation audit does not change scores or open submissions. Evidence gaps are marked below.</p>

  <nav class="pressure-reference-index" aria-label="Dataset pressure definitions">
    {% for entry in site.data.dataset_catalog %}{% assign slug = entry[0] %}
    <a href="#{{ slug }}"{% if site.data.leaderboard_display[slug].coming_soon %} class="dataset-coming-soon" data-dataset-id="{{ slug }}" data-dataset-status="coming-soon"{% endif %}>{{ entry[1].name }}{% if site.data.leaderboard_display[slug].coming_soon %} · Coming soon{% endif %}</a>
    {% endfor %}
  </nav>

  <details class="dataset-appendix pressure-reference">
    <summary>References, relative errors and zero denominators</summary>
    <div class="pressure-reference-body">
      {% for item in site.data.pressure_references.common %}
      {% unless item[0] == 'rotor_rrmse' and site.data.leaderboard_display.rotor37.coming_soon %}<p>{{ item[1] | escape }}</p>{% endunless %}
      {% endfor %}
    </div>
  </details>

{% for entry in site.data.dataset_catalog %}
  {% assign pressure_slug = entry[0] %}
  {% if site.data.leaderboard_display[pressure_slug].coming_soon %}
  <section id="{{ pressure_slug }}" class="pressure-reference-section dataset-coming-soon" data-dataset-id="{{ pressure_slug }}" data-dataset-status="coming-soon">
    <h2>{{ entry[1].name }} <span class="dataset-coming-soon-badge">Coming soon</span></h2>
    <p>The benchmark definition will be published when ready.</p>
  </section>
  {% else %}

  <section id="{{ entry[0] }}" class="pressure-reference-section">
    <h2>{{ entry[1].name }}</h2>
    <p>{{ site.data.pressure_references.datasets[pressure_slug].summary | escape }}</p>
    {% include pressure_reference.html slug=pressure_slug full=true %}
  </section>
  {% endif %}
  {% endfor %}
</div>
