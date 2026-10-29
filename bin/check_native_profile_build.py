#!/usr/bin/env python3
"""Reject builds that rewrite or omit checksum-bound native profile assets."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def checked(path, expected):
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError(f"Built native profile checksum differs: {path}")
    return data


def check(build):
    for dataset in ("airfrans", "drivaernetplusplus"):
        binding = json.loads((ROOT / f"_data/{dataset}_native_profiles.json").read_text())
        path = build / binding["manifest_path"]
        manifest = json.loads(checked(path, binding["manifest_sha256"]))
        for chunk in manifest["chunks"]:
            checked(path.parent / chunk["file"], chunk["sha256"])
        print(f"Built {dataset}: manifest and {len(manifest['chunks'])} native profile artifacts verified.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("build", type=Path)
    check(parser.parse_args().build)
