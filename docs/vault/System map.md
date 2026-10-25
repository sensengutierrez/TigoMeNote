---
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
| `share.html` | app/ | Share: sariling camera na may filters + auto sound → Gallery (+ Save & post) | oo |
| `sound-maker.html` | app/ | Sound Maker: gumawa ng sariling beat/tunog, listahan ng My sounds | oo |
| `messages.html` | app/ | Tigo Messenger: chats, groups, requests (sa APK: bubuksan ang hiwalay na app) | oo |
| `gallery.html` | app/ | Gallery: albums, upload, edit (device lang) | oo |
| `get/index.html` | get/ | Get the app: Android APK, iPhone (Home Screen + notifications), QR para sa computer (public) | hindi |
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
| `api.js` | `TMN_API.call(fn, action, data)` — isang paraan ng pagtawag sa server (token sa body, `text/plain`: walang preflight) |
| `icons.js` | Lahat ng SVG icons (`TMN_ICON("sun")`) |
| `nav-items.js` | **Ang menu** (sidebar, hamburger, bottom tabs) |
| `media-store.js` | Photos/videos/albums sa device (IndexedDB) |
| `components/modal.js` | Modal, confirm, prompt (iisa sa buong site) |
| `components/photo-editor.js` | Crop, rotate, flip, adjust, filters |
| `filters.js` | Iisang listahan ng 13 libreng filters + `draw()` (`TMN_FILTERS`) |
| `components/camera.js` | Sariling camera: live filters, photo, video ≤15 s (`TMN_CAMERA`) |
| `sounds.js` | TigoMeNote Sounds: music na gawa sa device, auto-pick, ♪ chip (`TMN_SOUNDS`) |
| `emoji-data.js` / `components/emoji-picker.js` | Listahan ng emoji (pati pinakabago) at emoji picker + Stickers tab (`TMN_EMOJI_DATA`, `TMN_EMOJI_PICK`) |
| `stickers.js` | 20 sariling TigoMeNote stickers na SVG (`TMN_STICKERS`) |
| `components/sound-picker.js` / `capture-review.js` | Pumili ng sound + Sound row (`TMN_SOUND_PICK`, may My sounds); review pagkakuha (`TMN_REVIEW`) |
| `components/sound-maker.js` | Sound Maker editor (`TMN_SOUND_MAKER`: mount, open, mine) |
| `components/weather.js` | Weather card + auto location |
| `post-queue.js` | Offline outbox ng posts: compress + kusang upload (`TMN_POSTQ`) |
| `components/post-composer.js` | "Bagong post" modal: caption, visibility, schedule |
| `components/post-viewer.js` | Post tiles + viewer + edit/delete (`TMN_POSTS_UI`) |
| `components/post-card.js` | Feed card + reactions/comment/share/bookmark (`TMN_POST_CARD`) |
| `components/social-ui.js` | Comments, sino ang nag-react/share, follow, mini profile (`TMN_SOCIAL`) |
| `components/stories.js` | Status / stories (`TMN_STORIES`) |
| `components/media-viewer.js` | Buong-screen na photo/video/mapa na may X, swipe, Esc, Back (`TMN_VIEWER`) |
| `route.js` | Route ng Explore post: stats, GPX, static na mapa (SVG), Leaflet na mapa (`TMN_ROUTE`) |
| `components/activity-recorder.js` | I-record ang nilakbay gamit ang GPS (`TMN_TRACK`) |
| `components/activity-composer.js` | Explore post: route (Record/GPX/history) + photos + stats (`TMN_ACTIVITY`) |
| `components/create-menu.js` | "Create": Status / Post / Explore (`TMN_CREATE`) |
| `appearance.js` / `look-tigo.js` | Background ng app sa lahat ng page + sariling TigoMeNote designs (`TMN_LOOK`, `TMN_LOOK_TIGO`) |
| `components/appearance-settings.js` | Settings → Background: presets, kulay, picture (desktop/phone), sliders (`TMN_LOOK_UI`) |
| `tigo/pet-model.js` / `tigo/pet-scene.js` | 3D na si Tigo (lakad, talon, sayaw) at ang mundo (camera, bisita, sabay na galaw) — ES modules, three.js |
| `tigo/catalog.js` / `outfit.js` / `backdrops.js` / `buddies.js` | Closet items, isinusuot sa 3D, mga lugar + bahay kubo, maliliit na alaga |
| `tigo/controls.js` / `coin-game.js` / `pac-game.js` / `race-game.js` | WASD/arrows + Space, 2 joystick (lakad + camera) · Coin Rush · Pac-Tigo · Tigo Racing |
| `tigo/camera-rig.js` / `sky-dome.js` | Camera: 360°, tingala, Follow/Top/Close-up, zoom · 3D na langit (ulap, araw, buwan, bituin) |
| `tigo/room.js` / `furniture.js` / `room-ui.js` | Loob ng bahay (dingding, sahig, banggaan) · mga gamit sa 3D · Decorate panel |
| `tigo/photo.js` | 📸 litrato ni Tigo (frame, Save, Share, Share to Explore) + level-up share |
| `tigo/voice.js` / `talk.js` | Boses-baby ni Tigo (synth o speech), game sounds, speech bubble, Sound settings |
| `tigo/closet-ui.js` / `games-ui.js` / `journey-ui.js` | Closet panel, listahan ng laro + HUD, Growth journey |
| `pages/tigo.js` | Tigo page: alaga, closet, laro, journey, full screen, nearby/gather, sabay na galaw, visits |
| `daily-store.js` / `components/daily-notes.js` | Daily notes sa device (IndexedDB): note, to-do, photos, mood, On this day (`TMN_DAILY`, `TMN_DAILY_UI`) |
| `components/reminders.js` / `mini-calendar.js` / `home-clock.js` | Reminders & alarms (`TMN_REMIND`), calendar ng buwan (`TMN_CAL`), Pinas ⇄ dito (`TMN_HOMECLOCK`) |
| `music-store.js` / `components/music-player.js` | My music: playlist sa device (IndexedDB) + player sa profile (`TMN_MUSICDB`, `TMN_MUSIC`) |
| `components/image-cropper.js` | Crop ng larawan bago i-upload (`TMN_CROPPER`) |
| `components/profile-editor.js` | Edit profile + palit ng photo/cover (`TMN_PROFILE_EDIT`) |
| `components/app-shell.js` | Gumagawa ng layout ng app pages mula sa nav-items |
| `native-bridge.js` | Phone features (GPS, alarm, push); sa APK: `window.TMN_APP` (`TMN_NATIVE`) |
| `push-setup.js` / `sw.js` | Push notifications (`TMN_PUSH`) + service worker: cache ng static (`?v=`), pages, fonts at Storage photos |
| `safety-watch.js` / `location-share.js` | Bantay ng SOS at pagpapadala ng location sa bawat page |
| `wellbeing.js` | Sleep, break, daily limit, birthdate prompt sa bawat page |
| `components/sos-button.js` / `sos-overlay.js` / `map-view.js` / `wellbeing-settings.js` | SOS button, pulang alarm screen, mapa, wellbeing settings |
| `moderation-check.js` | Rules ng text filter sa browser (`TMN_MOD`); **huwag i-edit**, gawa ng `tools/build-moderation-client.mjs` |
| `realtime.js` | Live "ping" ng chat gamit ang Supabase Realtime (`TMN_RT`) |
| `components/chat-view.js` / `chat-new.js` | Isang chat (`TMN_CHAT`); bagong chat/group at pumili ng tao (`TMN_CHAT_NEW`) |
| `zip.js` | Gumawa ng .zip sa browser (`TMN_ZIP`) |
| `components/video-player.js` | Video play mode: full screen, minimize (lumulutang na mini player), drag (`TMN_PLAYER`) |
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
| `posts.css` | Composer, post tiles, post viewer, queue list, ♪ chip |
| `camera.css` / `sounds.css` | Camera + review; sound picker at Sound row |
| `social.css` | Feed cards, status, comments at social sheets |
| `shell.css` | Layout: sidebar, topbar, drawer, tabs |
| `pages/<page>.css` | Style ng isang page lang |

