-- TigoMeNote · 038 · vault sync: #28 chat photo, invites, emoji/stickers, Local sounds — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Messenger$v$, $v$---
tags: [build, messenger, chat]
updated: 2026-10-24
---
# Build - Messenger

**What it does:** **Tigo Messenger**: 1:1 at group chat, text, photo, location (may mapa at Directions), reactions, pin (hal. location sa itaas ng chat), Seen, "typing…", Message requests, unsend, report, mute. Sa web: nasa loob ng TigoMeNote (Messages). Sa phone (APK): **hiwalay na app** na Tigo Messenger.

**Page:** `app/messages.html` (Messages sa menu; may bilang ng bago) · links: `messages.html?c=<chat>` at `messages.html?to=<user>` (galing sa **Message** button sa profile ng iba)
**Code:** `assets/js/pages/messages.js` (inbox, Chats/Requests, search, APK gate), `components/chat-view.js` (isang chat), `components/chat-new.js` (bagong chat/group, pumili ng tao), `realtime.js` (live ping), `native-bridge.js` (`messenger`), `notif-badge.js` (bilang), `components/notif-settings.js` (Messages setting)
**Styles:** `assets/css/pages/messages.css`
**Server:** `messages-fast` v2 (+ `moderation.ts`), `notify-fast` v2 (`pushRaw`), `moderation-fast` v3 (report ng message)
**SQL:** `sql/033-messages.sql` (napatakbo na): `conversations`, `conversation_members`, `messages`, `message_reactions`, `notif_prefs.messages`, report type `message`, private bucket `chat-media`

## Sino ang puwedeng mag-message
- Kahit sino, pero kung **hindi ka nila fina-follow** (o wala ka sa Family/Friends nila), mapupunta muna sa **Requests**. Doon: Accept, Delete o Report. Ang pag-reply = pagtanggap.
- **Teen (13–17):** mutual followers at Family/Friends lang (pareho sa pagpapadala at pagtanggap).
- Group: 3–50 tao; ang gumawa ang admin. Admin: Add people, Remove, Pin. Lahat: Rename, Mute, Leave (kapag umalis ang huling admin, may bagong admin).
- Lahat ng text ay dumadaan sa text filter (block/flag) at sa teen rules (bawal ang phone, email, ibang app).

## Emoji at stickers
- **Emoji picker** (`components/emoji-picker.js`): ☺ button sa chat, comments at caption. Tabs: Recent, ✨ New (Unicode 14–16), Smileys, People, Hearts, Animals, Food, Activities, Travel, Objects, Flags. Naaalala ang huling ginamit (sa device).
- **Hindi na kahon:** Noto Color Emoji (Google Fonts) ang fallback na font sa bawat page.
- **Reactions:** 6 na mabilis + **(+)** para sa kahit anong emoji (server: isang emoji lang, `isEmoji`).
- **Stickers** (`stickers.js`): 20 "Tigo" stickers na SVG; message `kind = 'sticker'`, `body` = sticker id. Walang upload; walang text filter (fixed ang laman).

## Paano gumagana
- **Live:** Supabase Realtime (broadcast) sa lihim na channel bawat chat (`channel_key`). "Ping" lang ang dumadaan (walang laman ng message); ang browser ang kumukuha sa server. "typing…" ay diretso sa channel. Kapag hindi konektado: poll bawat 4 s habang bukas ang chat.
- **Iwas loop:** ang "read" ping ay ipinapadala lang kapag may bagong nabasa; hindi pinapansin ng browser ang sariling "read" at may 3 s na pagitan. Ang link ng photo ay hindi pinapalitan bawat refresh (para hindi mag-reload ang larawan).
- **Seen:** `last_read_at` bawat member. DM: "Seen"/"Sent"; group: "Seen by N" / "Seen by everyone".
- **Photo:** compress (gaya ng posts), signed upload sa `chat-media`, signed URL (1 oras).
- **Location:** kasalukuyang GPS (may tanong muna), card na may **View map** (Leaflet) at **Directions**. Puwedeng i-**pin** para laging nasa itaas.
- **Push:** bawat message (hindi naka-save sa Notifications), sinusunod ang **Messages** setting, Pause all, Sleep mode at Mute ng chat. Hindi lumalabas kung nakabukas na ang chat na iyon.

