---
tags: [setup]
updated: 2026-10-23
---
# Supabase setup

**Account:** sensengutierrez (hiwalay sa Lalabella)
**Project:** `tigomenote` · ref `njwtfoimkorkcysxvrqb` · region ap-south-1 (Mumbai) · free plan
**URL:** `https://njwtfoimkorkcysxvrqb.supabase.co` (nasa `assets/js/config.js`)

## Secrets (Edge Functions → Secrets)
| Name | Para saan | Note |
|---|---|---|
| `AUTH_PEPPER` | dagdag sa password hash | **Required. Huwag palitan** — mawawalan ng access ang lahat ng account. |
| `SMTP_USER` | Gmail address na magpapadala ng codes | Required para sa sign-up |
| `SMTP_PASS` | Gmail **App Password** (16 letters) | Required. Hindi ang normal na Gmail password. |
| `MAIL_FROM_NAME` | Pangalan ng sender | Optional (default TigoMeNote) |
| `REQUIRE_APPROVAL` | `"true"` = Pending ang bagong users | Optional |

> Walang totoong value ng secret dito, at hindi dapat ilagay kailanman.

## Edge functions
| Name | verify_jwt | Source |
|---|---|---|
| `auth-fast` | off | `backend/auth-fast.ts` |

## Rules
- Bawat bagong table: `enable row level security` + `grant select, insert, update, delete ... to service_role`.
- Bawat SQL na pinatakbo ay may file sa `sql/` (naka-number).
- Bawat function ay may source copy sa `backend/`.

## Free plan limits
1 GB storage · 500 MB database · 5 GB bandwidth/buwan · walang automatic backup. Planuhin ang weekly backup bago dumami ang users.

## Connector (Claude)
Isang Supabase account lang ang naka-connect kay Claude sa isang pagkakataon. Kapag kailangan ang Lalabella, i-reconnect sa Lalabella account at sabihin kay Claude.

Tingnan din: [[Build - Foundation]]
