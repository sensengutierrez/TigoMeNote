---
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

## 2026-10-23 · #9 Email sender: Gmail → Brevo
- **Ano:** Ang mga code email ay pinapadala na sa **Brevo API** (libre, 300 emails/araw). Gmail SMTP ay fallback na lang kung walang `BREVO_API_KEY`.
- **Bakit:** Paulit-ulit na tinatanggihan ng Gmail ang App Password ("535 Username and Password not accepted").
- **Files:** `backend/auth-fast.ts` (deployed) — bagong function na `deliver()`.
- **Paano:** `POST https://api.brevo.com/v3/smtp/email` na may header `api-key`. Sender = `MAIL_FROM_EMAIL` (dapat verified sa Brevo → Senders).
- **Result:** Gumana! Nakapasok na si Bench bilang Admin (`sensengutierrez`) pagkatapos i-deactivate ang Authorized IPs sa Brevo.

## 2026-10-23 · #10 Full-width desktop layout
- **Ano:** Sa desktop/laptop, buong lapad na ang gamit ng bawat page. Daily: feed + side panel (This week, Today, privacy note). Profile: profile card sa kaliwa + Posts area sa kanan. Share: 3 malalaking tiles + info sa kanan. Settings: 2 columns. Explore: 5–6 columns.
- **Bakit:** Rule ni Bench: "pag desktop/laptop, full UI/UX" — ayaw ng makitid na card sa gitna.
- **Files:** `assets/css/shell.css` (bagong `.layout`, `.layout.aside-left`, `.layout-aside`; `.page` max 1480 px), `app/home.html`, `app/profile.html`, `app/share.html`, `app/settings.html`, `assets/css/pages/daily.css`, `profile.css`, `share.css`, `settings.css`, `explore.css`, `assets/js/pages/profile.js`
- **Paano:** `<div class="layout">` = main + aside sa kanan (340 px, 380 px sa ≥1500 px). Sa phone, isang column lang (aside sa ilalim).
