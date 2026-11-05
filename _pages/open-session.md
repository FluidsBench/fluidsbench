---
layout: support
title: Open session
permalink: /open-session/
page_title: FluidsBench Open Session
page_description: Benchmarking, scoring and submissions
description: Join the FluidsBench organising committee for a benchmark overview, DrivAerML submission walkthrough and community Q&A on 11 November 2026.
hide_header_background: true
exclude_from_release: true
---

{% assign event = site.open_session %}

<div class="open-session-page" data-open-session data-event-start="{{ event.starts_at }}" data-event-end="{{ event.ends_at }}">
  <p class="open-session-date"><time datetime="{{ event.starts_at }}">{{ event.date_label }}</time><br><strong>{{ event.time_label }}</strong></p>
  <p class="ux-page-lead">{{ event.description }}</p>
  <p>Researchers, practitioners and anyone interested in AI for fluid dynamics are welcome. The <a href="{{ '/contributors/' | relative_url }}#organisers">FluidsBench organising committee</a> will introduce the benchmark and discuss questions from the community.</p>

  <section class="open-session-join" aria-label="Join the open session" data-event-phase="upcoming live"{% if event.phase == 'ended' %} hidden{% endif %}>
    <div class="open-session-actions">
      <a class="open-session-button" href="{{ event.join_url | escape }}">Join on Microsoft Teams <span aria-hidden="true">↗</span></a>
      <span class="open-session-live" data-event-phase="live"{% unless event.phase == 'live' %} hidden{% endunless %}>The session is in progress</span>
    </div>
    <p>Use the meeting link to join. The organiser will admit attendees from the lobby.</p>
    <p class="ux-small-note">Meeting ID: <code>{{ event.meeting_id }}</code> · Passcode: <code>{{ event.passcode }}</code></p>
    <h2>Add to your calendar</h2>
    <div class="open-session-actions">
      <a href="{{ event.google_calendar_url | escape }}">Google Calendar <span aria-hidden="true">↗</span></a>
      <a href="{{ event.outlook_calendar_url | escape }}">Outlook on the web <span aria-hidden="true">↗</span></a>
      <a href="{{ event.calendar_path | relative_url }}" download>Download calendar file (.ics)</a>
    </div>
    <p class="ux-small-note">The calendar options add a copy of the event in your calendar's timezone. The .ics file also works with Outlook and Apple Calendar.</p>
  </section>

  <section class="ux-page-notice" data-event-phase="ended"{% unless event.phase == 'ended' %} hidden{% endunless %} aria-label="Session follow-up">
    <h2>This session has ended</h2>
    <p>Continue the discussion in <a href="{{ '/community/' | relative_url }}">the FluidsBench community</a>, or <a href="mailto:admin@fluidsbench.org">contact the team</a> for follow-up material.</p>
  </section>

  <p class="open-session-local-time" data-event-local-time hidden></p>
  <details class="ux-page-disclosure">
    <summary>Time in other locations</summary>
    <ul class="open-session-timezones">
      <li><span>London (GMT) / UTC</span><strong>{{ event.time_label | remove: ' GMT / UTC' }}</strong></li>
      {% for zone in event.time_zones %}<li><span>{{ zone.label }}</span><strong>{{ zone.time_label }}</strong></li>{% endfor %}
    </ul>
    <p>All times refer to Wednesday 11 November 2026. The session lasts one hour.</p>
  </details>

  <h2>Programme <span class="ux-small-note">(GMT / UTC)</span></h2>
  <ol class="open-session-programme">
    {% for item in event.agenda %}
      <li><span>{{ item.time_label }}</span><div><h3>{{ item.title }}</h3><p>{{ item.description }}</p></div></li>
    {% endfor %}
  </ol>

  <h2>Explore FluidsBench</h2>
  <p>You can explore the <a href="{{ '/datasets/' | relative_url }}">datasets</a>, read the <a href="{{ '/run/' | relative_url }}">submission instructions</a> and <a href="{{ '/leaderboard-preview/' | relative_url }}?dataset=drivaerml">preview the leaderboard</a>. Questions and suggestions for additional datasets are welcome.</p>
  <p>Please share this page with colleagues and collaborators: <a href="{{ event.path | absolute_url }}">{{ event.path | absolute_url }}</a>.</p>
</div>
