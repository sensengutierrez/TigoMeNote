/* TigoMeNote · components/relation-picker.js — "Sino siya sa iyo?" (asawa, anak, magulang, kaibigan…)
     TMN_RELATION.html(kind, current)      → chips ng pagpipilian (Family o Friends) + "Other" na may sariling sulat
     TMN_RELATION.bind(el, onChange)       → pakinggan ang pinili; onChange(value | null)
     TMN_RELATION.label(value)             → "Spouse", "Child"… (isinasalin ng i18n) o ang sariling sulat
     TMN_RELATION.edit(link, onSaved)      → sheet para palitan ang label ng isang tao sa circle
   Naka-save: key (hal. "spouse") o sariling sulat (hal. "Ninang"), hanggang 24 letra. Ikaw lang ang nakakakita. */
(function () {
  var OPTIONS = {
    family: [["spouse", "Spouse"], ["partner", "Partner"], ["child", "Child"], ["parent", "Parent"], ["sibling", "Sibling"],
             ["grandparent", "Grandparent"], ["grandchild", "Grandchild"], ["relative", "Relative"]],
    friend: [["bestfriend", "Best friend"], ["friend", "Friend"], ["classmate", "Classmate"], ["coworker", "Coworker"], ["neighbor", "Neighbor"]]
  };
  var ALL = {};
  OPTIONS.family.concat(OPTIONS.friend).forEach(function (o) { ALL[o[0]] = o[1]; });
  function esc(s) { return window.TMN_UI ? TMN_UI.esc(s) : String(s); }
  function label(v) { return !v ? "" : ALL[v] || String(v); }

  function html(kind, current) {
    var opts = OPTIONS[kind === "friend" ? "friend" : "family"], custom = current && !ALL[current] ? current : "";
    return '<div class="rel" data-kind="' + kind + '"><span class="pe-label">Who are they to you?</span><div class="rel-chips">' +
      opts.map(function (o) { return '<button type="button" class="rel-chip" data-rel="' + o[0] + '" aria-pressed="' + (current === o[0]) + '">' + o[1] + "</button>"; }).join("") +
      '<button type="button" class="rel-chip" data-rel="__other" aria-pressed="' + (!!custom) + '">Other</button></div>' +
      '<input class="input rel-other' + (custom ? "" : " hidden") + '" maxlength="24" placeholder="e.g. Ninang, Tito, Kumpare" value="' + esc(custom) + '"></div>';
  }
  function bind(el, onChange) {
    var root = el.querySelector(".rel"); if (!root) return;
    var other = root.querySelector(".rel-other");
    function value() {
      var on = root.querySelector('.rel-chip[aria-pressed="true"]');
      if (!on) return null;
      if (on.dataset.rel === "__other") { var t = other.value.trim().replace(/\s+/g, " "); return t || null; }
      return on.dataset.rel;
    }
    root.addEventListener("click", function (e) {
      var b = e.target.closest(".rel-chip"); if (!b) return;
      var was = b.getAttribute("aria-pressed") === "true";
      root.querySelectorAll(".rel-chip").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      if (!was) b.setAttribute("aria-pressed", "true");
      other.classList.toggle("hidden", was || b.dataset.rel !== "__other");
      if (!was && b.dataset.rel === "__other") other.focus();
      if (onChange) onChange(value());
    });
    other.addEventListener("input", function () { if (onChange) onChange(value()); });
    return { value: value };
  }
  function edit(x, onSaved) {
    var body = document.createElement("div"), val = x.label || null;
    body.innerHTML = html(x.kind, x.label) + '<p class="faint small">Only you can see this.</p>';
    var api = bind(body, function (v) { val = v; });
    var m = TMN_MODAL.open({
      title: x.user.display_name || x.user.username, size: "sm", cls: "modal-sheet", body: body,
      actions: [
        { label: "Cancel", cls: "btn-ghost", onClick: function () { m.close(); } },
        { label: "Save", cls: "btn-primary", onClick: async function (a, btn) {
          btn.disabled = true;
          try { val = api.value(); await TMN_API.call("safety", "update", { id: x.id, label: val || "" }); x.label = val; m.close(); if (onSaved) onSaved(val); }
          catch (e) { btn.disabled = false; TMN_UI.toast(e.message); }
        } }
      ]
    });
  }

  window.TMN_RELATION = { html: html, bind: bind, label: label, edit: edit, OPTIONS: OPTIONS };
})();
