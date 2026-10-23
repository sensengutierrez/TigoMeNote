-- TigoMeNote · 008 · vault sync: email verification
insert into public.brain_notes (title, body, tags, updated_by) values ('Build - Email verification', $md$---
tags: [build]
updated: 2026-10-23
---
# Build - Email verification

**What it does:** Required ang email sa Create account. Nagpapadala ang server ng **6-digit code** sa Gmail ng user; hindi makakapasok hangga't hindi na-verify. Pagka-verify, auto-login na.

**Files:** `login.html`, `assets/css/pages/auth.css`, `assets/js/pages/login.js`, `assets/js/icons.js` (mail icon)
**Edge function:** `auth-fast` (actions `register`, `login`, `verifyEmail`, `resendCode`)
**Tables:** `users.email`, `users.email_verified_at`, status `Unverified`; bagong table `email_codes` — `sql/007-email-verify.sql`
**Secrets:** `SMTP_USER` (Gmail address), `SMTP_PASS` (Gmail App Password)

## Daloy
1. **Create account** → `register` gumagawa ng user na `status = Unverified`, gumagawa ng code, at nagpapadala ng email.
2. Lalabas ang **Check your email** screen (6 boxes).
3. **Verify** → `verifyEmail`: kung tama, `status = Active` (o `Pending` kung `REQUIRE_APPROVAL`), `email_verified_at = now`, at bibigyan ng session token.
4. Kung nag-Sign in ang hindi pa verified (tama ang password), babalik sa verify screen at magpapadala ng bagong code kung lumipas na ang 60 s.

## Rules (nasa taas ng `auth-fast.ts`)
| Rule | Value |
|---|---|
| Buhay ng code | 15 minuto |
| Maling hula bawat code | 5 |
| Hintay bago mag-resend | 60 segundo |
| Max codes bawat user bawat oras | 5 |
| Maling code bawat IP sa 10 min | 30 |
| Binubura ang hindi na-verify na account | pagkalipas ng 24 oras |

## Security
- Hash lang ng code ang naka-save: `SHA-256(code + user id + AUTH_PEPPER)`.
- Bawat bagong code ay pumapatay sa luma.
- Ang `resendCode` ay pareho ang sagot kahit walang account, para hindi mahulaan ang usernames.
- Email masked sa screen (`be••••@gmail.com`).

## Email sending (Gmail)
- Library: `nodemailer` sa edge function, `smtp.gmail.com` port **465** (SSL). Bawal ang port 25/587 sa Supabase Edge.
- Kailangan naka-**2-Step Verification** ang Gmail para makagawa ng **App Password** (16 letters).
- Limit ng Gmail: ~500 emails bawat araw. Pag lumaki, lilipat sa Resend + sariling domain.
- Ang email ay galing sa Gmail address mismo, pangalan "TigoMeNote".

## Front end details
- Sign in: pwedeng **username o email** (walang `@` sa harap ng field).
- Code boxes: auto-next, backspace pabalik, arrow keys, **paste ng buong code** (kahit may space/dash), auto-submit pag kumpleto, shake pag mali.
- "Resend code (60s)" countdown.
- Naaalala ang verify screen kahit i-refresh (`sessionStorage` key `tmnVerify`).
- "Back to sign in" para bumalik.

## How to rebuild
1. `sql/007-email-verify.sql`
2. Secrets `SMTP_USER`, `SMTP_PASS`
3. Deploy `backend/auth-fast.ts`
4. Upload ng 4 na front-end files

## Known limits / hindi pa na-test
- Hindi pa na-test ang totoong pagpapadala ng Gmail mula sa Supabase (hindi abot ng sandbox).
- Wala pang "Forgot password" (handa na ang `email_codes.purpose = 'reset'`).
- Wala pang "palitan ang email" sa Settings.

Tingnan din: [[Build - Login page]], [[Supabase setup]], [[Change log]]
$md$, '{build}', 'claude')
on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
update public.brain_notes set body = $md$---
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
- [[Build - Email verification]] — 6-digit code sa Gmail bago makapasok

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
$md$, updated_at = now(), updated_by = 'claude' where lower(title) = lower('00 Home');
update public.brain_notes set body = $md$---
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

## 2026-10-23 · #7 Email verification (6-digit code)
- **Ano:** Required na ang email sa Create account. Nagpapadala ng 6-digit code sa Gmail; hindi makakapasok hangga't hindi na-verify. Pwede nang mag-Sign in gamit ang email o username.
- **Bakit:** Hiling ni Bench. Para totoong tao ang users at magamit ang email sa "Forgot password" mamaya.
- **Files:** `sql/007-email-verify.sql`, `backend/auth-fast.ts` (deployed), `login.html`, `assets/css/pages/auth.css`, `assets/js/pages/login.js`, `assets/js/icons.js`
- **Paano:** Bagong status na `Unverified` at table na `email_codes` (hash lang ng code). Bagong actions na `verifyEmail` at `resendCode`. Gmail SMTP port 465 gamit ang nodemailer. Buong detalye: [[Build - Email verification]].
$md$, updated_at = now(), updated_by = 'claude' where lower(title) = lower('Change log');
update public.brain_notes set body = $md$---
tags: [log]
updated: 2026-10-23
---
# Fix log

