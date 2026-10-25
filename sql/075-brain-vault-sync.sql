-- TigoMeNote · 075 · vault sync: #51 Open in Chrome — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** test_chatapp 6/6 (simulated na APK: Login → Chats, 4 tabs, walang zoom); test_get 13/13; test_tabs 48/48. Wala pang push sa APK (Firebase) at hindi pa binubuksan ng main app ang Chat app (kailangan ng native na check kung naka-install).
$v$, $v$- **Paano:** test_chatapp 6/6 (simulated na APK: Login → Chats, 4 tabs, walang zoom); test_get 13/13; test_tabs 48/48. Wala pang push sa APK (Firebase) at hindi pa binubuksan ng main app ang Chat app (kailangan ng native na check kung naka-install).

## 2026-10-25 · #51 Get app: "Open in Chrome" kapag nasa browser ng ibang app
- **Ano:** Sa Android na nakabukas sa loob ng ibang app (Claude, Messenger, Instagram…; WebView na "; wv)"), may dilaw na banner na **Open in Chrome**, at ang mga Download button ay dumadaan sa Chrome (Android intent na may fallback sa default browser). Sa Chrome mismo, diretso pa rin ang link.
- **Bakit:** Ayon kay Bench: "ang prob sa link, di sya direct sa apps ng google chrome" — gumagana ang GitHub links (302 → APK) pero hindi nagda-download sa browser sa loob ng app.
- **Files:** `get/index.html`, `assets/js/pages/get.js`, `assets/css/pages/get.css`, `lang/fil.js`, `lang/ar.js`
- **Paano:** test_get 16/16 (pati WebView at Chrome).
$v$), updated_by = 'claude', updated_at = now();
