"""TigoMeNote · tools/make-widget-art.py — si Tigo (2D) para sa widgets at music player
   python3 tools/make-widget-art.py   (kailangan: Playwright + Chromium)
   Android: apk/native/res/drawable-nodpi/tmn_tigo_<frame>.png (256 px, transparent) — kinokopya ng patch-android.py
   Web:     assets/img/tigo2d/<frame>.svg (music player sa app)
   Hugis at mga frame: tools/brand/tigo2d.py"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "brand"))
import tigo2d
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
AND = os.path.join(ROOT, "apk/native/res/drawable-nodpi"); WEB = os.path.join(ROOT, "assets/img/tigo2d")
os.makedirs(AND, exist_ok=True); os.makedirs(WEB, exist_ok=True)
S = 256
with sync_playwright() as pw:
    b = pw.chromium.launch(); p = b.new_page(viewport={"width": S, "height": S})
    for n in tigo2d.FRAMES:
        svg = tigo2d.frame(n)
        open(os.path.join(WEB, n + ".svg"), "w").write(svg)
        p.set_content(f'<html><body style="margin:0;background:transparent">{svg.replace("width=\"512\" height=\"512\"", f"width=\"{S}\" height=\"{S}\" style=\"display:block\"")}</body></html>')
        p.screenshot(path=os.path.join(AND, f"tmn_tigo_{n}.png"), omit_background=True, clip={"x": 0, "y": 0, "width": S, "height": S})
    b.close()
print("ok:", ", ".join(tigo2d.FRAMES))
