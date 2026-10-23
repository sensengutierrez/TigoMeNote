-- TigoMeNote · 009 · vault sync: forgot password (record lang; napatakbo na)
insert into public.brain_notes (title, body, tags, updated_by) values ('Build - Forgot password', $md$---
tags: [build]
updated: 2026-10-23
---
# Build - Forgot password

**What it does:** Sa Sign in, may "Forgot password?" link. Ilalagay ang username o email → may 6-digit code sa email → ilalagay ang code at bagong password → diretso sa app.

**Files:** `login.html` (bagong `#resetView`), `assets/js/pages/login.js`, `assets/css/pages/auth.css`
**Edge function:** `auth-fast` (actions `forgotPassword`, `resetPassword`)
**Table:** `email_codes` na may `purpose = 'reset'` (walang bagong SQL)

## Daloy
1. **forgotPassword** `{ identifier }` → hinahanap ang user sa username o email; nagpapadala ng reset code. **Pareho ang sagot kahit walang account** ("Kung may account na tugma…"), para hindi mahulaan kung sino ang may account.
2. **resetPassword** `{ identifier, code, password }` → kung tama ang code:
   - bagong salt + hash ng password
   - tinatanggal ang lock (`failed_attempts = 0`, `locked_until = null`)
   - **nilo-logout ang lahat ng lumang session** (revoked)
   - kung `Unverified` pa, nagiging verified na rin (napatunayan na hawak nila ang email)
   - bibigyan ng bagong session → pasok sa app

## Rules
| Rule | Value |
|---|---|
| Buhay ng code | 15 minuto |
| Maling hula bawat code | 5 |
| Hintay bago mag-resend | 60 segundo |
| Max reset codes bawat user bawat oras | 5 |
| Max forgot requests bawat IP bawat oras | 10 |

## Front end
- Link na "Forgot password?" sa ilalim ng Password (Sign in lang; nakatago sa Create account).
- Kung may na-type na sa Username, kusa itong nalalagay sa Forgot screen.
- Step 2: 6 code boxes (paste ok) → pag kumpleto, lilipat sa "Bagong password" (walang auto-submit). May strength bar at show/hide.
- "Resend code (60s)" at "Back to sign in" (may prefill ng username/email).

## Known limits / hindi pa na-test
- Hindi pa na-test sa totoong Gmail mula sa Supabase.
- Wala pang "Change password" sa Settings habang naka-login.

Tingnan din: [[Build - Email verification]], [[Build - Login page]], [[Change log]]
$md$, '{build}', 'claude')
on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
insert into public.brain_notes (title, body, tags, updated_by) values ('Change log', $md$---
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

## 2026-10-23 · #8 Forgot password
- **Ano:** "Forgot password?" sa Sign in. Code sa email + bagong password → pasok agad. Tinatanggal din ang lock at nilo-logout ang lahat ng lumang session.
- **Bakit:** Na-lock si Bench (5 maling password) at hindi sigurado sa password; para hindi na kailangan ng manual na unlock o bura sa database.
- **Files:** `backend/auth-fast.ts` (deployed), `login.html`, `assets/js/pages/login.js`, `assets/css/pages/auth.css`
- **Paano:** Bagong actions na `forgotPassword` at `resetPassword`; `email_codes.purpose = 'reset'`. Ang `login.js` ay may shared helpers na (`makeOtp`, `makeCountdown`, `eye`, `strength`) para iisa ang code ng verify at reset. Detalye: [[Build - Forgot password]].
- **Database (manual):** in-unlock tapos binura ang test account na `sensen` (hiling ni Bench). Malinis na ulit: 0 users.
$md$, '{log}', 'claude')
on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
insert into public.brain_notes (title, body, tags, updated_by) values ('Fix log', $md$---
tags: [log]
updated: 2026-10-23
---
# Fix log

Format: **PROBLEMA → SANHI → AYOS (file)**. Pinakabago sa ibaba.

- 2026-10-23 · Explore: ang "Explore opens soon" card ay napupunta sa ilalim ng screen sa desktop → naka-center sa buong taas ng grid (`top: 50%`), mas mahaba ang grid kaysa screen → inilagay sa `top: 96px` (`assets/css/pages/explore.css`)
- 2026-10-23 · auth-fast unang deploy ay placeholder lang → maling laman ang naipasa sa unang deploy → ni-deploy ulit ang buong code (version 2) at kinumpara sa `backend/auth-fast.ts`
- 2026-10-23 · Login: kapag diretsong binuksan ang `?mode=register`, dumudulas ang panels sa unang load → may CSS transition kahit unang render → `no-anim` class sa `<body>` na tinatanggal pagkatapos ng unang frame (`login.html`, `login.js`, `auth.css`)
- 2026-10-23 · Verify screen sa phone: nahahati sa gitna ang email ("gmai / l.com") → `word-break: break-all` → `white-space: nowrap` (`assets/css/pages/auth.css`)
- 2026-10-23 · Gmail: "535 Username and Password not accepted" → mali ang `SMTP_PASS` (hindi App Password o ibang account) → gumawa ng bagong App Password sa parehong Gmail ng `SMTP_USER` (Supabase Secrets)
- 2026-10-23 · Sign in: "Mali ang username o password" → na-type ang email nang walang `@` (`sensengutierrezgmail.com`) kaya hinanap bilang username → i-type ang username o buong email
- 2026-10-23 · Reset screen: naiiwan ang lumang error habang nagta-type ng bagong password → walang hide sa input → `rPass` input nagtatago ng `rMsg2` (`login.js`)

Hindi bug (para hindi na hanapin ulit):
- GitHub Desktop: "This file uses LF line endings… CRLF" → normal sa Windows, walang epekto sa site.
- Sign in field: hindi na tinatanggal ang simbolo (hal. `@`) kasi pwede na ang email doon. Sa Create account lang strict ang username.
- "Naka-lock ang account… 28 minuto" → tama ang gawa: 5 maling password = 30 min lock. May Forgot password na para ma-unlock agad.
- GitHub Desktop: naka-yellow (modified) ang mga file na pareho naman ang laman → line endings lang.
$md$, '{log}', 'claude')
on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
insert into public.brain_notes (title, body, tags, updated_by) values ('System map', $md$---
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
| `auth-fast` | register, login, verifyEmail, resendCode, forgotPassword, resetPassword, checkSession, logout | `backend/auth-fast.ts` |

| Table | Para saan | SQL |
|---|---|---|
| `users` | accounts | `sql/001-users.sql` |
| `sessions` | login tokens (hash lang) | `sql/002-sessions.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
| `brain_notes` | kopya ng vault na ito sa database | `sql/004-brain-notes.sql` |
| `email_codes` | 6-digit codes (hash lang), purpose `verify` o `reset` | `sql/007-email-verify.sql` |

`users` ay may `email` at `email_verified_at` (sql/007). Status: Unverified → Active / Pending / Inactive.

## Paano dumadaloy ang isang private page
1. `theme.js` → kulay agad
2. `config.js` → URLs
3. `auth-guard.js` → tago muna ang page, check ng token (cache 60 s)
4. Page HTML (`<main id="page">`)
5. `icons.js` → `nav-items.js` → `app-shell.js` (bumubuo ng menu sa paligid ng page)
6. `pages/<page>.js`

Tingnan din: [[How to edit]], [[Build - Foundation]]
$md$, '{system}', 'claude')
on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
insert into public.brain_notes (title, body, tags, updated_by) values ('00 Home', $md$---
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
- [[Build - Forgot password]] — reset ng password gamit ang code sa email

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
$md$, '{home}', 'claude')
on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
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
- Forgot password: tapos na, tingnan ang [[Build - Forgot password]].
- Wala pang "palitan ang email" sa Settings.

Tingnan din: [[Build - Login page]], [[Supabase setup]], [[Change log]]
$md$, '{build}', 'claude')
on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
