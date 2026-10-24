-- TigoMeNote · 056 · vault sync: #37 Tigo v2 (closet, coins, Coin Rush, bahay kubo, journey, sayaw) — record lang; napatakbo na
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
- Pac-Tigo at Racing: "Soon".

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
- Mock lang ang UI (41/41 sa test_tigo: keyboard, joystick, jump, closet/buy, journey, Coin Rush, bahay kubo, sayaw/Hi-5/Habulan/Ikot, full screen, 2D fallback). Hindi pa nasubukan: totoong server (pet-fast v2 na-deploy, wala pang totoong tawag), Gather ng dalawang totoong phone, landscape lock sa totoong phone, at bilis ng 3D sa mahinang phone.

Tingnan din: [[Build - Daily]], [[Build - Safety and wellbeing]], [[System map]]
$v$, '{}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** Detalye sa [[Build - Tigo]].
$v$, $v$- **Paano:** Detalye sa [[Build - Tigo]].

## 2026-10-24 · #37 Tigo v2: lakad gamit ang keyboard/joystick, closet at shop, coins, bahay kubo, Coin Rush, Growth journey, sayaw kasama ang kaibigan
- **Ano:**
  - **Lakad:** W A S D / arrow keys + **Space** (talon) sa desktop; sa phone **joystick + jump button** o **swipe**; **⛶ full screen** (landscape kapag kaya ng phone). Gumagalaw ang paa at kamay habang naglalakad; sinusundan ng camera.
  - **Closet** (sa side panel, kita pa rin si Tigo): Tigo (pangalan + kulay), Sets, Hats, Face, Clothes, Hand, **Buddies** (aso, pusa, maya, kuneho, pawikan, sisiw na sumusunod), **Places** (Island, Beach, Coral reef, Snowland, Cloud land, Desert oasis, Moon base). Try-on muna bago bilhin.
  - **Coins 🪙**: 50 sa simula; galing sa **Coin Rush** (30 s, max 30 coins bawat laro, 10 laro bawat araw) at sa bawat bagong level (+20; Lv8 +100, Lv9 +150). Lv10 = golden glow.
  - **Bahay kubo** sa bawat lugar: kapag Sleep, lalakad si Tigo papasok, iilaw ang bintana, Zzz sa bubong.
  - **Growth journey**: daan mula Lv1 hanggang Lv10 na may ✓, ngayon, at 🔒.
  - **Meet nearby**: mas mahigpit na — ≤200 m, ~10 m na katumpakan, hindi tatanggapin kapag malabo ang GPS (>150 m).
  - **Sabay na galaw kasama ang kaibigan** (pagkatapos ng Gather): 💃 Dance, 🙌 Hi-5, 🏃 Habulan, 🔄 Ikot, 🙇 Bow. Sumusunod din ang Tigo ng kaibigan habang naglalakad ka.
  - Pac-Tigo at Racing: "Soon" muna sa Games.
- **Bakit:** Ayon kay Bench: "dapat me ganto (closet)… meet nearby friends dapat magkalapit ng GPS… keyboard awsd at space para sa jump, kasama ang paa… phone swipe or landscape… games… pets… house pag matutulog… adding journey… lagyan mo din ng movement pag magkasama para maka pag dance sila".
- **Files:** `sql/055-tigo-closet.sql` (coins, owned, outfit, rewarded_level), `backend/pet-fast.ts` (v2: wear, buy, game), `assets/js/tigo/catalog.js`, `outfit.js`, `backdrops.js`, `buddies.js`, `controls.js`, `coin-game.js`, `closet-ui.js`, `games-ui.js`, `journey-ui.js` (bago lahat), `pet-model.js`, `pet-scene.js`, `pages/tigo.js`, `app/tigo.html`, `pages/tigo.css`, `config.js` (0.11.9), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Tigo]].

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Hindi namamatay si Tigo | Hindi nakaka-stress; nalulungkot lang kapag napabayaan |

