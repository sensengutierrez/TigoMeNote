-- TigoMeNote · 057 · vault sync: #38 boses ni Tigo, Sound settings, Pac-Tigo, Racing — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Tigo$v$, $v$# Build - Tigo

Virtual pet ng TigoMeNote (parang Tamagotchi pero sariling character): si **Tigo**, ang note na may mukha (gaya ng stickers).

## Page at 3D
- `app/tigo.html` + `pages/tigo.js`. Nasa menu at sa itaas ng phone (icon).
- 3D: `tigo/pet-model.js` (katawan na RoundedBox, nakatiklop na kanto, mata na may kinang, pisngi, bibig ayon sa mood, kamay/paa, gamit) at `tigo/pet-scene.js` (isla na may sampaguita, ilaw na may anino, gabi, effects: puso, pagkain, bula, bituin, bola). three.js r170 sa `assets/vendor/three/` (MIT), ini-load lang sa page na ito.
- Galaw: hinga, kurap, tingin sa mouse, talon, kain, ikot, **lakad** (salitan ang paa, kumekembot ang kamay), sayaw, tulog. Humihinto kapag nakatago ang page (tipid sa baterya). Walang WebGL → 2D sticker.

## Kontrol (`tigo/controls.js`)
- Desktop: **W A S D** o arrow keys = lakad, **Space** = talon (hindi gumagana habang may bukas na modal o nagta-type).
- Phone: **joystick** (kaliwa-baba) + **jump** (kanan-baba), o **swipe** sa stage; tap kay Tigo = ❤️. **⛶** = full screen at landscape (kung kaya ng phone).
- Hindi makakalabas sa isla at hindi tatagos sa bahay; sinusundan ng camera; mas malayo ang camera kapag patayo ang screen.

## Closet at shop (`closet-ui.js`, `catalog.js`, `outfit.js`, `buddies.js`, `backdrops.js`)
- Tabs: Tigo (pangalan, kulay), Sets (6), Hats (12), Face (7), Clothes (7), Hand (7), Buddies (6), Places (7). Bawat item may presyo sa 🪙 at level.
- Libre o pag-aari → suot agad. Hindi pa nabibili → try-on muna, tapos **Buy 🪙 N** (o Cancel). Ang server ang tunay na nagsusuri (`pet-fast` buy/wear).
- Places: Island, Beach, Coral reef, Snowland, Cloud land, Desert oasis, Moon base — bawat isa may **bahay kubo**.
- Buddies: sumusunod kay Tigo; ang maya ay lumilipad; natutulog sa tabi ng bahay kapag gabi.

## Coins, laro at journey
- 50 coins sa simula. **Coin Rush** (`coin-game.js`, `games-ui.js`): 30 s, coins sa lupa at nakalutang (talon), star coin = 3. Server: max 30 coins bawat laro, 10 laro bawat araw, 20 s pagitan, +4 XP, −8 energy.
- Bawat bagong level: +20 coins (Lv8 +100, Lv9 +150). Lv10 = golden glow.
- **Growth journey** (`journey-ui.js`): Lv1–10 na daan, ✓ = naabot, kasalukuyan, 🔒 = susunod.
- **Pac-Tigo** (`pac-game.js`): maze 15×13, 94 tuldok + 4 mangga, 3 Gloomy (humahabol / nag-aabang / pagala-gala), mangga = 6 s na takot sila. 3 buhay, 2 min. Coins = tuldok ÷ 4 + 2 bawat Gloomy + 8 kapag naubos.
- **Tigo Racing** (`race-game.js`): paikot na track (CatmullRom), 3 lap, 3 computer na Tigo (may kaunting rubber band), ⚡ boost pads, coins sa daan, labas sa daan = bagal. Coins = nakuha + 15/10/6/3 ayon sa puwesto.
- Ang laro ay may sariling mundo: `sc.beginGame()` itinatago ang isla, bahay, buddy at bisita; `sc.endGame()` ibinabalik.
- Server: `game { kind }` — 10 laro bawat araw bawat uri, max 30 coins bawat laro, 20 s pagitan.

## Boses at tunog (`voice.js`, `talk.js`)
- Speech bubble sa ulo ni Tigo (sumusunod sa 3D). Mga linya: English sa code, baby Taglish sa `lang/fil.js`.
- Baby babble: synth na pantig (triangle + formant filters), mataas kapag masaya, mababa kapag malungkot, tumataas kapag tanong. Baby words: `speechSynthesis` (depende sa boses ng device).
- 🔊 Sound settings: Tigo talks, style, voice volume, pitch, game sounds, chatty. Naka-save sa device (`tmnTigoSound`). Nagsisimula lang ang tunog pagkatapos ng unang tap/key (patakaran ng browser).

