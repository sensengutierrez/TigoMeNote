---
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
