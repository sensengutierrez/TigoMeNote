/* TigoMeNote · daily-store.js — Daily notes na naka-save sa DEVICE lang (IndexedDB), hindi ina-upload
     await TMN_DAILY.list(day)            → notes ng araw na iyon (pinned muna, tapos pinakabago)   day = "YYYY-MM-DD"
     await TMN_DAILY.month("YYYY-MM")     → { "YYYY-MM-DD": { notes, mood } }  (para sa calendar)
     await TMN_DAILY.add(note) / update(id, changes) / remove(id)
     await TMN_DAILY.mood(day) / setMood(day, emoji)
     await TMN_DAILY.onThisDay(day)       → notes sa parehong petsa noong nakaraang mga buwan/taon
     TMN_DAILY.dayKey(date)               → "YYYY-MM-DD" (oras ng device)
   note = { id, day, kind: "note"|"todo", text, items: [{ t, done }], photos: [mediaId], pinned, createdAt, updatedAt }
   Ang photos ay nasa Gallery ng device (media-store.js); id lang ang naka-save dito. Hiwalay bawat account. */
(function () {
  var dbp = null;
  function pad(n) { return String(n).padStart(2, "0"); }
  function dayKey(d) { d = d ? new Date(d) : new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      var r = indexedDB.open("tmn-daily-" + ((window.TMN_USER || {}).id || "guest"), 1);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains("notes")) { var s = d.createObjectStore("notes", { keyPath: "id" }); s.createIndex("day", "day"); }
        if (!d.objectStoreNames.contains("moods")) d.createObjectStore("moods", { keyPath: "day" });
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { dbp = null; rej(r.error); };
    });
    return dbp;
  }
  function tx(store, mode, fn) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(store, mode), out = {};
        fn(t.objectStore(store), out);
        t.oncomplete = function () { res(out.v); };
        t.onerror = function () { rej(t.error); };
        t.onabort = function () { rej(t.error || new Error("Device storage is full.")); };
      });
    });
  }
  function all() { return tx("notes", "readonly", function (s, o) { var r = s.getAll(); r.onsuccess = function () { o.v = r.result || []; }; }); }
  function sort(l) { return l.sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt; }); }
  function changed() { document.dispatchEvent(new CustomEvent("tmn:daily")); }

  function list(day) {
    return tx("notes", "readonly", function (s, o) { var r = s.index("day").getAll(day); r.onsuccess = function () { o.v = sort(r.result || []); }; });
  }
  async function month(ym) {
    var out = {}, notes = await all(), moods = await tx("moods", "readonly", function (s, o) { var r = s.getAll(); r.onsuccess = function () { o.v = r.result || []; }; });
    notes.forEach(function (n) { if (n.day.slice(0, 7) === ym) (out[n.day] = out[n.day] || { notes: 0, mood: null }).notes++; });
    moods.forEach(function (m) { if (m.day.slice(0, 7) === ym) (out[m.day] = out[m.day] || { notes: 0, mood: null }).mood = m.mood; });
    return out;
  }
  function clean(n) {
    return {
      kind: n.kind === "todo" ? "todo" : "note",
      text: String(n.text || "").slice(0, 4000),
      items: (n.items || []).slice(0, 50).map(function (x) { return { t: String(x.t || "").slice(0, 200), done: !!x.done }; }).filter(function (x) { return x.t.trim(); }),
      photos: (n.photos || []).slice(0, 10)
    };
  }
  async function add(n) {
    var now = Date.now();
    var note = Object.assign({ id: "d" + now.toString(36) + Math.random().toString(36).slice(2, 6), day: n.day || dayKey(), pinned: false, createdAt: now, updatedAt: now }, clean(n));
    await tx("notes", "readwrite", function (s) { s.put(note); });
    changed(); return note;
  }
  async function update(id, ch) {
    var cur = await tx("notes", "readonly", function (s, o) { var r = s.get(id); r.onsuccess = function () { o.v = r.result; }; });
    if (!cur) return null;
    var next = Object.assign({}, cur, ch.text !== undefined || ch.items !== undefined || ch.photos !== undefined || ch.kind !== undefined ? clean(Object.assign({}, cur, ch)) : {},
      ch.pinned !== undefined ? { pinned: !!ch.pinned } : {}, { updatedAt: Date.now() });
    await tx("notes", "readwrite", function (s) { s.put(next); });
    changed(); return next;
  }
  async function remove(id) { await tx("notes", "readwrite", function (s) { s.delete(id); }); changed(); }
  function mood(day) { return tx("moods", "readonly", function (s, o) { var r = s.get(day); r.onsuccess = function () { o.v = r.result ? r.result.mood : null; }; }); }
  async function setMood(day, m) {
    await tx("moods", "readwrite", function (s) { if (m) s.put({ day: day, mood: m }); else s.delete(day); });
    changed();
  }
  // "On this day": parehong araw noong nakaraang mga buwan at taon (hindi kasama ngayon)
  async function onThisDay(day) {
    var dd = day.slice(8), md = day.slice(5);
    var l = (await all()).filter(function (n) { return n.day !== day && (n.day.slice(5) === md || n.day.slice(8) === dd) && n.day < day; });
    return l.sort(function (a, b) { return a.day < b.day ? 1 : -1; }).slice(0, 6);
  }

  window.TMN_DAILY = { list: list, month: month, add: add, update: update, remove: remove, mood: mood, setMood: setMood, onThisDay: onThisDay, dayKey: dayKey };
})();
