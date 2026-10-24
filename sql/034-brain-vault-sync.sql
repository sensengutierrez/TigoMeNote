-- TigoMeNote · 034 · vault sync: #26 Tigo Messenger — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Messenger$v$, $v$---
tags: [build, messenger, chat]
updated: 2026-10-24
---
# Build - Messenger

**What it does:** **Tigo Messenger**: 1:1 at group chat, text, photo, location (may mapa at Directions), reactions, pin (hal. location sa itaas ng chat), Seen, "typing…", Message requests, unsend, report, mute. Sa web: nasa loob ng TigoMeNote (Messages). Sa phone (APK): **hiwalay na app** na Tigo Messenger.

**Page:** `app/messages.html` (Messages sa menu; may bilang ng bago) · links: `messages.html?c=<chat>` at `messages.html?to=<user>` (galing sa **Message** button sa profile ng iba)
**Code:** `assets/js/pages/messages.js` (inbox, Chats/Requests, search, APK gate), `components/chat-view.js` (isang chat), `components/chat-new.js` (bagong chat/group, pumili ng tao), `realtime.js` (live ping), `native-bridge.js` (`messenger`), `notif-badge.js` (bilang), `components/notif-settings.js` (Messages setting)
**Styles:** `assets/css/pages/messages.css`
**Server:** `messages-fast` v1 (+ `moderation.ts`), `notify-fast` v2 (`pushRaw`), `moderation-fast` v3 (report ng message)
**SQL:** `sql/033-messages.sql` (napatakbo na): `conversations`, `conversation_members`, `messages`, `message_reactions`, `notif_prefs.messages`, report type `message`, private bucket `chat-media`

## Sino ang puwedeng mag-message
- Kahit sino, pero kung **hindi ka nila fina-follow** (o wala ka sa Family/Friends nila), mapupunta muna sa **Requests**. Doon: Accept, Delete o Report. Ang pag-reply = pagtanggap.
- **Teen (13–17):** mutual followers at Family/Friends lang (pareho sa pagpapadala at pagtanggap).
- Group: 3–50 tao; ang gumawa ang admin. Admin: Add people, Remove, Pin. Lahat: Rename, Mute, Leave (kapag umalis ang huling admin, may bagong admin).
- Lahat ng text ay dumadaan sa text filter (block/flag) at sa teen rules (bawal ang phone, email, ibang app).

## Paano gumagana
- **Live:** Supabase Realtime (broadcast) sa lihim na channel bawat chat (`channel_key`). "Ping" lang ang dumadaan (walang laman ng message); ang browser ang kumukuha sa server. "typing…" ay diretso sa channel. Kapag hindi konektado: poll bawat 4 s habang bukas ang chat.
- **Seen:** `last_read_at` bawat member. DM: "Seen"/"Sent"; group: "Seen by N" / "Seen by everyone".
- **Photo:** compress (gaya ng posts), signed upload sa `chat-media`, signed URL (1 oras).
- **Location:** kasalukuyang GPS (may tanong muna), card na may **View map** (Leaflet) at **Directions**. Puwedeng i-**pin** para laging nasa itaas.
- **Push:** bawat message (hindi naka-save sa Notifications), sinusunod ang **Messages** setting, Pause all, Sleep mode at Mute ng chat. Hindi lumalabas kung nakabukas na ang chat na iyon.

## Tigo Messenger sa APK (hiwalay na app)
- Sa **TigoMeNote APK**, ang Messages ay hindi nagbubukas ng chat: tinitingnan kung naka-install ang **Tigo Messenger** (`TMN_APP.hasApp("messenger")`). Kung oo → `openApp("messenger", "?c=…")`; kung hindi → **Install Tigo Messenger** (`installApp`, Play Store).
- Ang **Tigo Messenger APK** ay parehong web code (`app/messages.html`) na may `TMN_APP.appName = "messenger"`; parehong account (session token).
- Push sa APK: FCM (kapag may Firebase project na), papunta sa Tigo Messenger app.

