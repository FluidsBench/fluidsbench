#!/usr/bin/env python3
"""Render the editable share banner; requires CairoSVG and a system Cairo library."""
import base64
from pathlib import Path
import xml.etree.ElementTree as ET

import cairosvg

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/img/social/fluidsbench-share-v1.svg"
OUTPUT = SOURCE.with_suffix(".png")

if __name__ == "__main__":
    tree = ET.parse(SOURCE)
    # Inline the existing figures for rendering; no network access or unsafe SVG
    # mode is required. Keep the checked-in SVG small and editable.
    for element in tree.iter("{http://www.w3.org/2000/svg}image"):
        key = "{http://www.w3.org/1999/xlink}href"
        figure = (SOURCE.parent / element.attrib[key]).resolve()
        if not figure.is_relative_to(ROOT / "assets/img/datasets") or figure.suffix != ".png":
            raise ValueError(f"Expected a local dataset figure: {figure}")
        element.set(key, "data:image/png;base64," + base64.b64encode(figure.read_bytes()).decode())
    cairosvg.svg2png(bytestring=ET.tostring(tree.getroot()), write_to=str(OUTPUT))
    print(f"Rendered {OUTPUT.relative_to(ROOT)}")
