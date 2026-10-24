-- TigoMeNote · 047 · vault sync: #33 Explore post + media viewer — record lang; napatakbo na
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
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Explore activity$v$, $v$# Build - Explore activity

Explore post na parang Komoot: ang nilakbay mo sa mapa (Start → Finish), may photos/videos at stats. Kasama rin dito ang buong-screen na viewer ng photo/video.

## Paano gumawa
- Explore → **Create** → **Explore** (o Share → **Explore** tile).
- Route:
  - **Record now** (`activity-recorder.js`): GPS (`watchPosition`, mataas na accuracy). Hindi kinukuha ang point kapag ±40 m pataas ang accuracy o hindi pa gumagalaw (≥4 m). Pause/Resume/Finish/Discard. Naka-save sa `localStorage` (`tmnTrack`) habang nagre-record, kaya puwedeng ituloy kahit ma-refresh. Wake Lock para hindi mag-lock ang screen.
  - **Import GPX**: `trkpt` / `rtept` / `wpt`, may `ele` at `time` kung meron. Pangalan ng track = pamagat.
  - **From my location history**: `safety-fast` → `history` (sariling location, hanggang 30 araw), sinasala ayon sa araw at oras.
- Detalye: uri (Hike, Walk, Run, Bike ride, Drive, Trip), pamagat, oras kung walang time sa GPX, photos/videos (hanggang 10, hindi required).
- Tuloy sa post composer (caption, sino ang makakakita, schedule) → offline queue → `posts-fast` `createPost` na may `activity`. Walang photo = hindi na tinatawag ang `createUpload`.

## Data
- `posts.activity` (jsonb, sql/046): `{ type, title, route: [[lat,lng,ele]], stats: { dist_m, dur_s, up_m, down_m }, start_at }`.
- Ang route ay pinapaikli sa browser (Douglas–Peucker, ≤800 points); ang server ay tumatanggap ng ≤1000, nagra-round sa 5 decimal, at kinukuwenta ulit ang distance.
- Elevation gain: binibilang lang ang pagbabago na ≥3 m (iwas ingay ng GPS).

## Itsura
- Feed card: "<pangalan> went for a hike", pamagat, caption, stats, photos + maliit na mapa sa sulok (o mapa lang kung walang photo).
- Static na mapa (`TMN_ROUTE.svg`): OpenStreetMap tiles + guhit, berdeng Start at pulang Finish, "© OpenStreetMap".
- Profile grid: mapa ang tile kung walang photo, may 🗺 sa sulok. Post viewer: pamagat, stats, at mapa.

## Buong-screen na viewer (`media-viewer.js`)
- Tap sa photo/video (feed, post viewer) o sa mapa → `TMN_VIEWER.open(items, index)`.
- Buo ang photo/video (`object-fit: contain`), itim ang likod, **X** sa itaas (46px). Swipe o ← → para sa susunod, Esc o Back ng phone = sara (`history.pushState`).
- Double-tap sa feed ay ❤️ pa rin (hinihintay ng 280 ms bago buksan ang viewer).
- Mapa: Leaflet (zoom/drag); kung offline, ang static na mapa ang makikita.

## Hindi pa na-test
- Lahat ay mock (34/34 sa test_activity). Hindi pa nasubukan: totoong GPS habang naglalakad, totoong OSM tiles at Leaflet (hindi abot ng test sandbox), totoong GPX mula Komoot/Strava, at pag-post sa totoong server.
- Sa browser, tumitigil ang GPS kapag naka-lock ang phone o nasa ibang app. Sa APK, kailangan ng native na background recording para dito (wala pa).

Tingnan din: [[Build - Social feed]], [[Build - Safety and wellbeing]], [[System map]]
$v$, '{}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Na-test (mock):** 1366×768 → post 670px; 1280×720 → 622px; phone 390×844 → 682px (lahat kasya).
$v$, $v$- **Na-test (mock):** 1366×768 → post 670px; 1280×720 → 622px; phone 390×844 → 682px (lahat kasya).

## 2026-10-24 · #33 Explore post (parang Komoot) + buong-screen na photo/video na may X
- **Ano:**
  - **Create** button sa Explore: **Status**, **Post** o **Explore**. May "Explore" tile din sa Share.
  - **Explore post:** ang daan mo sa mapa (Start → Finish), may photos/videos at stats (Time, Distance, Speed, Elevation), parang Komoot. Saan galing ang route: **Record now** (GPS habang naglalakad/tumatakbo/nagba-bike; naka-save sa device habang nagre-record), **Import GPX** (Komoot, Strava, Garmin, Google), o **From my location history** (Safety, 30 araw). Uri: Hike, Walk, Run, Bike ride, Drive, Trip. Puwedeng walang photo (mapa lang).
  - Sa feed: "Maria went for a hike", pamagat, stats, photos, at maliit na mapa sa sulok; mapa lang kung walang photo.
  - **Buong-screen na tingin:** tap sa photo o video (feed, profile, post viewer) = lumalaki sa buong screen, buo at tamang laki, may **X** sa itaas para isara. Swipe o ← → para sa susunod; Esc o Back ng phone = sara. Tap sa maliit na mapa = buong mapa (zoom/drag).
