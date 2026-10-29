"""Run the submission repository's Python scorer as an independent UI oracle."""

import importlib.util
import json
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location("reference_scores", Path(sys.argv[1]) / "reference/scores.py")
scores = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scores)
results = []
for case in json.load(sys.stdin):
    try:
        declaration = case["declaration"]
        values = case["values"]
        zero = case.get("fixedZero", [])
        total = scores.composite_overall_score(values, declaration, fixed_zero_component_ids=zero)
        components = [
            scores.composite_overall_score(
                values,
                {"operation": "weighted_component_scores", "components": [{**item, "weight": 1.0}]},
                fixed_zero_component_ids=zero,
            )
            for item in declaration["components"]
        ]
        results.append({"total": total, "components": components})
    except (KeyError, ValueError, TypeError) as error:
        results.append({"error": str(error)})
json.dump(results, sys.stdout, allow_nan=False)