## Tigo Messenger sa APK (hiwalay na app)
- Sa **TigoMeNote APK**, ang Messages ay hindi nagbubukas ng chat: tinitingnan kung naka-install ang **Tigo Messenger** (`TMN_APP.hasApp("messenger")`). Kung oo → `openApp("messenger", "?c=…")`; kung hindi → **Install Tigo Messenger** (`installApp`, Play Store).
- Ang **Tigo Messenger APK** ay parehong web code (`app/messages.html`) na may `TMN_APP.appName = "messenger"`; parehong account (session token).
- Push sa APK: FCM (kapag may Firebase project na), papunta sa Tigo Messenger app.

## Hindi pa na-test
- Lahat ay naka-mock (60/60 messenger: desktop, phone, Arabic, APK gate). Hindi pa nasubukan sa totoong server: pagpapadala, real-time (Realtime broadcast gamit ang publishable key), push ng message, Seen, requests at teen rules.
- Wala pang APK (Tigo Messenger at FCM).

Tingnan din: [[Build - Notifications]], [[Build - Moderation and policies]], [[System map]]
$v$, '{build,messenger,chat}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Safety and wellbeing$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$Tingnan din: [[Plan - Safety, family and wellbeing]], [[System map]], [[Decisions]]
$v$, $v$Tingnan din: [[Plan - Safety, family and wellbeing]], [[System map]], [[Decisions]]

## Invites (Family/Friends) — 2026-10-24
- Ang in-invite mo ay nasa listahan na agad ng Family/Friends ("Invite sent · waiting for them to accept", **Cancel invite**), kasama sa bilang. Ang listahan ay nasa itaas ng mapa.
- Ang inimbitahan: **notification** (`circle_invite`) na may **Accept/Decline** sa Notifications, bukod sa push. Pagtanggap: notification sa nag-invite (`circle_accept`). Nabubura ang invite notification kapag tinanggap, tinanggihan o kinansela.
- Ang SOS ay napupunta lang sa **tinanggap** na Family/Friends.
$v$), updated_by = 'claude', updated_at = now();
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

## Hindi pa / mamaya
- Sikat na kanta (gaya ng TikTok/IG) = kailangan ng lisensya sa record labels (bayad). Puwedeng magdagdag ng royalty-free na audio files mamaya.
- Hindi pa naka-"mix" ang music sa mismong video file; tinutugtog ito habang pinapanood (kaya pareho sa lahat ng device). May `TMN_SOUNDS.render()` na para dito.
- Ang sound ay hindi pa napapalitan pagkatapos i-post (Edit post).

Tingnan din: [[Build - Offline posts]], [[Build - Gallery and albums]], [[Build - Social feed]]
$v$, '{build,share,camera,filters,sounds}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** Detalye: [[Build - Share camera and sounds]].
$v$, $v$- **Paano:** Detalye: [[Build - Share camera and sounds]].

## 2026-10-24 · #28 Chat photo fix, Family/Friends invite, emoji + stickers, Local sounds
- **Ano:**
  - **Chat photo:** hindi na blangko ang photo sa chat (at hindi na walang laman ang viewer). Kung hindi ma-load: "Tap to reload".
  - **Family/Friends:** ang in-invite mo ay lumalabas na agad sa listahan ("Invite sent · waiting for them to accept" + Cancel invite) at nasa itaas na ang listahan (bago ang mapa). Ang inimbitahan ay may **notification** na may Accept/Decline; may notification din kapag tinanggap.
  - **Emoji:** may emoji picker na sa chat, comments at caption: pinakabagong emoji (✨ New: 🫩 🐦‍🔥 🍋‍🟩 🫨 🩷 …), Recent, at mga watawat (🇵🇭 🇧🇭 …). Hindi na "kahon" ang bagong emoji (Noto Color Emoji na font sa bawat page). Puwede nang mag-react ng kahit anong emoji (+).
  - **Stickers:** 20 sariling TigoMeNote stickers ("Tigo" na note na may mukha): Hello po!, Salamat!, Ingat!, Kain na!, Mabuhay!, Yalla!, Shukran, atbp.
  - **Sounds:** 8 bagong Local sounds. Pinoy: Harana, Jeepney Ride, Fiesta, Budots Bounce, Boracay Sunset. Gulf: Khaleeji Nights, Desert Oud, Manama Skyline. May "Local · Philippines/Gulf" sa Sounds, at mas pinipili ng auto-pick ang local (ayon sa time zone at wika ng device).
