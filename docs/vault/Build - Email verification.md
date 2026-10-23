---
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
