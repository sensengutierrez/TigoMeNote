-- TigoMeNote · 079 · vault sync: #55 permissions at Chat app — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** Kailangang naka-**Settings → Pages → Source: GitHub Actions** (kung hindi, papalitan ng branch deploy ang site na walang dl/). test_get 17/17.
$v$, $v$- **Paano:** Kailangang naka-**Settings → Pages → Source: GitHub Actions** (kung hindi, papalitan ng branch deploy ang site na walang dl/). test_get 17/17.

## 2026-10-25 · #55 APK permissions + Messages → TigoMeNote Chat app (o download page)
- **Ano:**
  - **Permissions (main at Chat APK):** Camera, Microphone, Location (fine/coarse), Notifications, Vibrate + `<queries>` ng 3 app. Dati "No permissions requested" kaya "Can't open the camera". Ang Capacitor ang nagtatanong kapag kailangan (camera/mic/GPS).
  - **Messages sa TigoMeNote APK:** kung naka-install ang Chat → kusang binubuksan ang **TigoMeNote Chat**; kung wala → "Get TigoMeNote Chat" → bubuksan ang **tigomenote.com/get** sa Chrome (pansamantala habang wala pa sa Play Store).
  - **Native bridge:** `window.TMNApps.hasApp / openApp / openUrl` (MainActivity) → `TMN_APP.hasApp/openApp/installApp` (app-mode.js).
  - Pangalan: "Tigo Messenger" → **"TigoMeNote Chat"** sa lahat ng text (pati Filipino/Arabic).
  - Version 0.11.21.
- **Bakit:** Ayon kay Bench (screenshots: App info na walang permission, "Can't open the camera", at "Install Tigo Messenger"): "i direct mo dapat to sa download site pansamantala habang dipa na lalagay sa playstore, tapos ung mga permission".
- **Files:** `apk/patch-android.py`, `assets/js/app-mode.js`, `pages/messages.js`, `components/notif-settings.js`, `components/chat-view.js`, `native-bridge.js`, `app/messages.html`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.21)
- **Paano:** test_gate 3/3 (simulated na APK), test_messages 86/86.
$v$), updated_by = 'claude', updated_at = now();
