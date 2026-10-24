/* TigoMeNote · auth-guard.js
   Ilagay sa <head> ng bawat PRIVATE page, pagkatapos ng config.js.
   - Itinatago ang page hanggang ma-check ang session (cache 60 s)
   - Redirect sa login kapag walang/expired ang token
   - window.TMN_TOKEN, window.TMN_USER, window.TMN_AUTH.logout() */
(function () {
  var C = window.TMN_CONFIG, K = C.storageKeys;
  var CACHE_MS = 10 * 60 * 1000; // bawat 10 min lang tinitingnan ulit (ang bawat API call ay may sariling check ng session)

  var style = document.createElement("style");
  style.id = "tmn-guard-style";
  style.textContent = "html.tmn-guard body{visibility:hidden}";
  document.head.appendChild(style);
  document.documentElement.classList.add("tmn-guard");

  function get(store, key) { try { return window[store].getItem(key); } catch (e) { return null; } }
  function set(store, key, val) { try { window[store].setItem(key, val); } catch (e) {} }
  function del(key) {
    try { localStorage.removeItem(key); } catch (e) {}
    try { sessionStorage.removeItem(key); } catch (e) {}
  }
  function clearAll() { del(K.token); del(K.user); del(K.checkedAt); }

  var remembered = !!get("localStorage", K.token);
  var token = get("localStorage", K.token) || get("sessionStorage", K.token);
  var store = remembered ? "localStorage" : "sessionStorage";

  function toLogin() {
    var next = location.pathname + location.search + location.hash;
    location.replace(C.root + "login.html?next=" + encodeURIComponent(next));
  }
  function reveal() {
    document.documentElement.classList.remove("tmn-guard");
    document.dispatchEvent(new CustomEvent("tmn:user", { detail: window.TMN_USER }));
  }

  if (!token) { toLogin(); return; }

  var user = null;
  try { user = JSON.parse(get(store, K.user) || "null"); } catch (e) {}
  window.TMN_TOKEN = token;
  window.TMN_USER = user;

  window.TMN_AUTH = {
    // Palitan ang naka-save na user (hal. pagka-edit ng profile) at i-refresh ang menu
    setUser: function (u) {
      window.TMN_USER = u;
      set(store, K.user, JSON.stringify(u));
      document.dispatchEvent(new CustomEvent("tmn:user", { detail: u }));
    },
    logout: async function () {
      try {
        await fetch(C.fn.auth, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify({ action: "logout", token: token })
        });
      } catch (e) {}
      // Burahin ang mga photo na naka-cache sa device (sw.js) para hindi makita ng susunod na gagamit
      try { if (window.caches) await caches.delete("tmn-media-v1"); } catch (e) {}
      clearAll();
      location.replace(C.root + "login.html");
    }
  };

  var checkedAt = Number(get("sessionStorage", K.checkedAt) || 0);
  var fresh = user && Date.now() - checkedAt < CACHE_MS;

  if (fresh) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", reveal); else reveal();
    return;
  }

  fetch(C.fn.auth, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({ action: "checkSession", token: token })
  })
    .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); })
    .then(function (res) {
      if (res.j && res.j.ok) {
        window.TMN_USER = res.j.user;
        set(store, K.user, JSON.stringify(res.j.user));
        set("sessionStorage", K.checkedAt, String(Date.now()));
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", reveal); else reveal();
      } else if (res.status === 401 || res.status === 403) {
        clearAll(); toLogin();
      } else {
        // Server error: payagan muna gamit ang naka-save na user, para hindi ma-logout dahil lang sa hiccup
        if (user) reveal(); else { clearAll(); toLogin(); }
      }
    })
    .catch(function () {
      // Offline: ipakita muna gamit ang naka-save na user
      if (user) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", reveal); else reveal(); }
      else toLogin();
    });
})();
