-- TigoMeNote · 054 · vault sync: #36 Tigo — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$00 Home$v$, $v$---
tags: [home]
updated: 2026-10-23
---
# TigoMeNote Brain

Ito ang "utak" ng project: lahat ng ginawa, paano ginawa, at bakit. Buksan ang folder na `docs/vault` sa **Obsidian** (Open folder as vault) para ma-click ang mga [[link]].

## Simula dito
- [[System map]] — lahat ng pages, files, functions at tables sa isang tingin
- [[How to edit]] — saan babaguhin ang menu, kulay, URL, at paano magdagdag ng page
- [[Change log]] — bawat edit: ano, bakit, saang file, paano gumagana
- [[Fix log]] — bawat bug: problema → sanhi → ayos
- [[Decisions]] — mga napagdesisyunan at bakit

## Build records (isang note bawat feature)
- [[Build - Foundation]] — database, login back end, app shell
- [[Build - Login page]] — sign in / create account na may panel swap animation
- [[Build - Email verification]] — 6-digit code sa Gmail bago makapasok
- [[Build - Forgot password]] — reset ng password gamit ang code sa email
- [[Build - Gallery and albums]] — photos/videos sa device, albums, editor
- [[Build - Weather]] — weather sa Daily, auto Bahrain/Pinas
- [[Build - Offline posts]] — mag-post kahit offline, may schedule, auto-upload
- [[Build - Profile edit]] — edit profile, profile photo at cover (banner)
- [[Build - Social feed]] — reactions, comments, share, bookmark, follow, status
- [[Build - Language (i18n)]] — English default, Arabic (RTL), Filipino
- [[Build - Profile tabs and pins]] — TikTok-style tabs, views at ❤️, Pin (3)
- [[Build - Safety and wellbeing]] — Family/Friends, Locate, SOS + push, 13+, parental, sleep, break
- [[Build - Moderation and policies]] — Terms, Privacy, Guidelines, Copyright, Third-party; text filter, Report, admin Reports
- [[Build - Notifications]] — activity list, push, notification settings, TigoMeNote ring sa Status
- [[Build - Share camera and sounds]] — sariling camera, 13 libreng filters, auto sound (TigoMeNote Sounds), ♪ sa posts
- [[Build - Explore activity]] — Explore post na parang Komoot (route sa mapa + photos + stats) at buong-screen na viewer na may X
- [[Build - Daily]] — Daily notes (device), to-do, mood, reminders at alarms (push), calendar, On this day, Pinas ⇄ dito
- [[Build - Tigo]] — 3D virtual pet (sariling character), alaga, level, Gather ng magkakalapit na kaibigan
- [[Build - Background and music]] — background ng app (TigoMeNote originals, kulay, sariling picture desktop/phone) at My music sa profile
- [[Build - Messenger]] — Tigo Messenger: chats, groups, photo, location + pin, reactions, Seen, requests; hiwalay na app sa APK

## Plans
- [[Plan - Safety, family and wellbeing]] — plano + guidelines ng APK (web version: tapos na)

## Setup
- [[Supabase setup]] — project, tables, secrets (walang totoong value dito)
- [[GitHub and deploy]] — repo, Pages, paano mag-update

## Status
| Step | Ano | Status |
|---|---|---|
| 1 | Project + database | ✅ |
| 2 | Auth back end (auth-fast) | ✅ deployed, hinihintay ang test ni Bench |
| 3 | Front-end shell | ✅ live |
| 4 | Brain vault | 🟡 md files + DB; brain.html sa web, susunod |
| 5 | Messaging | ⏳ |
| 6 | Profile + approval | 🟡 Edit profile + cover ✅; approval susunod |
| 7 | Daily / Explore / Share (ang idea) | 🟡 Gallery, weather, offline posts, social feed + status ✅; notifications susunod |
| 8 | Android APK | ⏳ |
$v$, '{home}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Tigo$v$, $v$# Build - Tigo

Virtual pet ng TigoMeNote (parang Tamagotchi pero sariling character): si **Tigo**, ang note na may mukha (gaya ng stickers).

