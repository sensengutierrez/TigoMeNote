-- TigoMeNote · 030 · vault sync: #23 Notifications + TigoMeNote ring — record lang; napatakbo na
-- Build note = buong body; 00 Home, Change log, Fix log, Decisions, System map = replace() upsert. Laman: docs/vault.
insert into brain_notes (title, body, tags, updated_by) values ($v$00 Home$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$n Reports

## Plans
$v$, $v$n Reports
- [[Build - Notifications]] — activity list, push, notification settings, TigoMeNote ring sa Status

## Plans
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$`). Detalye: [[Build - Moderation and policies]].
$v$, $v$`). Detalye: [[Build - Moderation and policies]].

## 2026-10-24 · #23 Notifications + settings, at sariling TigoMeNote ring sa Status
- **Ano:** Bagong **Notifications** page: reactions, comments, reposts, bagong followers, follow requests (Confirm/Delete), milestones, lingguhang buod at account notices; may bell na may bilang sa itaas at sa menu, at push sa phone. **Notification settings**: Push on this device, Pause all, Sleep mode, at Off / In app / Push bawat uri. Pinalitan ang kulay-Instagram na ring ng Status: rounded-square na coral → amber → mint, may hati bawat status.
- **Bakit:** Ayon kay Bench habang nagte-test: "wala pa pala tayong notification ganto", at ang ring sa status ay "di natin gagayahin ung kulay sa Instagram… dapat merron tayong unique design at kulay".
- **Files:** `sql/029-notifications.sql`, `backend/notify.ts` (bago), `backend/notify-fast.ts` (bago, v1), `posts-fast.ts` (v8), `social-fast.ts` (v7), `moderation-fast.ts` (v2), `app/notifications.html`, `assets/js/pages/notifications.js`, `components/notif-settings.js`, `notif-badge.js`, `nav-items.js`, `components/app-shell.js`, `components/stories.js`, `icons.js` (trophy, chart), `config.js` (0.8.0, `notify`), `assets/css/pages/notifications.css`, `social.css`, `shell.css`, `tokens.css`, `app/settings.html`, lahat ng `app/*.html` (notif-badge), `lang/ar.js`, `lang/fil.js`, `sw.js`
- **Paano:** Detalye: [[Build - Notifications]].
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$ial.css`)

Hindi bug$v$, $v$ial.css`)
- 2026-10-24 · Notifications: "maria, jose and 1 others" kapag 3 tao → laging "and N others" kahit isa lang ang natira → 3 tao = tatlong pangalan; "and N others" kapag 4+ (`pages/notifications.js`)
- 2026-10-24 · Notifications sa phone: naiipit ang text ng follow request dahil sa Confirm/Delete sa gilid → ang buttons ay nasa ilalim na ng text (`pages/notifications.js`, `notifications.css`)

Hindi bug$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$6-10-24 | Iisang rul$v$, $v$6-10-24 | Status ring: sariling disenyo (rounded-square, coral → amber → mint, may hati bawat status) | Hindi kopya ng Instagram; tugma sa "Note" ng TigoMeNote |
| 2026-10-24 | Notifications: Off / In app / Push bawat uri; laging naka-on ang SOS at account notices | Kontrol sa user pero hindi nawawala ang mahalagang abiso |
| 2026-10-24 | Push ng notifications ay sa `notify-fast` lang (tinatawag ng `notify.ts` gamit ang service key) | Isang lugar ang VAPID/web push; hindi bumabagal ang like/comment |
| 2026-10-24 | Iisang rul$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(replace(replace(replace(brain_notes.body, $v$, parental | oo |
| $v$, $v$, parental | oo |
| `notifications.html` | app/ | Notifications: activity list + notification settings | oo |
| $v$), $v$mjs` |
| `components$v$, $v$mjs` |
| `notif-badge.js` | Bilang ng bagong notifications sa bell at menu, bawat page (`TMN_NOTIF_BADGE`) |
| `components/notif-settings.js` | Notification settings: push, pause, sleep mode, Off/In app/Push (`TMN_NOTIF_SETTINGS`) |
| `components$v$), $v$-fast.ts` |

Ang `mo$v$, $v$-fast.ts` (+ `notify.ts`) |
| `notify-fast` | list, count, seen, prefs, setPrefs, push (service key lang) | `backend/notify-fast.ts` (+ `webpush.ts`) |

Ang `mo$v$), $v$st at auth-fast.

| $v$, $v$st at auth-fast. Ang `notify.ts` ay kasama sa deploy ng posts-fast, social-fast at moderation-fast.

| $v$), $v$on.sql` |

`posts` a$v$, $v$on.sql` |
| `notifications` | activity ng bawat user (reaction, comment, follow, milestone, recap, notice) | `sql/029-notifications.sql` |
| `notif_prefs` | settings ng notifications (pause, sleep, Off/In app/Push) | `sql/029-notifications.sql` |

