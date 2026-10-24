# Build - Background and music

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
