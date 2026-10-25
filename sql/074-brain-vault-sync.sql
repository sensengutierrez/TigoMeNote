-- TigoMeNote · 074 · vault sync: #50 Chat APK — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** test_get 13/13 (Android, iPhone, computer, 360px; walang horizontal scroll). Ang test_ui (register flow) ay sira na bago pa ito (luma ang test).
$v$, $v$- **Paano:** test_get 13/13 (Android, iPhone, computer, 360px; walang horizontal scroll). Ang test_ui (register flow) ay sira na bago pa ito (luma ang test).

## 2026-10-25 · #50 TigoMeNote Chat APK (`com.tigomenote.chat`)
- **Ano:**
  - **Hiwalay na app para sa Messages:** bumubukas diretso sa Chats (o Login), at may sariling menu: Chats · Notifications · Profile · Settings (walang Daily, Tigo, Get app). Iisang code at account.
  - **Per-app menu:** `nav-items.js → apps.chat`; ang `app-mode.js?app=chat` ang nagsasabi kung aling APK (`window.TMN_APP_ID`). Login → babalik sa unang page ng app.
  - **Build:** sabay nang ginagawa ng GitHub Actions ang main at chat (matrix); Release `chat-v<version>` → `TigoMeNoteChat.apk`. Pareho ang signing key (iisang password).
  - **Get app:** sa listahan ng apps, "Available" (o ⬇ Download sa Android) kapag may APK na sa `app-version.json`.
- **Bakit:** Ayon kay Bench: "gawan mona ng apk ung chat".
- **Files:** `apk/chat/` (app.json, capacitor.config.json, package.json), `apk/main/app.json`, `apk/build-web.py`, `apk/update-version.py`, `.github/workflows/apk.yml`, `assets/js/app-mode.js`, `assets/js/nav-items.js`, `components/app-shell.js`, `pages/login.js`, `get/index.html`, `pages/get.js`, `css/pages/get.css`, `lang/fil.js`, `lang/ar.js`
- **Paano:** test_chatapp 6/6 (simulated na APK: Login → Chats, 4 tabs, walang zoom); test_get 13/13; test_tabs 48/48. Wala pang push sa APK (Firebase) at hindi pa binubuksan ng main app ang Chat app (kailangan ng native na check kung naka-install).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$|---|---|
| `apk/main/` | Capacitor config + package.json ng TigoMeNote APK (`com.tigomenote.app`) |
| `apk/build-web.py` / `patch-android.py` | Kopya ng site + app-mode.js · icons, textZoom, version sa android project |
$v$, $v$|---|---|
| `apk/main/` · `apk/chat/` | Capacitor config, package.json at app.json (unang page) ng TigoMeNote (`com.tigomenote.app`) at TigoMeNote Chat (`com.tigomenote.chat`) |
| `apk/update-version.py` | Isinusulat ang bagong APK sa `app-version.json` (CI) |
| `apk/build-web.py` / `patch-android.py` | Kopya ng site + app-mode.js · icons, textZoom, version sa android project |
$v$), updated_by = 'claude', updated_at = now();
