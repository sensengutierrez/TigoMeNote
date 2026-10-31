---
tags: [build]
updated: 2026-10-31
---
# Build - Native music and phone gallery (v0.11.26, APK lang)

**Native code:** `apk/native/` (MusicEngine, MusicService, MusicWidget, TmnNative + res) — kinokopya ng `apk/patch-android.py` sa main, Chat at Tigo. JS: `window.Capacitor.Plugins.TmnNative`.

## Music
- Profile → My music (`components/music-native.js`, kapag nasa APK; web = `music-player.js` pa rin).
- Kanta: Add songs → file picker ng Android → kinokopya sa loob ng app (`filesDir/music`), hindi ina-upload. Bawat app may sariling playlist.
- Tuloy-tuloy kahit lumipat ng page / naka-lock (foreground service, MediaSession): notification at lock screen controls.
- Widget: home screen → Widgets → "Tigo music" (Prev / Play-Pause / Next).

## Gallery ng phone
- Gallery page (APK): card na "Phone gallery" = mga folder ng phone (MediaStore). Pumili ng items → **Post / schedule** (composer, offline queue, may petsa/oras) o **Save to app gallery**.
- Hindi kusang ina-upload ang lahat; ang upload ay kapag pinili at nag-Post (o naka-schedule).

## Hindi pa na-test sa totoong phone
- Lahat ng nasa itaas. Na-compile lang sa GitHub Actions.
- Walang background upload kapag sarado ang app (ia-upload kapag binuksan o may internet).