## Hindi pa na-test
- Lahat ay naka-mock (60/60 messenger: desktop, phone, Arabic, APK gate). Hindi pa nasubukan sa totoong server: pagpapadala, real-time (Realtime broadcast gamit ang publishable key), push ng message, Seen, requests at teen rules.
- Wala pang APK (Tigo Messenger at FCM).

Tingnan din: [[Build - Notifications]], [[Build - Moderation and policies]], [[System map]]
$v$, '{build,messenger,chat}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, $v$---
tags: [system]
updated: 2026-10-24
---
# System map

## Pages
| File | Folder | Ano | Login? |
|---|---|---|---|
| `index.html` | ROOT | Landing page | hindi |
| `login.html` | ROOT | Sign in / Create account | hindi |
| `home.html` | app/ | Daily | oo |
| `explore.html` | app/ | Explore: status, feed na may reactions/comments/share, hanap ng tao | oo |
| `share.html` | app/ | Share: camera / video / files → Gallery (+ "I-post din") | oo |
| `messages.html` | app/ | Tigo Messenger: chats, groups, requests (sa APK: bubuksan ang hiwalay na app) | oo |
| `gallery.html` | app/ | Gallery: albums, upload, edit (device lang) | oo |
| `profile.html` | app/ | Profile: cover, photo, edit profile, naka-pilang uploads, mga tab (Posts, Private, Reposts, Saved, Liked, History) | oo |
| `safety.html` | app/ | Safety: SOS, map, Family/Friends, invites, parental | oo |
| `notifications.html` | app/ | Notifications: activity list + notification settings | oo |
| `settings.html` | app/ | Theme, language, wellbeing, about & policies, logout | oo |
| `reports.html` | app/admin/ | Reports: review ng ni-report at auto-flag | Admin lang |
| `index, terms, privacy, guidelines, copyright, third-party.html` | legal/ | Mga policy page | hindi |

## Shared code — `assets/js/`
| File | Trabaho |
|---|---|
| `config.js` | **Lahat ng backend URL** at storage keys (`TMN_CONFIG`) |
| `i18n.js` | Wika ng site (`TMN_I18N`), auto-translate; dictionaries sa `lang/<code>.js` |
| `theme.js` | Light / Dark / Auto; nilalagay sa `<head>` para walang flash |
| `auth-guard.js` | Bantay ng private pages; redirect sa login kung walang session |
| `api.js` | `TMN_API.call(fn, action, data)` — isang paraan ng pagtawag sa server |
| `icons.js` | Lahat ng SVG icons (`TMN_ICON("sun")`) |
| `nav-items.js` | **Ang menu** (sidebar, hamburger, bottom tabs) |
| `media-store.js` | Photos/videos/albums sa device (IndexedDB) |
| `components/modal.js` | Modal, confirm, prompt (iisa sa buong site) |
| `components/photo-editor.js` | Crop, rotate, flip, adjust, filters |
| `components/weather.js` | Weather card + auto location |
| `post-queue.js` | Offline outbox ng posts: compress + kusang upload (`TMN_POSTQ`) |
| `components/post-composer.js` | "Bagong post" modal: caption, visibility, schedule |
| `components/post-viewer.js` | Post tiles + viewer + edit/delete (`TMN_POSTS_UI`) |
| `components/post-card.js` | Feed card + reactions/comment/share/bookmark (`TMN_POST_CARD`) |
| `components/social-ui.js` | Comments, sino ang nag-react/share, follow, mini profile (`TMN_SOCIAL`) |
| `components/stories.js` | Status / stories (`TMN_STORIES`) |
| `components/image-cropper.js` | Crop ng larawan bago i-upload (`TMN_CROPPER`) |
| `components/profile-editor.js` | Edit profile + palit ng photo/cover (`TMN_PROFILE_EDIT`) |
| `components/app-shell.js` | Gumagawa ng layout ng app pages mula sa nav-items |
| `native-bridge.js` | Phone features (GPS, alarm, push); sa APK: `window.TMN_APP` (`TMN_NATIVE`) |
| `push-setup.js` / `sw.js` | Push notifications (`TMN_PUSH`) + service worker |
| `safety-watch.js` / `location-share.js` | Bantay ng SOS at pagpapadala ng location sa bawat page |
| `wellbeing.js` | Sleep, break, daily limit, birthdate prompt sa bawat page |
| `components/sos-button.js` / `sos-overlay.js` / `map-view.js` / `wellbeing-settings.js` | SOS button, pulang alarm screen, mapa, wellbeing settings |
| `moderation-check.js` | Rules ng text filter sa browser (`TMN_MOD`); **huwag i-edit**, gawa ng `tools/build-moderation-client.mjs` |
| `realtime.js` | Live "ping" ng chat gamit ang Supabase Realtime (`TMN_RT`) |
| `components/chat-view.js` / `chat-new.js` | Isang chat (`TMN_CHAT`); bagong chat/group at pumili ng tao (`TMN_CHAT_NEW`) |
| `zip.js` | Gumawa ng .zip sa browser (`TMN_ZIP`) |
| `file-save.js` | I-save sa TigoMeNote folder: APK Documents, desktop na pinili, o Downloads (`TMN_FILES`) |
| `components/location-export.js` / `files-settings.js` | Kopya ng location (.zip) at Delete sheet; Settings → Files on this device |
| `notif-badge.js` | Bilang ng bagong notifications sa bell at menu, bawat page (`TMN_NOTIF_BADGE`) |
| `components/notif-settings.js` | Notification settings: push, pause, sleep mode, Off/In app/Push (`TMN_NOTIF_SETTINGS`) |
| `components/mod-guard.js` | Live na babala at harang bago mag-post/comment/save (`TMN_GUARD`) |
| `pages/<page>.js` | Code ng isang page lang |

