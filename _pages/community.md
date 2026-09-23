---
layout: support
title: Community
permalink: /community/
page_title: Community
page_description: Connect with people working on fluid dynamics and physics AI.
description: Find FluidsBench community channels, project repositories and contact information.
hide_header_background: true
---

<div class="ux-community-grid">
  <section class="ux-community-card">
    <span class="ux-community-icon" aria-hidden="true"><i class="fa-brands fa-discord"></i></span>
    <h2>Discuss on Discord</h2>
    <p>A place to ask questions, share experiments and discuss datasets and model evaluations.</p>
    {% if site.community_discord_url and site.community_discord_url != '' %}
      <a class="ux-primary-link" href="{{ site.community_discord_url }}" target="_blank" rel="noopener noreferrer">Join Discord <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>
    {% else %}
      <span class="ux-coming-soon">Coming soon</span>
      <p class="ux-small-note">We're setting up the server. The invite will appear here when it's ready.</p>
    {% endif %}
  </section>
  <section class="ux-community-card">
    <span class="ux-community-icon" aria-hidden="true"><i class="fa-brands fa-github"></i></span>
    <h2>Build on GitHub</h2>
    <p>Follow development, report issues and contribute to the evaluation tools or website.</p>
    <a href="https://github.com/neilashton/fluidsbench-submission">Evaluation repository <span aria-hidden="true">↗</span></a>
    <a href="https://github.com/neilashton/fluidsbench">Website repository <span aria-hidden="true">↗</span></a>
  </section>
  <section class="ux-community-card">
    <span class="ux-community-icon" aria-hidden="true"><i class="fa-regular fa-envelope"></i></span>
    <h2>Talk to the team</h2>
    <p>Get in touch about collaborations, dataset proposals or questions about the project.</p>
    <a href="mailto:admin@fluidsbench.org">admin@fluidsbench.org <span aria-hidden="true">→</span></a>
  </section>
</div>

<div class="ux-community-next">
  <div><h2>Find your way in</h2><p>Bring a model, a dataset or an idea for making the benchmark better.</p></div>
  <a class="ux-primary-link" href="{{ '/contributors/' | relative_url }}#contribute">Ways to contribute <span aria-hidden="true">→</span></a>
</div>
