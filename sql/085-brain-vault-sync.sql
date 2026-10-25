-- TigoMeNote · 085 · vault sync: fix build 0.11.24 (tmn_colors) — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- 2026-10-24 · Light mode na may picture na background: hindi mabasa ang "Your notes for today…" at iba pang text sa ibabaw ng picture → walang card sa likod ng mga ito → halo (text-shadow na kulay ng page) + mas madilim na kulay ng text (`look.css`)

$v$, $v$- 2026-10-24 · Light mode na may picture na background: hindi mabasa ang "Your notes for today…" at iba pang text sa ibabaw ng picture → walang card sa likod ng mga ito → halo (text-shadow na kulay ng page) + mas madilim na kulay ng text (`look.css`)
- 2026-10-25 · Build APK 0.11.24 bumagsak ("resource color/tmn_splash_bg not found") → ang bagong `apk/add-firebase.py` ay sumulat sa parehong `values/tmn_colors.xml` ng splash color kaya nabura ito → sariling file na `values/tmn_notify.xml`. Dagdag: ang Gradle error ay lumalabas na ngayon bilang annotation sa Actions (`apk.yml`)

$v$), updated_by = 'claude', updated_at = now();
