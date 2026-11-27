-- TigoMeNote · 137 brain vault sync (Change log #90, Decisions, Fix log 2026-11-27)
update brain_notes set body = rtrim(body, E' \n') || $v$

## 2026-11-27 · #90 Hindi umabot sa Messenger ang 0.11.58 (pumalya ang build), update sa loob lang ng app, bilog na litrato ng miyembro

- **Hiling:** Hindi na-push ang update sa Messenger; ang update ay dapat sa mismong app na mag-download at mag-install (hindi pupunta sa ibang app); ayusin ang naka-oblique na litrato ng mga miyembro.
- **Ginawa:** (1) Dahilan: pumalya ang build ng TigoMeNote Chat 0.11.58 — "429 Too Many Requests" ng Maven Central habang kinukuha ang Gradle dependencies (ang TigoMeNote ay pumasa). `apk.yml`: Gradle cache (setup-java cache: gradle) at hanggang 3 subok kapag problema sa download; pareho sa `play.yml`. (2) `app-update.js`: wala na ang "Download in Chrome instead" sa simula — sa loob ng app lahat; lumalabas lang ito kapag 2 beses nang pumalya ang download. (3) `components.css`: `.avatar` laging bilog (flex: none, aspect-ratio 1); `pages/messages.css`: tiyak na laki ng avatar sa listahan ng miyembro.
- **Files:** `.github/workflows/apk.yml`, `.github/workflows/play.yml`, `assets/js/app-update.js`, `assets/css/components.css`, `assets/css/pages/messages.css`, `whatsnew.json`, `config.js` (0.11.59)
- **Paano:** Nakita sa GitHub Actions ang dahilan ng pagpalya (log ng build ng chat). Hintayin ang build ng 0.11.59 para sa dalawang app. Paalala: ang app na mas luma sa 0.11.57 ay kailangan pang i-update isang beses sa Chrome (wala pang in-app updater ang lumang app).$v$, updated_by = 'claude', updated_at = now() where lower(title) = 'change log';
update brain_notes set body = replace(body, $v$| 2026-11-27 | Fun faces: MediaPipe Face Landmarker (kinukuha lang kapag pinili) + sariling disenyo sa canvas | Libre at walang server; gumagana sa web at APK |
$v$, $v$| 2026-11-27 | Fun faces: MediaPipe Face Landmarker (kinukuha lang kapag pinili) + sariling disenyo sa canvas | Libre at walang server; gumagana sa web at APK |
| 2026-11-27 | Update ng APK: sa loob lang ng app; Chrome ay reserba lang kapag 2 beses pumalya | Hiling ni Bench: hindi lilipat sa ibang app |
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'decisions';
update brain_notes set body = replace(body, $v$- 2026-11-27 · Tawag (mesh): hindi natatapos ang 1:1 sa kabila kapag ibinaba → "bye" = tapos na ang 1:1 (umalis lang sa group) (`components/call-rtc.js`)
$v$, $v$- 2026-11-27 · Tawag (mesh): hindi natatapos ang 1:1 sa kabila kapag ibinaba → "bye" = tapos na ang 1:1 (umalis lang sa group) (`components/call-rtc.js`)
- 2026-11-27 · Messenger: hindi dumating ang 0.11.58 → pumalya ang build ng chat dahil sa "429 Too Many Requests" ng Maven Central → Gradle cache + 3 subok (`.github/workflows/apk.yml`)
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'fix log';
select title, char_length(rtrim(body, E' \n')) n from brain_notes where lower(title) in ('change log','decisions','fix log');
