# Build - Explore activity

Explore post na parang Komoot: ang nilakbay mo sa mapa (Start → Finish), may photos/videos at stats. Kasama rin dito ang buong-screen na viewer ng photo/video.

## Paano gumawa
- Explore → **Create** → **Explore** (o Share → **Explore** tile).
- Route:
  - **Record now** (`activity-recorder.js`): GPS (`watchPosition`, mataas na accuracy). Hindi kinukuha ang point kapag ±40 m pataas ang accuracy o hindi pa gumagalaw (≥4 m). Pause/Resume/Finish/Discard. Naka-save sa `localStorage` (`tmnTrack`) habang nagre-record, kaya puwedeng ituloy kahit ma-refresh. Wake Lock para hindi mag-lock ang screen.
  - **Import GPX**: `trkpt` / `rtept` / `wpt`, may `ele` at `time` kung meron. Pangalan ng track = pamagat.
  - **From my location history**: `safety-fast` → `history` (sariling location, hanggang 30 araw), sinasala ayon sa araw at oras.
- Detalye: uri (Hike, Walk, Run, Bike ride, Drive, Trip), pamagat, oras kung walang time sa GPX, photos/videos (hanggang 10, hindi required).
- Tuloy sa post composer (caption, sino ang makakakita, schedule) → offline queue → `posts-fast` `createPost` na may `activity`. Walang photo = hindi na tinatawag ang `createUpload`.

## Data
- `posts.activity` (jsonb, sql/046): `{ type, title, route: [[lat,lng,ele]], stats: { dist_m, dur_s, up_m, down_m }, start_at }`.
- Ang route ay pinapaikli sa browser (Douglas–Peucker, ≤800 points); ang server ay tumatanggap ng ≤1000, nagra-round sa 5 decimal, at kinukuwenta ulit ang distance.
- Elevation gain: binibilang lang ang pagbabago na ≥3 m (iwas ingay ng GPS).

## Itsura
- Feed card: "<pangalan> went for a hike", pamagat, caption, stats, photos + maliit na mapa sa sulok (o mapa lang kung walang photo).
- Static na mapa (`TMN_ROUTE.svg`): OpenStreetMap tiles + guhit, berdeng Start at pulang Finish, "© OpenStreetMap".
- Profile grid: mapa ang tile kung walang photo, may 🗺 sa sulok. Post viewer: pamagat, stats, at mapa.

## Buong-screen na viewer (`media-viewer.js`)
- Tap sa photo/video (feed, post viewer) o sa mapa → `TMN_VIEWER.open(items, index)`.
- Buo ang photo/video (`object-fit: contain`), itim ang likod, **X** sa itaas (46px). Swipe o ← → para sa susunod, Esc o Back ng phone = sara (`history.pushState`).
- Double-tap sa feed ay ❤️ pa rin (hinihintay ng 280 ms bago buksan ang viewer).
- Mapa: Leaflet (zoom/drag); kung offline, ang static na mapa ang makikita.

## Hindi pa na-test
- Lahat ay mock (34/34 sa test_activity). Hindi pa nasubukan: totoong GPS habang naglalakad, totoong OSM tiles at Leaflet (hindi abot ng test sandbox), totoong GPX mula Komoot/Strava, at pag-post sa totoong server.
- Sa browser, tumitigil ang GPS kapag naka-lock ang phone o nasa ibang app. Sa APK, kailangan ng native na background recording para dito (wala pa).

Tingnan din: [[Build - Social feed]], [[Build - Safety and wellbeing]], [[System map]]
