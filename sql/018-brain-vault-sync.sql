-- TigoMeNote · 018 · vault sync: profile edit + social feed (kasama ang hindi natuloy na 016)
insert into public.brain_notes (title, body, tags, updated_by) values ('Build - Profile edit', $md$---
tags: [build]
updated: 2026-10-23
---
# Build - Profile edit (cover + photo)

**What it does:** Sa Profile: **Edit profile** (pangalan, bio), **profile photo** (bilog) at **cover photo / banner** (3:1). May crop bago i-upload: i-drag para iusog, slider / scroll / pinch para mag-zoom. Pareho sa desktop at phone.

**Saan pinipindot:** Profile → camera button sa photo, **Cover** button sa banner, o **Edit profile** (nandoon din ang Palitan / Alisin ng dalawang larawan).

## Files
| File | Trabaho |
|---|---|
| `app/profile.html` | Bagong hero: full-width na cover, malaking photo, pangalan, bio, stats |
| `assets/css/pages/profile.css` | Hero + Edit profile modal |
| `assets/js/pages/profile.js` | Pinapakita ang profile; Palitan/Alisin menu; kinukuha ang followers/following |
| `assets/js/components/profile-editor.js` | `TMN_PROFILE_EDIT`: Edit modal, changePhoto, removePhoto |
| `assets/js/components/image-cropper.js` | `TMN_CROPPER.open(file, {aspect})`: crop → JPEG |
| `assets/css/components.css` | Cropper + `.pick` list styles (shared) |
| `assets/js/auth-guard.js` | Bagong `TMN_AUTH.setUser(u)`: ina-update ang naka-save na user at ang menu |
| `backend/profile-fast.ts` | Edge function: get, update, imageUpload, setImage, removeImage |
| `sql/015-profile.sql` | `users.banner_url`, `avatar_path`, `banner_path` + bucket `profile-media` |

## Daloy ng palit ng larawan
1. Pili ng file → crop (photo 600×600, cover 1500×500, JPEG ~88%).
2. `imageUpload` → signed upload URL → `PUT` ng JPEG.
3. `setImage` → sinisigurong nandoon ang file → ina-update ang `users` → **binubura ang lumang file**.
4. `TMN_AUTH.setUser()` → nag-a-update ang Profile at ang user card sa menu agad.

## Rules (server)
Pangalan 1–40 characters · bio hanggang 300 · larawan max 3 MB · 20 palit bawat oras · path ay laging `<user id>/avatar-…` o `<user id>/banner-…`.

## Bakit public ang bucket
Ang profile photo at cover ay talagang makikita ng ibang users (Explore, Messages mamaya). Public link = mabilis at naka-cache. Ang **upload** ay dumadaan pa rin sa `profile-fast` (signed URL), kaya walang makakapag-upload nang walang login.

## Known limits / hindi pa na-test
- Hindi pa na-test sa totoong Supabase mula sa sandbox (naka-mock sa test). **Unang subok: palitan ang cover sa Profile.**
- Hindi pa napapalitan ang **username** (sinadya muna).
- HEIC (iPhone) na hindi kaya ng browser: hindi mabubuksan sa crop.
- Ang `checkSession` ng auth-fast ay hindi pa nagbabalik ng `banner_url`; ang Profile page ang kumukuha nito sa `profile-fast`.

Tingnan din: [[Build - Offline posts]], [[System map]]
$md$, '{build}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
insert into public.brain_notes (title, body, tags, updated_by) values ('Build - Social feed', $md$---
tags: [build]
updated: 2026-10-23
---
# Build - Social feed (reactions, comments, share, status)

**What it does:** Ang **Explore** ay parang Instagram na: **Status** ng mga fina-follow mo sa itaas, tapos feed ng posts na may **reactions** (❤️ 😂 😮 😢 🔥 👏), **comments**, **repost / share link**, at **bookmark**. Makikita kung **sino ang nag-react at nag-share**. May **Follow**, hanap ng tao, at mini profile ng ibang user.

## Paano gamitin
| Gusto mo | Gawin |
|---|---|
| ❤️ | Tap ang puso, o **double-tap** ang photo |
| Ibang emoji | Pindutin nang matagal ang puso (phone) o i-hover (desktop) |
| Sino ang nag-react / nag-share | Tap ang bilang sa tabi ng puso (may tab na **Shares**) |
| Comment | Tap ang comment icon. Pwedeng burahin ang sariling comment (at lahat ng comment sa post mo) |
| Repost | Tap ang repost icon → **Repost sa followers mo** (public posts lang, hindi sariling post) |
| Share link | Tap ang send icon → ibang app (phone) o **Copy link**. Link: `app/explore.html?post=<id>` |
| Bookmark | Tap ang bookmark. Makikita sa **Profile → Saved** |
| Status | **+** sa "Status mo" → photo/video → caption → I-share. Nawawala pagkalipas ng 24 oras |
| Follow | Follow button sa post, sa Suggestions, o sa profile ng tao |

Tabs: **Para sa iyo** (public ng lahat + followers-only ng fina-follow mo) at **Following** (posts at reposts ng fina-follow mo lang).

## Files
| File | Trabaho |
|---|---|
| `app/explore.html`, `assets/js/pages/explore.js`, `assets/css/pages/explore.css` | Explore: status bar, tabs, feed, search, suggestions |
| `assets/js/components/post-card.js` | `TMN_POST_CARD`: feed card + reactions/comment/share/bookmark buttons |
| `assets/js/components/social-ui.js` | `TMN_SOCIAL`: comments, sino ang nag-react/share, share menu, follow, mini profile |
| `assets/js/components/stories.js` | `TMN_STORIES`: status bar, viewer, pag-add ng status |
| `assets/css/social.css` | Styles ng lahat ng nasa itaas |
| `assets/js/components/post-viewer.js` | May reactions row na rin pag binuksan ang post sa Profile |
| `assets/js/pages/profile.js` | **Saved** tab, Followers/Following list |
| `backend/posts-fast.ts` (v2) | + getPost, userPosts, react, reactions, comments, addComment, deleteComment, bookmark, bookmarks, share, unrepost, shares; may `stats` na bawat post |
| `backend/social-fast.ts` | follow, unfollow, people, profile, followList, stories, storyUpload, createStory, viewStory, storyViewers, deleteStory |
| `sql/017-social.sql` | `post_reactions`, `post_comments`, `post_bookmarks`, `post_shares`, `stories`, `story_views` |

## Rules (server)
- Isang reaction bawat tao bawat post (pwedeng palitan). 6 na emoji lang.
- Comment: 1–500 characters, max 10 bawat minuto.
- Repost: public posts lang, isang beses lang bawat tao.
- Lahat ng action ay sinusuri kung pwede mong makita ang post (`canSee`): private/followers-only ay hindi makikita ng iba.
- Status: photo ≤2 MB / video ≤15 s at ≤12 MB, max 30 bawat araw. Nasa private bucket `post-media/<user>/stories/`. Ang mga expired ay binubura pag nag-post ka ulit ng status.
- Sa sariling status lang makikita kung sino ang nanood.

## Known limits / hindi pa na-test
- Hindi pa na-test sa totoong Supabase mula sa sandbox (naka-mock sa test, 46/46). **Unang subok: gumawa ng 2nd account, i-follow, mag-react at mag-comment.**
- Walang notifications pa (hal. "may nag-like sa post mo").
- Ang expired na status ng ibang tao ay hindi pa kusang nabubura sa storage (mabubura pag nag-status ulit sila).
- Walang reply sa comment at walang like sa comment.

Tingnan din: [[Build - Offline posts]], [[Build - Profile edit]], [[System map]]
$md$, '{build}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
insert into public.brain_notes (title, body, tags, updated_by) values ('Change log', $md$---
tags: [log]
updated: 2026-10-23
---
# Change log

Bawat edit: **Ano** ang ginawa, **Bakit**, **Files**, at **Paano gumagana**. Pinakabago sa ibaba.

---

## 2026-10-23 · #1 Bagong Supabase project at database
- **Ano:** Gumawa ng project `tigomenote` (region ap-south-1, Mumbai) sa account na sensengutierrez. Apat na table: `users`, `sessions`, `write_action_dedup`, `brain_notes`.
- **Bakit:** Hiwalay sa Lalabella para hindi maghati sa 1 GB storage at hindi madamay kung may problema ang isa.
- **Files:** `sql/001-users.sql` hanggang `sql/004-brain-notes.sql`
- **Paano:** Naka-**RLS on** ang lahat at walang policy, kaya ang server (service_role) lang ang nakakabasa. Hindi direktang makakapasok ang browser sa database; dadaan lahat sa edge function.

## 2026-10-23 · #2 Login back end: `auth-fast`
- **Ano:** Edge function na may 4 actions: `register`, `login`, `checkSession`, `logout`.
- **Bakit:** Sariling login (hindi Supabase Auth) gaya ng Lalabella, para isang account lang sa buong site.
- **Files:** `backend/auth-fast.ts` (source copy), deployed sa Supabase na `verify_jwt` off.
- **Paano:**
  - Password → PBKDF2-SHA256 (120,000 ulit) + sariling salt bawat user + **AUTH_PEPPER** secret. Hindi nase-save ang totoong password.
  - Login token = 32 random bytes. SHA-256 **hash** lang ang nasa `sessions`, kaya kahit manakaw ang database hindi magagamit ang tokens. 24 oras ang buhay.
  - 5 maling password → naka-lock ng 30 minuto. Max 30 maling login bawat IP sa 10 minuto; max 5 sign-up bawat IP sa 1 oras.
  - Unang nag-register = **Admin**. Kapag `REQUIRE_APPROVAL=true`, ang mga susunod ay "Pending" hanggang i-approve.

## 2026-10-23 · #3 Front-end shell
- **Ano:** `index.html` (landing), `login.html`, at 6 na app pages: Daily, Explore, Share, Messages, Profile, Settings.
- **Bakit:** Pundasyon muna bago ang mga feature; naka-folder para hindi spaghetti.
- **Files:** tingnan ang [[System map]].
- **Paano:**
  - Ang menu ay **hindi** naka-copy sa bawat page. Ang `app-shell.js` ang bumubuo ng sidebar (desktop), topbar + hamburger + bottom tabs (phone) mula sa `nav-items.js`.
  - Ang `auth-guard.js` ay nagtatago ng page (`visibility:hidden`) hanggang ma-check ang token. Kapag walang token → `login.html?next=...` para bumalik sa tamang page pagka-login.
  - Dark mode: `theme.js` naglalagay ng `data-theme="dark"` sa `<html>`; ang `tokens.css` ang may pangalawang set ng kulay. Naka-save sa browser (`tmnTheme`).
  - "Keep me signed in": naka-check = `localStorage` (natitira kahit isara ang browser); hindi = `sessionStorage` (nawawala pag sinara).

## 2026-10-23 · #4 README at .gitignore
- **Ano:** `README.md` (Taglish, folder map) at `.gitignore`.
- **Bakit:** Para maintindihan agad ang repo, at para hindi aksidenteng ma-upload ang secrets (`.env`, Android keystore).
- **Files:** `README.md`, `.gitignore` (ROOT)

## 2026-10-23 · #5 Login page: panel swap animation
- **Ano:** Pag pinindot ang Create account, dumudulas ang dark art panel pakanan at ang form pakaliwa (baliktad pag Sign in). Gumagalaw na kulay sa likod, nagbabagong quote, lumulutang na tiles, sliding pill sa tabs, fade ng form.
- **Bakit:** Hiling ni Bench — mas magandang background at UI na "nagbabaliktaran".
- **Files:** `login.html`, `assets/css/pages/auth.css`, `assets/js/pages/login.js`
- **Paano:** tingnan ang [[Build - Login page]].

## 2026-10-23 · #6 Brain vault bilang .md files
- **Ano:** Itong folder na `docs/vault/` — Obsidian-compatible notes na may `[[links]]`. Kapareho rin ang laman sa table na `brain_notes`.
- **Bakit:** Para may record si Bench ng lahat ng ginawa, paano, at bakit, na mabubuksan sa Obsidian (PC) o sa GitHub (browser).
- **Files:** `docs/vault/*.md`

## 2026-10-23 · #7 Email verification (6-digit code)
- **Ano:** Required na ang email sa Create account. Nagpapadala ng 6-digit code sa Gmail; hindi makakapasok hangga't hindi na-verify. Pwede nang mag-Sign in gamit ang email o username.
- **Bakit:** Hiling ni Bench. Para totoong tao ang users at magamit ang email sa "Forgot password" mamaya.
- **Files:** `sql/007-email-verify.sql`, `backend/auth-fast.ts` (deployed), `login.html`, `assets/css/pages/auth.css`, `assets/js/pages/login.js`, `assets/js/icons.js`
- **Paano:** Bagong status na `Unverified` at table na `email_codes` (hash lang ng code). Bagong actions na `verifyEmail` at `resendCode`. Gmail SMTP port 465 gamit ang nodemailer. Buong detalye: [[Build - Email verification]].

## 2026-10-23 · #8 Forgot password
- **Ano:** "Forgot password?" sa Sign in. Code sa email + bagong password → pasok agad. Tinatanggal din ang lock at nilo-logout ang lahat ng lumang session.
- **Bakit:** Na-lock si Bench (5 maling password) at hindi sigurado sa password; para hindi na kailangan ng manual na unlock o bura sa database.
- **Files:** `backend/auth-fast.ts` (deployed), `login.html`, `assets/js/pages/login.js`, `assets/css/pages/auth.css`
- **Paano:** Bagong actions na `forgotPassword` at `resetPassword`; `email_codes.purpose = 'reset'`. Ang `login.js` ay may shared helpers na (`makeOtp`, `makeCountdown`, `eye`, `strength`) para iisa ang code ng verify at reset. Detalye: [[Build - Forgot password]].
- **Database (manual):** in-unlock tapos binura ang test account na `sensen` (hiling ni Bench). Malinis na ulit: 0 users.

## 2026-10-23 · #9 Email sender: Gmail → Brevo
- **Ano:** Ang mga code email ay pinapadala na sa **Brevo API** (libre, 300 emails/araw). Gmail SMTP ay fallback na lang kung walang `BREVO_API_KEY`.
- **Bakit:** Paulit-ulit na tinatanggihan ng Gmail ang App Password ("535 Username and Password not accepted").
- **Files:** `backend/auth-fast.ts` (deployed) — bagong function na `deliver()`.
- **Paano:** `POST https://api.brevo.com/v3/smtp/email` na may header `api-key`. Sender = `MAIL_FROM_EMAIL` (dapat verified sa Brevo → Senders).
- **Result:** Gumana! Nakapasok na si Bench bilang Admin (`sensengutierrez`) pagkatapos i-deactivate ang Authorized IPs sa Brevo.

## 2026-10-23 · #10 Full-width desktop layout
- **Ano:** Sa desktop/laptop, buong lapad na ang gamit ng bawat page. Daily: feed + side panel (This week, Today, privacy note). Profile: profile card sa kaliwa + Posts area sa kanan. Share: 3 malalaking tiles + info sa kanan. Settings: 2 columns. Explore: 5–6 columns.
- **Bakit:** Rule ni Bench: "pag desktop/laptop, full UI/UX" — ayaw ng makitid na card sa gitna.
- **Files:** `assets/css/shell.css` (bagong `.layout`, `.layout.aside-left`, `.layout-aside`; `.page` max 1480 px), `app/home.html`, `app/profile.html`, `app/share.html`, `app/settings.html`, `assets/css/pages/daily.css`, `profile.css`, `share.css`, `settings.css`, `explore.css`, `assets/js/pages/profile.js`
- **Paano:** `<div class="layout">` = main + aside sa kanan (340 px, 380 px sa ≥1500 px). Sa phone, isang column lang (aside sa ilalim).

## 2026-10-23 · #11 Gallery + albums + photo editor
- **Ano:** Bagong page na **Gallery**: upload/camera/drag-drop, albums, viewer, caption, move, download, delete, at photo editor (crop, rotate, flip, adjust, filters). Gumagana na rin ang Share tiles (sine-save sa napiling album).
- **Bakit:** Hiling ni Bench: albums para ma-organize ang photos/videos, may upload at edit.
- **Files:** `app/gallery.html`, `assets/js/media-store.js`, `assets/js/components/modal.js`, `assets/js/components/photo-editor.js`, `assets/js/pages/gallery.js`, `assets/css/pages/gallery.css`, `app/share.html`, `assets/js/pages/share.js`, `assets/css/pages/share.css`, `assets/css/components.css`, `assets/js/icons.js`, `assets/js/nav-items.js`
- **Paano:** Lahat ay nasa device (IndexedDB), walang server. Detalye: [[Build - Gallery and albums]].

## 2026-10-23 · #12 Weather sa Daily (auto location)
- **Ano:** Weather card na kusang nakaka-detect ng lokasyon (GPS, o IP kung walang GPS). Ngayon + 5 araw.
- **Bakit:** Hiling ni Bench: "sample nasa Bahrain automatic, kung nasa Pinas automatic".
- **Files:** `assets/js/components/weather.js`, `app/home.html`, `assets/js/pages/daily.js`, `assets/css/pages/daily.css`
- **Paano:** Open-Meteo + BigDataCloud + ipapi.co (libre, walang key), cache 30 min. Detalye: [[Build - Weather]].

## 2026-10-23 · #13 Offline posts (queue + schedule)
- **Ano:** Mag-post kahit offline: pumili ng photo/video, caption, sino ang makakakita (Public / Followers / Ako lang), at oras. Naka-pila sa device at kusang ia-upload pag may internet. Bagong Profile posts at Explore feed.
- **Bakit:** Idea ni Bench: "pwede ako mag select offline tapos pag me net na… kusa na siya mag upload". Pinili: maliit na copy sa server, max 15 s na video, visibility bawat post.
- **Files:** `sql/013-posts.sql`, `backend/posts-fast.ts`, `assets/js/config.js`, `assets/js/post-queue.js`, `assets/js/components/post-composer.js`, `assets/js/components/post-viewer.js`, `assets/css/posts.css`, `assets/js/pages/profile.js`, `assets/js/pages/explore.js`, `assets/js/pages/gallery.js`, `assets/js/pages/share.js`, `assets/js/icons.js`, `app/*.html`, `assets/css/pages/profile.css`, `assets/css/pages/explore.css`, `assets/css/pages/share.css`
- **Paano:** Outbox sa IndexedDB + signed upload URLs sa private bucket `post-media`; `client_id` para walang doble; `publish_at` para sa schedule. Detalye: [[Build - Offline posts]].

## 2026-10-23 · #14 Viewer at phone layout
- **Ano:** Kasya na sa screen ang portrait na photo sa viewer; sa phone hindi na lumalapad ang page dahil sa albums, at full screen ang viewer.
- **Bakit:** Screenshots ni Bench (desktop at phone).
- **Files:** `assets/css/pages/gallery.css`, `assets/css/posts.css`, `assets/css/shell.css`, `assets/css/components.css`
- **Paano:** `max-height` batay sa taas ng screen; `minmax(0, 1fr)` sa `.layout`/`.layout-aside`. Detalye sa [[Fix log]].

## 2026-10-23 · #15 Edit profile + cover photo
- **Ano:** Edit profile (pangalan, bio), profile photo at cover/banner na may crop. Bagong itsura ng Profile: full-width na cover sa itaas. Sa photo editor, mas malinaw na ang "Gawing bagong copy" vs "Save (palitan)".
- **Bakit:** Hiling ni Bench: "sana merron din banner para pwede ko lagyan at palitan, desktop at mobile". Napansin din niyang dumodoble ang photo pag na-edit (pinindot ang "Save as copy").
- **Files:** `sql/015-profile.sql`, `backend/profile-fast.ts`, `assets/js/config.js`, `assets/js/auth-guard.js`, `assets/js/components/image-cropper.js`, `assets/js/components/profile-editor.js`, `assets/js/pages/profile.js`, `app/profile.html`, `assets/css/pages/profile.css`, `assets/css/components.css`, `assets/css/pages/gallery.css`, `assets/js/components/photo-editor.js`
- **Paano:** Crop sa device → signed upload sa public bucket `profile-media` → `setImage`. Detalye: [[Build - Profile edit]].

## 2026-10-23 · #16 Social feed: reactions, comments, share, bookmark, follow, status
- **Ano:** Ginawang parang Instagram ang Explore: Status sa itaas, feed na may reactions (6 emoji), comments, repost at share link, bookmark, at kita kung sino ang nag-react/nag-share. May Follow, hanap ng tao, Suggestions, mini profile ng ibang user, at Saved tab sa Profile.
- **Bakit:** Hiling ni Bench (screenshots ng Instagram). Pinili: Explore = feed + status; Share = repost + link; friends = mga fina-follow mo.
- **Files:** `sql/017-social.sql`, `backend/posts-fast.ts` (v2), `backend/social-fast.ts`, `assets/js/config.js`, `assets/js/icons.js`, `assets/js/components/post-card.js`, `assets/js/components/social-ui.js`, `assets/js/components/stories.js`, `assets/js/components/post-viewer.js`, `assets/css/social.css`, `app/explore.html`, `assets/js/pages/explore.js`, `assets/css/pages/explore.css`, `app/profile.html`, `assets/js/pages/profile.js`, `assets/css/pages/profile.css`
- **Paano:** Bagong tables + `stats` sa bawat post galing sa `hydrate()`. Detalye: [[Build - Social feed]].
$md$, '{log}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
insert into public.brain_notes (title, body, tags, updated_by) values ('System map', $md$---
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
| `profile.html` | app/ | Profile: cover, photo, edit profile, naka-pilang uploads, sariling posts | oo |
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
| `components/post-card.js` | Feed card + reactions/comment/share/bookmark (`TMN_POST_CARD`) |
| `components/social-ui.js` | Comments, sino ang nag-react/share, follow, mini profile (`TMN_SOCIAL`) |
| `components/stories.js` | Status / stories (`TMN_STORIES`) |
| `components/image-cropper.js` | Crop ng larawan bago i-upload (`TMN_CROPPER`) |
| `components/profile-editor.js` | Edit profile + palit ng photo/cover (`TMN_PROFILE_EDIT`) |
| `components/app-shell.js` | Gumagawa ng layout ng app pages mula sa nav-items |
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
| `posts-fast` | createUpload, createPost, myPosts, userPosts, getPost, feed, updatePost, deletePost, react, reactions, comments, addComment, deleteComment, bookmark, bookmarks, share, unrepost, shares | `backend/posts-fast.ts` |
| `social-fast` | follow, unfollow, people, profile, followList, stories, storyUpload, createStory, viewStory, storyViewers, deleteStory | `backend/social-fast.ts` |
| `profile-fast` | get, update, imageUpload, setImage, removeImage | `backend/profile-fast.ts` |

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

Storage bucket: **`post-media`** (private, 12 MB/file, jpeg/webp/webm/mp4). Signed URLs lang galing sa `posts-fast`.
Storage bucket: **`profile-media`** (public na view, 3 MB/file, jpeg/webp). Upload ay galing lang sa `profile-fast`.

`users` ay may `email` at `email_verified_at` (sql/007), at `banner_url`, `avatar_path`, `banner_path` (sql/015). Status: Unverified → Active / Pending / Inactive.

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
$md$, '{map}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
insert into public.brain_notes (title, body, tags, updated_by) values ('Decisions', $md$---
tags: [decision]
updated: 2026-10-23
---
# Decisions

| Petsa | Desisyon | Bakit |
|---|---|---|
| 2026-10-23 | Pangalan: **TigoMeNote** | Pinili ni Bench |
| 2026-10-23 | Tema: **plain white + dark mode** setting | Pinili ni Bench |
| 2026-10-23 | Hosting: **GitHub Pages** muna (`sensengutierrez.github.io/TigoMeNote/`) | Libre; custom domain mamaya |
| 2026-10-23 | **Hiwalay na Supabase account at project** (sensengutierrez) | Hindi maghahati sa free-plan limits ng Lalabella |
| 2026-10-23 | **Public repo**, No license | Libre ang Pages sa public; "no license" = all rights reserved. Walang secret sa code. |
| 2026-10-23 | GitHub Desktop para sa updates | Kasama ang dotfiles, kita ang binago bago i-push |
| 2026-10-23 | Unang nag-register = Admin | Si Bench dapat ang mauna |
| 2026-10-23 | **Email verification: required + verify**, 6-digit code | Pinili ni Bench; code kaysa link para gumana rin sa APK |
| 2026-10-23 | Email sender: **Gmail** (App Password) muna | Libre at mabilis; lilipat sa Resend + domain pag lumaki |
| 2026-10-23 | **Desktop/laptop = full UI/UX** (buong lapad) | Rule ni Bench |
| 2026-10-23 | **Gallery sa device lang** (IndexedDB), walang upload | Tugma sa "sa device mag-save"; walang gastos sa server storage |
| 2026-10-23 | Weather: **Open-Meteo** + GPS/IP auto-detect | Libre, walang API key |
| 2026-10-23 | Posts: **maliit na copy** sa server (photo 1600 px JPEG, video 720p) | Pinili ni Bench; kasya sa 1 GB na libre |
| 2026-10-23 | Video sa post: **max 15 segundo** | Pinili ni Bench |
| 2026-10-23 | **Visibility bawat post** (Public / Followers / Ako lang) | Pinili ni Bench |
| 2026-10-23 | **Offline queue** sa device + schedule sa server (`publish_at`) | Idea ni Bench; gumagana kahit walang net |
| 2026-10-23 | Profile photo + cover sa **public** bucket `profile-media`; upload via `profile-fast` lang | Nakikita naman talaga ng iba; mabilis at naka-cache |
| 2026-10-23 | Cover = **3:1** (1500×500), photo = 600×600, may crop | Pareho ang itsura sa desktop at phone |
| 2026-10-23 | **Explore = feed + status** (parang Instagram) | Pinili ni Bench |
| 2026-10-23 | **Share = repost + share link**; kita kung sino ang nag-share | Pinili ni Bench |
| 2026-10-23 | Status ay para sa **mga fina-follow mo** (hindi mutual) | Pinili ni Bench |
| 2026-10-23 | 6 na reaction (❤️ 😂 😮 😢 🔥 👏), isa bawat tao | Simple at mabilis bilangin |
| 2026-10-23 | Lipat sa **Brevo** (free 300/araw) | Ayaw tanggapin ng Gmail ang App Password; walang domain na kailangan sa Brevo. SMS ay hindi pinili kasi may bayad. |

## Bukas pa (hinihintay si Bench)
- **Approval:** auto-active ang bagong users, o kailangan i-approve? (`REQUIRE_APPROVAL`)

Tingnan din: [[Build - Foundation]]
$md$, '{decision}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
insert into public.brain_notes (title, body, tags, updated_by) values ('00 Home', $md$---
tags: [home]
updated: 2026-10-23
---
# TigoMeNote Brain

Ito ang "utak" ng project: lahat ng ginawa, paano ginawa, at bakit. Buksan ang folder na `docs/vault` sa **Obsidian** (Open folder as vault) para ma-click ang mga [[link]].

## Simula dito
- [[System map]] — lahat ng pages, files, functions at tables sa isang tingin
- [[How to edit]] — saan babaguhin ang menu, kulay, URL, at paano magdagdag ng page
- [[Change log]] — bawat edit: ano, bakit, saang file, paano gumagana
- [[Fix log]] — bawat bug: problema → sanhi → ayos
- [[Decisions]] — mga napagdesisyunan at bakit

## Build records (isang note bawat feature)
- [[Build - Foundation]] — database, login back end, app shell
- [[Build - Login page]] — sign in / create account na may panel swap animation
- [[Build - Email verification]] — 6-digit code sa Gmail bago makapasok
- [[Build - Forgot password]] — reset ng password gamit ang code sa email
- [[Build - Gallery and albums]] — photos/videos sa device, albums, editor
- [[Build - Weather]] — weather sa Daily, auto Bahrain/Pinas
- [[Build - Offline posts]] — mag-post kahit offline, may schedule, auto-upload
- [[Build - Profile edit]] — edit profile, profile photo at cover (banner)
- [[Build - Social feed]] — reactions, comments, share, bookmark, follow, status

## Setup
- [[Supabase setup]] — project, tables, secrets (walang totoong value dito)
- [[GitHub and deploy]] — repo, Pages, paano mag-update

## Status
| Step | Ano | Status |
|---|---|---|
| 1 | Project + database | ✅ |
| 2 | Auth back end (auth-fast) | ✅ deployed, hinihintay ang test ni Bench |
| 3 | Front-end shell | ✅ live |
| 4 | Brain vault | 🟡 md files + DB; brain.html sa web, susunod |
| 5 | Messaging | ⏳ |
| 6 | Profile + approval | 🟡 Edit profile + cover ✅; approval susunod |
| 7 | Daily / Explore / Share (ang idea) | 🟡 Gallery, weather, offline posts, social feed + status ✅; notifications susunod |
| 8 | Android APK | ⏳ |
$md$, '{home}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
insert into public.brain_notes (title, body, tags, updated_by) values ('Fix log', $md$---
tags: [log]
updated: 2026-10-23
---
# Fix log

Format: **PROBLEMA → SANHI → AYOS (file)**. Pinakabago sa ibaba.

- 2026-10-23 · Explore: ang "Explore opens soon" card ay napupunta sa ilalim ng screen sa desktop → naka-center sa buong taas ng grid (`top: 50%`), mas mahaba ang grid kaysa screen → inilagay sa `top: 96px` (`assets/css/pages/explore.css`)
- 2026-10-23 · auth-fast unang deploy ay placeholder lang → maling laman ang naipasa sa unang deploy → ni-deploy ulit ang buong code (version 2) at kinumpara sa `backend/auth-fast.ts`
- 2026-10-23 · Login: kapag diretsong binuksan ang `?mode=register`, dumudulas ang panels sa unang load → may CSS transition kahit unang render → `no-anim` class sa `<body>` na tinatanggal pagkatapos ng unang frame (`login.html`, `login.js`, `auth.css`)
- 2026-10-23 · Verify screen sa phone: nahahati sa gitna ang email ("gmai / l.com") → `word-break: break-all` → `white-space: nowrap` (`assets/css/pages/auth.css`)
- 2026-10-23 · Gmail: "535 Username and Password not accepted" → mali ang `SMTP_PASS` (hindi App Password o ibang account) → gumawa ng bagong App Password sa parehong Gmail ng `SMTP_USER` (Supabase Secrets)
- 2026-10-23 · Sign in: "Mali ang username o password" → na-type ang email nang walang `@` (`sensengutierrezgmail.com`) kaya hinanap bilang username → i-type ang username o buong email
- 2026-10-23 · Reset screen: naiiwan ang lumang error habang nagta-type ng bagong password → walang hide sa input → `rPass` input nagtatago ng `rMsg2` (`login.js`)
- 2026-10-23 · Brevo: "401 unrecognised IP address" → naka-on ang Authorized IPs sa Brevo, at paiba-iba ang IP ng Supabase → Brevo → Settings → Security → Authorized IPs → Deactivate for API keys
- 2026-10-23 · Forgot password: "Masyadong maraming request" → 10 request/oras bawat IP + email na walang `@` → nilinis ang rate-limit rows; may paalala na kapag email na walang `@` (`login.js` → `missingAt()`)
- 2026-10-23 · Daily: "Gamitin ang GPS" mukhang gray na kahon → ang `.link-btn` style ay nasa `auth.css` lang (login) → inilipat sa `components.css`
- 2026-10-23 · Posts (test): na-stuck sa "Kino-compress ang video" → hindi tumatakbo ang `requestVideoFrameCallback` sa nakatagong video at naghihintay ang `AudioContext.resume()` ng tap → timer loop + `onended` + safety timeout, at max 0.6 s na hintay sa resume (`post-queue.js`)
- 2026-10-23 · Gallery viewer: ang portrait na photo ay lumalampas sa ibaba ng screen → walang limit ang taas ng larawan sa desktop → `max-height` na naka-base sa taas ng screen (`gallery.css`, `posts.css`)
- 2026-10-23 · Phone: lumiit/lumapad ang buong Gallery page at kalahating screen lang ang viewer → ang mahabang albums row ay nagpapalapad sa grid column (`min-width: auto`) → `minmax(0, 1fr)` sa `.layout` at `.layout-aside`; full screen ang viewer sa phone (`shell.css`, `components.css`)

Hindi bug (para hindi na hanapin ulit):
- GitHub Desktop: "This file uses LF line endings… CRLF" → normal sa Windows, walang epekto sa site.
- Sign in field: hindi na tinatanggal ang simbolo (hal. `@`) kasi pwede na ang email doon. Sa Create account lang strict ang username.
- "Naka-lock ang account… 28 minuto" → tama ang gawa: 5 maling password = 30 min lock. May Forgot password na para ma-unlock agad.
- GitHub Desktop: naka-yellow (modified) ang mga file na pareho naman ang laman → line endings lang.
$md$, '{log}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
