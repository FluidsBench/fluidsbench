# Profile location guide

`drivaerml-v9.json` is a byte-for-byte display copy of
[`benchmark-specs/drivaerml/drivaerml-diagnostics-v9.json`](https://github.com/neilashton/fluidsbench-submission/blob/f0f5b455929f18fef5c9b41c04beba7468bb3c84/benchmark-specs/drivaerml/drivaerml-diagnostics-v9.json)
from the submission snapshot used by the development leaderboard.

SHA-256: `df22bc807b62f925c32659d681ac44064e6acf46449038b8431b1e9139aba1e8`.

The DrivAerML guide projects the sixteen fixed velocity lines and four Cp cutting planes in
metres. The vehicle outline and Cp surface highlights are schematic; they are not
case geometry or sampled pressure paths. Geometry-relative families show an
explanation instead of fixed coordinates. Selecting a guide location updates the
existing station selector and profile chart. The guides do not change evaluation,
scores, profile support, or exports.

## AhmedML, WindsorML and HiLiftAeroML

These display bundles are exported from submission commit
`8228659b2c4020121adce79455eee8046ed23be9`. Each records its source file and digest.

- `ahmedml-v1.json`: the complete native profile definition plus geometry
  parameters and surface bounds for all 316 distinct evaluation cases. Every
  geometry record is matched to the case-support digest already bound by the
  website's native CFD truth. Velocity target endpoints are computed from that
  case's L/H/W and bounds. Cp highlights indicate the roof, underbody and rear
  slant regions; they are not a reconstruction of the frozen projected samples.
- `windsorml-v2.json`: the complete v2 profile definition. The guide reads the
  selected case's height from the checksum-verified native profile payload, with
  no reference-case substitution while loading. Both fixed and height-relative
  families are selectable; the latter stay report-only. Windsor's vertical axis
  is y and lateral axis is z. Surface highlights describe regions and target
  extents, rather than sampled pressure paths.
- `hiliftaeroml-v1.json`: the leaderboard's ten pressure rows and five velocity
  stations, including published dog-leg x and x/y/z-surface coordinates. Pressure
  rows use an explicitly schematic inboard-to-outboard layout, without physical
  span ticks: dog-leg x is not a span coordinate. Velocity markers use physical
  x/y coordinates and a group B/C detail view. The wing outline is schematic;
  no selected-case mesh, deflection or connected Cp path is invented.

Selecting an SVG marker or button updates the same station menu, chart and URL
as the existing controls. Enter and Space activate SVG markers. Unknown stations
and missing geometry show an unavailable/loading message instead of another
case's locations. Changing datasets rebuilds the guide alongside its profile
panel; the existing DrivAerML fixed/relative behaviour is retained.

Regenerate or verify from the audited submission checkout:

```sh
python bin/export_profile_locations.py --submission-root ../fluidsbench-submission
python bin/export_profile_locations.py --submission-root ../fluidsbench-submission --check
```

Run `node --test tests/test_profile_locations.js` to check the definition digest,
projection scale, all-case geometry coverage, axis conventions, fixed/relative
placement, station coverage, Cp regions, missing support, keyboard activation and
asynchronous selection. CI also regenerates the three new bundles for comparison
with the pinned submission source.
