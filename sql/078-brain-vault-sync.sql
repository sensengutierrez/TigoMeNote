-- TigoMeNote · 078 · vault sync: #54 APK sa tigomenote.com/dl — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** test_messages 86/86, test_profile 32/32, test_get 17/17, test_chatapp 7/7.
$v$, $v$- **Paano:** test_messages 86/86, test_profile 32/32, test_get 17/17, test_chatapp 7/7.

## 2026-10-25 · #54 APK download mula sa tigomenote.com/dl (hindi na GitHub)
- **Ano:**
  - **`.github/workflows/pages.yml` (Deploy site):** dine-deploy ang site sa GitHub Pages gamit ang Actions; habang nagde-deploy, kinukuha ang pinakabagong APK ng bawat app sa GitHub Releases at inilalagay sa `dl/` → `tigomenote.com/dl/TigoMeNote.apk` at `tigomenote.com/dl/TigoMeNoteChat.apk`. Walang APK na naka-save sa repo. Tumatakbo sa bawat push at pagkatapos ng "Build APK".
  - **`app-version.json`:** `url` = tigomenote.com/dl/…?v=<version>; `github` = lumang link (backup).
  - **Get app sa Android:** laging sa Chrome mismo bumubukas ang download (sa Custom Tab o browser ng ibang app, natitigil sa "Downloading…"); may paalala na "Files → Downloads".
- **Bakit:** Ayon kay Bench (screenshot ng github.com na nakatigil sa "Downloading…"): "Ayusin mo download pag dito sa site na to di ma download".
- **Files:** `.github/workflows/pages.yml`, `apk/update-version.py`, `get/index.html`, `pages/get.js`, `css/pages/get.css`, `lang/fil.js`, `lang/ar.js`
- **Paano:** Kailangang naka-**Settings → Pages → Source: GitHub Actions** (kung hindi, papalitan ng branch deploy ang site na walang dl/). test_get 17/17.
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$GitHub and deploy$v$, $v$---
tags: [setup]
updated: 2026-10-23
---
# GitHub and deploy

**Repo:** `github.com/sensengutierrez/TigoMeNote` (public)
**Site:** `https://tigomenote.com/` (Cloudflare Registrar, binili 2026-10-25, auto-renew; DNS: 4 A record ng GitHub Pages + CNAME `www`, lahat DNS only). Ang lumang `sensengutierrez.github.io/TigoMeNote/` ay kusang nagre-redirect. May `CNAME` file sa repo.
**Pages:** Source = **GitHub Actions** (`.github/workflows/pages.yml`: site + pinakabagong APK sa `dl/`)
**Local folder:** `Documents\GitHub\TigoMeNote` (GitHub Desktop)

## Paano mag-update
1. I-extract ang zip mula kay Claude sa `Documents\GitHub\TigoMeNote` → Replace.
2. GitHub Desktop: i-type ang Summary (required) → **Commit to main** → **Push origin**.
3. Hintayin ang 1–2 minuto → **Ctrl+F5** sa site.

## APK (`.github/workflows/apk.yml`)
- Capacitor 8; ang android project ay ginagawa sa GitHub Actions bawat build (`apk/<app>/`: package.json, capacitor.config.json). Hindi kailangan ng Android Studio.
- `apk/build-web.py` → kinokopya ang site sa `www` + isinisingit ang `assets/js/app-mode.js` (walang zoom, Back button, status bar). `apk/patch-android.py` → icons, textZoom 100, version.
- Signing: secret na **APK_KEYSTORE_PASSWORD** (sa GitHub secrets lang, nilagay ni Bench 2026-10-25). Ang key ay ginagawa mula sa password tuwing build (`apk/derive-key.py`, RSA 3072, laging pareho); walang key file sa repo (bawal ang `*.p12`). `apk/keys/cert-sha256.txt` = public fingerprint na chine-check bawat build. Huwag kalimutan o palitan ang password.
- Labas: Artifacts (14 araw), GitHub Release `<app>-v<version>`, at `tigomenote.com/dl/<Name>.apk` (Deploy site).
- Icons: `python3 tools/make-icons.py` (logo sa `tools/brand/logo.py`).
- Pagkatapos ng unang release build, may commit ang bot (cert-sha256.txt) → `git pull --rebase` bago mag-push.

## Tandaan
- Isang GitHub.com account lang ang naka-sign in sa GitHub Desktop. Para sa Lalabella, mag-switch o gawing collaborator ang isang account.
- Hindi naa-upload ng GitHub ang walang-lamang folder (kaya may `.gitkeep`).
- Ang `.nojekyll` ay para hindi galawin ng GitHub ang files.
- Ang LF/CRLF warning sa GitHub Desktop ay normal.

Tingnan din: [[Fix log]], [[Decisions]]
$v$, '{setup}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
