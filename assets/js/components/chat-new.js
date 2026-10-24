/* TigoMeNote · components/chat-new.js — bagong chat o group, at pagpili ng tao
   TMN_CHAT_NEW.open(onOpen)   → sheet: hanapin ang tao; 1 = chat, 2+ = group (may pangalan). onOpen(chatId)
   TMN_CHAT_NEW.pick({ title, exclude, okText, onDone(ids) })  → pumili ng tao (hal. Add people sa group)
   Listahan: mga fina-follow mo, o hanapin sa pangalan / @username. */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, esc = UI.esc;

  function av(u, size) {
    return '<span class="avatar" style="--size:' + size + 'px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(UI.initials(u.display_name || u.username))) + "</span>";
  }

  function sheet(o) {
    var me = window.TMN_USER || {}, picked = {}, order = [], found = {}, t = null;
    var body = document.createElement("form");
    body.className = "cn";
    body.innerHTML =
      '<div class="cn-chips"></div>' +
      '<label class="search"><i class="cn-ic">' + I("search") + '</i><span class="sr-only">Search people</span>' +
        '<input class="input" type="search" placeholder="Search name or @username" autocomplete="off"></label>' +
      '<input class="input cn-title hidden" maxlength="60" placeholder="Group name (optional)">' +
      '<div class="cn-list" role="listbox" aria-multiselectable="true"><p class="faint small sx-empty">Loading…</p></div>' +
      '<button type="submit" class="btn btn-primary btn-block cn-go" disabled></button>';
    var m = TMN_MODAL.open({ title: o.title, size: "sm", cls: "modal-sheet", body: body });
    var q = body.querySelector('input[type="search"]'), listEl = body.querySelector(".cn-list"), go = body.querySelector(".cn-go");
    var titleIn = body.querySelector(".cn-title");

    function paint(list, label) {
      list.forEach(function (u) { found[u.id] = u; });
      var rows = list.filter(function (u) { return u.id !== me.id && (o.exclude || []).indexOf(u.id) < 0; });
      listEl.innerHTML = (label ? '<h4 class="faint small cn-label">' + label + "</h4>" : "") + (rows.length ? rows.map(function (u) {
        return '<label class="cn-row"><input type="checkbox" value="' + esc(u.id) + '"' + (picked[u.id] ? " checked" : "") + ">" + av(u, 40) +
          '<span class="cn-who"><b translate="no">' + esc(u.display_name || u.username) + '</b><span class="faint small" translate="no">@' + esc(u.username) + "</span></span>" +
          '<span class="cn-check">' + I("check", "ic-sm") + "</span></label>";
      }).join("") : '<p class="faint small sx-empty">No one found.</p>');
    }
    function paintPicked() {
      body.querySelector(".cn-chips").innerHTML = order.map(function (id) {
        var u = found[id] || {};
        return '<button type="button" class="chip cn-chip" data-un="' + esc(id) + '"><span translate="no">' + esc(u.display_name || u.username || "") + "</span>" + I("x", "ic-sm") + "</button>";
      }).join("");
      var n = order.length;
      go.disabled = !n;
      if (o.mode === "new") {
        titleIn.classList.toggle("hidden", n < 2);
        go.textContent = n < 2 ? "Chat" : "Create group (" + (n + 1) + ")";
      } else go.textContent = (o.okText || "Done") + (n ? " (" + n + ")" : "");
    }
    async function load() {
      var term = q.value.trim();
      try {
        if (term.length >= 2) { var r = await TMN_API.call("social", "people", { q: term }); paint(r.list || [], ""); }
        else { var f = await TMN_API.call("social", "followList", { user_id: me.id, which: "following" }); paint(f.list || [], "People you follow"); }
      } catch (e) { listEl.innerHTML = '<p class="faint small sx-empty">' + esc(e.message) + "</p>"; }
    }
    q.addEventListener("input", function () { clearTimeout(t); t = setTimeout(load, 250); });
    listEl.addEventListener("change", function (e) {
      var c = e.target; if (!c.value) return;
      if (c.checked) { if (o.single) { order.forEach(function (x) { delete picked[x]; }); order = []; listEl.querySelectorAll("input").forEach(function (x) { if (x !== c) x.checked = false; }); }
        picked[c.value] = 1; order.push(c.value); }
      else { delete picked[c.value]; order = order.filter(function (x) { return x !== c.value; }); }
      paintPicked();
    });
    body.querySelector(".cn-chips").addEventListener("click", function (e) {
      var b = e.target.closest("[data-un]"); if (!b) return;
      delete picked[b.dataset.un]; order = order.filter(function (x) { return x !== b.dataset.un; });
      var box = listEl.querySelector('input[value="' + b.dataset.un + '"]'); if (box) box.checked = false;
      paintPicked();
    });
    body.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!order.length) return;
      go.disabled = true;
      try { await o.onDone(order.slice(), titleIn.value.trim()); m.close(); }
      catch (err) { UI.toast(err.message, 4000); go.disabled = false; }
    });
    paintPicked(); load();
    setTimeout(function () { q.focus(); }, 50);
    return m;
  }

  function open(onOpen) {
    return sheet({ title: "New message", mode: "new", onDone: async function (ids, title) {
      var r = ids.length === 1
        ? await TMN_API.call("messages", "start", { user_id: ids[0] })
        : await TMN_API.call("messages", "group", { user_ids: ids, title: title });
      if (onOpen) onOpen(r.id);
    } });
  }
  function pick(o) { return sheet({ title: o.title || "Choose people", exclude: o.exclude, okText: o.okText, onDone: o.onDone }); }

  window.TMN_CHAT_NEW = { open: open, pick: pick };
})();
