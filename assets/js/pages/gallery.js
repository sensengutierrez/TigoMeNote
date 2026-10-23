/* TigoMeNote · pages/gallery.js (app/gallery.html)
   Albums, upload (file / camera / drag-drop), viewer, edit (photo-editor.js), select → move / download / delete.
   Lahat naka-save sa device (media-store.js). */
(function () {
  var M = window.TMN_MEDIA, UI = window.TMN_UI, I = window.TMN_ICON, MODAL = window.TMN_MODAL;
  var $ = function (id) { return document.getElementById(id); };

  var state = { album: "all", type: "all", items: [], albums: [], selecting: false, sel: new Set() };
  var urls = [];               // object URLs na kailangang i-revoke
  var params = new URLSearchParams(location.search);
  if (params.get("album")) state.album = params.get("album");

  function track(u) { urls.push(u); return u; }
  function freeUrls() { urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = []; }

  function fmtBytes(n) {
    if (!n) return "0 B";
    var u = ["B", "KB", "MB", "GB"], i = Math.min(3, Math.floor(Math.log(n) / Math.log(1024)));
    return (n / Math.pow(1024, i)).toFixed(i ? 1 : 0) + " " + u[i];
  }
  function fmtDur(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function fmtDate(t) { return new Date(t).toLocaleString(window.TMN_I18N ? TMN_I18N.locale : undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); }
  function albumName(id) {
    if (!id || id === "all") return "All photos & videos";
    if (id === "none") return "No album";
    var a = state.albums.filter(function (x) { return x.id === id; })[0];
    return a ? a.name : "Album";
  }

  // ================= Render =================
  async function load() {
    state.albums = await M.albums();
    if (state.album !== "all" && state.album !== "none" && !state.albums.some(function (a) { return a.id === state.album; })) state.album = "all";
    state.items = await M.list({ albumId: state.album === "all" ? null : state.album, type: state.type });
    freeUrls();
    renderAlbums();
    renderGrid();
    renderStorage();
  }

  async function renderAlbums() {
    var all = await M.list({});
    var noAlbum = all.filter(function (i) { return !i.albumId; }).length;
    function row(id, name, count, cover, icon) {
      var c = cover && cover.thumb ? '<img alt="" src="' + track(URL.createObjectURL(cover.thumb)) + '">' : I(icon || "album");
      return '<button type="button" class="album' + (state.album === id ? " active" : "") + '" data-album="' + id + '">' +
        '<span class="album-cover">' + c + '</span><span><span class="album-name">' + UI.esc(name) + '</span><br><span class="album-count">' + count + " item" + (count === 1 ? "" : "s") + "</span></span></button>";
    }
    var html = row("all", "All", all.length, all[0], "grid");
    if (state.albums.length) html += row("none", "No album", noAlbum, all.filter(function (i) { return !i.albumId; })[0], "image");
    state.albums.forEach(function (a) { html += row(a.id, a.name, a.count, a.cover, "album"); });
    $("albumList").innerHTML = html;
    $("albumMenu").classList.toggle("hidden", state.album === "all" || state.album === "none");
    $("gTitle").textContent = albumName(state.album);
  }

  function renderGrid() {
    var grid = $("grid");
    $("gCount").textContent = state.items.length + " item" + (state.items.length === 1 ? "" : "s");
    $("gEmpty").classList.toggle("hidden", state.items.length > 0);
    $("gEmptyTitle").textContent = state.album === "all" ? "No photos or videos yet" : "This album is empty";
    grid.innerHTML = state.items.map(function (it) {
      var img = it.thumb ? '<img alt="' + UI.esc(it.caption || it.name) + '" loading="lazy" src="' + track(URL.createObjectURL(it.thumb)) + '">'
                         : '<span class="noprev">' + I(it.type === "video" ? "video" : "image") + "</span>";
      return '<button type="button" class="tile' + (state.sel.has(it.id) ? " sel" : "") + '" data-id="' + it.id + '" aria-label="' + UI.esc(it.caption || it.name) + '">' +
        img +
        (it.type === "video" ? '<span class="vbadge">' + I("play") + fmtDur(it.duration) + "</span>" : "") +
        (it.editedAt ? '<span class="edited">Edited</span>' : "") +
        '<span class="check">' + I("check") + "</span></button>";
    }).join("");
    $("dropZone").classList.toggle("selecting", state.selecting);
    updateSelBar();
  }

  async function renderStorage() {
    var u = await M.usage();
    $("storeUsed").textContent = fmtBytes(u.used) + (u.quota ? " / " + fmtBytes(u.quota) : "");
    $("storeBar").style.width = u.quota ? Math.min(100, (u.used / u.quota) * 100).toFixed(1) + "%" : "0";
    $("storeNote").textContent = u.persisted
      ? "Protected: the browser won't delete these on its own. They will be deleted if you manually clear your browser data."
      : "If you clear your browser data, these will be deleted too. Download anything important.";
  }

  // ================= Upload =================
  async function upload(files) {
    files = [].slice.call(files || []).filter(function (f) { return /^(image|video)\//.test(f.type); });
    if (!files.length) { UI.toast("Only photos and videos are allowed."); return; }
    var big = files.filter(function (f) { return f.size > 500 * 1024 * 1024; });
    if (big.length && !(await MODAL.confirm(big.length + " file(s) are over 500 MB. Your device storage may fill up. Continue?", { okText: "Continue" }))) return;
    var album = state.album === "all" || state.album === "none" ? null : state.album;
    UI.toast("Saving " + files.length + " file(s) to this device…", 1800);
    try {
      var added = await M.addFiles(files, album);
      UI.toast(added.length + " saved to " + (album ? albumName(album) : "Gallery") + ".");
    } catch (e) {
      UI.toast("Not saved: " + (e.message || "is storage full?"), 4000);
    }
  }
  $("fileInput").addEventListener("change", function () { upload(this.files); this.value = ""; });
  $("camInput").addEventListener("change", function () { upload(this.files); this.value = ""; });

  // Drag & drop (desktop)
  var dz = $("dropZone"), depth = 0;
  dz.addEventListener("dragenter", function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types, "Files") > -1) { depth++; dz.classList.add("dragging"); e.preventDefault(); } });
  dz.addEventListener("dragover", function (e) { if (dz.classList.contains("dragging")) e.preventDefault(); });
  dz.addEventListener("dragleave", function () { depth = Math.max(0, depth - 1); if (!depth) dz.classList.remove("dragging"); });
  dz.addEventListener("drop", function (e) { e.preventDefault(); depth = 0; dz.classList.remove("dragging"); upload(e.dataTransfer.files); });

  // ================= Albums =================
  $("albumList").addEventListener("click", function (e) {
    var b = e.target.closest("[data-album]"); if (!b) return;
    state.album = b.dataset.album; clearSel();
    var u = new URL(location.href);
    if (state.album === "all") u.searchParams.delete("album"); else u.searchParams.set("album", state.album);
    history.replaceState(null, "", u);
    load();
  });

  $("newAlbum").addEventListener("click", async function () {
    var name = await MODAL.prompt("New album", { placeholder: "e.g. Bahrain trip", okText: "Create" });
    if (!name) return;
    try { var a = await M.createAlbum(name); state.album = a.id; UI.toast("Album created: " + a.name); load(); }
    catch (e) { UI.toast(e.message); }
  });

  $("albumMenu").addEventListener("click", function () {
    var id = state.album, name = albumName(id);
    var body = document.createElement("div");
    body.className = "pick-list";
    body.innerHTML =
      '<button type="button" class="pick" data-a="rename">' + I("edit") + "Rename</button>" +
      '<button type="button" class="pick" data-a="keep">' + I("trash") + "Delete album (keep photos in All)</button>" +
      '<button type="button" class="pick" data-a="all" style="color:var(--danger)">' + I("trash") + "Delete album and everything in it</button>";
    var m = MODAL.open({ title: name, size: "sm", body: body });
    body.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      m.close();
      if (b.dataset.a === "rename") {
        var n = await MODAL.prompt("Rename album", { value: name });
        if (n) { await M.renameAlbum(id, n); load(); }
      } else {
        var all = b.dataset.a === "all";
        var ok = await MODAL.confirm(all ? "The album and ALL photos/videos in it will be deleted. This can't be undone." : "The album will be deleted. Photos/videos stay in All.", { okText: "Delete", danger: true });
        if (ok) { await M.deleteAlbum(id, all); state.album = "all"; UI.toast("Album deleted."); load(); }
      }
    });
  });

  // ================= Filters =================
  $("typeChips").addEventListener("click", function (e) {
    var b = e.target.closest("[data-type]"); if (!b) return;
    state.type = b.dataset.type;
    this.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("active", c === b); });
    load();
  });

  // ================= Select mode =================
  function clearSel() { state.selecting = false; state.sel.clear(); }
  function updateSelBar() {
    $("selBar").classList.toggle("hidden", !state.selecting);
    $("selCount").textContent = state.sel.size + " selected";
    ["selMove", "selDownload", "selDelete", "selPost"].forEach(function (id) { $(id).disabled = !state.sel.size; });
    $("selectBtn").classList.toggle("hidden", state.selecting);
  }
  $("selectBtn").addEventListener("click", function () { state.selecting = true; renderGrid(); });
  $("selCancel").addEventListener("click", function () { clearSel(); renderGrid(); });
  $("selAll").addEventListener("click", function () {
    var allSel = state.sel.size === state.items.length;
    state.sel.clear();
    if (!allSel) state.items.forEach(function (i) { state.sel.add(i.id); });
    renderGrid();
  });
  $("selDelete").addEventListener("click", async function () {
    var n = state.sel.size;
    if (!(await MODAL.confirm("Delete " + n + " item(s) from this device? This can't be undone.", { okText: "Delete", danger: true }))) return;
    await M.remove([].concat(Array.from(state.sel))); clearSel(); UI.toast(n + " nabura."); load();
  });
  $("selMove").addEventListener("click", async function () {
    var target = await pickAlbum();
    if (target === undefined) return;
    await M.move(Array.from(state.sel), target); var n = state.sel.size; clearSel();
    UI.toast(n + " moved to " + (target ? albumName(target) : "No album") + "."); load();
  });
  // Post: bubuksan ang composer (gumagana kahit offline; ia-upload pag may internet)
  $("selPost").addEventListener("click", async function () {
    var ids = state.items.filter(function (i) { return state.sel.has(i.id); }).map(function (i) { return i.id; });
    if (ids.length > 10) { UI.toast("Up to 10 per post."); return; }
    var items = [];
    for (var i = 0; i < ids.length; i++) { var it = await M.get(ids[i]); if (it) items.push(it); }
    window.TMN_COMPOSER.open(items, { onPosted: function () { clearSel(); renderGrid(); } });
  });
  $("selDownload").addEventListener("click", async function () {
    var ids = Array.from(state.sel);
    for (var i = 0; i < ids.length; i++) { var it = await M.get(ids[i]); if (it) download(it); await new Promise(function (r) { setTimeout(r, 250); }); }
  });

  // Pumili ng album: ibinabalik ang id, null (walang album), o undefined (cancel)
  function pickAlbum(current) {
    return new Promise(function (resolve) {
      var done = false;
      var body = document.createElement("div");
      body.className = "pick-list";
      body.innerHTML =
        state.albums.map(function (a) { return '<button type="button" class="pick" data-id="' + a.id + '">' + I("album") + UI.esc(a.name) + (a.id === current ? " · current" : "") + "</button>"; }).join("") +
        '<button type="button" class="pick" data-id="">' + I("image") + "No album</button>" +
        '<button type="button" class="pick" data-new="1">' + I("plus") + "New album…</button>";
      var m = MODAL.open({ title: "Move to album", size: "sm", body: body, onClose: function () { if (!done) resolve(undefined); } });
      body.addEventListener("click", async function (e) {
        var b = e.target.closest(".pick"); if (!b) return;
        if (b.dataset.new) {
          done = true; m.close();
          var name = await MODAL.prompt("New album", { placeholder: "Album name", okText: "Create" });
          if (!name) return resolve(undefined);
          var a = await M.createAlbum(name); state.albums = await M.albums(); resolve(a.id); return;
        }
        done = true; m.close(); resolve(b.dataset.id || null);
      });
    });
  }

  function download(it) {
    var a = document.createElement("a");
    var u = URL.createObjectURL(it.blob);
    a.href = u; a.download = it.name || ("tigomenote-" + it.id);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }

  // ================= Grid click =================
  $("grid").addEventListener("click", function (e) {
    var t = e.target.closest(".tile"); if (!t) return;
    var id = t.dataset.id;
    if (state.selecting) {
      if (state.sel.has(id)) state.sel.delete(id); else state.sel.add(id);
      t.classList.toggle("sel"); updateSelBar(); return;
    }
    openViewer(state.items.findIndex(function (i) { return i.id === id; }));
  });

  // ================= Viewer =================
  function openViewer(index) {
    var idx = index, viewUrl = null, modal;
    var root = document.createElement("div");
    root.className = "vw";
    root.innerHTML =
      '<div class="vw-stage"><div class="vw-media"></div>' +
        '<button type="button" class="vw-nav prev" aria-label="Previous">' + I("chevronL") + "</button>" +
        '<button type="button" class="vw-nav next" aria-label="Next">' + I("chevronR") + "</button></div>" +
      '<div class="vw-info">' +
        '<div class="vw-meta"></div>' +
        '<label class="field"><span class="pe-label">Caption</span><textarea maxlength="500" placeholder="Add a note…"></textarea></label>' +
        '<label class="field"><span class="pe-label">Album</span><select></select></label>' +
        '<div class="vw-actions">' +
          '<button type="button" class="btn btn-primary" data-v="post">' + I("send", "ic-sm") + "Post</button>" +
          '<button type="button" class="btn btn-ghost" data-v="edit">' + I("edit", "ic-sm") + "Edit</button>" +
          '<button type="button" class="btn btn-ghost" data-v="download">' + I("download", "ic-sm") + "Download</button>" +
          '<button type="button" class="btn btn-danger" data-v="delete">' + I("trash", "ic-sm") + "Delete</button>" +
        "</div></div>";

    var media = root.querySelector(".vw-media"), cap = root.querySelector("textarea"), sel = root.querySelector("select");
    var prev = root.querySelector(".prev"), next = root.querySelector(".next");

    function current() { return state.items[idx]; }
    function show() {
      var it = current(); if (!it) { modal.close(); return; }
      if (viewUrl) URL.revokeObjectURL(viewUrl);
      viewUrl = URL.createObjectURL(it.blob);
      media.innerHTML = it.type === "video"
        ? '<video src="' + viewUrl + '" controls playsinline autoplay></video>'
        : '<img alt="" src="' + viewUrl + '">';
      modal.el.querySelector(".modal-head h3").textContent = (idx + 1) + " / " + state.items.length;
      root.querySelector(".vw-meta").innerHTML =
        "<span>" + UI.esc(it.name) + "</span><span>" + fmtDate(it.createdAt) + "</span><span>" +
        (it.w ? it.w + " × " + it.h + " · " : "") + fmtBytes(it.size) + (it.type === "video" ? " · " + fmtDur(it.duration) : "") +
        (it.editedAt ? " · Edited" : "") + "</span>";
      cap.value = it.caption || "";
      sel.innerHTML = '<option value="">No album</option>' + state.albums.map(function (a) {
        return '<option value="' + a.id + '"' + (a.id === it.albumId ? " selected" : "") + ">" + UI.esc(a.name) + "</option>";
      }).join("");
      root.querySelector('[data-v="edit"]').classList.toggle("hidden", it.type !== "photo");
      prev.disabled = idx <= 0; next.disabled = idx >= state.items.length - 1;
    }
    function go(d) { var n = idx + d; if (n >= 0 && n < state.items.length) { idx = n; show(); } }

    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    function onKey(e) {
      if (document.activeElement === cap) return;
      if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1);
    }
    document.addEventListener("keydown", onKey);
    // Swipe sa phone
    var sx = null;
    media.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    media.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); sx = null; });

    cap.addEventListener("change", async function () { var it = current(); it.caption = cap.value.trim(); await M.update(it.id, { caption: it.caption }); UI.toast("Caption saved."); });
    sel.addEventListener("change", async function () {
      var it = current(); await M.move(it.id, sel.value || null); it.albumId = sel.value || null;
      UI.toast("Moved to " + (sel.value ? albumName(sel.value) : "No album") + ".");
    });

    root.querySelector(".vw-actions").addEventListener("click", async function (e) {
      var b = e.target.closest("[data-v]"); if (!b) return;
      var it = current();
      if (b.dataset.v === "download") download(it);
      if (b.dataset.v === "post") window.TMN_COMPOSER.open([it]);
      if (b.dataset.v === "delete") {
        if (!(await MODAL.confirm("Delete this from your device? This can't be undone.", { okText: "Delete", danger: true }))) return;
        await M.remove(it.id);
        state.items.splice(idx, 1);
        if (!state.items.length) { modal.close(); return; }
        idx = Math.min(idx, state.items.length - 1); show();
      }
      if (b.dataset.v === "edit") {
        var res = await window.TMN_PHOTO_EDITOR.open(it.blob);
        if (!res) return;
        if (res.mode === "copy") { var c = await M.addEditedCopy(it.id, res.blob); state.items.splice(idx, 0, c); UI.toast("Saved as a new copy."); }
        else { var upd = await M.update(it.id, { blob: res.blob }); state.items[idx] = upd; UI.toast("Edit saved."); }
        show();
      }
    });

    modal = MODAL.open({
      title: "", size: "full", cls: "modal-viewer", body: root,
      onClose: function () { document.removeEventListener("keydown", onKey); if (viewUrl) URL.revokeObjectURL(viewUrl); load(); }
    });
    show();
  }

  // ================= Start =================
  document.addEventListener("tmn:media", function () { if (!document.querySelector(".modal-viewer")) load(); });
  if (!window.indexedDB) { $("gEmptyTitle").textContent = "This browser doesn't support device storage."; $("gEmpty").classList.remove("hidden"); return; }
  load().catch(function (e) { UI.toast(e.message || "Storage error."); });
})();
