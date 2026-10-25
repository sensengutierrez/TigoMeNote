"""TigoMeNote · tools/brand/logo.py — ang logo (Direction A: "Note na may mukha") bilang SVG.
   Isang lugar lang ng hugis; ginagamit ng tools/make-icons.py para sa web icons at Android icons.
   apps: main (TigoMeNote) · tigo (Tigo game) · chat (TigoMeNote Chat)."""

def face(cx, cy, s=1.0, ink="#1b1b1f", blush=False):
    e = (f'<ellipse cx="{cx-46*s}" cy="{cy}" rx="{15*s}" ry="{19*s}" fill="{ink}"/>'
         f'<ellipse cx="{cx+46*s}" cy="{cy}" rx="{15*s}" ry="{19*s}" fill="{ink}"/>'
         f'<circle cx="{cx-41*s}" cy="{cy-7*s}" r="{5*s}" fill="#fff"/><circle cx="{cx+51*s}" cy="{cy-7*s}" r="{5*s}" fill="#fff"/>'
         f'<path d="M{cx-24*s} {cy+36*s} Q{cx} {cy+58*s} {cx+24*s} {cy+36*s}" stroke="{ink}" stroke-width="{10*s}" fill="none" stroke-linecap="round"/>')
    if blush:
        e += (f'<ellipse cx="{cx-82*s}" cy="{cy+34*s}" rx="{17*s}" ry="{10*s}" fill="#ff8fa3" opacity=".75"/>'
              f'<ellipse cx="{cx+82*s}" cy="{cy+34*s}" rx="{17*s}" ry="{10*s}" fill="#ff8fa3" opacity=".75"/>')
    return e

def note(x, y, w, h, fold, fill, foldfill, r=36):
    return (f'<path d="M{x+r} {y} H{x+w-fold} L{x+w} {y+fold} V{y+h-r} Q{x+w} {y+h} {x+w-r} {y+h} H{x+r} Q{x} {y+h} {x} {y+h-r} V{y+r} Q{x} {y} {x+r} {y} Z" fill="{fill}"/>'
            f'<path d="M{x+w-fold} {y} V{y+fold-14} Q{x+w-fold} {y+fold} {x+w-fold+14} {y+fold} H{x+w} Z" fill="{foldfill}"/>')

STAR = '<path d="M392 70 l12 26 28 4 -20 20 5 28 -25-13 -25 13 5-28 -20-20 28-4z" fill="#fff" opacity=".95"/>'
BUBBLE = ('<path d="M150 112 H318 L382 176 V318 Q382 352 348 352 H232 L168 410 L176 352 H150 Q116 352 116 318 V146 Q116 112 150 112Z" fill="{fill}"/>'
          '<path d="M318 112 V162 Q318 176 332 176 H382Z" fill="{fold}"/>')
DOTS = '<circle cx="196" cy="236" r="20" fill="{ink}"/><circle cx="250" cy="236" r="20" fill="{ink}"/><circle cx="304" cy="236" r="20" fill="{ink}"/>'

# Kulay ng bawat app (background: kulay o gradient)
APPS = {
    "main": {"name": "TigoMeNote", "bg": ("#141418", "#141418"), "theme": "#141418"},
    "tigo": {"name": "Tigo", "bg": ("#ffb347", "#ff5a36"), "theme": "#ff6a3d"},
    "chat": {"name": "TigoMeNote Chat", "bg": ("#3dd6c0", "#2f9bff"), "theme": "#2fb8d8"},
}

def mark(app, mono=False):
    """Ang hugis lang (walang background), sa 512×512. mono = puting silhouette (notification badge / themed icon)."""
    if mono:
        # puti lang + butas (mask) para sa mukha → tama sa Android themed icon at notification badge
        shape = {"main": note(116, 108, 280, 300, 84, "#fff", "#fff"), "tigo": note(106, 118, 300, 290, 80, "#fff", "#fff"),
                 "chat": BUBBLE.format(fill="#fff", fold="#fff")}[app]
        holes = {"main": face(256, 262, 1, ink="#000"), "tigo": face(256, 266, 1.05, ink="#000"), "chat": DOTS.format(ink="#000")}[app]
        holes = holes.replace('fill="#fff"', 'fill="#000"')
        extra = STAR if app == "tigo" else ""
        return (f'<defs><mask id="m-{app}" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">{shape}{holes}</mask></defs>'
                f'<rect width="512" height="512" fill="#fff" mask="url(#m-{app})"/>{extra}')
    if app == "main":
        return note(116, 108, 280, 300, 84, "#ff6b4a", "#ffb199") + face(256, 262, 1)
    if app == "tigo":
        return note(106, 118, 300, 290, 80, "#fff6ec", "#ffd9c2") + face(256, 266, 1.05, blush=True) + STAR
    if app == "chat":
        return BUBBLE.format(fill="#fff", fold="#bfeee6") + DOTS.format(ink="#1b1b1f")
    raise KeyError(app)

def background(app, size=512, rx=None):
    a, b = APPS[app]["bg"]
    r = "" if rx is None else f' rx="{rx}"'
    return (f'<defs><linearGradient id="bg-{app}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs>'
            f'<rect width="{size}" height="{size}"{r} fill="url(#bg-{app})"/>')

def svg(body, size=512):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">{body}</svg>'

def scaled(body, k):
    """I-scale ang mark sa gitna (para sa safe zone ng maskable / adaptive icon)."""
    return f'<g transform="translate(256 256) scale({k}) translate(-256 -256)">{body}</g>'

def icon(app, rounded=True):          # buong icon (may background) — web, legacy launcher
    return svg(background(app, rx=112 if rounded else None) + mark(app))

def maskable(app, k=0.78):            # walang kanto; nasa safe zone ang mark
    return svg(background(app) + scaled(mark(app), k))

def fg(app, k=0.72):                  # Android adaptive: foreground lang (transparent)
    return svg(scaled(mark(app), k))

def mono(app, k=0.72):                # Android 13 themed icon / notification badge
    return svg(scaled(mark(app, mono=True), k))
