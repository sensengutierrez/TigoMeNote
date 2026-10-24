---
tags: [decision]
updated: 2026-10-24
---
# Decisions

| Petsa | Desisyon | Bakit |
|---|---|---|
| 2026-10-23 | Pangalan: **TigoMeNote** | Pinili ni Bench |
| 2026-10-23 | Tema: **plain white + dark mode** setting | Pinili ni Bench |
| 2026-10-23 | Hosting: **GitHub Pages** muna (`sensengutierrez.github.io/TigoMeNote/`) | Libre; custom domain mamaya |
| 2026-10-23 | **Hiwalay na Supabase account at project** (sensengutierrez) | Hindi maghahati sa free-plan limits ng Lalabella |
| 2026-10-23 | **Public repo**, No license | Libre ang Pages sa public; "no license" = all rights reserved. Walang secret sa code. |
| 2026-10-23 | GitHub Desktop para sa updates | Kasama ang dotfiles, kita ang binago bago i-push |
| 2026-10-23 | Unang nag-register = Admin | Si Bench dapat ang mauna |
| 2026-10-23 | **Email verification: required + verify**, 6-digit code | Pinili ni Bench; code kaysa link para gumana rin sa APK |
| 2026-10-23 | Email sender: **Gmail** (App Password) muna | Libre at mabilis; lilipat sa Resend + domain pag lumaki |
| 2026-10-23 | **Desktop/laptop = full UI/UX** (buong lapad) | Rule ni Bench |
| 2026-10-23 | **Gallery sa device lang** (IndexedDB), walang upload | Tugma sa "sa device mag-save"; walang gastos sa server storage |
| 2026-10-23 | Weather: **Open-Meteo** + GPS/IP auto-detect | Libre, walang API key |
| 2026-10-23 | Posts: **maliit na copy** sa server (photo 1600 px JPEG, video 720p) | Pinili ni Bench; kasya sa 1 GB na libre |
| 2026-10-23 | Video sa post: **max 15 segundo** | Pinili ni Bench |
| 2026-10-23 | **Visibility bawat post** (Public / Followers / Ako lang) | Pinili ni Bench |
| 2026-10-23 | **Offline queue** sa device + schedule sa server (`publish_at`) | Idea ni Bench; gumagana kahit walang net |
| 2026-10-23 | Profile photo + cover sa **public** bucket `profile-media`; upload via `profile-fast` lang | Nakikita naman talaga ng iba; mabilis at naka-cache |
| 2026-10-23 | Cover = **3:1** (1500×500), photo = 600×600, may crop | Pareho ang itsura sa desktop at phone |
| 2026-10-23 | **Explore = feed + status** (parang Instagram) | Pinili ni Bench |
| 2026-10-23 | **Share = repost + share link**; kita kung sino ang nag-share | Pinili ni Bench |
| 2026-10-23 | Status ay para sa **mga fina-follow mo** (hindi mutual) | Pinili ni Bench |
| 2026-10-23 | 6 na reaction (❤️ 😂 😮 😢 🔥 👏), isa bawat tao | Simple at mabilis bilangin |
| 2026-10-24 | **English ang default**; Language setting: English, Arabic (RTL), Filipino | Hiling ni Bench; pang-Bahrain at Pinas |
| 2026-10-24 | Text sa code = English; isinasalin ng `i18n.js` gamit ang dictionary (hindi ang laman ng users) | Isang source ng text, madaling magdagdag ng wika |
| 2026-10-24 | View = ≥60% nakita nang 1.5 s o binuksan; isang beses bawat tao bawat 6 oras; hindi binibilang ang sarili | Patas na bilang, hindi madaling dayain |
| 2026-10-24 | Pin hanggang **3** (parang TikTok) | Hiling ni Bench |
| 2026-10-24 | Cache busting gamit ang `?v=<version>` sa HTML | Para makuha agad ng phone ang bagong code |
| 2026-10-24 | **Safety ang pundasyon ng app**: Family/Friends circle, Locate, SOS | Hiling ni Bench. Detalye: [[Plan - Safety, family and wellbeing]] |
| 2026-10-24 | Location history **30 araw**; Friends na pinili puwedeng mag-Locate; laging invite + accept | Pinili ni Bench |
| 2026-10-24 | May **age limit**, **parental**, **auto sleep**, **give a break** | Hiling ni Bench; SOS laging gumagana |
| 2026-10-24 | Minimum age **13+**; Teen 13–17 = private account + sleep naka-on | Ok kay Bench ("tama ung analyse mo") |
| 2026-10-24 | Break reminder default **60 min** (adults) | Hindi nakakaistorbo pero may paalala; puwedeng palitan |
| 2026-10-24 | Sariling Web Push code + VAPID key sa `app_keys` (hindi external service) | Libre, walang dagdag na account; FCM kapag APK na |
| 2026-10-24 | Supervision: magulang nag-iimbita, teen nag-a-accept, laging nakikita ng teen | Walang lihim na tracking |
| 2026-10-24 | Messenger: sa web, nasa loob ng TigoMeNote; sa APK, hiwalay na **Tigo Messenger** app (parehong code at account) | Hiling ni Bench; magaan ang main app at may sariling notifications ang chat |
| 2026-10-24 | Message requests kung hindi ka fina-follow; teen = mutual followers at Family/Friends lang | Iwas spam at proteksyon ng bata |
| 2026-10-24 | Real-time = Realtime broadcast "ping" sa lihim na channel + poll bilang backup | Custom login (walang Supabase Auth), kaya walang laman ng message na dumadaan sa Realtime |
| 2026-10-24 | Kopya ng data = .zip (csv + gpx + json) sa TigoMeNote folder; APK: Documents/TigoMeNote + `hasFragileUserData` | Naiiwan ang kopya kahit i-uninstall; Android mismo ang nagtatanong kung itatabi ang app data |
| 2026-10-24 | Status ring: sariling disenyo (rounded-square, coral → amber → mint, may hati bawat status) | Hindi kopya ng Instagram; tugma sa "Note" ng TigoMeNote |
| 2026-10-24 | Notifications: Off / In app / Push bawat uri; laging naka-on ang SOS at account notices | Kontrol sa user pero hindi nawawala ang mahalagang abiso |
| 2026-10-24 | Push ng notifications ay sa `notify-fast` lang (tinatawag ng `notify.ts` gamit ang service key) | Isang lugar ang VAPID/web push; hindi bumabagal ang like/comment |
| 2026-10-24 | Iisang rules sa server at browser: `tools/build-moderation-client.mjs` ang gumagawa ng `moderation-check.js` | Live na babala habang nagta-type, pero ang server pa rin ang huling bantay |
| 2026-10-24 | Baliktad na buong text: block rules lang; baliktad na bawat salita: pati flag | Iwas mali-maling flag sa normal na text |
| 2026-10-24 | Teen: bawal ang phone, email, address at ibang chat app sa post/comment/bio | Proteksyon laban sa grooming at pribadong usapan sa labas ng app |
| 2026-10-24 | Keep-warm (pg_cron bawat 3 min) sa 8 function na gamit sa bawat page | Iwas 2–3 s na cold start; ~115k invocations/buwan (free: 500k). Tanggalin kapag marami nang users |
| 2026-10-24 | Token sa body at `text/plain` sa lahat ng tawag (walang custom header) | Walang CORS preflight = kalahati ng biyahe bawat tawag |
| 2026-10-24 | GIFs = **KLIPY** (libre) sa pamamagitan ng `gifs-fast`; hiwalay na key para sa TigoMeNote | Hindi nakikita ang key sa browser; hiwalay na limit at settings sa ibang web app; mahigpit na rating para sa teen |
| 2026-10-24 | Stickers = sariling "Tigo" stickers na gawa sa SVG sa code (walang character ng iba) | Libre, walang copyright, maliit (id lang ang naka-save) |
| 2026-10-24 | Emoji font: Noto Color Emoji (Google Fonts) bilang fallback | Pareho at kumpleto ang emoji kahit lumang Windows; dina-download lang ang emoji na ginamit |
| 2026-10-24 | Local sounds ayon sa time zone at wika ng device (hindi GPS) | Walang hinihinging permiso; Pinas = Asia/Manila o Filipino, Gulf = Bahrain/Saudi/UAE/… o Arabic |
| 2026-10-24 | Sounds = **sariling music na ginagawa sa device** (Web Audio), hindi sikat na kanta | Libre, offline, walang copyright; ang hit songs ay kailangan ng bayad na lisensya |
| 2026-10-24 | Filters ay naka-"bake" sa file; ang sound ay `id` lang sa post (tinutugtog habang pinapanood) | Pareho ang itsura kahit saan; walang dagdag na upload |
| 2026-10-24 | Text filter: **block** (malinaw na bawal) o **flag** (ipa-review sa admin) | Iwas mali-maling harang sa normal na usapan |
| 2026-10-24 | Kusang itago kapag 3+ report o may child-safety report | Mabilis na proteksyon habang hinihintay ang admin |
| 2026-10-24 | Photos/videos: Report + admin review muna (walang image AI) | Walang libreng paraan para sa violence/baril sa larawan; pipili mamaya |
| 2026-10-24 | Policies sa English; batas = Kingdom of Bahrain; contact = Report button hangga't walang email | Ipa-review sa abogado bago mag-Play Store |
| 2026-10-23 | Lipat sa **Brevo** (free 300/araw) | Ayaw tanggapin ng Gmail ang App Password; walang domain na kailangan sa Brevo. SMS ay hindi pinili kasi may bayad. |
| 2026-10-24 | Label sa circle ("Sino siya sa iyo") ay pribado: bawat panig may sariling label | Iba ang tawag ng anak sa magulang at ng magulang sa anak; walang ibang nakakakita |
| 2026-10-24 | Explore post: route sa `posts.activity` (jsonb, ≤800 points), kinukuwenta ulit ng server ang layo | Isang table lang (walang bagong table), mabilis i-load sa feed, hindi madadaya ang distance |
| 2026-10-24 | Static na mapa sa feed = SVG (OSM tiles + guhit); interactive (Leaflet) lang kapag binuksan | Mabilis ang feed kahit maraming route; hindi gumagawa ng maraming Leaflet map |
| 2026-10-24 | GPS recording sa browser: kailangang bukas ang screen (Wake Lock) | Pinapatigil ng browser ang GPS kapag naka-lock; sa APK, ang location history (Safety) ang puwedeng gamitin |
| 2026-10-24 | Background = naka-save sa account (users.appearance + bg_desktop/bg_phone sa profile-media) | Pinili ni Bench; pareho sa lahat ng device |
| 2026-10-24 | My music = sariling playlist sa device lang (IndexedDB), hindi ina-upload | Pinili ni Bench (ako lang); walang copyright problem |
| 2026-10-24 | Tuloy-tuloy na music kahit lumipat ng page o naka-lock = sa APK na | Pinili ni Bench; sa web, humihinto ang audio kapag nagpalit ng page |
| 2026-10-24 | Daily notes = nasa device lang; reminders/alarms = nasa server | Pribado ang notes; ang reminder ay kailangang nasa server para may push sa tamang oras kahit sarado ang app |
| 2026-10-24 | Cron ng reminders: sariling random key (app_keys `cron_daily`), hindi service key | Walang secret sa SQL o notes; ang key ay ginawa sa database mismo |
| 2026-10-24 | Tigo = sariling character (note na may mukha), hindi Tamagotchi | Trademark ng Bandai ang Tamagotchi; kapareho ng stickers natin ang Tigo |
| 2026-10-24 | 3D gamit ang three.js r170 na naka-vendor sa `assets/vendor/three` (hindi CDN) | Gumagana sa APK at offline na cache; na-test dito; ini-load lang sa Tigo page |
| 2026-10-24 | Gather: magkaibigan lang (mutual follow o Family/Friends), naka-on sa dalawa, distansya lang (hindi lokasyon), ~100 m na katumpakan, 20 min | Kaligtasan, lalo na sa mga bata/teen |
| 2026-10-24 | Hindi namamatay si Tigo | Hindi nakaka-stress; nalulungkot lang kapag napabayaan |
| 2026-10-24 | Tigo v2: ang presyo/level ng shop ay nasa server (`pet-fast` ITEMS) at kinokopya lang sa `catalog.js` | Hindi madadaya ang coins o items sa browser |
| 2026-10-24 | Coin Rush: max 30 coins bawat laro, 10 laro bawat araw, 20 s pagitan, at sinusuri ang tagal ng laro | Hindi ma-spam ang coins |
| 2026-10-24 | Meet nearby: ≤200 m, ~10 m na katumpakan, tinatanggihan ang GPS na >150 m ang lapad | Ayon kay Bench "dapat magkalapit sila ng GPS"; distansya lang pa rin ang nakikita ng kaibigan |
| 2026-10-24 | Sayaw/Hi-5/Habulan/Ikot ay sa screen mo lang (hindi live na sabay sa phone ng kaibigan) | Walang realtime na koneksyon ang Tigo; puwedeng idagdag sa susunod |
| 2026-10-24 | Boses ni Tigo = synth sa browser (WebAudio), hindi recorded na audio | Walang file na ida-download, gumagana offline at sa APK, sariling tunog; may "Baby words" gamit ang speech ng device |
| 2026-10-24 | Sound settings ay naka-save sa device lang | Iba-iba ang gusto bawat device (phone vs laptop); walang kailangang server |
| 2026-10-24 | Pac-Tigo at Racing: sariling disenyo (Gloomies, Tigo karts) | Hindi kopya ng Pac-Man o ibang racing game (trademark) |
| 2026-10-24 | Feed media: hugis ayon sa photo (4:5 hanggang 1.91:1), `cover` sa loob | Parang Facebook: walang itim na gilid at walang scroll sa loob; ang sobrang tangkad/lapad ay bahagyang napuputol |
| 2026-10-24 | Trending sounds = TigoMeNote Sounds lang (bilang sa posts + status, 7 araw), walang commercial na kanta | Ang mga kanta sa TikTok/FB/IG ay may lisensya; bawal gamitin dito nang walang kasunduan |
| 2026-10-24 | ❤️ sa status ay naka-save sa `story_views.liked_at` (walang bagong table) | Isang row bawat nanood; kasama ang view at like |
| 2026-10-24 | Desktop Explore: 560 px na feed | Masyadong malaki ang post sa buong lapad; parang Facebook/Instagram ang sukat |

## Bukas pa (hinihintay si Bench)
- **Approval:** auto-active ang bagong users, o kailangan i-approve? (`REQUIRE_APPROVAL`)
- **Contact email** para sa policies (copyright, privacy requests).
- **Image detection:** nsfwjs (libre, nudity lang) o bayad na serbisyo (violence + weapons)?

Tingnan din: [[Build - Foundation]]
