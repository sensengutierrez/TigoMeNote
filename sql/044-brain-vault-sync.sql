-- TigoMeNote · 044 · vault sync: #31 circle labels, media, autogrow, story ring, bilis — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Build - Safety and wellbeing$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- Ang SOS ay napupunta lang sa **tinanggap** na Family/Friends.
$v$, $v$- Ang SOS ay napupunta lang sa **tinanggap** na Family/Friends.

## "Sino siya sa iyo" (label) — 2026-10-24
- `components/relation-picker.js` (`TMN_RELATION`): chips para sa Family (asawa, partner, anak, magulang, kapatid, lolo/lola, apo, kamag-anak) o Friends (best friend, kaibigan, kaklase, katrabaho, kapitbahay) + **Other** (sariling sulat, ≤24).
- Naka-save sa `safety_links.a_label` / `b_label` (label ng bawat panig). `safety-fast`: `invite`/`respond`/`update` tumatanggap ng `label`; `circle` nagbabalik ng `label` mo.
- UI: badge sa member at sa pending; ⋯ → Set/Change who they are to you.
- Hindi pa na-test sa totoong server (mock lang, 22/22 sa circle test).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** `Content-Type: text/plain` + `token` sa body = "simple request" (walang CORS preflight). Patayin ang keep-warm: `select cron.unschedule('tmn-keep-warm');`
$v$, $v$- **Paano:** `Content-Type: text/plain` + `token` sa body = "simple request" (walang CORS preflight). Patayin ang keep-warm: `select cron.unschedule('tmn-keep-warm');`

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
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-23 | Lipat sa **Brevo** (free 300/araw) | Ayaw tanggapin ng Gmail ang App Password; walang domain na kailangan sa Brevo. SMS ay hindi pinili kasi may bayad. |

$v$, $v$| 2026-10-23 | Lipat sa **Brevo** (free 300/araw) | Ayaw tanggapin ng Gmail ang App Password; walang domain na kailangan sa Brevo. SMS ay hindi pinili kasi may bayad. |
| 2026-10-24 | Label sa circle ("Sino siya sa iyo") ay pribado: bawat panig may sariling label | Iba ang tawag ng anak sa magulang at ng magulang sa anak; walang ibang nakakakita |

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- 2026-10-24 · Mabagal ang loading → (1) cold start ng edge functions (2–3 s kapag ilang minutong walang gumagamit), (2) CORS preflight (OPTIONS) bago ang bawat POST dahil sa `x-session-token` header at JSON content-type → token sa body + text/plain (walang preflight), keep-warm bawat 3 min (sql/041), at cache ng badge (`api.js`, `auth-guard.js`, `notif-badge.js`)

$v$, $v$- 2026-10-24 · Mabagal ang loading → (1) cold start ng edge functions (2–3 s kapag ilang minutong walang gumagamit), (2) CORS preflight (OPTIONS) bago ang bawat POST dahil sa `x-session-token` header at JSON content-type → token sa body + text/plain (walang preflight), keep-warm bawat 3 min (sql/041), at cache ng badge (`api.js`, `auth-guard.js`, `notif-badge.js`)
- 2026-10-24 · Feed: masyadong malaki ang video/photo, kailangang mag-scroll para makita ang buong video → `max-height` ay sobrang taas at `cover` ang video → `min(68vh, 560px)` at `contain` (`social.css`)
- 2026-10-24 · Comment reply: may scrollbar sa gilid habang nagta-type → nakapirming taas ang textarea → auto-grow pataas hanggang 120px, nakatago ang scrollbar (`app-shell.js`, `components.css`, `social-ui.js`)
- 2026-10-24 · Bumagal ulit ang page → (1) hinihintay ang Noto Color Emoji font (render-blocking CSS), (2) wellbeing at sign-in check sa bawat lipat ng page → font ay non-blocking (`media=print onload`), Segoe UI Emoji muna sa Windows, cache ng sign-in (10 min) at wellbeing (60 s) (`app/*.html`, `tokens.css`, `auth-guard.js`, `wellbeing.js`)
- 2026-10-24 · Wellbeing: "Cannot read properties of undefined (reading 'sleep')" kapag walang `state` ang naka-cache → guard sa `apply()` (`wellbeing.js`)

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| `post_views` | sino ang nakakita ng post at kailan (views + History) | `sql/020-views-pins.sql` |
| `safety_links` | Family/Friends (isang row bawat pares, may share bawat panig) | `sql/023-safety.sql` |
| `location_points` | location (30 araw) | `sql/023-safety.sql` |
$v$, $v$| `post_views` | sino ang nakakita ng post at kailan (views + History) | `sql/020-views-pins.sql` |
| `safety_links` | Family/Friends (isang row bawat pares, may share at label bawat panig) | `sql/023-safety.sql`, `sql/043-circle-labels.sql` |
| `location_points` | location (30 araw) | `sql/023-safety.sql` |
$v$), updated_by = 'claude', updated_at = now();
