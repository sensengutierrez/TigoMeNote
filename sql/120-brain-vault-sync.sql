-- TigoMeNote · 120 brain vault sync (Change log #79, Decisions, Fix log 2026-11-11)
update brain_notes set body = rtrim(body, E' \n') || $v$

## 2026-11-11 · #79 Bagong laro: Bloom Clash 🌻 (3v3 na laban sa hardin — Archer, Fighter, Assassin, Mage; solo na may bots o online hanggang 6)

- **Hiling:** Dagdag na laro na parang "Plants War": MOBA na 3v3, puwedeng solo at online, may archer, fighter, assassin at mage.
- **Ginawa:** `tigo/moba-game.js` (sariling disenyo, walang kinopyang karakter): isang daan, bawat panig ay may Tower at Great Flower (base); 3 Sprouties bawat 22 s; kusang umaatake ang hero, ✨ Skill bawat klase (Volley, Slam, Dash, Burst); XP at Lv 1–8; respawn sa base; gumagaling malapit sa base; 7 minuto ang hangganan. Solo = ikaw + 2 bot laban sa 3 bot. Online = room hanggang 6 (salitan ang team; bot ang pumupuno); ang host ang may hawak ng lahat (`st` ~6/s), ang iba ay lakad + hiling ng skill. Pagpili ng hero bago magsimula (online: 9 s, `cls`/`mgo`). Lumalabo ang tore/base kapag nakaharang sa camera. `games-ui.js` (menu, HUD, ✨ button, hila = ikot, pinch = zoom), `games-fast` (`moba` sa ranking at sa Friends → Join).
- **Files:** `assets/js/tigo/moba-game.js` (bago), `assets/js/tigo/games-ui.js`, `assets/js/tigo/social-ui.js`, `assets/css/pages/tigo.css`, `backend/games-fast.ts`, `app/guide.html`, `whatsnew.json`, `config.js` (0.11.49)
- **Paano:** test_v49 (43 check): solo sa 844×390 at 390×844 (menu, pagpili, 6 hero, Sprouties, HUD at ✨ walang patong, lakad, laban, Burst sa 2 Sprouty, KO → respawn, base ligtas habang may tore, panalo → resulta naipadala); online na dalawang page (host + bisita, pekeng realtime na pinagdugtong): parehong 6 hero/klase/team, Sprouties sa bisita, lakad ng bisita kita ng host, Dash ng bisita ginagawa ng host, KO, panalo/talo sa magkabila. Hindi pa nasubukan: totoong phone at totoong internet (lag), 6 na totoong tao, at balanse ng lakas ng mga hero at bot.$v$, updated_by = 'claude', updated_at = now() where lower(title) = 'change log';
update brain_notes set body = replace(body, $v$| 2026-11-11 | Tigo HUD: iilang mabilis na button sa kaliwa; lahat ng iba ay nasa ＋ Game menu | Mas malinis ang screen; hindi natatakpan ang laro |
$v$, $v$| 2026-11-11 | Tigo HUD: iilang mabilis na button sa kaliwa; lahat ng iba ay nasa ＋ Game menu | Mas malinis ang screen; hindi natatakpan ang laro |
| 2026-11-11 | Bloom Clash: host ang may hawak ng laban (buhay, Sprouties, bots); ang iba ay nagpapadala lang ng lakad at hiling ng skill | Iisang pinagmumulan ng totoo; walang server ng laro na kailangan (free plan) |
| 2026-11-11 | Bloom Clash: kusang atake + isang Skill lang bawat hero | Kayang laruin ng isang hinlalaki sa phone; bagay sa 13+ |
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'decisions';
update brain_notes set body = replace(body, $v$- 2026-11-11 · Bahay: ang alaga ay nasa ibabaw ng kama → sinusundan si Tigo kahit nakahiga → sa `bedSpot().beside` na siya humihiga (`tigo/pet-scene.js`)
$v$, $v$- 2026-11-11 · Bahay: ang alaga ay nasa ibabaw ng kama → sinusundan si Tigo kahit nakahiga → sa `bedSpot().beside` na siya humihiga (`tigo/pet-scene.js`)
- 2026-11-11 · Bloom Clash: hindi kita ang laman ng HP bar → ang itim na likod ay transparent kaya huling iginuguhit at natatakpan ang kulay → ginawang transparent din ang kulay para masunod ang `renderOrder` (`tigo/moba-game.js`)
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'fix log';
select title, char_length(rtrim(body, E' \n')) n from brain_notes where lower(title) in ('change log','decisions','fix log');