## Styles — `assets/css/`
| File | Trabaho |
|---|---|
| `tokens.css` | **Lahat ng kulay, font, radius, shadow** (light + dark) |
| `base.css` | Reset at typography |
| `components.css` | Buttons, inputs, cards, badges, toast, segmented |
| `posts.css` | Composer, post tiles, post viewer, queue list |
| `social.css` | Feed cards, status, comments at social sheets |
| `shell.css` | Layout: sidebar, topbar, drawer, tabs |
| `pages/<page>.css` | Style ng isang page lang |

## Back end (Supabase project `tigomenote`)
| Function | Actions | Source |
|---|---|---|
| `auth-fast` | register, login, verifyEmail, resendCode, forgotPassword, resetPassword, checkSession, logout | `backend/auth-fast.ts` |
| `posts-fast` | createUpload, createPost, myPosts, userPosts, getPost, feed, updatePost, deletePost, react, reactions, comments, addComment, deleteComment, bookmark, bookmarks, share, unrepost, shares, view, pin, liked, reposts, history | `backend/posts-fast.ts` |
| `social-fast` | follow, unfollow, people, profile, followList, requests, approveRequest, declineRequest, stories, storyUpload, createStory, viewStory, storyViewers, deleteStory | `backend/social-fast.ts` |
| `profile-fast` | get, update, imageUpload, setImage, removeImage | `backend/profile-fast.ts` |
| `safety-fast` | circle, invite, respond, update, remove, pause, ping, history, clearHistory, exportHistory, sos, sosUpdate, sosEnd, alerts, ack, pushKey, subscribe, unsubscribe, testPush | `backend/safety-fast.ts` + `webpush.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
| `moderation-fast` | report, queue, resolve, count | `backend/moderation-fast.ts` (+ `notify.ts`) |
| `messages-fast` | inbox, unread, open, start, group, send, upload, react, pin, read, accept, decline, unsend, rename, addMembers, removeMember, leave, mute | `backend/messages-fast.ts` (+ `moderation.ts`) |
| `notify-fast` | list, count, seen, prefs, setPrefs, push at pushRaw (service key lang) | `backend/notify-fast.ts` (+ `webpush.ts`) |

Ang `moderation.ts` (text filter) ay kasama sa deploy ng posts-fast, social-fast, profile-fast at auth-fast. Ang `notify.ts` ay kasama sa deploy ng posts-fast, social-fast at moderation-fast.

| Table | Para saan | SQL |
|---|---|---|
| `users` | accounts | `sql/001-users.sql` |
| `sessions` | login tokens (hash lang) | `sql/002-sessions.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
| `brain_notes` | kopya ng vault na ito sa database | `sql/004-brain-notes.sql` |
| `email_codes` | 6-digit codes (hash lang), purpose `verify` o `reset` | `sql/007-email-verify.sql` |
| `posts` | caption, visibility, `publish_at` (schedule), `client_id` (walang doble) | `sql/013-posts.sql` |
| `post_media` | photos/videos ng post (path sa bucket) | `sql/013-posts.sql` |
| `follows` | sino ang naka-follow kanino (para sa "Followers") | `sql/013-posts.sql` |
| `post_reactions` | isang emoji bawat tao bawat post | `sql/017-social.sql` |
| `post_comments` | comments (soft delete) | `sql/017-social.sql` |
| `post_bookmarks` | Saved posts | `sql/017-social.sql` |
| `post_shares` | repost o link share | `sql/017-social.sql` |
| `stories` / `story_views` | status (24 oras) at sino ang nanood | `sql/017-social.sql` |
| `post_views` | sino ang nakakita ng post at kailan (views + History) | `sql/020-views-pins.sql` |
| `safety_links` | Family/Friends (isang row bawat pares, may share bawat panig) | `sql/023-safety.sql` |
| `location_points` | location (30 araw) | `sql/023-safety.sql` |
| `sos_alerts` / `sos_acks` | SOS at sino ang tumutugon | `sql/023-safety.sql` |
| `push_subs` | push subscriptions (webpush ngayon, fcm sa APK) | `sql/023-safety.sql` |
| `app_keys` | server keys (VAPID) | `sql/023-safety.sql` |
| `guardian_links` | magulang ↔ teen | `sql/024-wellbeing.sql` |
| `follow_requests` | follow requests sa private account | `sql/024-wellbeing.sql` |
| `wellbeing` | sleep, break, daily limit, timezone | `sql/024-wellbeing.sql` |
| `usage_days` | oras ng gamit bawat araw | `sql/024-wellbeing.sql` |
| `reports` | report ng users at automatic na flag | `sql/026-moderation.sql` |
| `moderation_log` | log ng admin at automatic na block/flag | `sql/026-moderation.sql` |
| `notifications` | activity ng bawat user (reaction, comment, follow, milestone, recap, notice) | `sql/029-notifications.sql` |
| `conversations` / `conversation_members` | chats, members, requests, Seen (`last_read_at`) | `sql/033-messages.sql` |
| `messages` / `message_reactions` | messages (text, photo, location, system) at reactions | `sql/033-messages.sql` |
| `notif_prefs` | settings ng notifications (pause, sleep, Off/In app/Push) | `sql/029-notifications.sql` |