- **Bakit:** Ayon kay Bench: "sa explore dapat merron akong option kung stories/post/explore, ang posting pag explore parang komoot, pwede mag lagay ng picture tapos ung map ng nilakbay… pag click ko lalaki sya para sa view tapos lagyan mo nalang ng x para close same sa video".
- **Files:** `sql/046-explore-activity.sql`, `backend/posts-fast.ts` (v12), `assets/js/route.js` (bago), `components/media-viewer.js` (bago), `components/activity-recorder.js` (bago), `components/activity-composer.js` (bago), `components/create-menu.js` (bago), `components/post-card.js`, `components/post-viewer.js`, `components/post-composer.js`, `post-queue.js`, `pages/explore.js`, `pages/share.js`, `app/explore.html`, `app/share.html`, `app/profile.html`, `app/messages.html`, `app/notifications.html`, `assets/css/activity.css` (bago), `components.css`, `pages/explore.css`, `pages/share.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.5)
- **Paano:** Detalye sa [[Build - Explore activity]].
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Label sa circle ("Sino siya sa iyo") ay pribado: bawat panig may sariling label | Iba ang tawag ng anak sa magulang at ng magulang sa anak; walang ibang nakakakita |

$v$, $v$| 2026-10-24 | Label sa circle ("Sino siya sa iyo") ay pribado: bawat panig may sariling label | Iba ang tawag ng anak sa magulang at ng magulang sa anak; walang ibang nakakakita |
| 2026-10-24 | Explore post: route sa `posts.activity` (jsonb, ≤800 points), kinukuwenta ulit ng server ang layo | Isang table lang (walang bagong table), mabilis i-load sa feed, hindi madadaya ang distance |
| 2026-10-24 | Static na mapa sa feed = SVG (OSM tiles + guhit); interactive (Leaflet) lang kapag binuksan | Mabilis ang feed kahit maraming route; hindi gumagawa ng maraming Leaflet map |
| 2026-10-24 | GPS recording sa browser: kailangang bukas ang screen (Wake Lock) | Pinapatigil ng browser ang GPS kapag naka-lock; sa APK, ang location history (Safety) ang puwedeng gamitin |

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(brain_notes.body, $v$| `components/stories.js` | Status / stories (`TMN_STORIES`) |
| `components/image-cropper.js` | Crop ng larawan bago i-upload (`TMN_CROPPER`) |
$v$, $v$| `components/stories.js` | Status / stories (`TMN_STORIES`) |
| `components/media-viewer.js` | Buong-screen na photo/video/mapa na may X, swipe, Esc, Back (`TMN_VIEWER`) |
| `route.js` | Route ng Explore post: stats, GPX, static na mapa (SVG), Leaflet na mapa (`TMN_ROUTE`) |
| `components/activity-recorder.js` | I-record ang nilakbay gamit ang GPS (`TMN_TRACK`) |
| `components/activity-composer.js` | Explore post: route (Record/GPX/history) + photos + stats (`TMN_ACTIVITY`) |
| `components/create-menu.js` | "Create": Status / Post / Explore (`TMN_CREATE`) |
| `components/image-cropper.js` | Crop ng larawan bago i-upload (`TMN_CROPPER`) |
$v$), $v$| `email_codes` | 6-digit codes (hash lang), purpose `verify` o `reset` | `sql/007-email-verify.sql` |
| `posts` | caption, visibility, `publish_at` (schedule), `client_id` (walang doble) | `sql/013-posts.sql` |
| `post_media` | photos/videos ng post (path sa bucket) | `sql/013-posts.sql` |
$v$, $v$| `email_codes` | 6-digit codes (hash lang), purpose `verify` o `reset` | `sql/007-email-verify.sql` |
| `posts` | caption, visibility, `publish_at` (schedule), `client_id` (walang doble), `activity` (Explore route + stats) | `sql/013-posts.sql`, `sql/046-explore-activity.sql` |
| `post_media` | photos/videos ng post (path sa bucket) | `sql/013-posts.sql` |
$v$), updated_by = 'claude', updated_at = now();
