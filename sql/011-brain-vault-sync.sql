-- TigoMeNote · 011 · vault sync: full-width desktop (record lang; napatakbo na)
update public.brain_notes set updated_at = now(), body = replace(body, $a$- **Paano:** `POST https://api.brevo.com/v3/smtp/email` na may header `api-key`. Sender = `MAIL_FROM_EMAIL` (dapat verified sa Brevo → Senders).
$a$, $b$- **Paano:** `POST https://api.brevo.com/v3/smtp/email` na may header `api-key`. Sender = `MAIL_FROM_EMAIL` (dapat verified sa Brevo → Senders).
- **Result:** Gumana! Nakapasok na si Bench bilang Admin (`sensengutierrez`) pagkatapos i-deactivate ang Authorized IPs sa Brevo.

## 2026-10-23 · #10 Full-width desktop layout
- **Ano:** Sa desktop/laptop, buong lapad na ang gamit ng bawat page. Daily: feed + side panel (This week, Today, privacy note). Profile: profile card sa kaliwa + Posts area sa kanan. Share: 3 malalaking tiles + info sa kanan. Settings: 2 columns. Explore: 5–6 columns.
- **Bakit:** Rule ni Bench: "pag desktop/laptop, full UI/UX" — ayaw ng makitid na card sa gitna.
- **Files:** `assets/css/shell.css` (bagong `.layout`, `.layout.aside-left`, `.layout-aside`; `.page` max 1480 px), `app/home.html`, `app/profile.html`, `app/share.html`, `app/settings.html`, `assets/css/pages/daily.css`, `profile.css`, `share.css`, `settings.css`, `explore.css`, `assets/js/pages/profile.js`
- **Paano:** `<div class="layout">` = main + aside sa kanan (340 px, 380 px sa ≥1500 px). Sa phone, isang column lang (aside sa ilalim).
$b$) where title = 'Change log';
update public.brain_notes set updated_at = now(), body = replace(body, $a$## Layout rule
- Desktop (≥ 900 px): isang screen lang, walang whole-page scroll; ang content box lang ang nag-i-scroll.$a$, $b$## Layout rule
- **Desktop/laptop = full UI/UX:** gamitin ang buong lapad (hindi makitid na card sa gitna). Gamitin ang `.layout` (main + side panel sa kanan) o `.layout.aside-left` (panel sa kaliwa), at `.layout-aside` para sa side panel.
- Desktop (≥ 900 px): isang screen lang, walang whole-page scroll; ang content box lang ang nag-i-scroll.$b$) where title = 'How to edit';
