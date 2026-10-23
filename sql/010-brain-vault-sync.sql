-- TigoMeNote · 010 · vault sync: Brevo (record lang; napatakbo na)
update public.brain_notes set updated_at = now(), body = replace(body, $a$- **Database (manual):** in-unlock tapos binura ang test account na `sensen` (hiling ni Bench). Malinis na ulit: 0 users.
$a$, $b$- **Database (manual):** in-unlock tapos binura ang test account na `sensen` (hiling ni Bench). Malinis na ulit: 0 users.

## 2026-10-23 · #9 Email sender: Gmail → Brevo
- **Ano:** Ang mga code email ay pinapadala na sa **Brevo API** (libre, 300 emails/araw). Gmail SMTP ay fallback na lang kung walang `BREVO_API_KEY`.
- **Bakit:** Paulit-ulit na tinatanggihan ng Gmail ang App Password ("535 Username and Password not accepted").
- **Files:** `backend/auth-fast.ts` (deployed) — bagong function na `deliver()`.
- **Paano:** `POST https://api.brevo.com/v3/smtp/email` na may header `api-key`. Sender = `MAIL_FROM_EMAIL` (dapat verified sa Brevo → Senders).
$b$) where title = 'Change log';
update public.brain_notes set updated_at = now(), body = replace(body, $a$| `SMTP_USER` | Gmail address na magpapadala ng codes | Required para sa sign-up |$a$, $b$| `BREVO_API_KEY` | Brevo API key (`xkeysib-…`) pang-send ng email | **Ito ang gamit ngayon** |
| `MAIL_FROM_EMAIL` | Sender email (verified sa Brevo → Senders) | Required kasama ng Brevo |
| `SMTP_USER` | Gmail address (fallback lang kung walang Brevo) | Optional na |$b$) where title = 'Supabase setup';
update public.brain_notes set updated_at = now(), body = replace(body, $a$| `SMTP_PASS` | Gmail **App Password** (16 letters) | Required. Hindi ang normal na Gmail password. |$a$, $b$| `SMTP_PASS` | Gmail **App Password** (fallback) | Optional na |$b$) where title = 'Supabase setup';
update public.brain_notes set updated_at = now(), body = replace(body, $a$## Email sending (Gmail)$a$, $b$## Email sending (Brevo, fallback: Gmail)
- **Ngayon:** Brevo API (`BREVO_API_KEY` + `MAIL_FROM_EMAIL`). Libre: 300 emails/araw. Ang sender email ay dapat verified sa Brevo → Senders.
- Fallback kung walang Brevo key: Gmail SMTP sa ibaba.$b$) where title = 'Build - Email verification';
update public.brain_notes set updated_at = now(), body = replace(body, $a$| 2026-10-23 | Email sender: **Gmail** (App Password) muna | Libre at mabilis; lilipat sa Resend + domain pag lumaki |$a$, $b$| 2026-10-23 | Email sender: **Gmail** (App Password) muna | Libre at mabilis; lilipat sa Resend + domain pag lumaki |
| 2026-10-23 | Lipat sa **Brevo** (free 300/araw) | Ayaw tanggapin ng Gmail ang App Password; walang domain na kailangan sa Brevo. SMS ay hindi pinili kasi may bayad. |$b$) where title = 'Decisions';
