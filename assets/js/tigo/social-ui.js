/* TigoMeNote · tigo/social-ui.js — Friends & chat sa loob ng Tigo: 🌍 World · 👥 Friends · 💬 Chats (DM at group)
   import { socialNode } from "./social-ui.js"
   const node = socialNode({ tab, me:{ id, username }, visiting, onVisit(friend), onJoin(game, code), toast(t) })
     node._cleanup()            → isara ang realtime at timer (tawagin pag isinara ang sheet)
     node._chatWith(userId)     → buksan ang DM sa taong iyon (hal. may-ari ng islang binibisita)
   Server: tigo-social (friends, world, say, mute, del) · social-fast (people, follow) · messages-fast (inbox, open, send, start, group)
           moderation-fast (report: target_type "user"). Realtime: TMN_RT — "may bago" lang ang dumadaan, ang laman ay kinukuha sa server.
   World chat: text lang, walang link, may filter sa server; Mute at Report sa bawat tao. Ang DM/group ay parehong chat ng Messenger. */
const esc = (s) => (window.TMN_UI ? TMN_UI.esc(s == null ? "" : s) : String(s == null ? "" : s));
const api = (fn, a, b) => window.TMN_API.call(fn, a, b);
const GAME_NAMES = { ghost: "Lights Out", dash: "Sky Dash", siege: "Gloom Siege", sudoku: "Sudoku", race: "Racing" };
const TABS = [["world", "🌍", "World"], ["friends", "👥", "Friends"], ["chats", "💬", "Chats"]];
const hhmm = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
const nameOf = (u) => (u && (u.display_name || "@" + u.username)) || "Someone";
const ava = (u) => u && u.avatar_url ? '<img class="ts-av" src="' + esc(u.avatar_url) + '" alt="" loading="lazy">' : '<span class="ts-av">' + esc(String((u && (u.display_name || u.username)) || "?").trim().charAt(0).toUpperCase()) + "</span>";

