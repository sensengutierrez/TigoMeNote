"""TigoMeNote · tools/brand/tigo2d.py — si Tigo sa 2D (para sa widgets at music player)
   Hugis: ang note ng logo (logo.py) + mukha + maliliit na braso at paa. Isang lugar lang ng drawing.
   frame(name) → SVG (512×512, transparent). Mga frame:
     idle, blink, wave, look            → Messages widget (kumukurap / kumakaway, parang flipbook)
     excited                            → Messages widget kapag may bagong message
     music1, music2, music3             → Music widget/player habang tumutugtog (naka-headphones, sumasabay)
     rest                               → Music widget/player kapag naka-pause (tulog, may headphones)
   Ginagamit ng tools/make-widget-art.py."""
from logo import note

CORAL, FOLD, INK, BLUSH = "#ff6b4a", "#ffb199", "#1b1b1f", "#ff8fa3"


def eyes(cx, cy, kind="open", dx=0):
    if kind == "closed":   # kurap / tulog: guhit
        return (f'<path d="M{cx-62+dx} {cy} q16 12 32 0" stroke="{INK}" stroke-width="9" fill="none" stroke-linecap="round"/>'
                f'<path d="M{cx+30+dx} {cy} q16 12 32 0" stroke="{INK}" stroke-width="9" fill="none" stroke-linecap="round"/>')
    if kind == "happy":    # ^ ^
        return (f'<path d="M{cx-62} {cy+6} q16 -20 32 0" stroke="{INK}" stroke-width="9" fill="none" stroke-linecap="round"/>'
                f'<path d="M{cx+30} {cy+6} q16 -20 32 0" stroke="{INK}" stroke-width="9" fill="none" stroke-linecap="round"/>')
    return (f'<ellipse cx="{cx-46+dx}" cy="{cy}" rx="15" ry="19" fill="{INK}"/><ellipse cx="{cx+46+dx}" cy="{cy}" rx="15" ry="19" fill="{INK}"/>'
            f'<circle cx="{cx-41+dx}" cy="{cy-7}" r="5" fill="#fff"/><circle cx="{cx+51+dx}" cy="{cy-7}" r="5" fill="#fff"/>')


def mouth(cx, cy, kind="smile"):
    if kind == "open":
        return f'<path d="M{cx-22} {cy+30} Q{cx} {cy+68} {cx+22} {cy+30} Z" fill="{INK}"/><path d="M{cx-12} {cy+50} Q{cx} {cy+60} {cx+12} {cy+50}" fill="#ff7b8f"/>'
    if kind == "o":
        return f'<ellipse cx="{cx}" cy="{cy+44}" rx="11" ry="13" fill="{INK}"/>'
    return f'<path d="M{cx-24} {cy+36} Q{cx} {cy+58} {cx+24} {cy+36}" stroke="{INK}" stroke-width="10" fill="none" stroke-linecap="round"/>'


def blush(cx, cy):
    return (f'<ellipse cx="{cx-84}" cy="{cy+34}" rx="18" ry="10" fill="{BLUSH}" opacity=".8"/>'
            f'<ellipse cx="{cx+84}" cy="{cy+34}" rx="18" ry="10" fill="{BLUSH}" opacity=".8"/>')


def arm(x, y, angle):
    return f'<g transform="translate({x} {y}) rotate({angle})"><rect x="-13" y="-6" width="26" height="74" rx="13" fill="{CORAL}"/><circle cx="0" cy="66" r="16" fill="{CORAL}"/></g>'


def feet():
    return f'<ellipse cx="206" cy="440" rx="40" ry="20" fill="#e2553a"/><ellipse cx="306" cy="440" rx="40" ry="20" fill="#e2553a"/>'


def headphones(tilt=0):
    return (f'<g transform="rotate({tilt} 256 270)">'
            f'<path d="M120 250 Q120 92 256 92 Q392 92 392 250" stroke="#2b2b33" stroke-width="22" fill="none" stroke-linecap="round"/>'
            f'<rect x="92" y="222" width="52" height="92" rx="22" fill="#2b2b33"/><rect x="368" y="222" width="52" height="92" rx="22" fill="#2b2b33"/>'
            f'<rect x="102" y="236" width="20" height="64" rx="10" fill="#3dd6c0"/><rect x="390" y="236" width="20" height="64" rx="10" fill="#3dd6c0"/></g>')


def notes_fx(phase):
    a = [(400, 120), (430, 70)] if phase == 1 else [(90, 120), (60, 70)] if phase == 2 else [(420, 90)]
    out = ""
    for x, y in a:
        out += (f'<g transform="translate({x} {y})"><ellipse cx="0" cy="22" rx="14" ry="11" fill="#7b5cff"/>'
                f'<rect x="10" y="-18" width="6" height="42" rx="3" fill="#7b5cff"/><path d="M16 -18 q18 6 18 20" stroke="#7b5cff" stroke-width="6" fill="none"/></g>')
    return out


def body(dy=0, tilt=0, l_arm=28, r_arm=-28, eye="open", eye_dx=0, mouth_k="smile", extra_front="", extra_back=""):
    cx, cy = 256, 268 + dy
    return (f'<g transform="rotate({tilt} 256 420)">{extra_back}'
            f'{arm(142, 318 + dy, l_arm)}{arm(370, 318 + dy, r_arm)}{feet()}'
            f'<g transform="translate(0 {dy})">{note(136, 130, 240, 290, 72, CORAL, FOLD, r=44)}</g>'
            f'{eyes(cx, cy, eye, eye_dx)}{blush(cx, cy)}{mouth(cx, cy, mouth_k)}{extra_front}</g>')


FRAMES = {
    "idle":    lambda: body(),
    "blink":   lambda: body(eye="closed"),
    "wave":    lambda: body(r_arm=-150, mouth_k="open"),
    "look":    lambda: body(eye_dx=12, dy=-4),
    "excited": lambda: body(dy=-14, l_arm=150, r_arm=-150, eye="happy", mouth_k="open"),
    "music1":  lambda: body(tilt=-6, eye="happy", extra_front=headphones(0) + notes_fx(1)),
    "music2":  lambda: body(tilt=6, dy=-6, eye="happy", mouth_k="open", extra_front=headphones(0) + notes_fx(2)),
    "music3":  lambda: body(tilt=0, dy=-10, eye="closed", extra_front=headphones(0) + notes_fx(3)),
    "rest":    lambda: body(eye="closed", mouth_k="o", extra_front=headphones(0) +
                            '<text x="380" y="120" font-family="Arial" font-weight="800" font-size="56" fill="#7b5cff">z</text>'
                            '<text x="420" y="80" font-family="Arial" font-weight="800" font-size="40" fill="#7b5cff">z</text>'),
}


def frame(name):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{FRAMES[name]()}</svg>'
