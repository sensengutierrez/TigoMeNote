---
tags: [build]
updated: 2026-10-24
---
# Build - Profile tabs and pins

**What it does:** Profile na parang TikTok: mga tab (Posts, Private, Reposts, Saved, Liked, History), bilang ng **views** at **❤️** sa bawat tile, **Pin** hanggang 3 post, at **Likes** sa stats.

**Pages:** `app/profile.html` · **Code:** `assets/js/pages/profile.js`, `assets/js/components/post-viewer.js` (tiles + Pin + view counter), `assets/js/components/social-ui.js` (Pin sa ⋯ menu, Likes sa mini profile), `assets/js/pages/explore.js` (bilang ng view sa feed)
**Styles:** `assets/css/pages/profile.css` (`.p-tabs`, `.p-sort`), `assets/css/posts.css` (`.pt-stats`, `.pt-badge.pin`)
**Server:** `posts-fast` v4 (`view`, `pin`, `liked`, `reposts`, `history`), `profile-fast` v3 at `social-fast` v3 (`counts.likes`)
**SQL:** `sql/020-views-pins.sql` (napatakbo na bilang migration `020_views_pins`)

## Mga tab
| Tab | Laman | Sino ang nakakakita |
|---|---|---|
| Posts (grid) | Lahat ng post mo + filter (All, Photos, Videos, Scheduled) + sort (Latest, Popular, Oldest) | ikaw (at ang public sa iba) |
| Private (lock) | Mga post na "Only me" | ikaw lang |
| Reposts | Mga ni-repost mo | ikaw |
| Saved (bookmark) | Mga naka-bookmark | ikaw lang |
| Liked (heart) | Mga post na ni-react-an mo | ikaw lang |
| History (clock) | Mga huling nakita mo | ikaw lang |

Sa phone: icon lang ang tab. Sa desktop: icon + label.

## Views
- Binibilang kapag **≥60% ng post ay nakita nang 1.5 s** sa Explore, o kapag binuksan sa viewer.
- Hindi binibilang ang sarili mong post. Isang beses bawat tao; bibilang ulit lang kapag lumipas ang **6 oras**.
- Ipinapadala nang sabay-sabay (hanggang 30 bawat tawag) → `posts-fast` `view` → function na `record_post_views()`.
- Table `post_views` (post, user, huling nakita) = laman din ng History tab. `posts.view_count` = bilang.

## Pin
- Sa viewer: button na **Pin / Unpin**. Sa ⋯ menu ng post: **Pin to profile**.
- Hanggang **3**. Kapag sobra: "You can pin up to 3 posts. Unpin one first."
- Laging nasa unahan ang naka-pin sa **Latest** (pinakabagong pin ang una), at may pulang **Pinned** badge. Sa Popular/Oldest, normal ang ayos.
- Sa profile ng ibang user (mini profile), una rin ang naka-pin (`userPosts`).

## Popular
Puntos = views + 5×reactions + 8×comments + 10×reposts (sa browser kinukuwenta).

## Cache (bakit hindi nakita ang Language sa phone)
Luma pa ang naka-cache na `settings.js` sa phone. Ngayon may `?v=<version>` na ang lahat ng sariling `.js`/`.css` sa HTML.
- Tuwing release: taasan ang `version` sa `assets/js/config.js`, tapos `python3 tools/cache-bust.py`.
- Ang `i18n.js` ay naglalagay rin ng `?v=` sa `lang/<code>.js`.

## Hindi pa na-test
- Totoong server (tests ay naka-mock): bilang ng views, ang Likes count (join sa `posts`), at pin limit sa database.
- Totoong phone ni Bench (Chrome/Safari cache).

Tingnan din: [[Build - Social feed]], [[Build - Profile edit]], [[System map]]