export function socialNode(o) {
  const box = document.createElement("div"); box.className = "ts";
  const toast = o.toast || (() => {});
  let tab = o.tab || "friends", offs = [], alive = true;
  const off = () => { offs.forEach((f) => { try { f(); } catch (e) {} }); offs = []; };
  box._cleanup = () => { alive = false; off(); };
  box.innerHTML = '<div class="segmented ts-tabs" role="tablist">' + TABS.map((t) => '<button type="button" role="tab" data-tab="' + t[0] + '">' + t[1] + " " + t[2] + "</button>").join("") + '</div><div class="ts-body"></div>';
  const body = box.querySelector(".ts-body");
  const show = (t) => {
    off(); tab = t;
    box.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tab === t)));
    body.className = "ts-body ts-" + t; body.innerHTML = '<p class="ts-note">Loading…</p>';
    ({ world, friends, chats })[t]();
  };
  box.querySelector(".ts-tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) show(b.dataset.tab); });

  // ---------- 🌍 World ----------
  function world() {
    let last = 0, muted = [], busy = false, list = [];
    body.innerHTML = '<div class="ts-msgs" aria-live="polite"></div><div class="ts-menu hidden"></div>' +
      '<form class="ts-send"><input type="text" class="input" maxlength="200" placeholder="Say hi to everyone…" aria-label="World chat message" autocomplete="off" enterkeyhint="send"><button class="btn btn-primary btn-sm" type="submit">Send</button></form>' +
      '<p class="ts-note">Everyone in Tigo can read this. Be kind · no links · tap a message to mute or report.</p>';
    const msgs = body.querySelector(".ts-msgs"), menu = body.querySelector(".ts-menu"), form = body.querySelector(".ts-send"), inp = form.querySelector("input");
    const row = (m) => '<button type="button" class="ts-msg' + (m.me ? " me" : "") + '" data-id="' + m.id + '"><b translate="no">@' + esc(m.user.username) + "</b> <span>" + esc(m.body) + "</span><small>" + hhmm(m.at) + "</small></button>";
    const add = (arr, replace) => {
      const near = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 60;
      arr = arr.filter((m) => !list.some((x) => x.id === m.id));
      list = (replace ? arr : list.concat(arr)).slice(-80);
      if (list.length) last = Math.max(last, list[list.length - 1].id);
      msgs.innerHTML = list.length ? list.map(row).join("") : '<p class="ts-note">No messages yet. Say hi! 👋</p>';
      if (near || replace) msgs.scrollTop = msgs.scrollHeight;
    };
    const load = async (first) => {
      if (busy || !alive) return; busy = true;
      try { const r = await api("tigoSocial", "world", first ? {} : { after: last }); muted = r.muted || []; if (first) list = []; add(r.list || [], first); }
      catch (e) { if (first) msgs.innerHTML = '<p class="ts-note">' + esc(e.message) + "</p>"; }
      busy = false;
    };
    load(true);
    let ch = null;
    if (window.TMN_RT) { ch = TMN_RT.join("tmn-tigo-world", () => load(false)); offs.push(() => ch.leave()); }
    const t = setInterval(() => { if (!document.hidden) load(false); }, 12000); offs.push(() => clearInterval(t));
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); const v = inp.value.trim(); if (!v) return;
      const btn = form.querySelector("button"); btn.disabled = true;
      try { const r = await api("tigoSocial", "say", { body: v }); inp.value = ""; add([r.msg]); if (ch) ch.send("new", {}); }
      catch (err) { toast(err.message); }
      btn.disabled = false; inp.focus();
    });
    const hide = () => { menu.classList.add("hidden"); menu.innerHTML = ""; };
    msgs.addEventListener("click", (e) => {
      const b = e.target.closest(".ts-msg"); if (!b) return;
      const m = list.find((x) => String(x.id) === b.dataset.id); if (!m) return;
      menu.innerHTML = '<span class="ts-menu-t">@' + esc(m.user.username) + ": “" + esc(m.body.slice(0, 60)) + '”</span>' +
        (m.me ? '<button type="button" class="btn btn-ghost btn-sm" data-m="del">🗑 Delete</button>'
          : '<button type="button" class="btn btn-ghost btn-sm" data-m="mute">🔇 Mute</button><button type="button" class="btn btn-ghost btn-sm" data-m="report">🚩 Report</button>') +
        '<button type="button" class="btn btn-ghost btn-sm" data-m="x">Cancel</button>';
      menu.classList.remove("hidden"); menu._m = m;
    });
    menu.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-m]"); if (!b) return; const m = menu._m, k = b.dataset.m; hide();
      try {
        if (k === "del") { await api("tigoSocial", "del", { id: m.id }); list = list.filter((x) => x.id !== m.id); add([], false); msgs.innerHTML = list.map(row).join("") || '<p class="ts-note">No messages yet. Say hi! 👋</p>'; }
        if (k === "mute") { await api("tigoSocial", "mute", { user_id: m.user.id, on: true }); list = list.filter((x) => x.user.id !== m.user.id); msgs.innerHTML = list.map(row).join(""); toast("Muted @" + m.user.username + ". You won't see their World chat."); }
        if (k === "report") {
          const r = await api("moderation", "report", { target_type: "user", target_id: m.user.id, reason: "harassment", note: "Tigo World chat #" + m.id + ": " + m.body });
          toast(r.already ? "You already reported them. Thank you." : "Reported. Thank you — we'll take a look.");
        }
      } catch (err) { toast(err.message); }
    });
  }

  // ---------- 👥 Friends ----------
  function friends() {
    body.innerHTML = '<form class="ts-find"><input type="search" class="input" maxlength="40" placeholder="Find people by name…" aria-label="Find people" autocomplete="off"><button class="btn btn-sm" type="submit">Find</button></form>' +
      '<div class="ts-found"></div><div class="ts-list"><p class="ts-note">Loading…</p></div>';
    const listEl = body.querySelector(".ts-list"), found = body.querySelector(".ts-found"), form = body.querySelector(".ts-find");
    let list = [], res = [];
    const status = (f) => f.online ? '<i class="ts-on"></i>' + (f.game ? "Playing " + esc(GAME_NAMES[f.game] || "a game") : "In Tigo now") : "Offline";
    const paint = () => {
      listEl.innerHTML = list.length ? list.map((f, i) =>
        '<div class="ts-row">' + ava(f.user) + '<span class="ts-main"><b translate="no">@' + esc(f.user.username) + "</b><small>" + status(f) + (f.pet ? " · " + esc(f.pet.name) + " Lv " + f.pet.level : "") + "</small></span>" +
        '<span class="ts-acts">' + (f.joinable ? '<button type="button" class="btn btn-primary btn-sm" data-f="join" data-i="' + i + '">Join</button>' : "") +
        '<button type="button" class="btn btn-sm" data-f="visit" data-i="' + i + '" title="Visit their island">✈️ Visit</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-f="chat" data-i="' + i + '" aria-label="Chat">💬</button></span></div>').join("")
        : '<p class="ts-note">No friends here yet. Find people above and tap <b>Follow</b> — they become your Tigo friends.</p>';
    };
    const load = async () => { try { const r = await api("tigoSocial", "friends", {}); if (!alive || tab !== "friends") return; list = r.list || []; paint(); } catch (e) { listEl.innerHTML = '<p class="ts-note">' + esc(e.message) + "</p>"; } };
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 30000); offs.push(() => clearInterval(t));
    const paintFound = () => {
      found.innerHTML = res.length ? '<p class="ts-h">People</p>' + res.map((u, i) => '<div class="ts-row">' + ava(u) + '<span class="ts-main"><b translate="no">@' + esc(u.username) + "</b><small>" + esc(u.display_name || "") + "</small></span>" +
        '<span class="ts-acts"><button type="button" class="btn btn-sm ' + (u.following || u.requested ? "btn-ghost" : "btn-primary") + '" data-fo="' + i + '"' + (u.following || u.requested ? " disabled" : "") + ">" + (u.following ? "Friends ✓" : u.requested ? "Requested" : "＋ Follow") + "</button></span></div>").join("")
        : '<p class="ts-note">No one found.</p>';
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); const q = form.querySelector("input").value.trim();
      if (!q) { found.innerHTML = ""; return; }
      found.innerHTML = '<p class="ts-note">Searching…</p>';
      try { const r = await api("social", "people", { q }); res = r.list || []; paintFound(); } catch (err) { found.innerHTML = '<p class="ts-note">' + esc(err.message) + "</p>"; }
    });
    found.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-fo]"); if (!b) return; const u = res[+b.dataset.fo]; b.disabled = true;
      try { const r = await api("social", "follow", { user_id: u.id }); u.following = !!r.following; u.requested = !!r.requested; paintFound(); if (r.following) { toast("You now follow @" + u.username + " 🎉"); load(); } else toast("Request sent to @" + u.username + "."); }
      catch (err) { b.disabled = false; toast(err.message); }
    });
    listEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-f]"); if (!b) return; const f = list[+b.dataset.i]; if (!f) return;
      if (b.dataset.f === "join" && o.onJoin) o.onJoin(f.game, f.code);
      if (b.dataset.f === "visit" && o.onVisit) o.onVisit(f);
      if (b.dataset.f === "chat") chatWith(f.user.id);
    });
  }

  // ---------- 💬 Chats (DM at group; parehong chat ng Messenger) ----------
  async function chatWith(uid) {
    try { const r = await api("messages", "start", { user_id: uid }); show("chats"); openChat(r.id); } catch (e) { toast(e.message); }
  }
  box._chatWith = chatWith;
  const titleOf = (c) => c.kind === "group" ? (c.title || c.members.map((m) => m.display_name || m.username).slice(0, 3).join(", ") || "Group") : nameOf(c.members[0]);
  function chats() {
    body.innerHTML = '<div class="ts-bar"><button type="button" class="btn btn-sm" data-new>👥 New group</button><a class="btn btn-ghost btn-sm" href="messages.html">Open Messenger</a></div><div class="ts-list"><p class="ts-note">Loading…</p></div>';
    const listEl = body.querySelector(".ts-list"); let list = [];
    api("messages", "inbox", {}).then((r) => {
      if (!alive || tab !== "chats" || !listEl.isConnected) return;
      list = (r.list || []).filter((c) => c.status !== "declined");
      listEl.innerHTML = list.length ? list.map((c, i) => '<button type="button" class="ts-row ts-chat" data-c="' + i + '">' + (c.kind === "group" ? '<span class="ts-av">👥</span>' : ava(c.members[0])) +
        '<span class="ts-main"><b>' + esc(titleOf(c)) + "</b><small>" + esc((c.last && (c.last.text || c.last.body)) || (typeof c.last === "string" ? c.last : "") || "No messages yet") + "</small></span>" +
        (c.unread ? '<i class="ts-badge">' + (c.unread > 99 ? "99+" : c.unread) + "</i>" : "") + "</button>").join("")
        : '<p class="ts-note">No chats yet. Open <b>Friends</b> and tap 💬, or make a group.</p>';
    }).catch((e) => { listEl.innerHTML = '<p class="ts-note">' + esc(e.message) + "</p>"; });
    listEl.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (b && list[+b.dataset.c]) openChat(list[+b.dataset.c].id); });
    body.querySelector("[data-new]").addEventListener("click", newGroup);
  }
  async function newGroup() {
    off(); body.className = "ts-body ts-group"; body.innerHTML = '<p class="ts-note">Loading…</p>';
    let fr = [];
    try { fr = ((await api("tigoSocial", "friends", {})).list || []); } catch (e) { toast(e.message); }
    if (!alive) return;
    body.innerHTML = '<div class="ts-bar"><button type="button" class="btn btn-ghost btn-sm" data-back>‹ Chats</button><b>New group</b></div>' +
      '<input type="text" class="input ts-gname" maxlength="60" placeholder="Group name (optional)" aria-label="Group name">' +
      '<div class="ts-list">' + (fr.length ? fr.map((f) => '<label class="ts-row ts-pick"><input type="checkbox" value="' + esc(f.user.id) + '">' + ava(f.user) + '<span class="ts-main"><b translate="no">@' + esc(f.user.username) + "</b><small>" + esc(f.user.display_name || "") + "</small></span></label>").join("")
        : '<p class="ts-note">Follow some people first, then you can put them in a group.</p>') + "</div>" +
      '<button type="button" class="btn btn-primary" data-make disabled>Create group</button><p class="ts-note">Choose at least 2 friends.</p>';
    const mk = body.querySelector("[data-make]");
    const picked = () => [...body.querySelectorAll(".ts-pick input:checked")].map((x) => x.value);
    body.querySelector(".ts-list").addEventListener("change", () => { mk.disabled = picked().length < 2; });
    body.querySelector("[data-back]").addEventListener("click", () => show("chats"));
    mk.addEventListener("click", async () => {
      mk.disabled = true;
      try { const r = await api("messages", "group", { user_ids: picked(), title: body.querySelector(".ts-gname").value }); openChat(r.id); }
      catch (e) { mk.disabled = false; toast(e.message); }
    });
  }
  const bodyOf = (m) => m.deleted ? "<i>Message removed</i>" : m.hidden ? "<i>Hidden</i>" : m.kind === "photo" ? "📷 Photo" : m.kind === "location" ? "📍 Location" : m.kind === "gif" ? "GIF"
    : m.kind === "sticker" ? (window.TMN_STICKERS && TMN_STICKERS.get(m.body) ? TMN_STICKERS.svg(m.body, 72) : "🙂 Sticker") : esc(m.body || "");
  async function openChat(id) {
    off(); tab = "chats"; body.className = "ts-body ts-conv"; body.innerHTML = '<p class="ts-note">Loading…</p>';
    box.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tab === "chats")));
    let r;
    try { r = await api("messages", "open", { id }); } catch (e) { body.innerHTML = '<p class="ts-note">' + esc(e.message) + "</p>"; return; }
    if (!alive) return;
    const U = {}; (r.members || []).forEach((m) => { U[m.id] = m; });
    const others = (r.members || []).filter((m) => m.id !== (o.me && o.me.id));
    const title = r.chat.kind === "group" ? (r.chat.title || others.map((m) => m.display_name || m.username).slice(0, 3).join(", ") || "Group") : nameOf(others[0]);
    let list = r.messages || [], busy = false;
    body.innerHTML = '<div class="ts-bar"><button type="button" class="btn btn-ghost btn-sm" data-back>‹ Chats</button><b class="ts-ct">' + esc(title) + '</b><a class="btn btn-ghost btn-sm" href="messages.html?c=' + encodeURIComponent(id) + '" aria-label="Open in Messenger">↗</a></div>' +
      '<div class="ts-msgs" aria-live="polite"></div>' +
      (r.chat.status === "active" || !r.chat.status ? '<form class="ts-send"><input type="text" class="input" maxlength="2000" placeholder="Message…" aria-label="Message" autocomplete="off" enterkeyhint="send"><button class="btn btn-primary btn-sm" type="submit">Send</button></form>'
        : '<p class="ts-note">This is a message request. Open Messenger to accept it.</p>');
    const msgs = body.querySelector(".ts-msgs");
    const row = (m) => m.kind === "system" ? '<p class="ts-sys">' + esc(m.body || "") + "</p>"
      : '<div class="ts-b' + (m.mine ? " me" : "") + '">' + (!m.mine && r.chat.kind === "group" && U[m.user_id] ? '<b translate="no">@' + esc(U[m.user_id].username) + "</b>" : "") + "<span>" + bodyOf(m) + "</span><small>" + hhmm(m.at) + "</small></div>";
    const paint = () => { msgs.innerHTML = list.length ? list.map(row).join("") : '<p class="ts-note">Say hi! 👋</p>'; msgs.scrollTop = msgs.scrollHeight; };
    const order = () => { list.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)); };
    order(); paint();
    const fresh = async () => {
      if (busy || !alive) return; busy = true;
      try {
        const lastAt = list.length ? list[list.length - 1].at : null;
        const q = await api("messages", "open", lastAt ? { id, after: lastAt } : { id });
        const add = (q.messages || []).filter((m) => !list.some((x) => x.id === m.id));
        if (add.length) { list = list.concat(add); order(); paint(); }
      } catch (e) {}
      busy = false;
    };
    if (window.TMN_RT && r.chat.channel) { const ch = TMN_RT.join(r.chat.channel, (ev) => { if (ev !== "typing") fresh(); }); offs.push(() => ch.leave()); }
    const t = setInterval(() => { if (!document.hidden) fresh(); }, 10000); offs.push(() => clearInterval(t));
    body.querySelector("[data-back]").addEventListener("click", () => show("chats"));
    const form = body.querySelector(".ts-send");
    if (form) form.addEventListener("submit", async (e) => {
      e.preventDefault(); const inp = form.querySelector("input"), v = inp.value.trim(); if (!v) return;
      const btn = form.querySelector("button"); btn.disabled = true;
      try {
        const s = await api("messages", "send", { id, kind: "text", body: v, client_id: "tg" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) });
        inp.value = ""; if (s.message && !list.some((x) => x.id === s.message.id)) { list.push(s.message); paint(); }
      } catch (err) { toast(err.message); }
      btn.disabled = false; inp.focus();
    });
  }
  box._openChat = openChat;
  show(tab);
  return box;
}
