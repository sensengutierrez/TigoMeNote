/* TigoMeNote · config.js
   LAHAT ng backend URL dito lang. Walang page na may sariling URL.
   Pag may bagong edge function: idagdag sa `fn` sa baba. */
(function () {
  var SUPABASE_URL = "https://njwtfoimkorkcysxvrqb.supabase.co";
  // Patakbuhin ang functions sa Mumbai (ap-south-1), katabi ng database: mas kaunting biyahe bawat tawag = mas mabilis
  var REGION = "?forceFunctionRegion=ap-south-1";

  // Root ng site (gumagana sa GitHub Pages project link o custom domain).
  // Kinukuha mula sa lokasyon ng file na ito: <root>/assets/js/config.js
  var me = document.currentScript && document.currentScript.src;
  var root = me ? me.replace(/assets\/js\/config\.js(\?.*)?$/, "") : "/";

  window.TMN_CONFIG = Object.freeze({
    appName: "TigoMeNote",
    version: "0.11.15",
    root: root,
    supabaseUrl: SUPABASE_URL,
    // Public key lang ito (ligtas sa browser). Gagamitin sa Realtime ng messenger.
    publishableKey: "sb_publishable_wsx8gUJXqBAnzKTEwYYseA_MrI9OHjP",
    functionsUrl: SUPABASE_URL + "/functions/v1/",
    fn: Object.freeze({
      auth: SUPABASE_URL + "/functions/v1/auth-fast" + REGION,
      posts: SUPABASE_URL + "/functions/v1/posts-fast" + REGION,
      profile: SUPABASE_URL + "/functions/v1/profile-fast" + REGION,
      social: SUPABASE_URL + "/functions/v1/social-fast" + REGION,
      safety: SUPABASE_URL + "/functions/v1/safety-fast" + REGION,
      wellbeing: SUPABASE_URL + "/functions/v1/wellbeing-fast" + REGION,
      moderation: SUPABASE_URL + "/functions/v1/moderation-fast" + REGION,
      notify: SUPABASE_URL + "/functions/v1/notify-fast" + REGION,
      messages: SUPABASE_URL + "/functions/v1/messages-fast" + REGION,
      gifs: SUPABASE_URL + "/functions/v1/gifs-fast" + REGION,
      daily: SUPABASE_URL + "/functions/v1/daily-fast" + REGION,
      pet: SUPABASE_URL + "/functions/v1/pet-fast" + REGION,
      sounds: SUPABASE_URL + "/functions/v1/sounds-fast" + REGION
      // brain: SUPABASE_URL + "/functions/v1/brain-fast" + REGION,
      // chat:  SUPABASE_URL + "/functions/v1/chat" + REGION,
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
