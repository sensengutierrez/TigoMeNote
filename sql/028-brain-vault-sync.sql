-- TigoMeNote · 028 · vault sync: #22 (marijuana, baliktad, banta, teen, live check, Report sa viewer) — record lang; napatakbo na
-- Build note = buong body; Change log, Fix log, Decisions, System map = replace() upsert. Laman: docs/vault.
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{log}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$licies]].
$v$, $v$licies]].

## 2026-10-24 · #22 Mas mahigpit na filter: marijuana, baliktad na salita, banta, teen protection, live check, Report sa viewer
- **Ano:** Mas maraming salita ng marijuana/droga (mariwana, weed, kush, tsongke, "hithit tayo ng…", "420"). Nahuhuli na ang baliktad na salita ("anaujiram", "elas rof nug") at pinagpalit na pantig ("busha"). Mas maraming banta sa English, Filipino at Arabic. Teen (13–17): bawal ang phone number, email, address at ibang chat app sa post/comment/bio. **Live check** sa app/web: may babala habang nagta-type (caption, comment, status, pangalan, bio) at hinaharang bago pa ipadala. **Report** button sa post viewer at sa status ng iba.
- **Bakit:** Hiling ni Bench: "polish natin… pati ung mariwana, ung baliktad na salita, dapat merron tayo auto sa app or web… para sa young and adult protection, bawal ung mga pambabanta… sa mga posting mag add tayo ng report".
- **Files:** `backend/moderation.ts`, `posts-fast.ts` (v7), `social-fast.ts` (v6), `profile-fast.ts` (v5), `auth-fast.ts` (v27), `tools/build-moderation-client.mjs` (bago), `assets/js/moderation-check.js` (gawa ng tool), `assets/js/components/mod-guard.js` (bago), `post-composer.js`, `stories.js`, `profile-editor.js`, `social-ui.js`, `post-viewer.js`, lahat ng `app/*.html` + `app/admin/reports.html`, `components.css`, `social.css`, `posts.css`, `legal/guidelines.html`, `lang/ar.js`, `lang/fil.js`, `config.js` (0.7.1)
- **Paano:** Iisang rules sa server at browser (kinokopya ng tool ang CORE ng `moderation.ts`). Detalye: [[Build - Moderation and policies]].
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{log}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$tion.ts`)

Hindi bug$v$, $v$tion.ts`)
- 2026-10-24 · Text filter: hindi nahuli ang "420" at "ak47" → ginagawang letra ng leetspeak ang numero ("42o", "ak4t") → dagdag na bersyon na walang leetspeak (`moderation.ts`)
- 2026-10-24 · Text filter: hindi nahuli ang "hithit tayo ng marijuana" → isang salita lang ang pinapayagan sa pagitan → hanggang 2 filler words (`FILL` sa `moderation.ts`)
- 2026-10-24 · Text filter: mali-maling flag sa "coke", "hash browns", "I'll find you a seat", "beat your record", "signal", "damo para sa kambing" → masyadong malawak ang salita → tinanggal o ginawang flag lang (`moderation.ts`)
- 2026-10-24 · Status: natatakpan ng status viewer ang Report sheet → mas mataas ang z-index ng viewer → `body:has(.st-view) .modal-backdrop{z-index:95}` (`social.css`)

Hindi bug$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{decision}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$6-10-24 | Text filte$v$, $v$6-10-24 | Iisang rules sa server at browser: `tools/build-moderation-client.mjs` ang gumagawa ng `moderation-check.js` | Live na babala habang nagta-type, pero ang server pa rin ang huling bantay |
| 2026-10-24 | Baliktad na buong text: block rules lang; baliktad na bawat salita: pati flag | Iwas mali-maling flag sa normal na text |
| 2026-10-24 | Teen: bawal ang phone, email, address at ibang chat app sa post/comment/bio | Proteksyon laban sa grooming at pribadong usapan sa labas ng app |
| 2026-10-24 | Text filte$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{system}', 'claude') on conflict (lower(title)) do update set body = replace(replace(replace(brain_notes.body, $v$ 2026-10-23
---
# Sys$v$, $v$ 2026-10-24
---
# Sys$v$), $v$g settings |
| `page$v$, $v$g settings |
| `moderation-check.js` | Rules ng text filter sa browser (`TMN_MOD`); **huwag i-edit**, gawa ng `tools/build-moderation-client.mjs` |
| `components/mod-guard.js` | Live na babala at harang bago mag-post/comment/save (`TMN_GUARD`) |
| `page$v$), $v$ts/img/`.

## Extern$v$, $v$ts/img/`.
`tools/build-moderation-client.mjs` — kinokopya ang CORE ng `backend/moderation.ts` papuntang `assets/js/moderation-check.js`. Patakbuhin (`node tools/build-moderation-client.mjs`) tuwing babaguhin ang rules.

## Extern$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Moderation and policies$v$, $v$---
tags: [build, moderation, legal]
updated: 2026-10-24
---
# Build - Moderation and policies

**What it does:** Mga policy page (About, Terms of Use, Privacy Policy, Community Guidelines, Copyright, Third-party software), automatic na **text filter** laban sa violence, nudity, crime/drugs, illegal firearms at harassment, **Report** sa posts/comments/accounts, at **Reports page** para sa Admin.

