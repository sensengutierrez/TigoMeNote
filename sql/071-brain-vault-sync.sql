-- TigoMeNote · 071 · vault sync: #48 domain, logo A, APK setup — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** Ang post maker (composer, sounds, emoji) ay ini-load lang kapag pinindot ang Share to Explore, kaya hindi bumibigat ang Tigo page. test_photo 18/18; test_layout 139/139 (may 💃 row, sa loob ng bahay, portrait, landscape, desktop); test_tigo 41/41, test_house 33/33, test_games 10/10, test_posts 41/41.
$v$, $v$- **Paano:** Ang post maker (composer, sounds, emoji) ay ini-load lang kapag pinindot ang Share to Explore, kaya hindi bumibigat ang Tigo page. test_photo 18/18; test_layout 139/139 (may 💃 row, sa loob ng bahay, portrait, landscape, desktop); test_tigo 41/41, test_house 33/33, test_games 10/10, test_posts 41/41.

## 2026-10-25 · #48 Domain tigomenote.com, logo A, at simula ng APK
- **Ano:**
  - **Domain:** `tigomenote.com` (Cloudflare Registrar). DNS: 4 A record ng GitHub Pages + `www` CNAME (DNS only). May `CNAME` file; naka-Enforce HTTPS.
  - **Logo A (note na may mukha):** TigoMeNote (coral na note sa itim), Tigo (cream na note sa orange + bituin), Chat (bubble na may tupi sa teal–blue). Web icons, favicon.svg, notification badge, at Android adaptive + monochrome icons + splash para sa 3 app.
  - **APK (Capacitor 8):** `com.tigomenote.app`. Binubuo ng GitHub Actions; app mode = walang zoom (textZoom 100), Back button na nagsasara muna ng modal/sheet, status bar ayon sa theme, Home o Login agad.
- **Bakit:** Ayon kay Bench: "hindi web design ang atake ng apk… pag ng zoom 80 eh liliit din", "gawan mo ng unique design na logo" (pinili ang A), at "bili nako domain".
- **Files:** `CNAME`, `tools/brand/logo.py`, `tools/make-icons.py`, `assets/img/*`, `apk/` (main config, start.html, build-web.py, patch-android.py, res/), `.github/workflows/apk.yml`, `assets/js/app-mode.js`, `assets/css/base.css`, lahat ng page (favicon)
- **Paano:** Sa server (notify-fast, safety-fast) ay luma pa ang SITE para sa VAPID subject; papalitan sa susunod na deploy (walang epekto sa push). Sa APK, wala pang push hanggang Firebase (FCM).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$GitHub and deploy$v$, $v$---
tags: [setup]
updated: 2026-10-23
---
# GitHub and deploy

**Repo:** `github.com/sensengutierrez/TigoMeNote` (public)
**Site:** `https://tigomenote.com/` (Cloudflare Registrar, binili 2026-10-25, auto-renew; DNS: 4 A record ng GitHub Pages + CNAME `www`, lahat DNS only). Ang lumang `sensengutierrez.github.io/TigoMeNote/` ay kusang nagre-redirect. May `CNAME` file sa repo.
**Pages:** Deploy from a branch → `main` → `/ (root)`
**Local folder:** `Documents\GitHub\TigoMeNote` (GitHub Desktop)

## Paano mag-update
1. I-extract ang zip mula kay Claude sa `Documents\GitHub\TigoMeNote` → Replace.
2. GitHub Desktop: i-type ang Summary (required) → **Commit to main** → **Push origin**.
3. Hintayin ang 1–2 minuto → **Ctrl+F5** sa site.

## APK (`.github/workflows/apk.yml`)
- Capacitor 8; ang android project ay ginagawa sa GitHub Actions bawat build (`apk/<app>/`: package.json, capacitor.config.json). Hindi kailangan ng Android Studio.
- `apk/build-web.py` → kinokopya ang site sa `www` + isinisingit ang `assets/js/app-mode.js` (walang zoom, Back button, status bar). `apk/patch-android.py` → icons, textZoom 100, version.
- Signing: secret na **APK_KEYSTORE_PASSWORD** (sa GitHub secrets lang). Unang build → `apk/keys/release.p12` (naka-commit, naka-lock sa password). Huwag burahin ang key o kalimutan ang password.
- Labas: Artifacts (14 araw) at GitHub Release `main-v<version>` → `TigoMeNote.apk`.
- Icons: `python3 tools/make-icons.py` (logo sa `tools/brand/logo.py`).
- Pagkatapos ng unang build, may commit ang bot (signing key) → `git pull --rebase` bago mag-push.

## Tandaan
- Isang GitHub.com account lang ang naka-sign in sa GitHub Desktop. Para sa Lalabella, mag-switch o gawing collaborator ang isang account.
- Hindi naa-upload ng GitHub ang walang-lamang folder (kaya may `.gitkeep`).
- Ang `.nojekyll` ay para hindi galawin ng GitHub ang files.
- Ang LF/CRLF warning sa GitHub Desktop ay normal.

Tingnan din: [[Fix log]], [[Decisions]]
$v$, '{setup}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(brain_notes.body, $v$
## Tools
$v$, $v$
## APK — `apk/`
| File | Ano |
|---|---|
| `apk/main/` | Capacitor config + package.json ng TigoMeNote APK (`com.tigomenote.app`) |
| `apk/build-web.py` / `patch-android.py` | Kopya ng site + app-mode.js · icons, textZoom, version sa android project |
| `apk/res/<app>/` | Android icons, splash, notification icon (gawa ng tools/make-icons.py) |
| `assets/js/app-mode.js` | APK lang: walang zoom, Back button, status bar, `TMN_APP` |

## Tools
$v$), $v$`tools/cache-bust.py` — naglalagay ng `?v=<version>` (galing sa `config.js`) sa lahat ng sariling `.js`/`.css` sa HTML. Patakbuhin tuwing release.
`tools/make-icons.py` — gumagawa ng app icons sa `assets/img/`.
`tools/build-moderation-client.mjs` — kinokopya ang CORE ng `backend/moderation.ts` papuntang `assets/js/moderation-check.js`. Patakbuhin (`node tools/build-moderation-client.mjs`) tuwing babaguhin ang rules.
$v$, $v$`tools/cache-bust.py` — naglalagay ng `?v=<version>` (galing sa `config.js`) sa lahat ng sariling `.js`/`.css` sa HTML. Patakbuhin tuwing release.
`tools/make-icons.py` — gumagawa ng lahat ng icon (web `assets/img/` + Android `apk/res/<app>/`) mula sa logo sa `tools/brand/logo.py`.
`tools/build-moderation-client.mjs` — kinokopya ang CORE ng `backend/moderation.ts` papuntang `assets/js/moderation-check.js`. Patakbuhin (`node tools/build-moderation-client.mjs`) tuwing babaguhin ang rules.
$v$), updated_by = 'claude', updated_at = now();
