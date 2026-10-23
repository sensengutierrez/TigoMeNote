---
tags: [build]
updated: 2026-10-24
---
# Build - Language (English default + Arabic + Filipino)

**What it does:** English na ang default ng buong site (pages, toasts, error galing sa server, email code). Sa **Settings → Language** pwedeng palitan: **English**, **العربية (Arabic)**, **Filipino**. May maliit na language dropdown din sa login at landing page. Ang Arabic ay **right-to-left** (baliktad ang layout).

## Paano gumagana
- Lahat ng text sa code ay **English**.
- `assets/js/i18n.js` (nasa `<head>` ng bawat page, pagkatapos ng `config.js`): binabasa ang `tmnLang` sa browser. Kung hindi English, nilo-load ang `assets/js/lang/<code>.js` at **kusang isinasalin** ang text sa page, pati ang mga lumalabas mamaya (toast, modal, feed).
- Dictionary: `"English text": "salin"`. May placeholders para sa numero/pangalan: `"Saving {n} file(s) to this device…"`. `{n} {m} {a} {b}` = numero lang; ibang pangalan (`{x}`, `{d}`) = kahit anong text.
- **Hindi isinasalin** ang gawa ng users: caption, comment, bio, pangalan, username, album name na sariling gawa, status caption, brand (TigoMeNote).
- Petsa at oras: naka-format sa wika (`TMN_I18N.locale`: en-US, ar-BH, fil-PH).
- Email code: ang browser ay nagpapadala ng `lang` sa server, kaya ang email ay nasa napiling wika (auth-fast `MAIL_TEXT`).
- Arabic: `<html dir="rtl">`, walang letter-spacing, may `[dir="rtl"]` na ayos sa `base.css`, `shell.css`, `components.css`, `social.css`, `profile.css`.

## Files
| File | Trabaho |
|---|---|
| `assets/js/i18n.js` | `TMN_I18N`: lang, t(), set(code), mountPicker(el), auto-translate ng page |
| `assets/js/lang/ar.js` | Arabic dictionary |
| `assets/js/lang/fil.js` | Filipino dictionary (dating Taglish ng site) |
| `app/settings.html`, `assets/js/pages/settings.js`, `assets/css/pages/settings.css` | Language picker |
| `login.html`, `index.html`, `login.js`, `landing.js` | Maliit na language dropdown |
| `assets/js/api.js` | Kusang nagdadagdag ng `lang` sa bawat request |
| `backend/*.ts` | English na ang lahat ng error message; auth-fast may email sa en/fil/ar |

## Paano magdagdag ng wika (hal. Hindi, Urdu)
1. Kopyahin ang `assets/js/lang/ar.js` → `assets/js/lang/<code>.js`, palitan ang `register("<code>", …)` at ang mga salin.
2. Idagdag sa `LANGS` sa `assets/js/i18n.js` (`code`, `name`, `native`, `locale`, at `dir: "rtl"` kung pakanan-pakaliwa).
3. Para sa email: idagdag sa `MAIL_TEXT` sa `backend/auth-fast.ts`, tapos i-deploy.

## Known limits / hindi pa na-test
- Hindi pa na-test sa totoong phone ang Arabic RTL (sa sandbox lang, desktop at phone size).
- Kapag may bagong text sa code na wala sa dictionary, lalabas itong English hanggang maidagdag.
- Ang Filipino ay hindi buong Tagalog: naiwang English ang mga salitang karaniwan (Gallery, Upload, Post).

Tingnan din: [[System map]], [[Decisions]]
