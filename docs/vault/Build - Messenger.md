---
tags: [build, messenger, chat]
updated: 2026-10-24
---
# Build - Messenger

**What it does:** **Tigo Messenger**: 1:1 at group chat, text, photo, location (may mapa at Directions), reactions, pin (hal. location sa itaas ng chat), Seen, "typing…", Message requests, unsend, report, mute. Sa web: nasa loob ng TigoMeNote (Messages). Sa phone (APK): **hiwalay na app** na Tigo Messenger.

**Page:** `app/messages.html` (Messages sa menu; may bilang ng bago) · links: `messages.html?c=<chat>` at `messages.html?to=<user>` (galing sa **Message** button sa profile ng iba)
**Code:** `assets/js/pages/messages.js` (inbox, Chats/Requests, search, APK gate), `components/chat-view.js` (isang chat), `components/chat-new.js` (bagong chat/group, pumili ng tao), `realtime.js` (live ping), `native-bridge.js` (`messenger`), `notif-badge.js` (bilang), `components/notif-settings.js` (Messages setting)
**Styles:** `assets/css/pages/messages.css`
**Server:** `messages-fast` v3, `gifs-fast` v1 (+ `moderation.ts`), `notify-fast` v2 (`pushRaw`), `moderation-fast` v3 (report ng message)
**SQL:** `sql/033-messages.sql` (napatakbo na): `conversations`, `conversation_members`, `messages`, `message_reactions`, `notif_prefs.messages`, report type `message`, private bucket `chat-media`

## Sino ang puwedeng mag-message
- Kahit sino, pero kung **hindi ka nila fina-follow** (o wala ka sa Family/Friends nila), mapupunta muna sa **Requests**. Doon: Accept, Delete o Report. Ang pag-reply = pagtanggap.
- **Teen (13–17):** mutual followers at Family/Friends lang (pareho sa pagpapadala at pagtanggap).
- Group: 3–50 tao; ang gumawa ang admin. Admin: Add people, Remove, Pin. Lahat: Rename, Mute, Leave (kapag umalis ang huling admin, may bagong admin).
- Lahat ng text ay dumadaan sa text filter (block/flag) at sa teen rules (bawal ang phone, email, ibang app).

## Emoji at stickers
- **Emoji picker** (`components/emoji-picker.js`): ☺ button sa chat, comments at caption. Tabs: Recent, ✨ New (Unicode 14–16), Smileys, People, Hearts, Animals, Food, Activities, Travel, Objects, Flags. Naaalala ang huling ginamit (sa device).
- **Hindi na kahon:** Noto Color Emoji (Google Fonts) ang fallback na font sa bawat page.
- **Reactions:** 6 na mabilis + **(+)** para sa kahit anong emoji (server: isang emoji lang, `isEmoji`).
- **Stickers** (`stickers.js`): 20 "Tigo" stickers na SVG; message `kind = 'sticker'`, `body` = sticker id. Walang upload; walang text filter (fixed ang laman).

## GIFs (KLIPY)
- **GIF** tab sa emoji picker ng chat: trending + search, GIFs o Stickers ng KLIPY. Ipinapadala bilang message `kind = 'gif'`, `body` = KLIPY link (server: KLIPY link lang ang tinatanggap).
- Server: `gifs-fast` (trending, search). Ang key ay Supabase secret **`KLIPY_API_KEY`** (hindi sa code o GitHub). Kung wala pa: "GIFs are coming soon."
- Kaligtasan: teen = rating `g`, iba = `pg-13`; ang user id ay hindi ipinapadala sa KLIPY (hash lang). Ang ads ng KLIPY ay hindi ipinapakita.
- Limit: may limit ang requests hangga't walang **production access** (form sa KLIPY Panel). May 5 minutong cache sa server.

## Paano gumagana
- **Live:** Supabase Realtime (broadcast) sa lihim na channel bawat chat (`channel_key`). "Ping" lang ang dumadaan (walang laman ng message); ang browser ang kumukuha sa server. "typing…" ay diretso sa channel. Kapag hindi konektado: poll bawat 4 s habang bukas ang chat.
- **Iwas loop:** ang "read" ping ay ipinapadala lang kapag may bagong nabasa; hindi pinapansin ng browser ang sariling "read" at may 3 s na pagitan. Ang link ng photo ay hindi pinapalitan bawat refresh (para hindi mag-reload ang larawan).
- **Seen:** `last_read_at` bawat member. DM: "Seen"/"Sent"; group: "Seen by N" / "Seen by everyone".
- **Photo:** compress (gaya ng posts), signed upload sa `chat-media`, signed URL (1 oras).
- **Location:** kasalukuyang GPS (may tanong muna), card na may **View map** (Leaflet) at **Directions**. Puwedeng i-**pin** para laging nasa itaas.
- **Push:** bawat message (hindi naka-save sa Notifications), sinusunod ang **Messages** setting, Pause all, Sleep mode at Mute ng chat. Hindi lumalabas kung nakabukas na ang chat na iyon.

## Tigo Messenger sa APK (hiwalay na app)
- Sa **TigoMeNote APK**, ang Messages ay hindi nagbubukas ng chat: tinitingnan kung naka-install ang **Tigo Messenger** (`TMN_APP.hasApp("messenger")`). Kung oo → `openApp("messenger", "?c=…")`; kung hindi → **Install Tigo Messenger** (`installApp`, Play Store).
- Ang **Tigo Messenger APK** ay parehong web code (`app/messages.html`) na may `TMN_APP.appName = "messenger"`; parehong account (session token).
- Push sa APK: FCM (kapag may Firebase project na), papunta sa Tigo Messenger app.

## Hindi pa na-test
- Lahat ay naka-mock (60/60 messenger: desktop, phone, Arabic, APK gate). Hindi pa nasubukan sa totoong server: pagpapadala, real-time (Realtime broadcast gamit ang publishable key), push ng message, Seen, requests at teen rules.
- Wala pang APK (Tigo Messenger at FCM).

Tingnan din: [[Build - Notifications]], [[Build - Moderation and policies]], [[System map]]
