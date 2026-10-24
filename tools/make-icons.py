#!/usr/bin/env python3
"""TigoMeNote · tools/make-icons.py
Isang trabaho lang: gumawa ng app icons (PWA / Add to Home Screen / notifications) sa assets/img/.
Gamit: python3 tools/make-icons.py   (kailangan ng Pillow)"""
import pathlib
from PIL import Image, ImageDraw, ImageFont

root = pathlib.Path(__file__).resolve().parent.parent
out = root / "assets" / "img"; out.mkdir(parents=True, exist_ok=True)
FONT = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
INK, ACCENT = (17, 17, 17, 255), (255, 90, 54, 255)

def mark(size, pad_ratio, bg_full=False):
    s = size * 4  # gumuhit nang malaki tapos paliitin (makinis)
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = int(s * pad_ratio)
    if bg_full: d.rectangle([0, 0, s, s], fill=INK)
    else: d.rounded_rectangle([pad, pad, s - pad, s - pad], radius=int((s - 2 * pad) * 0.24), fill=INK)
    inner = s - 2 * pad
    f = ImageFont.truetype(FONT, int(inner * 0.62))
    box = d.textbbox((0, 0), "T", font=f)
    w, h = box[2] - box[0], box[3] - box[1]
    d.text(((s - w) / 2 - box[0], (s - h) / 2 - box[1] + inner * 0.02), "T", font=f, fill=(255, 255, 255, 255))
    r = inner * 0.075; cx = s - pad - inner * 0.2; cy = pad + inner * 0.2
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ACCENT)
    return im.resize((size, size), Image.LANCZOS)

mark(192, 0.0).save(out / "icon-192.png")
mark(512, 0.0).save(out / "icon-512.png")
mark(512, 0.1, bg_full=True).save(out / "icon-maskable-512.png")
mark(180, 0.0, bg_full=True).save(out / "apple-touch-icon.png")
# Badge (Android status bar): puting hugis sa transparent
b = Image.new("RGBA", (288, 288), (0, 0, 0, 0)); d = ImageDraw.Draw(b)
f = ImageFont.truetype(FONT, 230); box = d.textbbox((0, 0), "T", font=f)
d.text(((288 - (box[2] - box[0])) / 2 - box[0], (288 - (box[3] - box[1])) / 2 - box[1]), "T", font=f, fill=(255, 255, 255, 255))
b.resize((72, 72), Image.LANCZOS).save(out / "badge-72.png")
print("icons ok")
