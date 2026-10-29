#!/usr/bin/env python3
"""Version local stylesheet URLs from their final, post-PurgeCSS contents."""

import argparse
import hashlib
import re
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

HREF = re.compile(r'''(\bhref=["'])([^"']+)(["'])''')


def refresh(root: Path, check: bool = False) -> list[Path]:
    hashes = {
        "/" + path.relative_to(root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in (root / "assets/css").rglob("*.css")
    }

    def replace(match):
        url = urlsplit(match[2])
        if url.scheme or url.netloc or not re.fullmatch(r"[0-9a-f]{32}|[0-9a-f]{64}", url.query):
            return match[0]
        # Keep the hosted preview prefix and any fragment intact.
        offset = url.path.find("/assets/css/")
        if offset < 0:
            return match[0]
        asset = url.path[offset:]
        if asset not in hashes:
            raise ValueError(f"Missing stylesheet: {asset}")
        return match[1] + urlunsplit(url._replace(query=hashes[asset])) + match[3]

    changed = []
    for path in root.rglob("*.html"):
        original = path.read_text()
        updated = HREF.sub(replace, original)
        if updated != original:
            changed.append(path)
            if not check:
                path.write_text(updated)
    return changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    changed = refresh(args.root, args.check)
    if args.check and changed:
        raise SystemExit(f"Stale stylesheet fingerprints in {len(changed)} pages")
    print("Stylesheet fingerprints verified." if args.check else f"Updated stylesheet fingerprints in {len(changed)} pages.")


if __name__ == "__main__":
    main()
