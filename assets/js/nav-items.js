/* TigoMeNote · nav-items.js
   ★ ITO LANG ANG I-EDIT PARA SA MENU ★
   Sidebar (desktop), hamburger drawer (phone) at bottom tabs (phone) — lahat galing dito.

   Bawat item:
     id     – kapareho ng <body data-page="..."> ng page (para ma-highlight)
     label  – text na lalabas
     icon   – pangalan mula sa icons.js
     href   – path mula sa root ng site
     role   – (optional) "Admin" = admin lang makakakita
     primary– (optional) true = malaking button sa gitna ng bottom tabs
*/
window.TMN_NAV = {
  // Main menu
  main: [
    { id: "home",     label: "Daily",    icon: "sun",     href: "app/home.html" },
    { id: "gallery",  label: "Gallery",  icon: "album",   href: "app/gallery.html" },
    { id: "explore",  label: "Explore",  icon: "compass", href: "app/explore.html" },
    { id: "share",    label: "Share",    icon: "plus",    href: "app/share.html", primary: true },
    { id: "messages", label: "Messages", icon: "chat",    href: "app/messages.html" },
    { id: "profile",  label: "Profile",  icon: "user",    href: "app/profile.html" }
  ],

  // Ibaba ng menu (sidebar + hamburger lang, wala sa bottom tabs)
  more: [
    { id: "settings", label: "Settings", icon: "gear",    href: "app/settings.html" }
    // Halimbawa ng admin-only (pag nagawa na ang page):
    // { id: "admin", label: "Admin", icon: "shield", href: "app/admin/index.html", role: "Admin" }
  ],

  // Alin sa main ang lalabas sa bottom tabs ng phone (max 5)
  tabs: ["home", "gallery", "share", "messages", "profile"]
};
