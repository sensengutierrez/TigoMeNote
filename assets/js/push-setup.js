/* TigoMeNote · push-setup.js — notifications sa device na ito (para dumating ang SOS kahit sarado ang page)
   TMN_PUSH.status()  → Promise<"on" | "off" | "denied" | "unsupported" | "ios-home">
   TMN_PUSH.enable()  → hihingi ng permission, mag-subscribe, ipapadala sa server (safety-fast)
   TMN_PUSH.disable() · TMN_PUSH.test()
   Sa APK: FCM token mula sa TMN_NATIVE.pushToken() ang ipapadala (kind "fcm").
   Kusang nire-register ang sw.js at nire-refresh ang subscription isang beses bawat araw. */
(function () {
  var C = window.TMN_CONFIG, N = window.TMN_NATIVE;
  var SYNC_KEY = "tmnPushSync";

  function isIOS() { return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function standalone() { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; }
  function supported() { return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window; }

  var regP = null;
  function register() {
    if (!("serviceWorker" in navigator)) return Promise.resolve(null);
    if (!regP) regP = navigator.serviceWorker.register(C.serviceWorker, { scope: C.root }).then(function () { return navigator.serviceWorker.ready; }).catch(function (e) { regP = null; throw e; });
    return regP;
  }
  function keyBytes(b64) {
    var s = b64.replace(/-/g, "+").replace(/_/g, "/"); s += "===".slice((s.length + 3) % 4);
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function send(sub) {
    var j = sub.toJSON();
    return TMN_API.call("safety", "subscribe", { kind: "webpush", endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth });
  }

  async function status() {
    if (N && N.isApp) return (await N.pushToken()) ? "on" : "off";
    if (!supported()) return isIOS() && !standalone() ? "ios-home" : "unsupported";
    if (Notification.permission === "denied") return "denied";
    if (Notification.permission !== "granted") return "off";
    try { var reg = await register(); return (await reg.pushManager.getSubscription()) ? "on" : "off"; } catch (e) { return "off"; }
  }

  async function enable() {
    if (N && N.isApp) {
      var tok = await N.pushToken();
      if (!tok) throw new Error("Allow notifications for TigoMeNote in your phone settings.");
      await TMN_API.call("safety", "subscribe", { kind: "fcm", endpoint: tok });
      return "on";
    }
    if (!supported()) {
      if (isIOS() && !standalone()) throw new Error("On iPhone: tap Share → Add to Home Screen, then open TigoMeNote from your home screen and turn on alerts there.");
      throw new Error("This browser can't receive notifications. Try Chrome.");
    }
    var perm = await Notification.requestPermission();
    if (perm !== "granted") throw new Error("Notifications are blocked. Allow them in your browser settings for this site.");
    var reg = await register();
    var sub = await reg.pushManager.getSubscription();
    if (!sub) {
      var k = await TMN_API.call("safety", "pushKey", {});
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(k.key) });
    }
    await send(sub);
    try { localStorage.setItem(SYNC_KEY, String(Date.now())); } catch (e) {}
    return "on";
  }

  async function disable() {
    if (!supported()) return "off";
    var reg = await register(), sub = await reg.pushManager.getSubscription();
    if (sub) {
      try { await TMN_API.call("safety", "unsubscribe", { endpoint: sub.endpoint }); } catch (e) {}
      await sub.unsubscribe();
    }
    return "off";
  }
  function test() { return TMN_API.call("safety", "testPush", {}); }

  // Tahimik na pag-refresh (walang tanong sa user)
  async function quietSync() {
    if (!window.TMN_TOKEN || !navigator.onLine || !supported() || Notification.permission !== "granted") return;
    try {
      var last = Number(localStorage.getItem(SYNC_KEY) || 0);
      var reg = await register(), sub = await reg.pushManager.getSubscription();
      if (sub && Date.now() - last > 86400000) { await send(sub); localStorage.setItem(SYNC_KEY, String(Date.now())); }
    } catch (e) {}
  }
  if (supported()) { register().catch(function () {}); setTimeout(quietSync, 4000); }

  window.TMN_PUSH = { status: status, enable: enable, disable: disable, test: test, register: register, isIOS: isIOS, standalone: standalone };
})();