## Page at 3D
- `app/tigo.html` + `pages/tigo.js`. Nasa menu at sa itaas ng phone (icon).
- 3D: `tigo/pet-model.js` (katawan na RoundedBox, nakatiklop na kanto, mata na may kinang, pisngi, bibig ayon sa mood, kamay/paa, gamit) at `tigo/pet-scene.js` (isla na may sampaguita, ilaw na may anino, gabi, effects: puso, pagkain, bula, bituin, bola). three.js r170 sa `assets/vendor/three/` (MIT), ini-load lang sa page na ito.
- Galaw: hinga, kurap, tingin sa daliri/mouse, talon, kain, ikot, tulog (Zzz). Humihinto kapag nakatago ang page (tipid sa baterya). Walang WebGL → 2D sticker.

## Alaga at level
- Stats 0–100: Food, Fun, Energy, Clean. Bumababa bawat oras (gising/tulog): Food 6/3, Fun 4/2, Energy 5/+14, Clean 3/1. Kusang gigising kapag puno ang Energy.
- Mood: sick (Clean <15 o Food <10), sleepy, sad, okay, happy. Hindi namamatay.
- XP (may limit bawat araw): Feed +3, Play +5, Clean +3, Pet +1, Daily (note/to-do/mood) +8, Gather +15. Level = ⌊√(XP/20)⌋+1.
- Unlock: Sprout Lv 2, Bow 3, Cap 4, Headphones 5, Crown 7. Kulay: coral, amber, mint, sky, pink, lilac, lime, ink.
- Server ang may huling salita (`pet-fast`), pero ang bars ay gumagalaw din sa browser gamit ang parehong rates.

## Gather (magkakalapit na kaibigan)
- "Meet nearby friends" (naka-off bilang default). Kapag in-on: ipinapadala ang lokasyon na naka-round sa ~100 m; tumatagal ng 20 min; ina-update bawat minuto habang bukas ang page.
- Lalabas lang ang kaibigan kung: mutual follow o tinanggap na Family/Friends, naka-on din sila, at ≤600 m. Ang ibinabalik ay "very close" (<120 m) o "nearby" lang, hindi ang lokasyon.
- Gather: isang beses bawat araw bawat magkaibigan (`pet_meets`); +15 Fun at XP sa dalawa; push sa kaibigan ("…'s Tigo came to play!"). Lalabas ang Tigo ng kaibigan sa isla.

## Para sa APK
- Iisang page at mga file; gumagamit ng `TMN_NATIVE.getLocation()` (sa APK = native GPS) at `navigator.vibrate` sa level up. Ang 3D ay naka-vendor (hindi kailangan ng CDN).
- Susunod sa APK: paalala kapag gutom/malungkot si Tigo (push), at widget sa home screen.

## Hindi pa na-test
- Mock lang ang UI (18/18 sa test_tigo, pati 2D fallback). Hindi pa nasubukan: totoong server (pet-fast), Gather ng dalawang totoong phone na magkalapit, at bilis ng 3D sa mahinang phone.

Tingnan din: [[Build - Daily]], [[Build - Safety and wellbeing]], [[System map]]
$v$, '{}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Na-test:** live ang cron: bawat minuto `{"ok":true,"sent":0}` mula sa daily-fast (2026-10-24).
$v$, $v$- **Na-test:** live ang cron: bawat minuto `{"ok":true,"sent":0}` mula sa daily-fast (2026-10-24).

## 2026-10-24 · #36 Tigo: sariling 3D virtual pet (parang Tamagotchi) + Gather ng magkakalapit na kaibigan
- **Ano:**
  - Bagong page **Tigo** (menu + icon sa itaas ng phone): si Tigo (ang note na may mukha ng stickers) sa **3D** na isla (three.js). Humihinga, kumukurap, sumusunod ang tingin, tumatalon, kumakain, natutulog (gabi + Zzz).
  - Alaga: **Feed** (Pandesal, Mangga, Kanin, Dates, Halo-halo, Saging), **Play** (bola), **Clean** (bula), **Sleep/Wake**, tap kay Tigo = ❤️. Bumababa ang Food/Fun/Energy/Clean habang lumilipas ang oras; hindi namamatay si Tigo, nalulungkot lang.
  - **Level/XP**: mula sa alaga, sa pagsusulat sa Daily (note, to-do, mood), at sa paglalaro kasama ng kaibigan. Unlock: 🌱 Sprout (Lv 2), 🎀 Bow (3), 🧢 Cap (4), 🎧 Headphones (5), 👑 Crown (7). **Style**: pangalan, 8 kulay, isusuot.
  - **Meet nearby friends / Gather**: kapag naka-on sa dalawang magkaibigan at magkalapit (≤600 m), lalabas sila; pindot **Gather** = pupunta ang Tigo ng kaibigan sa isla mo at maglalaro (+15 Fun at XP sa dalawa, isang beses bawat araw), may push sa kaibigan.
  - Sa Daily: maliit na card ni Tigo (mood, level).
  - Walang WebGL: 2D na Tigo (sticker).