- **Bakit:** Ayon kay Bench: "me mga bagong sound ba, minsan kung local sample Philippines, me bug pa sa message at ung emoticons minsan box lang, dapat merron tayo sticker at latest emoticons", at "me prob din sa SOS ung friends or add family di lumilitaw".
- **Files:** `backend/messages-fast.ts` (v2), `backend/safety-fast.ts` (v4), `sql/037-stickers-circle-notifs.sql`, `assets/js/components/chat-view.js`, `emoji-data.js` (bago), `stickers.js` (bago), `components/emoji-picker.js` (bago), `components/social-ui.js`, `components/post-composer.js`, `sounds.js`, `components/sound-picker.js`, `pages/safety.js`, `pages/notifications.js`, `icons.js` (smile), `app/safety.html`, `app/*.html` (font + scripts), `assets/css/tokens.css`, `components.css`, `posts.css`, `sounds.css`, `pages/messages.css`, `pages/safety.css`, `pages/notifications.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.0)
- **Paano:** Detalye: [[Build - Messenger]] (stickers, emoji), [[Build - Safety and wellbeing]] (invite), [[Build - Share camera and sounds]] (Local sounds).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Teen: bawal ang phone, email, address at ibang chat app sa post/comment/bio | Proteksyon laban sa grooming at pribadong usapan sa labas ng app |
| 2026-10-24 | Sounds = **sariling music na ginagawa sa device** (Web Audio), hindi sikat na kanta | Libre, offline, walang copyright; ang hit songs ay kailangan ng bayad na lisensya |
$v$, $v$| 2026-10-24 | Teen: bawal ang phone, email, address at ibang chat app sa post/comment/bio | Proteksyon laban sa grooming at pribadong usapan sa labas ng app |
| 2026-10-24 | Stickers = sariling "Tigo" stickers na gawa sa SVG sa code (walang character ng iba) | Libre, walang copyright, maliit (id lang ang naka-save) |
| 2026-10-24 | Emoji font: Noto Color Emoji (Google Fonts) bilang fallback | Pareho at kumpleto ang emoji kahit lumang Windows; dina-download lang ang emoji na ginamit |
| 2026-10-24 | Local sounds ayon sa time zone at wika ng device (hindi GPS) | Walang hinihinging permiso; Pinas = Asia/Manila o Filipino, Gulf = Bahrain/Saudi/UAE/… o Arabic |
| 2026-10-24 | Sounds = **sariling music na ginagawa sa device** (Web Audio), hindi sikat na kanta | Libre, offline, walang copyright; ang hit songs ay kailangan ng bayad na lisensya |
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- 2026-10-24 · TigoMeNote Sounds (test): umaabot sa 1.9 ang lakas (nagka-crack) → idinagdag ang limiter at hininaan ang master (`sounds.js`)

$v$, $v$- 2026-10-24 · TigoMeNote Sounds (test): umaabot sa 1.9 ang lakas (nagka-crack) → idinagdag ang limiter at hininaan ang master (`sounds.js`)
- 2026-10-24 · Chat: blangko ang photo at walang laman ang viewer → loop: bawat `open` ay nagpi-ping ng "read" → lahat ng bukas na chat (pati sarili) ay nagre-reload → bagong signed URL bawat reload kaya hindi natatapos mag-load ang larawan → "read" ping lang kapag may bagong nabasa (server), hindi pinapansin ang sariling "read" at may 3 s na pagitan (browser), hindi pinapalitan ang link ng photo hangga't hindi malapit mag-expire, at hindi na nire-render kung walang nagbago (`messages-fast.ts`, `chat-view.js`)
- 2026-10-24 · Safety: "hindi lumalabas" ang in-add na Family/Friend → pending pa (hindi pa tinatanggap) at nasa maliit na "Waiting…" sa ilalim ng "No Family yet"; walang notification ang inimbitahan (push lang, kung naka-on) → pending ay nasa listahan na mismo + bilang, listahan bago ang mapa, at notification na may Accept/Decline (`safety.js`, `safety.html`, `safety-fast.ts`, `notifications.js`, sql/037)
- 2026-10-24 · Emoji na "kahon" (hal. 🫩, 🩷 sa Windows) → walang ganoong emoji ang font ng device → Noto Color Emoji (Google Fonts) sa bawat page at sa `--font-body`; ang preview ng message ay pinuputol na nang hindi nahahati ang emoji (`tokens.css`, `messages-fast.ts`)
- 2026-10-24 · Sound picker: humahaba ang "Best match" sa buong lapad → `justify-self: start` (`sounds.css`)

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(replace(brain_notes.body, $v$| `sounds.js` | TigoMeNote Sounds: music na gawa sa device, auto-pick, ♪ chip (`TMN_SOUNDS`) |
| `components/sound-picker.js` / `capture-review.js` | Pumili ng sound + Sound row (`TMN_SOUND_PICK`); review pagkakuha (`TMN_REVIEW`) |
$v$, $v$| `sounds.js` | TigoMeNote Sounds: music na gawa sa device, auto-pick, ♪ chip (`TMN_SOUNDS`) |
| `emoji-data.js` / `components/emoji-picker.js` | Listahan ng emoji (pati pinakabago) at emoji picker + Stickers tab (`TMN_EMOJI_DATA`, `TMN_EMOJI_PICK`) |
| `stickers.js` | 20 sariling TigoMeNote stickers na SVG (`TMN_STICKERS`) |
| `components/sound-picker.js` / `capture-review.js` | Pumili ng sound + Sound row (`TMN_SOUND_PICK`); review pagkakuha (`TMN_REVIEW`) |
$v$), $v$| `moderation_log` | log ng admin at automatic na block/flag | `sql/026-moderation.sql` |
| `notifications` | activity ng bawat user (reaction, comment, follow, milestone, recap, notice) | `sql/029-notifications.sql` |
| `conversations` / `conversation_members` | chats, members, requests, Seen (`last_read_at`) | `sql/033-messages.sql` |
$v$, $v$| `moderation_log` | log ng admin at automatic na block/flag | `sql/026-moderation.sql` |
| `notifications` | activity ng bawat user (reaction, comment, follow, milestone, recap, notice, Family/Friends invite at accept) | `sql/029-notifications.sql`, `sql/037` |
| `conversations` / `conversation_members` | chats, members, requests, Seen (`last_read_at`) | `sql/033-messages.sql` |
$v$), $v$| `conversations` / `conversation_members` | chats, members, requests, Seen (`last_read_at`) | `sql/033-messages.sql` |
| `messages` / `message_reactions` | messages (text, photo, location, system) at reactions | `sql/033-messages.sql` |
| `notif_prefs` | settings ng notifications (pause, sleep, Off/In app/Push) | `sql/029-notifications.sql` |
$v$, $v$| `conversations` / `conversation_members` | chats, members, requests, Seen (`last_read_at`) | `sql/033-messages.sql` |
| `messages` / `message_reactions` | messages (text, photo, location, sticker, system) at reactions (kahit anong emoji) | `sql/033-messages.sql`, `sql/037` |
| `notif_prefs` | settings ng notifications (pause, sleep, Off/In app/Push) | `sql/029-notifications.sql` |
$v$), updated_by = 'claude', updated_at = now();
