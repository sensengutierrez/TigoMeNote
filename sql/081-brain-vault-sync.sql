-- TigoMeNote · 081 · vault sync: #57 auto-update — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** test_get 18/18. Para sa tigomenote.com/dl mismo: Settings → Pages → Source: **GitHub Actions**.
$v$, $v$- **Paano:** test_get 18/18. Para sa tigomenote.com/dl mismo: Settings → Pages → Source: **GitHub Actions**.

## 2026-10-25 · #57 APK auto-update: hindi magagamit ang app hangga't hindi naa-update
- **Ano:**
  - **`assets/js/app-update.js` (APK lang):** pagbukas, pagbalik sa app at bawat 30 min, kinukuha ang `tigomenote.com/app-version.json`. Kapag mas mataas ang version ng app na ito → full-screen na **"New version available"** (walang close; hindi rin gumagana ang Back).
  - **⬇ Install new version:** dina-download ng app mismo ang bagong APK (Android DownloadManager, may progress bar) → kusang bubukas ang **installer** ng Android → Install (hindi mawawala ang data). Kung hindi pa naka-allow ang "Install unknown apps" → bubuksan ang setting. Backup: "Download in Chrome instead".
  - **Native (MainActivity):** `window.TMNUpdate.canInstall / allowInstall / install(url) / progress / reopen`; permission `REQUEST_INSTALL_PACKAGES`; FileProvider `<pkg>.tmnupdate`.
  - Walang internet → hindi hinaharang ang app.
  - Version 0.11.22. Ang mga app na mas luma sa 0.11.22 ay kailangan pang i-update nang manual nang isang beses.
- **Bakit:** Ayon kay Bench: "pag me bagong update dapat di mag work ung apps dapat papadownload nya ung bagong download, tapos me lalabas na install new version tapos direct download na".
- **Files:** `assets/js/app-update.js`, `apk/patch-android.py`, `apk/build-web.py`, `assets/js/app-mode.js`, `css/base.css`, `config.js` (apps.remoteVersion, 0.11.22), `lang/fil.js`, `lang/ar.js`
- **Paano:** test_update 7/7 (simulated: harang, download sa loob ng app, Install, walang permission, parehong version = walang harang).
$v$), updated_by = 'claude', updated_at = now();
