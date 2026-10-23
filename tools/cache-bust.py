#!/usr/bin/env python3
"""TigoMeNote · tools/cache-bust.py
Isang trabaho lang: lagyan ng ?v=<version> ang lahat ng sariling .js/.css sa mga .html
para makuha agad ng phone/browser ang bagong code pagkatapos mag-push (hindi luma sa cache).
Ang version ay kinukuha sa assets/js/config.js (version: "x.y.z").
Gamit (sa root ng repo):  python3 tools/cache-bust.py
Tuwing may release: taasan muna ang version sa config.js, tapos patakbuhin ito."""
import pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
cfg = (root / "assets/js/config.js").read_text(encoding="utf-8")
m = re.search(r'version:\s*"([^"]+)"', cfg)
if not m:
    sys.exit("Walang version sa config.js")
ver = m.group(1)
# src="../assets/js/x.js" o href="assets/css/y.css" (may luma mang ?v= o wala)
rx = re.compile(r'((?:src|href)=")((?:\.\./)*assets/[^"?#]+\.(?:js|css))(\?v=[^"]*)?(")')
changed = 0
for f in sorted(root.rglob("*.html")):
    if ".git" in f.parts or "android" in f.parts:
        continue
    s = f.read_text(encoding="utf-8")
    n = rx.sub(lambda g: g.group(1) + g.group(2) + "?v=" + ver + g.group(4), s)
    if n != s:
        f.write_text(n, encoding="utf-8"); changed += 1
print("version", ver, "·", changed, "file(s) updated")
