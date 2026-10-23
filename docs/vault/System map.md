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
| `explore.html` | app/ | Explore: feed ng posts (search, filter) | oo |
| `share.html` | app/ | Share: camera / video / files → Gallery (+ "I-post din") | oo |
| `messages.html` | app/ | Messages (placeholder) | oo |
| `gallery.html` | app/ | Gallery: albums, upload, edit (device lang) | oo |
| `profile.html` | app/ | Profile: naka-pilang uploads + sariling posts | oo |
| `settings.html` | app/ | Theme + logout | oo |
| (wala pa) | app/admin/ | Admin pages | Admin lang |

## Shared code — `assets/js/`
| File | Trabaho |
|---|---|
| `config.js` | **Lahat ng backend URL** at storage keys (`TMN_CONFIG`) |
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
| `components/app-shell.js` | Gumagawa ng layout ng app pages mula sa nav-items |
| `pages/<page>.js` | Code ng isang page lang |

## Styles — `assets/css/`
| File | Trabaho |
|---|---|
| `tokens.css` | **Lahat ng kulay, font, radius, shadow** (light + dark) |
| `base.css` | Reset at typography |
| `components.css` | Buttons, inputs, cards, badges, toast, segmented |
| `posts.css` | Composer, post tiles, post viewer, queue list |
| `shell.css` | Layout: sidebar, topbar, drawer, tabs |
| `pages/<page>.css` | Style ng isang page lang |

## Back end (Supabase project `tigomenote`)
| Function | Actions | Source |
|---|---|---|
| `auth-fast` | register, login, verifyEmail, resendCode, forgotPassword, resetPassword, checkSession, logout | `backend/auth-fast.ts` |
| `posts-fast` | createUpload, createPost, myPosts, feed, updatePost, deletePost | `backend/posts-fast.ts` |

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

Storage bucket: **`post-media`** (private, 12 MB/file, jpeg/webp/webm/mp4). Signed URLs lang galing sa `posts-fast`.

`users` ay may `email` at `email_verified_at` (sql/007). Status: Unverified → Active / Pending / Inactive.

## External (libre, walang key)
Open-Meteo (forecast), BigDataCloud (reverse geocode), ipapi.co / geojs.io (IP location), Brevo (email, server-side).

## Paano dumadaloy ang isang private page
1. `theme.js` → kulay agad
2. `config.js` → URLs
3. `auth-guard.js` → tago muna ang page, check ng token (cache 60 s)
4. Page HTML (`<main id="page">`)
5. `icons.js` → `nav-items.js` → `app-shell.js` (bumubuo ng menu sa paligid ng page)
6. `pages/<page>.js`

Tingnan din: [[How to edit]], [[Build - Foundation]]
