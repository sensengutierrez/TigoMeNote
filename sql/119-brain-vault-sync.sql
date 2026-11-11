-- TigoMeNote · 119 brain vault sync (Change log #78, Decisions, Fix log 2026-11-11)
update brain_notes set body = rtrim(body, E' \n') || $v$

## 2026-11-11 · #78 Tigo: menu na patayo sa kaliwa + ＋ Game menu, World chat sa ibabaw ng laro at chat panel sa kaliwa, long-press sa Decorate, tuwid na gamit, alaga sa tabi ng kama

- **Hiling:** Gaya ng MMO na ipinakita: chat na nakikita sa laro at panel ng chat; ＋ sa kanan na may lahat ng setting; ang isang hanay ng button sa kaliwa ay huwag matakaw sa espasyo; sa bahay, long-press dapat bago ma-edit (isang touch lang ay na-eedit na); ang aso ay humiga sa baba ng kama; tabingi ang sofa at iba pang gamit; at ang bagong laro ay parang "Plants War" (MOBA, solo o 3v3 online).
- **Ginawa:** (1) Dock sa game UI = maliit na patayong hanay (Feed, Play, Clean, Sleep, 💬 Chat + pinto/Decorate), kusang nagiging 2 hanay kung kulang ang taas (`--rows` mula sa `stack()`); ang iba ay nasa bagong ＋ **Game menu** (stats + 15 pindutan + Size slider). (2) `#tgTicker` — huling 3 World chat sa ibabaw ng laro (9 s), pulang tuldok sa 💬; sa landscape ang chat ay panel sa kaliwa (`#tgChatP`), sa portrait sheet pa rin. (3) Decorate: long-press 0.4 s bago mapili; ang napili na ay nahihila agad. (4) `room.js`: ikot na laging eksaktong 45° at itinutuwid ang dating tabingi (3.34 → 3.14). (5) Ang alaga ay nasa sahig sa tabi ng kama kapag tulog si Tigo.
- **Files:** `app/tigo.html`, `assets/css/pages/tigo.css`, `assets/js/pages/tigo.js`, `assets/js/tigo/room.js`, `assets/js/tigo/room-ui.js`, `assets/js/tigo/pet-scene.js`, `app/guide.html`, `whatsnew.json`, `config.js` (0.11.48)
- **Paano:** test_v48 (844×390 at 390×844; 38 check): hanay sa kaliwa (5 button, hindi tumatama sa joystick), ＋ menu kasya, ticker + realtime + tuldok, panel sa kaliwa (World, DM, padala), tuwid na sofa/mesa, isang tap = walang pili, long-press = pili, hila, 8 ikot = parehong anggulo, alaga sa tabi ng kama (screenshot). test_v47 ulit. Hindi pa nasubukan sa totoong phone: keyboard habang bukas ang panel sa landscape.$v$, updated_by = 'claude', updated_at = now() where lower(title) = 'change log';
update brain_notes set body = replace(body, $v$| 2026-11-11 | Ang 3v3 MOBA ay hiwalay na release pagkatapos nito | Malaki (4 na hero, tore, bots, online); mas madaling subukan nang hiwalay |
$v$, $v$| 2026-11-11 | Ang 3v3 MOBA ay hiwalay na release pagkatapos nito | Malaki (4 na hero, tore, bots, online); mas madaling subukan nang hiwalay |
| 2026-11-11 | Tigo HUD: iilang mabilis na button sa kaliwa; lahat ng iba ay nasa ＋ Game menu | Mas malinis ang screen; hindi natatakpan ang laro |
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'decisions';
update brain_notes set body = replace(body, $v$- 2026-11-11 · Lipad: nahuhuli ang camera kapag mabagal ang phone → `lerp` na nakadepende sa frame → ginawang ayon sa `dt` (`1 - exp(-dt*6)`) (`tigo/flight.js`)
$v$, $v$- 2026-11-11 · Lipad: nahuhuli ang camera kapag mabagal ang phone → `lerp` na nakadepende sa frame → ginawang ayon sa `dt` (`1 - exp(-dt*6)`) (`tigo/flight.js`)
- 2026-11-11 · Bahay: tabingi ang sofa/TV → ang ikot ay `round(r + π/4)` kaya naiipon ang mali ng rounding (0.79 × n) → hakbang na buo (0–7) × π/4, at itinutuwid ang luma sa `place()` (`tigo/room.js`)
- 2026-11-11 · Bahay: ang alaga ay nasa ibabaw ng kama → sinusundan si Tigo kahit nakahiga → sa `bedSpot().beside` na siya humihiga (`tigo/pet-scene.js`)
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'fix log';
select title, char_length(rtrim(body, E' \n')) n from brain_notes where lower(title) in ('change log','decisions','fix log');
