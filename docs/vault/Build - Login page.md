---
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
