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
    {% for entry in site.data.pressure_references.datasets %}<a href="#{{ entry[0] }}">{{ entry[1].name }}</a>{% endfor %}
  </nav>

  <details class="dataset-appendix pressure-reference">
    <summary>References, relative errors and zero denominators</summary>
    <div class="pressure-reference-body">
      {% for item in site.data.pressure_references.common %}<p>{{ item[1] | escape }}</p>{% endfor %}
    </div>
  </details>

{% for entry in site.data.pressure_references.datasets %}

  <section id="{{ entry[0] }}" class="pressure-reference-section">
    <h2>{{ entry[1].name }}</h2>
    <p>{{ entry[1].summary | escape }}</p>
    {% assign pressure_slug = entry[0] %}
    {% include pressure_reference.html slug=pressure_slug full=true %}
  </section>
  {% endfor %}
</div>