`posts` ay may `pinned_at` (hanggang 3) at `view_count` (sql/020). Function: `record_post_views()` (service_role lang).

Storage bucket: **`post-media`** (private, 12 MB/file, jpeg/webp/webm/mp4). Signed URLs lang galing sa `posts-fast`.
Storage bucket: **`profile-media`** (public na view, 3 MB/file, jpeg/webp). Upload ay galing lang sa `profile-fast`.

`users` ay may `email` at `email_verified_at` (sql/007), `banner_url`, `avatar_path`, `banner_path` (sql/015), `loc_paused` (sql/023), `birthdate`, `private_account` (sql/024), `strikes` (sql/026). Ang `posts`, `post_comments`, `stories` ay may `hidden_at` (sql/026). Status: Unverified → Active / Pending / Inactive.

## Tools
`tools/cache-bust.py` — naglalagay ng `?v=<version>` (galing sa `config.js`) sa lahat ng sariling `.js`/`.css` sa HTML. Patakbuhin tuwing release.
`tools/make-icons.py` — gumagawa ng app icons sa `assets/img/`.
`tools/build-moderation-client.mjs` — kinokopya ang CORE ng `backend/moderation.ts` papuntang `assets/js/moderation-check.js`. Patakbuhin (`node tools/build-moderation-client.mjs`) tuwing babaguhin ang rules.

