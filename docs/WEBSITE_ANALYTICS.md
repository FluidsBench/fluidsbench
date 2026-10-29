# Website analytics

The live website uses the **FluidsBench** Google Analytics 4 property in the
existing **neilashton** Analytics account. Access is restricted to authorised
Google Analytics users; the reports are not public.

- [Open the FluidsBench dashboard](https://analytics.google.com/analytics/web/#/a308460215p561548329/reports/intelligenthome).
- Property ID: `561548329`.
- Web stream: **FluidsBench website**, `https://fluidsbench.org`.
- Measurement ID: `G-5KDKRF1XY9` (a public tag identifier, not a credential).

Use **Realtime** to check current visits, **Traffic acquisition** to see where
visitors come from, and **Pages and screens** to see which pages they visit.
The report date picker controls the period shown. Realtime normally updates
within minutes; [standard reports can take 24–48 hours to process](https://support.google.com/analytics/answer/11198161).

Collection begins when the tag is deployed. Visits made while tracking was
disabled cannot be recovered. Browser blocking can also reduce recorded visits.

The tag is configured in `_config.yml` and rendered by
`_includes/scripts/analytics.liquid`. It is enabled only for production builds
with the canonical `https://fluidsbench.org` URL, and is excluded when
`local_ux_preview` is enabled. Ordinary development builds do not load it.
Google signals and advertising-personalisation signals are disabled in the tag.
