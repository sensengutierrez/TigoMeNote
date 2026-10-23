---
tags: [build]
updated: 2026-10-23
---
# Build - Gallery and albums

**What it does:** Photos at videos sa **device lang** (hindi ina-upload). Upload, Camera, drag & drop, albums, viewer, caption, move, download, delete, at **photo editor**.

**Pages:** `app/gallery.html` (bagong menu item "Gallery", nasa bottom tabs din), `app/share.html` (gumagana na ang 3 tiles)
**Shared code:** `assets/js/media-store.js`, `assets/js/components/modal.js`, `assets/js/components/photo-editor.js`
**Page code:** `assets/js/pages/gallery.js`, `assets/js/pages/share.js` · **Styles:** `assets/css/pages/gallery.css`, editor at modal styles sa `components.css`
**Server:** wala. Walang edge function o table.

## Saan naka-save
- **IndexedDB** ng browser, database na `tmn-media-<user id>` (hiwalay bawat account sa iisang device).
- Stores: `albums` (id, name) at `items` (id, type photo/video, albumId, blob, thumb 480 px, w, h, duration, caption, createdAt, editedAt).
- Hinihingi ang `navigator.storage.persist()` para hindi kusang burahin ng browser.
- Kapag manual na binura ang browser data, **mabubura** rin ang laman. May Download button para mag-backup.
- Sa APK (mamaya): sariling folder na `TigoMeNote` sa phone.

## Features
| Feature | Paano |
|---|---|
| Upload | Button (multiple), Camera (phone), drag & drop (desktop) |
| Albums | New, Rename, Delete (itira ang laman o burahin lahat), "Walang album" |
| Filter | All / Photos / Videos |
| Select | Select all, Move to album, Download, Delete |
| Viewer | Full screen, ← → keys, swipe sa phone, caption, palit ng album |
| Edit (photo) | Crop (Free, 1:1, 4:5, 16:9, 9:16, may handles), Rotate L/R, Flip, Brightness/Contrast/Saturation, Filters (Vivid, Warm, Cool, Mono, Fade). **Save** (palitan) o **Save as copy** |
| Video | Thumbnail + duration badge, play sa viewer (walang trim pa) |

## Paano gumagana ang editor
- Preview: CSS `filter` sa canvas (mabilis).
- Save: full resolution na canvas, i-rotate/flip, i-crop, tapos `ctx.filter`; kung walang suporta (lumang Safari), pixel math gamit ang color matrices.
- Output: JPEG 92%.

## Known limits / hindi pa na-test
- Hindi pa na-test sa totoong phone (camera capture, HEIC ng iPhone, malalaking video).
- HEIC na hindi kaya ng browser: ma-save pero walang thumbnail at hindi ma-edit.
- Walang video trim.
- Walang sync sa ibang device (sinadya: device lang).

Tingnan din: [[Build - Weather]], [[System map]], [[Decisions]]
