-- TigoMeNote · 067 · vault sync: #43 Tigo camera at bahay, #44 Sound Maker — record lang; napatakbo na
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
- **20 sariling track** na ginagawa ng browser (Web Audio): Sunny Steps, Golden Hour, Night Drive, Island Breeze, Soft Morning, Hype Up, Lofi Notes, City Lights, Family Day, Rain Window, Dreamy, Victory, at **Local**: Pinoy (Harana, Jeepney Ride, Fiesta, Budots Bounce, Boracay Sunset) at Gulf (Khaleeji Nights, Desert Oud, Manama Skyline; hijaz scale, oud, darbuka). Walang audio file, walang download, gumagana offline, **walang copyright issue**.
- Bawat track ay "recipe": tempo, chords, drums, bass, instrument at melody (pareho bawat tugtog). May compressor at limiter para hindi mag-crack sa speaker.
- **Auto-pick:** tinitingnan ang photo/video (liwanag, kulay, init, contrast, kulay na nangingibabaw), oras ng araw at filter → pinakabagay na track. Hal. madilim/gabi → Night Drive; maliwanag at asul → Island Breeze; Mono/Noir → Rain Window.
- **Local sounds:** `TMN_SOUNDS.region()` = `ph` kung Asia/Manila o Filipino ang wika; `gulf` kung Bahrain/Saudi/UAE/Qatar/Kuwait/Oman o Arabic. May dagdag na puntos ang local sa auto-pick (lalabas kapag bagay din sa photo), at may sariling "Local · …" na listahan sa Sounds.
- **Sound picker:** For you (4, may "Best match") + Local + All sounds, preview, lakas ng music, lakas ng sariling tunog ng video, No sound, at **Auto-pick** on/off (naka-save sa device).
- Ang post ay may `sound` lang (id + lakas), hindi audio file. Sa viewer: kusang tumutugtog; sa feed: pindutin ang ♪ chip. Humihinto kapag isinara o umalis sa page.
- Sa video na may sound: ang sariling tunog ng video ay hinihinaan ayon sa pinili (default 40%).

## Sound Maker (sariling tunog)
- Page: Menu → **Sound Maker** (`app/sound-maker.html`). Sa Sounds picker: **🎛️ My sounds** + **＋ Make a sound** (modal).
- Grid 16 hakbang: Kick, Snare, Hi-hat, Clap, Doum, Tak, Bass (sa phone: 1–8 at 9–16). Vibes: Pop, Lofi, Pinoy acoustic, Khaleeji, Trap, House, Calm.
- Music: Happy/Sad/Chill/Arabic (major/minor/dorian/hijaz), key, chords, himig, ayos ng chords, swing, ulan, plaka; 🎲 Bagong himig / Random beat.
- Save (hanggang 30, `sounds-fast`), Edit, Delete, ⬇ WAV (16 s). Id = `u-xxxxxxxx`.
- Sa post/status: `sound = { id, vol, recipe }` (kinukuha ng server ang recipe sa `user_sounds`), kaya tumutugtog sa lahat at kahit burahin.

## Hindi pa / mamaya
- Sikat na kanta (gaya ng TikTok/IG) = kailangan ng lisensya sa record labels (bayad). Puwedeng magdagdag ng royalty-free na audio files mamaya.
- Hindi pa naka-"mix" ang music sa mismong video file; tinutugtog ito habang pinapanood (kaya pareho sa lahat ng device). May `TMN_SOUNDS.render()` na para dito.
- Ang sound ay hindi pa napapalitan pagkatapos i-post (Edit post).

