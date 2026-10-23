---
tags: [build]
updated: 2026-10-23
---
# Build - Social feed (reactions, comments, share, status)

**What it does:** Ang **Explore** ay parang Instagram na: **Status** ng mga fina-follow mo sa itaas, tapos feed ng posts na may **reactions** (❤️ 😂 😮 😢 🔥 👏), **comments**, **repost / share link**, at **bookmark**. Makikita kung **sino ang nag-react at nag-share**. May **Follow**, hanap ng tao, at mini profile ng ibang user.

## Paano gamitin
| Gusto mo | Gawin |
|---|---|
| ❤️ | Tap ang puso, o **double-tap** ang photo |
| Ibang emoji | Pindutin nang matagal ang puso (phone) o i-hover (desktop) |
| Sino ang nag-react / nag-share | Tap ang bilang sa tabi ng puso (may tab na **Shares**) |
| Comment | Tap ang comment icon. Pwedeng burahin ang sariling comment (at lahat ng comment sa post mo) |
| Repost | Tap ang repost icon → **Repost sa followers mo** (public posts lang, hindi sariling post) |
| Share link | Tap ang send icon → ibang app (phone) o **Copy link**. Link: `app/explore.html?post=<id>` |
| Bookmark | Tap ang bookmark. Makikita sa **Profile → Saved** |
| Status | **+** sa "Status mo" → photo/video → caption → I-share. Nawawala pagkalipas ng 24 oras |
| Follow | Follow button sa post, sa Suggestions, o sa profile ng tao |

Tabs: **Para sa iyo** (public ng lahat + followers-only ng fina-follow mo) at **Following** (posts at reposts ng fina-follow mo lang).

## Files
| File | Trabaho |
|---|---|
| `app/explore.html`, `assets/js/pages/explore.js`, `assets/css/pages/explore.css` | Explore: status bar, tabs, feed, search, suggestions |
| `assets/js/components/post-card.js` | `TMN_POST_CARD`: feed card + reactions/comment/share/bookmark buttons |
| `assets/js/components/social-ui.js` | `TMN_SOCIAL`: comments, sino ang nag-react/share, share menu, follow, mini profile |
| `assets/js/components/stories.js` | `TMN_STORIES`: status bar, viewer, pag-add ng status |
| `assets/css/social.css` | Styles ng lahat ng nasa itaas |
| `assets/js/components/post-viewer.js` | May reactions row na rin pag binuksan ang post sa Profile |
| `assets/js/pages/profile.js` | **Saved** tab, Followers/Following list |
| `backend/posts-fast.ts` (v2) | + getPost, userPosts, react, reactions, comments, addComment, deleteComment, bookmark, bookmarks, share, unrepost, shares; may `stats` na bawat post |
| `backend/social-fast.ts` | follow, unfollow, people, profile, followList, stories, storyUpload, createStory, viewStory, storyViewers, deleteStory |
| `sql/017-social.sql` | `post_reactions`, `post_comments`, `post_bookmarks`, `post_shares`, `stories`, `story_views` |

## Rules (server)
- Isang reaction bawat tao bawat post (pwedeng palitan). 6 na emoji lang.
- Comment: 1–500 characters, max 10 bawat minuto.
- Repost: public posts lang, isang beses lang bawat tao.
- Lahat ng action ay sinusuri kung pwede mong makita ang post (`canSee`): private/followers-only ay hindi makikita ng iba.
- Status: photo ≤2 MB / video ≤15 s at ≤12 MB, max 30 bawat araw. Nasa private bucket `post-media/<user>/stories/`. Ang mga expired ay binubura pag nag-post ka ulit ng status.
- Sa sariling status lang makikita kung sino ang nanood.

## Known limits / hindi pa na-test
- Hindi pa na-test sa totoong Supabase mula sa sandbox (naka-mock sa test, 46/46). **Unang subok: gumawa ng 2nd account, i-follow, mag-react at mag-comment.**
- Walang notifications pa (hal. "may nag-like sa post mo").
- Ang expired na status ng ibang tao ay hindi pa kusang nabubura sa storage (mabubura pag nag-status ulit sila).
- Walang reply sa comment at walang like sa comment.

Tingnan din: [[Build - Offline posts]], [[Build - Profile edit]], [[System map]]
