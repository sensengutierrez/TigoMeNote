-- TigoMeNote · 036 · vault sync: #27 Share camera, filters at sounds — record lang; napatakbo na
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
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Share camera and sounds$v$, $v$---
tags: [build, share, camera, filters, sounds]
updated: 2026-10-24
---
# Build - Share camera and sounds

**What it does:** Sa **Share**, ang Take photo at Record video ay bumubukas sa sariling camera na may **libreng live filters**. Pagkakuha, may **review** na may **auto-pick na sound** (TigoMeNote Sounds) na puwedeng palitan, tapos **Save** (sa Gallery ng device) o **Save & post** (composer). Ang post ay may ♪ chip na pang-play ng sound sa Explore, profile at viewer.

**Page:** `app/share.html` (+ composer sa `app/gallery.html`; ♪ chip sa `explore`, `profile`, `notifications`, `messages`)
**Code:** `assets/js/filters.js` (`TMN_FILTERS`: 13 filters, `draw()`), `components/camera.js` (`TMN_CAMERA`), `sounds.js` (`TMN_SOUNDS`: music engine, analyze, suggest, ♪ chip), `components/sound-picker.js` (`TMN_SOUND_PICK`: listahan, row, auto), `components/capture-review.js` (`TMN_REVIEW`), `pages/share.js`, `components/post-composer.js` (Sound row), `post-queue.js` (`sound` sa createPost), `components/post-card.js` / `post-viewer.js` (♪ chip, autoplay sa viewer)
**Styles:** `assets/css/camera.css` (camera + review), `sounds.css` (picker + row), `posts.css` (♪ chip)
**Server:** `posts-fast` v9: tumatanggap ng `sound` sa createPost at ibinabalik sa bawat post
**SQL:** `sql/035-post-sound.sql` (napatakbo na): `posts.sound` (jsonb `{ id, vol, orig }`)

## Camera at filters
- `getUserMedia` (back camera muna). Live na preview: CSS filter sa video. Pagkuha: iginuguhit sa canvas na may parehong filter, kaya **naka-"bake" ang filter sa file** (photo = JPEG hanggang 1920 px).
- Video: canvas → `captureStream(30)` + mic → `MediaRecorder` (mp4 kung kaya, kung hindi webm), 720 px, hanggang 15 s (may bilog na timer sa shutter).
- Walang `ctx.filter` (hal. lumang Safari): pixel math sa `filters.js` (mas maliit na video, 640 px).
- Walang camera API o ayaw payagan: may **Use phone camera** (file input na may `capture`); review pa rin na may auto sound (walang filter).
- Swipe sa preview o ←/→ = palit filter; Space = kuha; Esc = sara. Naaalala ang huling filter.
- Iisang listahan ng filters na rin ang photo editor ng Gallery.

## TigoMeNote Sounds (auto sound)
- **12 sariling track** na ginagawa ng browser (Web Audio): Sunny Steps, Golden Hour, Night Drive, Island Breeze, Soft Morning, Hype Up, Lofi Notes, City Lights, Family Day, Rain Window, Dreamy, Victory. Walang audio file, walang download, gumagana offline, **walang copyright issue**.
- Bawat track ay "recipe": tempo, chords, drums, bass, instrument at melody (pareho bawat tugtog). May compressor at limiter para hindi mag-crack sa speaker.
- **Auto-pick:** tinitingnan ang photo/video (liwanag, kulay, init, contrast, kulay na nangingibabaw), oras ng araw at filter → pinakabagay na track. Hal. madilim/gabi → Night Drive; maliwanag at asul → Island Breeze; Mono/Noir → Rain Window.
- **Sound picker:** For you (4, may "Best match") + All sounds, preview, lakas ng music, lakas ng sariling tunog ng video, No sound, at **Auto-pick** on/off (naka-save sa device).
- Ang post ay may `sound` lang (id + lakas), hindi audio file. Sa viewer: kusang tumutugtog; sa feed: pindutin ang ♪ chip. Humihinto kapag isinara o umalis sa page.
- Sa video na may sound: ang sariling tunog ng video ay hinihinaan ayon sa pinili (default 40%).

