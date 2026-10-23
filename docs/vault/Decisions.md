---
tags: [decision]
updated: 2026-10-23
---
# Decisions

| Petsa | Desisyon | Bakit |
|---|---|---|
| 2026-10-23 | Pangalan: **TigoMeNote** | Pinili ni Bench |
| 2026-10-23 | Tema: **plain white + dark mode** setting | Pinili ni Bench |
| 2026-10-23 | Hosting: **GitHub Pages** muna (`sensengutierrez.github.io/TigoMeNote/`) | Libre; custom domain mamaya |
| 2026-10-23 | **Hiwalay na Supabase account at project** (sensengutierrez) | Hindi maghahati sa free-plan limits ng Lalabella |
| 2026-10-23 | **Public repo**, No license | Libre ang Pages sa public; "no license" = all rights reserved. Walang secret sa code. |
| 2026-10-23 | GitHub Desktop para sa updates | Kasama ang dotfiles, kita ang binago bago i-push |
| 2026-10-23 | Unang nag-register = Admin | Si Bench dapat ang mauna |
| 2026-10-23 | **Email verification: required + verify**, 6-digit code | Pinili ni Bench; code kaysa link para gumana rin sa APK |
| 2026-10-23 | Email sender: **Gmail** (App Password) muna | Libre at mabilis; lilipat sa Resend + domain pag lumaki |
| 2026-10-23 | **Desktop/laptop = full UI/UX** (buong lapad) | Rule ni Bench |
| 2026-10-23 | **Gallery sa device lang** (IndexedDB), walang upload | Tugma sa "sa device mag-save"; walang gastos sa server storage |
| 2026-10-23 | Weather: **Open-Meteo** + GPS/IP auto-detect | Libre, walang API key |
| 2026-10-23 | Posts: **maliit na copy** sa server (photo 1600 px JPEG, video 720p) | Pinili ni Bench; kasya sa 1 GB na libre |
| 2026-10-23 | Video sa post: **max 15 segundo** | Pinili ni Bench |
| 2026-10-23 | **Visibility bawat post** (Public / Followers / Ako lang) | Pinili ni Bench |
| 2026-10-23 | **Offline queue** sa device + schedule sa server (`publish_at`) | Idea ni Bench; gumagana kahit walang net |
| 2026-10-23 | Profile photo + cover sa **public** bucket `profile-media`; upload via `profile-fast` lang | Nakikita naman talaga ng iba; mabilis at naka-cache |
| 2026-10-23 | Cover = **3:1** (1500×500), photo = 600×600, may crop | Pareho ang itsura sa desktop at phone |
| 2026-10-23 | Lipat sa **Brevo** (free 300/araw) | Ayaw tanggapin ng Gmail ang App Password; walang domain na kailangan sa Brevo. SMS ay hindi pinili kasi may bayad. |

## Bukas pa (hinihintay si Bench)
- **Approval:** auto-active ang bagong users, o kailangan i-approve? (`REQUIRE_APPROVAL`)

Tingnan din: [[Build - Foundation]]