## External (libre, walang key)
Open-Meteo (forecast), BigDataCloud (reverse geocode), ipapi.co / geojs.io (IP location), Brevo (email, server-side), Leaflet (cdnjs) + OpenStreetMap tiles (mapa).

## Paano dumadaloy ang isang private page
1. `theme.js` → kulay agad
2. `config.js` → URLs
3. `auth-guard.js` → tago muna ang page, check ng token (cache 60 s)
4. Page HTML (`<main id="page">`)
5. `icons.js` → `nav-items.js` → `app-shell.js` (bumubuo ng menu sa paligid ng page)
6. `pages/<page>.js`

Tingnan din: [[How to edit]], [[Build - Foundation]]
$v$, '{system}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$00 Home$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$sa Status

## Plans
$v$, $v$sa Status
- [[Build - Messenger]] — Tigo Messenger: chats, groups, photo, location + pin, reactions, Seen, requests; hiwalay na app sa APK

## Plans
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$er, APK).
$v$, $v$er, APK).

## 2026-10-24 · #26 Tigo Messenger (gumagana na ang Messages)
- **Ano:** 1:1 at group chat na may text, photo, location (View map + Directions, puwedeng i-pin), reactions, Seen, "typing…", unsend, mute at report. Message requests para sa hindi ka fina-follow; teen = mutual followers at Family/Friends lang. **Message** button sa profile ng iba. Push ng bagong message (may **Messages** sa Notification settings). Sa TigoMeNote APK: kailangan ang hiwalay na **Tigo Messenger** app (Open o Install).
- **Bakit:** Hiling ni Bench: "paganahin na ang message, tapos ready notif pag may apps na, at laging hahanapin ng apps ung separated TIGO messenger"; features: text + seen + typing, photos, reactions, group chat, at "pwede mag pin location".
- **Files:** `sql/033-messages.sql`, `backend/messages-fast.ts` (bago, v1), `notify-fast.ts` (v2, `pushRaw`), `moderation-fast.ts` (v3), `moderation.ts`, `app/messages.html`, `assets/js/pages/messages.js`, `components/chat-view.js` (bago), `components/chat-new.js` (bago), `realtime.js` (bago), `native-bridge.js`, `notif-badge.js`, `components/notif-settings.js`, `components/social-ui.js` (Message button), `pages/admin-reports.js`, `icons.js` (bellOff), `sw.js`, `assets/css/pages/messages.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.9.0, `messages`)
- **Paano:** Detalye: [[Build - Messenger]].
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$ial.css`)

Hindi bug$v$, $v$ial.css`)
- 2026-10-24 · Messenger (test): hindi mapindot ang Send kapag may babala ng text filter → ang babala ay nakapatong sa Send button → nasa itaas na ng composer ang babala (`messages.css`)

Hindi bug$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$6-10-24 | Kopya ng d$v$, $v$6-10-24 | Messenger: sa web, nasa loob ng TigoMeNote; sa APK, hiwalay na **Tigo Messenger** app (parehong code at account) | Hiling ni Bench; magaan ang main app at may sariling notifications ang chat |
| 2026-10-24 | Message requests kung hindi ka fina-follow; teen = mutual followers at Family/Friends lang | Iwas spam at proteksyon ng bata |
| 2026-10-24 | Real-time = Realtime broadcast "ping" sa lihim na channel + poll bilang backup | Custom login (walang Supabase Auth), kaya walang laman ng message na dumadaan sa Realtime |
| 2026-10-24 | Kopya ng d$v$), updated_by = 'claude', updated_at = now();
