-- TigoMeNote · 051 · vault sync: #35 Daily — record lang; napatakbo na
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
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Daily$v$, $v$# Build - Daily

Ang unang page (`app/home.html`): bati, weather, at ang Daily mismo.

## Notes (nasa device lang)
- `daily-store.js` (IndexedDB `tmn-daily-<user>`): `notes` (id, day "YYYY-MM-DD", kind note/todo, text, items, photos = id ng Gallery, pinned) at `moods` (day → emoji).
- `components/daily-notes.js`: composer (sulat, ✓ to-do, 📷 photo → Gallery ng device), listahan ng araw (pinned muna), check ng to-do, Pin/Edit/Share to Explore/Delete, mood row. Ctrl+Enter = Save.
- Hindi ina-upload. Ang "Share to Explore" lang ang nag-a-upload (sa post composer, pipili ka pa).

## Araw at calendar
- **This week**: pindutin ang araw → notes ng araw na iyon ("Adding to …" sa composer). Tuldok/emoji kapag may notes/mood.
- **Calendar** (`mini-calendar.js`): buwan; tuldok = notes, emoji = mood, 🔔 = reminder; "Today" at "Reminder on this day".
- **✨ On this day**: notes sa parehong petsa noong nakaraang buwan/taon (`TMN_DAILY.onThisDay`).

## Reminders & alarms
- Server: table `reminders` (sql/050) + `daily-fast`. Ulitin: none/daily/weekly/monthly. Max 100 na active.
- Cron `tmn-reminders` bawat minuto → `daily-fast` `due` (key `cron_daily` galing sa `app_keys`, ginawa ng SQL; walang secret sa notes) → web push sa lahat ng device ng user (VAPID ng safety-fast). Umuulit = lilipat sa susunod na oras.
- `sw.js`: alarm = `requireInteraction` + mahabang vibrate; reminder = maikling vibrate. Pindot = `home.html?reminder=<id>` → tumutunog sa page.
- Bukas ang page: `reminders.js` tumitingin bawat 10 s at kapag may push → chime (Web Audio); alarm = paulit-ulit hanggang Stop; Snooze 10 min / Done.
- Sa APK (susunod): totoong alarm ng phone kahit naka-silent at sarado ang app.

## Pinas ⇄ dito (`home-clock.js`)
- Oras sa 🇵🇭 at sa time zone ng device (o 🇧🇭 kung nasa Pinas ka). "Good time to call" kapag 8 AM–10 PM sa kabila.

## Hindi pa na-test
- Mock lang ang UI (20/20 sa test_daily). Live: tumatakbo ang cron (`sent: 0`). Hindi pa nasubukan ang totoong push ng reminder sa phone at ang tunog sa iPhone.

Tingnan din: [[Build - Gallery and albums]], [[Build - Notifications]], [[System map]]
$v$, '{}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** Detalye sa [[Build - Background and music]].
$v$, $v$- **Paano:** Detalye sa [[Build - Background and music]].

## 2026-10-24 · #35 Daily: notes, to-do, mood, reminders at alarms, calendar, "On this day", Pinas ⇄ dito
- **Ano:**
  - **Daily notes** (nasa device lang): sulat, ✓ to-do list (bawat linya = item, may check), photo/video (naka-save din sa Gallery), link na napipindot. Pin, Edit, Share to Explore (kung may photo), Delete.
  - **How's your day?** — mood ng araw (emoji); lumalabas sa "This week" at Calendar.
  - **This week** — pindutin ang araw para makita/sulatan ang araw na iyon; **Calendar** button = maliit na calendar ng buwan (tuldok = may notes, emoji = mood, 🔔 = reminder).
  - **Reminders & alarms** — Reminder o Alarm, petsa/oras, ulitin (isang beses, araw-araw, linggo-linggo, buwan-buwan), note. May push sa phone kahit sarado ang app; kapag bukas ang app: tumutunog (alarm = tuloy-tuloy hanggang Stop), may Snooze 10 min at Done.
  - **✨ On this day** — notes sa parehong petsa noong nakaraang buwan/taon.
  - **Pinas ⇄ dito** — oras sa Pilipinas at sa kinaroroonan mo (hal. Bahrain), may "Good time to call home" o "It's late in the Philippines".
  - **Light mode**: mababasa na ang text na nasa ibabaw mismo ng background (may halo na kulay ng page).
