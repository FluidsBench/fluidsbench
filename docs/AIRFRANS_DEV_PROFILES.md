# AirfRANS dev profile display

The dev viewer uses `assets/data/airfrans-native-profiles/`, independently of the historical prototype ground-truth manifest. Full and Scarce each expose the same 200 cases; AoA exposes 196. The union has 355 distinct cases. Reynolds remains closed.

Every case preserves all eight native velocity series and all 1001 coordinate/value pairs. Deterministic gzip reduces transfer size without resampling or rounding. Each artifact is bound to its exact source extraction checksum; the browser verifies the bundle and each downloaded case before plotting. The bundle is for visualization; it does not recompute submitted scores or change scientific contracts.

To reproduce, obtain the verified profile-truth release using the submission repository's AirfRANS setup command, then run from this repository:

```sh
python3 bin/export_airfrans_native_profiles.py \
  --submission-root /path/to/fluidsbench-submission \
  --truth-root /path/to/airfrans-support/installed/profiles
FLUIDSBENCH_SUBMISSION_ROOT=/path/to/fluidsbench-submission \
  node --test tests/test_airfrans_profiles.js
```

Commit the generated bundle and `_data/airfrans_native_profiles.json` together. Keep the historical global manifest unchanged: retained submissions bind to those exact bytes. CI checks every compressed native case, complete split membership, and the current submission repository's source release binding. No original CFD meshes are needed to regenerate this browser export.

A dev end-to-end check uses a new submission ID: contributor validation, maintainer approval or candidate registration, feed regeneration, then inspection of the row and profiles in the committee viewer. Candidate registration for AhmedML, WindsorML and DrivAerML remains a maintainer step. AirfRANS follows the maintainer approval workflow. Neither route creates an official leaderboard release.