## Hindi pa / mamaya
- Sikat na kanta (gaya ng TikTok/IG) = kailangan ng lisensya sa record labels (bayad). Puwedeng magdagdag ng royalty-free na audio files mamaya.
- Hindi pa naka-"mix" ang music sa mismong video file; tinutugtog ito habang pinapanood (kaya pareho sa lahat ng device). May `TMN_SOUNDS.render()` na para dito.
- Ang sound ay hindi pa napapalitan pagkatapos i-post (Edit post).

Tingnan din: [[Build - Offline posts]], [[Build - Gallery and albums]], [[Build - Social feed]]
$v$, '{build,share,camera,filters,sounds}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** Detalye: [[Build - Messenger]].
$v$, $v$- **Paano:** Detalye: [[Build - Messenger]].

## 2026-10-24 · #27 Share: sariling camera na may libreng filters at auto sound
- **Ano:** **Take photo / Record video** sa Share ay bumubukas na sa sariling camera ng TigoMeNote: 13 **libreng live filters** (Vivid, Warm, Cool, Golden, Rose, Mint, Drama, Retro, Fade, Night, Mono, Noir), swipe o tap para palitan, front/back camera, video hanggang 15 s. Pagkakuha: **review** na may **auto-pick na sound** (parang TikTok/IG/FB) na tumutugtog agad; puwedeng **Change** (For you + All sounds, lakas ng music at ng sariling tunog ng video) o **No sound**, tapos **Save** o **Save & post**. Ang composer (pati galing Gallery) ay may **Sound** row din. Sa Explore at sa viewer: **♪ chip** na pang-play ng sound; kusang tumutugtog pagbukas ng post.
- **Bakit:** Hiling ni Bench: "share photo pag nag-capture ako gusto ko merron free filter, tapos me auto ng sound parang TikTok, Instagram at Facebook, me auto na pipili ng sound".
- **Files:** `assets/js/filters.js` (bago), `sounds.js` (bago), `components/camera.js` (bago), `components/sound-picker.js` (bago), `components/capture-review.js` (bago), `components/post-composer.js`, `post-queue.js`, `components/post-card.js`, `components/post-viewer.js`, `components/photo-editor.js` (iisang listahan ng filters), `pages/share.js`, `icons.js` (music, pause, volume), `app/share.html`, `app/gallery.html`, `app/explore.html`, `app/profile.html`, `app/notifications.html`, `app/messages.html`, `assets/css/camera.css` (bago), `sounds.css` (bago), `posts.css`, `sql/035-post-sound.sql`, `backend/posts-fast.ts` (v9), `lang/fil.js`, `lang/ar.js`, `config.js` (0.10.0)
- **Paano:** Detalye: [[Build - Share camera and sounds]].
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(brain_notes.body, $v$tags: [decision]
updated: 2026-10-23
---
$v$, $v$tags: [decision]
updated: 2026-10-24
---
$v$), $v$| 2026-10-24 | Teen: bawal ang phone, email, address at ibang chat app sa post/comment/bio | Proteksyon laban sa grooming at pribadong usapan sa labas ng app |
| 2026-10-24 | Text filter: **block** (malinaw na bawal) o **flag** (ipa-review sa admin) | Iwas mali-maling harang sa normal na usapan |
$v$, $v$| 2026-10-24 | Teen: bawal ang phone, email, address at ibang chat app sa post/comment/bio | Proteksyon laban sa grooming at pribadong usapan sa labas ng app |
| 2026-10-24 | Sounds = **sariling music na ginagawa sa device** (Web Audio), hindi sikat na kanta | Libre, offline, walang copyright; ang hit songs ay kailangan ng bayad na lisensya |
| 2026-10-24 | Filters ay naka-"bake" sa file; ang sound ay `id` lang sa post (tinutugtog habang pinapanood) | Pareho ang itsura kahit saan; walang dagdag na upload |
| 2026-10-24 | Text filter: **block** (malinaw na bawal) o **flag** (ipa-review sa admin) | Iwas mali-maling harang sa normal na usapan |
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- 2026-10-24 · Messenger (test): hindi mapindot ang Send kapag may babala ng text filter → ang babala ay nakapatong sa Send button → nasa itaas na ng composer ang babala (`messages.css`)

