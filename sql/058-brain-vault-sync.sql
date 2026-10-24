-- TigoMeNote · 058 · vault sync: #39 post media parang Facebook + video play mode — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Files:** `assets/js/tigo/voice.js`, `talk.js`, `pac-game.js`, `race-game.js` (bago), `games-ui.js`, `pet-scene.js` (beginGame/endGame, headScreen, input), `pages/tigo.js`, `app/tigo.html`, `pages/tigo.css`, `backend/pet-fast.ts` (game kind: coins/pac/race, 10 bawat araw bawat laro), `config.js` (0.11.10), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Tigo]].
$v$, $v$- **Files:** `assets/js/tigo/voice.js`, `talk.js`, `pac-game.js`, `race-game.js` (bago), `games-ui.js`, `pet-scene.js` (beginGame/endGame, headScreen, input), `pages/tigo.js`, `app/tigo.html`, `pages/tigo.css`, `backend/pet-fast.ts` (game kind: coins/pac/race, 10 bawat araw bawat laro), `config.js` (0.11.10), `lang/fil.js`, `lang/ar.js`
- **Paano:** Detalye sa [[Build - Tigo]].

## 2026-10-24 · #39 Post media parang Facebook + video play mode (full screen / minimize)
- **Ano:**
  - **Feed (Explore, Home, Profile):** buong lapad ang photo/video at sumusunod ang taas sa hugis nito (4:5 pinakamatangkad, 1.91:1 pinakamalapad). Wala nang itim na gilid at wala nang scroll sa loob ng box; swipe lang kapag maraming photo.
  - **Video sa feed:** kusang tumutugtog nang naka-mute; 🔇/🔊 na button (hindi na play arrow). Tap sa video = **play mode**: buong-screen na player na may ✕, **▭ minimize** (maliit na lumulutang na player sa sulok, tuloy ang video habang nag-i-scroll, puwedeng i-drag, tap = palakihin) at **⛶ full screen** (pahiga kung kaya ng phone). Tuloy mula sa kung nasaan na ang video.
  - **Post viewer (Profile at link ng post):** isang buong post na lang (photo/video sa itaas, caption at comments sa ilalim) at isang scroll lang ang buong modal; sa desktop 680 px ang lapad. Video doon = play mode din.
- **Bakit:** Ayon kay Bench: "pag click ko scroll pa ung image… sa post na me video me arrow pa… dapat click ung video me lalabas na playmode tapos pwede full or minimize… same desktop… hindi na scroll sa loob ng box".
- **Files:** `assets/js/components/video-player.js` (bago, `TMN_PLAYER`), `components/post-card.js`, `components/post-viewer.js`, `icons.js` (mute, expand, shrink, pip), `css/social.css`, `css/posts.css`, `css/components.css`, `app/explore.html`, `home.html`, `profile.html`, `messages.html`, `notifications.html`, `share.html`, `config.js` (0.11.11), `lang/fil.js`, `lang/ar.js`
- **Paano:** Ang hugis ay galing sa `w`/`h` ng media (server); kung wala, kinukuha pagka-load at naaalala sa device (`tmnMediaAR`).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Pac-Tigo at Racing: sariling disenyo (Gloomies, Tigo karts) | Hindi kopya ng Pac-Man o ibang racing game (trademark) |

$v$, $v$| 2026-10-24 | Pac-Tigo at Racing: sariling disenyo (Gloomies, Tigo karts) | Hindi kopya ng Pac-Man o ibang racing game (trademark) |
| 2026-10-24 | Feed media: hugis ayon sa photo (4:5 hanggang 1.91:1), `cover` sa loob | Parang Facebook: walang itim na gilid at walang scroll sa loob; ang sobrang tangkad/lapad ay bahagyang napuputol |

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| `zip.js` | Gumawa ng .zip sa browser (`TMN_ZIP`) |
| `file-save.js` | I-save sa TigoMeNote folder: APK Documents, desktop na pinili, o Downloads (`TMN_FILES`) |
$v$, $v$| `zip.js` | Gumawa ng .zip sa browser (`TMN_ZIP`) |
| `components/video-player.js` | Video play mode: full screen, minimize (lumulutang na mini player), drag (`TMN_PLAYER`) |
| `file-save.js` | I-save sa TigoMeNote folder: APK Documents, desktop na pinili, o Downloads (`TMN_FILES`) |
$v$), updated_by = 'claude', updated_at = now();
