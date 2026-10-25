-- TigoMeNote · 070 · vault sync: #47 photo, dance, realistic outfits — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Tigo$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(brain_notes.body, $v$
## Bahay (`room.js`, `furniture.js`, `room-ui.js`)
$v$, $v$
## 📸 Photo at 💃 Dance (`photo.js`, `pet-scene.js`)
- 📸 Photo: `sc.snapshot()` (≥1080px) + frame (pangalan, level, petsa, bisita, TigoMeNote) → ⬇ Save · ↗ Share · 📤 Share to Explore (lazy-load ng post-composer). Pagka-level up: 📸 → 🎉 Lv N (banner na "Level N!").
- 💃 Dance → 🪩 Groove · 🕺 Budots · 🤖 Robot (`sc.dance(kind)`, 5 s). Sasabay ang bisita at buddy; naglakad = tigil.
- Hawak: kamao ng kanang braso (`anchors.hand`), laging patayo; `userData.tick(t, walk)` sa outfit = wagayway/ugoy.

## Bahay (`room.js`, `furniture.js`, `room-ui.js`)
$v$), $v$## Hindi pa na-test
- Camera/bahay (test_house 32/32, mock): hindi pa nasubukan sa totoong phone ang dalawang joystick nang sabay, bilis ng 3D sa loob ng bahay na maraming gamit, at ang "room" sa totoong server.
$v$, $v$## Hindi pa na-test
- Photo/Dance (mock): hindi pa nasubukan ang Share to Explore hanggang sa totoong upload, ang ↗ Share sa totoong phone/APK, ang litrato na may totoong bisita (pangalan sa frame), at bilis ng mas mataas na resolution sa mahinang phone.
- Camera/bahay (test_house 32/32, mock): hindi pa nasubukan sa totoong phone ang dalawang joystick nang sabay, bilis ng 3D sa loob ng bahay na maraming gamit, at ang "room" sa totoong server.
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Files:** `tigo/camera-rig.js`, `tigo/pet-scene.js` (sit, standUp, pose, setSize), `tigo/room.js` (seatNear), `tigo/furniture.js` (seat), `tigo/controls.js`, `pages/tigo.js`, `app/tigo.html`, `css/pages/tigo.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.17)
- **Paano:** Overlap test (test_layout) 114/114 kasama ang Sit, Sleep at size bar sa portrait, landscape at desktop.$v$, $v$- **Files:** `tigo/camera-rig.js`, `tigo/pet-scene.js` (sit, standUp, pose, setSize), `tigo/room.js` (seatNear), `tigo/furniture.js` (seat), `tigo/controls.js`, `pages/tigo.js`, `app/tigo.html`, `css/pages/tigo.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.17)
- **Paano:** Overlap test (test_layout) 114/114 kasama ang Sit, Sleep at size bar sa portrait, landscape at desktop.

## 2026-10-25 · #47 Mas totoong damit, bag at alaga · totoong hawak · 📸 Photo + Share · 💃 Dance (3 sayaw)
- **Ano:**
  - **Damit at bag:** Backpack na may flap, bulsa, zipper, hawakan at buckle; ang strap ay dumadaan sa ibabaw ng balikat at nakadikit sa katawan (wala nang "patpat" na lumalampas sa paa). Hoodie na bumabalot hanggang balikat (hood sa likod, zipper, tali, bulsa). Cape na nakasabit sa balikat at umuugoy kapag naglalakad.
  - **Totoong hawak:** ang braso ay may balikat at kamao; ang hawak ay dumadaan sa kamao at laging patayo kahit gumagalaw ang braso. Ang flag ay wumawagayway, ang lobo ay umuugoy, ang payong ay may J na hawakan at 8 tela.
  - **Alaga:** aso at pusa na may nguso, 4 na paang gumagalaw kapag naglalakad, kwelyo at gintong tag; pusa may balbas at guhit; kuneho may malalaking paa sa likod.
  - **📸 Photo:** sa menu (phone/landscape) at sa gilid (desktop). Flash, tapos litrato (≥1080px) na may pangalan, level, petsa, "with (bisita)", "at home" at TigoMeNote. Preview: ⬇ Save · ↗ Share (share ng phone, kung meron) · 📤 Share to Explore (bubukas ang New post na may litrato at caption). Gumagana sa labas, sa loob ng bahay at kahit may bisita.
  - **Level up:** ang 📸 ay nagiging **🎉 Lv N** (mga 45 s) → litrato na may "🎉 Level N!" na banner, pang-share.
  - **💃 Dance:** pindot → 3 sayaw: 🪩 Groove, 🕺 Budots, 🤖 Robot (5 s, may confetti; sasabay ang bisita at buddy; gumagana rin sa loob ng bahay). Naglakad = tigil sayaw.
- **Bakit:** Ayon kay Bench: "medyo real, para di pangit tingnan", "ung pag hawak ng flag… dapat real na hawak", "mag lagay kadin ng tap to photo… pwede top to share para sa explore… pag ng level pwede sya i share" at "dance botton… pag click ng botton me 3 bottons pwede mag dance".
- **Files:** `tigo/pet-model.js`, `tigo/outfit.js`, `tigo/buddies.js`, `tigo/pet-scene.js` (snapshot, dance), `tigo/photo.js` (bago), `pages/tigo.js`, `app/tigo.html`, `css/pages/tigo.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.18)
- **Paano:** Ang post maker (composer, sounds, emoji) ay ini-load lang kapag pinindot ang Share to Explore, kaya hindi bumibigat ang Tigo page. test_photo 18/18; test_layout 139/139 (may 💃 row, sa loob ng bahay, portrait, landscape, desktop); test_tigo 41/41, test_house 33/33, test_games 10/10, test_posts 41/41.
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| `tigo/room.js` / `furniture.js` / `room-ui.js` | Loob ng bahay (dingding, sahig, banggaan) · mga gamit sa 3D · Decorate panel |
| `tigo/voice.js` / `talk.js` | Boses-baby ni Tigo (synth o speech), game sounds, speech bubble, Sound settings |
$v$, $v$| `tigo/room.js` / `furniture.js` / `room-ui.js` | Loob ng bahay (dingding, sahig, banggaan) · mga gamit sa 3D · Decorate panel |
| `tigo/photo.js` | 📸 litrato ni Tigo (frame, Save, Share, Share to Explore) + level-up share |
| `tigo/voice.js` / `talk.js` | Boses-baby ni Tigo (synth o speech), game sounds, speech bubble, Sound settings |
$v$), updated_by = 'claude', updated_at = now();