`posts` a$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Notifications$v$, $v$---
tags: [build, notifications, status]
updated: 2026-10-24
---
# Build - Notifications

**What it does:** Listahan ng activity (sino ang nag-react, nag-comment, nag-repost, nag-follow, follow requests, milestones, lingguhang buod, at account notices), push sa phone, settings ng notifications, at bagong disenyo ng **TigoMeNote ring** sa Status.

**Page:** `app/notifications.html` (sa menu bilang **Notifications**; bell sa itaas ng phone na may bilang). Settings: desktop = sa gilid ng page; phone = gear (⚙). May link din sa Settings → Notifications.
**Code:** `assets/js/pages/notifications.js` (listahan), `components/notif-settings.js` (settings), `notif-badge.js` (bilang sa bell, bawat page), `nav-items.js` (`topbar: ["notifications"]`), `components/app-shell.js` (bell sa topbar)
**Styles:** `assets/css/pages/notifications.css`; ring sa `social.css`; kulay sa `tokens.css` (`--ring-1/2/3`)
**Server:** `notify-fast` v1 (list, count, seen, prefs, setPrefs, push) + `backend/notify.ts` (kasama sa deploy ng `posts-fast` v8, `social-fast` v7, `moderation-fast` v2)
**SQL:** `sql/029-notifications.sql` (napatakbo na): `notifications`, `notif_prefs`

## Paano gumagana
- Ang `notify.ts` ang nagse-save ng notification (sa posts-fast, social-fast, moderation-fast), tapos sinasabihan ang `notify-fast` (action `push`, service key lang) na ipadala sa phone. Hindi pinapabagal ang like/comment.
- **Reaction** at **repost**: isa lang bawat tao bawat post (kapag pinalitan ang emoji, ina-update lang, walang bagong push). Kapag inalis ang reaction/repost, nawawala rin ang notification.
- **Follow request**: may **Confirm** at **Delete** sa listahan. Kapag na-confirm: nagiging "started following you", at sinasabihan ang nag-request ("accepted your follow request").
- **Milestone**: 1st, 10, 25, 50, 100, 200, 300, 500, 1000 posts (isang beses lang bawat bilang).
- **Weekly recap**: ginagawa kapag binuksan ang Notifications, isang beses bawat 7 araw, kapag may nangyari (posts, reactions, comments, bagong followers).
- **Account notices** (laging naka-on): itinago habang may review, itinago ng admin, tinanggal (+strike), warning, at "visible again".
- Pinagsasama sa listahan: "maria, jose and 2 others reacted ❤️🔥 to your post" (bawat post bawat araw); followers bawat araw. Mga grupo: New, Today, This week, This month, Earlier. Pagbukas ng page = nakita na lahat.
- Nililinis ang mas luma sa 90 araw.

## Settings (`notif_prefs`)
- **Push on this device** (gamit ang `push-setup.js`), **Pause all** (15 min, 1 h, 8 h, 24 h), **Sleep mode** (walang push habang Sleep time sa Wellbeing).
- Bawat uri: **Off** (hindi na ise-save) / **In app** (listahan lang) / **Push** (listahan + phone): Reactions, Comments, Reposts, Followers and requests, From TigoMeNote.
- Laging naka-on: SOS (safety-fast) at account notices.

## TigoMeNote ring (Status)
- Hindi na bilog na kulay-Instagram. Rounded-square na parang **note**, kulay **coral → amber → mint** (`--ring-1/2/3`), may **hati bawat status** (hal. 3 status = 3 guhit, hanggang 12). Nakita na = gray na may hati pa rin. Plus badge ay rounded-square din.
- Ang parehong kulay ang gamit sa maliit na badge ng notifications (❤️ coral, 💬 mint, repost amber).

## Hindi pa na-test
- Lahat ay naka-mock (65/65 notifications: desktop, phone, dark, Arabic). Hindi pa nasubukan sa totoong server: pag-save ng notification, push sa phone, pause/sleep, recap at milestone.
- Wala pang push sa APK (FCM) at wala pang notification para sa Family/Safety invites dito (nasa safety-fast push pa rin ang mga iyon).
- English ang text ng push sa phone (ang listahan sa app ay isinasalin).

Tingnan din: [[Build - Social feed]], [[Build - Moderation and policies]], [[Build - Safety and wellbeing]], [[System map]]
$v$, '{build,notifications,status}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
