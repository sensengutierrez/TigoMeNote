# Build - Tigo

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
