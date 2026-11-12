-- TigoMeNote · 129 brain vault sync (Change log #84, Decisions, Fix log 2026-11-13)
update brain_notes set body = rtrim(body, E' \n') || $v$

## 2026-11-13 · #84 Tigo: totoong pagmamaneho, isang sasakyan sa labas, disenyo ng labas ng bahay, higa ng alaga, piano bench, manual na galaw sa Decorate, labasan ng hagdan

- **Hiling:** Medyo mabagal ang sasakyan; dapat parang nagmamaneho talaga (hindi lang nakapatong); totoong higa ng alaga; isang sasakyan lang ang nakikita/dala; mapalitan ang disenyo ng labas ng bahay; sarado ang hagdan sa taas; upuan para sa piano; manual na galaw ng gamit sa Decorate.
- **Ginawa:** (1) `pet-scene.js`: mas mabilis (bike 2.3, scooter 3.0, car 3.7), may bigat (dahan-dahang bilis/hinto), mas malaking sasakyan (×1.3) para nakaupo mismo sa upuan; sumasandal kapag lumiliko. `human-model.js` `ridePose`: kamay sa manibela, pumapadyak sa bike, nakahilig. (2) Isang sasakyan sa labas: `room.ride` (Decorate → Rides: pindutin para gamitin); pages/tigo.js `oneRide`. (3) 🎨 `backdrops.js` EXTERIORS (7 disenyo) + `setLook`; tab na Outside; `room.ext`. (4) `buddies.js`: aso/pusa ay nakadapa (nakaunat ang paa sa harap, nakatupi sa likod, nakapatong ang ulo, nakakulot ang buntot). (5) `room.js`: bukas ang rehas sa tuktok ng hagdan (2F). (6) Piano bench (`piano-bench`) + `atPiano()`; tumutugtog ng sariling himig (`voice.js` note) habang nakaupo. (7) `room-ui.js`: ▲◀▶▼ na galaw ng napiling gamit (ayon sa camera; pindot nang matagal = tuloy-tuloy). (8) pet-fast: `room.ride`, `room.ext`, ITEMS ext-* at piano-bench.
- **Files:** `assets/js/tigo/pet-scene.js`, `human-model.js`, `pet-model.js`, `buddies.js`, `backdrops.js`, `room.js`, `room-ui.js`, `furniture.js`, `catalog.js`, `voice.js`, `assets/js/pages/tigo.js`, `assets/css/pages/tigo.css`, `backend/pet-fast.ts`, `app/guide.html`, `whatsnew.json`, `config.js` (0.11.53)
- **Paano:** test_v52e (844×390 at 390×844): isang sasakyan lang sa labas, pagmamaneho ng scooter at kotse, 7 disenyo sa Outside (bili at save), pili ng sasakyan sa Rides, ▼ na galaw ng gamit, piano, Downstairs sa labasan ng hagdan; mga screenshot ng higa ng aso. Hindi pa nasubukan sa totoong phone: pakiramdam ng bilis at pagliko.$v$, updated_by = 'claude', updated_at = now() where lower(title) = 'change log';
update brain_notes set body = replace(body, $v$| 2026-11-13 | Habang may 2D na laro (Gem Duel, Sudoku): hindi nagre-render ang 3D | Mas mabilis at mas tipid sa baterya |
$v$, $v$| 2026-11-13 | Habang may 2D na laro (Gem Duel, Sudoku): hindi nagre-render ang 3D | Mas mabilis at mas tipid sa baterya |
| 2026-11-13 | Isang sasakyan lang sa labas (room.ride); ang iba ay "nakatago" | Hindi magulo ang isla; ikaw ang pumipili |
| 2026-11-13 | Disenyo ng labas = kulay lang (pareho ang hugis ng bahay) | Magaan; gumagana sa lahat ng antas ng bahay |
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'decisions';
update brain_notes set body = replace(body, $v$- 2026-11-13 · Gem Duel online: nagsu-suko ang dalawa (walang balita nang 35 s) sa mabagal na phone → mabigat ang pag-drawing bawat frame → naka-cache na larawan ng hiyas + drawing lang kapag may gumagalaw; 45 s na hintay (`tigo/duel-game.js`)
$v$, $v$- 2026-11-13 · Gem Duel online: nagsu-suko ang dalawa (walang balita nang 35 s) sa mabagal na phone → mabigat ang pag-drawing bawat frame → naka-cache na larawan ng hiyas + drawing lang kapag may gumagalaw; 45 s na hintay (`tigo/duel-game.js`)
- 2026-11-13 · Sasakyan: parang nakapatong lang si Tigo (lumulutang, walang hawak) → mababa ang upuan kumpara sa laki ni Tigo → mas malaking sasakyan, balakang sa upuan, ridePose (`tigo/pet-scene.js`, `tigo/human-model.js`)
- 2026-11-13 · Hagdan sa 2F: sarado ng rehas ang tuktok → bukas na ang gilid sa may likod (`tigo/room.js`)
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'fix log';
select title, char_length(rtrim(body, E' \n')) n from brain_notes where lower(title) in ('change log','decisions','fix log');
