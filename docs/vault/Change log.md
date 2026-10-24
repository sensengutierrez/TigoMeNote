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
