---
tags: [log]
updated: 2026-10-23
---
# Fix log

Format: **PROBLEMA → SANHI → AYOS (file)**. Pinakabago sa ibaba.

- 2026-10-23 · Explore: ang "Explore opens soon" card ay napupunta sa ilalim ng screen sa desktop → naka-center sa buong taas ng grid (`top: 50%`), mas mahaba ang grid kaysa screen → inilagay sa `top: 96px` (`assets/css/pages/explore.css`)
- 2026-10-23 · auth-fast unang deploy ay placeholder lang → maling laman ang naipasa sa unang deploy → ni-deploy ulit ang buong code (version 2) at kinumpara sa `backend/auth-fast.ts`
- 2026-10-23 · Login: kapag diretsong binuksan ang `?mode=register`, dumudulas ang panels sa unang load → may CSS transition kahit unang render → `no-anim` class sa `<body>` na tinatanggal pagkatapos ng unang frame (`login.html`, `login.js`, `auth.css`)
- 2026-10-23 · Verify screen sa phone: nahahati sa gitna ang email ("gmai / l.com") → `word-break: break-all` → `white-space: nowrap` (`assets/css/pages/auth.css`)
- 2026-10-23 · Gmail: "535 Username and Password not accepted" → mali ang `SMTP_PASS` (hindi App Password o ibang account) → gumawa ng bagong App Password sa parehong Gmail ng `SMTP_USER` (Supabase Secrets)
- 2026-10-23 · Sign in: "Mali ang username o password" → na-type ang email nang walang `@` (`sensengutierrezgmail.com`) kaya hinanap bilang username → i-type ang username o buong email
- 2026-10-23 · Reset screen: naiiwan ang lumang error habang nagta-type ng bagong password → walang hide sa input → `rPass` input nagtatago ng `rMsg2` (`login.js`)
- 2026-10-23 · Brevo: "401 unrecognised IP address" → naka-on ang Authorized IPs sa Brevo, at paiba-iba ang IP ng Supabase → Brevo → Settings → Security → Authorized IPs → Deactivate for API keys
- 2026-10-23 · Forgot password: "Masyadong maraming request" → 10 request/oras bawat IP + email na walang `@` → nilinis ang rate-limit rows; may paalala na kapag email na walang `@` (`login.js` → `missingAt()`)
- 2026-10-23 · Daily: "Gamitin ang GPS" mukhang gray na kahon → ang `.link-btn` style ay nasa `auth.css` lang (login) → inilipat sa `components.css`
- 2026-10-23 · Posts (test): na-stuck sa "Kino-compress ang video" → hindi tumatakbo ang `requestVideoFrameCallback` sa nakatagong video at naghihintay ang `AudioContext.resume()` ng tap → timer loop + `onended` + safety timeout, at max 0.6 s na hintay sa resume (`post-queue.js`)
- 2026-10-23 · Gallery viewer: ang portrait na photo ay lumalampas sa ibaba ng screen → walang limit ang taas ng larawan sa desktop → `max-height` na naka-base sa taas ng screen (`gallery.css`, `posts.css`)
- 2026-10-23 · Phone: lumiit/lumapad ang buong Gallery page at kalahating screen lang ang viewer → ang mahabang albums row ay nagpapalapad sa grid column (`min-width: auto`) → `minmax(0, 1fr)` sa `.layout` at `.layout-aside`; full screen ang viewer sa phone (`shell.css`, `components.css`)
- 2026-10-24 · Settings sa phone: walang Language buttons → lumang `settings.js` pa ang naka-cache sa phone (bago ang Language) → `?v=<version>` sa lahat ng sariling `.js`/`.css` sa HTML (`tools/cache-bust.py`), version 0.5.0
- 2026-10-24 · Viewer sa phone (Arabic): naputol ang Delete button → hindi nagwa-wrap ang `.pv-actions` → `flex-wrap` + mas maikling "Pin" (`posts.css`)
- 2026-10-24 · Test ng verify email: "list index out of range" → kailangan na ng birthdate sa Create account kaya hindi naipadala ang register → idinagdag ang birthdate sa test (`test_verify.py`)
- 2026-10-24 · SOS overlay: pagpindot ng "Silence alarm" ay hindi naitatala → `hide()` ay binubura ang `current` bago ang callback → itinabi muna ang `current` (`sos-overlay.js`)
- 2026-10-24 · Admin Reports: hindi gumagana ang Dismiss/Delete (test) → ang `action` ng desisyon ay pumapalit sa `action` ng API call (`resolve`) → pinalitan ng `decision` (`admin-reports.js`, `moderation-fast.ts`)
- 2026-10-24 · Text filter: hindi nahuli ang "سأقتلك" at "xxx" → hinihiwalay ng NFKD ang hamza; at ginagawang "xx" ang "xxx" → tinanggal ang lahat ng `\p{M}` (pati sa patterns), at hiwalay na bersyon ang pag-ikli ng paulit-ulit na letra (`moderation.ts`)
- 2026-10-24 · Text filter: hindi nahuli ang "420" at "ak47" → ginagawang letra ng leetspeak ang numero ("42o", "ak4t") → dagdag na bersyon na walang leetspeak (`moderation.ts`)
- 2026-10-24 · Text filter: hindi nahuli ang "hithit tayo ng marijuana" → isang salita lang ang pinapayagan sa pagitan → hanggang 2 filler words (`FILL` sa `moderation.ts`)
- 2026-10-24 · Text filter: mali-maling flag sa "coke", "hash browns", "I'll find you a seat", "beat your record", "signal", "damo para sa kambing" → masyadong malawak ang salita → tinanggal o ginawang flag lang (`moderation.ts`)
- 2026-10-24 · Status: natatakpan ng status viewer ang Report sheet → mas mataas ang z-index ng viewer → `body:has(.st-view) .modal-backdrop{z-index:95}` (`social.css`)
- 2026-10-24 · Notifications: "maria, jose and 1 others" kapag 3 tao → laging "and N others" kahit isa lang ang natira → 3 tao = tatlong pangalan; "and N others" kapag 4+ (`pages/notifications.js`)
- 2026-10-24 · Notifications sa phone: naiipit ang text ng follow request dahil sa Confirm/Delete sa gilid → ang buttons ay nasa ilalim na ng text (`pages/notifications.js`, `notifications.css`)
- 2026-10-24 · Daily: nananatili ang "Good morning" kahit hapon na kapag bukas lang ang page → isang beses lang kinukuha ang oras pag-load → bawat minuto at pagbalik sa app tinitingnan ulit (`pages/daily.js`)
- 2026-10-24 · Weather: "0% ulan" kahit English ang wika → Filipino na salita sa code → "% rain" + salin (`components/weather.js`)
- 2026-10-24 · Profile ng ibang user (desktop): hindi buong lapad ang cover at nakapatong ang pangalan dito → `aspect-ratio` + `max-height` ay nagpapaliit din ng lapad, at `margin-top: -40px` ang buong header → fixed na lapad + taas (`clamp`), avatar lang ang nakapatong at nasa sariling linya ang pangalan (`social.css`)
- 2026-10-24 · Messenger (test): hindi mapindot ang Send kapag may babala ng text filter → ang babala ay nakapatong sa Send button → nasa itaas na ng composer ang babala (`messages.css`)
- 2026-10-24 · Share camera (test): walang lumalabas na Sound row sa composer → pinapalitan ng `row()` ang buong `className` ng container → `classList.add/toggle` na lang (`sound-picker.js`)
- 2026-10-24 · ♪ chip sa post card (test): napunta sa sulok ng screen → may lumang `.pc-sound` (mute button ng video, `position:absolute`) → bagong pangalan `.pc-music` at `.pc-soundpick` (`post-card.js`, `post-composer.js`, `posts.css`)
- 2026-10-24 · TigoMeNote Sounds (test): umaabot sa 1.9 ang lakas (nagka-crack) → idinagdag ang limiter at hininaan ang master (`sounds.js`)
- 2026-10-24 · Chat: blangko ang photo at walang laman ang viewer → loop: bawat `open` ay nagpi-ping ng "read" → lahat ng bukas na chat (pati sarili) ay nagre-reload → bagong signed URL bawat reload kaya hindi natatapos mag-load ang larawan → "read" ping lang kapag may bagong nabasa (server), hindi pinapansin ang sariling "read" at may 3 s na pagitan (browser), hindi pinapalitan ang link ng photo hangga't hindi malapit mag-expire, at hindi na nire-render kung walang nagbago (`messages-fast.ts`, `chat-view.js`)
- 2026-10-24 · Safety: "hindi lumalabas" ang in-add na Family/Friend → pending pa (hindi pa tinatanggap) at nasa maliit na "Waiting…" sa ilalim ng "No Family yet"; walang notification ang inimbitahan (push lang, kung naka-on) → pending ay nasa listahan na mismo + bilang, listahan bago ang mapa, at notification na may Accept/Decline (`safety.js`, `safety.html`, `safety-fast.ts`, `notifications.js`, sql/037)
- 2026-10-24 · Emoji na "kahon" (hal. 🫩, 🩷 sa Windows) → walang ganoong emoji ang font ng device → Noto Color Emoji (Google Fonts) sa bawat page at sa `--font-body`; ang preview ng message ay pinuputol na nang hindi nahahati ang emoji (`tokens.css`, `messages-fast.ts`)
- 2026-10-24 · Sound picker: humahaba ang "Best match" sa buong lapad → `justify-self: start` (`sounds.css`)
- 2026-10-24 · Mabagal ang loading → (1) cold start ng edge functions (2–3 s kapag ilang minutong walang gumagamit), (2) CORS preflight (OPTIONS) bago ang bawat POST dahil sa `x-session-token` header at JSON content-type → token sa body + text/plain (walang preflight), keep-warm bawat 3 min (sql/041), at cache ng badge (`api.js`, `auth-guard.js`, `notif-badge.js`)
- 2026-10-24 · Feed: masyadong malaki ang video/photo, kailangang mag-scroll para makita ang buong video → `max-height` ay sobrang taas at `cover` ang video → `min(68vh, 560px)` at `contain` (`social.css`)
- 2026-10-24 · Comment reply: may scrollbar sa gilid habang nagta-type → nakapirming taas ang textarea → auto-grow pataas hanggang 120px, nakatago ang scrollbar (`app-shell.js`, `components.css`, `social-ui.js`)
- 2026-10-24 · Bumagal ulit ang page → (1) hinihintay ang Noto Color Emoji font (render-blocking CSS), (2) wellbeing at sign-in check sa bawat lipat ng page → font ay non-blocking (`media=print onload`), Segoe UI Emoji muna sa Windows, cache ng sign-in (10 min) at wellbeing (60 s) (`app/*.html`, `tokens.css`, `auth-guard.js`, `wellbeing.js`)
- 2026-10-24 · Wellbeing: "Cannot read properties of undefined (reading 'sleep')" kapag walang `state` ang naka-cache → guard sa `apply()` (`wellbeing.js`)

Hindi bug (para hindi na hanapin ulit):
- GitHub Desktop: "This file uses LF line endings… CRLF" → normal sa Windows, walang epekto sa site.
- Sign in field: hindi na tinatanggal ang simbolo (hal. `@`) kasi pwede na ang email doon. Sa Create account lang strict ang username.
- "Naka-lock ang account… 28 minuto" → tama ang gawa: 5 maling password = 30 min lock. May Forgot password na para ma-unlock agad.
- GitHub Desktop: naka-yellow (modified) ang mga file na pareho naman ang laman → line endings lang.
