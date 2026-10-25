---
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
- Push (Firebase): GitHub secret **GOOGLE_SERVICES_JSON** (buong laman ng google-services.json, may com.tigomenote.app at .chat) → `apk/add-firebase.py` bawat build. Supabase Edge secret **FCM_SERVICE_ACCOUNT** (service account JSON ng Firebase) → `backend/push.ts`. Nilagay ni Bench 2026-10-25; hindi kailanman sa repo o chat.
- Labas: Artifacts (14 araw), GitHub Release `<app>-v<version>`, at `tigomenote.com/dl/<Name>.apk` (Deploy site).
- Icons: `python3 tools/make-icons.py` (logo sa `tools/brand/logo.py`).
- Pagkatapos ng unang release build, may commit ang bot (cert-sha256.txt) → `git pull --rebase` bago mag-push.

## Tandaan
- Isang GitHub.com account lang ang naka-sign in sa GitHub Desktop. Para sa Lalabella, mag-switch o gawing collaborator ang isang account.
- Hindi naa-upload ng GitHub ang walang-lamang folder (kaya may `.gitkeep`).
- Ang `.nojekyll` ay para hindi galawin ng GitHub ang files.
- Ang LF/CRLF warning sa GitHub Desktop ay normal.

Tingnan din: [[Fix log]], [[Decisions]]
