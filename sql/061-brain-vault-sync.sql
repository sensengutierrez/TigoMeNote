-- TigoMeNote · 061 · vault sync: #41 walang asul na tap highlight — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** Ang Trending ay bilang lang ng TigoMeNote Sounds (walang kantang may copyright gaya ng sa TikTok/FB/IG).
$v$, $v$- **Paano:** Ang Trending ay bilang lang ng TigoMeNote Sounds (walang kantang may copyright gaya ng sa TikTok/FB/IG).

## 2026-10-24 · #41 Walang asul na highlight kapag nag-tap sa phone
- **Ano:** Kapag nag-tap sa photo, status, button o nag-swipe, wala nang asul na highlight o asul na "select". Hindi ginalaw ang long-press sa link (Open in new tab) at ang pag-select ng text sa caption, comments at chat. Sa keyboard (desktop) may outline pa rin para sa accessibility.
- **Bakit:** Ayon kay Bench: "pix mo lang ung pag ng click ako ng highlights ng blue… pero wag mo tanggalin ung longpress tapos newtab".
- **Files:** `assets/css/base.css`, `config.js` (0.11.13)
$v$), updated_by = 'claude', updated_at = now();
