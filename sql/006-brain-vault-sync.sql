-- TigoMeNote · 006 · i-sync ang docs/vault/*.md sa brain_notes (pinapalitan ang lumang notes)
delete from public.brain_notes where title in ('What''s new log','How it was built: Foundation');
insert into public.brain_notes (title, body, tags, updated_by) values
('00 Home', $md$---
tags: [home]
updated: 2026-10-23
---
# TigoMeNote Brain

Ito ang "utak" ng project: lahat ng ginawa, paano ginawa, at bakit. Buksan ang folder na `docs/vault` sa **Obsidian** (Open folder as vault) para ma-click ang mga [[link]].

## Simula dito
- [[System map]] — lahat ng pages, files, functions at tables sa isang tingin
- [[How to edit]] — saan babaguhin ang menu, kulay, URL, at paano magdagdag ng page
- [[Change log]] — bawat edit: ano, bakit, saang file, paano gumagana
- [[Fix log]] — bawat bug: problema → sanhi → ayos
- [[Decisions]] — mga napagdesisyunan at bakit

## Build records (isang note bawat feature)
- [[Build - Foundation]] — database, login back end, app shell
- [[Build - Login page]] — sign in / create account na may panel swap animation

## Setup
- [[Supabase setup]] — project, tables, secrets (walang totoong value dito)
- [[GitHub and deploy]] — repo, Pages, paano mag-update

## Status
| Step | Ano | Status |
|---|---|---|
| 1 | Project + database | ✅ |
| 2 | Auth back end (auth-fast) | ✅ deployed, hinihintay ang test ni Bench |
| 3 | Front-end shell | ✅ live |
| 4 | Brain vault | 🟡 md files + DB; brain.html sa web, susunod |
| 5 | Messaging | ⏳ |
| 6 | Profile + approval | ⏳ |
| 7 | Daily / Explore / Share (ang idea) | ⏳ hinihintay ang sagot sa media plan |
| 8 | Android APK | ⏳ |
$md$, '{home}', 'claude'),
('Build - Foundation', $md$---
tags: [build]
updated: 2026-10-23
---
# Build - Foundation (database + login + app shell)

**What it does:** Accounts, login/logout, at ang layout ng lahat ng app pages (menu, dark mode).

**Pages:** `index.html`, `login.html`, `app/*.html`
**Shared code:** `config.js`, `theme.js`, `auth-guard.js`, `api.js`, `icons.js`, `nav-items.js`, `components/app-shell.js`

**Edge function:** `auth-fast`
| Action | Sino pwede | Method |
|---|---|---|
| register | kahit sino | POST |
| login | kahit sino | POST |
| checkSession | may token | GET/POST |
| logout | may token | GET/POST |

**Tables:** `users` (username unique lowercase; role Admin/User; status Active/Pending/Inactive), `sessions` (token_hash, expires_at 24 h), `write_action_dedup` (rate limit). Lahat: RLS on, grant sa `service_role` lang.

**Browser storage:** `tmnToken`, `tmnUser`, `tmnCheckedAt` (60 s cache ng session check), `tmnTheme`.

**HTML/CSS/JS notes:**
- Walang framework, walang build step.
- Fonts: Bricolage Grotesque (headings) + Inter (text), galing Google Fonts.
- Kulay: puti (`#ffffff`), ink `#121212`, isang accent na orange `#ff5a36`. Dark: `#0e0e10`.
- Desktop ≥ 900 px: sidebar 248 px + content box na may sariling scroll. Phone: sticky topbar, hamburger drawer, bottom tabs na may malaking "+" sa gitna.
- Icons sa page: `<i data-icon="camera"></i>`, pinapalitan ng `app-shell.js` ng SVG.

**How to rebuild (order):**
1. SQL `001` → `004` sa SQL editor.
2. Secret `AUTH_PEPPER` (mahabang random text; **huwag nang palitan**).
3. Deploy `backend/auth-fast.ts` bilang `auth-fast`, verify_jwt **off**.
4. I-upload ang files sa GitHub, i-on ang Pages (`main` / root).

**Known limits / hindi pa na-test:**
- Hindi pa na-test ang totoong login sa Supabase (hindi abot ng sandbox).
- Placeholder pa ang Explore, Share at Messages.
- Wala pang "change password" at "edit profile".

Tingnan din: [[System map]], [[Supabase setup]], [[Change log]]
$md$, '{build}', 'claude'),
('Build - Login page', $md$---
tags: [build]
updated: 2026-10-23
---
# Build - Login page (panel swap animation)

**What it does:** Sign in at Create account sa iisang page. Sa desktop, nagpapalit ng puwesto ang dark art panel at ang form na may smooth na slide.

**Files:** `login.html` (ROOT), `assets/css/pages/auth.css`, `assets/js/pages/login.js`
**Gumagamit ng:** `api.js` → `auth-fast` (login / register)

## Paano gumagana ang swap
1. Pag pinindot ang tab, ang `setMode()` sa `login.js` ay naglalagay/nagtatanggal ng class na **`is-register`** sa `<body>`.
2. Sa `auth.css` (desktop), parehong `position: absolute` ang art panel at ang form:
   - Sign in: art `left: 0`, form `left: 44%`
   - `.is-register`: art `left: 56%`, form `left: 0`
   - May `transition: left .8s` kaya dumudulas sila.
3. Habang dumudulas, ang form ay nag-`swap-out` (fade + kaunting baba). Pagkalipas ng 260 ms, pinapalitan ng `fill()` ang laman (title, buttons, display name field), tapos fade-in ulit.
4. Ang tab na "pill" ay `::before` ng `.auth-tabs` na gumagalaw gamit ang `transform`.

## Background
- **Blobs:** 3 malabong bilog (orange, violet, blue) na dahan-dahang gumagalaw (`@keyframes drift1–3`). Sa register, nagiging green at orange.
- **Grain:** maliit na SVG noise sa ibabaw para hindi "flat".
- **Tiles:** 4 na kulay-kahon na lumulutang (`@keyframes bob`) at nagpapalit ng ayos sa register.
- **Form side:** tuldok-tuldok na pattern + kaunting accent glow sa kanang itaas (`.auth-main::before`).

## Iba pang detalye
- Sa unang load, may class na `no-anim` para walang slide kahit `?mode=register` ang link. Tinatanggal pagkatapos ng unang frame.
- Phone (< 900 px): walang art panel; form lang ang may fade.
- Username: auto-lowercase at letters/numbers/_/. lang.
- Password strength bar (4 na bars) sa Create account.
- `next=` sa URL: babalik sa page na binuksan bago mag-login (same site lang, para walang open redirect).
- Kung naka-on ang "reduce motion" sa device, walang animation (`base.css`).

## Paano baguhin
- **Bilis ng slide:** `.8s` sa `transition: left` sa `auth.css`.
- **Lapad ng art panel:** `--art-w: 44%`.
- **Text ng quote:** `.q-login` at `.q-register` sa `login.html`.
- **Kulay ng blobs:** `.b1`, `.b2`, `.b3` (at `.is-register .b1/.b2`).

Tingnan din: [[Build - Foundation]], [[Change log]]
$md$, '{build}', 'claude'),
('Change log', $md$---
tags: [log]
updated: 2026-10-23
---
# Change log

Bawat edit: **Ano** ang ginawa, **Bakit**, **Files**, at **Paano gumagana**. Pinakabago sa ibaba.

---

## 2026-10-23 · #1 Bagong Supabase project at database
- **Ano:** Gumawa ng project `tigomenote` (region ap-south-1, Mumbai) sa account na sensengutierrez. Apat na table: `users`, `sessions`, `write_action_dedup`, `brain_notes`.
- **Bakit:** Hiwalay sa Lalabella para hindi maghati sa 1 GB storage at hindi madamay kung may problema ang isa.
- **Files:** `sql/001-users.sql` hanggang `sql/004-brain-notes.sql`
- **Paano:** Naka-**RLS on** ang lahat at walang policy, kaya ang server (service_role) lang ang nakakabasa. Hindi direktang makakapasok ang browser sa database; dadaan lahat sa edge function.

## 2026-10-23 · #2 Login back end: `auth-fast`
- **Ano:** Edge function na may 4 actions: `register`, `login`, `checkSession`, `logout`.
- **Bakit:** Sariling login (hindi Supabase Auth) gaya ng Lalabella, para isang account lang sa buong site.
- **Files:** `backend/auth-fast.ts` (source copy), deployed sa Supabase na `verify_jwt` off.
- **Paano:**
  - Password → PBKDF2-SHA256 (120,000 ulit) + sariling salt bawat user + **AUTH_PEPPER** secret. Hindi nase-save ang totoong password.
  - Login token = 32 random bytes. SHA-256 **hash** lang ang nasa `sessions`, kaya kahit manakaw ang database hindi magagamit ang tokens. 24 oras ang buhay.
  - 5 maling password → naka-lock ng 30 minuto. Max 30 maling login bawat IP sa 10 minuto; max 5 sign-up bawat IP sa 1 oras.
  - Unang nag-register = **Admin**. Kapag `REQUIRE_APPROVAL=true`, ang mga susunod ay "Pending" hanggang i-approve.

## 2026-10-23 · #3 Front-end shell
- **Ano:** `index.html` (landing), `login.html`, at 6 na app pages: Daily, Explore, Share, Messages, Profile, Settings.
- **Bakit:** Pundasyon muna bago ang mga feature; naka-folder para hindi spaghetti.
- **Files:** tingnan ang [[System map]].
- **Paano:**
  - Ang menu ay **hindi** naka-copy sa bawat page. Ang `app-shell.js` ang bumubuo ng sidebar (desktop), topbar + hamburger + bottom tabs (phone) mula sa `nav-items.js`.
  - Ang `auth-guard.js` ay nagtatago ng page (`visibility:hidden`) hanggang ma-check ang token. Kapag walang token → `login.html?next=...` para bumalik sa tamang page pagka-login.
  - Dark mode: `theme.js` naglalagay ng `data-theme="dark"` sa `<html>`; ang `tokens.css` ang may pangalawang set ng kulay. Naka-save sa browser (`tmnTheme`).
  - "Keep me signed in": naka-check = `localStorage` (natitira kahit isara ang browser); hindi = `sessionStorage` (nawawala pag sinara).

## 2026-10-23 · #4 README at .gitignore
- **Ano:** `README.md` (Taglish, folder map) at `.gitignore`.
- **Bakit:** Para maintindihan agad ang repo, at para hindi aksidenteng ma-upload ang secrets (`.env`, Android keystore).
- **Files:** `README.md`, `.gitignore` (ROOT)

## 2026-10-23 · #5 Login page: panel swap animation
- **Ano:** Pag pinindot ang Create account, dumudulas ang dark art panel pakanan at ang form pakaliwa (baliktad pag Sign in). Gumagalaw na kulay sa likod, nagbabagong quote, lumulutang na tiles, sliding pill sa tabs, fade ng form.
- **Bakit:** Hiling ni Bench — mas magandang background at UI na "nagbabaliktaran".
- **Files:** `login.html`, `assets/css/pages/auth.css`, `assets/js/pages/login.js`
- **Paano:** tingnan ang [[Build - Login page]].

## 2026-10-23 · #6 Brain vault bilang .md files
- **Ano:** Itong folder na `docs/vault/` — Obsidian-compatible notes na may `[[links]]`. Kapareho rin ang laman sa table na `brain_notes`.
- **Bakit:** Para may record si Bench ng lahat ng ginawa, paano, at bakit, na mabubuksan sa Obsidian (PC) o sa GitHub (browser).
- **Files:** `docs/vault/*.md`
$md$, '{log}', 'claude'),
('Decisions', $md$---
tags: [decision]
updated: 2026-10-23
---
# Decisions

| Petsa | Desisyon | Bakit |
|---|---|---|
| 2026-10-23 | Pangalan: **TigoMeNote** | Pinili ni Bench |
| 2026-10-23 | Tema: **plain white + dark mode** setting | Pinili ni Bench |
| 2026-10-23 | Hosting: **GitHub Pages** muna (`sensengutierrez.github.io/TigoMeNote/`) | Libre; custom domain mamaya |
| 2026-10-23 | **Hiwalay na Supabase account at project** (sensengutierrez) | Hindi maghahati sa free-plan limits ng Lalabella |
| 2026-10-23 | **Public repo**, No license | Libre ang Pages sa public; "no license" = all rights reserved. Walang secret sa code. |
| 2026-10-23 | GitHub Desktop para sa updates | Kasama ang dotfiles, kita ang binago bago i-push |
| 2026-10-23 | Unang nag-register = Admin | Si Bench dapat ang mauna |

## Bukas pa (hinihintay si Bench)
- **Media plan:** Daily = sa device lang (sariling folder sa app); Share = maliit na compressed copy sa server para makita ng iba. Okay ba?
- **Max na haba ng video** sa Share (hal. 15 s?)
- **Approval:** auto-active ang bagong users, o kailangan i-approve? (`REQUIRE_APPROVAL`)

Tingnan din: [[Build - Foundation]]
$md$, '{decision}', 'claude'),
('Fix log', $md$---
tags: [log]
updated: 2026-10-23
---
# Fix log

Format: **PROBLEMA → SANHI → AYOS (file)**. Pinakabago sa ibaba.

- 2026-10-23 · Explore: ang "Explore opens soon" card ay napupunta sa ilalim ng screen sa desktop → naka-center sa buong taas ng grid (`top: 50%`), mas mahaba ang grid kaysa screen → inilagay sa `top: 96px` (`assets/css/pages/explore.css`)
- 2026-10-23 · auth-fast unang deploy ay placeholder lang → maling laman ang naipasa sa unang deploy → ni-deploy ulit ang buong code (version 2) at kinumpara sa `backend/auth-fast.ts`
- 2026-10-23 · Login: kapag diretsong binuksan ang `?mode=register`, dumudulas ang panels sa unang load → may CSS transition kahit unang render → `no-anim` class sa `<body>` na tinatanggal pagkatapos ng unang frame (`login.html`, `login.js`, `auth.css`)

Hindi bug (para hindi na hanapin ulit):
- GitHub Desktop: "This file uses LF line endings… CRLF" → normal sa Windows, walang epekto sa site.
- GitHub Desktop: naka-yellow (modified) ang mga file na pareho naman ang laman → line endings lang.
$md$, '{log}', 'claude'),
('GitHub and deploy', $md$---
tags: [setup]
updated: 2026-10-23
---
# GitHub and deploy

**Repo:** `github.com/sensengutierrez/TigoMeNote` (public)
**Site:** `https://sensengutierrez.github.io/TigoMeNote/`
**Pages:** Deploy from a branch → `main` → `/ (root)`
**Local folder:** `Documents\GitHub\TigoMeNote` (GitHub Desktop)

## Paano mag-update
1. I-extract ang zip mula kay Claude sa `Documents\GitHub\TigoMeNote` → Replace.
2. GitHub Desktop: i-type ang Summary (required) → **Commit to main** → **Push origin**.
3. Hintayin ang 1–2 minuto → **Ctrl+F5** sa site.

## Tandaan
- Isang GitHub.com account lang ang naka-sign in sa GitHub Desktop. Para sa Lalabella, mag-switch o gawing collaborator ang isang account.
- Hindi naa-upload ng GitHub ang walang-lamang folder (kaya may `.gitkeep`).
- Ang `.nojekyll` ay para hindi galawin ng GitHub ang files.
- Ang LF/CRLF warning sa GitHub Desktop ay normal.

Tingnan din: [[Fix log]], [[Decisions]]
$md$, '{setup}', 'claude'),
('How to edit', $md$---
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
- Desktop (≥ 900 px): isang screen lang, walang whole-page scroll; ang content box lang ang nag-i-scroll.
- Phone: normal na scroll.
- Laging i-check ang dark mode.

Tingnan din: [[System map]]
$md$, '{guide}', 'claude'),
('Supabase setup', $md$---
tags: [setup]
updated: 2026-10-23
---
# Supabase setup

**Account:** sensengutierrez (hiwalay sa Lalabella)
**Project:** `tigomenote` · ref `njwtfoimkorkcysxvrqb` · region ap-south-1 (Mumbai) · free plan
**URL:** `https://njwtfoimkorkcysxvrqb.supabase.co` (nasa `assets/js/config.js`)

## Secrets (Edge Functions → Secrets)
| Name | Para saan | Note |
|---|---|---|
| `AUTH_PEPPER` | dagdag sa password hash | **Required. Huwag palitan** — mawawalan ng access ang lahat ng account. |
| `REQUIRE_APPROVAL` | `"true"` = Pending ang bagong users | Optional |

> Walang totoong value ng secret dito, at hindi dapat ilagay kailanman.

## Edge functions
| Name | verify_jwt | Source |
|---|---|---|
| `auth-fast` | off | `backend/auth-fast.ts` |

## Rules
- Bawat bagong table: `enable row level security` + `grant select, insert, update, delete ... to service_role`.
- Bawat SQL na pinatakbo ay may file sa `sql/` (naka-number).
- Bawat function ay may source copy sa `backend/`.

## Free plan limits
1 GB storage · 500 MB database · 5 GB bandwidth/buwan · walang automatic backup. Planuhin ang weekly backup bago dumami ang users.

## Connector (Claude)
Isang Supabase account lang ang naka-connect kay Claude sa isang pagkakataon. Kapag kailangan ang Lalabella, i-reconnect sa Lalabella account at sabihin kay Claude.

Tingnan din: [[Build - Foundation]]
$md$, '{setup}', 'claude'),
('System map', $md$---
tags: [system]
updated: 2026-10-23
---
# System map

## Pages
| File | Folder | Ano | Login? |
|---|---|---|---|
| `index.html` | ROOT | Landing page | hindi |
| `login.html` | ROOT | Sign in / Create account | hindi |
| `home.html` | app/ | Daily | oo |
| `explore.html` | app/ | Explore (placeholder) | oo |
| `share.html` | app/ | Share (placeholder) | oo |
| `messages.html` | app/ | Messages (placeholder) | oo |
| `profile.html` | app/ | Profile | oo |
| `settings.html` | app/ | Theme + logout | oo |
| (wala pa) | app/admin/ | Admin pages | Admin lang |

## Shared code — `assets/js/`
| File | Trabaho |
|---|---|
| `config.js` | **Lahat ng backend URL** at storage keys (`TMN_CONFIG`) |
| `theme.js` | Light / Dark / Auto; nilalagay sa `<head>` para walang flash |
| `auth-guard.js` | Bantay ng private pages; redirect sa login kung walang session |
| `api.js` | `TMN_API.call(fn, action, data)` — isang paraan ng pagtawag sa server |
| `icons.js` | Lahat ng SVG icons (`TMN_ICON("sun")`) |
| `nav-items.js` | **Ang menu** (sidebar, hamburger, bottom tabs) |
| `components/app-shell.js` | Gumagawa ng layout ng app pages mula sa nav-items |
| `pages/<page>.js` | Code ng isang page lang |

## Styles — `assets/css/`
| File | Trabaho |
|---|---|
| `tokens.css` | **Lahat ng kulay, font, radius, shadow** (light + dark) |
| `base.css` | Reset at typography |
| `components.css` | Buttons, inputs, cards, badges, toast, segmented |
| `shell.css` | Layout: sidebar, topbar, drawer, tabs |
| `pages/<page>.css` | Style ng isang page lang |

## Back end (Supabase project `tigomenote`)
| Function | Actions | Source |
|---|---|---|
| `auth-fast` | register, login, checkSession, logout | `backend/auth-fast.ts` |

| Table | Para saan | SQL |
|---|---|---|
| `users` | accounts | `sql/001-users.sql` |
| `sessions` | login tokens (hash lang) | `sql/002-sessions.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
| `brain_notes` | kopya ng vault na ito sa database | `sql/004-brain-notes.sql` |

## Paano dumadaloy ang isang private page
1. `theme.js` → kulay agad
2. `config.js` → URLs
3. `auth-guard.js` → tago muna ang page, check ng token (cache 60 s)
4. Page HTML (`<main id="page">`)
5. `icons.js` → `nav-items.js` → `app-shell.js` (bumubuo ng menu sa paligid ng page)
6. `pages/<page>.js`

Tingnan din: [[How to edit]], [[Build - Foundation]]
$md$, '{system}', 'claude')
on conflict (lower(title)) do update set body = excluded.body, tags = excluded.tags, updated_by = excluded.updated_by, updated_at = now();
