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
    version: "0.3.0",
    root: root,
    supabaseUrl: SUPABASE_URL,
    // Public key lang ito (ligtas sa browser). Gagamitin sa Realtime ng messenger.
    publishableKey: "sb_publishable_wsx8gUJXqBAnzKTEwYYseA_MrI9OHjP",
    functionsUrl: SUPABASE_URL + "/functions/v1/",
    fn: Object.freeze({
      auth: SUPABASE_URL + "/functions/v1/auth-fast",
      posts: SUPABASE_URL + "/functions/v1/posts-fast",
      profile: SUPABASE_URL + "/functions/v1/profile-fast"
      // brain: SUPABASE_URL + "/functions/v1/brain-fast",
      // chat:  SUPABASE_URL + "/functions/v1/chat",
    }),
    storageKeys: Object.freeze({
      token: "tmnToken",
      user: "tmnUser",
      checkedAt: "tmnCheckedAt",
      theme: "tmnTheme"
    })
  });
})();
