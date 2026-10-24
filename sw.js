/* TigoMeNote · sw.js — service worker (push notifications lang)
   Tumatanggap ng push mula sa safety-fast (SOS, invites) at ipinapakita bilang notification.
   Kapag pinindot: binubuksan ang tamang page. Kapag bukas ang app: sinasabihan din ang page (para tumunog ang alarm).
   Walang offline caching dito (hiwalay na trabaho kung gagawin). */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "TigoMeNote", body: e.data ? e.data.text() : "" }; }
  var sos = d.type === "sos";
  var base = self.registration.scope;
  var opts = {
    body: d.body || "",
    icon: base + "assets/img/icon-192.png",
    badge: base + "assets/img/badge-72.png",
    tag: (d.type || "tmn") + "-" + (d.id || ""),
    renotify: true,
    requireInteraction: sos,
    vibrate: sos ? [800, 300, 800, 300, 800, 300, 800] : [200],
    data: { url: d.url || "app/home.html", type: d.type, id: d.id }
  };
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || "TigoMeNote", opts),
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      list.forEach(function (c) { c.postMessage({ type: "tmn-push", data: d }); });
    })
  ]));
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