$v$, $v$| 2026-10-24 | Hindi namamatay si Tigo | Hindi nakaka-stress; nalulungkot lang kapag napabayaan |
| 2026-10-24 | Tigo v2: ang presyo/level ng shop ay nasa server (`pet-fast` ITEMS) at kinokopya lang sa `catalog.js` | Hindi madadaya ang coins o items sa browser |
| 2026-10-24 | Coin Rush: max 30 coins bawat laro, 10 laro bawat araw, 20 s pagitan, at sinusuri ang tagal ng laro | Hindi ma-spam ang coins |
| 2026-10-24 | Meet nearby: ≤200 m, ~10 m na katumpakan, tinatanggihan ang GPS na >150 m ang lapad | Ayon kay Bench "dapat magkalapit sila ng GPS"; distansya lang pa rin ang nakikita ng kaibigan |
| 2026-10-24 | Sayaw/Hi-5/Habulan/Ikot ay sa screen mo lang (hindi live na sabay sa phone ng kaibigan) | Walang realtime na koneksyon ang Tigo; puwedeng idagdag sa susunod |

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(replace(brain_notes.body, $v$| `components/appearance-settings.js` | Settings → Background: presets, kulay, picture (desktop/phone), sliders (`TMN_LOOK_UI`) |
| `tigo/pet-model.js` / `tigo/pet-scene.js` | 3D na si Tigo at ang isla (ES modules, three.js) |
| `pages/tigo.js` | Tigo page: alaga, style, nearby/gather, visits |
| `daily-store.js` / `components/daily-notes.js` | Daily notes sa device (IndexedDB): note, to-do, photos, mood, On this day (`TMN_DAILY`, `TMN_DAILY_UI`) |
$v$, $v$| `components/appearance-settings.js` | Settings → Background: presets, kulay, picture (desktop/phone), sliders (`TMN_LOOK_UI`) |
| `tigo/pet-model.js` / `tigo/pet-scene.js` | 3D na si Tigo (lakad, talon, sayaw) at ang mundo (camera, bisita, sabay na galaw) — ES modules, three.js |
| `tigo/catalog.js` / `outfit.js` / `backdrops.js` / `buddies.js` | Closet items, isinusuot sa 3D, mga lugar + bahay kubo, maliliit na alaga |
| `tigo/controls.js` / `coin-game.js` | WASD/arrows + Space, joystick, swipe · Coin Rush |
| `tigo/closet-ui.js` / `games-ui.js` / `journey-ui.js` | Closet panel, listahan ng laro + HUD, Growth journey |
| `pages/tigo.js` | Tigo page: alaga, closet, laro, journey, full screen, nearby/gather, sabay na galaw, visits |
| `daily-store.js` / `components/daily-notes.js` | Daily notes sa device (IndexedDB): note, to-do, photos, mood, On this day (`TMN_DAILY`, `TMN_DAILY_UI`) |
$v$), $v$| `daily-fast` | list, save, remove, done, snooze; due (cron bawat minuto, key `cron_daily`) | `backend/daily-fast.ts` + `webpush.ts` |
| `pet-fast` | get, act (feed/play/clean/pet/sleep/wake/daily), style, nearby, gather, visits | `backend/pet-fast.ts` + `webpush.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
$v$, $v$| `daily-fast` | list, save, remove, done, snooze; due (cron bawat minuto, key `cron_daily`) | `backend/daily-fast.ts` + `webpush.ts` |
| `pet-fast` | get, act (feed/play/clean/pet/sleep/wake/daily), style, wear, buy, game, nearby, gather, visits | `backend/pet-fast.ts` + `webpush.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
$v$), $v$| `reminders` | Daily reminders at alarms (oras, ulit, sent/done) | `sql/050-daily-reminders.sql` |
| `pets` / `pet_meets` | si Tigo ng bawat user (stats, XP, style, near_*) at ang mga Gather | `sql/052-tigo-pets.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
$v$, $v$| `reminders` | Daily reminders at alarms (oras, ulit, sent/done) | `sql/050-daily-reminders.sql` |
| `pets` / `pet_meets` | si Tigo ng bawat user (stats, XP, style, coins, owned, outfit, near_*) at ang mga Gather | `sql/052-tigo-pets.sql`, `sql/055-tigo-closet.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
$v$), updated_by = 'claude', updated_at = now();
