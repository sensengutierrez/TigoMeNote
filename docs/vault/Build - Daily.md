# Build - Daily

Ang unang page (`app/home.html`): bati, weather, at ang Daily mismo.

## Notes (nasa device lang)
- `daily-store.js` (IndexedDB `tmn-daily-<user>`): `notes` (id, day "YYYY-MM-DD", kind note/todo, text, items, photos = id ng Gallery, pinned) at `moods` (day → emoji).
- `components/daily-notes.js`: composer (sulat, ✓ to-do, 📷 photo → Gallery ng device), listahan ng araw (pinned muna), check ng to-do, Pin/Edit/Share to Explore/Delete, mood row. Ctrl+Enter = Save.
- Hindi ina-upload. Ang "Share to Explore" lang ang nag-a-upload (sa post composer, pipili ka pa).

## Araw at calendar
- **This week**: pindutin ang araw → notes ng araw na iyon ("Adding to …" sa composer). Tuldok/emoji kapag may notes/mood.
- **Calendar** (`mini-calendar.js`): buwan; tuldok = notes, emoji = mood, 🔔 = reminder; "Today" at "Reminder on this day".
- **✨ On this day**: notes sa parehong petsa noong nakaraang buwan/taon (`TMN_DAILY.onThisDay`).

## Reminders & alarms
- Server: table `reminders` (sql/050) + `daily-fast`. Ulitin: none/daily/weekly/monthly. Max 100 na active.
- Cron `tmn-reminders` bawat minuto → `daily-fast` `due` (key `cron_daily` galing sa `app_keys`, ginawa ng SQL; walang secret sa notes) → web push sa lahat ng device ng user (VAPID ng safety-fast). Umuulit = lilipat sa susunod na oras.
- `sw.js`: alarm = `requireInteraction` + mahabang vibrate; reminder = maikling vibrate. Pindot = `home.html?reminder=<id>` → tumutunog sa page.
- Bukas ang page: `reminders.js` tumitingin bawat 10 s at kapag may push → chime (Web Audio); alarm = paulit-ulit hanggang Stop; Snooze 10 min / Done.
- Sa APK (susunod): totoong alarm ng phone kahit naka-silent at sarado ang app.

## Pinas ⇄ dito (`home-clock.js`)
- Oras sa 🇵🇭 at sa time zone ng device (o 🇧🇭 kung nasa Pinas ka). "Good time to call" kapag 8 AM–10 PM sa kabila.

## Hindi pa na-test
- Mock lang ang UI (20/20 sa test_daily). Live: tumatakbo ang cron (`sent: 0`). Hindi pa nasubukan ang totoong push ng reminder sa phone at ang tunog sa iPhone.

Tingnan din: [[Build - Gallery and albums]], [[Build - Notifications]], [[System map]]
