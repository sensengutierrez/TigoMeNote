"""TigoMeNote · apk/build-web.py — kinokopya ang site papunta sa apk/<app>/www (laman ng APK)
   python3 apk/build-web.py main
   - Kasama: app/, assets/, legal/, login.html, manifest (walang sw.js: sa APK, native ang push at nasa phone na ang files)
   - index.html = apk/start.html: opening animation ni Tigo, tapos unang page ng app (apk/<app>/app.json "home") o Login
   - Isinisingit ang assets/js/app-mode.js at app-update.js (auto-update) sa bawat page (APK lang)."""
import json, os, re, shutil, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app = sys.argv[1] if len(sys.argv) > 1 else "main"
out = os.path.join(ROOT, "apk", app, "www")
shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
for d in ("app", "assets", "legal"):
    shutil.copytree(os.path.join(ROOT, d), os.path.join(out, d))
for f in ("login.html", "manifest.webmanifest"):
    shutil.copy(os.path.join(ROOT, f), out)
meta = json.load(open(os.path.join(ROOT, "apk", app, "app.json")))   # {"id": "chat", "home": "app/messages.html"}
sys.path.insert(0, os.path.join(ROOT, "tools", "brand")); import logo   # ang logo para sa opening animation
mark = logo.mark(app)
for part in (logo.face(256, 262, 1), logo.face(256, 266, 1.05, blush=True), logo.DOTS.format(ink="#1b1b1f")):
    if part in mark: mark = mark.replace(part, '<g class="eyes">' + part + "</g>")
word = {"main": "Tigo<b>Me</b>Note", "chat": "TigoMeNote <b>Chat</b>", "tigo": "<b>Tigo</b>"}.get(app, "TigoMeNote")
start = (open(os.path.join(ROOT, "apk", "start.html")).read().replace("app/home.html", meta["home"])
         .replace("__BG__", meta.get("splash", "#141418")).replace("__MARK__", mark).replace("__WORD__", word))
open(os.path.join(out, "index.html"), "w").write(start)
ver = re.search(r'version:\s*"([^"]+)"', open(os.path.join(ROOT, "assets/js/config.js")).read()).group(1)
n = 0
for base, _, files in os.walk(out):
    for f in files:
        if not f.endswith(".html") or (base == out and f == "index.html"): continue
        p = os.path.join(base, f); s = open(p, encoding="utf-8").read()
        rel = os.path.relpath(os.path.join(out, "assets/js/app-mode.js"), base).replace(os.sep, "/")
        tag = f'<script src="{rel}?v={ver}&app={meta["id"]}"></script>'
        tag += "\n  " + f'<script src="{rel.replace("app-mode.js", "app-update.js")}?v={ver}" defer></script>'
        if "app-mode.js" in s: continue
        s = re.sub(r"(<meta name=\"viewport\"[^>]*>)", r"\1\n  " + tag, s, count=1) if 'name="viewport"' in s else s.replace("</head>", tag + "\n</head>", 1)
        open(p, "w", encoding="utf-8").write(s); n += 1
print(f"www ready: {out} · {n} pages · v{ver}")
