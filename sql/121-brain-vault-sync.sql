-- TigoMeNote · 121 brain vault sync (Change log #80, Decisions, Fix log 2026-11-11)
update brain_notes set body = rtrim(body, E' \n') || $v$

## 2026-11-11 · #80 Mas magandang 3D: mga hero ng Bloom Clash, TV na may palabas, tunay na hugis ng tanim, isda sa lawa, alagang nakahiga kapag tulog

- **Hiling:** Pagandahin ang 3D ng MOBA (parang mga hero sa sikat na MOBA), gumagana ang TV at parang nanonood si Tigo, realistic na gulay sa taniman, pati isda, at ang alaga ay tunay na nakahiga kapag tulog (hindi nakatayo).
- **Ginawa:** (1) `moba-game.js` `heroModel()` — sariling disenyong maliliit na mandirigma (ulo, katawan, braso/binting gumagalaw, kapa ng team, galaw ng atake): Archer (talukbong, pana, lalagyan ng palaso), Fighter (helmet, baluti, espada at kalasag), Assassin (talukbong, maskara, dalawang punyal), Mage (sombrero, balabal, tungkod na may umiilaw na bola); bato sa gilid ng daan at mga puno. (2) TV: palabas na gumagalaw (umaga/hapon/gabi, araw, ulap, burol, tumatakbong karakter) + kumikislap na ilaw; `room.tvNear()`, `sc.watching()` — nakaupo at nakaharap sa TV = "📺 Movie time!"; kung walang upuan, humaharap sa TV. (3) `backdrops.js`: bawat buto ay may sariling hugis sa 3 yugto (karot, kamatis, mais, strawberry, kalabasa); 4 na isda (koi/tilapia) na lumalangoy at paminsan-minsang tumatalon. (4) `buddies.js`: nakahiga nang patagilid ang may-paa na alaga kapag tulog; ibon/sisiw/kuneho ay nakadapa.
- **Files:** `assets/js/tigo/moba-game.js`, `assets/js/tigo/furniture.js`, `assets/js/tigo/room.js`, `assets/js/tigo/pet-scene.js`, `assets/js/tigo/backdrops.js`, `assets/js/tigo/buddies.js`, `assets/js/pages/tigo.js`, `app/guide.html`, `whatsnew.json` (0.11.49 pa rin)
- **Paano:** test_v49 ulit (43/43) + mga screenshot: hero sa laban, TV na may palabas, upo sa sofa → `watching()` true at bubble, alagang nakahiga, taniman at lawa. Hindi pa nasubukan sa totoong phone: bilis (mas maraming hugis sa taniman at sa laban) at itsura ng mga tanim nang malapitan.$v$, updated_by = 'claude', updated_at = now() where lower(title) = 'change log';
update brain_notes set body = replace(body, $v$| 2026-11-11 | Bloom Clash: kusang atake + isang Skill lang bawat hero | Kayang laruin ng isang hinlalaki sa phone; bagay sa 13+ |
$v$, $v$| 2026-11-11 | Bloom Clash: kusang atake + isang Skill lang bawat hero | Kayang laruin ng isang hinlalaki sa phone; bagay sa 13+ |
| 2026-11-11 | Bloom Clash: sariling modelong mandirigma ang hero (hindi si Tigo) | Mas mukhang larong labanan; walang kinopyang karakter |
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'decisions';
update brain_notes set body = replace(body, $v$- 2026-11-11 · Bloom Clash: hindi kita ang laman ng HP bar → ang itim na likod ay transparent kaya huling iginuguhit at natatakpan ang kulay → ginawang transparent din ang kulay para masunod ang `renderOrder` (`tigo/moba-game.js`)
$v$, $v$- 2026-11-11 · Bloom Clash: hindi kita ang laman ng HP bar → ang itim na likod ay transparent kaya huling iginuguhit at natatakpan ang kulay → ginawang transparent din ang kulay para masunod ang `renderOrder` (`tigo/moba-game.js`)
- 2026-11-11 · Bahay: hindi makaupo sa sofa kapag nasa likod nito (naiipit sa lakad) → kung walang usad nang 0.9 s, itinutuloy na ang pag-upo (`tigo/pet-scene.js`)
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'fix log';
select title, char_length(rtrim(body, E' \n')) n from brain_notes where lower(title) in ('change log','decisions','fix log');