- **Bakit:** Ayon kay Bench (may screenshot): "pag naka light mode me mga letter na di na babasa", "ung daily natin pwede na nating simulan, mag add kadin na pwede gumawa ng alarm, reminders", "ung this week pwede mag lagay ka ng button para ma view ung maliit na calendar", "ano pa ba unique na pwede duon".
- **Files:** `sql/050-daily-reminders.sql` (table `reminders`, cron `tmn-reminders` bawat minuto, key `cron_daily` sa app_keys), `backend/daily-fast.ts` (bago, v1) + `webpush.ts`, `assets/js/daily-store.js` (bago), `components/daily-notes.js` (bago), `components/reminders.js` (bago), `components/mini-calendar.js` (bago), `components/home-clock.js` (bago), `pages/daily.js`, `app/home.html`, `assets/css/pages/daily.css`, `assets/css/look.css`, `sw.js` (alarm/reminder), `config.js` (0.11.7, `daily`), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Daily]].
- **Na-test:** live ang cron: bawat minuto `{"ok":true,"sent":0}` mula sa daily-fast (2026-10-24).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Tuloy-tuloy na music kahit lumipat ng page o naka-lock = sa APK na | Pinili ni Bench; sa web, humihinto ang audio kapag nagpalit ng page |

$v$, $v$| 2026-10-24 | Tuloy-tuloy na music kahit lumipat ng page o naka-lock = sa APK na | Pinili ni Bench; sa web, humihinto ang audio kapag nagpalit ng page |
| 2026-10-24 | Daily notes = nasa device lang; reminders/alarms = nasa server | Pribado ang notes; ang reminder ay kailangang nasa server para may push sa tamang oras kahit sarado ang app |
| 2026-10-24 | Cron ng reminders: sariling random key (app_keys `cron_daily`), hindi service key | Walang secret sa SQL o notes; ang key ay ginawa sa database mismo |

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- 2026-10-24 · Feed: kailangan pa ring mag-scroll sa video kahit 560px na → ang video na walang w/h ay square (1:1) kaya laging pinakamataas, at mas mataas ang buong post kaysa sa screen → iisang taas na batay sa screen (`100dvh − 320px`, 220–460px) at `contain` sa photo at video (`social.css`, `post-card.js`)

$v$, $v$- 2026-10-24 · Feed: kailangan pa ring mag-scroll sa video kahit 560px na → ang video na walang w/h ay square (1:1) kaya laging pinakamataas, at mas mataas ang buong post kaysa sa screen → iisang taas na batay sa screen (`100dvh − 320px`, 220–460px) at `contain` sa photo at video (`social.css`, `post-card.js`)
- 2026-10-24 · Light mode na may picture na background: hindi mabasa ang "Your notes for today…" at iba pang text sa ibabaw ng picture → walang card sa likod ng mga ito → halo (text-shadow na kulay ng page) + mas madilim na kulay ng text (`look.css`)

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(replace(brain_notes.body, $v$| `components/appearance-settings.js` | Settings → Background: presets, kulay, picture (desktop/phone), sliders (`TMN_LOOK_UI`) |
| `music-store.js` / `components/music-player.js` | My music: playlist sa device (IndexedDB) + player sa profile (`TMN_MUSICDB`, `TMN_MUSIC`) |
$v$, $v$| `components/appearance-settings.js` | Settings → Background: presets, kulay, picture (desktop/phone), sliders (`TMN_LOOK_UI`) |
| `daily-store.js` / `components/daily-notes.js` | Daily notes sa device (IndexedDB): note, to-do, photos, mood, On this day (`TMN_DAILY`, `TMN_DAILY_UI`) |
| `components/reminders.js` / `mini-calendar.js` / `home-clock.js` | Reminders & alarms (`TMN_REMIND`), calendar ng buwan (`TMN_CAL`), Pinas ⇄ dito (`TMN_HOMECLOCK`) |
| `music-store.js` / `components/music-player.js` | My music: playlist sa device (IndexedDB) + player sa profile (`TMN_MUSICDB`, `TMN_MUSIC`) |
$v$), $v$| `safety-fast` | circle, invite, respond, update, remove, pause, ping, history, clearHistory, exportHistory, sos, sosUpdate, sosEnd, alerts, ack, pushKey, subscribe, unsubscribe, testPush | `backend/safety-fast.ts` + `webpush.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
$v$, $v$| `safety-fast` | circle, invite, respond, update, remove, pause, ping, history, clearHistory, exportHistory, sos, sosUpdate, sosEnd, alerts, ack, pushKey, subscribe, unsubscribe, testPush | `backend/safety-fast.ts` + `webpush.ts` |
| `daily-fast` | list, save, remove, done, snooze; due (cron bawat minuto, key `cron_daily`) | `backend/daily-fast.ts` + `webpush.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
$v$), $v$| `sessions` | login tokens (hash lang) | `sql/002-sessions.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
$v$, $v$| `sessions` | login tokens (hash lang) | `sql/002-sessions.sql` |
| `reminders` | Daily reminders at alarms (oras, ulit, sent/done) | `sql/050-daily-reminders.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
$v$), updated_by = 'claude', updated_at = now();
