-- TigoMeNote · 086 · vault sync: fix messenger + background — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Fix log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- 2026-10-25 · Build APK 0.11.24 bumagsak ("resource color/tmn_splash_bg not found") → ang bagong `apk/add-firebase.py` ay sumulat sa parehong `values/tmn_colors.xml` ng splash color kaya nabura ito → sariling file na `values/tmn_notify.xml`. Dagdag: ang Gradle error ay lumalabas na ngayon bilang annotation sa Actions (`apk.yml`)

$v$, $v$- 2026-10-25 · Build APK 0.11.24 bumagsak ("resource color/tmn_splash_bg not found") → ang bagong `apk/add-firebase.py` ay sumulat sa parehong `values/tmn_colors.xml` ng splash color kaya nabura ito → sariling file na `values/tmn_notify.xml`. Dagdag: ang Gradle error ay lumalabas na ngayon bilang annotation sa Actions (`apk.yml`)
- 2026-10-31 · Messenger (phone): kapag may background (Settings → Look), lumiliit ang bukas na chat at ang sulatan ng message (hindi na full screen) → ang `backdrop-filter` (blur) ng `.card` ay ginagawang "kahon" ng `position: fixed` na chat → walang blur sa `.inbox.card` sa phone (`messages.css`). Version 0.11.25

$v$), updated_by = 'claude', updated_at = now();
