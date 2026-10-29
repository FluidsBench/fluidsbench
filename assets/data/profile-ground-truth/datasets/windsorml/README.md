# WindsorML native CFD profile preview

This candidate visualization release contains the exact 128-point truth arrays
from the evaluator's frozen profile support. It does not contain model
predictions, synthetic curves, or leaderboard scores. Public submissions remain
closed pending owner review.

All eight Hugging Face splits are mapped to the intersection of the official
assignments with published per-run fields. The four data-efficiency splits share
the 35-case baseline test set. Geometry and image-wake each have 71 test cases;
high-drag and low-drag each have 70. The union contains 233 cases. Runs 350–354
have no public per-run payload and are excluded without reassignment.

Each case has three Cp cuts and five streamwise-velocity profiles in both fixed
and body-height-relative placement families: 16 series, each with 128 samples.
The relative families have zero score weight. Cp comes from native boundary
points; velocity comes from native volume cells and is divided by 42.1 m/s.
Native entity IDs and containment-fallback metadata are retained. No smoothing,
resampling, rounding, or invented values are introduced by this export.

Case chunks are shared by the five case-set indexes to avoid duplicated data.
The website manifest hashes each index, and each index hashes its case chunks.
Every chunk also records the immutable dataset revision and evaluator support,
definition, source-identity, and per-case support SHA-256 bindings.

Regenerate from the matching submission checkout:

```sh
python3 bin/export_windsorml_native_profile_truth.py --submission-root ../fluidsbench-submission
python3 bin/export_windsorml_native_profile_truth.py --submission-root ../fluidsbench-submission --check
```

After regeneration, rebind the website manifest hash in the submission feed and
its existing AhmedML/HiLiftAeroML references, then rebuild the feed. Keep the
preview's submission revision and profile-contract CI checkout on the same
commit. Changing the site-wide manifest does not alter other datasets' profile
values or scoring rules.

The upstream dataset is licensed under CC BY-SA 4.0. Source:
[neashton/windsorml, revision 8a6ca32](https://huggingface.co/datasets/neashton/windsorml/tree/8a6ca32ae22c94f54df2186d1b0ccf9662a294c2).
