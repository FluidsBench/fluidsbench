---
layout: support
title: Open session recording
permalink: /open-session/
page_title: FluidsBench Open Session
page_description: Benchmarking, scoring and submissions
description: Watch the FluidsBench open session recording, covering the benchmark aims, current and future datasets, evaluation, scoring and a DrivAerML submission walkthrough.
hide_header_background: true
exclude_from_release: true
---

{% assign event = site.open_session %}
{% assign recording = event.recording %}

<div class="open-session-page">
  <section id="recording" class="session-recording" aria-labelledby="recording-title" data-session-recording>
    <div class="session-recording-heading">
      <h2 id="recording-title">Watch the recording <span>· {{ recording.duration_label }}</span></h2>
      <p>Recorded <time datetime="2026-11-11">11 November 2026</time></p>
    </div>
    <video controls playsinline preload="metadata" poster="{{ recording.poster_path | relative_url }}" aria-label="FluidsBench open session recording">
      <source src="{{ recording.url | escape }}" type="video/mp4">
      <track kind="captions" src="{{ recording.captions_path | relative_url }}" srclang="en" label="English (auto-generated)">
      <track kind="chapters" src="{{ recording.chapters_path | relative_url }}" srclang="en" label="Session chapters">
      <p><a href="{{ recording.url | escape }}">Download the recording</a> to watch it in your video player.</p>
    </video>
    <p class="ux-small-note" data-recording-feedback role="status" hidden></p>
    <p class="session-recording-summary">The organising committee introduces the aims of FluidsBench, current and future datasets, evaluation and scoring, followed by a DrivAerML submission walkthrough.</p>
    <p class="ux-small-note"><a href="{{ recording.url | escape }}">Download video ({{ recording.size_label }})</a></p>

    <nav class="session-chapters" aria-labelledby="session-chapters-title">
      <h3 id="session-chapters-title">Jump to a chapter</h3>
      <ol>
        {% for chapter in recording.chapters %}
          <li><a href="?t={{ chapter.seconds }}#recording" data-recording-seek="{{ chapter.seconds }}"><span class="session-chapter-time">{{ chapter.timestamp }}</span><span>{{ chapter.title }}</span></a></li>
        {% endfor %}
      </ol>
    </nav>

  </section>

  <section class="session-resources" aria-labelledby="session-resources-title">
    <h2 id="session-resources-title">Slides and next steps</h2>
    <ul>
      <li><a href="{{ recording.slides_url | escape }}">View the session slides <span aria-hidden="true">↗</span></a></li>
      <li><a href="{{ '/run/' | relative_url }}">Follow the submission guide <span aria-hidden="true">→</span></a></li>
      <li><a href="{{ '/datasets/' | relative_url }}">Explore the datasets <span aria-hidden="true">→</span></a></li>
      <li><a href="{{ '/leaderboard-preview/' | relative_url }}?dataset=drivaerml">Preview the leaderboard <span aria-hidden="true">→</span></a></li>
    </ul>
    <p>Continue the discussion in <a href="{{ '/community/' | relative_url }}">the FluidsBench community</a>, or <a href="mailto:admin@fluidsbench.org">contact the team</a>.</p>
  </section>
</div>

<script defer src="{{ '/assets/js/session-recording.js' | relative_url | bust_file_cache }}"></script>