Tingnan din: [[Build - Offline posts]], [[Build - Gallery and albums]], [[Build - Social feed]]
$v$, '{build,share,camera,filters,sounds}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Tigo$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(replace(brain_notes.body, $v$
## Gabi
$v$, $v$
## Camera (`camera-rig.js`, `sky-dome.js`)
- Phone: kaliwang joystick = lakad; kanang joystick = camera (ikot 360°, taas = tingala, baba = mula sa itaas). Sa gilid: ⤒ Jump, 🎥 View (Follow / Top view / Close-up), 🔍 Zoom (normal / malayo / malapit). Pinch = zoom.
- Desktop: hila ng mouse = ikot, wheel = zoom, Q/E = ikot. Ang lakad (joystick/WASD) ay ayon sa direksyon ng camera.
- 3D na langit: ulap at araw (araw), buwan at bituin (gabi at Moon base).

## Bahay (`room.js`, `furniture.js`, `room-ui.js`)
- Pasok: lumakad sa pinto ng bahay kubo, o 🏠 House / 🏠 Go inside. Labas: 🚪 Go outside o lumakad sa pinto ng kwarto.
- Kwarto 6×5 na walang kisame; ang dingding na nakaharang sa camera ay bumababa. May bintana, pinto, doormat at ilaw (mas maliwanag sa gabi).
- 🛠 Decorate: Furniture (19 sa sahig + 7 sa dingding), Walls (9), Floors (6). Tap = ilagay (hanggang 40, 4 bawat uri); hilahin = ilipat; ⟳ ikot 45°; 🗑 itabi. Ang gamit sa dingding ay dumidikit sa pinakamalapit na dingding. Kusang save (pet-fast "room").
- Libre: Bed, Round rug, Plant, Floor lamp, Cream, Wood planks. May galaw: electric fan, isda sa aquarium, wall clock (totoong oras), TV, star lights at lampara sa gabi.

## Gabi
$v$), $v$## Gabi
- Sleep → lalakad si Tigo papasok sa bahay kubo, iilaw ang bintana, Zzz sa bubong. Wake → lalabas at tatalon.

$v$, $v$## Gabi
- Sleep → papasok si Tigo sa bahay at hihiga sa kama (kung walang kama: sa sahig). Wake → babangon sa tabi ng kama.

$v$), $v$## Hindi pa na-test
- Mock lang ang UI (test_tigo 41/41 + test_games: boses, sound settings, Pac-Tigo, Racing; keyboard, joystick, jump, closet/buy, journey, Coin Rush, bahay kubo, sayaw/Hi-5/Habulan/Ikot, full screen, 2D fallback). Hindi pa nasubukan: totoong server (pet-fast v2 na-deploy, wala pang totoong tawag), Gather ng dalawang totoong phone, landscape lock sa totoong phone, at bilis ng 3D sa mahinang phone.
$v$, $v$## Hindi pa na-test
- Camera/bahay (test_house 32/32, mock): hindi pa nasubukan sa totoong phone ang dalawang joystick nang sabay, bilis ng 3D sa loob ng bahay na maraming gamit, at ang "room" sa totoong server.
- Mock lang ang UI (test_tigo 41/41 + test_games: boses, sound settings, Pac-Tigo, Racing; keyboard, joystick, jump, closet/buy, journey, Coin Rush, bahay kubo, sayaw/Hi-5/Habulan/Ikot, full screen, 2D fallback). Hindi pa nasubukan: totoong server (pet-fast v2 na-deploy, wala pang totoong tawag), Gather ng dalawang totoong phone, landscape lock sa totoong phone, at bilis ng 3D sa mahinang phone.
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** Function `posts-fast` v13. Ang preview ay ginagawa sa phone (canvas), walang server na nagre-resize.
$v$, $v$- **Paano:** Function `posts-fast` v13. Ang preview ay ginagawa sa phone (canvas), walang server na nagre-resize.

