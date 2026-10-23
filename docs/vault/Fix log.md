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

Hindi bug (para hindi na hanapin ulit):
- GitHub Desktop: "This file uses LF line endings… CRLF" → normal sa Windows, walang epekto sa site.
- Sign in field: hindi na tinatanggal ang simbolo (hal. `@`) kasi pwede na ang email doon. Sa Create account lang strict ang username.
- "Naka-lock ang account… 28 minuto" → tama ang gawa: 5 maling password = 30 min lock. May Forgot password na para ma-unlock agad.
- GitHub Desktop: naka-yellow (modified) ang mga file na pareho naman ang laman → line endings lang.
