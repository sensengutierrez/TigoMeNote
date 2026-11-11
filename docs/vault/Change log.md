---
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

## 2026-10-24 · #17 English default + Language setting (Arabic, Filipino)
- **Ano:** Ginawang English ang lahat ng text ng site (pati server errors at email code). Bagong **Settings → Language**: English, العربية (Arabic, right-to-left), Filipino. May language dropdown din sa login at landing.
- **Bakit:** Hiling ni Bench: "dapat English default, mag lagay ka nalang ng setting para palitan ung language… English, Arabic or any countries".
- **Files:** `assets/js/i18n.js`, `assets/js/lang/ar.js`, `assets/js/lang/fil.js`, lahat ng `app/*.html`, `index.html`, `login.html`, halos lahat ng `assets/js/**`, `assets/css/base.css`, `shell.css`, `components.css`, `social.css`, `pages/profile.css`, `pages/settings.css`, `pages/auth.css`, `backend/auth-fast.ts`, `posts-fast.ts`, `profile-fast.ts`, `social-fast.ts` (lahat na-deploy)
- **Paano:** English ang source; ang `i18n.js` ang nagsasalin ng page gamit ang dictionary. Detalye: [[Build - Language (i18n)]].

## 2026-10-24 · #18 Profile tabs (TikTok), views at ❤️ sa tiles, Pin (3), cache fix
- **Ano:** Mga tab sa Profile: Posts, Private, Reposts, Saved, Liked, History. Bawat tile may ▷ views at ❤️. Pin hanggang 3 post (una sa profile, may "Pinned"). Likes sa stats. Sort: Latest / Popular / Oldest. Naayos din: hindi lumalabas ang Language sa phone (lumang cache).
- **Bakit:** Hiling ni Bench (screenshot ng TikTok): "makikita ilang ng view at ng ❤️, pwede mag pin ng 3, merron private, recent view, at repost".
- **Files:** `sql/020-views-pins.sql`, `backend/posts-fast.ts` (v4), `backend/profile-fast.ts` (v3), `backend/social-fast.ts` (v3), `app/profile.html`, `assets/js/pages/profile.js`, `assets/js/components/post-viewer.js`, `assets/js/components/social-ui.js`, `assets/js/pages/explore.js`, `assets/css/pages/profile.css`, `assets/css/posts.css`, `assets/js/lang/ar.js`, `assets/js/lang/fil.js`, `assets/js/i18n.js`, `assets/js/config.js` (0.5.0), `tools/cache-bust.py`, lahat ng `.html` (`?v=`)
- **Paano:** Bagong `post_views` + `posts.view_count/pinned_at`. Detalye: [[Build - Profile tabs and pins]].

## 2026-10-24 · #19 Plano: Safety, family at wellbeing (vault lang)
- **Ano:** Isinulat ang plano ng Family/Friends circle, Locate (30 araw), SOS, age limit, parental, auto sleep at give a break, pati ang guidelines na ipapakita sa APK.
- **Bakit:** Ayon kay Bench, safety ang pundasyon ng app, at kailangang nasa vault para magamit sa instructions ng APK.
- **Files:** `docs/vault/Plan - Safety, family and wellbeing.md`, `00 Home.md`, `Decisions.md`
- **Paano:** Wala pang code. Detalye: [[Plan - Safety, family and wellbeing]].

## 2026-10-24 · #20 Safety + wellbeing (web), naka-abang para sa APK
- **Ano:** Bagong **Safety** page: Family/Friends circle (invite + accept), Locate sa map (30 araw na history, Pause, Clear), SOS (hold 3 s + countdown) na may pulang screen, alarm at push sa buong circle, Call 999. Birthdate sa Create account (13+), Teen = private account, parental supervision, follow requests, sleep timer, give a break (60 min) at daily limit. Family & Safety card sa Profile; Wellbeing sa Settings.
- **Bakit:** Hiling ni Bench: safety ang pundasyon ng app; "gawin na natin pero naka-abang na para sa APK".
- **Files:** `sql/023-safety.sql`, `sql/024-wellbeing.sql`, `backend/safety-fast.ts` + `webpush.ts`, `backend/wellbeing-fast.ts`, `backend/auth-fast.ts`, `social-fast.ts`, `posts-fast.ts`, `app/safety.html`, `sw.js`, `manifest.webmanifest`, `assets/js/native-bridge.js`, `push-setup.js`, `safety-watch.js`, `location-share.js`, `wellbeing.js`, `components/sos-button.js`, `sos-overlay.js`, `map-view.js`, `wellbeing-settings.js`, `pages/safety.js`, `assets/css/safety.css`, `pages/safety.css`, `tools/make-icons.py`, `assets/img/*`, `login.html`, `profile.html`, `settings.html`, `nav-items.js`, `config.js` (0.6.0), `lang/ar.js`, `lang/fil.js`, `i18n.js`, `icons.js`, `social-ui.js`
- **Paano:** Detalye: [[Build - Safety and wellbeing]].

## 2026-10-24 · #21 Policies + moderation (violence, nudity, crime, illegal firearms)
- **Ano:** Bagong policy pages (About, Terms of Use, Privacy Policy, Community Guidelines, Copyright, Third-party software). Automatic na text filter sa captions, comments, pangalan at bio (block o flag). Report sa posts, comments at accounts. Kusang itinatago kapag 3+ report o child safety. Admin **Reports** page (Dismiss, Hide, Delete, Warn, Suspend).
- **Bakit:** Hiling ni Bench: "gawin muna ung about policies, third party software, term of use, copyright, mag add ka din ng violence block, nudity, criminal, at mga iligal firearm, detected".
- **Files:** `sql/026-moderation.sql`, `backend/moderation.ts`, `backend/moderation-fast.ts`, `posts-fast.ts`, `social-fast.ts`, `profile-fast.ts`, `auth-fast.ts`, `legal/*.html`, `assets/js/pages/legal.js`, `assets/css/pages/legal.css`, `app/admin/reports.html`, `assets/js/pages/admin-reports.js`, `assets/css/pages/admin-reports.css`, `components/social-ui.js`, `components/post-viewer.js`, `post-queue.js`, `pages/profile.js`, `icons.js` (flag), `nav-items.js`, `config.js` (0.7.0, `legal`), `settings.html`, `login.html`, `index.html`, `lang/ar.js`, `lang/fil.js`, `posts.css`, `social.css`, `pages/settings.css`, `pages/landing.css`
- **Paano:** Detalye: [[Build - Moderation and policies]].

## 2026-10-24 · #22 Mas mahigpit na filter: marijuana, baliktad na salita, banta, teen protection, live check, Report sa viewer
- **Ano:** Mas maraming salita ng marijuana/droga (mariwana, weed, kush, tsongke, "hithit tayo ng…", "420"). Nahuhuli na ang baliktad na salita ("anaujiram", "elas rof nug") at pinagpalit na pantig ("busha"). Mas maraming banta sa English, Filipino at Arabic. Teen (13–17): bawal ang phone number, email, address at ibang chat app sa post/comment/bio. **Live check** sa app/web: may babala habang nagta-type (caption, comment, status, pangalan, bio) at hinaharang bago pa ipadala. **Report** button sa post viewer at sa status ng iba.
- **Bakit:** Hiling ni Bench: "polish natin… pati ung mariwana, ung baliktad na salita, dapat merron tayo auto sa app or web… para sa young and adult protection, bawal ung mga pambabanta… sa mga posting mag add tayo ng report".
- **Files:** `backend/moderation.ts`, `posts-fast.ts` (v7), `social-fast.ts` (v6), `profile-fast.ts` (v5), `auth-fast.ts` (v27), `tools/build-moderation-client.mjs` (bago), `assets/js/moderation-check.js` (gawa ng tool), `assets/js/components/mod-guard.js` (bago), `post-composer.js`, `stories.js`, `profile-editor.js`, `social-ui.js`, `post-viewer.js`, lahat ng `app/*.html` + `app/admin/reports.html`, `components.css`, `social.css`, `posts.css`, `legal/guidelines.html`, `lang/ar.js`, `lang/fil.js`, `config.js` (0.7.1)
- **Paano:** Iisang rules sa server at browser (kinokopya ng tool ang CORE ng `moderation.ts`). Detalye: [[Build - Moderation and policies]].

## 2026-10-24 · #23 Notifications + settings, at sariling TigoMeNote ring sa Status
- **Ano:** Bagong **Notifications** page: reactions, comments, reposts, bagong followers, follow requests (Confirm/Delete), milestones, lingguhang buod at account notices; may bell na may bilang sa itaas at sa menu, at push sa phone. **Notification settings**: Push on this device, Pause all, Sleep mode, at Off / In app / Push bawat uri. Pinalitan ang kulay-Instagram na ring ng Status: rounded-square na coral → amber → mint, may hati bawat status.
- **Bakit:** Ayon kay Bench habang nagte-test: "wala pa pala tayong notification ganto", at ang ring sa status ay "di natin gagayahin ung kulay sa Instagram… dapat merron tayong unique design at kulay".
- **Files:** `sql/029-notifications.sql`, `backend/notify.ts` (bago), `backend/notify-fast.ts` (bago, v1), `posts-fast.ts` (v8), `social-fast.ts` (v7), `moderation-fast.ts` (v2), `app/notifications.html`, `assets/js/pages/notifications.js`, `components/notif-settings.js`, `notif-badge.js`, `nav-items.js`, `components/app-shell.js`, `components/stories.js`, `icons.js` (trophy, chart), `config.js` (0.8.0, `notify`), `assets/css/pages/notifications.css`, `social.css`, `shell.css`, `tokens.css`, `app/settings.html`, lahat ng `app/*.html` (notif-badge), `lang/ar.js`, `lang/fil.js`, `sw.js`
- **Paano:** Detalye: [[Build - Notifications]].

## 2026-10-24 · #24 Daily: kusang nagbabago ang bati at petsa
- **Ano:** Ang "Good morning / afternoon / evening" ay nagbabago na kahit bukas lang ang page (tinitingnan bawat minuto at pagbalik sa app). Pagdating ng hatinggabi, napapalitan din ang petsa at ang linggo. "0% ulan" sa weather → "0% rain" (isinasalin sa Filipino at Arabic).
- **Bakit:** Tanong ni Bench: "itong good morning na to ng babago ba… kahit hindi, automatic ba, sample afternoon na".
- **Files:** `assets/js/pages/daily.js`, `assets/js/components/weather.js`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.8.1)
- **Paano:** Umaga = bago 12 NN, hapon = 12–6 PM, gabi = 6 PM pataas (oras ng device).

## 2026-10-24 · #25 Buong cover sa profile ng iba, TigoMeNote folder, Save to zip bago burahin ang location
- **Ano:** Ang cover (banner) sa profile ng ibang user ay buong lapad na, at hindi na nakapatong ang pangalan sa cover. Sa Safety → Location history: **Save copy** (.zip) at, bago burahin, pagpipilian na **Save to zip, then delete** o **Delete without saving**. Bagong **Settings → Files on this device**: saan napupunta ang kopya (APK: Documents/TigoMeNote; desktop: pinili mong folder; iba: Downloads) at paliwanag tungkol sa pag-uninstall.
- **Bakit:** Ayon kay Bench: "pag view ko ng prof nya ganto banner nya di full", at "gagawa ng folder ng TigoMeNote sa phone or desktop para sa location… pag clear may choices save to zip… pag uninstall may choice kung mag-stay ang data".
- **Files:** `assets/css/social.css`, `assets/js/zip.js` (bago), `file-save.js` (bago), `components/location-export.js` (bago), `components/files-settings.js` (bago), `native-bridge.js` (`saveFile`), `pages/safety.js`, `pages/settings.js`, `app/safety.html`, `app/settings.html`, `assets/css/pages/safety.css`, `pages/settings.css`, `backend/safety-fast.ts` (v3, `exportHistory`), `lang/fil.js`, `lang/ar.js`, `config.js` (0.8.2)
- **Paano:** Detalye: [[Build - Safety and wellbeing]] (TigoMeNote folder, APK).

