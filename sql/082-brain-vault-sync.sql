-- TigoMeNote · 082 · vault sync: #58 Gallery camera — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** test_update 7/7 (simulated: harang, download sa loob ng app, Install, walang permission, parehong version = walang harang).
$v$, $v$- **Paano:** test_update 7/7 (simulated: harang, download sa loob ng app, Install, walang permission, parehong version = walang harang).

## 2026-10-25 · #58 Gallery: magkaiba na ang 📷 Camera at ⬆ Upload
- **Ano:** Ang **Camera** sa Gallery ay ang sariling camera ng app (live filters, harap/likod, photo) gaya ng sa Share; ang **Upload** ay pili ng files. Kung walang camera API ang device, camera ng phone (input na may capture) ang gagamitin. Version 0.11.23 — ito rin ang unang test ng auto-update sa phone.
- **Bakit:** Ayon kay Bench (screenshot ng Gallery sa APK): "Same lang sila ng function 😂 camera at upload".
- **Files:** `app/gallery.html` (camera.css, camera.js), `assets/js/pages/gallery.js`, `config.js` (0.11.23)
- **Paano:** test_galcam 1/1 (fake na camera), test_gallery 51/51.
$v$), updated_by = 'claude', updated_at = now();
