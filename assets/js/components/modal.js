/* TigoMeNote · components/modal.js
   Iisang modal para sa buong site.
     var m = TMN_MODAL.open({ title, body: Node|html, size: "sm"|"md"|"lg"|"full", actions: [{label, cls, onClick}] })
     m.close()
     await TMN_MODAL.confirm("Burahin?", { okText: "Delete", danger: true })  → true/false
     await TMN_MODAL.prompt("Album name", { value, placeholder })            → text o null
   Phone: lumalabas mula sa ibaba (sheet). Esc o click sa labas = close. */
(function () {
  var I = function (n) { return window.TMN_ICON ? window.TMN_ICON(n) : ""; };
  var stack = [];

  function open(opts) {
    opts = opts || {};
    var back = document.createElement("div");
    back.className = "modal-backdrop";
    var box = document.createElement("div");
    box.className = "modal modal-" + (opts.size || "md") + (opts.cls ? " " + opts.cls : "");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.tabIndex = -1;

    if (opts.title !== false) {
      var head = document.createElement("div");
      head.className = "modal-head";
      var h = document.createElement("h3");
      h.textContent = opts.title || "";
      var x = document.createElement("button");
      x.type = "button"; x.className = "icon-btn"; x.setAttribute("aria-label", "Close"); x.innerHTML = I("x");
      x.addEventListener("click", function () { close(); });
      head.appendChild(h); head.appendChild(x);
      box.appendChild(head);
    }

    var body = document.createElement("div");
    body.className = "modal-body";
    if (typeof opts.body === "string") body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);
    box.appendChild(body);

    if (opts.actions && opts.actions.length) {
      var foot = document.createElement("div");
      foot.className = "modal-foot";
      opts.actions.forEach(function (a) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "btn " + (a.cls || "btn-ghost");
        b.innerHTML = a.label;
        b.addEventListener("click", function () { if (a.onClick) a.onClick(api, b); else close(); });
        foot.appendChild(b);
      });
      box.appendChild(foot);
    }

    back.appendChild(box);
    document.body.appendChild(back);
    document.body.classList.add("modal-open");
    requestAnimationFrame(function () { back.classList.add("show"); });

    var lastFocus = document.activeElement;
    function onKey(e) {
      if (e.key === "Escape" && stack[stack.length - 1] === api && opts.closeOnEsc !== false) { e.stopPropagation(); close(); }
    }
    document.addEventListener("keydown", onKey, true);
    back.addEventListener("mousedown", function (e) { if (e.target === back && opts.closeOnBackdrop !== false) close(); });

    var closed = false;
    function close(result) {
      if (closed) return; closed = true;
      document.removeEventListener("keydown", onKey, true);
      back.classList.remove("show");
      stack.splice(stack.indexOf(api), 1);
      if (!stack.length) document.body.classList.remove("modal-open");
      setTimeout(function () { back.remove(); }, 200);
      if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
      if (opts.onClose) opts.onClose(result);
    }

    var api = { el: box, body: body, close: close };
    stack.push(api);
    setTimeout(function () {
      var f = box.querySelector("[autofocus], input, textarea, select");
      (f || box).focus({ preventScroll: true });
    }, 30);
    return api;
  }

  function confirm(message, o) {
    o = o || {};
    return new Promise(function (resolve) {
      var done = false;
      var p = document.createElement("p");
      p.className = "muted"; p.textContent = message;
      var m = open({
        title: o.title || "Sigurado ka ba?", size: "sm", body: p,
        actions: [
          { label: o.cancelText || "Cancel", cls: "btn-ghost", onClick: function () { done = true; m.close(); resolve(false); } },
          { label: o.okText || "OK", cls: o.danger ? "btn-danger-solid" : "btn-primary", onClick: function () { done = true; m.close(); resolve(true); } }
        ],
        onClose: function () { if (!done) resolve(false); }
      });
    });
  }

  function prompt(title, o) {
    o = o || {};
    return new Promise(function (resolve) {
      var done = false;
      var wrap = document.createElement("form");
      wrap.className = "field";
      var input = document.createElement("input");
      input.className = "input"; input.value = o.value || ""; input.placeholder = o.placeholder || "";
      input.maxLength = o.maxLength || 40;
      wrap.appendChild(input);
      function ok() {
        var v = input.value.trim();
        if (!v) { input.setAttribute("aria-invalid", "true"); input.focus(); return; }
        done = true; m.close(); resolve(v);
      }
      wrap.addEventListener("submit", function (e) { e.preventDefault(); ok(); });
      var m = open({
        title: title, size: "sm", body: wrap,
        actions: [
          { label: "Cancel", cls: "btn-ghost", onClick: function () { done = true; m.close(); resolve(null); } },
          { label: o.okText || "Save", cls: "btn-primary", onClick: ok }
        ],
        onClose: function () { if (!done) resolve(null); }
      });
      setTimeout(function () { input.select(); }, 40);
    });
  }

  window.TMN_MODAL = { open: open, confirm: confirm, prompt: prompt };
})();
