-- TigoMeNote · 073 · vault sync: #49 Get app page — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** Sa server (notify-fast, safety-fast) ay luma pa ang SITE para sa VAPID subject; papalitan sa susunod na deploy (walang epekto sa push). Sa APK, wala pang push hanggang Firebase (FCM).
$v$, $v$- **Paano:** Sa server (notify-fast, safety-fast) ay luma pa ang SITE para sa VAPID subject; papalitan sa susunod na deploy (walang epekto sa push). Sa APK, wala pang push hanggang Firebase (FCM).

## 2026-10-25 · #49 Get app page (Android, iPhone, QR) + logo sa header
- **Ano:**
  - **`tigomenote.com/get/`:** kusang pinipili ang tab ayon sa device.
    - 🤖 Android: Download button (pinakabagong APK, version at laki galing sa `app-version.json`) + 4 na steps (pati "Install unknown apps").
    - 📱 iPhone: Add to Home Screen sa Safari + pag-on ng notifications (iOS 16.4+, bukas mula sa Home Screen icon lang).
    - 💻 Computer: QR code (static na `assets/img/qr-get.svg`, chine-check ng OpenCV) + steps.
    - Listahan ng 3 app (Tigo at Chat: Coming soon).
  - **Links:** 📲 Get app sa landing (header + "Web, Android app and iPhone") at sa menu (Get app; nakatago sa loob ng APK).
  - **Logo sa header:** ang `.brand-mark` ay ang bagong logo na (lahat ng page, login, policies).
  - **CI:** pagkatapos ng release, ina-update ng workflow ang `app-version.json` (version, code, url, laki, sha256) — gagamitin din ng auto-update.
- **Bakit:** Ayon kay Bench: "lagay mo na sa web ung GET APP tapos merron QR instruction at para sa ios pano mag kakaroon notify".
- **Files:** `get/index.html`, `assets/js/pages/get.js`, `assets/css/pages/get.css`, `app-version.json`, `tools/make-qr.py`, `assets/img/qr-get.svg`, `assets/img/app-*.png`, `config.js` (apps), `nav-items.js` (web: true), `app-shell.js`, `index.html`, `css/shell.css`, `css/pages/legal.css`, `css/pages/auth.css`, `css/pages/landing.css`, `.github/workflows/apk.yml`, `lang/fil.js`, `lang/ar.js`
- **Paano:** test_get 13/13 (Android, iPhone, computer, 360px; walang horizontal scroll). Ang test_ui (register flow) ay sira na bago pa ito (luma ang test).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| `gallery.html` | app/ | Gallery: albums, upload, edit (device lang) | oo |
| `profile.html` | app/ | Profile: cover, photo, edit profile, naka-pilang uploads, mga tab (Posts, Private, Reposts, Saved, Liked, History) | oo |
$v$, $v$| `gallery.html` | app/ | Gallery: albums, upload, edit (device lang) | oo |
| `get/index.html` | get/ | Get the app: Android APK, iPhone (Home Screen + notifications), QR para sa computer (public) | hindi |
| `profile.html` | app/ | Profile: cover, photo, edit profile, naka-pilang uploads, mga tab (Posts, Private, Reposts, Saved, Liked, History) | oo |
$v$), updated_by = 'claude', updated_at = now();
