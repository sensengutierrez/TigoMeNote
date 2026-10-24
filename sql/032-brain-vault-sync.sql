-- TigoMeNote · 032 · vault sync: #25 cover, TigoMeNote folder, Save to zip — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$ device).
$v$, $v$ device).

## 2026-10-24 · #25 Buong cover sa profile ng iba, TigoMeNote folder, Save to zip bago burahin ang location
- **Ano:** Ang cover (banner) sa profile ng ibang user ay buong lapad na, at hindi na nakapatong ang pangalan sa cover. Sa Safety → Location history: **Save copy** (.zip) at, bago burahin, pagpipilian na **Save to zip, then delete** o **Delete without saving**. Bagong **Settings → Files on this device**: saan napupunta ang kopya (APK: Documents/TigoMeNote; desktop: pinili mong folder; iba: Downloads) at paliwanag tungkol sa pag-uninstall.
- **Bakit:** Ayon kay Bench: "pag view ko ng prof nya ganto banner nya di full", at "gagawa ng folder ng TigoMeNote sa phone or desktop para sa location… pag clear may choices save to zip… pag uninstall may choice kung mag-stay ang data".
- **Files:** `assets/css/social.css`, `assets/js/zip.js` (bago), `file-save.js` (bago), `components/location-export.js` (bago), `components/files-settings.js` (bago), `native-bridge.js` (`saveFile`), `pages/safety.js`, `pages/settings.js`, `app/safety.html`, `app/settings.html`, `assets/css/pages/safety.css`, `pages/settings.css`, `backend/safety-fast.ts` (v3, `exportHistory`), `lang/fil.js`, `lang/ar.js`, `config.js` (0.8.2)
- **Paano:** Detalye: [[Build - Safety and wellbeing]] (TigoMeNote folder, APK).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$ther.js`)

Hindi bug$v$, $v$ther.js`)
- 2026-10-24 · Profile ng ibang user (desktop): hindi buong lapad ang cover at nakapatong ang pangalan dito → `aspect-ratio` + `max-height` ay nagpapaliit din ng lapad, at `margin-top: -40px` ang buong header → fixed na lapad + taas (`clamp`), avatar lang ang nakapatong at nasa sariling linya ang pangalan (`social.css`)

Hindi bug$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$6-10-24 | Status rin$v$, $v$6-10-24 | Kopya ng data = .zip (csv + gpx + json) sa TigoMeNote folder; APK: Documents/TigoMeNote + `hasFragileUserData` | Naiiwan ang kopya kahit i-uninstall; Android mismo ang nagtatanong kung itatabi ang app data |
| 2026-10-24 | Status rin$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(brain_notes.body, $v$mjs` |
| `notif-badg$v$, $v$mjs` |
| `zip.js` | Gumawa ng .zip sa browser (`TMN_ZIP`) |
| `file-save.js` | I-save sa TigoMeNote folder: APK Documents, desktop na pinili, o Downloads (`TMN_FILES`) |
| `components/location-export.js` / `files-settings.js` | Kopya ng location (.zip) at Delete sheet; Settings → Files on this device |
| `notif-badg$v$), $v$ory, clearHistory, s$v$, $v$ory, clearHistory, exportHistory, s$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Safety and wellbeing$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$st`).

## Hindi pa n$v$, $v$st`).

## TigoMeNote folder at kopya ng location
- **Save copy** at **Delete** sa Location history (Safety). Bago burahin, may pagpipilian: **Save to zip, then delete**, **Delete without saving**, o Cancel.
- Laman ng zip (`TigoMeNote-location-YYYY-MM-DD_HHMM.zip`): `location-history.csv` (Excel, may Google Maps link bawat point), `.gpx` (Google Earth / maps apps), `.json` (buong data). Hanggang 30 araw (`exportHistory` sa `safety-fast` v3).
- Saan napupunta (`file-save.js`, Settings → **Files on this device**):
  - **APK:** `Documents/TigoMeNote/Location/` sa phone.
  - **Desktop (Chrome/Edge):** folder na pinili mo; gagawa ng `TigoMeNote` sa loob (hal. Documents/TigoMeNote/Location).
  - **Iba (phone browser, Safari, Firefox):** Downloads.
- Code: `assets/js/zip.js` (gawa ng .zip, walang library), `file-save.js` (`TMN_FILES`), `components/location-export.js` (`TMN_LOC_EXPORT`), `components/files-settings.js`.

## Para sa APK: folder at pag-uninstall (gagawin sa Android app)
- `TMN_APP.saveFile(path, base64, mime)` → isusulat sa **Documents/<path>** gamit ang MediaStore (hal. `TigoMeNote/Location/x.zip`). Naiiwan ito sa phone kahit i-uninstall ang app.
- Sa `AndroidManifest.xml`: `<application android:hasFragileUserData="true">` → sa pag-uninstall, **tatanungin ng Android kung itatabi ang app data** (Android 10+). Ito ang "choice kung mag-stay ang data".
- Walang paraan ang app na magpakita ng sariling tanong habang ina-uninstall (hindi pinapayagan ng Android), kaya ang dalawang ito ang gamit.

## Hindi pa n$v$), updated_by = 'claude', updated_at = now();
