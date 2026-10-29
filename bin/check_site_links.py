#!/usr/bin/env python3
"""Check local navigation and assets in the rendered production website."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if value and name in {"href", "src", "poster", "action"}:
                self.urls.append(value)
            elif value and name == "srcset":
                self.urls.extend(item.strip().split()[0] for item in value.split(",") if item.strip())


def validate(root):
    errors = []
    for page in root.rglob("*.html"):
        parser = Links()
        parser.feed(page.read_text())
        for value in parser.urls:
            url = urlsplit(value)
            if url.netloc and url.netloc != "fluidsbench.org":
                continue
            if url.scheme and url.scheme not in {"https", "http"}:
                continue
            if not url.path:
                continue
            target = ((root / unquote(url.path).lstrip("/")) if url.path.startswith("/") else page.parent / unquote(url.path)).resolve()
            if target.is_dir():
                target /= "index.html"
            if not target.is_relative_to(root) or not target.is_file():
                errors.append(f"{page.relative_to(root)}: missing local target {value}")
    return sorted(set(errors))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    root = parser.parse_args().root.resolve()
    errors = validate(root)
    for error in errors:
        print(error)
    if not errors:
        print(f"Local navigation and assets verified across {len(list(root.rglob('*.html')))} rendered pages.")
    raise SystemExit(bool(errors))
