---
tags: [build]
updated: 2026-10-23
---
# Build - Offline posts (queue + schedule)

**What it does:** Pumili ng photo/video (kahit **offline**), lagyan ng caption, piliin kung sino ang makakakita at kung **kailan** lalabas. Naka-pila muna sa device; **kusang ia-upload pag may internet na**. Ang server ang magpapalabas sa naka-schedule na oras.

**Saan pinipindot:** Gallery → Select → **Post** (hanggang 10), o sa viewer ng isang photo → **Post**. Sa Share: i-check ang **"I-post din"** bago kumuha ng photo/video.
**Makikita:** Profile (Naka-pila sa device + Posts mo, may filter na Scheduled), Explore (feed).

## Files
| File | Trabaho |
|---|---|
| `assets/js/post-queue.js` | `TMN_POSTQ`: compress, outbox sa IndexedDB, auto-upload, retry |
| `assets/js/components/post-composer.js` | `TMN_COMPOSER.open(items)`: caption, visibility, schedule |
| `assets/js/components/post-viewer.js` | `TMN_POSTS_UI`: grid tiles + viewer + Edit/Delete |
| `assets/css/posts.css` | Styles ng composer, tiles, viewer, queue |
| `assets/js/pages/profile.js`, `explore.js`, `gallery.js`, `share.js` | Ginagamit ang nasa itaas |
| `backend/posts-fast.ts` | Edge function (createUpload, createPost, myPosts, feed, updatePost, deletePost) |
| `sql/013-posts.sql` | Tables `posts`, `post_media`, `follows` + private bucket `post-media` |

## Daloy
1. **Compose** → kino-compress sa device: photo → JPEG max **1600 px** (q 0.82, ≤1.8 MB); video → **720p, 1.5 Mbps, unang 15 s lang** (MediaRecorder). Kung hindi kaya ng browser at maliit na ang original (≤15 s, ≤12 MB), original na lang.
2. **Outbox**: IndexedDB `tmn-outbox-<user id>`, store `outbox`. Status: `queued` → `uploading` → `done` (o `error`).
3. **Auto-upload** kapag: may internet ulit (`online` event), binuksan ang page, bumalik sa tab, at bawat 45 s. Tumatakbo sa **lahat ng app pages** (kasama ang `post-queue.js`).
4. `createUpload` → signed upload URL bawat file → `PUT` ng file → `createPost` (retry kung 409 "hindi pa tapos ang upload").
5. **Walang doble**: may `client_id` bawat post (unique sa server). Kahit maputol at ulitin, iisang post lang.
6. Pagka-`done`: binubura ang malalaking file sa outbox; ang record ay inaalis pagkalipas ng 24 oras.
7. Error: backoff 15 s → hanggang 10 min. May **Retry** at **Cancel** sa Profile. Kapag 401 (expired session), hihinto hanggang mag-login.

## Visibility
| Pili | Sino |
|---|---|
| Public | Lahat (Explore) |
| Followers | Mga naka-follow sa iyo (`follows` table; wala pang Follow button) |
| Ako lang | Ikaw lang |

## Schedule
- Pinipili ang petsa/oras sa composer (hanggang 1 taon). Kailangang **na-upload bago ang oras** (kahit offline ka sa mismong oras, okay).
- Sa feed, lumalabas lang kapag `publish_at <= ngayon`. Sa Profile mo, kita mo agad na may badge na oras.
- Sa Edit: palitan ang caption, visibility, oras, o "Ipalabas ngayon".

## Limits (sa server, `posts-fast`)
10 file bawat post · photo ≤2 MB · video ≤12 MB at ≤15.5 s · 40 file bawat araw bawat user · hihinto sa 850 MB na total (free plan = 1 GB) · signed read URL 1 oras.

## Known limits / hindi pa na-test
- Hindi pa na-test sa totoong Supabase mula sa sandbox (naka-mock ang posts-fast at storage sa test). **Unang totoong post: tingnan sa Profile kung "Na-post".**
- Hindi pa na-test sa totoong phone (iPhone MP4, Android camera, malalaking video, HEIC).
- Ang video compression ay real-time (15 s na video ≈ 15 s na hintay); huwag isara ang page habang "Kino-compress".
- Kung walang permiso sa tunog ang browser, walang audio ang na-compress na video.
- Ang outbox ay nasa browser lang: kapag binura ang site data bago ma-upload, mawawala ang naka-pila.
- Wala pang Follow button, likes, o comments.
- Video tile sa grid: unang frame (walang hiwalay na thumbnail sa server).

Tingnan din: [[Build - Gallery and albums]], [[System map]], [[Decisions]]
