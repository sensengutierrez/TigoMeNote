/* TigoMeNote · components/daily-notes.js — sumulat at tingnan ang Daily notes (nasa device lang)
     var d = TMN_DAILY_UI.mount({ composer: el, list: el, mood: el })
     d.setDay("YYYY-MM-DD")    → ipakita ang notes ng araw na iyon (galing sa calendar o "This week")
   Composer: sulat, ✓ To-do (bawat linya = isang item), 📷 photo (naka-save sa Gallery ng device), Save.
   Note: Pin, Edit, Share to Explore (kung may photo), Delete. Checklist: tap para ma-check.
   Mood ng araw: emoji row. Kailangan: daily-store.js, media-store.js, modal.js; media-viewer.js at post-composer.js kung meron. */
(function () {
  var MOODS = ["😄", "🙂", "😐", "😔", "😢", "😡", "😴", "🤒", "🥰", "🤩"];
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function esc(s) { return window.TMN_UI.esc(s); }
  function linkify(s) { return esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\n/g, "<br>"); }

  function mount(o) {
    var D = window.TMN_DAILY, M = window.TMN_MEDIA, UI = window.TMN_UI;
    var day = D.dayKey(), todo = false, photos = [], urls = [], notes = [];
    var loc = window.TMN_I18N ? TMN_I18N.locale : undefined;

    // ---------- composer ----------
    var c = o.composer;
    c.innerHTML =
      '<div class="dn-top"><span class="avatar dn-av" style="--size:42px"></span>' +
        '<textarea class="dn-text" rows="1" maxlength="4000" data-autogrow="260" placeholder="What\'s your note today?" aria-label="Write a note"></textarea></div>' +
      '<div class="dn-photos hidden"></div>' +
      '<div class="dn-bar"><span class="dn-for faint small"></span>' +
        '<label class="icon-btn" aria-label="Add photo" title="Photo">' + I("camera") + '<input type="file" accept="image/*,video/*" multiple class="sr-only dn-file"></label>' +
        '<button type="button" class="icon-btn dn-todo" aria-pressed="false" aria-label="To-do list" title="To-do list">' + I("check") + "</button>" +
        '<button type="button" class="btn btn-primary btn-sm dn-save" disabled>Save</button></div>';
    var text = c.querySelector(".dn-text"), save = c.querySelector(".dn-save"), box = c.querySelector(".dn-photos");
    function paintAv() { var u = window.TMN_USER || {}, av = c.querySelector(".dn-av"); av.innerHTML = u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(UI.initials(u.display_name || u.username || "?")); }
    paintAv(); document.addEventListener("tmn:user", paintAv);
    function ready() { save.disabled = !text.value.trim() && !photos.length; }
    function paintPhotos() {
      urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = [];
      box.classList.toggle("hidden", !photos.length);
      box.innerHTML = photos.map(function (p, i) {
        var u = URL.createObjectURL(p.thumb || p.blob); urls.push(u);
        return '<span class="dn-ph"><img alt="" src="' + u + '"><button type="button" data-rm="' + i + '" aria-label="Remove">' + I("x", "ic-sm") + "</button></span>";
      }).join("");
      ready();
    }
    text.addEventListener("input", ready);
    text.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (!save.disabled) submit(); } });
    c.querySelector(".dn-todo").addEventListener("click", function () {
      todo = !todo; this.setAttribute("aria-pressed", String(todo)); this.classList.toggle("on", todo);
      text.placeholder = todo ? "One item per line…" : "What's your note today?";
      text.focus();
    });
    c.querySelector(".dn-file").addEventListener("change", async function () {
      var f = [].slice.call(this.files || []).slice(0, 10 - photos.length); this.value = "";
      if (!f.length) return;
      try { photos = photos.concat(await M.addFiles(f, null)); paintPhotos(); } catch (e) { UI.toast(e.message); }
    });
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-rm]"); if (b) { photos.splice(Number(b.dataset.rm), 1); paintPhotos(); } });
    save.addEventListener("click", submit);
    async function submit() {
      var v = text.value.trim();
      if (!v && !photos.length) return;
      var n = todo ? { kind: "todo", items: v.split(/\n+/).map(function (t) { return { t: t.replace(/^[-*•]\s*/, "").trim(), done: false }; }) }
        : { kind: "note", text: v };
      n.photos = photos.map(function (p) { return p.id; }); n.day = day;
      save.disabled = true;
      try {
        await D.add(n);
        text.value = ""; text.dispatchEvent(new Event("input", { bubbles: true })); photos = []; paintPhotos();
        if (todo) c.querySelector(".dn-todo").click();
      } catch (e) { UI.toast(e.message); ready(); }
    }

    // ---------- mood ----------
    async function paintMood() {
      if (!o.mood) return;
      var m = await D.mood(day);
      o.mood.innerHTML = MOODS.map(function (e) { return '<button type="button" class="dn-mood' + (e === m ? " on" : "") + '" data-mood="' + e + '" aria-pressed="' + (e === m) + '">' + e + "</button>"; }).join("");
    }
    if (o.mood) o.mood.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-mood]"); if (!b) return;
      await D.setMood(day, b.classList.contains("on") ? null : b.dataset.mood); paintMood();
    });

    // ---------- listahan ----------
    var L = o.list;
    async function thumbs(ids) {
      var out = [];
      for (var i = 0; i < ids.length; i++) { try { var it = await M.get(ids[i]); if (it) out.push(it); } catch (e) {} }
      return out;
    }
    var listUrls = [];
    async function render() {
      notes = await D.list(day);
      listUrls.forEach(function (u) { URL.revokeObjectURL(u); }); listUrls = [];
      var isToday = day === D.dayKey();
      c.querySelector(".dn-for").textContent = isToday ? "" : "Adding to " + new Date(day + "T12:00").toLocaleDateString(loc, { weekday: "short", month: "short", day: "numeric" });
      if (!notes.length) {
        L.innerHTML = '<div class="card empty feed-empty"><div class="empty-art">' + I("sun", "ic-lg") + "</div><h3>" + (isToday ? "No notes yet today" : "No notes on this day") + "</h3>" +
          "<p>" + (isToday ? "Write what happened, a to-do list, or add a photo. Only you can see it." : "Pick another day or write something for this day.") + "</p></div>";
        if (o.onCount) o.onCount(0);
        return;
      }
      var html = "";
      for (var i = 0; i < notes.length; i++) {
        var n = notes[i], ph = await thumbs(n.photos || []);
        n._media = ph;
        var t = new Date(n.createdAt).toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" });
        html += '<article class="card dn-note' + (n.pinned ? " pinned" : "") + '" data-id="' + n.id + '">' +
          '<div class="dn-head faint small">' + (n.pinned ? I("pin", "ic-sm") : "") + '<span translate="no">' + t + "</span>" +
            (n.kind === "todo" ? '<span class="badge">' + n.items.filter(function (x) { return x.done; }).length + "/" + n.items.length + "</span>" : "") +
            '<button type="button" class="icon-btn" data-a="more" aria-label="More">' + I("more", "ic-sm") + "</button></div>" +
          (n.kind === "todo" ? '<ul class="dn-items">' + n.items.map(function (x, k) {
            return '<li><label><input type="checkbox" data-k="' + k + '"' + (x.done ? " checked" : "") + "><span>" + esc(x.t) + "</span></label></li>"; }).join("") + "</ul>"
            : (n.text ? '<p class="dn-body">' + linkify(n.text) + "</p>" : "")) +
          (ph.length ? '<div class="dn-media">' + ph.map(function (p, k) {
            var u = URL.createObjectURL(p.thumb || p.blob); listUrls.push(u);
            return '<button type="button" class="dn-thumb" data-ph="' + k + '"><img alt="" src="' + u + '">' + (p.type === "video" ? '<span class="pc-dur">' + I("play", "ic-sm") + "</span>" : "") + "</button>"; }).join("") + "</div>" : "") +
        "</article>";
      }
      L.innerHTML = html;
      if (o.onCount) o.onCount(notes.length);
    }
    L.addEventListener("change", async function (e) {
      var cb = e.target.closest("input[data-k]"); if (!cb) return;
      var n = notes.filter(function (x) { return x.id === cb.closest("[data-id]").dataset.id; })[0]; if (!n) return;
      var items = n.items.map(function (x, k) { return k === Number(cb.dataset.k) ? { t: x.t, done: cb.checked } : x; });
      await D.update(n.id, { items: items });
    });
    L.addEventListener("click", function (e) {
      var card = e.target.closest("[data-id]"); if (!card) return;
      var n = notes.filter(function (x) { return x.id === card.dataset.id; })[0]; if (!n) return;
      var ph = e.target.closest("[data-ph]");
      if (ph && window.TMN_VIEWER) {
        var list = n._media.map(function (p) { return { kind: p.type, url: URL.createObjectURL(p.blob) }; });
        TMN_VIEWER.open(list, Number(ph.dataset.ph)); return;
      }
      if (e.target.closest('[data-a="more"]')) menu(n);
    });
    function menu(n) {
      var body = document.createElement("div");
      body.className = "dn-menu";
      body.innerHTML = '<button type="button" class="btn btn-ghost" data-m="pin">' + I("pin", "ic-sm") + (n.pinned ? "Unpin" : "Pin to top") + "</button>" +
        '<button type="button" class="btn btn-ghost" data-m="edit">' + I("edit", "ic-sm") + "Edit</button>" +
        (n._media && n._media.length && window.TMN_COMPOSER ? '<button type="button" class="btn btn-ghost" data-m="share">' + I("send", "ic-sm") + "Share to Explore</button>" : "") +
        '<button type="button" class="btn btn-danger" data-m="del">' + I("trash", "ic-sm") + "Delete</button>";
      var m = TMN_MODAL.open({ title: "Note", size: "sm", cls: "modal-sheet", body: body });
      body.addEventListener("click", async function (e) {
        var b = e.target.closest("[data-m]"); if (!b) return;
        m.close();
        if (b.dataset.m === "pin") await D.update(n.id, { pinned: !n.pinned });
        if (b.dataset.m === "edit") edit(n);
        if (b.dataset.m === "share") TMN_COMPOSER.open(n._media, {});
        if (b.dataset.m === "del" && await TMN_MODAL.confirm("Delete this note? Photos stay in your Gallery.", { okText: "Delete", danger: true })) await D.remove(n.id);
      });
    }
    function edit(n) {
      var body = document.createElement("div");
      var val = n.kind === "todo" ? n.items.map(function (x) { return (x.done ? "[x] " : "") + x.t; }).join("\n") : n.text;
      body.innerHTML = '<textarea class="input dn-edit" rows="6" maxlength="4000" data-autogrow="420"></textarea>' +
        (n.kind === "todo" ? '<p class="faint small">One item per line. Start with [x] for done.</p>' : "");
      var ta = body.querySelector("textarea"); ta.value = val;
      var m = TMN_MODAL.open({
        title: "Edit note", size: "md", cls: "modal-sheet", body: body,
        actions: [{ label: "Cancel", cls: "btn-ghost", onClick: function () { m.close(); } },
          { label: "Save", cls: "btn-primary", onClick: async function () {
            var v = ta.value.trim();
            var ch = n.kind === "todo" ? { items: v.split(/\n+/).map(function (t) { var d = /^\[x\]\s*/i.test(t); return { t: t.replace(/^\[x\]\s*/i, "").trim(), done: d }; }) } : { text: v };
            await D.update(n.id, ch); m.close();
          } }]
      });
      setTimeout(function () { ta.dispatchEvent(new Event("input", { bubbles: true })); }, 50);
    }
    document.addEventListener("tmn:daily", function () { render(); paintMood(); });

    function setDay(d) { day = d; render(); paintMood(); }
    setDay(day);
    return { setDay: setDay, day: function () { return day; }, focus: function () { text.focus(); } };
  }

  window.TMN_DAILY_UI = { mount: mount, MOODS: MOODS };
})();
