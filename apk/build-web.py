"""TigoMeNote · apk/build-web.py — kinokopya ang site papunta sa apk/<app>/www (laman ng APK)
   python3 apk/build-web.py main
   - Kasama: app/, assets/, legal/, login.html, manifest (walang sw.js: sa APK, native ang push at nasa phone na ang files)
   - index.html = apk/start.html (diretso sa Home o Login)
   - Isinisingit ang assets/js/app-mode.js sa bawat page (APK lang)."""
import os, re, shutil, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app = sys.argv[1] if len(sys.argv) > 1 else "main"
out = os.path.join(ROOT, "apk", app, "www")
shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
for d in ("app", "assets", "legal"):
    shutil.copytree(os.path.join(ROOT, d), os.path.join(out, d))
for f in ("login.html", "manifest.webmanifest"):
    shutil.copy(os.path.join(ROOT, f), out)
shutil.copy(os.path.join(ROOT, "apk", "start.html"), os.path.join(out, "index.html"))
ver = re.search(r'version:\s*"([^"]+)"', open(os.path.join(ROOT, "assets/js/config.js")).read()).group(1)
n = 0
for base, _, files in os.walk(out):
    for f in files:
        if not f.endswith(".html") or (base == out and f == "index.html"): continue
        p = os.path.join(base, f); s = open(p, encoding="utf-8").read()
        rel = os.path.relpath(os.path.join(out, "assets/js/app-mode.js"), base).replace(os.sep, "/")
        tag = f'<script src="{rel}?v={ver}"></script>'
        if "app-mode.js" in s: continue
        s = re.sub(r"(<meta name=\"viewport\"[^>]*>)", r"\1\n  " + tag, s, count=1) if 'name="viewport"' in s else s.replace("</head>", tag + "\n</head>", 1)
        open(p, "w", encoding="utf-8").write(s); n += 1
print(f"www ready: {out} · {n} pages · v{ver}")
