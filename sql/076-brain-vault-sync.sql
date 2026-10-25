-- TigoMeNote · 076 · vault sync: #52 APK animation at insets — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** test_get 16/16 (pati WebView at Chrome).
$v$, $v$- **Paano:** test_get 16/16 (pati WebView at Chrome).

## 2026-10-25 · #52 APK: opening animation, hindi na natatakpan ng status bar, English na "Philippines ⇄ here"
- **Ano:**
  - **Opening animation:** splash ng Android 12+ = kulay ng app + icon (wala nang kulay-abo); tapos si Tigo ay sumusulpot, kumikindat, at lumalabas ang "TigoMeNote" (mga 1 segundo) bago Home/Login. Chat: teal na may bubble.
  - **Status bar / navigation bar:** ang laman ng app ay nasa pagitan na ng status bar at navigation bar (MainActivity, Android 15 edge-to-edge) — napipindot na ang ☰ at ang tabs; umaakyat din kapag may keyboard. Ang kulay sa likod ng bars ay sumusunod sa theme (`window.TMNNative.setBars`).
  - **English default:** "Pinas ⇄ here" → "Philippines ⇄ here" (Filipino: "Pinas ⇄ dito").
  - Version 0.11.19 (mas mataas na versionCode → update sa ibabaw ng dati).
- **Bakit:** Ayon kay Bench (may screenshots): "Walang animation ung pag bukas ng apps, ang taas ng navi at ung sa taas… diko ma click ung humburger" at "dapat English lahat ang default natin".
- **Files:** `apk/patch-android.py` (MainActivity, splash theme), `apk/start.html`, `apk/build-web.py`, `apk/*/app.json`, `apk/*/capacitor.config.json`, `assets/js/app-mode.js`, `components/home-clock.js`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.19)
- **Paano:** Na-test ang animation at redirect sa browser (fake na native). Ang insets at splash ay sa totoong phone lang makikita.
$v$), updated_by = 'claude', updated_at = now();
