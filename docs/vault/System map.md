---
tags: [system]
updated: 2026-10-23
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
| `messages.html` | app/ | Messages (placeholder) | oo |
| `gallery.html` | app/ | Gallery: albums, upload, edit (device lang) | oo |
| `profile.html` | app/ | Profile: cover, photo, edit profile, naka-pilang uploads, mga tab (Posts, Private, Reposts, Saved, Liked, History) | oo |
| `safety.html` | app/ | Safety: SOS, map, Family/Friends, invites, parental | oo |
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
| `safety-fast` | circle, invite, respond, update, remove, pause, ping, history, clearHistory, sos, sosUpdate, sosEnd, alerts, ack, pushKey, subscribe, unsubscribe, testPush | `backend/safety-fast.ts` + `webpush.ts` |
| `wellbeing-fast` | status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove | `backend/wellbeing-fast.ts` |
| `moderation-fast` | report, queue, resolve, count | `backend/moderation-fast.ts` |

Ang `moderation.ts` (text filter) ay kasama sa deploy ng posts-fast, social-fast, profile-fast at auth-fast.

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

`posts` ay may `pinned_at` (hanggang 3) at `view_count` (sql/020). Function: `record_post_views()` (service_role lang).

Storage bucket: **`post-media`** (private, 12 MB/file, jpeg/webp/webm/mp4). Signed URLs lang galing sa `posts-fast`.
Storage bucket: **`profile-media`** (public na view, 3 MB/file, jpeg/webp). Upload ay galing lang sa `profile-fast`.

`users` ay may `email` at `email_verified_at` (sql/007), `banner_url`, `avatar_path`, `banner_path` (sql/015), `loc_paused` (sql/023), `birthdate`, `private_account` (sql/024), `strikes` (sql/026). Ang `posts`, `post_comments`, `stories` ay may `hidden_at` (sql/026). Status: Unverified → Active / Pending / Inactive.

## Tools
`tools/cache-bust.py` — naglalagay ng `?v=<version>` (galing sa `config.js`) sa lahat ng sariling `.js`/`.css` sa HTML. Patakbuhin tuwing release.
`tools/make-icons.py` — gumagawa ng app icons sa `assets/img/`.

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
