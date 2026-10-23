---
tags: [build]
updated: 2026-10-23
---
# Build - Profile edit (cover + photo)

**What it does:** Sa Profile: **Edit profile** (pangalan, bio), **profile photo** (bilog) at **cover photo / banner** (3:1). May crop bago i-upload: i-drag para iusog, slider / scroll / pinch para mag-zoom. Pareho sa desktop at phone.

**Saan pinipindot:** Profile → camera button sa photo, **Cover** button sa banner, o **Edit profile** (nandoon din ang Palitan / Alisin ng dalawang larawan).

## Files
| File | Trabaho |
|---|---|
| `app/profile.html` | Bagong hero: full-width na cover, malaking photo, pangalan, bio, stats |
| `assets/css/pages/profile.css` | Hero + Edit profile modal |
| `assets/js/pages/profile.js` | Pinapakita ang profile; Palitan/Alisin menu; kinukuha ang followers/following |
| `assets/js/components/profile-editor.js` | `TMN_PROFILE_EDIT`: Edit modal, changePhoto, removePhoto |
| `assets/js/components/image-cropper.js` | `TMN_CROPPER.open(file, {aspect})`: crop → JPEG |
| `assets/css/components.css` | Cropper + `.pick` list styles (shared) |
| `assets/js/auth-guard.js` | Bagong `TMN_AUTH.setUser(u)`: ina-update ang naka-save na user at ang menu |
| `backend/profile-fast.ts` | Edge function: get, update, imageUpload, setImage, removeImage |
| `sql/015-profile.sql` | `users.banner_url`, `avatar_path`, `banner_path` + bucket `profile-media` |

## Daloy ng palit ng larawan
1. Pili ng file → crop (photo 600×600, cover 1500×500, JPEG ~88%).
2. `imageUpload` → signed upload URL → `PUT` ng JPEG.
3. `setImage` → sinisigurong nandoon ang file → ina-update ang `users` → **binubura ang lumang file**.
4. `TMN_AUTH.setUser()` → nag-a-update ang Profile at ang user card sa menu agad.

## Rules (server)
Pangalan 1–40 characters · bio hanggang 300 · larawan max 3 MB · 20 palit bawat oras · path ay laging `<user id>/avatar-…` o `<user id>/banner-…`.

## Bakit public ang bucket
Ang profile photo at cover ay talagang makikita ng ibang users (Explore, Messages mamaya). Public link = mabilis at naka-cache. Ang **upload** ay dumadaan pa rin sa `profile-fast` (signed URL), kaya walang makakapag-upload nang walang login.

## Known limits / hindi pa na-test
- Hindi pa na-test sa totoong Supabase mula sa sandbox (naka-mock sa test). **Unang subok: palitan ang cover sa Profile.**
- Hindi pa napapalitan ang **username** (sinadya muna).
- HEIC (iPhone) na hindi kaya ng browser: hindi mabubuksan sa crop.
- Ang `checkSession` ng auth-fast ay hindi pa nagbabalik ng `banner_url`; ang Profile page ang kumukuha nito sa `profile-fast`.

Tingnan din: [[Build - Offline posts]], [[System map]]