**Pages:** `legal/index.html`, `terms.html`, `privacy.html`, `guidelines.html`, `copyright.html`, `third-party.html` (public, walang login) · `app/admin/reports.html` (Admin lang, nasa menu bilang **Reports**) · links sa Settings → About & policies, sa login ("By continuing, you agree…"), sa landing footer, at **Policies** sa menu
**Code:** `backend/moderation.ts` (text rules), `assets/js/moderation-check.js` (parehong rules sa browser, gawa ng `tools/build-moderation-client.mjs`), `components/mod-guard.js` (live check), `backend/moderation-fast.ts`, `assets/js/pages/legal.js`, `assets/js/pages/admin-reports.js`, `components/social-ui.js` (`reportSheet`), `components/post-viewer.js` ("Under review"), `post-queue.js` (status "blocked")
**Styles:** `assets/css/pages/legal.css`, `assets/css/pages/admin-reports.css`, report sheet sa `social.css`
**Server:** `moderation-fast` v1, `posts-fast` v7, `social-fast` v6, `profile-fast` v5, `auth-fast` v27 (lahat may bagong `moderation.ts`)
**SQL:** `sql/026-moderation.sql` (napatakbo na): `reports`, `moderation_log`, `hidden_at` sa posts/comments/stories, `users.strikes`

## Text filter (`moderation.ts`)
- Sinusuri: caption ng post at status, comment, display name, username, bio.
- **Block** = hindi tatanggapin, may mensahe: "This can't be posted. It looks like … which breaks our Community Guidelines." Naka-log sa `moderation_log` (`auto_block`).
- **Flag** = tinatanggap pero may automatic na report sa Reports (para sa admin).
- Kategorya: firearms (bentahan ng baril/bala, paltik, sumpak…), crime (bentahan ng droga, shabu, fake ID/passport, hitman…), violence (banta: "papatayin kita", "I will kill you"…), harassment ("kill yourself"…), nudity (porn, nudes…). English, Filipino at Arabic.
- Nahuhuli rin ang "G.U.N for s4le", "s h a b u", accents at Arabic hamza.
- **Marijuana/droga:** marijuana, mariwana, weed, ganja, kush, tsongke, chongke, jutes, hashish, thc (pati Arabic). Block kapag may bentahan ("weed 1g available", "may stock ng kush"), gamit ("hithit tayo ng marijuana", "smoke weed", "420 weed") o "shabu/tsongke" mismo. Ang "damo" (damo rin sa hardin) ay flag lang.
- **Baliktad na salita:** "anaujiram" (bawat salita) at "elas rof nug" (buong text) → block. Pinagpalit na pantig ("busha" → shabu, "rilba" → baril) para sa mahahalagang salita lang.
- **Banta:** "I will kill you", "watch your back", "papatayin kita", "abangan kita", "alam ko bahay mo", "سأقتلك", bomb threat, school shooting → block.
- **Teen (13–17):** bawal ang phone number, email, address at ibang chat app (WhatsApp, Telegram, Snapchat…) sa caption, comment at bio. Mensahe: "For your safety, teen accounts can't share…".
- Unit tests: 56/56; sa 48 normal na pangungusap, 1 lang ang na-flag ("rifle scope", ok lang kasi flag lang).
- **Live check (app at web):** habang nagta-type sa caption, comment, status, pangalan at bio, may babala sa ilalim (may "Learn more" papuntang Guidelines). Hinaharang din bago ipadala. Ang server pa rin ang huling bantay.
- Sa offline queue: kapag hinarang ang caption, status = **Blocked** (hindi na uulitin); i-cancel na lang.

## Report + review
- Report sa: post (⋯ menu at **Report** button sa viewer), status ng iba (**Report** sa status viewer), comment ("Report" sa comment ng iba), account (flag button sa mini profile). 10 dahilan, may optional na detalye. Pribado ang report.
- Isang report bawat tao bawat target; hanggang 30 bawat araw.
- **Kusang itinatago** ang post/comment/status kapag: 3+ magkakaibang tao ang nag-report, o may report na **child safety**. Ang may-ari lang ang nakakakita (may "Under review").
- **Admin Reports page:** Open / Actioned / Dismissed. Bawat item: preview (photo/video, caption, comment, profile), mga dahilan, sino ang nag-report, strikes ng user. Desisyon: Dismiss, Hide/Unhide, Delete (+1 strike), Warn (+1 strike), Suspend/Unsuspend (Inactive + logout). Lahat naka-log.

## Photos at videos
Wala pang automatic na image AI (hindi ma-download ang model dito, at ang violence/baril sa larawan ay kailangan ng bayad na serbisyo). Ngayon: Report + admin review. Puwedeng idagdag: nsfwjs (libre, nudity lang, sa browser) o Sightengine / Google Cloud Vision (may bayad, may violence at weapons).

## Policies
- English ang legal text (`translate="no"`); isinasalin lang ang menu/heading.
- Contact: `TMN_CONFIG.legal.contactEmail` sa `config.js`. Habang wala pa, "Report button" ang ipinapakita.
- Batas: Kingdom of Bahrain (puwedeng palitan). **Hindi ito legal advice**; ipa-review sa abogado bago mag-launch nang malaki o mag-Play Store.

## Hindi pa na-test
- Lahat ng tests ay naka-mock (106/106 moderation: desktop, phone, Arabic, teen, non-admin). Na-deploy ang 4 na function pero hindi pa nasubukan sa totoong server: report, auto-hide, admin actions, teen block at ang text filter sa live.
- Walang automatic na detection sa photos/videos.

Tingnan din: [[Plan - Safety, family and wellbeing]], [[Build - Social feed]], [[System map]]
$v$, '{build,moderation,legal}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_by = 'claude', updated_at = now();
