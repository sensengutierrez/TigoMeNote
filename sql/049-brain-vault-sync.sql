-- TigoMeNote · 049 · vault sync: #34 background + My music — record lang; napatakbo na
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
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Background and music$v$, $v$# Build - Background and music

## Background ng app
- Saan: **Settings → Appearance → Background**. Lalabas sa lahat ng page (Daily, Gallery, Explore, Notifications, Safety, Messages, Profile, Settings, Share, Admin).
- Pagpipilian:
  - **TigoMeNote originals** (`look-tigo.js`): sariling SVG patterns na gawa dito (walang kinopya), inuulit sa likod. Tigo Notes (maliliit na "note" na parang logo), Tigo Journal (linya ng notebook + orange na margin), Tigo Dots, Tigo Waves, Tigo Pearls (perlas ng Bahrain), Tigo Sampaguita (bulaklak ng Pinas), Tigo Confetti, Tigo Night.
  - 12 kulay/gradient, sariling kulay, o sariling picture (**Desktop/laptop** at **Phone**, magkahiwalay; kung isa lang, iyon sa pareho). Phone = lapad ≤ 768 px.
  - **Background strength** 10–100% at **Card transparency** 0–70%.
- Paano gumagana: `appearance.js` (nasa `<head>`, walang flash) → `--look-layer`, `--look-strength`, `--look-panel` sa `<html>` at class `has-bg` (pati `bg-photo`, `bg-dark`). `look.css`: `body::before` na fixed na layer; see-through ang sidebar/cards na may blur.
- Madilim na design (Tigo Night, Tigo Pearls, Night, Forest): puti ang mga pamagat sa ibabaw. Dark mode + maliwanag na background: dinidilim ang layer para mabasa.
- Naka-save sa account: `profile-fast` → `look` / `saveLook` (`users.appearance`), picture = `imageUpload` → PUT → `setImage` (kind `bg_desktop` / `bg_phone`, bucket `profile-media`, pinapaliit muna: desktop ≤2400 px, phone ≤1600 px). Kinukuha ulit bawat 10 min para pareho sa ibang device.

## My music (profile)
- Sariling playlist sa **sariling profile** lang. Ikaw lang ang nakakarinig. Ang kanta ay nasa device (IndexedDB `tmn-music-<user>`), **hindi ina-upload**.
- Add songs (MP3, M4A, AAC, WAV, OGG, OPUS, FLAC; hanggang 60 MB bawat isa). "Artist - Title.mp3" → hiwalay ang artist at pamagat.
- Play/Pause, Next/Previous, Shuffle, Repeat (playlist / isang kanta / off), seek, Move up/down, Rename, Remove. Controls sa lock screen/notification ng phone (Media Session).
- Sa website: tuloy kahit i-minimize, pero humihinto kapag lumipat ng page. Sa APK (susunod): tuloy-tuloy kahit saan at naka-lock.

## Hindi pa na-test
- Mock lang (18/18 sa test_look_music). Hindi pa nasubukan: totoong upload ng background sa server, tugtog habang naka-lock ang totoong phone, iPhone.

Tingnan din: [[Build - Profile edit]], [[System map]], [[Decisions]]
$v$, '{}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** Detalye sa [[Build - Explore activity]].
$v$, $v$- **Paano:** Detalye sa [[Build - Explore activity]].

## 2026-10-24 · #34 Background ng app (pati sariling TigoMeNote designs), My music, mas maliit na X
- **Ano:**
  - **Background** (Settings → Appearance → Background), lalabas sa lahat ng page:
    - **TigoMeNote originals** (sariling gawa, walang kinopya): Tigo Notes, Tigo Journal, Tigo Dots, Tigo Waves, Tigo Pearls, Tigo Sampaguita, Tigo Confetti, Tigo Night.
    - 12 kulay/gradient, sariling kulay (color picker), o **sariling picture**: magkahiwalay ang Desktop/laptop at Phone.
    - **Background strength** (gaano kakita) at **Card transparency** (gaano ka-see-through ang cards).
    - Naka-save sa account, kaya pareho sa lahat ng device.
  - **My music** sa sariling profile: playlist galing sa phone/computer (MP3, M4A, WAV…). Ikaw lang ang nakakarinig; nasa device lang, hindi ina-upload. Play/Pause, Next/Previous, Shuffle, Repeat, seek, at controls sa lock screen. Sa website: tuloy kahit i-minimize pero humihinto kapag lumipat ng page; tuloy-tuloy kapag may APK na.
  - Mas maliit na **X** sa buong-screen na viewer (34px; mas malaki pa rin ang tapikan).
