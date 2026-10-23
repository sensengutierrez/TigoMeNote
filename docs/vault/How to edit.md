---
tags: [guide]
updated: 2026-10-23
---
# How to edit

## Menu (sidebar, hamburger, bottom tabs)
File: `assets/js/nav-items.js` — isang beses lang i-edit, sabay-sabay nagbabago ang tatlo.
```js
{ id: "explore", label: "Explore", icon: "compass", href: "app/explore.html" },
```
- **Palitan ang pangalan:** baguhin ang `label`.
- **Alisin sa menu:** burahin ang linya.
- **Ilipat ang pwesto:** ilipat ang linya pataas/pababa.
- **Admin lang:** dagdagan ng `role: "Admin"`.
- **Bottom tabs ng phone:** ang listahan sa `tabs: [...]` (max 5).
- Ang `id` ay dapat kapareho ng `<body data-page="...">` ng page para ma-highlight.

## Icon
File: `assets/js/icons.js`. Magdagdag ng bagong key sa `PATHS` (24×24 SVG path), tapos gamitin sa menu (`icon: "bago"`) o sa page (`<i data-icon="bago"></i>`).

## Kulay at font
File: `assets/css/tokens.css`.
- `--accent` = isang highlight color (ngayon: orange `#ff5a36`)
- `--ink` = kulay ng main buttons
- Ang `:root[data-theme="dark"]` block = mga kulay sa dark mode

## Backend URL
File: `assets/js/config.js`, sa loob ng `fn: { ... }`. Walang page na may sariling URL.

## Bagong private page (hal. `app/notes.html`)
1. Kopyahin ang `app/settings.html` → palitan ang `data-page`, title, at ang dalawang huling `pages/...` links.
2. Gumawa ng `assets/css/pages/notes.css` at `assets/js/pages/notes.js`.
3. Idagdag sa `nav-items.js`.
4. Isulat sa [[Change log]] at [[System map]].

## Layout rule
- **Desktop/laptop = full UI/UX:** gamitin ang buong lapad (hindi makitid na card sa gitna). Gamitin ang `.layout` (main + side panel sa kanan) o `.layout.aside-left` (panel sa kaliwa), at `.layout-aside` para sa side panel.
- Desktop (≥ 900 px): isang screen lang, walang whole-page scroll; ang content box lang ang nag-i-scroll.
- Phone: normal na scroll.
- Laging i-check ang dark mode.

Tingnan din: [[System map]]
