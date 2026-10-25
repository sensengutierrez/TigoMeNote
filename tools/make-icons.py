"""TigoMeNote · tools/make-icons.py — gumagawa ng lahat ng icon mula sa tools/brand/logo.py
   python3 tools/make-icons.py   (kailangan: Playwright + Chromium)
   Web:     assets/img/ (icon-192/512, maskable, apple-touch-icon, badge-72, favicon.svg)
   Android: apk/res/<app>/ (mipmap launcher + adaptive + monochrome, notification icon, splash) — kinokopya ng CI sa android project."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "brand"))
import logo
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DENS = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}

def render(page, svg, size, path, transparent=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    page.set_viewport_size({"width": size, "height": size})
    page.set_content(f'<html><body style="margin:0;background:transparent">{svg.replace("<svg ", f"<svg style=\'display:block;width:{size}px;height:{size}px\' ", 1)}</body></html>')
    page.screenshot(path=path, omit_background=transparent, clip={"x": 0, "y": 0, "width": size, "height": size})

def splash(app):
    # gitnang logo sa kulay ng app (2732×2732, center-crop ng Android)
    return logo.svg(logo.background(app, size=2732) + f'<g transform="translate(1366 1366) scale(2.6) translate(-256 -256)">{logo.mark(app)}</g>', size=2732)

with sync_playwright() as pw:
    br = pw.chromium.launch(); pg = br.new_page()
    img = os.path.join(ROOT, "assets/img")
    render(pg, logo.icon("main"), 192, f"{img}/icon-192.png", True)
    render(pg, logo.icon("main"), 512, f"{img}/icon-512.png", True)
    render(pg, logo.maskable("main"), 512, f"{img}/icon-maskable-512.png")
    render(pg, logo.svg(logo.background("main") + logo.scaled(logo.mark("main"), 0.86)), 180, f"{img}/apple-touch-icon.png")
    render(pg, logo.mono("main", 0.9), 72, f"{img}/badge-72.png", True)
    open(f"{img}/favicon.svg", "w").write(logo.icon("main"))
    for app in logo.APPS:
        res = os.path.join(ROOT, "apk/res", app)
        for d, k in DENS.items():
            render(pg, logo.icon(app), int(48 * k), f"{res}/mipmap-{d}/ic_launcher.png", True)
            render(pg, logo.svg(f'<defs><clipPath id="c"><circle cx="256" cy="256" r="256"/></clipPath></defs><g clip-path="url(#c)">{logo.background(app)}{logo.scaled(logo.mark(app), 0.8)}</g>'), int(48 * k), f"{res}/mipmap-{d}/ic_launcher_round.png", True)
            render(pg, logo.fg(app), int(108 * k), f"{res}/mipmap-{d}/ic_launcher_foreground.png", True)
            render(pg, logo.svg(logo.background(app)), int(108 * k), f"{res}/mipmap-{d}/ic_launcher_background.png")
            render(pg, logo.mono(app), int(108 * k), f"{res}/mipmap-{d}/ic_launcher_monochrome.png", True)
            render(pg, logo.mono(app, 0.95), int(24 * k), f"{res}/drawable-{d}/ic_stat_tigo.png", True)
        os.makedirs(f"{res}/mipmap-anydpi-v26", exist_ok=True)
        xml = ('<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
               '    <background android:drawable="@mipmap/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
               '    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>\n</adaptive-icon>\n')
        for n in ("ic_launcher", "ic_launcher_round"): open(f"{res}/mipmap-anydpi-v26/{n}.xml", "w").write(xml)
        render(pg, splash(app), 1280, f"{res}/drawable/splash.png")
        render(pg, logo.icon(app), 512, f"{res}/store-icon-512.png", True)
    br.close()
print("icons ok")
