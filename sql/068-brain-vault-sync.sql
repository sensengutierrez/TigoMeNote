-- TigoMeNote · 068 · vault sync: #45 Tigo game UI (game buttons, swipe camera, landscape) — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Tigo$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$## Camera (`camera-rig.js`, `sky-dome.js`)
- Phone: kaliwang joystick = lakad; kanang joystick = camera (ikot 360°, taas = tingala, baba = mula sa itaas). Sa gilid: ⤒ Jump, 🎥 View (Follow / Top view / Close-up), 🔍 Zoom (normal / malayo / malapit). Pinch = zoom.
- Desktop: hila ng mouse = ikot, wheel = zoom, Q/E = ikot. Ang lakad (joystick/WASD) ay ayon sa direksyon ng camera.
$v$, $v$## Camera (`camera-rig.js`, `sky-dome.js`)
- Phone: joystick (D-pad) = lakad; kanan: ⤒ Jump, 🏃 Run, ✋ Stop, 🎥 Camera (isang button: Follow → Wide → Top → Close-up). Swipe sa gitna = ikot 360° at tingala; pinch = zoom.
- Game UI sa phone: mini stats + menu bar (lahat ng action, « = itago) + sheet para sa Closet/Decorate (▾ minimize, ✕ sara). Landscape = buong screen na laro (sheet sa kanan).
- Desktop: hila ng mouse = ikot, wheel = zoom, Q/E = ikot. Ang lakad (joystick/WASD) ay ayon sa direksyon ng camera.
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Files:** `components/sound-maker.js`, `pages/sound-maker.js`, `app/sound-maker.html`, `css/sound-maker.css` (bago), `sounds.js` (ensure, fromRecipe, preview, position), `components/sound-picker.js`, `components/stories.js`, `nav-items.js`, `config.js` (fn sounds, 0.11.15), `app/explore.html`, `gallery.html`, `home.html`, `share.html`, `backend/sounds-fast.ts` (bago, v1), `backend/sound-recipe.ts` (bago), `backend/posts-fast.ts` (v14), `backend/social-fast.ts` (v11), `sql/066-user-sounds.sql`, `lang/fil.js`, `lang/ar.js`
- **Paano:** Recipe lang ang naka-save (walang audio file, tipid sa Free plan). Kapag ginamit sa post/status, kinukuha ng server ang recipe sa `user_sounds` at kinokopya sa `sound` ng post, kaya tumutugtog pa rin kahit burahin ang tunog.$v$, $v$- **Files:** `components/sound-maker.js`, `pages/sound-maker.js`, `app/sound-maker.html`, `css/sound-maker.css` (bago), `sounds.js` (ensure, fromRecipe, preview, position), `components/sound-picker.js`, `components/stories.js`, `nav-items.js`, `config.js` (fn sounds, 0.11.15), `app/explore.html`, `gallery.html`, `home.html`, `share.html`, `backend/sounds-fast.ts` (bago, v1), `backend/sound-recipe.ts` (bago), `backend/posts-fast.ts` (v14), `backend/social-fast.ts` (v11), `sql/066-user-sounds.sql`, `lang/fil.js`, `lang/ar.js`
- **Paano:** Recipe lang ang naka-save (walang audio file, tipid sa Free plan). Kapag ginamit sa post/status, kinukuha ng server ang recipe sa `user_sounds` at kinokopya sa `sound` ng post, kaya tumutugtog pa rin kahit burahin ang tunog.

## 2026-10-25 · #45 Tigo parang totoong mobile game: game buttons, swipe camera, lahat nasa loob ng laro (portrait at landscape)
- **Ano:**
  - **Kontrol:** kaliwa = joystick (D-pad); kanan = ⤒ Jump (malaki), 🏃 Run (toggle; Shift sa keyboard), ✋ Stop (hinto agad, haharap sa camera) at 🎥 Camera (isang button lang, parang MIR4: Follow → Wide → Top → Close-up). Wala nang pangalawang joystick.
  - **Camera:** swipe sa gitna ng screen = ikot 360° (kaliwa/kanan) at pataas = tingala sa langit, pababa = mula sa itaas; pinch = zoom.
  - **Lahat nasa loob ng laro (phone):** mini stats (🍙🎈⚡🫧), menu bar (Feed, Play, Clean, Sleep, Closet, Games, House, Journey, Sound, Full; « = itago), at Go inside / Go outside / Decorate ay nasa menu bar din. Ang Closet at Decorate ay bumubukas sa loob ng laro (sheet); ▾ = minimize para makapaglaro habang bukas, ✕ = sara.
  - **Landscape sa phone/APK:** kusang buong screen na laro (walang top bar at tabs); ang sheet ay nasa kanan para kita pa rin ang joystick. Portrait: kasya ang buong laro sa screen (hindi na kailangang mag-scroll para sa mga button).
  - **Full screen:** buong page na (hindi lang ang stage), kaya nakikita pa rin ang Feed, Games, Sound at iba pang menu.
  - **Ayos:** ang puso kapag hinawakan si Tigo ay hindi na baliktad 😄; ang toast ay hindi na humahaba kapag bukas ang Dance bar.
- **Bakit:** Ayon kay Bench: "gawin mo sana ung joystick ganto… run, jump, stop parang isang game… pag naka land scape… lahat ng process nya kasama… ung pag zoom at focus isang botton lang same sa mir4… swipe swipe sa gitna… always check ung overlap… pag hindi naka land scape check padin" at "ayusin mo din ung puso… baliktad".
- **Files:** `app/tigo.html`, `css/pages/tigo.css`, `pages/tigo.js`, `tigo/camera-rig.js`, `tigo/controls.js`, `tigo/pet-scene.js`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.16)
- **Paano:** May overlap test (test_layout: 390×844, 360×740, 844×390, 740×360, desktop) na sinusuri na walang nagpapatong at nasa loob ng screen ang lahat, kasama habang nasa bahay, nagde-decorate, naka-minimize ang sheet at may Closet.$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Recipe ng sariling tunog ay kinokopya sa post/status (galing sa server, hindi sa browser) | Tumutugtog kahit burahin; hindi madadaya ang pangalan/may-ari |

$v$, $v$| 2026-10-24 | Recipe ng sariling tunog ay kinokopya sa post/status (galing sa server, hindi sa browser) | Tumutugtog kahit burahin; hindi madadaya ang pangalan/may-ari |
| 2026-10-25 | Tigo sa phone = game UI (lahat ng function sa loob ng stage); landscape = buong screen na laro | Ayon kay Bench; hindi maiiwan sa ibaba ang mga function (para sa APK) |
| 2026-10-25 | Camera: swipe sa gitna + isang camera button (4 view); pinalitan ang pangalawang joystick | Parang MIR4; mas maluwag ang screen |
| 2026-10-25 | Full screen = buong page (documentElement), hindi ang stage lang | Nakikita pa rin ang mga modal (Feed, Games, Sound) |

$v$), updated_by = 'claude', updated_at = now();
