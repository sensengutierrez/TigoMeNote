-- TigoMeNote · 045 · vault sync: #32 pare-parehong laki ng media — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** `safety_links.a_label` = tawag ni a kay b, `b_label` = tawag ni b kay a. Auto-grow: lagyan ng `data-autogrow="<max px>"` ang textarea.
$v$, $v$- **Paano:** `safety_links.a_label` = tawag ni a kay b, `b_label` = tawag ni b kay a. Auto-grow: lagyan ng `data-autogrow="<max px>"` ang textarea.

## 2026-10-24 · #32 Pare-parehong laki ng photo/video sa feed
- **Ano:** Lahat ng photo at video sa feed ay iisang laki na ang kahon (`clamp(220px, 100dvh − 320px, 460px)`), buo ang makikita (`contain`), at kasya ang buong post sa screen kaya hindi na kailangang mag-scroll.
- **Bakit:** Ayon kay Bench (may screenshot): "ng scroll padin ako dapat pag ganyan kalake same size nalang wala ng scroll sa picture at video".
- **Files:** `assets/css/social.css`, `assets/js/components/post-card.js` (wala nang aspect-ratio bawat post), `config.js` (0.11.4)
- **Na-test (mock):** 1366×768 → post 670px; 1280×720 → 622px; phone 390×844 → 682px (lahat kasya).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- 2026-10-24 · Wellbeing: "Cannot read properties of undefined (reading 'sleep')" kapag walang `state` ang naka-cache → guard sa `apply()` (`wellbeing.js`)

$v$, $v$- 2026-10-24 · Wellbeing: "Cannot read properties of undefined (reading 'sleep')" kapag walang `state` ang naka-cache → guard sa `apply()` (`wellbeing.js`)
- 2026-10-24 · Feed: kailangan pa ring mag-scroll sa video kahit 560px na → ang video na walang w/h ay square (1:1) kaya laging pinakamataas, at mas mataas ang buong post kaysa sa screen → iisang taas na batay sa screen (`100dvh − 320px`, 220–460px) at `contain` sa photo at video (`social.css`, `post-card.js`)

$v$), updated_by = 'claude', updated_at = now();