- **Bakit:** Ayon kay Bench: "alam mo ba ung larong tamagotchi… sige simulan natin, tapos pag me friend or classmate pwede silang mag gather pumasyal basta magkalapit sila… mas latest na 3D… i-ready to apps sya".
- **Files:** `sql/052-tigo-pets.sql` (pets, pet_meets), `sql/053-keep-warm-pet.sql`, `backend/pet-fast.ts` (bago, v1) + `webpush.ts`, `assets/vendor/three/` (three.js r170, MIT), `assets/js/tigo/pet-model.js` (bago), `assets/js/tigo/pet-scene.js` (bago), `assets/js/pages/tigo.js` (bago), `app/tigo.html` (bago), `assets/css/pages/tigo.css` (bago), `nav-items.js`, `icons.js` (tigo), `daily-store.js` (event `tmn:daily-add`), `pages/daily.js`, `app/home.html`, `pages/daily.css`, `config.js` (0.11.8, `pet`), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Tigo]].
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Cron ng reminders: sariling random key (app_keys `cron_daily`), hindi service key | Walang secret sa SQL o notes; ang key ay ginawa sa database mismo |

$v$, $v$| 2026-10-24 | Cron ng reminders: sariling random key (app_keys `cron_daily`), hindi service key | Walang secret sa SQL o notes; ang key ay ginawa sa database mismo |
| 2026-10-24 | Tigo = sariling character (note na may mukha), hindi Tamagotchi | Trademark ng Bandai ang Tamagotchi; kapareho ng stickers natin ang Tigo |
| 2026-10-24 | 3D gamit ang three.js r170 na naka-vendor sa `assets/vendor/three` (hindi CDN) | Gumagana sa APK at offline na cache; na-test dito; ini-load lang sa Tigo page |
| 2026-10-24 | Gather: magkaibigan lang (mutual follow o Family/Friends), naka-on sa dalawa, distansya lang (hindi lokasyon), ~100 m na katumpakan, 20 min | Kaligtasan, lalo na sa mga bata/teen |
| 2026-10-24 | Hindi namamatay si Tigo | Hindi nakaka-stress; nalulungkot lang kapag napabayaan |

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(replace(brain_notes.body, $v$| `components/appearance-settings.js` | Settings → Background: presets, kulay, picture (desktop/phone), sliders (`TMN_LOOK_UI`) |
| `daily-store.js` / `components/daily-notes.js` | Daily notes sa device (IndexedDB): note, to-do, photos, mood, On this day (`TMN_DAILY`, `TMN_DAILY_UI`) |
$v$, $v$| `components/appearance-settings.js` | Settings → Background: presets, kulay, picture (desktop/phone), sliders (`TMN_LOOK_UI`) |
| `tigo/pet-model.js` / `tigo/pet-scene.js` | 3D na si Tigo at ang isla (ES modules, three.js) |
| `pages/tigo.js` | Tigo page: alaga, style, nearby/gather, visits |
| `daily-store.js` / `components/daily-notes.js` | Daily notes sa device (IndexedDB): note, to-do, photos, mood, On this day (`TMN_DAILY`, `TMN_DAILY_UI`) |
$v$), $v$| `daily-fast` | list, save, remove, done, snooze; due (cron bawat minuto, key `cron_daily`) | `backend/daily-fast.ts` + `webpush.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
$v$, $v$| `daily-fast` | list, save, remove, done, snooze; due (cron bawat minuto, key `cron_daily`) | `backend/daily-fast.ts` + `webpush.ts` |
| `pet-fast` | get, act (feed/play/clean/pet/sleep/wake/daily), style, nearby, gather, visits | `backend/pet-fast.ts` + `webpush.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
$v$), $v$| `reminders` | Daily reminders at alarms (oras, ulit, sent/done) | `sql/050-daily-reminders.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
$v$, $v$| `reminders` | Daily reminders at alarms (oras, ulit, sent/done) | `sql/050-daily-reminders.sql` |
| `pets` / `pet_meets` | si Tigo ng bawat user (stats, XP, style, near_*) at ang mga Gather | `sql/052-tigo-pets.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
$v$), updated_by = 'claude', updated_at = now();