## 2026-10-24 · #43 Tigo: camera 360° (pangalawang joystick), 3 view, zoom, at loob ng bahay na naaayos
- **Ano:**
  - **Camera:** sa phone, kaliwang joystick = lakad, **kanang joystick = camera** (ikot 360°, taas = tumingala sa langit, baba = tingin mula sa itaas). Sa gilid nito: ⤒ Jump, 🎥 View (Follow → Top view → Close-up) at 🔍 Zoom (normal → malayo, maliit si Tigo → malapit). Dalawang daliri sa screen = pinch zoom. Desktop: hila ng mouse = ikot, wheel = zoom, Q/E = ikot.
  - **Lakad ayon sa camera:** taas ng joystick / W = palayo sa camera, kahit saan nakaharap.
  - **3D na langit:** may ulap at araw sa araw, buwan at kumikislap na bituin sa gabi (makikita kapag tumingala).
  - **Loob ng bahay:** lumakad sa pinto ng bahay kubo (o 🏠 House / 🏠 Go inside) → kwarto na may kama, alpombra, halaman, lampara, bintana at pinto. Ang dingding na nakaharang sa camera ay bumababa (parang dollhouse). 🚪 Go outside o lumakad sa pinto para lumabas.
  - **🛠 Decorate:** 26 na gamit (kama, sofa, mesa, electric fan na umiikot, aquarium na may isda, TV, majlis, banig, piano, wall clock na totoong oras, painting, salamin, star lights, PH/BH banner, atbp.), 9 na dingding (Cream, Sky, Sawali, Starry night…) at 6 na sahig (tabla, tiles, kawayan, marmol…). Tap = ilagay; hilahin para ilipat; ⟳ ikot; 🗑 itabi. Kusang nase-save. May libre (kama, alpombra, halaman, lampara, cream, tabla), ang iba ay may coins/level.
  - **Gabi:** papasok si Tigo sa bahay, hihiga sa kama (bukas ang lampara at star lights).
- **Bakit:** Ayon kay Bench: "touch ko padin ung screen pag titingnan ko ung langit at na 360… tatlong focus… top view tapos zoom… mapasok ung loob ng bahay, pwede mo design ung loob" at "sa kabila… gawin mong parang joystick me dalawa or tatlong button sa gilid".
- **Files:** `tigo/camera-rig.js`, `tigo/sky-dome.js`, `tigo/room.js`, `tigo/furniture.js`, `tigo/room-ui.js` (bago), `tigo/pet-scene.js`, `tigo/controls.js` (2 joystick, walang swipe-lakad), `tigo/catalog.js` (HOME_ITEMS), `tigo/talk.js`, `pages/tigo.js`, `app/tigo.html`, `css/pages/tigo.css`, `backend/pet-fast.ts` (room, v4), `sql/065-tigo-room.sql`, `lang/fil.js`, `lang/ar.js`
- **Paano:** `pets.room` = { wall, floor, items[{ id, x, z, r }] }; pet-fast "room" ay tumatanggap lang ng pag-aari (o libre sa level), hanggang 40 gamit at 4 bawat uri.

## 2026-10-24 · #44 Sound Maker: gumawa ng sariling tunog
- **Ano:**
  - **Bagong page (Menu → Sound Maker):** grid na 16 hakbang: 🥁 Kick, 👏 Snare, ✨ Hi-hat, 🙌 Clap, 🪘 Doum, 🥢 Tak at 🎸 Bass. Tap = on/off habang tumutugtog, may gumagalaw na playhead. Sa phone, hati sa 1–8 at 9–16 para malaki ang kahon.
  - **Mabilis na simula:** Pop, Lofi, Pinoy acoustic, Khaleeji, Trap, House, Calm. **Music:** Masaya/Malungkot/Chill/Arabic, key, chords (7 instrument), himig (8 + wala), ayos ng chords, swing, ulan, plaka. 🎲 Bagong himig at 🎲 Random beat.
  - **Save** (hanggang 30 bawat user), **Edit**, **Delete** (dalawang tap), **⬇ WAV** (16 segundo).
  - **Sa posts at status:** sa Sounds picker may "🎛️ My sounds" at "＋ Make a sound" (bubukas ang Sound Maker sa loob mismo, hindi nawawala ang ginagawang post). Ang tunog ay tumutugtog sa phone ng ibang tao rin; lalabas din sa 🔥 Trending kapag maraming gumamit.