$v$, $v$- 2026-10-24 · Messenger (test): hindi mapindot ang Send kapag may babala ng text filter → ang babala ay nakapatong sa Send button → nasa itaas na ng composer ang babala (`messages.css`)
- 2026-10-24 · Share camera (test): walang lumalabas na Sound row sa composer → pinapalitan ng `row()` ang buong `className` ng container → `classList.add/toggle` na lang (`sound-picker.js`)
- 2026-10-24 · ♪ chip sa post card (test): napunta sa sulok ng screen → may lumang `.pc-sound` (mute button ng video, `position:absolute`) → bagong pangalan `.pc-music` at `.pc-soundpick` (`post-card.js`, `post-composer.js`, `posts.css`)
- 2026-10-24 · TigoMeNote Sounds (test): umaabot sa 1.9 ang lakas (nagka-crack) → idinagdag ang limiter at hininaan ang master (`sounds.js`)

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(replace(replace(brain_notes.body, $v$| `explore.html` | app/ | Explore: status, feed na may reactions/comments/share, hanap ng tao | oo |
| `share.html` | app/ | Share: camera / video / files → Gallery (+ "I-post din") | oo |
| `messages.html` | app/ | Tigo Messenger: chats, groups, requests (sa APK: bubuksan ang hiwalay na app) | oo |
$v$, $v$| `explore.html` | app/ | Explore: status, feed na may reactions/comments/share, hanap ng tao | oo |
| `share.html` | app/ | Share: sariling camera na may filters + auto sound → Gallery (+ Save & post) | oo |
| `messages.html` | app/ | Tigo Messenger: chats, groups, requests (sa APK: bubuksan ang hiwalay na app) | oo |
$v$), $v$| `components/photo-editor.js` | Crop, rotate, flip, adjust, filters |
| `components/weather.js` | Weather card + auto location |
$v$, $v$| `components/photo-editor.js` | Crop, rotate, flip, adjust, filters |
| `filters.js` | Iisang listahan ng 13 libreng filters + `draw()` (`TMN_FILTERS`) |
| `components/camera.js` | Sariling camera: live filters, photo, video ≤15 s (`TMN_CAMERA`) |
| `sounds.js` | TigoMeNote Sounds: music na gawa sa device, auto-pick, ♪ chip (`TMN_SOUNDS`) |
| `components/sound-picker.js` / `capture-review.js` | Pumili ng sound + Sound row (`TMN_SOUND_PICK`); review pagkakuha (`TMN_REVIEW`) |
| `components/weather.js` | Weather card + auto location |
$v$), $v$| `components.css` | Buttons, inputs, cards, badges, toast, segmented |
| `posts.css` | Composer, post tiles, post viewer, queue list |
| `social.css` | Feed cards, status, comments at social sheets |
$v$, $v$| `components.css` | Buttons, inputs, cards, badges, toast, segmented |
| `posts.css` | Composer, post tiles, post viewer, queue list, ♪ chip |
| `camera.css` / `sounds.css` | Camera + review; sound picker at Sound row |
| `social.css` | Feed cards, status, comments at social sheets |
$v$), $v$
`posts` ay may `pinned_at` (hanggang 3) at `view_count` (sql/020). Function: `record_post_views()` (service_role lang).

$v$, $v$
`posts` ay may `pinned_at` (hanggang 3) at `view_count` (sql/020), at `sound` (sql/035). Function: `record_post_views()` (service_role lang).

$v$), updated_by = 'claude', updated_at = now();
