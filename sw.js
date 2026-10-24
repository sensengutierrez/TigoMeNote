/* TigoMeNote · sw.js — service worker: push notifications + cache sa phone (para mabilis at tipid sa data)
   Push: galing sa safety-fast (SOS, invites), notify-fast (reactions, comments…) at daily-fast (reminders, alarms).
   Cache (sa device lang):
     - App files (assets/… na may ?v=): kunin muna sa cache; bago ang ?v= kapag may update, kaya laging tama.
     - Pages (.html): network muna; kapag walang internet, ang huling nakuha.
     - Photos ng posts/status/profile (Supabase Storage): isang beses lang dina-download; nagbabago ang link kada oras
       pero pareho ang file, kaya ang "path" ang susi. Hanggang 300 photos, inaalis ang pinakaluma.
     - Google Fonts: cache muna.
   Hindi kinache: tawag sa server (functions), videos (Range), at kahit anong POST. */
var STATIC = "tmn-static-v1", PAGES = "tmn-pages-v1", MEDIA = "tmn-media-v1", FONTS = "tmn-fonts-v1";
var MEDIA_MAX = 300, STATIC_MAX = 400;
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return /^tmn-/.test(k) && [STATIC, PAGES, MEDIA, FONTS].indexOf(k) < 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function trim(name, max) {
  return caches.open(name).then(function (c) { return c.keys().then(function (ks) { if (ks.length <= max) return; return Promise.all(ks.slice(0, ks.length - max).map(function (k) { return c.delete(k); })); }); });
}
// App file: cache muna. Kapag bagong ?v=, burahin ang lumang bersyon ng parehong file.
function staticFirst(req) {
  return caches.open(STATIC).then(function (c) {
    return c.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok) {
          var path = new URL(req.url).pathname;
          c.put(req, res.clone()).then(function () {
            return c.keys().then(function (ks) { ks.forEach(function (k) { if (k.url !== req.url && new URL(k.url).pathname === path) c.delete(k); }); });
          }).then(function () { return trim(STATIC, STATIC_MAX); });
        }
        return res;
      });
    });
  });
}
function pageNetworkFirst(req) {
  return fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(PAGES).then(function (c) { c.put(req.url.split("#")[0].split("?")[0], copy); }); }
    return res;
  }).catch(function () {
    return caches.open(PAGES).then(function (c) { return c.match(req.url.split("#")[0].split("?")[0]); }).then(function (hit) { return hit || Response.error(); });
  });
}
// Photo sa Supabase Storage: ang susi ay ang path (walang token), kaya hindi na dina-download ulit
function mediaFirst(req) {
  var u = new URL(req.url), key = u.origin + u.pathname;
  return caches.open(MEDIA).then(function (c) {
    return c.match(key).then(function (hit) {
      if (hit) return hit;
      return fetch(new Request(req.url, { mode: "cors", credentials: "omit" })).then(function (res) {
        if (res && res.ok && res.type !== "opaque") { c.put(key, res.clone()).then(function () { return trim(MEDIA, MEDIA_MAX); }); }
        return res;
      }).catch(function () { return fetch(req); });
    });
  });
}
function fontsFirst(req) {
  return caches.open(FONTS).then(function (c) {
    return c.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; });
    });
  });
}
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  var u = new URL(req.url), scope = new URL(self.registration.scope);
  if (u.origin === scope.origin && u.pathname.indexOf(scope.pathname) === 0) {
    if (req.mode === "navigate" || /\.html$/.test(u.pathname)) return e.respondWith(pageNetworkFirst(req));
    if (/\/assets\//.test(u.pathname) && u.searchParams.has("v")) return e.respondWith(staticFirst(req));
    if (/\/assets\/(vendor|img|fonts)\//.test(u.pathname)) return e.respondWith(staticFirst(req));
    return;
  }
  if (/\.supabase\.co$/.test(u.hostname) && /^\/storage\/v1\/object\/(sign|public)\//.test(u.pathname) && req.destination === "image") return e.respondWith(mediaFirst(req));
  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") return e.respondWith(fontsFirst(req));
});

self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "TigoMeNote", body: e.data ? e.data.text() : "" }; }
  var sos = d.type === "sos", alarm = d.type === "alarm";
  var base = self.registration.scope;
  var opts = {
    body: d.body || "",
    icon: base + "assets/img/icon-192.png",
    badge: base + "assets/img/badge-72.png",
    tag: (d.type || "tmn") + "-" + (d.id || ""),
    renotify: true,
    requireInteraction: sos || alarm, // alarm (Daily): nananatili sa screen hanggang pindutin
    vibrate: sos ? [800, 300, 800, 300, 800, 300, 800] : alarm ? [600, 200, 600, 200, 600, 200, 600, 200, 600] : d.type === "reminder" ? [300, 150, 300] : [200],
    data: { url: d.url || "app/home.html", type: d.type, id: d.id }
  };
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    list.forEach(function (c) { c.postMessage({ type: "tmn-push", data: d }); });
    // Message: huwag nang ipakita kung bukas at nakikita mo na ang chat na iyon
    var open = d.type === "message" && list.some(function (c) { return c.focused && c.url.indexOf("messages.html") > -1 && c.url.indexOf("c=" + d.id) > -1; });
    if (!open) return self.registration.showNotification(d.title || "TigoMeNote", opts);
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || "app/home.html", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && "focus" in list[i]) {
        return list[i].focus().then(function (c) { return c.navigate ? c.navigate(url) : c; });
      }
    }
    return self.clients.openWindow(url);
  }));
});