- **Bakit:** Ayon kay Bench: "merron ba tayo sariling sound invented" → "sunod muna ung sound maker".
- **Files:** `components/sound-maker.js`, `pages/sound-maker.js`, `app/sound-maker.html`, `css/sound-maker.css` (bago), `sounds.js` (ensure, fromRecipe, preview, position), `components/sound-picker.js`, `components/stories.js`, `nav-items.js`, `config.js` (fn sounds, 0.11.15), `app/explore.html`, `gallery.html`, `home.html`, `share.html`, `backend/sounds-fast.ts` (bago, v1), `backend/sound-recipe.ts` (bago), `backend/posts-fast.ts` (v14), `backend/social-fast.ts` (v11), `sql/066-user-sounds.sql`, `lang/fil.js`, `lang/ar.js`
- **Paano:** Recipe lang ang naka-save (walang audio file, tipid sa Free plan). Kapag ginamit sa post/status, kinukuha ng server ang recipe sa `user_sounds` at kinokopya sa `sound` ng post, kaya tumutugtog pa rin kahit burahin ang tunog.$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Keep-warm at reminders cron ay tumatakbo lang kapag kailangan | Tipid sa 500k invocations/buwan ng Free plan |

$v$, $v$| 2026-10-24 | Keep-warm at reminders cron ay tumatakbo lang kapag kailangan | Tipid sa 500k invocations/buwan ng Free plan |
| 2026-10-24 | Tigo camera sa phone: kanang joystick + Jump/View/Zoom; isang daliri sa screen = tap lang | Ayon kay Bench; iwas aksidenteng ikot habang naglalakad |
| 2026-10-24 | Loob ng bahay = hiwalay na kwarto (6×5) sa parehong scene, walang kisame, bumababa ang dingding na nakaharang | Parang dollhouse; kita ang loob mula sa kahit anong anggulo |
| 2026-10-24 | Ayos ng bahay sa `pets.room` (jsonb), walang bagong table | Isang row bawat user; validated ng pet-fast |
| 2026-10-24 | Sound Maker = recipe (JSON) na tinutugtog ng device, hindi audio file | Walang storage/egress; pareho ang tunog sa lahat ng device |
| 2026-10-24 | Recipe ng sariling tunog ay kinokopya sa post/status (galing sa server, hindi sa browser) | Tumutugtog kahit burahin; hindi madadaya ang pangalan/may-ari |

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(replace(replace(replace(replace(brain_notes.body, $v$| `share.html` | app/ | Share: sariling camera na may filters + auto sound → Gallery (+ Save & post) | oo |
| `messages.html` | app/ | Tigo Messenger: chats, groups, requests (sa APK: bubuksan ang hiwalay na app) | oo |
$v$, $v$| `share.html` | app/ | Share: sariling camera na may filters + auto sound → Gallery (+ Save & post) | oo |
| `sound-maker.html` | app/ | Sound Maker: gumawa ng sariling beat/tunog, listahan ng My sounds | oo |
| `messages.html` | app/ | Tigo Messenger: chats, groups, requests (sa APK: bubuksan ang hiwalay na app) | oo |
$v$), $v$| `stickers.js` | 20 sariling TigoMeNote stickers na SVG (`TMN_STICKERS`) |
| `components/sound-picker.js` / `capture-review.js` | Pumili ng sound + Sound row (`TMN_SOUND_PICK`); review pagkakuha (`TMN_REVIEW`) |
| `components/weather.js` | Weather card + auto location |
$v$, $v$| `stickers.js` | 20 sariling TigoMeNote stickers na SVG (`TMN_STICKERS`) |
| `components/sound-picker.js` / `capture-review.js` | Pumili ng sound + Sound row (`TMN_SOUND_PICK`, may My sounds); review pagkakuha (`TMN_REVIEW`) |
| `components/sound-maker.js` | Sound Maker editor (`TMN_SOUND_MAKER`: mount, open, mine) |
| `components/weather.js` | Weather card + auto location |
$v$), $v$| `tigo/catalog.js` / `outfit.js` / `backdrops.js` / `buddies.js` | Closet items, isinusuot sa 3D, mga lugar + bahay kubo, maliliit na alaga |
| `tigo/controls.js` / `coin-game.js` / `pac-game.js` / `race-game.js` | WASD/arrows + Space, joystick, swipe · Coin Rush · Pac-Tigo · Tigo Racing |
| `tigo/voice.js` / `talk.js` | Boses-baby ni Tigo (synth o speech), game sounds, speech bubble, Sound settings |
$v$, $v$| `tigo/catalog.js` / `outfit.js` / `backdrops.js` / `buddies.js` | Closet items, isinusuot sa 3D, mga lugar + bahay kubo, maliliit na alaga |
| `tigo/controls.js` / `coin-game.js` / `pac-game.js` / `race-game.js` | WASD/arrows + Space, 2 joystick (lakad + camera) · Coin Rush · Pac-Tigo · Tigo Racing |
| `tigo/camera-rig.js` / `sky-dome.js` | Camera: 360°, tingala, Follow/Top/Close-up, zoom · 3D na langit (ulap, araw, buwan, bituin) |
| `tigo/room.js` / `furniture.js` / `room-ui.js` | Loob ng bahay (dingding, sahig, banggaan) · mga gamit sa 3D · Decorate panel |
| `tigo/voice.js` / `talk.js` | Boses-baby ni Tigo (synth o speech), game sounds, speech bubble, Sound settings |
$v$), $v$| `daily-fast` | list, save, remove, done, snooze; due (cron bawat minuto, key `cron_daily`) | `backend/daily-fast.ts` + `webpush.ts` |
| `pet-fast` | get, act (feed/play/clean/pet/sleep/wake/daily), style, wear, buy, game (coins/pac/race), nearby, gather, visits | `backend/pet-fast.ts` + `webpush.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
$v$, $v$| `daily-fast` | list, save, remove, done, snooze; due (cron bawat minuto, key `cron_daily`) | `backend/daily-fast.ts` + `webpush.ts` |
| `pet-fast` | get, act (feed/play/clean/pet/sleep/wake/daily), style, wear, buy, game (coins/pac/race), nearby, gather, visits, room | `backend/pet-fast.ts` + `webpush.ts` |
| `sounds-fast` | mine, save, remove (Sound Maker) | `backend/sounds-fast.ts` + `moderation.ts` + `sound-recipe.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
$v$), $v$
Ang `moderation.ts` (text filter) ay kasama sa deploy ng posts-fast, social-fast, profile-fast at auth-fast. Ang `notify.ts` ay kasama sa deploy ng posts-fast, social-fast at moderation-fast.

$v$, $v$
Ang `moderation.ts` (text filter) ay kasama sa deploy ng posts-fast, social-fast, profile-fast at auth-fast. Ang `notify.ts` ay kasama sa deploy ng posts-fast, social-fast at moderation-fast. Ang `sound-recipe.ts` ay kasama sa posts-fast, social-fast at sounds-fast.

$v$), $v$| `reminders` | Daily reminders at alarms (oras, ulit, sent/done) | `sql/050-daily-reminders.sql` |
| `pets` / `pet_meets` | si Tigo ng bawat user (stats, XP, style, coins, owned, outfit, near_*) at ang mga Gather | `sql/052-tigo-pets.sql`, `sql/055-tigo-closet.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
$v$, $v$| `reminders` | Daily reminders at alarms (oras, ulit, sent/done) | `sql/050-daily-reminders.sql` |
| `pets` / `pet_meets` | si Tigo ng bawat user (stats, XP, style, coins, owned, outfit, room, near_*) at ang mga Gather | `sql/052-tigo-pets.sql`, `sql/055-tigo-closet.sql`, `sql/065-tigo-room.sql` |
| `user_sounds` | Sound Maker: recipe ng sariling tunog (hanggang 30 bawat user) | `sql/066-user-sounds.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
$v$), updated_by = 'claude', updated_at = now();
