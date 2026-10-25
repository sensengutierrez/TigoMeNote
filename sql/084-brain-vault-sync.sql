-- TigoMeNote · 084 · vault sync: #59 Push sa apps (Firebase) — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** test_galcam 1/1 (fake na camera), test_gallery 51/51.
$v$, $v$- **Paano:** test_galcam 1/1 (fake na camera), test_gallery 51/51.

## 2026-10-25 · #59 Push sa apps (Firebase): messages → Chat app, likes/comments/follows → TigoMeNote app
- **Ano:**
  - Server: bagong `backend/push.ts` (`deliver()`): iisang daan para sa web push at FCM (Firebase HTTP v1, token mula sa secret `FCM_SERVICE_ACCOUNT`).
    - messages → TigoMeNote Chat app; kung wala → TigoMeNote app; kung wala pareho → web.
    - social at daily → TigoMeNote app; kung wala → web. tigo → Tigo app → TigoMeNote app → web. safety (SOS, invites) → lahat ng device.
    - Patay na token (UNREGISTERED/404) → binubura ang push_subs.
  - Ginagamit na ng notify-fast, safety-fast, pet-fast at daily-fast (lahat naka-deploy). `push_subs.app` (sql/083) = tigomenote | messenger | tigo.
  - APK: plugin `@capacitor/push-notifications`; `apk/add-firebase.py` isinusulat ang google-services.json mula sa GitHub secret `GOOGLE_SERVICES_JSON` (kung kasama ang package ng app), default icon ic_stat_tigo at kulay.
  - app-mode.js: `TMN_APP.pushToken({ask})` (permission → channels: messages, social, safety, reminders, tigo → token); pindot sa notification → bubuksan ang page (data.url); lumalabas din habang bukas ang app.
  - push-setup.js: sa APK, ipinapadala ang token kasama ang `app`; tahimik na sync pagbukas (kapag pinayagan na; isang beses bawat araw o kapag nagbago ang token).
  - Version 0.11.24.
- **Bakit:** Ayon kay Bench: hiwalay ang notifications ng Messenger at ng follow/like sa apps; ginawa ni Bench ang Firebase project at ang dalawang secret.
- **Files:** `backend/push.ts`, `backend/notify-fast.ts`, `backend/safety-fast.ts`, `backend/pet-fast.ts`, `backend/daily-fast.ts`, `sql/083-push-app.sql`, `apk/add-firebase.py`, `.github/workflows/apk.yml`, `apk/main|chat/package.json`, `apk/main|chat/capacitor.config.json`, `assets/js/app-mode.js`, `assets/js/push-setup.js`, `assets/js/native-bridge.js`, `config.js` (0.11.24)
- **Paano:** unit test ng routing at JWT (mock), test_fcm 9/9 (simulated na plugin: walang tanong pagbukas, Turn on → permission → token → subscribe app=messenger, pindot → page, walang ulit sa parehong araw), dry run ng add-firebase.py (pekeng config). Hindi pa nasubukan sa totoong phone.
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
$v$, '{setup}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