- **Bakit:** Ayon kay Bench: "laki ng x hahaha", "sa buong background… pwede me color background iba iba… mag upload kung para sa desktop or laptop size or phone size… ma adjust ung transparent", "mag lagay or gawa ka din ng background natin na TigoMeNote walang katulad at original", at "sa my profile… playlist using storage music… kahit mag minimize gumagana padin". Pinili ni Bench: music = ako lang; tuloy-tuloy na tugtog = sa APK na; background = sa account.
- **Files:** `sql/048-app-background.sql`, `backend/profile-fast.ts` (v8: look, saveLook, bg_desktop/bg_phone), `assets/js/appearance.js` (bago), `assets/js/look-tigo.js` (bago), `assets/css/look.css` (bago), `components/appearance-settings.js` (bago), `assets/js/music-store.js` (bago), `components/music-player.js` (bago), `assets/css/music.css` (bago), `pages/settings.js`, `pages/profile.js`, `app/*.html` (appearance.js + look.css sa 10 page), `app/settings.html`, `app/profile.html`, `components.css` (X), `pages/settings.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.6)
- **Paano:** Detalye sa [[Build - Background and music]].
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | GPS recording sa browser: kailangang bukas ang screen (Wake Lock) | Pinapatigil ng browser ang GPS kapag naka-lock; sa APK, ang location history (Safety) ang puwedeng gamitin |

$v$, $v$| 2026-10-24 | GPS recording sa browser: kailangang bukas ang screen (Wake Lock) | Pinapatigil ng browser ang GPS kapag naka-lock; sa APK, ang location history (Safety) ang puwedeng gamitin |
| 2026-10-24 | Background = naka-save sa account (users.appearance + bg_desktop/bg_phone sa profile-media) | Pinili ni Bench; pareho sa lahat ng device |
| 2026-10-24 | My music = sariling playlist sa device lang (IndexedDB), hindi ina-upload | Pinili ni Bench (ako lang); walang copyright problem |
| 2026-10-24 | Tuloy-tuloy na music kahit lumipat ng page o naka-lock = sa APK na | Pinili ni Bench; sa web, humihinto ang audio kapag nagpalit ng page |

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(brain_notes.body, $v$| `components/create-menu.js` | "Create": Status / Post / Explore (`TMN_CREATE`) |
| `components/image-cropper.js` | Crop ng larawan bago i-upload (`TMN_CROPPER`) |
$v$, $v$| `components/create-menu.js` | "Create": Status / Post / Explore (`TMN_CREATE`) |
| `appearance.js` / `look-tigo.js` | Background ng app sa lahat ng page + sariling TigoMeNote designs (`TMN_LOOK`, `TMN_LOOK_TIGO`) |
| `components/appearance-settings.js` | Settings → Background: presets, kulay, picture (desktop/phone), sliders (`TMN_LOOK_UI`) |
| `music-store.js` / `components/music-player.js` | My music: playlist sa device (IndexedDB) + player sa profile (`TMN_MUSICDB`, `TMN_MUSIC`) |
| `components/image-cropper.js` | Crop ng larawan bago i-upload (`TMN_CROPPER`) |
$v$), $v$|---|---|---|
| `users` | accounts | `sql/001-users.sql` |
| `sessions` | login tokens (hash lang) | `sql/002-sessions.sql` |
$v$, $v$|---|---|---|
| `users` | accounts (+ `appearance`, `bg_desktop_url`, `bg_phone_url` = background ng app) | `sql/001-users.sql`, `sql/048-app-background.sql` |
| `sessions` | login tokens (hash lang) | `sql/002-sessions.sql` |
$v$), updated_by = 'claude', updated_at = now();
