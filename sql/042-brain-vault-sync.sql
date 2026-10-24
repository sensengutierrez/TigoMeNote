-- TigoMeNote · 042 · vault sync: #30 mas mabilis na loading — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Na-test:** 2026-10-24, gumagana sa totoong server (nailagay ni Bench ang `KLIPY_API_KEY`; test key = 100 requests/oras).
$v$, $v$- **Na-test:** 2026-10-24, gumagana sa totoong server (nailagay ni Bench ang `KLIPY_API_KEY`; test key = 100 requests/oras).

## 2026-10-24 · #30 Mas mabilis na loading
- **Ano:**
  - **Walang "preflight":** ang bawat tawag sa server ay isang biyahe na lang (dati: OPTIONS muna, tapos POST). Ang session token ay nasa body na, hindi sa header.
  - **Keep warm:** bawat 3 minuto, may maliit na tawag sa 8 function na gamit sa bawat page para hindi "malamig" (cold start = 2–3 s ang unang tawag).
  - **Badges:** hindi na tumatawag ulit sa server ang bilang ng notifications/messages kapag lumipat ng page sa loob ng 30 s.
  - **GIFs:** WebP at mas maliit na bersyon muna (mas magaan kaysa GIF).
- **Bakit:** Tanong ni Bench: "bakit ang bagal ng loading". Sa logs: 0.35–0.45 s ang bawat tawag kapag mainit, pero 2–3.3 s kapag cold start, at may OPTIONS na 2–2.6 s bago ang POST.
- **Files:** `assets/js/api.js`, `assets/js/auth-guard.js`, `assets/js/notif-badge.js`, `backend/gifs-fast.ts` (v4, walang `moderation.ts` na), `sql/041-keep-warm.sql` (pg_cron + pg_net), `config.js` (0.11.2)
- **Paano:** `Content-Type: text/plain` + `token` sa body = "simple request" (walang CORS preflight). Patayin ang keep-warm: `select cron.unschedule('tmn-keep-warm');`
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Teen: bawal ang phone, email, address at ibang chat app sa post/comment/bio | Proteksyon laban sa grooming at pribadong usapan sa labas ng app |
| 2026-10-24 | GIFs = **KLIPY** (libre) sa pamamagitan ng `gifs-fast`; hiwalay na key para sa TigoMeNote | Hindi nakikita ang key sa browser; hiwalay na limit at settings sa ibang web app; mahigpit na rating para sa teen |
$v$, $v$| 2026-10-24 | Teen: bawal ang phone, email, address at ibang chat app sa post/comment/bio | Proteksyon laban sa grooming at pribadong usapan sa labas ng app |
| 2026-10-24 | Keep-warm (pg_cron bawat 3 min) sa 8 function na gamit sa bawat page | Iwas 2–3 s na cold start; ~115k invocations/buwan (free: 500k). Tanggalin kapag marami nang users |
| 2026-10-24 | Token sa body at `text/plain` sa lahat ng tawag (walang custom header) | Walang CORS preflight = kalahati ng biyahe bawat tawag |
| 2026-10-24 | GIFs = **KLIPY** (libre) sa pamamagitan ng `gifs-fast`; hiwalay na key para sa TigoMeNote | Hindi nakikita ang key sa browser; hiwalay na limit at settings sa ibang web app; mahigpit na rating para sa teen |
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- 2026-10-24 · Sound picker: humahaba ang "Best match" sa buong lapad → `justify-self: start` (`sounds.css`)

$v$, $v$- 2026-10-24 · Sound picker: humahaba ang "Best match" sa buong lapad → `justify-self: start` (`sounds.css`)
- 2026-10-24 · Mabagal ang loading → (1) cold start ng edge functions (2–3 s kapag ilang minutong walang gumagamit), (2) CORS preflight (OPTIONS) bago ang bawat POST dahil sa `x-session-token` header at JSON content-type → token sa body + text/plain (walang preflight), keep-warm bawat 3 min (sql/041), at cache ng badge (`api.js`, `auth-guard.js`, `notif-badge.js`)

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Supabase setup$v$, $v$---
tags: [setup]
updated: 2026-10-24
---
# Supabase setup

**Account:** sensengutierrez (hiwalay sa Lalabella)
**Project:** `tigomenote` · ref `njwtfoimkorkcysxvrqb` · region ap-south-1 (Mumbai) · free plan
**URL:** `https://njwtfoimkorkcysxvrqb.supabase.co` (nasa `assets/js/config.js`)

## Secrets (Edge Functions → Secrets)
| Name | Para saan | Note |
|---|---|---|
| `AUTH_PEPPER` | dagdag sa password hash | **Required. Huwag palitan** — mawawalan ng access ang lahat ng account. |
| `BREVO_API_KEY` | Brevo API key (`xkeysib-…`) pang-send ng email | **Ito ang gamit ngayon** |
| `MAIL_FROM_EMAIL` | Sender email (verified sa Brevo → Senders) | Required kasama ng Brevo |
| `SMTP_USER` | Gmail address (fallback lang kung walang Brevo) | Optional na |
| `SMTP_PASS` | Gmail **App Password** (fallback) | Optional na |
| `MAIL_FROM_NAME` | Pangalan ng sender | Optional (default TigoMeNote) |
| `REQUIRE_APPROVAL` | `"true"` = Pending ang bagong users | Optional |
| `KLIPY_API_KEY` | KLIPY API key (GIFs/stickers sa chat, `gifs-fast`) | Hiwalay na key para sa TigoMeNote; kung wala: "GIFs are coming soon." |

> Walang totoong value ng secret dito, at hindi dapat ilagay kailanman.

## Edge functions
| Name | verify_jwt | Source |
|---|---|---|
| `auth-fast` | off | `backend/auth-fast.ts` |

## Keep warm (pg_cron)
Job `tmn-keep-warm` (sql/041): bawat 3 min, POST `{"action":"warm"}` sa auth, notify, wellbeing, safety, messages, posts, social, profile. Patayin: `select cron.unschedule('tmn-keep-warm');`

## Rules
- Bawat bagong table: `enable row level security` + `grant select, insert, update, delete ... to service_role`.
- Bawat SQL na pinatakbo ay may file sa `sql/` (naka-number).
- Bawat function ay may source copy sa `backend/`.

## Free plan limits
1 GB storage · 500 MB database · 5 GB bandwidth/buwan · walang automatic backup. Planuhin ang weekly backup bago dumami ang users.

## Connector (Claude)
Isang Supabase account lang ang naka-connect kay Claude sa isang pagkakataon. Kapag kailangan ang Lalabella, i-reconnect sa Lalabella account at sabihin kay Claude.

Tingnan din: [[Build - Foundation]]
$v$, '{setup}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| `auth-guard.js` | Bantay ng private pages; redirect sa login kung walang session |
| `api.js` | `TMN_API.call(fn, action, data)` — isang paraan ng pagtawag sa server |
| `icons.js` | Lahat ng SVG icons (`TMN_ICON("sun")`) |
$v$, $v$| `auth-guard.js` | Bantay ng private pages; redirect sa login kung walang session |
| `api.js` | `TMN_API.call(fn, action, data)` — isang paraan ng pagtawag sa server (token sa body, `text/plain`: walang preflight) |
| `icons.js` | Lahat ng SVG icons (`TMN_ICON("sun")`) |
$v$), updated_by = 'claude', updated_at = now();
