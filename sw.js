/* TigoMeNote · sw.js — service worker (push notifications lang)
   Tumatanggap ng push mula sa safety-fast (SOS, invites), notify-fast (reactions, comments, followers…) at daily-fast (reminders, alarms).
   Kapag pinindot: binubuksan ang tamang page. Kapag bukas ang app: sinasabihan din ang page (para tumunog ang alarm).
   Walang offline caching dito (hiwalay na trabaho kung gagawin). */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

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