## Gabi
- Sleep → lalakad si Tigo papasok sa bahay kubo, iilaw ang bintana, Zzz sa bubong. Wake → lalabas at tatalon.

## Alaga at level
- Stats 0–100: Food, Fun, Energy, Clean. Bumababa bawat oras (gising/tulog): Food 6/3, Fun 4/2, Energy 5/+14, Clean 3/1. Kusang gigising kapag puno ang Energy.
- Mood: sick (Clean <15 o Food <10), sleepy, sad, okay, happy. Hindi namamatay.
- XP (may limit bawat araw): Feed +3, Play +5, Clean +3, Pet +1, Daily (note/to-do/mood) +8, Gather +15. Level = ⌊√(XP/20)⌋+1.
- Libreng unlock: Sprout Lv 2, Bow 3, Cap 4, Headphones 5, Crown 7. Kulay: coral, amber, mint, sky, pink, lilac, lime, ink.
- Server ang may huling salita (`pet-fast`), pero ang bars ay gumagalaw din sa browser gamit ang parehong rates.

## Gather (magkakalapit na kaibigan)
- "Meet nearby friends" (naka-off bilang default). Kapag in-on: precise GPS, naka-round sa ~10 m; tinatanggihan kapag >150 m ang lapad ng GPS; tumatagal ng 20 min; ina-update bawat minuto habang bukas ang page.
- Lalabas lang ang kaibigan kung: mutual follow o tinanggap na Family/Friends, naka-on din sila, at **≤200 m**. Ang ibinabalik ay "right here" (<40 m), "very close" (<100 m) o "nearby" lang, hindi ang lokasyon.
- Gather: isang beses bawat araw bawat magkaibigan (`pet_meets`); +15 Fun at XP sa dalawa; push sa kaibigan. Lalabas ang Tigo ng kaibigan (suot ang outfit niya) at sasayaw agad.
- **Sabay na galaw** (bar sa ibaba ng stage): 💃 Dance (confetti), 🙌 Hi-5, 🏃 Habulan (tumatakbo ang kaibigan, hinahabol mo), 🔄 Ikot, 🙇 Bow. Sumusunod ang Tigo ng kaibigan habang naglalakad ka. Sa screen mo lang ito (hindi pa live na sabay sa phone ng kaibigan).

## Para sa APK
- Iisang page at mga file; gumagamit ng `TMN_NATIVE.getLocation()` (sa APK = native GPS) at `navigator.vibrate` sa level up. Ang 3D ay naka-vendor (hindi kailangan ng CDN).
- Susunod sa APK: paalala kapag gutom/malungkot si Tigo (push), at widget sa home screen.

## Hindi pa na-test
- Mock lang ang UI (test_tigo 41/41 + test_games: boses, sound settings, Pac-Tigo, Racing; keyboard, joystick, jump, closet/buy, journey, Coin Rush, bahay kubo, sayaw/Hi-5/Habulan/Ikot, full screen, 2D fallback). Hindi pa nasubukan: totoong server (pet-fast v2 na-deploy, wala pang totoong tawag), Gather ng dalawang totoong phone, landscape lock sa totoong phone, at bilis ng 3D sa mahinang phone.

Tingnan din: [[Build - Daily]], [[Build - Safety and wellbeing]], [[System map]]
$v$, '{}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Files:** `sql/055-tigo-closet.sql` (coins, owned, outfit, rewarded_level), `backend/pet-fast.ts` (v2: wear, buy, game), `assets/js/tigo/catalog.js`, `outfit.js`, `backdrops.js`, `buddies.js`, `controls.js`, `coin-game.js`, `closet-ui.js`, `games-ui.js`, `journey-ui.js` (bago lahat), `pet-model.js`, `pet-scene.js`, `pages/tigo.js`, `app/tigo.html`, `pages/tigo.css`, `config.js` (0.11.9), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Tigo]].

$v$, $v$- **Files:** `sql/055-tigo-closet.sql` (coins, owned, outfit, rewarded_level), `backend/pet-fast.ts` (v2: wear, buy, game), `assets/js/tigo/catalog.js`, `outfit.js`, `backdrops.js`, `buddies.js`, `controls.js`, `coin-game.js`, `closet-ui.js`, `games-ui.js`, `journey-ui.js` (bago lahat), `pet-model.js`, `pet-scene.js`, `pages/tigo.js`, `app/tigo.html`, `pages/tigo.css`, `config.js` (0.11.9), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Tigo]].

