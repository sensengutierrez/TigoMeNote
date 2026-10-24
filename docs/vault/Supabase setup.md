---
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
