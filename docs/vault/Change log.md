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
