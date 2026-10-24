-- TigoMeNote · 031 · vault sync: #24 Daily greeting — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$ations]].
$v$, $v$ations]].

## 2026-10-24 · #24 Daily: kusang nagbabago ang bati at petsa
- **Ano:** Ang "Good morning / afternoon / evening" ay nagbabago na kahit bukas lang ang page (tinitingnan bawat minuto at pagbalik sa app). Pagdating ng hatinggabi, napapalitan din ang petsa at ang linggo. "0% ulan" sa weather → "0% rain" (isinasalin sa Filipino at Arabic).
- **Bakit:** Tanong ni Bench: "itong good morning na to ng babago ba… kahit hindi, automatic ba, sample afternoon na".
- **Files:** `assets/js/pages/daily.js`, `assets/js/components/weather.js`, `lang/fil.js`, `lang/ar.js`, `config.js` (0.8.1)
- **Paano:** Umaga = bago 12 NN, hapon = 12–6 PM, gabi = 6 PM pataas (oras ng device).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$ons.css`)

Hindi bug$v$, $v$ons.css`)
- 2026-10-24 · Daily: nananatili ang "Good morning" kahit hapon na kapag bukas lang ang page → isang beses lang kinukuha ang oras pag-load → bawat minuto at pagbalik sa app tinitingnan ulit (`pages/daily.js`)
- 2026-10-24 · Weather: "0% ulan" kahit English ang wika → Filipino na salita sa code → "% rain" + salin (`components/weather.js`)

Hindi bug$v$), updated_by = 'claude', updated_at = now();
