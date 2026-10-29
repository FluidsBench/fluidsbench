#!/usr/bin/env python3
"""Reject preview builds that leak internal navigation to the production root."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


SITE_ORIGIN = "https://fluidsbench.org"
URL_ATTRIBUTES = {"action", "href", "poster", "src"}


class PreviewLinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[str] = []
        self.has_noindex = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "meta" and values.get("name", "").lower() in {"robots", "googlebot"}:
            directives = {item.strip().lower() for item in values.get("content", "").split(",")}
            self.has_noindex = self.has_noindex or "noindex" in directives

        for name, value in attrs:
            if value is None:
                continue
            if name in URL_ATTRIBUTES:
                self.links.append(value)
            elif name == "srcset":
                self.links.extend(candidate.strip().split()[0] for candidate in value.split(",") if candidate.strip())


def escaped_internal_path(url: str, baseurl: str) -> bool:
    candidate = url.strip()
    if not candidate or candidate.startswith(("#", "data:", "javascript:", "mailto:", "tel:", "//")):
        return False

    if candidate.startswith(SITE_ORIGIN):
        candidate = candidate[len(SITE_ORIGIN) :]
    elif urlsplit(candidate).scheme:
        return False

    path = urlsplit(candidate).path
    if not path.startswith("/"):
        return False
    return path != baseurl and not path.startswith(f"{baseurl}/")


def validate(root: Path, baseurl: str) -> list[str]:
    errors: list[str] = []
    html_files = sorted(root.rglob("*.html"))
    if not html_files:
        return [f"{root} contains no HTML files"]

    for path in html_files:
        parser = PreviewLinkParser()
        parser.feed(path.read_text(encoding="utf-8"))
        if not parser.has_noindex:
            errors.append(f"{path.relative_to(root)} does not declare noindex")
        for link in parser.links:
            if escaped_internal_path(link, baseurl):
                errors.append(f"{path.relative_to(root)} escapes the preview prefix: {link}")

    for filename in ("CNAME", "feed.xml", "robots.txt", "sitemap.xml"):
        if (root / filename).exists():
            errors.append(f"preview artifact must not publish {filename}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("baseurl")
    args = parser.parse_args()
    baseurl = "/" + args.baseurl.strip("/")
    errors = validate(args.root.resolve(), baseurl)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print(f"Validated preview prefix and noindex metadata across {len(list(args.root.rglob('*.html')))} pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
