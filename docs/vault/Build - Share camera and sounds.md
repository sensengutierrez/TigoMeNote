---
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
