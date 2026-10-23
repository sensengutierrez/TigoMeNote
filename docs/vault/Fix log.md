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

Hindi bug (para hindi na hanapin ulit):
- GitHub Desktop: "This file uses LF line endings… CRLF" → normal sa Windows, walang epekto sa site.
- Sign in field: hindi na tinatanggal ang simbolo (hal. `@`) kasi pwede na ang email doon. Sa Create account lang strict ang username.
- GitHub Desktop: naka-yellow (modified) ang mga file na pareho naman ang laman → line endings lang.
