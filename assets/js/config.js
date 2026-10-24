/* TigoMeNote · config.js
   LAHAT ng backend URL dito lang. Walang page na may sariling URL.
   Pag may bagong edge function: idagdag sa `fn` sa baba. */
(function () {
  var SUPABASE_URL = "https://njwtfoimkorkcysxvrqb.supabase.co";

  // Root ng site (gumagana sa GitHub Pages project link o custom domain).
  // Kinukuha mula sa lokasyon ng file na ito: <root>/assets/js/config.js
  var me = document.currentScript && document.currentScript.src;
  var root = me ? me.replace(/assets\/js\/config\.js(\?.*)?$/, "") : "/";

  window.TMN_CONFIG = Object.freeze({
    appName: "TigoMeNote",
    version: "0.11.10",
    root: root,
    supabaseUrl: SUPABASE_URL,
    // Public key lang ito (ligtas sa browser). Gagamitin sa Realtime ng messenger.
    publishableKey: "sb_publishable_wsx8gUJXqBAnzKTEwYYseA_MrI9OHjP",
    functionsUrl: SUPABASE_URL + "/functions/v1/",
    fn: Object.freeze({
      auth: SUPABASE_URL + "/functions/v1/auth-fast",
      posts: SUPABASE_URL + "/functions/v1/posts-fast",
      profile: SUPABASE_URL + "/functions/v1/profile-fast",
      social: SUPABASE_URL + "/functions/v1/social-fast",
      safety: SUPABASE_URL + "/functions/v1/safety-fast",
      wellbeing: SUPABASE_URL + "/functions/v1/wellbeing-fast",
      moderation: SUPABASE_URL + "/functions/v1/moderation-fast",
      notify: SUPABASE_URL + "/functions/v1/notify-fast",
      messages: SUPABASE_URL + "/functions/v1/messages-fast",
      gifs: SUPABASE_URL + "/functions/v1/gifs-fast",
      daily: SUPABASE_URL + "/functions/v1/daily-fast",
      pet: SUPABASE_URL + "/functions/v1/pet-fast"
      // brain: SUPABASE_URL + "/functions/v1/brain-fast",
      // chat:  SUPABASE_URL + "/functions/v1/chat",
    }),
    // Map (Locate / SOS): Leaflet + OpenStreetMap (libre, walang key)
    map: Object.freeze({
      css: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
      js: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
      tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
      directions: "https://www.google.com/maps/dir/?api=1&destination="
    }),
    // Policies (public pages, nasa root/legal/). contactEmail: email para sa copyright/privacy requests (ilagay kapag meron na)
    legal: Object.freeze({
      home: root + "legal/index.html",
      terms: root + "legal/terms.html",
      privacy: root + "legal/privacy.html",
      guidelines: root + "legal/guidelines.html",
      copyright: root + "legal/copyright.html",
      thirdParty: root + "legal/third-party.html",
      contactEmail: ""
    }),
    // Emergency hotlines na lumalabas sa SOS (country code → numero)
    emergency: Object.freeze({ BH: "999", PH: "911", default: "112" }),
    // Service worker (push notifications) — nasa root ng site
    serviceWorker: root + "sw.js",
    storageKeys: Object.freeze({
      token: "tmnToken",
      user: "tmnUser",
      checkedAt: "tmnCheckedAt",
      theme: "tmnTheme"
    })
  });
})();
