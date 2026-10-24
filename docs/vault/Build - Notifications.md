---
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
