# TigoMeNote

Daily notes, photos at videos. Private sa device mo, i-share lang ang gusto mong makita ng iba.

**Live:** https://sensengutierrez.github.io/TigoMeNote/

## Features
- **Daily** – notes at photos ng araw mo (naka-save sa device)
- **Explore** – tingnan ang shinare ng ibang users
- **Share** – photo o video, isang tap
- **Messages** – chat, voice at stickers
- Plain white + dark mode, web at Android app

## Tech
- Front end: plain HTML, CSS, JavaScript (walang framework, walang build step)
- Hosting: GitHub Pages
- Back end: Supabase Edge Functions + Postgres

## Folders
| Folder | Laman |
|---|---|
| `/` | `index.html` (landing), `login.html` |
| `app/` | mga page pagka-login |
| `app/admin/` | admin-only pages |
| `assets/css/` | `tokens.css` (kulay), base, components, shell, `pages/` |
| `assets/js/` | `config.js` (URLs), `nav-items.js` (menu), `components/`, `pages/` |
| `backend/` | source copy ng bawat edge function |
| `sql/` | bawat table at SQL change, naka-number |
| `android/` | Android app (APK) |
| `docs/` | Brain vault export at build records |

## Quick edits
- **Menu** (sidebar, hamburger, bottom tabs): `assets/js/nav-items.js`
- **Kulay at fonts:** `assets/css/tokens.css`
- **Backend URLs:** `assets/js/config.js`

Walang secret sa repo na ito. Ang mga key ay nasa Supabase Secrets at GitHub Secrets lang.

© 2026 TigoMeNote. All rights reserved.