## 2026-10-24 · #38 Tigo: nagsasalita parang baby + Sound settings, Pac-Tigo, Tigo Racing
- **Ano:**
  - **Boses ni Tigo:** speech bubble sa ibabaw ng ulo + boses-baby. "👶 Baby babble" (daldal na gawa sa synth, walang audio file) o "🗣️ Baby words" (totoong salita gamit ang speech ng device, mataas na tono). Nagsasalita kapag binati, pinakain, nilaro, nilinis, hinaplos, natulog/gumising, nag-level up, may kaibigan, at pagkatapos ng laro. "Chatty": paminsan-minsang nagsasabi kapag gutom, antok, marumi o bored.
  - **🔊 Sound settings** (button sa stage): Tigo talks on/off, style, voice volume, pitch (mababa → mataas), game sounds, chatty, Test voice. Naka-save sa device.
  - **Pac-Tigo:** maze na kakainin ang tuldok; 3 "Gloomy" (ulap ng lungkot) na humahabol; 🥭 mangga = matatakot sila at puwedeng habulin; 3 buhay, 2 minuto.
  - **Tigo Racing:** 3 lap laban sa 3 Tigo; kusang umaandar, liko lang (A/D, ←/→, joystick, swipe), S/↓ preno, Space talon; ⚡ boost pads, coins sa daan, puwesto 1st–4th.
  - Lahat ng laro: 3-2-1, HUD, ✕ para umalis, tunog (coin, talon, kain, panalo).
- **Bakit:** Ayon kay Bench: "ok next muna tapos lagyan mo din sya ng sasalita parang baby lagyan mo setting para ma adjust ung sound".
- **Files:** `assets/js/tigo/voice.js`, `talk.js`, `pac-game.js`, `race-game.js` (bago), `games-ui.js`, `pet-scene.js` (beginGame/endGame, headScreen, input), `pages/tigo.js`, `app/tigo.html`, `pages/tigo.css`, `backend/pet-fast.ts` (game kind: coins/pac/race, 10 bawat araw bawat laro), `config.js` (0.11.10), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Tigo]].
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Sayaw/Hi-5/Habulan/Ikot ay sa screen mo lang (hindi live na sabay sa phone ng kaibigan) | Walang realtime na koneksyon ang Tigo; puwedeng idagdag sa susunod |

$v$, $v$| 2026-10-24 | Sayaw/Hi-5/Habulan/Ikot ay sa screen mo lang (hindi live na sabay sa phone ng kaibigan) | Walang realtime na koneksyon ang Tigo; puwedeng idagdag sa susunod |
| 2026-10-24 | Boses ni Tigo = synth sa browser (WebAudio), hindi recorded na audio | Walang file na ida-download, gumagana offline at sa APK, sariling tunog; may "Baby words" gamit ang speech ng device |
| 2026-10-24 | Sound settings ay naka-save sa device lang | Iba-iba ang gusto bawat device (phone vs laptop); walang kailangang server |
| 2026-10-24 | Pac-Tigo at Racing: sariling disenyo (Gloomies, Tigo karts) | Hindi kopya ng Pac-Man o ibang racing game (trademark) |

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(brain_notes.body, $v$| `tigo/catalog.js` / `outfit.js` / `backdrops.js` / `buddies.js` | Closet items, isinusuot sa 3D, mga lugar + bahay kubo, maliliit na alaga |
| `tigo/controls.js` / `coin-game.js` | WASD/arrows + Space, joystick, swipe · Coin Rush |
| `tigo/closet-ui.js` / `games-ui.js` / `journey-ui.js` | Closet panel, listahan ng laro + HUD, Growth journey |
$v$, $v$| `tigo/catalog.js` / `outfit.js` / `backdrops.js` / `buddies.js` | Closet items, isinusuot sa 3D, mga lugar + bahay kubo, maliliit na alaga |
| `tigo/controls.js` / `coin-game.js` / `pac-game.js` / `race-game.js` | WASD/arrows + Space, joystick, swipe · Coin Rush · Pac-Tigo · Tigo Racing |
| `tigo/voice.js` / `talk.js` | Boses-baby ni Tigo (synth o speech), game sounds, speech bubble, Sound settings |
| `tigo/closet-ui.js` / `games-ui.js` / `journey-ui.js` | Closet panel, listahan ng laro + HUD, Growth journey |
$v$), $v$| `daily-fast` | list, save, remove, done, snooze; due (cron bawat minuto, key `cron_daily`) | `backend/daily-fast.ts` + `webpush.ts` |
| `pet-fast` | get, act (feed/play/clean/pet/sleep/wake/daily), style, wear, buy, game, nearby, gather, visits | `backend/pet-fast.ts` + `webpush.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
$v$, $v$| `daily-fast` | list, save, remove, done, snooze; due (cron bawat minuto, key `cron_daily`) | `backend/daily-fast.ts` + `webpush.ts` |
| `pet-fast` | get, act (feed/play/clean/pet/sleep/wake/daily), style, wear, buy, game (coins/pac/race), nearby, gather, visits | `backend/pet-fast.ts` + `webpush.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
$v$), updated_by = 'claude', updated_at = now();
