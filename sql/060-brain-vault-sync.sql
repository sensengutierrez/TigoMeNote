-- TigoMeNote · 060 · vault sync: #40 status like + views, sound sa status, trending sounds — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** Ang hugis ay galing sa `w`/`h` ng media (server); kung wala, kinukuha pagka-load at naaalala sa device (`tmnMediaAR`).
$v$, $v$- **Paano:** Ang hugis ay galing sa `w`/`h` ng media (server); kung wala, kinukuha pagka-load at naaalala sa device (`tmnMediaAR`).

## 2026-10-24 · #40 Status: ❤️ like + views, sound sa status, Trending at New sounds; mas maliit na post sa desktop
- **Ano:**
  - **Desktop feed:** 560 px na lang ang lapad ng Explore (parang Facebook/Instagram) at hindi lalampas sa ~¾ ng screen ang taas ng photo/video.
  - **❤️ sa status:** sa status ng iba may puso sa kanang-ibaba (tap) o double-tap sa photo; may notification sa may-ari ("… liked your status ❤️").
  - **Sino ang nanood:** sa sariling status, nasa ibaba ang mukha ng huling 3 nanood + "N views · ❤️ N". Tap = listahan (nauuna ang nag-❤️, may ❤️ sa tabi ng pangalan).
  - **Sound sa status:** kapag nag-upload ng status, kusang pumipili ng sound (gaya ng post); puwedeng palitan o tanggalin. Tumutugtog habang pinapanood, may "♪ pangalan" sa itaas.
  - **Sound list:** bagong "🔥 Trending on TigoMeNote" (pinakaginagamit sa posts at status sa 7 araw, may bilang) at "✨ New sounds" (may "New" na tatak).
  - **5 bagong sounds:** Kilig (Pinoy acoustic love), Habagat (Pinoy rainy lofi), Corniche Walk (Gulf chill), Tigo Bounce (cute pop), Glow Up (dance pop).
- **Bakit:** Ayon kay Bench: "sa web desktop ang laki… bakit walang like heart sa status… makikita mo sino ng view at ilan… pag ng upload ako sa web bakit walang auto ng sounds… new sound trending sounds".
- **Files:** `sql/059-story-likes-sounds.sql` (story_views.liked_at, stories.sound, notification `story_like`), `backend/social-fast.ts` (likeStory, soundTrends, sound sa createStory, views/likes/faces), `backend/notify.ts` (story_like), `components/stories.js`, `components/sound-picker.js`, `sounds.js`, `pages/notifications.js`, `css/social.css`, `css/sounds.css`, `css/pages/explore.css`, `css/pages/notifications.css`, `config.js` (0.11.12), `lang/fil.js`, `lang/ar.js`
- **Paano:** Ang Trending ay bilang lang ng TigoMeNote Sounds (walang kantang may copyright gaya ng sa TikTok/FB/IG).
$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$Decisions$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$| 2026-10-24 | Feed media: hugis ayon sa photo (4:5 hanggang 1.91:1), `cover` sa loob | Parang Facebook: walang itim na gilid at walang scroll sa loob; ang sobrang tangkad/lapad ay bahagyang napuputol |

$v$, $v$| 2026-10-24 | Feed media: hugis ayon sa photo (4:5 hanggang 1.91:1), `cover` sa loob | Parang Facebook: walang itim na gilid at walang scroll sa loob; ang sobrang tangkad/lapad ay bahagyang napuputol |
| 2026-10-24 | Trending sounds = TigoMeNote Sounds lang (bilang sa posts + status, 7 araw), walang commercial na kanta | Ang mga kanta sa TikTok/FB/IG ay may lisensya; bawal gamitin dito nang walang kasunduan |
| 2026-10-24 | ❤️ sa status ay naka-save sa `story_views.liked_at` (walang bagong table) | Isang row bawat nanood; kasama ang view at like |
| 2026-10-24 | Desktop Explore: 560 px na feed | Masyadong malaki ang post sa buong lapad; parang Facebook/Instagram ang sukat |

$v$), updated_by = 'claude', updated_at = now();
insert into brain_notes (title, body, tags, updated_by) values ($v$System map$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(replace(brain_notes.body, $v$| `posts-fast` | createUpload, createPost, myPosts, userPosts, getPost, feed, updatePost, deletePost, react, reactions, comments, addComment, deleteComment, bookmark, bookmarks, share, unrepost, shares, view, pin, liked, reposts, history | `backend/posts-fast.ts` |
| `social-fast` | follow, unfollow, people, profile, followList, requests, approveRequest, declineRequest, stories, storyUpload, createStory, viewStory, storyViewers, deleteStory | `backend/social-fast.ts` |
| `profile-fast` | get, update, imageUpload, setImage, removeImage | `backend/profile-fast.ts` |
$v$, $v$| `posts-fast` | createUpload, createPost, myPosts, userPosts, getPost, feed, updatePost, deletePost, react, reactions, comments, addComment, deleteComment, bookmark, bookmarks, share, unrepost, shares, view, pin, liked, reposts, history | `backend/posts-fast.ts` |
| `social-fast` | follow, unfollow, people, profile, followList, requests, approveRequest, declineRequest, stories, storyUpload, createStory, viewStory, likeStory, storyViewers, deleteStory, soundTrends | `backend/social-fast.ts` |
| `profile-fast` | get, update, imageUpload, setImage, removeImage | `backend/profile-fast.ts` |
$v$), $v$| `post_shares` | repost o link share | `sql/017-social.sql` |
| `stories` / `story_views` | status (24 oras) at sino ang nanood | `sql/017-social.sql` |
| `post_views` | sino ang nakakita ng post at kailan (views + History) | `sql/020-views-pins.sql` |
$v$, $v$| `post_shares` | repost o link share | `sql/017-social.sql` |
| `stories` / `story_views` | status (24 oras, may sound) at sino ang nanood / nag-❤️ (`liked_at`) | `sql/017-social.sql`, `sql/059-story-likes-sounds.sql` |
| `post_views` | sino ang nakakita ng post at kailan (views + History) | `sql/020-views-pins.sql` |
$v$), updated_by = 'claude', updated_at = now();
