-- TigoMeNote · 088 · vault sync: #60 auto-download update — record lang; napatakbo na
update brain_notes set body = rtrim(body, E'\n') || $v$

## 2026-10-31 · #60 Auto-download ng update + What's new
- **Ano:** Pagbukas ng app at may bagong version, kusang nagda-download na ang APK (kung pinayagan na ang "Install unknown apps"), tapos bubukas ang installer ng Android: "Install" na lang ang pipindutin. Ang "What's new" (whatsnew.json, mula 0.11.28) ay nasa update screen. Tumitigil ang 3D ng Tigo habang bukas ang update screen. Version 0.11.29.
- **Bakit:** Ayon kay Bench: "Hndi ba auto na ung update pag open ng apps, tapos dapat lumabas ung details ng bagong patch para makita anung bago sa new version". Hindi kayang mag-install nang tahimik ng sideload na APK (Android ang nagtatanong); sa Play Store lang iyon.
- **Files:** `assets/js/app-update.js`, `assets/js/tigo/pet-scene.js`, `whatsnew.json`, `config.js` (0.11.29)
- **Paano:** test_autoupd 5/5 (may permission → kusang download → Install; walang permission → hinihintay ang tap; What's new lumalabas), test_tigoupd 3/3 (kasya sa landscape, tumitigil ang 3D).
$v$, updated_by = 'claude', updated_at = now() where lower(title) = 'change log';
