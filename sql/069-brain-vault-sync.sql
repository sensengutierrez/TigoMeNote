-- TigoMeNote · 069 · vault sync: #46 swipe engine, Sit/Sleep/Tayo, laki ni Tigo — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Tigo$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- Phone: joystick (D-pad) = lakad; kanan: ⤒ Jump, 🏃 Run, ✋ Stop, 🎥 Camera (isang button: Follow → Wide → Top → Close-up). Swipe sa gitna = ikot 360° at tingala; pinch = zoom.
- Game UI sa phone: mini stats + menu bar (lahat ng action, « = itago) + sheet para sa Closet/Decorate (▾ minimize, ✕ sara). Landscape = buong screen na laro (sheet sa kanan).
$v$, $v$- Phone: joystick (D-pad) = lakad; kanan: ⤒ Jump, 🏃 Run, ✋ Stop, 🎥 Camera (isang button: Follow → Wide → Top → Close-up). Swipe sa gitna = ikot 360° at tingala; pinch = zoom.
- Swipe: sumusunod ang mundo sa daliri (pababa = langit, pataas = pabalik). Laki ni Tigo: bar na may kulay sa kaliwa (50–130%, naka-save sa device).
- Sa bahay: 🪑 Sit (pinakamalapit na upuan o sahig) at 🛏️ Sleep palit sa Run/Stop; ⬆ Tayo = tumayo / gumising.
- Game UI sa phone: mini stats + menu bar (lahat ng action, « = itago) + sheet para sa Closet/Decorate (▾ minimize, ✕ sara). Landscape = buong screen na laro (sheet sa kanan).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Files:** `app/tigo.html`, `css/pages/tigo.css`, `pages/tigo.js`, `tigo/camera-rig.js`, `tigo/controls.js`, `tigo/pet-scene.js`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.16)
- **Paano:** May overlap test (test_layout: 390×844, 360×740, 844×390, 740×360, desktop) na sinusuri na walang nagpapatong at nasa loob ng screen ang lahat, kasama habang nasa bahay, nagde-decorate, naka-minimize ang sheet at may Closet.$v$, $v$- **Files:** `app/tigo.html`, `css/pages/tigo.css`, `pages/tigo.js`, `tigo/camera-rig.js`, `tigo/controls.js`, `tigo/pet-scene.js`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.16)
- **Paano:** May overlap test (test_layout: 390×844, 360×740, 844×390, 740×360, desktop) na sinusuri na walang nagpapatong at nasa loob ng screen ang lahat, kasama habang nasa bahay, nagde-decorate, naka-minimize ang sheet at may Closet.

## 2026-10-25 · #46 Swipe na parang 3D engine, Sit/Sleep/Tayo sa bahay, at laki ni Tigo
- **Ano:**
  - **Swipe:** ang mundo ay sumusunod sa daliri: swipe pababa = bababa ang mundo at lilitaw ang langit; swipe pataas = pabalik (hanggang tingin mula sa itaas). Tuloy-tuloy, isang swipe sa buong taas ng screen = buong saklaw.
  - **Sa loob ng bahay:** ang 🏃 Run at ✋ Stop ay napapalitan ng **🪑 Sit** (lalakad sa pinakamalapit na upuan, sofa, bean bag o majlis; kung wala, sa sahig) at **🛏️ Sleep** (matutulog sa kama). Kapag nakaupo o nakahiga, ang Jump ay nagiging **⬆ Tayo** (tatayo / gigising). Ang joystick ay nagpapatayo rin kapag nakaupo.
  - **Laki ni Tigo:** patayong bar sa gilid na may kulay (parang status bars): hila pataas = mas malaki, pababa = mas maliit (50%–130%). Gumagana sa loob at labas ng bahay; naka-save sa device.
- **Bakit:** Ayon kay Bench: "pag swipe ko pataas or down dapat ung realword tataas at bababa… parang realtime engine", "pag nasa loob ng bahay ung stop, run at ung jump mapapalitan ng sit, sleep sa bed… jump, matatayo sya" at "pwede sya liitan… ung adjustment gawin mo para ung sa status natin na me kulay".
- **Files:** `tigo/camera-rig.js`, `tigo/pet-scene.js` (sit, standUp, pose, setSize), `tigo/room.js` (seatNear), `tigo/furniture.js` (seat), `tigo/controls.js`, `pages/tigo.js`, `app/tigo.html`, `css/pages/tigo.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.17)
- **Paano:** Overlap test (test_layout) 114/114 kasama ang Sit, Sleep at size bar sa portrait, landscape at desktop.$v$), updated_by = 'claude', updated_at = now();
