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

## Bukas pa (hinihintay si Bench)
- **Approval:** auto-active ang bagong users, o kailangan i-approve? (`REQUIRE_APPROVAL`)
- **Contact email** para sa policies (copyright, privacy requests).
- **Image detection:** nsfwjs (libre, nudity lang) o bayad na serbisyo (violence + weapons)?

Tingnan din: [[Build - Foundation]]