Format: **PROBLEMA → SANHI → AYOS (file)**. Pinakabago sa ibaba.

- 2026-10-23 · Explore: ang "Explore opens soon" card ay napupunta sa ilalim ng screen sa desktop → naka-center sa buong taas ng grid (`top: 50%`), mas mahaba ang grid kaysa screen → inilagay sa `top: 96px` (`assets/css/pages/explore.css`)
- 2026-10-23 · auth-fast unang deploy ay placeholder lang → maling laman ang naipasa sa unang deploy → ni-deploy ulit ang buong code (version 2) at kinumpara sa `backend/auth-fast.ts`
- 2026-10-23 · Login: kapag diretsong binuksan ang `?mode=register`, dumudulas ang panels sa unang load → may CSS transition kahit unang render → `no-anim` class sa `<body>` na tinatanggal pagkatapos ng unang frame (`login.html`, `login.js`, `auth.css`)
- 2026-10-23 · Verify screen sa phone: nahahati sa gitna ang email ("gmai / l.com") → `word-break: break-all` → `white-space: nowrap` (`assets/css/pages/auth.css`)

Hindi bug (para hindi na hanapin ulit):
- GitHub Desktop: "This file uses LF line endings… CRLF" → normal sa Windows, walang epekto sa site.
- Sign in field: hindi na tinatanggal ang simbolo (hal. `@`) kasi pwede na ang email doon. Sa Create account lang strict ang username.
- GitHub Desktop: naka-yellow (modified) ang mga file na pareho naman ang laman → line endings lang.
$md$, updated_at = now(), updated_by = 'claude' where lower(title) = lower('Fix log');
update public.brain_notes set body = $md$---
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
| 2026-10-23 | **Email verification: required + verify**, 6-digit code | Pinili ni Bench; code kaysa link para gumana rin sa APK |
| 2026-10-23 | Email sender: **Gmail** (App Password) muna | Libre at mabilis; lilipat sa Resend + domain pag lumaki |

## Bukas pa (hinihintay si Bench)
- **Media plan:** Daily = sa device lang (sariling folder sa app); Share = maliit na compressed copy sa server para makita ng iba. Okay ba?
- **Max na haba ng video** sa Share (hal. 15 s?)
- **Approval:** auto-active ang bagong users, o kailangan i-approve? (`REQUIRE_APPROVAL`)

Tingnan din: [[Build - Foundation]]
$md$, updated_at = now(), updated_by = 'claude' where lower(title) = lower('Decisions');
update public.brain_notes set body = $md$---
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
| `auth-fast` | register, login, verifyEmail, resendCode, checkSession, logout | `backend/auth-fast.ts` |

| Table | Para saan | SQL |
|---|---|---|
| `users` | accounts | `sql/001-users.sql` |
| `sessions` | login tokens (hash lang) | `sql/002-sessions.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
| `brain_notes` | kopya ng vault na ito sa database | `sql/004-brain-notes.sql` |
| `email_codes` | 6-digit codes (hash lang) | `sql/007-email-verify.sql` |

`users` ay may `email` at `email_verified_at` (sql/007). Status: Unverified → Active / Pending / Inactive.

## Paano dumadaloy ang isang private page
1. `theme.js` → kulay agad
2. `config.js` → URLs
3. `auth-guard.js` → tago muna ang page, check ng token (cache 60 s)
4. Page HTML (`<main id="page">`)
5. `icons.js` → `nav-items.js` → `app-shell.js` (bumubuo ng menu sa paligid ng page)
6. `pages/<page>.js`

Tingnan din: [[How to edit]], [[Build - Foundation]]
$md$, updated_at = now(), updated_by = 'claude' where lower(title) = lower('System map');
update public.brain_notes set body = $md$---
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
| `SMTP_USER` | Gmail address na magpapadala ng codes | Required para sa sign-up |
| `SMTP_PASS` | Gmail **App Password** (16 letters) | Required. Hindi ang normal na Gmail password. |
| `MAIL_FROM_NAME` | Pangalan ng sender | Optional (default TigoMeNote) |
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
$md$, updated_at = now(), updated_by = 'claude' where lower(title) = lower('Supabase setup');
update public.brain_notes set body = $md$---
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

Tingnan din: [[Build - Foundation]], [[Build - Email verification]], [[Change log]]
$md$, updated_at = now(), updated_by = 'claude' where lower(title) = lower('Build - Login page');
