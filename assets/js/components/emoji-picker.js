/* TigoMeNote · components/emoji-picker.js — emoji picker (pinakabagong emoji) + TigoMeNote stickers
     TMN_EMOJI_PICK.open(anchorEl, { onEmoji(e), onSticker(id), stickers: true, tab: "stickers" })  → { close }
     TMN_EMOJI_PICK.insert(inputEl, emoji)   → ilagay ang emoji kung nasaan ang cursor
     TMN_EMOJI_PICK.attach(buttonEl, inputEl) → pindot sa button = picker na naglalagay sa input
   Desktop: maliit na popover sa itaas ng button. Phone: sheet sa ibaba. Naaalala ang mga huling ginamit (sa device).
   Kailangan: emoji-data.js; stickers.js kung may stickers. */
(function () {
  var KEY = "tmnEmojiRecent", MAX_RECENT = 32, open_ = null;
  function recent() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function remember(x) {
    try { var r = recent().filter(function (y) { return y !== x; }); r.unshift(x); localStorage.setItem(KEY, JSON.stringify(r.slice(0, MAX_RECENT))); } catch (e) {}
  }
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }

  function insert(input, e) {
    if (!input) return;
    var s = input.selectionStart == null ? input.value.length : input.selectionStart, en = input.selectionEnd == null ? s : input.selectionEnd;
    var max = input.maxLength > 0 ? input.maxLength : Infinity;
    if (input.value.length - (en - s) + e.length > max) return;
    input.value = input.value.slice(0, s) + e + input.value.slice(en);
    var p = s + e.length;
    try { input.setSelectionRange(p, p); } catch (x) {}
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function open(anchor, o) {
    o = o || {};
    if (open_) open_.close();
    var D = window.TMN_EMOJI_DATA || [], ST = o.stickers && window.TMN_STICKERS;
    var tabs = [{ id: "recent", icon: "🕘", label: "Recent" }].concat(D.map(function (c) { return { id: c.id, icon: c.icon, label: c.label }; }));
    if (ST) tabs.unshift({ id: "stickers", icon: "", label: "Stickers" });
    var tab = o.tab && tabs.some(function (t) { return t.id === o.tab; }) ? o.tab : (recent().length ? "recent" : (ST ? "stickers" : "new"));

    var el = document.createElement("div");
    el.className = "emp";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Emoji and stickers");
    el.innerHTML =
      '<div class="emp-tabs" role="tablist">' + tabs.map(function (t) {
        return '<button type="button" role="tab" class="emp-tab" data-t="' + t.id + '" title="' + t.label + '" aria-label="' + t.label + '">' +
          (t.id === "stickers" ? '<span class="emp-stk-ic">' + ST.svg("tigo-hello", 22) + "</span>" : '<span translate="no">' + t.icon + "</span>") + "</button>";
      }).join("") + "</div>" +
      '<div class="emp-title small"></div><div class="emp-body" translate="no"></div>';
    document.body.appendChild(el);
    var bodyEl = el.querySelector(".emp-body"), title = el.querySelector(".emp-title");

    function paint() {
      el.querySelectorAll(".emp-tab").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.t === tab)); });
      var t = tabs.filter(function (x) { return x.id === tab; })[0];
      title.textContent = t ? t.label : "";
      if (tab === "stickers") {
        bodyEl.className = "emp-body emp-stickers";
        bodyEl.innerHTML = ST.list.map(function (s) { return '<button type="button" class="emp-stk" data-s="' + s.id + '" aria-label="' + s.label + '">' + ST.svg(s.id, 84) + "</button>"; }).join("");
        return;
      }
      var list = tab === "recent" ? recent() : ((D.filter(function (c) { return c.id === tab; })[0] || {}).list || []);
      bodyEl.className = "emp-body emp-grid";
      bodyEl.innerHTML = list.length ? list.map(function (e) { return '<button type="button" class="emp-e" data-e="' + e + '">' + e + "</button>"; }).join("")
        : '<p class="faint small emp-empty">Your recent emoji show up here.</p>';
      bodyEl.scrollTop = 0;
    }
    function place() {
      if (window.matchMedia("(max-width: 640px)").matches) { el.classList.add("is-sheet"); return; }
      var r = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
      var x = Math.min(window.innerWidth - w - 12, Math.max(12, r.left + r.width / 2 - w / 2));
      var y = r.top - h - 8; if (y < 12) y = Math.min(window.innerHeight - h - 12, r.bottom + 8);
      el.style.left = x + "px"; el.style.top = y + "px";
    }
    el.addEventListener("click", function (e) {
      var t = e.target.closest("[data-t]"), em = e.target.closest("[data-e]"), st = e.target.closest("[data-s]");
      if (t) { tab = t.dataset.t; paint(); return; }
      if (em) { remember(em.dataset.e); if (o.onEmoji) o.onEmoji(em.dataset.e); if (o.closeOnPick) close(); return; }
      if (st) { close(); if (o.onSticker) o.onSticker(st.dataset.s); }
    });
    function outside(e) { if (!el.contains(e.target) && !anchor.contains(e.target)) close(); }
    function key(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    setTimeout(function () { document.addEventListener("pointerdown", outside, true); }, 0);
    document.addEventListener("keydown", key, true);
    window.addEventListener("resize", place);
    function close() {
      if (!el.isConnected) return;
      el.remove(); open_ = null;
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", key, true);
      window.removeEventListener("resize", place);
      anchor.setAttribute("aria-expanded", "false");
      if (o.onClose) o.onClose();
    }
    paint(); place();
    anchor.setAttribute("aria-expanded", "true");
    open_ = { close: close, el: el };
    return open_;
  }

  function attach(btn, input, o) {
    o = o || {};
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (open_ && btn.getAttribute("aria-expanded") === "true") { open_.close(); return; }
      open(btn, Object.assign({}, o, { onEmoji: function (em) { insert(input, em); } }));
    });
  }

  window.TMN_EMOJI_PICK = { open: open, insert: insert, attach: attach, recent: recent, close: function () { if (open_) open_.close(); } };
})();
