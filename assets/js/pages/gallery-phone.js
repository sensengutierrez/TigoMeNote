/* TigoMeNote · pages/gallery-phone.js — Gallery ng PHONE sa loob ng app (APK lang: main at Chat)
   Ipinapakita ang lahat ng folder ng phone (Camera, Screenshots, WhatsApp, atbp.) bilang "sub gallery".
   Hindi kinokopya at hindi ina-upload ang lahat: pumili ka lang ng gusto mo, tapos
     • Post  → composer (caption, sino ang makakakita, at kung KAILAN ilalabas; gumagana kahit offline — kusang ia-upload pag may internet)
     • Save  → kopya sa Gallery ng app (album)
   Ayos: ▾/▸ = itago o ipakita ang listahan (naaalala) · mga 5 folder ang kita, may scroll sa loob ·
   sa phone, ang folder ay bumubukas SA LOOB ng card (hindi na bumababa ang page) · ✎ = palitan ang pangalan sa TigoMeNote lang
   (hindi ang totoong folder) at "Set as folder cover" sa press-and-hold — naka-save sa device ("tmnPhoneAlias").
   Native: window.Capacitor.Plugins.TmnNative (apk/native/TmnNative.java). Kailangan: gallery.js, post-composer.js, media-store.js */
(function () {
  var Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;
  var N = (Cap.Plugins && Cap.Plugins.TmnNative) || (Cap.registerPlugin && Cap.registerPlugin("TmnNative"));
  if (!N || !N.galleryBuckets) return;
  var UI = window.TMN_UI, I = window.TMN_ICON, M = window.TMN_MEDIA, MODAL = window.TMN_MODAL;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return UI.esc(s); }
  function fdur(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function src(path) { return Cap.convertFileSrc ? Cap.convertFileSrc(path) : "file://" + path; }

  var aside = document.querySelector(".gallery-layout .layout-aside"), main = $("dropZone");
  if (!aside || !main) return;

  // ---------- markup ----------
  var card = document.createElement("section");
  card.className = "card albums-card"; card.id = "phoneCard";
  card.innerHTML = '<div class="albums-head"><button type="button" class="ph-toggle" id="phoneToggle" aria-expanded="true" aria-controls="phoneBody">' + I("chevronR", "ic-sm") + '<h3>Phone gallery</h3></button>' +
      '<button class="btn btn-ghost btn-sm" type="button" id="phoneSync">' + I("refresh", "ic-sm") + 'Sync</button></div>' +
    '<div class="ph-body" id="phoneBody"><p class="faint small ph-note">Folders on this phone. Pick only what you want to post.</p><nav class="album-list ph-list" id="phoneList" aria-label="Phone folders"></nav></div>';
  aside.insertBefore(card, aside.firstChild);

  var pane = document.createElement("section");
  pane.className = "card gallery-main hidden"; pane.id = "phonePane";
  pane.innerHTML =
    '<div class="g-toolbar"><div class="g-title"><button class="icon-btn" type="button" id="phBack" aria-label="Back">' + I("chevronL") + '</button><div><h2 id="phTitle">Phone</h2><span class="faint small" id="phCount"></span></div>' +
      '<button class="icon-btn" type="button" id="phRename" aria-label="Rename folder in TigoMeNote" title="Rename">' + I("edit", "ic-sm") + "</button></div>" +
    '<div class="g-tools"><div class="chips" id="phChips"><button class="chip active" type="button" data-type="all">All</button><button class="chip" type="button" data-type="photo">Photos</button><button class="chip" type="button" data-type="video">Videos</button></div></div></div>' +
    '<div class="sel-bar" id="phBar"><b id="phSel">0 selected</b><div class="sel-actions">' +
      '<button class="btn btn-ghost btn-sm" type="button" id="phAll">Select all</button>' +
      '<button class="btn btn-primary btn-sm" type="button" id="phPost">' + I("send", "ic-sm") + 'Post</button>' +
      '<button class="btn btn-ghost btn-sm" type="button" id="phSched">' + I("calendar", "ic-sm") + 'Schedule</button>' +
      '<button class="btn btn-ghost btn-sm" type="button" id="phSave">' + I("download", "ic-sm") + 'Save to app gallery</button>' +
      '<button class="btn btn-ghost btn-sm" type="button" id="phClear">Clear</button></div></div>' +
    '<p class="faint small ph-tip">Tap to select · press and hold a photo for options</p>' +
    '<div class="g-scroll" id="phScroll"><div class="g-grid" id="phGrid"></div><div class="empty hidden" id="phEmpty"><div class="empty-art">' + I("image", "ic-lg") + '</div><h3>Nothing here</h3></div>' +
    '<div style="text-align:center;padding:10px"><button class="btn btn-ghost hidden" type="button" id="phMore">Load more</button></div></div>';
  main.parentNode.insertBefore(pane, main.nextSibling);
  // Sa phone (makitid): ang folder ay bumubukas sa loob ng card mismo; sa desktop: sa malaking bahagi sa kanan
  var narrow = window.matchMedia("(max-width: 899px)");
  function place() {
    if (narrow.matches) { if (pane.parentNode !== $("phoneBody")) $("phoneBody").appendChild(pane); pane.classList.add("ph-inline"); }
    else { if (pane.parentNode !== main.parentNode) main.parentNode.insertBefore(pane, main.nextSibling); pane.classList.remove("ph-inline"); }
  }
  place(); if (narrow.addEventListener) narrow.addEventListener("change", function () { place(); show(!!st.bucket); });

  // ▾/▸ itago o ipakita (naaalala)
  var OPEN = "tmnPhoneOpen";
  function setOpen(on) {
    $("phoneToggle").setAttribute("aria-expanded", String(on)); $("phoneBody").hidden = !on; card.classList.toggle("ph-closed", !on);
    try { localStorage.setItem(OPEN, on ? "1" : "0"); } catch (e) {}
  }
  $("phoneToggle").addEventListener("click", function () { setOpen($("phoneBody").hidden); });
  try { if (localStorage.getItem(OPEN) === "0") setOpen(false); } catch (e) {}

  // Pangalan at cover sa TigoMeNote lang (hindi binabago ang totoong folder sa phone)
  var AKEY = "tmnPhoneAlias";
  function aliases() { try { return JSON.parse(localStorage.getItem(AKEY) || "{}") || {}; } catch (e) { return {}; } }
  function setAlias(id, ch) { var a = aliases(); a[id] = Object.assign({}, a[id] || {}, ch); if (!a[id].name) delete a[id].name; try { localStorage.setItem(AKEY, JSON.stringify(a)); } catch (e) {} }
  function nameOf(b) { var a = aliases()[b.id]; return (a && a.name) || b.name; }

  var st = { buckets: [], bucket: null, name: "", type: "all", items: [], sel: new Map(), done: false, loading: false };
  var PAGE = 120;

  // ---------- thumbnails (isa-isa para hindi mabigat) ----------
  var q = [], busy = 0;
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); enqueue(e.target); } });
  }, { root: null, rootMargin: "300px" }) : null;
  function enqueue(img) { q.push(img); pump(); }
  function pump() {
    while (busy < 3 && q.length) {
      var img = q.shift(); busy++;
      N.galleryThumb({ id: Number(img.dataset.id), type: img.dataset.type, size: 320 })
        .then(function (r) { this.src = src(r.path); this.classList.add("ok"); }.bind(img), function () {})
        .then(function () { busy--; pump(); });
    }
  }
  function thumbImg(it) {
    var im = document.createElement("img"); im.alt = ""; im.dataset.id = it.id; im.dataset.type = it.type; im.className = "ph-th";
    if (io) io.observe(im); else enqueue(im);
    return im;
  }

  // ---------- folders ----------
  async function loadBuckets() {
    var list = $("phoneList");
    var ok = false;
    try { ok = (await N.galleryAccess()).granted; } catch (e) {}
    if (!ok) {
      list.innerHTML = '<button type="button" class="btn btn-primary" id="phoneAllow">' + I("image", "ic-sm") + "Connect phone gallery</button>";
      $("phoneAllow").onclick = async function () {
        try { ok = (await N.galleryRequest()).granted; } catch (e) {}
        if (ok) loadBuckets(); else UI.toast("Allow Photos and videos access in your phone settings to use this.", 4000);
      };
      return;
    }
    list.innerHTML = '<p class="faint small">Loading…</p>';
    try {
      var r = await N.galleryBuckets(); st.buckets = r.buckets || [];
      var all = '<button type="button" class="album" data-b="all"><span class="album-cover">' + I("grid") + '</span><span><span class="album-name">All on phone</span><br><span class="album-count">' + (r.total || 0) + " items</span></span></button>";
      var al = aliases();
      list.innerHTML = all + st.buckets.map(function (b) {
        var a = al[b.id] || {}, cov = a.cover ? { id: a.cover, type: "photo" } : b.cover;
        return '<button type="button" class="album" data-b="' + esc(b.id) + '"><span class="album-cover"><img class="ph-th ok" alt="" data-id="' + cov.id + '" data-type="' + cov.type + '"></span>' +
          '<span><span class="album-name">' + esc(a.name || b.name) + '</span><br><span class="album-count">' + b.count + " item" + (b.count === 1 ? "" : "s") +
          (a.name ? " · " + esc(b.name) : "") + "</span></span></button>";
      }).join("");
      list.querySelectorAll("img[data-id]").forEach(function (im) { im.classList.remove("ok"); if (io) io.observe(im); else enqueue(im); });
    } catch (e) { list.innerHTML = '<p class="faint small">Couldn’t read the phone gallery.</p>'; }
  }
  $("phoneList").addEventListener("click", function (e) {
    var b = e.target.closest("[data-b]"); if (!b) return;
    openBucket(b.dataset.b, b.querySelector(".album-name").textContent);
    $("phRename").hidden = b.dataset.b === "all";
  });
  $("phoneSync").addEventListener("click", function () { loadBuckets(); if (st.bucket) openBucket(st.bucket, st.name); UI.toast("Synced with your phone gallery."); });

  // ---------- grid ----------
  function show(on) {
    pane.classList.toggle("hidden", !on);
    if (pane.classList.contains("ph-inline")) { main.classList.remove("hidden"); $("phoneList").classList.toggle("hidden", on); card.querySelector(".ph-note").classList.toggle("hidden", on); }
    else { main.classList.toggle("hidden", on); $("phoneList").classList.remove("hidden"); card.querySelector(".ph-note").classList.remove("hidden"); }
  }
  function openBucket(id, name) {
    st.bucket = id; st.name = name; st.items = []; st.done = false; st.sel.clear();
    $("phTitle").textContent = name; $("phGrid").innerHTML = ""; $("phScroll").scrollTop = 0; show(true);
    // sa loob ng card bumubukas: umakyat lang kung nakatago sa itaas ang simula ng card
    if (card.getBoundingClientRect().top < 0) toTop(card);
    more();
  }
  function toTop(el) {
    var bar = document.querySelector(".topbar"), off = bar ? bar.getBoundingClientRect().height : 0;
    var y = el.getBoundingClientRect().top + window.scrollY - off - 8;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }
  async function more() {
    if (st.loading || st.done) return; st.loading = true;
    try {
      var r = await N.galleryItems({ bucket: st.bucket, offset: st.items.length, limit: PAGE });
      var got = (r.items || []);
      if (got.length < PAGE) st.done = true;
      st.items = st.items.concat(got);
      draw(got);
    } catch (e) { UI.toast("Couldn’t read this folder."); st.done = true; }
    st.loading = false;
    $("phMore").classList.toggle("hidden", st.done);
    $("phCount").textContent = st.items.length + (st.done ? "" : "+") + " items";
    $("phEmpty").classList.toggle("hidden", st.items.length > 0);
  }
  function draw(items) {
    var grid = $("phGrid");
    items.forEach(function (it) {
      if (st.type !== "all" && it.type !== st.type) return;
      var b = document.createElement("button"); b.type = "button"; b.className = "tile" + (st.sel.has(it.id) ? " sel" : ""); b.dataset.id = it.id;
      b.appendChild(thumbImg(it));
      if (it.type === "video") { var v = document.createElement("span"); v.className = "vbadge"; v.innerHTML = I("play") + fdur(it.duration); b.appendChild(v); }
      var c = document.createElement("span"); c.className = "check"; c.innerHTML = I("check"); b.appendChild(c);
      grid.appendChild(b);
    });
  }
  function redraw() { $("phGrid").innerHTML = ""; draw(st.items); updateBar(); }
  $("phMore").addEventListener("click", more);
  $("phScroll").addEventListener("scroll", function () { var s = this; if (s.scrollTop + s.clientHeight > s.scrollHeight - 600) more(); });
  $("phBack").addEventListener("click", function () { show(false); st.bucket = null; st.sel.clear(); updateBar(); if (card.getBoundingClientRect().top < 0) toTop(card); });
  $("phRename").addEventListener("click", async function () {
    if (!st.bucket || st.bucket === "all") return;
    var b = st.buckets.filter(function (x) { return x.id === st.bucket; })[0]; if (!b) return;
    var v = await MODAL.prompt("Folder name in TigoMeNote", { value: nameOf(b), placeholder: b.name, maxLength: 40, okText: "Save" });
    if (v === null) return;
    setAlias(b.id, { name: v === b.name ? "" : v });
    $("phTitle").textContent = nameOf(b); loadBuckets();
    UI.toast("Renamed in TigoMeNote only. The folder on your phone stays “" + b.name + "”.", 3500);
  });
  $("phChips").addEventListener("click", function (e) {
    var b = e.target.closest("[data-type]"); if (!b) return; st.type = b.dataset.type;
    this.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("active", c === b); }); redraw();
  });
  // Pindutin nang matagal ang litrato → mga option (Post, Schedule, Save)
  var lp = { t: 0, fired: false, x: 0, y: 0 };
  $("phGrid").addEventListener("pointerdown", function (e) {
    var t = e.target.closest(".tile"); if (!t) return;
    lp.fired = false; lp.x = e.clientX; lp.y = e.clientY; clearTimeout(lp.t);
    lp.t = setTimeout(function () { lp.fired = true; options(Number(t.dataset.id), t); }, 480);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { $("phGrid").addEventListener(ev, function () { clearTimeout(lp.t); }); });
  $("phGrid").addEventListener("pointermove", function (e) { if (Math.abs(e.clientX - lp.x) + Math.abs(e.clientY - lp.y) > 12) clearTimeout(lp.t); });
  $("phGrid").addEventListener("contextmenu", function (e) { if (e.target.closest(".tile")) e.preventDefault(); });
  function options(id, tile) {
    var it = st.items.filter(function (x) { return x.id === id; })[0]; if (!it) return;
    if (!st.sel.has(id)) { st.sel.set(id, it); tile.classList.add("sel"); updateBar(); }
    if (navigator.vibrate) try { navigator.vibrate(15); } catch (e) {}
    var n = st.sel.size;
    var body = document.createElement("div"); body.className = "ph-opts";
    body.innerHTML =
      '<button type="button" class="btn btn-primary" data-o="now">' + I("send", "ic-sm") + "Post now</button>" +
      '<button type="button" class="btn btn-ghost" data-o="later">' + I("calendar", "ic-sm") + "Schedule</button>" +
      '<button type="button" class="btn btn-ghost" data-o="save">' + I("download", "ic-sm") + "Save to app gallery</button>" +
      (st.bucket && st.bucket !== "all" && it.type !== "video" ? '<button type="button" class="btn btn-ghost" data-o="cover">' + I("image", "ic-sm") + "Set as folder cover</button>" : "");
    var m = window.TMN_MODAL.open({ title: n > 1 ? n + " selected" : (it.type === "video" ? "Video" : "Photo"), size: "sm", body: body });
    body.addEventListener("click", function (e) {
      var b = e.target.closest("[data-o]"); if (!b) return; m.close();
      if (b.dataset.o === "cover") { setAlias(st.bucket, { cover: it.id }); st.sel.delete(it.id); tile.classList.remove("sel"); updateBar(); loadBuckets(); UI.toast("Folder cover changed."); return; }
      if (b.dataset.o === "save") $("phSave").click(); else post(b.dataset.o);
    });
  }
  $("phGrid").addEventListener("click", function (e) {
    if (lp.fired) { lp.fired = false; return; }   // galing sa long press
    var t = e.target.closest(".tile"); if (!t) return;
    var id = Number(t.dataset.id), it = st.items.filter(function (x) { return x.id === id; })[0]; if (!it) return;
    if (st.sel.has(id)) st.sel.delete(id); else st.sel.set(id, it);
    t.classList.toggle("sel", st.sel.has(id)); updateBar();
  });
  function updateBar() {
    var n = st.sel.size; $("phSel").textContent = n + " selected";
    ["phPost", "phSched", "phSave", "phClear"].forEach(function (id) { $(id).disabled = !n; });
    pane.classList.toggle("has-sel", n > 0);   // phone: lumulutang ang bar sa ibaba habang may napili
  }
  $("phAll").addEventListener("click", function () {
    var vis = st.items.filter(function (i) { return st.type === "all" || i.type === st.type; });
    var allSel = vis.every(function (i) { return st.sel.has(i.id); });
    vis.forEach(function (i) { if (allSel) st.sel.delete(i.id); else st.sel.set(i.id, i); });
    document.querySelectorAll("#phGrid .tile").forEach(function (t) { t.classList.toggle("sel", st.sel.has(Number(t.dataset.id))); }); updateBar();
  });
  $("phClear").addEventListener("click", function () { st.sel.clear(); document.querySelectorAll("#phGrid .tile.sel").forEach(function (t) { t.classList.remove("sel"); }); updateBar(); });
  updateBar();

  // ---------- gawing item ng app ----------
  async function blobOf(path, mime) { var r = await fetch(src(path)); var b = await r.blob(); return mime && b.type !== mime ? new Blob([b], { type: mime }) : b; }
  async function toItem(it) {
    var f = await N.galleryFile({ id: it.id, type: it.type, name: it.name || ("file_" + it.id) });
    var blob = await blobOf(f.path, it.mime);
    var th = null; try { var t = await N.galleryThumb({ id: it.id, type: it.type, size: 480 }); th = await blobOf(t.path, "image/jpeg"); } catch (e) {}
    return { id: "ph" + it.id, type: it.type, blob: blob, thumb: th, name: it.name, duration: it.duration || 0, w: it.w, h: it.h, createdAt: it.date };
  }
  async function pickedItems(limit) {
    var arr = Array.from(st.sel.values());
    if (limit && arr.length > limit) { UI.toast("Up to " + limit + " per post."); return null; }
    UI.toast("Getting " + arr.length + " item(s)…", 1500);
    var out = [];
    for (var i = 0; i < arr.length; i++) { try { out.push(await toItem(arr[i])); } catch (e) {} }
    if (!out.length) UI.toast("Couldn’t read the selected files.");
    return out.length ? out : null;
  }
  async function post(when) {
    var items = await pickedItems(10); if (!items) return;
    window.TMN_COMPOSER.open(items, { when: when, onPosted: function () { st.sel.clear(); redraw(); try { N.galleryClean(); } catch (e) {} } });
  }
  $("phPost").addEventListener("click", function () { post("now"); });
  $("phSched").addEventListener("click", function () { post("later"); });
  $("phSave").addEventListener("click", async function () {
    var items = await pickedItems(0); if (!items) return;
    var files = items.map(function (it) { return new File([it.blob], it.name || ("photo_" + it.id), { type: it.blob.type || (it.type === "video" ? "video/mp4" : "image/jpeg") }); });
    try { var a = await M.addFiles(files, null); UI.toast(a.length + " saved to the app gallery."); st.sel.clear(); redraw(); try { N.galleryClean(); } catch (e) {} }
    catch (e) { UI.toast("Not saved: " + (e.message || "is storage full?"), 4000); }
  });

  loadBuckets();
})();
