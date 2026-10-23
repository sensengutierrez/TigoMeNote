-- TigoMeNote · 012 · vault sync: gallery + weather (record lang; napatakbo na)
insert into public.brain_notes (title, body, tags, updated_by) values ('Build - Gallery and albums', $md$---
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
$md$, '{build}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
insert into public.brain_notes (title, body, tags, updated_by) values ('Build - Weather', $md$---
tags: [build]
updated: 2026-10-23
---
# Build - Weather (Daily)

**What it does:** Weather card sa Daily na **kusang nakaka-detect ng lokasyon**: Bahrain kung nasa Bahrain, Pilipinas kung nasa Pinas. Ngayon + 5 araw na forecast.

**Files:** `assets/js/components/weather.js`, `app/home.html` (`#weather`), `assets/js/pages/daily.js`, `assets/css/pages/daily.css`
**Server:** wala. Diretso ang browser sa libreng APIs (walang API key):
| Ano | API |
|---|---|
| Forecast | Open-Meteo `api.open-meteo.com/v1/forecast` |
| Pangalan ng lugar (mula GPS) | BigDataCloud `reverse-geocode-client` |
| Location kapag walang GPS | `ipapi.co/json` → fallback `get.geojs.io` |

## Daloy
1. Kung pinayagan ang location: **GPS ng device** (eksakto).
2. Kung hindi pinayagan / walang GPS: **approximate mula sa IP** (city level). May "Gamitin ang GPS" link.
3. Forecast: temperature °C, feels like, humidity, wind km/h, chance of rain, 5 araw.
4. **Cache 30 minuto** (`localStorage` `tmnWeather`). Kapag lumipat ng lugar (>25 km), kukuha ulit.
5. Desktop: nasa side panel (itaas). Phone: nasa itaas ng feed.

Kasama rin: ang "Today" card sa Daily ay bumibilang na ng **photos at videos ngayong araw** mula sa Gallery.

## Known limits / hindi pa na-test
- Hindi pa na-test ang totoong APIs mula sa sandbox (naka-mock sa test).
- Kapag VPN, ang IP location ay maaaring ibang bansa.
- Ang ipapi.co ay may limit (~1,000/araw bawat IP), kaya may cache at fallback.

Tingnan din: [[Build - Gallery and albums]], [[System map]]
$md$, '{build}', 'claude') on conflict (lower(title)) do update set body = excluded.body, updated_at = now();
update public.brain_notes set updated_at = now(), body = replace(body, $a$- **Paano:** `<div class="layout">` = main + aside sa kanan (340 px, 380 px sa ≥1500 px). Sa phone, isang column lang (aside sa ilalim).
$a$, $b$- **Paano:** `<div class="layout">` = main + aside sa kanan (340 px, 380 px sa ≥1500 px). Sa phone, isang column lang (aside sa ilalim).

## 2026-10-23 · #11 Gallery + albums + photo editor
- **Ano:** Bagong page na **Gallery**: upload/camera/drag-drop, albums, viewer, caption, move, download, delete, at photo editor (crop, rotate, flip, adjust, filters). Gumagana na rin ang Share tiles (sine-save sa napiling album).
- **Bakit:** Hiling ni Bench: albums para ma-organize ang photos/videos, may upload at edit.
- **Files:** `app/gallery.html`, `assets/js/media-store.js`, `assets/js/components/modal.js`, `assets/js/components/photo-editor.js`, `assets/js/pages/gallery.js`, `assets/css/pages/gallery.css`, `app/share.html`, `assets/js/pages/share.js`, `assets/css/pages/share.css`, `assets/css/components.css`, `assets/js/icons.js`, `assets/js/nav-items.js`
- **Paano:** Lahat ay nasa device (IndexedDB), walang server. Detalye: [[Build - Gallery and albums]].

## 2026-10-23 · #12 Weather sa Daily (auto location)
- **Ano:** Weather card na kusang nakaka-detect ng lokasyon (GPS, o IP kung walang GPS). Ngayon + 5 araw.
- **Bakit:** Hiling ni Bench: "sample nasa Bahrain automatic, kung nasa Pinas automatic".
- **Files:** `assets/js/components/weather.js`, `app/home.html`, `assets/js/pages/daily.js`, `assets/css/pages/daily.css`
- **Paano:** Open-Meteo + BigDataCloud + ipapi.co (libre, walang key), cache 30 min. Detalye: [[Build - Weather]].
$b$) where title = 'Change log';
update public.brain_notes set updated_at = now(), body = replace(body, $a$| `profile.html` | app/ | Profile | oo |$a$, $b$| `gallery.html` | app/ | Gallery: albums, upload, edit (device lang) | oo |
| `profile.html` | app/ | Profile | oo |$b$) where title = 'System map';
update public.brain_notes set updated_at = now(), body = replace(body, $a$| `share.html` | app/ | Share (placeholder) | oo |$a$, $b$| `share.html` | app/ | Share: camera / video / files → Gallery | oo |$b$) where title = 'System map';
update public.brain_notes set updated_at = now(), body = replace(body, $a$| `nav-items.js` | **Ang menu** (sidebar, hamburger, bottom tabs) |$a$, $b$| `nav-items.js` | **Ang menu** (sidebar, hamburger, bottom tabs) |
| `media-store.js` | Photos/videos/albums sa device (IndexedDB) |
| `components/modal.js` | Modal, confirm, prompt (iisa sa buong site) |
| `components/photo-editor.js` | Crop, rotate, flip, adjust, filters |
| `components/weather.js` | Weather card + auto location |$b$) where title = 'System map';
update public.brain_notes set updated_at = now(), body = replace(body, $a$## Paano dumadaloy ang isang private page$a$, $b$## External (libre, walang key)
Open-Meteo (forecast), BigDataCloud (reverse geocode), ipapi.co / geojs.io (IP location), Brevo (email, server-side).

## Paano dumadaloy ang isang private page$b$) where title = 'System map';
update public.brain_notes set updated_at = now(), body = replace(body, $a$| 2026-10-23 | Lipat sa **Brevo** (free 300/araw) |$a$, $b$| 2026-10-23 | **Desktop/laptop = full UI/UX** (buong lapad) | Rule ni Bench |
| 2026-10-23 | **Gallery sa device lang** (IndexedDB), walang upload | Tugma sa "sa device mag-save"; walang gastos sa server storage |
| 2026-10-23 | Weather: **Open-Meteo** + GPS/IP auto-detect | Libre, walang API key |
| 2026-10-23 | Lipat sa **Brevo** (free 300/araw) |$b$) where title = 'Decisions';
update public.brain_notes set updated_at = now(), body = replace(body, $a$- [[Build - Forgot password]] — reset ng password gamit ang code sa email$a$, $b$- [[Build - Forgot password]] — reset ng password gamit ang code sa email
- [[Build - Gallery and albums]] — photos/videos sa device, albums, editor
- [[Build - Weather]] — weather sa Daily, auto Bahrain/Pinas$b$) where title = '00 Home';
update public.brain_notes set updated_at = now(), body = replace(body, $a$
Hindi bug (para hindi na hanapin ulit):$a$, $b$- 2026-10-23 · Daily: "Gamitin ang GPS" mukhang gray na kahon → ang `.link-btn` style ay nasa `auth.css` lang (login) → inilipat sa `components.css`

Hindi bug (para hindi na hanapin ulit):$b$) where title = 'Fix log';
