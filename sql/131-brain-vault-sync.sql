-- TigoMeNote · 131 brain vault sync (Change log #86, Decisions, Fix log 2026-11-27)
update brain_notes set body = rtrim(body, E' \n') || $v$

## 2026-11-27 · #86 Desktop: buong lapad na Explore, maayos na scroll, mas malapad na Settings

- **Hiling:** Parang pang-phone ang website sa computer; gawing full UI, ayusin ang scroll, huwag munang ipakita ang nasa gilid, at lakihan/ilapad nang kaunti.
- **Ginawa:** (1) `pages/explore.css`: sa desktop wala na ang side panel (hanap + suggestions ay nasa 🔍 sa itaas, kasama ang suggestions); isang feed sa gitna na 760 px (820 px sa ≥ 1500 px, dati 560); photo hanggang 84% ng taas ng screen. `social.css`: pareho ang taas ng photo sa ibang feed. (2) `components/app-shell.js`: gulong ng mouse sa menu (kapag hindi na ito maka-scroll) = scroll ng content; ↑ ↓ Space PgUp PgDn Home End gumagana kahit walang naka-focus (hindi sa Tigo, Messages at may bukas na modal); naka-focus ang content pagbukas. (3) `shell.css`: manipis na scrollbar ng menu (lumalabas lang kapag naka-hover), hindi na naiipit ang Share button, mas siksik ang menu sa mababang screen (≤ 1000 px ang taas). (4) `pages/settings.css`: 820 px sa desktop (dati 640).
- **Files:** `assets/css/pages/explore.css`, `assets/css/social.css`, `assets/css/shell.css`, `assets/css/pages/settings.css`, `assets/js/components/app-shell.js`, `whatsnew.json`, `config.js` (0.11.55)
- **Paano:** Screenshots ng Explore sa 1920×992, 1366×700, 1024×700 at 390×844 (phone, walang nabago); Settings sa 1920; PgDn at gulong sa ibabaw ng menu ay nag-i-scroll ng feed. Hindi pa nasubukan: totoong trackpad (smooth scroll) at ibang browser bukod sa Chromium.$v$, updated_by = 'claude', updated_at = now() where lower(title) = 'change log';
update brain_notes set body = replace(body, $v$| 2026-11-13 | 🧱 Block avatar = sariling disenyo (kahon), pareho ang API at sukat ng Kid | Tugma agad sa upuan, kama, sasakyan at mga laro |
$v$, $v$| 2026-11-13 | 🧱 Block avatar = sariling disenyo (kahon), pareho ang API at sukat ng Kid | Tugma agad sa upuan, kama, sasakyan at mga laro |
| 2026-11-27 | Desktop Explore: isang malapad na feed, walang side panel (hanap at suggestions sa 🔍) | Hiling ni Bench: hindi pang-phone ang itsura; mas malaki ang post |
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'decisions';
update brain_notes set body = replace(body, $v$- 2026-11-13 · Decorate: natatakpan ng bar ang napiling gamit → bar na sumusunod sa itaas/ibaba ng gamit (`tigo/room-ui.js`)
$v$, $v$- 2026-11-13 · Decorate: natatakpan ng bar ang napiling gamit → bar na sumusunod sa itaas/ibaba ng gamit (`tigo/room-ui.js`)
- 2026-11-27 · Desktop: hindi nag-i-scroll ang feed kapag nasa menu ang mouse o kapag PgDn/Space → content box ang nag-i-scroll, hindi ang page → ipinapasa ang gulong at mga scroll key sa content (`components/app-shell.js`)
- 2026-11-27 · Laptop na mababa ang screen: naiipit ang Share button at may scrollbar ang menu → `flex-shrink: 0`, siksik na menu, nakatagong scrollbar (`shell.css`)
$v$), updated_by = 'claude', updated_at = now() where lower(title) = 'fix log';
select title, char_length(rtrim(body, E' \n')) n from brain_notes where lower(title) in ('change log','decisions','fix log');
