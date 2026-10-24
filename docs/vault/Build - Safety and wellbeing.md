---
tags: [build, safety]
updated: 2026-10-24
---
# Build - Safety and wellbeing

**What it does:** Family/Friends circle, Locate (map), SOS na may alarm at push, age limit (13+), Teen + parental supervision, private account + follow requests, sleep timer, give a break at daily limit. **Naka-abang na para sa APK** (`native-bridge.js`).
Plano at guidelines: [[Plan - Safety, family and wellbeing]].

**Page:** `app/safety.html` (bagong menu item **Safety**, nasa bottom tabs din) · Family & Safety card sa Profile · Wellbeing sa Settings · birthdate sa Create account
**Server:** `safety-fast` (v2, kasama ang `webpush.ts`), `wellbeing-fast` (v1), `auth-fast` (v25, birthdate), `social-fast` (v4, follow requests), `posts-fast` (v5, private account)
**SQL:** `sql/023-safety.sql`, `sql/024-wellbeing.sql` (napatakbo na). Lahat ng table: RLS on + grant sa service_role.

## Mga file (isang trabaho bawat file)
| File | Trabaho |
|---|---|
| `assets/js/native-bridge.js` | `TMN_NATIVE`: GPS, alarm (Web Audio + vibrate), push. Sa APK: gagamitin ang `window.TMN_APP` |
| `assets/js/push-setup.js` | `TMN_PUSH`: permission, subscribe, test notification |
| `sw.js` (root) | Service worker: tumatanggap ng push, binubuksan ang tamang page |
| `assets/js/safety-watch.js` | Bawat 30 s: active na SOS ng circle → pulang screen; sariling SOS → location bawat ~15 s |
| `assets/js/location-share.js` | Location bawat 5 min habang bukas ang app (kung may pinayagan kang mag-Locate) |
| `assets/js/wellbeing.js` | Oras ng gamit (bawat 60 s), sleep screen, break, daily limit, hingi ng birthdate |
| `components/sos-button.js` | Pindot nang 3 s → 5 s countdown → SOS |
| `components/sos-overlay.js` | Pulang screen + alarm ("I'm on my way", Open map, Directions, Call 999) |
| `components/map-view.js` | Leaflet + OpenStreetMap (URLs nasa `config.js` → `map`) |
| `components/wellbeing-settings.js` | Settings ng sleep, break, limit (sarili o ng teen) |
| `pages/safety.js` | Safety page: SOS, map, circle, invites, parental |
| `tools/make-icons.py` | Gumagawa ng app icons (`assets/img/`) para sa notifications at "Add to Home Screen" |
| `manifest.webmanifest` | Para ma-install ang site sa phone (kailangan ng iPhone para sa push) |

## Paano gumagana
- **Circle:** isang row bawat pares (`safety_links`, a_id < b_id). Invite → Accept. Bawat panig may sariling `a_shares/b_shares` (pinayagan bang ma-Locate).
- **Family** = naka-on ang sharing by default. **Friends** = naka-off, pinipili.
- **Location:** `location_points`, hanggang **30 araw** (binubura kusa ng `ping` at paminsan-minsan ng `circle`). Daan ng ibang member: huling 24 oras lang. Puwedeng **Pause** at **Clear history**.
- **SOS:** `sos_alerts` + `sos_acks`. Push sa buong circle (TTL 24 h). Laging gumagana: kahit sleep time o ubos na ang limit (exempt ang Safety page).
- **Push:** sariling Web Push code (RFC 8291 + VAPID), walang external service. Ang VAPID key ay ginagawa ng server isang beses at naka-save sa `app_keys` (service_role lang). Walang secret sa code o notes.
- **Age:** birthdate sa Create account; lumang account → hihingin pagbukas ng app. < 13 = bawal. 13–17 = Teen → private account + sleep naka-on.
- **Parental:** magulang (18+) ang nag-iimbita, teen ang nag-a-accept (`guardian_links`, hanggang 2). Pag accept: Family na sila at naka-on ang location ng teen. Hindi ito matatanggal o ma-pause ng teen hanggang 18. Ang magulang ang nagse-set ng sleep, break, limit at nag-a-approve ng follow requests.
- **Private account:** `follow_requests`; hindi lumalabas sa Explore ng hindi follower ang posts; hindi puwedeng i-repost.
- **Usage:** `usage_days` (bawat araw, sa timezone ng user) gamit ang `add_usage()`. Break default: **60 min** (puwedeng 10–240 o off).

## APK (naka-abang)
Kapag may `window.TMN_APP` ang Android app, iyon ang gagamitin ng `TMN_NATIVE`:
`getLocation`, `startBackgroundLocation/stopBackgroundLocation`, `alarmStart/alarmStop` (malakas kahit silent), `pushToken` (FCM, `push_subs.kind = 'fcm'`), `sendSms` (SOS kahit walang internet).
Sa server: ang FCM sending ay idadagdag kapag may Firebase project na (`pushTo()` sa `safety-fast`).

## Hindi pa na-test
- Lahat ng tests ay naka-mock (108/108 sa safety). Hindi pa nasubukan sa totoong server: invite/accept, SOS push sa totoong phone, VAPID key creation, follow requests, usage count.
- Ang totoong mapa (Leaflet galing cdnjs) at OpenStreetMap tiles: hindi abot ng test sandbox.
- iPhone push: kailangang naka-"Add to Home Screen" (iOS 16.4+).

Tingnan din: [[Plan - Safety, family and wellbeing]], [[System map]], [[Decisions]]