## 2026-10-24 · #26 Tigo Messenger (gumagana na ang Messages)
- **Ano:** 1:1 at group chat na may text, photo, location (View map + Directions, puwedeng i-pin), reactions, Seen, "typing…", unsend, mute at report. Message requests para sa hindi ka fina-follow; teen = mutual followers at Family/Friends lang. **Message** button sa profile ng iba. Push ng bagong message (may **Messages** sa Notification settings). Sa TigoMeNote APK: kailangan ang hiwalay na **Tigo Messenger** app (Open o Install).
- **Bakit:** Hiling ni Bench: "paganahin na ang message, tapos ready notif pag may apps na, at laging hahanapin ng apps ung separated TIGO messenger"; features: text + seen + typing, photos, reactions, group chat, at "pwede mag pin location".
- **Files:** `sql/033-messages.sql`, `backend/messages-fast.ts` (bago, v1), `notify-fast.ts` (v2, `pushRaw`), `moderation-fast.ts` (v3), `moderation.ts`, `app/messages.html`, `assets/js/pages/messages.js`, `components/chat-view.js` (bago), `components/chat-new.js` (bago), `realtime.js` (bago), `native-bridge.js`, `notif-badge.js`, `components/notif-settings.js`, `components/social-ui.js` (Message button), `pages/admin-reports.js`, `icons.js` (bellOff), `sw.js`, `assets/css/pages/messages.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.9.0, `messages`)
- **Paano:** Detalye: [[Build - Messenger]].

## 2026-10-24 · #27 Share: sariling camera na may libreng filters at auto sound
- **Ano:** **Take photo / Record video** sa Share ay bumubukas na sa sariling camera ng TigoMeNote: 13 **libreng live filters** (Vivid, Warm, Cool, Golden, Rose, Mint, Drama, Retro, Fade, Night, Mono, Noir), swipe o tap para palitan, front/back camera, video hanggang 15 s. Pagkakuha: **review** na may **auto-pick na sound** (parang TikTok/IG/FB) na tumutugtog agad; puwedeng **Change** (For you + All sounds, lakas ng music at ng sariling tunog ng video) o **No sound**, tapos **Save** o **Save & post**. Ang composer (pati galing Gallery) ay may **Sound** row din. Sa Explore at sa viewer: **♪ chip** na pang-play ng sound; kusang tumutugtog pagbukas ng post.
- **Bakit:** Hiling ni Bench: "share photo pag nag-capture ako gusto ko merron free filter, tapos me auto ng sound parang TikTok, Instagram at Facebook, me auto na pipili ng sound".
- **Files:** `assets/js/filters.js` (bago), `sounds.js` (bago), `components/camera.js` (bago), `components/sound-picker.js` (bago), `components/capture-review.js` (bago), `components/post-composer.js`, `post-queue.js`, `components/post-card.js`, `components/post-viewer.js`, `components/photo-editor.js` (iisang listahan ng filters), `pages/share.js`, `icons.js` (music, pause, volume), `app/share.html`, `app/gallery.html`, `app/explore.html`, `app/profile.html`, `app/notifications.html`, `app/messages.html`, `assets/css/camera.css` (bago), `sounds.css` (bago), `posts.css`, `sql/035-post-sound.sql`, `backend/posts-fast.ts` (v9), `lang/fil.js`, `lang/ar.js`, `config.js` (0.10.0)
- **Paano:** Detalye: [[Build - Share camera and sounds]].

## 2026-10-24 · #28 Chat photo fix, Family/Friends invite, emoji + stickers, Local sounds
- **Ano:**
  - **Chat photo:** hindi na blangko ang photo sa chat (at hindi na walang laman ang viewer). Kung hindi ma-load: "Tap to reload".
  - **Family/Friends:** ang in-invite mo ay lumalabas na agad sa listahan ("Invite sent · waiting for them to accept" + Cancel invite) at nasa itaas na ang listahan (bago ang mapa). Ang inimbitahan ay may **notification** na may Accept/Decline; may notification din kapag tinanggap.
  - **Emoji:** may emoji picker na sa chat, comments at caption: pinakabagong emoji (✨ New: 🫩 🐦‍🔥 🍋‍🟩 🫨 🩷 …), Recent, at mga watawat (🇵🇭 🇧🇭 …). Hindi na "kahon" ang bagong emoji (Noto Color Emoji na font sa bawat page). Puwede nang mag-react ng kahit anong emoji (+).
  - **Stickers:** 20 sariling TigoMeNote stickers ("Tigo" na note na may mukha): Hello po!, Salamat!, Ingat!, Kain na!, Mabuhay!, Yalla!, Shukran, atbp.
  - **Sounds:** 8 bagong Local sounds. Pinoy: Harana, Jeepney Ride, Fiesta, Budots Bounce, Boracay Sunset. Gulf: Khaleeji Nights, Desert Oud, Manama Skyline. May "Local · Philippines/Gulf" sa Sounds, at mas pinipili ng auto-pick ang local (ayon sa time zone at wika ng device).
- **Bakit:** Ayon kay Bench: "me mga bagong sound ba, minsan kung local sample Philippines, me bug pa sa message at ung emoticons minsan box lang, dapat merron tayo sticker at latest emoticons", at "me prob din sa SOS ung friends or add family di lumilitaw".
- **Files:** `backend/messages-fast.ts` (v2), `backend/safety-fast.ts` (v4), `sql/037-stickers-circle-notifs.sql`, `assets/js/components/chat-view.js`, `emoji-data.js` (bago), `stickers.js` (bago), `components/emoji-picker.js` (bago), `components/social-ui.js`, `components/post-composer.js`, `sounds.js`, `components/sound-picker.js`, `pages/safety.js`, `pages/notifications.js`, `icons.js` (smile), `app/safety.html`, `app/*.html` (font + scripts), `assets/css/tokens.css`, `components.css`, `posts.css`, `sounds.css`, `pages/messages.css`, `pages/safety.css`, `pages/notifications.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.0)
- **Paano:** Detalye: [[Build - Messenger]] (stickers, emoji), [[Build - Safety and wellbeing]] (invite), [[Build - Share camera and sounds]] (Local sounds).

## 2026-10-24 · #29 GIFs sa chat (KLIPY)
- **Ano:** May **GIF** tab na sa emoji picker ng chat: trending, search, at GIFs o Stickers ng KLIPY. Pindot = padala; lumalabas bilang GIF sa chat ("Powered by KLIPY"). Teen = rating "g" lang; iba = "pg-13".
- **Bakit:** Tanong ni Bench kung puwedeng gamitin ang KLIPY API na gamit niya sa ibang web app; gumawa siya ng hiwalay na key para sa TigoMeNote.
- **Files:** `backend/gifs-fast.ts` (bago, v1), `backend/messages-fast.ts` (v3, kind `gif`), `sql/039-chat-gifs.sql`, `assets/js/components/emoji-picker.js`, `components/chat-view.js`, `config.js` (0.11.1, `gifs`), `assets/css/components.css`, `pages/messages.css`, `lang/fil.js`, `lang/ar.js`
- **Paano:** Ang browser → `gifs-fast` → KLIPY (`api.klipy.com/api/v1/<key>/gifs|stickers/trending|search`). Ang key ay nasa Supabase secret `KLIPY_API_KEY` lang. Detalye: [[Build - Messenger]].
- **Na-test:** 2026-10-24, gumagana sa totoong server (nailagay ni Bench ang `KLIPY_API_KEY`; test key = 100 requests/oras).

## 2026-10-24 · #30 Mas mabilis na loading
- **Ano:**
  - **Walang "preflight":** ang bawat tawag sa server ay isang biyahe na lang (dati: OPTIONS muna, tapos POST). Ang session token ay nasa body na, hindi sa header.
  - **Keep warm:** bawat 3 minuto, may maliit na tawag sa 8 function na gamit sa bawat page para hindi "malamig" (cold start = 2–3 s ang unang tawag).
  - **Badges:** hindi na tumatawag ulit sa server ang bilang ng notifications/messages kapag lumipat ng page sa loob ng 30 s.
  - **GIFs:** WebP at mas maliit na bersyon muna (mas magaan kaysa GIF).
- **Bakit:** Tanong ni Bench: "bakit ang bagal ng loading". Sa logs: 0.35–0.45 s ang bawat tawag kapag mainit, pero 2–3.3 s kapag cold start, at may OPTIONS na 2–2.6 s bago ang POST.
- **Files:** `assets/js/api.js`, `assets/js/auth-guard.js`, `assets/js/notif-badge.js`, `backend/gifs-fast.ts` (v4, walang `moderation.ts` na), `sql/041-keep-warm.sql` (pg_cron + pg_net), `config.js` (0.11.2)
- **Paano:** `Content-Type: text/plain` + `token` sa body = "simple request" (walang CORS preflight). Patayin ang keep-warm: `select cron.unschedule('tmn-keep-warm');`

## 2026-10-24 · #31 "Sino siya sa iyo", mas maliit na media, auto-grow na reply, manipis na story ring, mas mabilis
- **Ano:**
  - **Label sa circle:** sa "Add to your circle" may "Who are they to you?": Family = Asawa, Partner, Anak, Magulang, Kapatid, Lolo/Lola, Apo, Kamag-anak; Friends = Best friend, Kaibigan, Kaklase, Katrabaho, Kapitbahay; **Other** = sariling sulat (hal. Ninang, Tito, hanggang 24 letra). Makikita bilang badge sa member; mapapalitan sa ⋯ → "Change who they are to you". Ikaw lang ang nakakakita.
  - **Feed media:** hindi na lalampas sa `min(68vh, 560px)` ang photo/video; buo ang video (`object-fit: contain`) kaya hindi na kailangang mag-scroll.
  - **Reply/comment at caption:** humahaba pataas habang nagta-type (auto-grow), walang scrollbar sa gilid.
  - **Story ring:** mas manipis (2.5px).
  - **Bilis:** hindi na hinihintay ang emoji font bago lumabas ang page; 10 min na cache ng sign-in check; 60 s na cache ng wellbeing state sa bawat lipat ng page; sabay-sabay na kinukuha ang huling location ng circle.
- **Bakit:** Ayon kay Bench: "diko ma click malagay kung asawa anak… video masyado malaki… pag ng rereply ako me lumalabas na scroll sa gilid… story na me kulay nipisan… pabilisin mo lalo kase bumagal".
- **Files:** `sql/043-circle-labels.sql`, `backend/safety-fast.ts` (v7), `assets/js/components/relation-picker.js` (bago), `pages/safety.js`, `app/safety.html`, `assets/css/pages/safety.css`, `assets/css/social.css`, `components/stories.js`, `components/app-shell.js` (`TMN_AUTOGROW`), `components/social-ui.js`, `components/post-composer.js`, `assets/css/components.css`, `assets/css/tokens.css`, `auth-guard.js`, `wellbeing.js`, `app/*.html` (font), `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.3)
- **Paano:** `safety_links.a_label` = tawag ni a kay b, `b_label` = tawag ni b kay a. Auto-grow: lagyan ng `data-autogrow="<max px>"` ang textarea.

## 2026-10-24 · #32 Pare-parehong laki ng photo/video sa feed
- **Ano:** Lahat ng photo at video sa feed ay iisang laki na ang kahon (`clamp(220px, 100dvh − 320px, 460px)`), buo ang makikita (`contain`), at kasya ang buong post sa screen kaya hindi na kailangang mag-scroll.
- **Bakit:** Ayon kay Bench (may screenshot): "ng scroll padin ako dapat pag ganyan kalake same size nalang wala ng scroll sa picture at video".
- **Files:** `assets/css/social.css`, `assets/js/components/post-card.js` (wala nang aspect-ratio bawat post), `config.js` (0.11.4)
- **Na-test (mock):** 1366×768 → post 670px; 1280×720 → 622px; phone 390×844 → 682px (lahat kasya).

## 2026-10-24 · #33 Explore post (parang Komoot) + buong-screen na photo/video na may X
- **Ano:**
  - **Create** button sa Explore: **Status**, **Post** o **Explore**. May "Explore" tile din sa Share.
  - **Explore post:** ang daan mo sa mapa (Start → Finish), may photos/videos at stats (Time, Distance, Speed, Elevation), parang Komoot. Saan galing ang route: **Record now** (GPS habang naglalakad/tumatakbo/nagba-bike; naka-save sa device habang nagre-record), **Import GPX** (Komoot, Strava, Garmin, Google), o **From my location history** (Safety, 30 araw). Uri: Hike, Walk, Run, Bike ride, Drive, Trip. Puwedeng walang photo (mapa lang).
  - Sa feed: "Maria went for a hike", pamagat, stats, photos, at maliit na mapa sa sulok; mapa lang kung walang photo.
  - **Buong-screen na tingin:** tap sa photo o video (feed, profile, post viewer) = lumalaki sa buong screen, buo at tamang laki, may **X** sa itaas para isara. Swipe o ← → para sa susunod; Esc o Back ng phone = sara. Tap sa maliit na mapa = buong mapa (zoom/drag).
- **Bakit:** Ayon kay Bench: "sa explore dapat merron akong option kung stories/post/explore, ang posting pag explore parang komoot, pwede mag lagay ng picture tapos ung map ng nilakbay… pag click ko lalaki sya para sa view tapos lagyan mo nalang ng x para close same sa video".
- **Files:** `sql/046-explore-activity.sql`, `backend/posts-fast.ts` (v12), `assets/js/route.js` (bago), `components/media-viewer.js` (bago), `components/activity-recorder.js` (bago), `components/activity-composer.js` (bago), `components/create-menu.js` (bago), `components/post-card.js`, `components/post-viewer.js`, `components/post-composer.js`, `post-queue.js`, `pages/explore.js`, `pages/share.js`, `app/explore.html`, `app/share.html`, `app/profile.html`, `app/messages.html`, `app/notifications.html`, `assets/css/activity.css` (bago), `components.css`, `pages/explore.css`, `pages/share.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.5)
- **Paano:** Detalye sa [[Build - Explore activity]].

## 2026-10-24 · #34 Background ng app (pati sariling TigoMeNote designs), My music, mas maliit na X
- **Ano:**
  - **Background** (Settings → Appearance → Background), lalabas sa lahat ng page:
    - **TigoMeNote originals** (sariling gawa, walang kinopya): Tigo Notes, Tigo Journal, Tigo Dots, Tigo Waves, Tigo Pearls, Tigo Sampaguita, Tigo Confetti, Tigo Night.
    - 12 kulay/gradient, sariling kulay (color picker), o **sariling picture**: magkahiwalay ang Desktop/laptop at Phone.
    - **Background strength** (gaano kakita) at **Card transparency** (gaano ka-see-through ang cards).
    - Naka-save sa account, kaya pareho sa lahat ng device.
  - **My music** sa sariling profile: playlist galing sa phone/computer (MP3, M4A, WAV…). Ikaw lang ang nakakarinig; nasa device lang, hindi ina-upload. Play/Pause, Next/Previous, Shuffle, Repeat, seek, at controls sa lock screen. Sa website: tuloy kahit i-minimize pero humihinto kapag lumipat ng page; tuloy-tuloy kapag may APK na.
  - Mas maliit na **X** sa buong-screen na viewer (34px; mas malaki pa rin ang tapikan).
- **Bakit:** Ayon kay Bench: "laki ng x hahaha", "sa buong background… pwede me color background iba iba… mag upload kung para sa desktop or laptop size or phone size… ma adjust ung transparent", "mag lagay or gawa ka din ng background natin na TigoMeNote walang katulad at original", at "sa my profile… playlist using storage music… kahit mag minimize gumagana padin". Pinili ni Bench: music = ako lang; tuloy-tuloy na tugtog = sa APK na; background = sa account.
- **Files:** `sql/048-app-background.sql`, `backend/profile-fast.ts` (v8: look, saveLook, bg_desktop/bg_phone), `assets/js/appearance.js` (bago), `assets/js/look-tigo.js` (bago), `assets/css/look.css` (bago), `components/appearance-settings.js` (bago), `assets/js/music-store.js` (bago), `components/music-player.js` (bago), `assets/css/music.css` (bago), `pages/settings.js`, `pages/profile.js`, `app/*.html` (appearance.js + look.css sa 10 page), `app/settings.html`, `app/profile.html`, `components.css` (X), `pages/settings.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.6)
- **Paano:** Detalye sa [[Build - Background and music]].

## 2026-10-24 · #35 Daily: notes, to-do, mood, reminders at alarms, calendar, "On this day", Pinas ⇄ dito
- **Ano:**
  - **Daily notes** (nasa device lang): sulat, ✓ to-do list (bawat linya = item, may check), photo/video (naka-save din sa Gallery), link na napipindot. Pin, Edit, Share to Explore (kung may photo), Delete.
  - **How's your day?** — mood ng araw (emoji); lumalabas sa "This week" at Calendar.
  - **This week** — pindutin ang araw para makita/sulatan ang araw na iyon; **Calendar** button = maliit na calendar ng buwan (tuldok = may notes, emoji = mood, 🔔 = reminder).
  - **Reminders & alarms** — Reminder o Alarm, petsa/oras, ulitin (isang beses, araw-araw, linggo-linggo, buwan-buwan), note. May push sa phone kahit sarado ang app; kapag bukas ang app: tumutunog (alarm = tuloy-tuloy hanggang Stop), may Snooze 10 min at Done.
  - **✨ On this day** — notes sa parehong petsa noong nakaraang buwan/taon.
  - **Pinas ⇄ dito** — oras sa Pilipinas at sa kinaroroonan mo (hal. Bahrain), may "Good time to call home" o "It's late in the Philippines".
  - **Light mode**: mababasa na ang text na nasa ibabaw mismo ng background (may halo na kulay ng page).
- **Bakit:** Ayon kay Bench (may screenshot): "pag naka light mode me mga letter na di na babasa", "ung daily natin pwede na nating simulan, mag add kadin na pwede gumawa ng alarm, reminders", "ung this week pwede mag lagay ka ng button para ma view ung maliit na calendar", "ano pa ba unique na pwede duon".
- **Files:** `sql/050-daily-reminders.sql` (table `reminders`, cron `tmn-reminders` bawat minuto, key `cron_daily` sa app_keys), `backend/daily-fast.ts` (bago, v1) + `webpush.ts`, `assets/js/daily-store.js` (bago), `components/daily-notes.js` (bago), `components/reminders.js` (bago), `components/mini-calendar.js` (bago), `components/home-clock.js` (bago), `pages/daily.js`, `app/home.html`, `assets/css/pages/daily.css`, `assets/css/look.css`, `sw.js` (alarm/reminder), `config.js` (0.11.7, `daily`), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Daily]].
- **Na-test:** live ang cron: bawat minuto `{"ok":true,"sent":0}` mula sa daily-fast (2026-10-24).

## 2026-10-24 · #36 Tigo: sariling 3D virtual pet (parang Tamagotchi) + Gather ng magkakalapit na kaibigan
- **Ano:**
  - Bagong page **Tigo** (menu + icon sa itaas ng phone): si Tigo (ang note na may mukha ng stickers) sa **3D** na isla (three.js). Humihinga, kumukurap, sumusunod ang tingin, tumatalon, kumakain, natutulog (gabi + Zzz).
  - Alaga: **Feed** (Pandesal, Mangga, Kanin, Dates, Halo-halo, Saging), **Play** (bola), **Clean** (bula), **Sleep/Wake**, tap kay Tigo = ❤️. Bumababa ang Food/Fun/Energy/Clean habang lumilipas ang oras; hindi namamatay si Tigo, nalulungkot lang.
  - **Level/XP**: mula sa alaga, sa pagsusulat sa Daily (note, to-do, mood), at sa paglalaro kasama ng kaibigan. Unlock: 🌱 Sprout (Lv 2), 🎀 Bow (3), 🧢 Cap (4), 🎧 Headphones (5), 👑 Crown (7). **Style**: pangalan, 8 kulay, isusuot.
  - **Meet nearby friends / Gather**: kapag naka-on sa dalawang magkaibigan at magkalapit (≤600 m), lalabas sila; pindot **Gather** = pupunta ang Tigo ng kaibigan sa isla mo at maglalaro (+15 Fun at XP sa dalawa, isang beses bawat araw), may push sa kaibigan.
  - Sa Daily: maliit na card ni Tigo (mood, level).
  - Walang WebGL: 2D na Tigo (sticker).
- **Bakit:** Ayon kay Bench: "alam mo ba ung larong tamagotchi… sige simulan natin, tapos pag me friend or classmate pwede silang mag gather pumasyal basta magkalapit sila… mas latest na 3D… i-ready to apps sya".
- **Files:** `sql/052-tigo-pets.sql` (pets, pet_meets), `sql/053-keep-warm-pet.sql`, `backend/pet-fast.ts` (bago, v1) + `webpush.ts`, `assets/vendor/three/` (three.js r170, MIT), `assets/js/tigo/pet-model.js` (bago), `assets/js/tigo/pet-scene.js` (bago), `assets/js/pages/tigo.js` (bago), `app/tigo.html` (bago), `assets/css/pages/tigo.css` (bago), `nav-items.js`, `icons.js` (tigo), `daily-store.js` (event `tmn:daily-add`), `pages/daily.js`, `app/home.html`, `pages/daily.css`, `config.js` (0.11.8, `pet`), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Tigo]].

## 2026-10-24 · #37 Tigo v2: lakad gamit ang keyboard/joystick, closet at shop, coins, bahay kubo, Coin Rush, Growth journey, sayaw kasama ang kaibigan
- **Ano:**
  - **Lakad:** W A S D / arrow keys + **Space** (talon) sa desktop; sa phone **joystick + jump button** o **swipe**; **⛶ full screen** (landscape kapag kaya ng phone). Gumagalaw ang paa at kamay habang naglalakad; sinusundan ng camera.
  - **Closet** (sa side panel, kita pa rin si Tigo): Tigo (pangalan + kulay), Sets, Hats, Face, Clothes, Hand, **Buddies** (aso, pusa, maya, kuneho, pawikan, sisiw na sumusunod), **Places** (Island, Beach, Coral reef, Snowland, Cloud land, Desert oasis, Moon base). Try-on muna bago bilhin.
  - **Coins 🪙**: 50 sa simula; galing sa **Coin Rush** (30 s, max 30 coins bawat laro, 10 laro bawat araw) at sa bawat bagong level (+20; Lv8 +100, Lv9 +150). Lv10 = golden glow.
  - **Bahay kubo** sa bawat lugar: kapag Sleep, lalakad si Tigo papasok, iilaw ang bintana, Zzz sa bubong.
  - **Growth journey**: daan mula Lv1 hanggang Lv10 na may ✓, ngayon, at 🔒.
  - **Meet nearby**: mas mahigpit na — ≤200 m, ~10 m na katumpakan, hindi tatanggapin kapag malabo ang GPS (>150 m).
  - **Sabay na galaw kasama ang kaibigan** (pagkatapos ng Gather): 💃 Dance, 🙌 Hi-5, 🏃 Habulan, 🔄 Ikot, 🙇 Bow. Sumusunod din ang Tigo ng kaibigan habang naglalakad ka.
  - Pac-Tigo at Racing: "Soon" muna sa Games.
- **Bakit:** Ayon kay Bench: "dapat me ganto (closet)… meet nearby friends dapat magkalapit ng GPS… keyboard awsd at space para sa jump, kasama ang paa… phone swipe or landscape… games… pets… house pag matutulog… adding journey… lagyan mo din ng movement pag magkasama para maka pag dance sila".
- **Files:** `sql/055-tigo-closet.sql` (coins, owned, outfit, rewarded_level), `backend/pet-fast.ts` (v2: wear, buy, game), `assets/js/tigo/catalog.js`, `outfit.js`, `backdrops.js`, `buddies.js`, `controls.js`, `coin-game.js`, `closet-ui.js`, `games-ui.js`, `journey-ui.js` (bago lahat), `pet-model.js`, `pet-scene.js`, `pages/tigo.js`, `app/tigo.html`, `pages/tigo.css`, `config.js` (0.11.9), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Tigo]].

## 2026-10-24 · #38 Tigo: nagsasalita parang baby + Sound settings, Pac-Tigo, Tigo Racing
- **Ano:**
  - **Boses ni Tigo:** speech bubble sa ibabaw ng ulo + boses-baby. "👶 Baby babble" (daldal na gawa sa synth, walang audio file) o "🗣️ Baby words" (totoong salita gamit ang speech ng device, mataas na tono). Nagsasalita kapag binati, pinakain, nilaro, nilinis, hinaplos, natulog/gumising, nag-level up, may kaibigan, at pagkatapos ng laro. "Chatty": paminsan-minsang nagsasabi kapag gutom, antok, marumi o bored.
  - **🔊 Sound settings** (button sa stage): Tigo talks on/off, style, voice volume, pitch (mababa → mataas), game sounds, chatty, Test voice. Naka-save sa device.
  - **Pac-Tigo:** maze na kakainin ang tuldok; 3 "Gloomy" (ulap ng lungkot) na humahabol; 🥭 mangga = matatakot sila at puwedeng habulin; 3 buhay, 2 minuto.
  - **Tigo Racing:** 3 lap laban sa 3 Tigo; kusang umaandar, liko lang (A/D, ←/→, joystick, swipe), S/↓ preno, Space talon; ⚡ boost pads, coins sa daan, puwesto 1st–4th.
  - Lahat ng laro: 3-2-1, HUD, ✕ para umalis, tunog (coin, talon, kain, panalo).
- **Bakit:** Ayon kay Bench: "ok next muna tapos lagyan mo din sya ng sasalita parang baby lagyan mo setting para ma adjust ung sound".
- **Files:** `assets/js/tigo/voice.js`, `talk.js`, `pac-game.js`, `race-game.js` (bago), `games-ui.js`, `pet-scene.js` (beginGame/endGame, headScreen, input), `pages/tigo.js`, `app/tigo.html`, `pages/tigo.css`, `backend/pet-fast.ts` (game kind: coins/pac/race, 10 bawat araw bawat laro), `config.js` (0.11.10), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Tigo]].

## 2026-10-24 · #39 Post media parang Facebook + video play mode (full screen / minimize)
- **Ano:**
  - **Feed (Explore, Home, Profile):** buong lapad ang photo/video at sumusunod ang taas sa hugis nito (4:5 pinakamatangkad, 1.91:1 pinakamalapad). Wala nang itim na gilid at wala nang scroll sa loob ng box; swipe lang kapag maraming photo.
  - **Video sa feed:** kusang tumutugtog nang naka-mute; 🔇/🔊 na button (hindi na play arrow). Tap sa video = **play mode**: buong-screen na player na may ✕, **▭ minimize** (maliit na lumulutang na player sa sulok, tuloy ang video habang nag-i-scroll, puwedeng i-drag, tap = palakihin) at **⛶ full screen** (pahiga kung kaya ng phone). Tuloy mula sa kung nasaan na ang video.
  - **Post viewer (Profile at link ng post):** isang buong post na lang (photo/video sa itaas, caption at comments sa ilalim) at isang scroll lang ang buong modal; sa desktop 680 px ang lapad. Video doon = play mode din.
- **Bakit:** Ayon kay Bench: "pag click ko scroll pa ung image… sa post na me video me arrow pa… dapat click ung video me lalabas na playmode tapos pwede full or minimize… same desktop… hindi na scroll sa loob ng box".
- **Files:** `assets/js/components/video-player.js` (bago, `TMN_PLAYER`), `components/post-card.js`, `components/post-viewer.js`, `icons.js` (mute, expand, shrink, pip), `css/social.css`, `css/posts.css`, `css/components.css`, `app/explore.html`, `home.html`, `profile.html`, `messages.html`, `notifications.html`, `share.html`, `config.js` (0.11.11), `lang/fil.js`, `lang/ar.js`
- **Paano:** Ang hugis ay galing sa `w`/`h` ng media (server); kung wala, kinukuha pagka-load at naaalala sa device (`tmnMediaAR`).

## 2026-10-24 · #40 Status: ❤️ like + views, sound sa status, Trending at New sounds; mas maliit na post sa desktop
- **Ano:**
  - **Desktop feed:** 560 px na lang ang lapad ng Explore (parang Facebook/Instagram) at hindi lalampas sa ~¾ ng screen ang taas ng photo/video.
  - **❤️ sa status:** sa status ng iba may puso sa kanang-ibaba (tap) o double-tap sa photo; may notification sa may-ari ("… liked your status ❤️").
  - **Sino ang nanood:** sa sariling status, nasa ibaba ang mukha ng huling 3 nanood + "N views · ❤️ N". Tap = listahan (nauuna ang nag-❤️, may ❤️ sa tabi ng pangalan).
  - **Sound sa status:** kapag nag-upload ng status, kusang pumipili ng sound (gaya ng post); puwedeng palitan o tanggalin. Tumutugtog habang pinapanood, may "♪ pangalan" sa itaas.
  - **Sound list:** bagong "🔥 Trending on TigoMeNote" (pinakaginagamit sa posts at status sa 7 araw, may bilang) at "✨ New sounds" (may "New" na tatak).
  - **5 bagong sounds:** Kilig (Pinoy acoustic love), Habagat (Pinoy rainy lofi), Corniche Walk (Gulf chill), Tigo Bounce (cute pop), Glow Up (dance pop).
- **Bakit:** Ayon kay Bench: "sa web desktop ang laki… bakit walang like heart sa status… makikita mo sino ng view at ilan… pag ng upload ako sa web bakit walang auto ng sounds… new sound trending sounds".
- **Files:** `sql/059-story-likes-sounds.sql` (story_views.liked_at, stories.sound, notification `story_like`), `backend/social-fast.ts` (likeStory, soundTrends, sound sa createStory, views/likes/faces), `backend/notify.ts` (story_like), `components/stories.js`, `components/sound-picker.js`, `sounds.js`, `pages/notifications.js`, `css/social.css`, `css/sounds.css`, `css/pages/explore.css`, `css/pages/notifications.css`, `config.js` (0.11.12), `lang/fil.js`, `lang/ar.js`
- **Paano:** Ang Trending ay bilang lang ng TigoMeNote Sounds (walang kantang may copyright gaya ng sa TikTok/FB/IG).

## 2026-10-24 · #41 Walang asul na highlight kapag nag-tap sa phone
- **Ano:** Kapag nag-tap sa photo, status, button o nag-swipe, wala nang asul na highlight o asul na "select". Hindi ginalaw ang long-press sa link (Open in new tab) at ang pag-select ng text sa caption, comments at chat. Sa keyboard (desktop) may outline pa rin para sa accessibility.
- **Bakit:** Ayon kay Bench: "pix mo lang ung pag ng click ako ng highlights ng blue… pero wag mo tanggalin ung longpress tapos newtab".
- **Files:** `assets/css/base.css`, `config.js` (0.11.13)

## 2026-10-24 · #42 Mas mabilis sa phone at tipid sa Free plan
- **Ano:**
  - **Mumbai region:** lahat ng tawag sa function ay may `?forceFunctionRegion=ap-south-1`, kaya tumatakbo ang function katabi ng database (dati malapit sa user, kaya malayo pa ang query papuntang Mumbai).
  - **Cache sa phone (service worker):** naka-save sa phone ang JS/CSS (ayon sa `?v=`), ang mga page, fonts at mga photo ng Storage. Sa ikalawang bukas, galing na sa phone ang karamihan. Binubura ang photo cache kapag nag-logout.
  - **Maliit na preview ng photo:** bawat bagong photo ay may kasamang ≤960 px na preview (`_t.jpg`, ≤300 KB) para sa feed; ang buong photo ay kapag binuksan lang. Lumang posts = buong photo pa rin.
  - **Mas kaunting polling:** notif badge 3 min, safety watch 1 min, wellbeing 2 min, messages list 2 min kapag naka-realtime (20 s kung hindi), chat 6 s → 60 s kapag tahimik.
  - **Mas matalinong cron:** `tmn-reminders` ay tumatawag lang kung may reminder na due; `tmn-keep-warm` bawat 4 min lang at kapag may gumamit sa nakaraang 15 min.
- **Bakit:** Ayon kay Bench: "bakit kaya medyo mabagal… sa phone" at "sa free muna tayo". Mga 7,750 function calls sa 24 oras na may 4 users lang; 500k/buwan ang limit.
- **Files:** `assets/js/config.js` (REGION, 0.11.14), `sw.js`, `auth-guard.js`, `notif-badge.js`, `safety-watch.js`, `wellbeing.js`, `pages/messages.js`, `components/chat-view.js`, `post-queue.js`, `components/post-card.js`, `components/post-viewer.js`, `backend/posts-fast.ts` (thumb_path), `sql/062-cron-savings.sql`, `sql/063-post-thumbs.sql`
- **Paano:** Function `posts-fast` v13. Ang preview ay ginagawa sa phone (canvas), walang server na nagre-resize.

## 2026-10-24 · #43 Tigo: camera 360° (pangalawang joystick), 3 view, zoom, at loob ng bahay na naaayos
- **Ano:**
  - **Camera:** sa phone, kaliwang joystick = lakad, **kanang joystick = camera** (ikot 360°, taas = tumingala sa langit, baba = tingin mula sa itaas). Sa gilid nito: ⤒ Jump, 🎥 View (Follow → Top view → Close-up) at 🔍 Zoom (normal → malayo, maliit si Tigo → malapit). Dalawang daliri sa screen = pinch zoom. Desktop: hila ng mouse = ikot, wheel = zoom, Q/E = ikot.
  - **Lakad ayon sa camera:** taas ng joystick / W = palayo sa camera, kahit saan nakaharap.
  - **3D na langit:** may ulap at araw sa araw, buwan at kumikislap na bituin sa gabi (makikita kapag tumingala).
  - **Loob ng bahay:** lumakad sa pinto ng bahay kubo (o 🏠 House / 🏠 Go inside) → kwarto na may kama, alpombra, halaman, lampara, bintana at pinto. Ang dingding na nakaharang sa camera ay bumababa (parang dollhouse). 🚪 Go outside o lumakad sa pinto para lumabas.
  - **🛠 Decorate:** 26 na gamit (kama, sofa, mesa, electric fan na umiikot, aquarium na may isda, TV, majlis, banig, piano, wall clock na totoong oras, painting, salamin, star lights, PH/BH banner, atbp.), 9 na dingding (Cream, Sky, Sawali, Starry night…) at 6 na sahig (tabla, tiles, kawayan, marmol…). Tap = ilagay; hilahin para ilipat; ⟳ ikot; 🗑 itabi. Kusang nase-save. May libre (kama, alpombra, halaman, lampara, cream, tabla), ang iba ay may coins/level.
  - **Gabi:** papasok si Tigo sa bahay, hihiga sa kama (bukas ang lampara at star lights).
- **Bakit:** Ayon kay Bench: "touch ko padin ung screen pag titingnan ko ung langit at na 360… tatlong focus… top view tapos zoom… mapasok ung loob ng bahay, pwede mo design ung loob" at "sa kabila… gawin mong parang joystick me dalawa or tatlong button sa gilid".
- **Files:** `tigo/camera-rig.js`, `tigo/sky-dome.js`, `tigo/room.js`, `tigo/furniture.js`, `tigo/room-ui.js` (bago), `tigo/pet-scene.js`, `tigo/controls.js` (2 joystick, walang swipe-lakad), `tigo/catalog.js` (HOME_ITEMS), `tigo/talk.js`, `pages/tigo.js`, `app/tigo.html`, `css/pages/tigo.css`, `backend/pet-fast.ts` (room, v4), `sql/065-tigo-room.sql`, `lang/fil.js`, `lang/ar.js`
- **Paano:** `pets.room` = { wall, floor, items[{ id, x, z, r }] }; pet-fast "room" ay tumatanggap lang ng pag-aari (o libre sa level), hanggang 40 gamit at 4 bawat uri.

## 2026-10-24 · #44 Sound Maker: gumawa ng sariling tunog
- **Ano:**
  - **Bagong page (Menu → Sound Maker):** grid na 16 hakbang: 🥁 Kick, 👏 Snare, ✨ Hi-hat, 🙌 Clap, 🪘 Doum, 🥢 Tak at 🎸 Bass. Tap = on/off habang tumutugtog, may gumagalaw na playhead. Sa phone, hati sa 1–8 at 9–16 para malaki ang kahon.
  - **Mabilis na simula:** Pop, Lofi, Pinoy acoustic, Khaleeji, Trap, House, Calm. **Music:** Masaya/Malungkot/Chill/Arabic, key, chords (7 instrument), himig (8 + wala), ayos ng chords, swing, ulan, plaka. 🎲 Bagong himig at 🎲 Random beat.
  - **Save** (hanggang 30 bawat user), **Edit**, **Delete** (dalawang tap), **⬇ WAV** (16 segundo).
  - **Sa posts at status:** sa Sounds picker may "🎛️ My sounds" at "＋ Make a sound" (bubukas ang Sound Maker sa loob mismo, hindi nawawala ang ginagawang post). Ang tunog ay tumutugtog sa phone ng ibang tao rin; lalabas din sa 🔥 Trending kapag maraming gumamit.
- **Bakit:** Ayon kay Bench: "merron ba tayo sariling sound invented" → "sunod muna ung sound maker".
- **Files:** `components/sound-maker.js`, `pages/sound-maker.js`, `app/sound-maker.html`, `css/sound-maker.css` (bago), `sounds.js` (ensure, fromRecipe, preview, position), `components/sound-picker.js`, `components/stories.js`, `nav-items.js`, `config.js` (fn sounds, 0.11.15), `app/explore.html`, `gallery.html`, `home.html`, `share.html`, `backend/sounds-fast.ts` (bago, v1), `backend/sound-recipe.ts` (bago), `backend/posts-fast.ts` (v14), `backend/social-fast.ts` (v11), `sql/066-user-sounds.sql`, `lang/fil.js`, `lang/ar.js`
- **Paano:** Recipe lang ang naka-save (walang audio file, tipid sa Free plan). Kapag ginamit sa post/status, kinukuha ng server ang recipe sa `user_sounds` at kinokopya sa `sound` ng post, kaya tumutugtog pa rin kahit burahin ang tunog.

## 2026-10-25 · #45 Tigo parang totoong mobile game: game buttons, swipe camera, lahat nasa loob ng laro (portrait at landscape)
- **Ano:**
  - **Kontrol:** kaliwa = joystick (D-pad); kanan = ⤒ Jump (malaki), 🏃 Run (toggle; Shift sa keyboard), ✋ Stop (hinto agad, haharap sa camera) at 🎥 Camera (isang button lang, parang MIR4: Follow → Wide → Top → Close-up). Wala nang pangalawang joystick.
  - **Camera:** swipe sa gitna ng screen = ikot 360° (kaliwa/kanan) at pataas = tingala sa langit, pababa = mula sa itaas; pinch = zoom.
  - **Lahat nasa loob ng laro (phone):** mini stats (🍙🎈⚡🫧), menu bar (Feed, Play, Clean, Sleep, Closet, Games, House, Journey, Sound, Full; « = itago), at Go inside / Go outside / Decorate ay nasa menu bar din. Ang Closet at Decorate ay bumubukas sa loob ng laro (sheet); ▾ = minimize para makapaglaro habang bukas, ✕ = sara.
  - **Landscape sa phone/APK:** kusang buong screen na laro (walang top bar at tabs); ang sheet ay nasa kanan para kita pa rin ang joystick. Portrait: kasya ang buong laro sa screen (hindi na kailangang mag-scroll para sa mga button).
  - **Full screen:** buong page na (hindi lang ang stage), kaya nakikita pa rin ang Feed, Games, Sound at iba pang menu.
  - **Ayos:** ang puso kapag hinawakan si Tigo ay hindi na baliktad 😄; ang toast ay hindi na humahaba kapag bukas ang Dance bar.
- **Bakit:** Ayon kay Bench: "gawin mo sana ung joystick ganto… run, jump, stop parang isang game… pag naka land scape… lahat ng process nya kasama… ung pag zoom at focus isang botton lang same sa mir4… swipe swipe sa gitna… always check ung overlap… pag hindi naka land scape check padin" at "ayusin mo din ung puso… baliktad".
- **Files:** `app/tigo.html`, `css/pages/tigo.css`, `pages/tigo.js`, `tigo/camera-rig.js`, `tigo/controls.js`, `tigo/pet-scene.js`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.16)
- **Paano:** May overlap test (test_layout: 390×844, 360×740, 844×390, 740×360, desktop) na sinusuri na walang nagpapatong at nasa loob ng screen ang lahat, kasama habang nasa bahay, nagde-decorate, naka-minimize ang sheet at may Closet.

## 2026-10-25 · #46 Swipe na parang 3D engine, Sit/Sleep/Tayo sa bahay, at laki ni Tigo
- **Ano:**
  - **Swipe:** ang mundo ay sumusunod sa daliri: swipe pababa = bababa ang mundo at lilitaw ang langit; swipe pataas = pabalik (hanggang tingin mula sa itaas). Tuloy-tuloy, isang swipe sa buong taas ng screen = buong saklaw.
  - **Sa loob ng bahay:** ang 🏃 Run at ✋ Stop ay napapalitan ng **🪑 Sit** (lalakad sa pinakamalapit na upuan, sofa, bean bag o majlis; kung wala, sa sahig) at **🛏️ Sleep** (matutulog sa kama). Kapag nakaupo o nakahiga, ang Jump ay nagiging **⬆ Tayo** (tatayo / gigising). Ang joystick ay nagpapatayo rin kapag nakaupo.
  - **Laki ni Tigo:** patayong bar sa gilid na may kulay (parang status bars): hila pataas = mas malaki, pababa = mas maliit (50%–130%). Gumagana sa loob at labas ng bahay; naka-save sa device.
- **Bakit:** Ayon kay Bench: "pag swipe ko pataas or down dapat ung realword tataas at bababa… parang realtime engine", "pag nasa loob ng bahay ung stop, run at ung jump mapapalitan ng sit, sleep sa bed… jump, matatayo sya" at "pwede sya liitan… ung adjustment gawin mo para ung sa status natin na me kulay".
- **Files:** `tigo/camera-rig.js`, `tigo/pet-scene.js` (sit, standUp, pose, setSize), `tigo/room.js` (seatNear), `tigo/furniture.js` (seat), `tigo/controls.js`, `pages/tigo.js`, `app/tigo.html`, `css/pages/tigo.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.17)
- **Paano:** Overlap test (test_layout) 114/114 kasama ang Sit, Sleep at size bar sa portrait, landscape at desktop.

## 2026-10-25 · #47 Mas totoong damit, bag at alaga · totoong hawak · 📸 Photo + Share · 💃 Dance (3 sayaw)
- **Ano:**
  - **Damit at bag:** Backpack na may flap, bulsa, zipper, hawakan at buckle; ang strap ay dumadaan sa ibabaw ng balikat at nakadikit sa katawan (wala nang "patpat" na lumalampas sa paa). Hoodie na bumabalot hanggang balikat (hood sa likod, zipper, tali, bulsa). Cape na nakasabit sa balikat at umuugoy kapag naglalakad.
  - **Totoong hawak:** ang braso ay may balikat at kamao; ang hawak ay dumadaan sa kamao at laging patayo kahit gumagalaw ang braso. Ang flag ay wumawagayway, ang lobo ay umuugoy, ang payong ay may J na hawakan at 8 tela.
  - **Alaga:** aso at pusa na may nguso, 4 na paang gumagalaw kapag naglalakad, kwelyo at gintong tag; pusa may balbas at guhit; kuneho may malalaking paa sa likod.
  - **📸 Photo:** sa menu (phone/landscape) at sa gilid (desktop). Flash, tapos litrato (≥1080px) na may pangalan, level, petsa, "with (bisita)", "at home" at TigoMeNote. Preview: ⬇ Save · ↗ Share (share ng phone, kung meron) · 📤 Share to Explore (bubukas ang New post na may litrato at caption). Gumagana sa labas, sa loob ng bahay at kahit may bisita.
  - **Level up:** ang 📸 ay nagiging **🎉 Lv N** (mga 45 s) → litrato na may "🎉 Level N!" na banner, pang-share.
  - **💃 Dance:** pindot → 3 sayaw: 🪩 Groove, 🕺 Budots, 🤖 Robot (5 s, may confetti; sasabay ang bisita at buddy; gumagana rin sa loob ng bahay). Naglakad = tigil sayaw.
- **Bakit:** Ayon kay Bench: "medyo real, para di pangit tingnan", "ung pag hawak ng flag… dapat real na hawak", "mag lagay kadin ng tap to photo… pwede top to share para sa explore… pag ng level pwede sya i share" at "dance botton… pag click ng botton me 3 bottons pwede mag dance".
- **Files:** `tigo/pet-model.js`, `tigo/outfit.js`, `tigo/buddies.js`, `tigo/pet-scene.js` (snapshot, dance), `tigo/photo.js` (bago), `pages/tigo.js`, `app/tigo.html`, `css/pages/tigo.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.18)
- **Paano:** Ang post maker (composer, sounds, emoji) ay ini-load lang kapag pinindot ang Share to Explore, kaya hindi bumibigat ang Tigo page. test_photo 18/18; test_layout 139/139 (may 💃 row, sa loob ng bahay, portrait, landscape, desktop); test_tigo 41/41, test_house 33/33, test_games 10/10, test_posts 41/41.

## 2026-10-25 · #48 Domain tigomenote.com, logo A, at simula ng APK
- **Ano:**
  - **Domain:** `tigomenote.com` (Cloudflare Registrar). DNS: 4 A record ng GitHub Pages + `www` CNAME (DNS only). May `CNAME` file; naka-Enforce HTTPS.
  - **Logo A (note na may mukha):** TigoMeNote (coral na note sa itim), Tigo (cream na note sa orange + bituin), Chat (bubble na may tupi sa teal–blue). Web icons, favicon.svg, notification badge, at Android adaptive + monochrome icons + splash para sa 3 app.
  - **APK (Capacitor 8):** `com.tigomenote.app`. Binubuo ng GitHub Actions; app mode = walang zoom (textZoom 100), Back button na nagsasara muna ng modal/sheet, status bar ayon sa theme, Home o Login agad.
- **Bakit:** Ayon kay Bench: "hindi web design ang atake ng apk… pag ng zoom 80 eh liliit din", "gawan mo ng unique design na logo" (pinili ang A), at "bili nako domain".
- **Files:** `CNAME`, `tools/brand/logo.py`, `tools/make-icons.py`, `assets/img/*`, `apk/` (main config, start.html, build-web.py, patch-android.py, res/), `.github/workflows/apk.yml`, `assets/js/app-mode.js`, `assets/css/base.css`, lahat ng page (favicon)
- **Paano:** Sa server (notify-fast, safety-fast) ay luma pa ang SITE para sa VAPID subject; papalitan sa susunod na deploy (walang epekto sa push). Sa APK, wala pang push hanggang Firebase (FCM).

## 2026-10-25 · #49 Get app page (Android, iPhone, QR) + logo sa header
- **Ano:**
  - **`tigomenote.com/get/`:** kusang pinipili ang tab ayon sa device.
    - 🤖 Android: Download button (pinakabagong APK, version at laki galing sa `app-version.json`) + 4 na steps (pati "Install unknown apps").
    - 📱 iPhone: Add to Home Screen sa Safari + pag-on ng notifications (iOS 16.4+, bukas mula sa Home Screen icon lang).
    - 💻 Computer: QR code (static na `assets/img/qr-get.svg`, chine-check ng OpenCV) + steps.
    - Listahan ng 3 app (Tigo at Chat: Coming soon).
  - **Links:** 📲 Get app sa landing (header + "Web, Android app and iPhone") at sa menu (Get app; nakatago sa loob ng APK).
  - **Logo sa header:** ang `.brand-mark` ay ang bagong logo na (lahat ng page, login, policies).
  - **CI:** pagkatapos ng release, ina-update ng workflow ang `app-version.json` (version, code, url, laki, sha256) — gagamitin din ng auto-update.
- **Bakit:** Ayon kay Bench: "lagay mo na sa web ung GET APP tapos merron QR instruction at para sa ios pano mag kakaroon notify".
- **Files:** `get/index.html`, `assets/js/pages/get.js`, `assets/css/pages/get.css`, `app-version.json`, `tools/make-qr.py`, `assets/img/qr-get.svg`, `assets/img/app-*.png`, `config.js` (apps), `nav-items.js` (web: true), `app-shell.js`, `index.html`, `css/shell.css`, `css/pages/legal.css`, `css/pages/auth.css`, `css/pages/landing.css`, `.github/workflows/apk.yml`, `lang/fil.js`, `lang/ar.js`
- **Paano:** test_get 13/13 (Android, iPhone, computer, 360px; walang horizontal scroll). Ang test_ui (register flow) ay sira na bago pa ito (luma ang test).

## 2026-10-25 · #50 TigoMeNote Chat APK (`com.tigomenote.chat`)
- **Ano:**
  - **Hiwalay na app para sa Messages:** bumubukas diretso sa Chats (o Login), at may sariling menu: Chats · Notifications · Profile · Settings (walang Daily, Tigo, Get app). Iisang code at account.
  - **Per-app menu:** `nav-items.js → apps.chat`; ang `app-mode.js?app=chat` ang nagsasabi kung aling APK (`window.TMN_APP_ID`). Login → babalik sa unang page ng app.
  - **Build:** sabay nang ginagawa ng GitHub Actions ang main at chat (matrix); Release `chat-v<version>` → `TigoMeNoteChat.apk`. Pareho ang signing key (iisang password).
  - **Get app:** sa listahan ng apps, "Available" (o ⬇ Download sa Android) kapag may APK na sa `app-version.json`.
- **Bakit:** Ayon kay Bench: "gawan mona ng apk ung chat".
- **Files:** `apk/chat/` (app.json, capacitor.config.json, package.json), `apk/main/app.json`, `apk/build-web.py`, `apk/update-version.py`, `.github/workflows/apk.yml`, `assets/js/app-mode.js`, `assets/js/nav-items.js`, `components/app-shell.js`, `pages/login.js`, `get/index.html`, `pages/get.js`, `css/pages/get.css`, `lang/fil.js`, `lang/ar.js`
- **Paano:** test_chatapp 6/6 (simulated na APK: Login → Chats, 4 tabs, walang zoom); test_get 13/13; test_tabs 48/48. Wala pang push sa APK (Firebase) at hindi pa binubuksan ng main app ang Chat app (kailangan ng native na check kung naka-install).

## 2026-10-25 · #51 Get app: "Open in Chrome" kapag nasa browser ng ibang app
- **Ano:** Sa Android na nakabukas sa loob ng ibang app (Claude, Messenger, Instagram…; WebView na "; wv)"), may dilaw na banner na **Open in Chrome**, at ang mga Download button ay dumadaan sa Chrome (Android intent na may fallback sa default browser). Sa Chrome mismo, diretso pa rin ang link.
- **Bakit:** Ayon kay Bench: "ang prob sa link, di sya direct sa apps ng google chrome" — gumagana ang GitHub links (302 → APK) pero hindi nagda-download sa browser sa loob ng app.
- **Files:** `get/index.html`, `assets/js/pages/get.js`, `assets/css/pages/get.css`, `lang/fil.js`, `lang/ar.js`
- **Paano:** test_get 16/16 (pati WebView at Chrome).

## 2026-10-25 · #52 APK: opening animation, hindi na natatakpan ng status bar, English na "Philippines ⇄ here"
- **Ano:**
  - **Opening animation:** splash ng Android 12+ = kulay ng app + icon (wala nang kulay-abo); tapos si Tigo ay sumusulpot, kumikindat, at lumalabas ang "TigoMeNote" (mga 1 segundo) bago Home/Login. Chat: teal na may bubble.
  - **Status bar / navigation bar:** ang laman ng app ay nasa pagitan na ng status bar at navigation bar (MainActivity, Android 15 edge-to-edge) — napipindot na ang ☰ at ang tabs; umaakyat din kapag may keyboard. Ang kulay sa likod ng bars ay sumusunod sa theme (`window.TMNNative.setBars`).
  - **English default:** "Pinas ⇄ here" → "Philippines ⇄ here" (Filipino: "Pinas ⇄ dito").
  - Version 0.11.19 (mas mataas na versionCode → update sa ibabaw ng dati).
- **Bakit:** Ayon kay Bench (may screenshots): "Walang animation ung pag bukas ng apps, ang taas ng navi at ung sa taas… diko ma click ung humburger" at "dapat English lahat ang default natin".
- **Files:** `apk/patch-android.py` (MainActivity, splash theme), `apk/start.html`, `apk/build-web.py`, `apk/*/app.json`, `apk/*/capacitor.config.json`, `assets/js/app-mode.js`, `components/home-clock.js`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.19)
- **Paano:** Na-test ang animation at redirect sa browser (fake na native). Ang insets at splash ay sa totoong phone lang makikita.

## 2026-10-25 · #53 Bagong itsura ng Messenger + Download bawat app sa Get app
- **Ano:**
  - **Messenger (web, TigoMeNote APK at Chat APK):** kulay ng Chat (teal → blue): sariling bubbles na gradient, puting bubbles ng kausap na may anino, makukulay na avatar (iba-iba ang kulay), malaking "New message" na bilog, petsa na naka-pill, mas malinis na compose bar na may bilog na Send, at pinned bar na light blue.
  - **Get app:** bawat app na may APK ay may sariling **⬇ Download** (may laki ng file) sa listahan — sa Android at sa computer; sa iPhone "Android only".
  - **Profile:** lumiliit nang kaunti ang mahabang pangalan sa phone para hindi maputol sa gitna ("sensengutierre z").
  - **APK:** nasa ibaba ng menu (☰) ang version ng app (hal. "TigoMeNote Chat app · v0.11.20") para makita kung updated.
  - Version 0.11.20.
- **Bakit:** Ayon kay Bench: "sabay mo nadin ung messenger pangit haha", "bakit walang seperate download pag click ko ung available" at screenshot ng Chat app na natatakpan pa ang itaas ("Taas din ng messenger" — naayos na sa 0.11.19; kailangang i-install ang bagong Chat APK).
- **Files:** `css/pages/messages.css`, `get/index.html`, `pages/get.js`, `css/pages/get.css`, `css/pages/profile.css`, `assets/js/app-mode.js`, `css/base.css`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.20)
- **Paano:** test_messages 86/86, test_profile 32/32, test_get 17/17, test_chatapp 7/7.

## 2026-10-25 · #54 APK download mula sa tigomenote.com/dl (hindi na GitHub)
- **Ano:**
  - **`.github/workflows/pages.yml` (Deploy site):** dine-deploy ang site sa GitHub Pages gamit ang Actions; habang nagde-deploy, kinukuha ang pinakabagong APK ng bawat app sa GitHub Releases at inilalagay sa `dl/` → `tigomenote.com/dl/TigoMeNote.apk` at `tigomenote.com/dl/TigoMeNoteChat.apk`. Walang APK na naka-save sa repo. Tumatakbo sa bawat push at pagkatapos ng "Build APK".
  - **`app-version.json`:** `url` = tigomenote.com/dl/…?v=<version>; `github` = lumang link (backup).
  - **Get app sa Android:** laging sa Chrome mismo bumubukas ang download (sa Custom Tab o browser ng ibang app, natitigil sa "Downloading…"); may paalala na "Files → Downloads".
- **Bakit:** Ayon kay Bench (screenshot ng github.com na nakatigil sa "Downloading…"): "Ayusin mo download pag dito sa site na to di ma download".
- **Files:** `.github/workflows/pages.yml`, `apk/update-version.py`, `get/index.html`, `pages/get.js`, `css/pages/get.css`, `lang/fil.js`, `lang/ar.js`
- **Paano:** Kailangang naka-**Settings → Pages → Source: GitHub Actions** (kung hindi, papalitan ng branch deploy ang site na walang dl/). test_get 17/17.

## 2026-10-25 · #55 APK permissions + Messages → TigoMeNote Chat app (o download page)
- **Ano:**
  - **Permissions (main at Chat APK):** Camera, Microphone, Location (fine/coarse), Notifications, Vibrate + `<queries>` ng 3 app. Dati "No permissions requested" kaya "Can't open the camera". Ang Capacitor ang nagtatanong kapag kailangan (camera/mic/GPS).
  - **Messages sa TigoMeNote APK:** kung naka-install ang Chat → kusang binubuksan ang **TigoMeNote Chat**; kung wala → "Get TigoMeNote Chat" → bubuksan ang **tigomenote.com/get** sa Chrome (pansamantala habang wala pa sa Play Store).
  - **Native bridge:** `window.TMNApps.hasApp / openApp / openUrl` (MainActivity) → `TMN_APP.hasApp/openApp/installApp` (app-mode.js).
  - Pangalan: "Tigo Messenger" → **"TigoMeNote Chat"** sa lahat ng text (pati Filipino/Arabic).
  - Version 0.11.21.
- **Bakit:** Ayon kay Bench (screenshots: App info na walang permission, "Can't open the camera", at "Install Tigo Messenger"): "i direct mo dapat to sa download site pansamantala habang dipa na lalagay sa playstore, tapos ung mga permission".
- **Files:** `apk/patch-android.py`, `assets/js/app-mode.js`, `pages/messages.js`, `components/notif-settings.js`, `components/chat-view.js`, `native-bridge.js`, `app/messages.html`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.11.21)
- **Paano:** test_gate 3/3 (simulated na APK), test_messages 86/86.

## 2026-10-25 · #56 Fix: 404 sa tigomenote.com/dl → backup na GitHub link
- **Ano:** Kapag wala pa ang APK sa `tigomenote.com/dl/` (hal. napalitan ng lumang "Deploy from a branch" ang site), sa GitHub Release muna ang Download button sa Get app page (HEAD check ng bawat app sa `app-version.json` → `github`).
- **Bakit:** Ayon kay Bench (screenshot ng 404 sa `/dl/TigoMeNoteChat.apk`): "both download wala". Dahilan: naka-"Deploy from a branch" pa ang Pages, kaya ang branch deploy (walang `dl/`) ang huling nag-deploy.
- **Files:** `assets/js/pages/get.js`
- **Paano:** test_get 18/18. Para sa tigomenote.com/dl mismo: Settings → Pages → Source: **GitHub Actions**.

## 2026-10-25 · #57 APK auto-update: hindi magagamit ang app hangga't hindi naa-update
- **Ano:**
  - **`assets/js/app-update.js` (APK lang):** pagbukas, pagbalik sa app at bawat 30 min, kinukuha ang `tigomenote.com/app-version.json`. Kapag mas mataas ang version ng app na ito → full-screen na **"New version available"** (walang close; hindi rin gumagana ang Back).
  - **⬇ Install new version:** dina-download ng app mismo ang bagong APK (Android DownloadManager, may progress bar) → kusang bubukas ang **installer** ng Android → Install (hindi mawawala ang data). Kung hindi pa naka-allow ang "Install unknown apps" → bubuksan ang setting. Backup: "Download in Chrome instead".
  - **Native (MainActivity):** `window.TMNUpdate.canInstall / allowInstall / install(url) / progress / reopen`; permission `REQUEST_INSTALL_PACKAGES`; FileProvider `<pkg>.tmnupdate`.
  - Walang internet → hindi hinaharang ang app.
  - Version 0.11.22. Ang mga app na mas luma sa 0.11.22 ay kailangan pang i-update nang manual nang isang beses.
- **Bakit:** Ayon kay Bench: "pag me bagong update dapat di mag work ung apps dapat papadownload nya ung bagong download, tapos me lalabas na install new version tapos direct download na".
- **Files:** `assets/js/app-update.js`, `apk/patch-android.py`, `apk/build-web.py`, `assets/js/app-mode.js`, `css/base.css`, `config.js` (apps.remoteVersion, 0.11.22), `lang/fil.js`, `lang/ar.js`
- **Paano:** test_update 7/7 (simulated: harang, download sa loob ng app, Install, walang permission, parehong version = walang harang).

## 2026-10-25 · #58 Gallery: magkaiba na ang 📷 Camera at ⬆ Upload
- **Ano:** Ang **Camera** sa Gallery ay ang sariling camera ng app (live filters, harap/likod, photo) gaya ng sa Share; ang **Upload** ay pili ng files. Kung walang camera API ang device, camera ng phone (input na may capture) ang gagamitin. Version 0.11.23 — ito rin ang unang test ng auto-update sa phone.
- **Bakit:** Ayon kay Bench (screenshot ng Gallery sa APK): "Same lang sila ng function 😂 camera at upload".
- **Files:** `app/gallery.html` (camera.css, camera.js), `assets/js/pages/gallery.js`, `config.js` (0.11.23)
- **Paano:** test_galcam 1/1 (fake na camera), test_gallery 51/51.

## 2026-10-25 · #59 Push sa apps (Firebase): messages → Chat app, likes/comments/follows → TigoMeNote app
- **Ano:**
  - Server: bagong `backend/push.ts` (`deliver()`): iisang daan para sa web push at FCM (Firebase HTTP v1, token mula sa secret `FCM_SERVICE_ACCOUNT`).
    - messages → TigoMeNote Chat app; kung wala → TigoMeNote app; kung wala pareho → web.
    - social at daily → TigoMeNote app; kung wala → web. tigo → Tigo app → TigoMeNote app → web. safety (SOS, invites) → lahat ng device.
    - Patay na token (UNREGISTERED/404) → binubura ang push_subs.
  - Ginagamit na ng notify-fast, safety-fast, pet-fast at daily-fast (lahat naka-deploy). `push_subs.app` (sql/083) = tigomenote | messenger | tigo.
  - APK: plugin `@capacitor/push-notifications`; `apk/add-firebase.py` isinusulat ang google-services.json mula sa GitHub secret `GOOGLE_SERVICES_JSON` (kung kasama ang package ng app), default icon ic_stat_tigo at kulay.
  - app-mode.js: `TMN_APP.pushToken({ask})` (permission → channels: messages, social, safety, reminders, tigo → token); pindot sa notification → bubuksan ang page (data.url); lumalabas din habang bukas ang app.
  - push-setup.js: sa APK, ipinapadala ang token kasama ang `app`; tahimik na sync pagbukas (kapag pinayagan na; isang beses bawat araw o kapag nagbago ang token).
  - Version 0.11.24.
- **Bakit:** Ayon kay Bench: hiwalay ang notifications ng Messenger at ng follow/like sa apps; ginawa ni Bench ang Firebase project at ang dalawang secret.
- **Files:** `backend/push.ts`, `backend/notify-fast.ts`, `backend/safety-fast.ts`, `backend/pet-fast.ts`, `backend/daily-fast.ts`, `sql/083-push-app.sql`, `apk/add-firebase.py`, `.github/workflows/apk.yml`, `apk/main|chat/package.json`, `apk/main|chat/capacitor.config.json`, `assets/js/app-mode.js`, `assets/js/push-setup.js`, `assets/js/native-bridge.js`, `config.js` (0.11.24)
- **Paano:** unit test ng routing at JWT (mock), test_fcm 9/9 (simulated na plugin: walang tanong pagbukas, Turn on → permission → token → subscribe app=messenger, pindot → page, walang ulit sa parehong araw), dry run ng add-firebase.py (pekeng config). Hindi pa nasubukan sa totoong phone.

## 2026-10-31 · #60 Auto-download ng update + What's new
- **Ano:** Pagbukas ng app at may bagong version, kusang nagda-download na ang APK (kung pinayagan na ang "Install unknown apps"), tapos bubukas ang installer ng Android: "Install" na lang ang pipindutin. Ang "What's new" (whatsnew.json, mula 0.11.28) ay nasa update screen. Tumitigil ang 3D ng Tigo habang bukas ang update screen. Version 0.11.29.
- **Bakit:** Ayon kay Bench: "Hndi ba auto na ung update pag open ng apps, tapos dapat lumabas ung details ng bagong patch para makita anung bago sa new version". Hindi kayang mag-install nang tahimik ng sideload na APK (Android ang nagtatanong); sa Play Store lang iyon.
- **Files:** `assets/js/app-update.js`, `assets/js/tigo/pet-scene.js`, `whatsnew.json`, `config.js` (0.11.29)
- **Paano:** test_autoupd 5/5 (may permission → kusang download → Install; walang permission → hinihintay ang tap; What's new lumalabas), test_tigoupd 3/3 (kasya sa landscape, tumitigil ang 3D).

## 2026-10-31 · #61 Crash report ng apps + Tigo layout sa maliit na landscape
- **Ano:** Crash report (native → crash-fast → `app_crashes`, 30 araw), magaan na 3D pagkatapos ng crash, at hindi na nagpapatong ang menu/stats/slider ng Tigo. Version 0.11.30.
- **Bakit:** Ayon kay Bench (screenshot ng Tigo app): "ganto padin kase at ng force closed".
- **Files:** `apk/patch-android.py`, `backend/crash-fast.ts`, `sql/089-app-crashes.sql`, `assets/js/app-mode.js`, `assets/js/tigo/pet-scene.js`, `assets/js/pages/tigo.js`, `config.js` (fn.crash, 0.11.30), `whatsnew.json`
- **Paano:** test_crash 5/5 (report naipapadala nang isang beses, lite 3D 1x, walang report kung walang crash), sukat ng layout sa 909×414, 727×320 (malaking stats), 640×300: walang patong. Java ng MainActivity: walang syntax error (javac). Hindi pa nasubukan sa totoong phone.

## 2026-10-31 · #62 Phone gallery: buksan sa itaas, long press na options; iisang music player
- **Ano:**
  - Phone gallery: pag-tap ng folder → bukas at umaakyat agad sa itaas. Habang may napili, lumulutang sa ibaba ang bar (Post, Schedule, Save, Clear). Long press sa litrato → options (Post now / Schedule / Save to app gallery). Composer: `o.when = "later"` = bukas agad ang Schedule.
  - Music: sa TigoMeNote (main) lang ang player at widget; sa Chat app, "Open music in TigoMeNote" na lang (tuloy ang tugtog habang nasa Chat).
  - Tigo: walang push register kung walang Firebase (dahilan ng force close). Update: Chrome download ang pangunahin, walang auto download.
  - Version 0.11.31.
- **Bakit:** Ayon kay Bench: "pag click ko automatic open folder", "pag ng long press ako or click sa picture me option lalabas, kung post to schedule", "dalawa ung widget ng music… dapat iisa lang", "force close padin", "wag auto download… lagi manual download".
- **Files:** `assets/js/pages/gallery-phone.js`, `assets/css/pages/gallery.css`, `assets/js/components/post-composer.js`, `assets/js/components/music-player.js`, `apk/patch-android.py` (MusicWidget sa main lang, hasFirebase), `assets/js/app-mode.js`, `assets/js/app-update.js`, `assets/css/base.css`, `whatsnew.json`, `config.js` (0.11.31)
- **Paano:** test_v31 14/14 (folder sa itaas, lumulutang na bar, long press → options → Schedule, Chat music card, Tigo push register lang kung may Firebase, update walang auto download at kasya sa landscape), gallery bar sa landscape 844×390 walang patong. Hindi pa nasubukan sa totoong phone.

## 2026-11-01 · #63 Messages widget (Chat), race tracks at pedals, music error report
- **Ano:**
  - Messages widget (Chat app lang): 3 pinakabagong chat, pangalan, huling message, oras at unread; pindot = bukas ang chat (`tmn_url` → MainActivity.openFromIntent); ↻ = refresh. Ang widget mismo ang kumukuha ng inbox (messages-fast) gamit ang token mula sa `TMNWidget.setAuth` (`widget-sync.js`); update bawat 30 min, pag-alis sa app, at ↻. Music widget: sa TigoMeNote lang (music lang).
  - Tigo Racing: pili ng track (Easy loop / Classic / Twisty hills, iba ang lapad at bilis ng kalaban), Brake (hawak) at Turbo (6 s na hintay, bilog na napupuno) na pedal, tulong sa pagliko (sumusunod sa daan kapag walang liko), tamang direksyon ng ⚡ arrow.
  - HUD ng laro nasa itaas-gitna sa landscape. Music: ipinapakita at nire-report kung bakit hindi tumugtog.
  - Version 0.11.32.
- **Bakit:** Ayon kay Bench: "di ng play ung music", "ung life at score nasa badang gitna", "ung race baliktad ung arrow, mahirap ung race dapat me pedal ng stop at turbo… me pag pipiliaan ng race track", "ibalik mo ung widget ng message, pero make it real na messages lang. At ung widget ng music make sure music lang".
- **Files:** `apk/native/MessagesWidget.java`, `apk/native/res/layout/tmn_widget_msgs.xml`, `apk/native/res/xml/tmn_widget_msgs_info.xml`, `apk/native/res/drawable/tmn_badge_bg.xml`, `apk/native/res/drawable/tmn_widget_row.xml`, `apk/native/MusicEngine.java`, `apk/patch-android.py`, `apk/build-web.py`, `assets/js/widget-sync.js`, `assets/js/components/music-native.js`, `assets/js/tigo/race-game.js`, `assets/js/tigo/games-ui.js`, `assets/js/pages/tigo.js`, `assets/css/pages/tigo.css`, `whatsnew.json`, `config.js` (0.11.32)
- **Paano:** test_v32 9/9 (HUD sa itaas at hindi tumatama sa pangalan/✕, 3 track, pedals hindi tumatakip sa jump/joystick sa landscape at portrait, turbo cooldown, widget-sync token + refresh). Java: walang syntax error (javac); Chat manifest: MessagesWidget lang, walang MusicWidget. Hindi pa nasubukan sa totoong phone (widget, music).

## 2026-11-01 · #64 Music na nagpapalit ng kanta, Tigo na widgets, chat themes, bagong Settings, Tigo sa login
- **Ano:**
  - Music: tumutugtog na ang susunod na kanta (iisang AudioFocusRequest at listener; `userPause()` lang kapag pinindot ng user). Bagong music widget (plum na gradient, sumasayaw na 2D Tigo habang tumutugtog, natutulog kapag naka-pause, progress bar bawat 3 s) at bagong now-playing card sa app (`music-tigo.js`).
  - Messages widget (Chat app): parang lock screen — orasan at petsa, si Tigo (masaya kapag may bago, kalmado kapag wala), maliit na bubble ng pinakabagong unread na message ("pangalan · oras"), "N new"; refresh bawat 15 min (AlarmManager) at ↻.
  - Chat: Theme & wallpaper sa menu ng chat — 9 na theme at sariling photo na wallpaper, pareho sa lahat ng kasali sa chat (`conversations.theme`, `wallpaper_path`, sql/093; messages-fast v7: `theme`, `wallpaper`, upload kind `wallpaper`).
  - Settings: grouped na listahan na parang sa phone (Dark mode switch, Personalization, Alerts, Privacy & security, Account, About) at mga page sa loob (`#appearance`, `#language`, `#background`, `#privacy`, `#files`). Appearance: Theme, Theme color (6), Text size (4; sa APK WebView textZoom, sa website CSS zoom), UI style (Rounded/Soft/Crisp); preview muna → "N changes · Discard · Review" → Save (`ui-prefs.js`, `tokens.css`).
  - Login: magaan na 2D Tigo (kumakaway, kumukurap, sumisilip kapag nagta-type, natutuwa sa Create account) — walang 3D (`tigo-login.js`, `assets/img/tigo2d/`).
  - Update: wala nang "Install inside the app"; Chrome download lang.
  - Version 0.11.33.
- **Bakit:** Ayon kay Bench: "ung music sa una lang mg play pero pag lilipat nako ng song wala na", "widget or player natin… napaka plain", "mukha ni tigo tapos me time tapos gumagalaw ung tigo tapos jan mag appear ung message", "conversation ng ka chat ko… add wallpaper tapos mag babago samin dalawa, mag lagay kadin themes", Settings na parang iOS, at "There was a problem while parsing the package" sa in-app install. "Isang bagsakan lang… para di wasakwasak."
- **Files:** `apk/native/MusicEngine.java`, `apk/native/MusicService.java`, `apk/native/MessagesWidget.java`, `apk/native/res/layout/tmn_widget_music.xml`, `apk/native/res/layout/tmn_widget_msgs.xml`, `apk/native/res/xml/*_info.xml`, `apk/native/res/drawable/tmn_w_*`, `apk/native/res/drawable-nodpi/tmn_tigo_*.png`, `apk/patch-android.py` (setTextZoom), `tools/brand/tigo2d.py`, `tools/make-widget-art.py`, `assets/js/components/music-tigo.js`, `music-native.js`, `music-player.js`, `assets/css/music.css`, `assets/js/components/chat-theme.js`, `chat-view.js`, `assets/css/pages/messages.css`, `backend/messages-fast.ts`, `sql/093-chat-theme.sql`, `assets/js/ui-prefs.js`, `assets/css/tokens.css`, `app/settings.html`, `assets/js/pages/settings.js`, `assets/css/pages/settings.css`, `assets/js/components/tigo-login.js`, `assets/css/pages/auth.css`, `login.html`, `assets/js/app-update.js`, `icons.js`, `whatsnew.json`, `config.js` (0.11.33). Inalis: `drawable/tmn_widget_row.xml`, `drawable/tmn_badge_bg.xml`.
- **Paano:** test_settings 71/72 (ang 1 ay maling check sa desktop, walang tabbar doon), test_login_tigo 18/18, test_ctheme 21/21, test_messages 86/86, test_v31 14/14, test_v32 9/9, test_chatapp 7/7, test_fcm 9/9, test_look_music 18/18 — portrait, landscape at desktop. Java: walang syntax error (javac, main at chat). Hindi pa nasubukan sa totoong phone: widgets (ViewFlipper/TextClock), paglipat ng kanta, textZoom; theme/wallpaper sa live server.

## 2026-11-01 · #65 3D Tigo sa widgets, weather widget, liliit na widgets, ✕ sa music, bubbles, orasan, Tigo app full screen
- **Ano:**
  - Si Tigo sa Music widget, Messages widget at music notification ay 3D na (gawa mula sa mismong 3D model, `tools/make-widget-3d.py` → `drawable-nodpi/tmn_tigo_*`, `tmn_wx_*`).
  - Music notification: ✕ Close (hinto + alis ang notification; Android 13+ sa media controls rin), si Tigo bilang larawan (sumasayaw / natutulog), kulay plum, bagong icons.
  - Widgets puwedeng paliitin: Music 2×1 hanggang malaki (`tmn_widget_music_s` kapag maliit); Messages 3 laki (`tmn_widget_msgs`, `_m` isang hilera, `_s` makitid). Pinipili sa `onAppWidgetOptionsChanged`.
  - Messages widget: panahon (temperatura, kondisyon, lungsod, 💧 humidity, 🌬 hangin), kulay ng widget ayon sa panahon na may glossy na kintab, at si Tigo: araw = shades, gabi = tulog, ulap, lamig/hangin = bonnet + scarf (nanginginig), ulan = kapote + payong, kidlat = takot.
  - Chat → Theme & wallpaper → Bubbles: gaano kalinaw (See-through ↔ Solid) at ✨ Glossy, pareho sa lahat (sql/095, messages-fast `bubble`).
  - Settings → Appearance → UI style: bagong "Glossy" (may kintab ang mga box sa buong app).
  - Daily: orasan ng dalawang bansa ay napapalitan (pindot = pili, may search) at ⇄ = pagpalitin; naka-save sa device.
  - Tigo app: walang status bar (laging buong screen), ⛶ → ✕ Exit, 🚪/🛠 maliit na icon na lang sa loob ng bahay, mas mabagal maubos ang energy (2.5/oras, laro −5/−4, pagod sa <8).
  - Profile: may pagitan ang My music at Family & Safety; mahabang playlist = scroll sa loob ng card.
  - Version 0.11.34.
- **Bakit:** Ayon kay Bench: "Ung notif lagyan mo ng exit or x… lagyan mo din sana ng design", "ung widget pwede dapat na liliit ko din", "ung sa message… masyado plain tapos ang laki pa", "lagyan mo din kaya ng weather… sumasakay si tigo depende sa weather… dapat 3d sya", "temperature at ung humidity", "ung me Philippines at Bahrain dapat na eedit yan", "transparent ung bubble… glossy… same sa setting", "exit ung parang square pang full screen", "auto hide un notif sa taas", "go outside or decor gawin mo nalang logo", "energy… madaling maubos", "music naka dikit na sa sos… dapat me scroll".
- **Files:** `apk/native/MusicEngine.java`, `MusicService.java`, `MusicWidget.java`, `MessagesWidget.java`, `apk/native/res/layout/tmn_widget_music_s.xml`, `tmn_widget_msgs.xml`, `tmn_widget_msgs_m.xml`, `tmn_widget_msgs_s.xml`, `tmn_w_frame.xml`, `res/xml/*_info.xml`, `res/drawable/tmn_wbg_*.xml`, `tmn_ic_close.xml`, `res/drawable-nodpi/tmn_tigo_*.png`, `tmn_wx_*.png`, `apk/patch-android.py` (setImmersive, exitApp), `tools/widget3d/index.html`, `tools/make-widget-3d.py`, `tools/make-widget-art.py`, `assets/js/components/home-clock.js`, `assets/css/pages/daily.css`, `assets/js/components/chat-theme.js`, `assets/css/pages/messages.css`, `backend/messages-fast.ts`, `sql/095-chat-bubble.sql`, `assets/js/ui-prefs.js`, `assets/css/tokens.css`, `assets/css/components.css` (switch), `assets/css/pages/settings.css`, `assets/js/pages/tigo.js`, `assets/css/pages/tigo.css`, `backend/pet-fast.ts`, `assets/css/music.css`, `music-player.js`, `music-native.js`, `whatsnew.json`, `config.js` (0.11.34)
- **Paano:** test_v34 (orasan: pili/search/swap/save sa portrait, landscape, desktop; Glossy; Profile gap + scroll; Tigo app: immersive, ✕ Exit, maliit na pinto), test_bubble 48/48 (preview, live, save, galing sa server), at lahat ng luma: test_settings, test_login_tigo, test_ctheme, test_v31, test_v32, test_messages 86/86, test_chatapp, test_fcm, test_look_music. Java: walang syntax error (main, chat, tigo); lahat ng widget XML valid at pareho ang mga id sa bawat laki. Hindi pa nasubukan sa totoong phone: itsura ng widgets at pag-resize, panahon (IP location), ✕ sa notification, status bar sa Tigo app.

## 2026-11-01 · #66 Seasonal themes (Christmas, New Year, Halloween, Valentine's), see-through na box hanggang 100%, Sleep & breaks sa Daily
- **Ano:**
  - Seasonal themes sa Background (buong app) at sa chat (Theme & wallpaper, pareho sa lahat): 🎄 Christmas (niyebe), 🎆 New Year (paputok + confetti), 🎃 Halloween (paniki + multo), 💘 Valentine's (lumulutang na puso). Gumagalaw sa canvas (`season-fx.js`; humihinto kapag nakatago, isang larawan lang kapag "reduce motion"). May maikling kanta kapag pinili at ▶ "Play theme sound" (`season-sound.js`, Web Audio): Jingle Bells at Auld Lang Syne (public domain), sariling himig sa Halloween at Valentine's.
  - Background → "Box see-through" 0–100% (dati hanggang 70%): lahat ng box sa app (pati Settings, Daily, chips, inputs) — sa 100% text na lang at kita ang background; may anino ang text para mabasa. Policies: laging buo (walang look.css). Server: `panels` 0–100 (profile-fast).
  - Sleep & breaks: nasa Daily na (card sa ilalim ng orasan, `home.html#sleep`); sa Settings → "Privacy & supervision" may link papunta roon.
  - Inalis ang Sound Maker sa menu (nandoon pa ang page para sa lumang link).
  - Profile: All / Photos / Videos / Scheduled at Latest — bumababa sa susunod na linya, walang side scroll.
  - APK: walang kulay-abong "video player" (▶) na larawan pagbukas ng camera — transparent na poster sa mga video na autoplay (`app-mode.js`, `camera.js`).
  - Version 0.11.35.
- **Bakit:** Ayon kay Bench: "pag iopen ko ung video or camera me parang video player", "ung me photo vedio dapat di scroll… lagay sa baba", "ung pag set ng sleep at break lagay mo nalang sa daily", "transparent dapat hangang 100%… litaw na ung wall or themes… sa lahat… except ung mga policy", "tagalin muna ung sound maker", "mag add ka nalang ng themes, like Christmas, new yr, Halloween, at valentine's, tapos me tunog… special animation effects".
- **Files:** `assets/js/season-fx.js`, `assets/js/season-sound.js`, `assets/js/appearance.js`, `assets/js/components/appearance-settings.js`, `assets/css/look.css`, `backend/profile-fast.ts`, `assets/js/components/chat-theme.js`, `assets/css/pages/messages.css`, `backend/messages-fast.ts` (THEMES), `assets/js/components/wellbeing-settings.js`, `assets/js/pages/daily.js`, `app/home.html`, `app/settings.html`, `assets/js/pages/settings.js`, `assets/css/pages/settings.css`, `assets/js/nav-items.js`, `assets/css/pages/profile.css`, `assets/js/app-mode.js`, `assets/js/components/camera.js`, `app/*.html` (season-fx.js), `whatsnew.json`, `config.js` (0.11.35)
- **Paano:** test_v35 33/33 (4 seasonal sa Background: epekto + tunog, Box see-through 100% → Settings at Daily see-through, Sleep sa Daily, Privacy pane may link lang, walang Sound Maker, Profile chips walang side scroll, APK poster) sa portrait at landscape; test_season_chat (4 seasonal sa chat: epekto sa ibabaw ng messages, tunog, aalisin kapag ibang theme) sa phone, landscape, desktop; at lahat ng luma (pumapasa; ang ilang "FAIL" ay lumang bilang lang: 9→13 chat themes, 23→27 backgrounds). Hindi pa nasubukan sa totoong phone: tunog at galaw ng epekto sa APK, camera poster.

## 2026-11-01 · #67 See-through na menu (☰), top bar at tabs; tunog ng theme sa menu; lakas ng tunog
- **Ano:**
  - Ang hamburger menu (drawer), top bar at bottom tabs ay sumusunod na rin sa Background → "Box see-through" (laging may blur para mabasa; mas magaan ang dilim sa likod ng menu). Madilim na background + halos walang box: puti ang text ng menu at tabs.
  - Kapag seasonal ang Background: may maikling tunog kapag binuksan ang ☰ at kapag pumindot sa loob ng menu (pati sidebar sa desktop). Ang link ay naghihintay ng 0.22 s para marinig ang tunog bago lumipat. Christmas = kampanilya, New Year = paputok, Halloween = nakakatakot na "woo", Valentine's = chime.
  - Settings → Background → 🔊 "Theme sound" 0–100% (0 = walang tunog), naka-save sa device (`tmnFxVol`); may maikling tunog habang inaayos.
  - Kasama na ang `season-sound.js` sa lahat ng page.
  - Version 0.11.36.
- **Bakit:** Ayon kay Bench: "ung humbuger diba na transparent?" → "Sige gawin mo na yan, ung themes sound pag ng click ako ng humburger at pag ng click ako ng nasa loob nya dun tutunog… lagyan mo din ng adjustment ng sounds".
- **Files:** `assets/css/look.css`, `assets/js/season-sound.js`, `assets/js/components/appearance-settings.js`, `app/*.html` (season-sound.js), `whatsnew.json`, `config.js` (0.11.36)
- **Paano:** test_v36 17/17 (lakas: save at preview; drawer/top bar/tabs see-through; ☰ = "open", link = "pick" tapos lipat ng page; 0% = tahimik; walang seasonal = walang tunog) sa portrait at landscape; test_v35 33/33 at ang iba pang luma. Hindi pa nasubukan sa totoong phone ang tunog.

## 2026-11-02 · #68 Phone = storage, walang video upload, multi-select, Gallery: upload box, folder sa loob ng card, rename
- **Ano:**
  - Walang video sa server: posts at status ay photo lang (posts-fast, social-fast: 415 `noVideo`). Ang video ay nire-record at nase-save sa phone lang. Composer: inaalis ang video at may toast; Status/Create/Share: photo lang; Profile: wala nang "Videos" chip. Ang lumang video post ay nananatili.
  - Phone ang storage (APK): bawat kuha sa camera ng app → Pictures/TigoMeNote (o Movies/TigoMeNote) sa gallery ng phone (`TmnNative.saveToPhone`, `phone-storage.js`, `camera.js`). Daily notes at moods → auto-backup sa Documents/TigoMeNote/daily-<user>.json 4 s pagkatapos ng pagbabago (`TmnNative.backupWrite`); Settings → Files on this device → "Back up now" at "Restore" (pili ng file). Manifest: `hasFragileUserData` ("Keep app data" sa pag-uninstall, kung sinusuportahan ng phone).
  - Multi-select sa pag-post (APK): sariling picker (`phone-picker.js`) — folder sa itaas, pindot = pili na may numero, hanggang 10, "Next" → composer. Gamit sa Share → From gallery at Explore → Create → Post. Native: `galleryItems({ photosOnly })`.
  - Gallery: "Uploading" box sa itaas (dating "Waiting on this device" sa Profile; `upload-queue.js`, lumalabas lang kapag may laman). Phone gallery: ▾/▸ itago/ipakita (naaalala), mga 5 folder ang kita na may scroll sa loob, ang folder ay bumubukas SA LOOB ng card sa phone (hindi na bumababa ang page), ✎ palitan ang pangalan sa TigoMeNote lang (hindi ang totoong folder), "Set as folder cover" sa press-and-hold (`tmnPhoneAlias`).
  - Version 0.11.37.
- **Bakit:** Ayon kay Bench: "ung na sa profile na waiting on device… duon mo nalang din sa gallery", "sobra haba ng na sync, lagyan mo scroll… arrow… toggle hide", "edit nalang natin folder name… folder image", "ang phone ang baleng storage… kung mag uninstall… iwan ung data… ung mga na capture image nya is phone storage", "walang video upload… para di mapuno server", "pag click ng folder duon nalang sya bubukas hindi na bababa", "multi select pag ng post".
- **Files:** `apk/native/TmnNative.java` (saveToPhone, backupWrite, photosOnly), `apk/patch-android.py` (hasFragileUserData), `assets/js/phone-storage.js`, `assets/js/components/phone-picker.js`, `assets/js/components/upload-queue.js`, `assets/js/pages/gallery-phone.js`, `assets/css/pages/gallery.css`, `assets/css/components.css`, `assets/css/posts.css`, `app/gallery.html`, `app/profile.html`, `assets/js/pages/profile.js`, `assets/js/components/camera.js`, `assets/js/daily-store.js` (backup/restore), `assets/js/components/files-settings.js`, `app/settings.html`, `assets/js/components/post-composer.js`, `assets/js/components/stories.js`, `assets/js/components/create-menu.js`, `assets/js/pages/share.js`, `app/share.html`, `backend/posts-fast.ts`, `backend/social-fast.ts`, `app/*.html` (phone-storage.js, phone-picker.js), `whatsnew.json`, `config.js` (0.11.37)
- **Paano:** test_v37 36/36 sa portrait at landscape (upload box, folder list scroll, ▾/▸ na naaalala, folder sa loob ng card at walang talon ng page, rename, cover, picker 3 litrato na may numero → composer, composer walang video, save to phone, Daily auto-backup, Restore, Profile walang upload box) + test_v36, test_v35, test_messages 86/86 at iba pa. Java: walang syntax error; manifest may hasFragileUserData. Hindi pa nasubukan sa totoong phone: pag-save sa Pictures/TigoMeNote, backup file sa Documents, picker sa maraming litrato.

## 2026-11-02 · #69 School & work, widget see-through, How to use, Delete account, Google Play build, security lockdown
- **Ano:**
  - **School & work** sa Daily (`components/schedule.js`, `#schedule`): 📚 Class / 💼 Work, pangalan, lugar, mga araw (may Weekdays, Mon·Wed·Fri, Tue·Thu), simula–tapos, "Remind me" 0–120 min bago. Tabs bawat araw, "Now" sa nangyayari ngayon. Server: `daily-fast` kind class/work, repeat "days", `sched` (days, start, end, lead, tz) → susunod na oras sa timezone ng user; push "📚 Math 101 in 15 min". `sql/101`. Hindi na kasama sa Reminders card.
  - **Widgets:** Settings → Appearance → "Home screen widgets": Solid / Glass / Clear + slider 0–100% (APK lang), may preview. Agad na nag-a-update ang Music at Messages widget. May anino ang puting text para mabasa kapag see-through.
  - **Sleep & breaks:** hindi na naiipit ang text; bumababa ang controls sa ilalim kapag makitid.
  - **How to use** (`app/guide.html`): Daily, School & work, Gallery, Share, Explore, Safety & SOS, Messages, Tigo, Profile, Settings — may screenshot ang bawat isa. Nasa menu at sa Settings → About. Sa Chat app: Messages, Profile, Settings lang.
  - **Delete account:** Settings → Delete account (password + DELETE) at web page `legal/delete-account.html`; `auth-fast` action `deleteAccount`.
  - **Security:** sql/100 — tinanggal ang lahat ng access ng anon/authenticated (tables, sequences, functions).
  - **Google Play:** `play.yml` (manual) → AAB na walang self-update; per-app permissions; targetSdk ≥ 36 check. Store graphics, video at listing text (3 apps) ginawa sa labas ng repo.
  - Tigo: tama na ang font habang naglalaro. Version 0.11.38.
- **Bakit:** Ayon kay Bench: "isabay… choice or edit ng widget to transparent", "ayusin modin sleep time… mag add kadin ng school and work schedule reminders… tapusin muna din lahat", "small video ng feature… guide line… sa playstore", "ok ba ung security… SOS".
- **Files:** `assets/js/components/schedule.js`, `assets/js/components/reminders.js`, `assets/css/pages/daily.css`, `app/home.html`, `backend/daily-fast.ts`, `sql/101-school-work-schedule.sql`, `assets/js/components/widget-look.js`, `assets/css/pages/settings.css`, `app/settings.html`, `apk/native/MessagesWidget.java`, `apk/native/MusicEngine.java`, `apk/native/res/layout/tmn_widget_*.xml`, `apk/patch-android.py` (setLook, PERMS, walang Update), `apk/build-web.py` (TMN_PLAY), `.github/workflows/play.yml`, `assets/css/safety.css`, `assets/js/components/wellbeing-settings.js`, `app/guide.html`, `assets/js/pages/guide.js`, `assets/css/pages/guide.css`, `assets/img/guide/*.webp`, `assets/js/nav-items.js`, `assets/js/pages/settings.js`, `assets/js/pages/login.js`, `legal/delete-account.html`, `backend/auth-fast.ts`, `sql/100-lockdown-public-roles.sql`, `assets/js/pages/tigo.js`, `assets/css/pages/tigo.css`, `whatsnew.json`, `config.js` (0.11.38)
- **Paano:** test_sched 22/22, test_wlook 13/13, test_sleep 6/6, test_guide 19/19, test_del 16/16 sa portrait at landscape; test_v37 36/36, test_v36 17/17, test_v35 33/33, test_messages 86/86. nextSlot sinubukan sa Asia/Bahrain at America/New_York (DST). Java: walang syntax error sa 3 apps. Hindi pa nasubukan sa totoong phone: widget see-through, push ng class/work, AAB build sa Play Console.

## 2026-11-02 · #70 Beta monitor (Admin), Report a bug, app health logs, unang Google Play AAB
- **Ano:**
  - **Beta monitor** (`app/admin/beta.html`, Admin lang; nasa menu "Beta monitor"): buod (testers ngayon/7 araw, ilan na ang 14+ araw para sa Google Play closed test, crashes/errors/slow sa 24 oras at 7 araw, open bugs, content reports na may link sa Reports, mga version na gamit). Tabs: Testers (sino, aling app at version, phone, ilang araw na ginagamit /14, ilang beses binuksan, mga problema sa 7 araw), Bugs (may screenshot), Crashes, Errors, Slow. Bawat problema: ilang beses (×N), una/huling oras, page, phone, user, Details; Mark fixed / Reopen / Copy / Delete; filter ng app, status at search.
  - **app-health.js** sa bawat page: JS error, promise na walang catch, server error 500+, tawag sa server > 4 s, page > 6 s → `crash-fast` action `log` (hanggang 15 bawat page, sabay-sabay bawat 10 s). Isang "hello" bawat bukas ng app (naka-sign in) → bilang ng araw ng tester.
  - **Report a bug:** Settings → Report a bug (`components/bug-report.js`): ano ang nangyari, screenshot (pinaliit, ≤ 400 KB), technical info (version, phone, huling errors at pages). 10 bawat araw.
  - `crash-fast` = app health na (report, log, hello, bug; Admin: stats, list, testers, resolve, remove). Parehong problema = iisang row na dumadami ang hits (7 araw). Binubura ang lampas 30 araw. `sql/103` (app_logs, app_testers; inilipat ang lumang app_crashes).
  - Privacy policy: "App health" sa What we collect.
  - Google Play: unang takbo ng "Build for Google Play" — pumasa ang 3 AAB (main, chat, tigo 0.11.38) sa Artifacts.
  - Version 0.11.39.
- **Bakit:** Ayon kay Bench: "kelangan natin ng isang page sa admin site na meron ng momonitor ng mga beta tester, una ung bug, error ng pag bagal logs, at report, tapos u push muna ung aab".
- **Files:** `app/admin/beta.html`, `assets/js/pages/admin-beta.js`, `assets/css/pages/admin-beta.css`, `assets/js/app-health.js`, `assets/js/components/bug-report.js`, `backend/crash-fast.ts`, `sql/103-beta-monitor.sql`, `app/*.html` + `login.html` + `app/admin/reports.html` (app-health.js), `app/settings.html`, `assets/js/pages/settings.js`, `assets/js/nav-items.js`, `assets/js/app-mode.js` (device sa crash), `app/guide.html`, `legal/privacy.html`, `whatsnew.json`, `config.js` (0.11.39)
- **Paano:** test_beta 35/35 sa 360 at 1024 (stats, testers, 4 tabs, screenshot, mark fixed, filter, JS error + server 500 na naipadala, hello isang beses bawat session, bug report na may detail, hindi-admin = "Admins only") + test_del, test_wlook, test_guide, test_sched, test_sleep, test_v37. Hindi pa nasubukan sa totoong phone.

## 2026-11-10 · #71 Lights Out (3D game, online duo, ranking), Smart calendar, Weather details, app reload fix
- **Ano:**
  - **App reload fix:** Sa phone ni Bench (nubia NX659J), 85 "WebView stopped (memory)" sa 8 araw — `didCrash=false`, may 1.6 GB pang memory: ang phone ang nagsasara sa app habang nasa background, at nire-reload agad ng app ang sarili (2–4 beses). Ngayon: kapag nasa background, hindi na nagre-reload; sa pagbalik lang (onResume), at sa parehong page (`tmn_url`). Report `kind=bgkill` → Beta monitor "🌙 Closed by the phone in the background (not a crash)" (kind `bg`, sql/105), hindi bilang crash. Ang "open" ng tester ay isa lang bawat 30 min.
  - **Smart calendar** (pindot ang petsa sa Daily, o Calendar): makulay na buwan; tuldok bawat uri (📚 klase, 💼 trabaho, 🔔 paalala, 📝 notes) + mood; pindot = events ng araw (oras, pangalan, lugar), pindot ulit / "Open this day" = buksan; "+ Add" = paalala; "Upcoming reminder" sa ibaba. Kasama ang umuulit na paalala (daily/weekly/monthly).
  - **Weather details** (pindot ang Weather card): malaking card (kulay ayon sa panahon at gabi), Humidity, Wind (direksyon), Pressure, UV, Sunrise/Sunset, 24 na oras, 7 araw na may bar ng init (Open-Meteo, cache 30 min).
  - **Lights Out** 👻 (Tigo → Games, bago): madilim na paaralan; kunin ang 🔑 (solo 3, duo 4) at pumunta sa EXIT bago mahuli ng "the Hush" (sariling multo: maskarang porselana at balabal na usok; hindi si Sadako o ibang character). 🚪 Hide sa locker (8 s), 🔦 Flash ×3 (stun 2.5 s), 5 minuto. Solo: 2 buhay. **Duo online:** Create a room (5-letter code) / Join a room; Supabase Realtime broadcast; host ang may hawak ng multo at susi; nahuli = babagsak, buhayin ng kasama (2 s). **Ranking:** solo at duo, ngayong linggo / lahat; pinakamabilis na pagtakas (`games-fast`, `game_runs`, sql/106). Coins at XP sa pet-fast (`ghost`).
  - Version 0.11.40.
- **Bakit:** Ayon kay Bench: "Check tayo ng system" → "Gawin mo na maayus, at walang mistake", "sa daily natin gantong date at weather pag click", "add tayo ng isang games sadako 3d… pwede dual, tapos merron rangking". Sa tanong: Escape the ghost, Online duo, sa Tigo app. Si Sadako ay character ng iba (The Ring) kaya sariling multo ang ginawa.
- **Files:** `apk/patch-android.py` (onPause/onResume, reopenAt, bgkill), `backend/crash-fast.ts`, `sql/105-app-logs-bg.sql`, `assets/js/pages/admin-beta.js`, `assets/css/pages/admin-beta.css`, `assets/js/app-health.js`, `assets/js/components/mini-calendar.js`, `assets/js/pages/daily.js`, `assets/js/components/weather.js`, `assets/js/components/weather-detail.js`, `assets/css/pages/daily.css`, `app/home.html`, `assets/js/tigo/ghost-game.js`, `assets/js/tigo/games-ui.js`, `assets/js/pages/tigo.js`, `assets/css/pages/tigo.css`, `app/tigo.html` (realtime.js), `backend/games-fast.ts`, `sql/106-game-runs.sql`, `backend/pet-fast.ts` (ghost), `assets/js/config.js` (games, 0.11.40), `app/guide.html`, `legal/privacy.html`, `whatsnew.json`
- **Paano:** test_ghost 44/44 (menu, ranking solo/duo, solo sa portrait at landscape: HUD, galaw, flash, hide sa locker, 3 susi, takas, ranking submit, coins, ilaw bumalik; duo sa dalawang browser: code, join, start, 4 susi, sync ng puwesto at susi, nahuli → binuhay, takas, pareho nag-submit na may partner), test_calwx 24/24, test_beta, test_sched, test_del, test_wlook, test_guide, test_sleep, test_games, test_tigo, test_v32, test_v35–37, test_messages; Java walang syntax error sa 3 apps. Hindi pa nasubukan sa totoong phone: duo sa dalawang phone (Realtime), ang bilis ng laro sa phone, at ang bagong pagbalik pagkatapos isara ng phone.

## 2026-11-10 · #72 Sky Dash, Gloom Siege, Sudoku — hanggang 4 na player bawat room, ranking ng bawat laro
- **Ano:**
  - **Room lobby** (`tigo/room-lobby.js`, iisa para sa 3 laro): Solo · Create a room (5 titik na code, hanggang 4, makikita ang listahan ng kasali, ang host ang nag-i-Start) · Join a room · Ranking. Hindi makakagawa/makakasali sa room kapag pagod o tulog si Tigo (para hindi maiwan ang kaibigan); pareho na rin sa Lights Out.
  - **Sky Dash** 🏃 (`dash-game.js`): 3D na track sa langit, 3 lane, palit ng lane (stick/swipe/A-D), talon (button/Space/swipe pataas); 🪙 coins, ⚡ boost pad, 🟥 kahon (iwasan), 🚧 harang (talunin); **slipstream** = sumunod sa likod ng kalaban sa parehong lane → mas mabilis (may pulang guhit). Solo laban sa 3 bot; multi 2–4 (bawat isa ay nagpapadala ng sariling puwesto; pare-pareho ang track dahil sa seed). Puwesto 1st–4th, oras.
  - **Gloom Siege** 💦 (`siege-game.js`): cartoon na Gloomies (walang dugo) na papalapit sa isla; kusang bumabaril ng bula si Tigo; 💦 Splash (7 s), ❤️ na puso; alon-alon na lumalakas. Co-op 2–4: host ang may hawak ng Gloomies at buhay; bumagsak = buhayin ng kasama (2 s); puntos ng team.
  - **Sudoku** 🧩 (`sudoku-game.js`): sariling generator (seed, laging iisang sagot): Easy 41 / Medium 32 / Hard 26 na bigay; ✏️ notes, ⌫, 💡 hint (solo, 3, +30 s), 3 mali = tapos. Versus 2–4: parehong puzzle, makikita ang progress ng iba, ang unang makatapos ang panalo.
  - **Ranking:** `games-fast` para sa ghost, dash (oras), siege (puntos), sudoku (oras bawat level); `sql/108`. Coins/XP sa pet-fast (dash, siege, sudoku).
  - Version 0.11.41.
- **Bakit:** Ayon kay Bench: "Ito pa add tayo ganto laro, na pwede multiple player" (larawan: Sudoku, zombie shooter, Sonic PvP race). Sa tanong: lahat ng tatlo, hanggang 4. Hindi si Sonic/Shadow (sa Sega) at walang madugong zombie — si Tigo at cartoon na Gloomies.
- **Files:** `assets/js/tigo/room-lobby.js`, `assets/js/tigo/dash-game.js`, `assets/js/tigo/siege-game.js`, `assets/js/tigo/sudoku-game.js`, `assets/js/tigo/games-ui.js`, `assets/js/pages/tigo.js`, `assets/css/pages/tigo.css`, `backend/games-fast.ts`, `backend/pet-fast.ts`, `sql/108-game-runs-more.sql`, `app/guide.html`, `whatsnew.json`, `config.js` (0.11.41)
- **Paano:** test_multi 65/65 — solo ng 3 laro sa portrait at landscape (Dash: 4 runner, lane, takbo, tapos, resulta; Siege: alon, kusang bumaril, splash, tapos, puntos; Sudoku: 81 kahon, kasya sa screen, mali, notes, nalutas, resulta, ranking ng level, balik sa menu), pagod na Tigo = hindi makagawa ng room; multi na 3 player sa 3 browser (Dash: room 3/4, lahat tumakbo, puwesto naka-sync, lahat natapos; Siege: Gloomies sa lahat, kills ng team, guest bumagsak at binuhay ng host, tapos sa lahat; Sudoku Hard: parehong puzzle, progress ng iba, lahat tapos). test_ghost 44/44, test_games, test_tigo. Hindi pa nasubukan sa totoong phone: multiplayer sa tunay na internet (Realtime) at ang bilis sa mahinang phone.

## 2026-11-10 · #73 Exchange rate sa Daily, mas malaking isla ni Tigo (bahay, bakod, taniman, lawa, ilaw), hindi na bumababa ang mga bar, My status sa Profile, folder ng kanta
- **Ano:**
  - **Daily → Exchange rate** 💱 (`components/exchange-rate.js`, `<section id="fx">`): unang bukas = pera ng bansa mo (lugar ng Weather → timezone → wika ng phone; hal. Bahrain = BHD) papuntang USD; puwedeng palitan ang dalawang pera, ⇄ baligtad, halaga, at 4 na ibang pera (pindutin para gawing "To"). Rates: open.er-api.com (libre, walang key), reserba currency-api sa jsDelivr; cache 3 oras, gumagana offline gamit ang huli. Walang dumadaan sa server natin.
  - **Tigo — isla:** `backdrops.js` RADIUS 2.9 → 4.0 (lupa 4.6). Bahay kubo ×1.25 na may balkonahe at rehas, 4 na bintana na may paso ng bulaklak, dalawang patong na bubong, parol, makukulay na ilaw sa bubong. Isla: bakod sa gilid (bukas sa harap), daanang bato, lawa (lily, tambo, bato), taniman (2 kama, pandilig), dagdag na puno at halaman. **Gabi:** bumubukas ang bintana, parol, 2 poste ng ilaw at ilaw sa bubong, may malabong liwanag sa lupa (walang tunay na PointLight; ang bulaklak, bakod at bato ay InstancedMesh para magaan sa phone). Iniikutan ni Tigo ang lawa/taniman/poste (`obstacles`). Lumaki rin ang lupa ng ibang lugar (beach, coral, snow, clouds, desert, moon).
  - **Tigo — mga bar:** `pet-fast` RATE = 0 (gutom, saya, linis, energy ay hindi na bumababa nang kusa; tulog = bumabalik pa rin ang energy). Wala nang bawas sa energy/gutom kapag naglaro o nag-Play, wala nang bawas sa linis kapag kumain; tinanggal ang "too tired to play". `sql/110`: itinaas sa 85 ang mga bar na bumaba na dati.
  - **Profile → My status** (`stories.js` `mountMine`): mga status mo sa Explore na buhay pa (24 oras), may 👁 nanood, ❤️ at natitirang oras; pindutin = viewer (sarili lang), + Add. Ang bilang na **Posts** sa taas ay pindutan na papunta sa grid ng posts (nasa ilalim ng My music at Family & Safety). Ang tab na Reposts ay dati nang meron (nasubukan ulit).
  - **My music → folder:** APK: "Add songs" → *Pick songs* o *Pick a folder* (`TmnNative.musicPickFolder`, ACTION_OPEN_DOCUMENT_TREE; lahat ng kanta sa loob at sa mga folder sa loob, hanggang 3 lalim / 300 kanta; nilalaktawan ang nandoon na). Website: "Add a folder" (`webkitdirectory`).
  - Version 0.11.42.
- **Bakit:** Ayon kay Bench: "sa profile pag mag play ng sound pwede na piliin ung folder sa system ng phone, tapos ung na post mo sa explore ipapakita na sa profile, … sa daily mag add ka ng exchange rate sample BHD to dollar … depende sa bansa, tapos ung tigo main natin time na update nanatin ung field nya ung bahay, ung life spand nya hindi na nababawasan". Sa tanong: Status + reposts + hanapin kung bakit hindi lumalabas ang post; hindi na bababa ang bars; mas malaki at mas maganda ang isla.
- **Files:** `assets/js/components/exchange-rate.js`, `app/home.html`, `assets/css/pages/daily.css`, `assets/js/tigo/backdrops.js`, `assets/js/tigo/pet-scene.js`, `assets/js/tigo/coin-game.js`, `assets/js/pages/tigo.js`, `backend/pet-fast.ts`, `sql/110-pets-no-decay.sql`, `assets/js/components/stories.js`, `app/profile.html`, `assets/js/pages/profile.js`, `assets/css/social.css`, `apk/native/TmnNative.java`, `assets/js/components/music-native.js`, `assets/js/components/music-player.js`, `assets/css/music.css`, `app/guide.html`, `whatsnew.json`, `config.js` (0.11.42)
- **Paano:** test_v42 (360×740, 740×360, 1280×800): My status (3 tile, nanood, oras, viewer sa tamang status, sarili lang), 7 posts sa grid, Posts → scroll, Reposts tab, folder button, walang lampas; Exchange rate (BHD → USD mula sa bansa, 1 BHD = 2.6596, halaga 100, chip → PHP, swap, tanda ang pinili, cache, reserbang source, offline). Screenshot ng isla: araw, wide, top, gabi (portrait at landscape). test_tigo. Java syntax ng 3 app. Hindi pa nasubukan sa totoong phone: pagpili ng folder (Android), tunay na rates (hindi abot ng sandbox ang API), at bilis ng mas malaking isla sa mahinang phone.

## 2026-11-11 · #74 Avatar na Kid, Friends playing + Join, Gloom Siege na third-person (ikot ng view, power-ups, ibang lugar bawat alon), swipe sa Sky Dash, Grand tour, mas malawak na isla, mas maliliit na button
- **Ano:**
  - **Avatar 🧒** (`tigo/human-model.js`, `tigo/avatar-ui.js`): puwedeng pumili ng **Kid** (parang tao: ulo, katawan, braso, binti) kapalit ng note na Tigo. 8 ready-made looks (Explorer, Sunny, Pastel, Sporty, Cozy, Night, Garden, Ocean); 6 na balat, 8 buhok × 9 kulay, 6 pang-itaas, 3 pang-ibaba, 13 kulay ng damit at sapatos. Live preview habang pumipili; Save = `pet-fast` `avatar` (`pets.avatar` jsonb, `sql/112`); isara nang hindi nag-save = balik sa dati. `createTigo()` (pet-model.js) ay iisang "balat" na may `setAvatar()` kaya gumagana sa lahat (isla, bahay, lahat ng laro, kaibigang malapit, multiplayer — kasama ang `av` sa roster). Naisusuot din ng Kid ang sumbrero, salamin at hawak sa Closet. Libre lahat.
  - **Friends playing** (`games-fast` `here` / `friends`, table `game_rooms`, `sql/112`): tibok bawat 40 s habang bukas ang Tigo; sa Games makikita ang mga FINA-FOLLOW mo na nasa Tigo ngayon (huling 90 s). May bukas na room = **Join** (diretso sa lobby ng larong iyon gamit ang code). Mga follower mo lang ang nakakakita.
  - **Gloom Siege:** camera sa LIKOD ni Tigo; hila sa screen = ikot/tingala, pinch o wheel = lapit-layo; lakad ayon sa camera; dilaw na bilog sa tina-target. Mas malaking isla (4.6 → 7.5). **Mga napupulot:** ❤️ +25 · ⚡ Rapid · 🔱 Triple · 💥 Big · 🛡️ Shield · ❄️ Freeze (host ang may hawak sa co-op). **Ibang lugar bawat alon:** Meadow → Beach → Snow → Dusk → Ember (lupa, langit, palamuti). Ang "Wave N" ay lumalabas tapos kusang nawawala (dati: malaking "Wave 11 in 1" na paulit-ulit); ang hintay ay maliit na ⏳ sa HUD.
  - **Sky Dash:** swipe sa screen — kaliwa/kanan = lane, pataas = talon (`tigo/touch-look.js`, gamit din ng Siege).
  - **Lights Out:** wala nang malaking mensahe habang nagtatago; maliit na "🚪 5" sa HUD.
  - **Racing:** bagong mahabang track **Grand tour** 🏁 (2 ikot, 7 boost pad, mas maraming coins).
  - **Bahay:** bagong istilo — dalawang palapag (kapalit ng bahay kubo): bubong na tatsulok, tsimenea, balkonahe sa harap na may rehas, veranda sa itaas, pintong may salamin, mga bintanang may paso; bumubukas ang ilaw kapag gabi (`backdrops.js` `kubo()`). Hindi nagbago ang loob (kwarto).
  - **Si Tigo (note) ay nandiyan pa rin at siya pa rin ang default** — dagdag lang ang Kid; sa Avatar: 📝 Tigo o 🧒 Kid, puwedeng magpalit anumang oras.
  - **Isla:** RADIUS 4.0 → 5.4 (lupa 6.1); upuan sa tabi ng lawa, karatula, dagdag na puno; mas mahabang daan at bakod.
  - **Mas maliliit na button:** hilera sa taas (46 → 40), Dance/Stop/Run/Jump at joystick, Splash/Hide/Flash/Brake/Turbo (64 → 54), listahan ng Games at menu ng bawat laro.
  - Privacy Policy: avatar, "nasa Tigo ngayon / may bukas na room" (mga follower lang), at ang exchange-rate API; Third-party: ExchangeRate-API (may attribution sa card). Version 0.11.43 (0.11.44 = ang bagong bahay).
- **Bakit:** Ayon kay Bench (may larawan ng Gloom Siege at mga halimbawa): "sa wave dapat lalabas ung wave pero mawawala din mag fade tapos touchable ung screen para na rotate … iba iba item para ung skill nya ng babago, tapos ng iiba ung view kada wave, tapos ung run dapat touchscreen din … sa isang laro na me multo ung pinto dapat nawawala ung Message bale me maliit na counting nalang … dapat me gantong avatar si tigo, pwede na sya mag palit palit, tapos … fallower na ng lalaro, ung bahay, sa labas kahit palawakin mo pa … race mahabang Field, … sa main menu mejo paliitin mo ung buttons". Sa tanong: bagong avatar na parang tao · listahan + Join · camera sa likod ni Tigo · lahat ng tatlong grupo ng button. Sariling disenyo ang Kid (hindi kinopya ang Roblox).
- **Files:** `assets/js/tigo/human-model.js`, `assets/js/tigo/avatar-ui.js`, `assets/js/tigo/touch-look.js`, `assets/js/tigo/pet-model.js`, `assets/js/tigo/siege-game.js`, `assets/js/tigo/dash-game.js`, `assets/js/tigo/ghost-game.js`, `assets/js/tigo/race-game.js`, `assets/js/tigo/games-ui.js`, `assets/js/tigo/room-lobby.js`, `assets/js/tigo/backdrops.js`, `assets/js/tigo/pet-scene.js`, `assets/js/pages/tigo.js`, `app/tigo.html`, `assets/css/pages/tigo.css`, `backend/pet-fast.ts`, `backend/games-fast.ts`, `sql/112-avatar-game-rooms.sql`, `legal/privacy.html`, `legal/third-party.html`, `assets/js/components/exchange-rate.js`, `app/guide.html`, `whatsnew.json`, `config.js` (0.11.43)
- **Paano:** test_v43 70/70 (390×844 at 844×390): laki ng mga button, walang patong at walang lampas; Avatar (preview Kid, preset, buhok, kulay, Save, lakad, reload, isara nang hindi nag-save); Friends playing (listahan, Join → sumali sa tamang room kasama ang avatar, tibok); Siege (banner na nawawala, pangalan ng lugar, hila = ikot/tingala, kusang baril, ⚡ Rapid, 🛡️ Shield, Wave 2 = Beach); Dash (swipe lane at talon); Lights Out (maliit na bilang, walang malaking mensahe); Racing (4 track, Grand tour 1/2). Pati test_multi, test_ghost, test_tigo, test_games, test_v42. Hindi pa nasubukan sa totoong phone: pakiramdam ng hila/swipe sa tunay na daliri, multiplayer na may Kid sa tunay na internet, at Friends playing sa dalawang totoong account.

## 2026-11-11 · #75 Sa isla: upo, pangingisda, taniman, bunga ng puno · Tigo 3D stickers na may boses · Racing na buggy (4 mapa, ❓ kahon) · Lights Out na may antas at camera · mga ayos sa Kid, bars at Decorate
- **Ano:**
  - **Sa labas (isla)** — lumalapit si Tigo sa bagay → may pindutan sa ibaba (`#tgCtx`): 🪑 **Sit** (upuan sa tabi ng lawa), 🎣 **Fish** (uupo sa upuan, may pamingwit at palutang; "‼️ Pull!" sa loob ng 1.5 s), 🌱 **Garden** (10 taniman; Seed store: carrot, tomato, corn, strawberry, pumpkin — presyo, tagal, kita; Harvest all), 🍎 **Pick fruit** (7 puno, namumunga bawat 4 oras, 🪙 8). Server: `pet-fast` `farm` { do: plant | harvest | pick | fish }, `pets.farm` (`sql/114`); oras at coins ay sa server (huli ng isda: 12 s pagitan, 40 bawat araw). 3D: `backdrops.js` (`spots`, `setFarm`, mga tanim ayon sa yugto, bunga sa puno), `pet-scene.js` (`spot()`, `sitBench()`, `fish()`, `bite()`), `tigo/farm-ui.js`.
  - **Tigo 3D stickers** (`stickers.js` `list3d`, 12 piraso): may lalim (gradient, gilid, kintab, anino) at gumagalaw (CSS sa `components.css`); nagsasalita si Tigo kapag ipinadala o pinindot (`TMN_STICKERS.play` → `tigo/voice.js`). Nasa itaas ng mga dating sticker sa picker.
  - **Tigo Racing:** mas malapad na daan (×1.5) at mas maluwag na track (×1.4); **buggy** (malalaking gulong, roll cage, bumper, ilaw); **nakaupo** ang sakay (dati mukhang nakatayo ang Kid); 4 na **mapa** na iba-iba ang itsura (Sunny meadow, Pine forest, Desert canyon, Snow tour); ❓ kahon: 🚀 Rocket · 🛡️ Shield · 🧲 Magnet · 🔥 Turbo ready.
  - **Lights Out:** antas **Easy** (isang palapag, 3 susi, 5 min) · **Medium** (buong bahay, 5 susi, 7 min) · **Hard** (malaking bahay, 7 susi, 9 min, mas mabilis ang Hush) — `genMap()`; sa duo, ang host ang pumipili. 🎥 **camera** Top ↔ Close (sa likod, naiikot sa paghila). Ranking bawat antas (`games-fast`, `sql/114`). **Bug:** nahuli habang nakatago → hindi na lumilitaw si Tigo pagbalik — ayos na.
  - **Sky Dash:** swipe lang — wala nang joystick at jump button sa screen.
  - **Mga bar** ay katabi na ng pangalan (malapad na screen; sa makitid ay nasa ilalim). **Bumababa ulit** nang dahan-dahan ang gutom (3/oras), saya (2) at linis (2); ang energy ay hindi; walang bawas sa laro.
  - **Kid:** tunay na upo (`sitPose`, pasulong ang binti) sa upuan, sofa at buggy; ulo sa unan kapag natutulog (ayon sa laki); headphones na kasya sa ulo (banda, tasa, unan), mas malaki ang sumbrero at hawak.
  - **Decorate / Closet:** ang Buy bar ay nasa ITAAS ng listahan (dati sa pinakababa), naka-highlight ang pinili; may palaso sa itaas ng napiling gamit sa kwarto.
  - Version 0.11.45.
- **Bakit:** Ayon kay Bench (11 punto, may mga screenshot): nakatayo ang sakay sa karera / laparan ang daan / mapa / boost na parang buggy; wala sa unan ang tulog; hindi tuwid ang upo; pagbili ay dapat doon na; mahirap makita ang dekorasyon; bug sa pagtago + pagpili ng camera + buong bahay na easy/medium/hard; tanggalin ang key sa run; bars katapat ng pangalan pero nababawasan ang pagkain, paligo at laro; mas 3D ang suot (headphones); sa labas ay umupo, mamingwit, magtanim (seeds sa store), mag-ani kapalit ng coins, bunga ng puno; bagong 3D emoticon sa message na gumagalaw at may boses ni Tigo.
- **Files:** `assets/js/tigo/farm-ui.js`, `assets/js/tigo/backdrops.js`, `assets/js/tigo/pet-scene.js`, `assets/js/tigo/human-model.js`, `assets/js/tigo/pet-model.js`, `assets/js/tigo/race-game.js`, `assets/js/tigo/ghost-game.js`, `assets/js/tigo/games-ui.js`, `assets/js/tigo/room.js`, `assets/js/tigo/room-ui.js`, `assets/js/tigo/closet-ui.js`, `assets/js/pages/tigo.js`, `app/tigo.html`, `assets/css/pages/tigo.css`, `assets/js/stickers.js`, `assets/js/components/emoji-picker.js`, `assets/js/components/chat-view.js`, `assets/css/components.css`, `backend/pet-fast.ts`, `backend/games-fast.ts`, `sql/114-farm-ghost-levels.sql`, `app/guide.html`, `whatsnew.json`, `config.js` (0.11.45)
- **Paano:** test_v45 (844×390 at 390×844): bars katabi ng pangalan at walang patong sa dock; pindutan sa labas (Garden, Pick, Sit, Fish) at nasa loob ng screen; Garden (5 buto, 10 taniman, hinog/lumalaki, tanim −20, Harvest all +8); pitas +8; upo sa upuan; pangingisda (upo, kagat, Pull, huli +6, paggalaw = tigil); upo ng Kid sa bahay; Racing (4 mapa, disyerto); Dash walang joystick; Lights Out (antas, Medium 5 susi, camera Close, 3 button walang patong, nahuli habang nakatago → lumitaw ulit); Tigo 3D stickers (12, gumagalaw, play walang error). Pati test_v43, test_tigo. Hindi pa nasubukan sa totoong phone: pakiramdam ng pangingisda at Close camera, boses ng sticker sa Chat app, at bilis ng malaking mapa (Hard) sa mahinang phone.

## 2026-11-11 · #76 “What's on your mind?” (text post) sa Explore at Profile · long-press sa gamit ng bahay = edit · XP bar hindi na natatakpan · Calendar at Weather na glass

- **Hiling:** Walang write post na parang Facebook (text o may image) sa Explore at Profile; natatakpan ng malalaking button ang bar ni Tigo sa landscape; hindi pantay ang upuan → long-press para ma-edit; Calendar at Weather sumabay sa transparent na theme (glossy glass).
- **Ginawa:** (1) Bagong `write-box.js` — kahon na “What's on your mind?” + 🖼 sa Explore (sa ilalim ng status) at Profile; binubuksan ang composer sa text mode (walang photo, may “Add photos”). `createPost` tumatanggap na ng caption lang. Text post = kulay na card sa feed (`.pcard-text`), tile sa Profile (`.pt-text`) at viewer (`.pv-text`). (2) Long-press 0.55 s sa gamit sa loob ng bahay → Decorate na nakapili na ang gamit (ilipat, ikot, alisin); kinakansela ng galaw >10px. (3) `stack()` — ang dock ay nasa ilalim na ng XP bar; 36px ang dock buttons sa landscape. (4) `look.css` — glass (blur + gloss) sa Calendar at Weather modal kapag may background (`html.has-bg`).
- **Files:** `assets/js/components/write-box.js` (bago), `assets/js/components/post-composer.js`, `assets/js/components/post-card.js`, `assets/js/components/post-viewer.js`, `app/explore.html`, `app/profile.html`, `assets/css/social.css`, `assets/css/look.css`, `assets/css/pages/tigo.css`, `assets/js/pages/tigo.js`, `assets/js/tigo/room-ui.js`, `backend/posts-fast.ts`, `app/guide.html`, `whatsnew.json`, `config.js` (0.11.46)
- **Paano:** test_v46 (360×740, 740×360, 1280×800; 51 check): kahon kasya at walang patong, composer text mode, bawal ang blangko, `createPost` na walang media at walang `createUpload`, text card sa feed, tile at viewer sa Profile. test_v46t (844×390, 740×360, 390×844): dock sa ilalim ng XP bar at mini bars; tap at drag hindi nagbubukas ng edit; long-press nagbubukas na may napiling gamit at nasa screen ang bar. test_calwx + glass (28). Hindi pa nasubukan sa totoong phone: pakiramdam ng long-press habang iniikot ang view, at itsura ng glass sa sariling photo background.

## 2026-11-11 · #77 Tigo: Friends, World chat, Chats/groups, pasyal sa isla ng kaibigan (lipad sa ibabaw ng mundo), ikot/pinch ng view sa Lights Out, Join mula sa Friends

- **Hiling:** Add friends, world chat at chat group sa loob ng Tigo; pumasyal sa bahay ng iba (eroplano, mundo sa ilalim, papunta sa bahay ng friend); pinch/ikot/swipe ng view sa Lights Out; ma-join ang nilalaro ng friends; bagong 3v3 MOBA (archer, fighter, assassin, mage). Napagkasunduan: Follow = friends; World chat na may filter + Report + Mute; pasyal na live kung online; dalawang release (ang MOBA ay sa susunod).
- **Ginawa:** (1) Bagong Edge Function `tigo-social` (friends, world, say, mute, del, visit) + tables `tigo_world`, `tigo_mutes`, `pets.isle_key` (sql/117; RLS, service_role lang). (2) `tigo/social-ui.js` — sheet na may 🌍 World · 👥 Friends (hanap + Follow, online, Join, ✈️ Visit, 💬) · 💬 Chats (DM at group ng Messenger, New group). (3) `tigo/flight.js` — eroplano sa ibabaw ng bilog na mundo; `pet-scene.js` `puppet()`/`netState()` — Tigo ng iba na galaw ay galing sa realtime channel ng isla (`tmn-isle-<key>`, galaw lang, walang chat). Sa isla ng iba: bahay niya (tingin lang), banner na may 💬 at 🏠 Home; sa sariling isla, lumalabas ang bisita. (4) Lights Out: hila = ikot kahit Top view, pinch/gulong = zoom. (5) Friends → Join → diretso sa room (`gamesNode(…, join)`).
- **Files:** `backend/tigo-social.ts` (bago), `sql/117-tigo-social.sql`, `assets/js/tigo/social-ui.js` (bago), `assets/js/tigo/flight.js` (bago), `assets/js/tigo/pet-scene.js`, `assets/js/tigo/ghost-game.js`, `assets/js/tigo/games-ui.js`, `assets/js/pages/tigo.js`, `app/tigo.html`, `assets/css/pages/tigo.css`, `assets/js/config.js` (`fn.tigoSocial`, 0.11.47), `app/guide.html`, `whatsnew.json`
- **Paano:** test_v47 (844×390 at 390×844; 66 check, mock na server at pekeng realtime): Friends (listahan, hanap, Follow), World (padala, bawal ang link, ping → bagong mensahe, Report, Mute, Delete), Chats (DM, padala, New group), Join → lobby, lipad → isla ng kaibigan (banner, pangalan sa ulo, pangalawang bisita, bye), loob ng bahay (gamit niya, walang Decorate), 💬 → DM, lipad pauwi, bisita sa sariling isla. test_v47g: ikot at zoom sa Top view. test_ghost 44/44. Hindi pa nasubukan: dalawang totoong phone na magkasabay (live na galaw), totoong server ng World chat sa maraming tao, at ang MOBA (hindi pa gawa).
