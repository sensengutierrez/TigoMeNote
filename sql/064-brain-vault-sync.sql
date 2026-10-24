-- TigoMeNote · 064 · vault sync: #42 bilis at tipid sa Free plan — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Files:** `assets/css/base.css`, `config.js` (0.11.13)
$v$, $v$- **Files:** `assets/css/base.css`, `config.js` (0.11.13)

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
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Desktop Explore: 560 px na feed | Masyadong malaki ang post sa buong lapad; parang Facebook/Instagram ang sukat |

$v$, $v$| 2026-10-24 | Desktop Explore: 560 px na feed | Masyadong malaki ang post sa buong lapad; parang Facebook/Instagram ang sukat |
| 2026-10-24 | Functions naka-pin sa ap-south-1 (Mumbai) | Katabi ng database; mas mabilis kaysa function na malapit sa user pero malayo sa DB |
| 2026-10-24 | Feed preview photo ginagawa sa phone (≤960 px), hindi Supabase image transform | Bayad na feature ang image transform; libre ang canvas sa phone |
| 2026-10-24 | Keep-warm at reminders cron ay tumatakbo lang kapag kailangan | Tipid sa 500k invocations/buwan ng Free plan |

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| `native-bridge.js` | Phone features (GPS, alarm, push); sa APK: `window.TMN_APP` (`TMN_NATIVE`) |
| `push-setup.js` / `sw.js` | Push notifications (`TMN_PUSH`) + service worker |
| `safety-watch.js` / `location-share.js` | Bantay ng SOS at pagpapadala ng location sa bawat page |
$v$, $v$| `native-bridge.js` | Phone features (GPS, alarm, push); sa APK: `window.TMN_APP` (`TMN_NATIVE`) |
| `push-setup.js` / `sw.js` | Push notifications (`TMN_PUSH`) + service worker: cache ng static (`?v=`), pages, fonts at Storage photos |
| `safety-watch.js` / `location-share.js` | Bantay ng SOS at pagpapadala ng location sa bawat page |
$v$), updated_by = 'claude', updated_at = now();