## Back end (Supabase project `tigomenote`)
| Function | Actions | Source |
|---|---|---|
| `auth-fast` | register, login, verifyEmail, resendCode, forgotPassword, resetPassword, checkSession, logout | `backend/auth-fast.ts` |
| `posts-fast` | createUpload, createPost, myPosts, userPosts, getPost, feed, updatePost, deletePost, react, reactions, comments, addComment, deleteComment, bookmark, bookmarks, share, unrepost, shares, view, pin, liked, reposts, history | `backend/posts-fast.ts` |
| `social-fast` | follow, unfollow, people, profile, followList, requests, approveRequest, declineRequest, stories, storyUpload, createStory, viewStory, likeStory, storyViewers, deleteStory, soundTrends | `backend/social-fast.ts` |
| `profile-fast` | get, update, imageUpload, setImage, removeImage | `backend/profile-fast.ts` |
| `safety-fast` | circle, invite, respond, update, remove, pause, ping, history, clearHistory, exportHistory, sos, sosUpdate, sosEnd, alerts, ack, pushKey, subscribe, unsubscribe, testPush | `backend/safety-fast.ts` + `webpush.ts` |
| `daily-fast` | list, save, remove, done, snooze; due (cron bawat minuto, key `cron_daily`) | `backend/daily-fast.ts` + `webpush.ts` |
| `pet-fast` | get, act (feed/play/clean/pet/sleep/wake/daily), style, wear, buy, game (coins/pac/race), nearby, gather, visits, room | `backend/pet-fast.ts` + `webpush.ts` |
| `sounds-fast` | mine, save, remove (Sound Maker) | `backend/sounds-fast.ts` + `moderation.ts` + `sound-recipe.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
| `moderation-fast` | report, queue, resolve, count | `backend/moderation-fast.ts` (+ `notify.ts`) |
| `messages-fast` | inbox, unread, open, start, group, send, upload, react, pin, read, accept, decline, unsend, rename, addMembers, removeMember, leave, mute | `backend/messages-fast.ts` (+ `moderation.ts`) |
| `gifs-fast` | trending, search (GIFs/stickers ng KLIPY; secret `KLIPY_API_KEY`) | `backend/gifs-fast.ts` (+ `moderation.ts` para sa edad) |
| `notify-fast` | list, count, seen, prefs, setPrefs, push at pushRaw (service key lang) | `backend/notify-fast.ts` (+ `webpush.ts`) |

Ang `moderation.ts` (text filter) ay kasama sa deploy ng posts-fast, social-fast, profile-fast at auth-fast. Ang `notify.ts` ay kasama sa deploy ng posts-fast, social-fast at moderation-fast. Ang `sound-recipe.ts` ay kasama sa posts-fast, social-fast at sounds-fast.

| Table | Para saan | SQL |
|---|---|---|
| `users` | accounts (+ `appearance`, `bg_desktop_url`, `bg_phone_url` = background ng app) | `sql/001-users.sql`, `sql/048-app-background.sql` |
| `sessions` | login tokens (hash lang) | `sql/002-sessions.sql` |
| `reminders` | Daily reminders at alarms (oras, ulit, sent/done) | `sql/050-daily-reminders.sql` |
| `pets` / `pet_meets` | si Tigo ng bawat user (stats, XP, style, coins, owned, outfit, room, near_*) at ang mga Gather | `sql/052-tigo-pets.sql`, `sql/055-tigo-closet.sql`, `sql/065-tigo-room.sql` |
| `user_sounds` | Sound Maker: recipe ng sariling tunog (hanggang 30 bawat user) | `sql/066-user-sounds.sql` |
| `write_action_dedup` | rate limit / duplicate guard | `sql/003-write-action-dedup.sql` |
| `brain_notes` | kopya ng vault na ito sa database | `sql/004-brain-notes.sql` |
| `email_codes` | 6-digit codes (hash lang), purpose `verify` o `reset` | `sql/007-email-verify.sql` |
| `posts` | caption, visibility, `publish_at` (schedule), `client_id` (walang doble), `activity` (Explore route + stats) | `sql/013-posts.sql`, `sql/046-explore-activity.sql` |
| `post_media` | photos/videos ng post (path sa bucket) | `sql/013-posts.sql` |
| `follows` | sino ang naka-follow kanino (para sa "Followers") | `sql/013-posts.sql` |
| `post_reactions` | isang emoji bawat tao bawat post | `sql/017-social.sql` |
| `post_comments` | comments (soft delete) | `sql/017-social.sql` |
| `post_bookmarks` | Saved posts | `sql/017-social.sql` |
| `post_shares` | repost o link share | `sql/017-social.sql` |
| `stories` / `story_views` | status (24 oras, may sound) at sino ang nanood / nag-❤️ (`liked_at`) | `sql/017-social.sql`, `sql/059-story-likes-sounds.sql` |
| `post_views` | sino ang nakakita ng post at kailan (views + History) | `sql/020-views-pins.sql` |
| `safety_links` | Family/Friends (isang row bawat pares, may share at label bawat panig) | `sql/023-safety.sql`, `sql/043-circle-labels.sql` |
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
| `notifications` | activity ng bawat user (reaction, comment, follow, milestone, recap, notice, Family/Friends invite at accept) | `sql/029-notifications.sql`, `sql/037` |
| `conversations` / `conversation_members` | chats, members, requests, Seen (`last_read_at`) | `sql/033-messages.sql` |
| `messages` / `message_reactions` | messages (text, photo, location, sticker, system) at reactions (kahit anong emoji) | `sql/033-messages.sql`, `sql/037` |
| `notif_prefs` | settings ng notifications (pause, sleep, Off/In app/Push) | `sql/029-notifications.sql` |

`posts` ay may `pinned_at` (hanggang 3) at `view_count` (sql/020), at `sound` (sql/035). Function: `record_post_views()` (service_role lang).

Storage bucket: **`post-media`** (private, 12 MB/file, jpeg/webp/webm/mp4). Signed URLs lang galing sa `posts-fast`.
Storage bucket: **`profile-media`** (public na view, 3 MB/file, jpeg/webp). Upload ay galing lang sa `profile-fast`.

`users` ay may `email` at `email_verified_at` (sql/007), `banner_url`, `avatar_path`, `banner_path` (sql/015), `loc_paused` (sql/023), `birthdate`, `private_account` (sql/024), `strikes` (sql/026). Ang `posts`, `post_comments`, `stories` ay may `hidden_at` (sql/026). Status: Unverified → Active / Pending / Inactive.

## APK — `apk/`
| File | Ano |
|---|---|
| `apk/main/` · `apk/chat/` | Capacitor config, package.json at app.json (unang page) ng TigoMeNote (`com.tigomenote.app`) at TigoMeNote Chat (`com.tigomenote.chat`) |
| `apk/update-version.py` | Isinusulat ang bagong APK sa `app-version.json` (CI) |
| `apk/build-web.py` / `patch-android.py` | Kopya ng site + app-mode.js · icons, textZoom, version sa android project |
| `apk/res/<app>/` | Android icons, splash, notification icon (gawa ng tools/make-icons.py) |
| `assets/js/app-mode.js` | APK lang: walang zoom, Back button, status bar, `TMN_APP` |

## Tools
`tools/cache-bust.py` — naglalagay ng `?v=<version>` (galing sa `config.js`) sa lahat ng sariling `.js`/`.css` sa HTML. Patakbuhin tuwing release.
`tools/make-icons.py` — gumagawa ng lahat ng icon (web `assets/img/` + Android `apk/res/<app>/`) mula sa logo sa `tools/brand/logo.py`.
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
