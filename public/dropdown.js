// Custom dropdowns: progressive enhancement over native <select>s.
// The native select stays in the DOM as the source of truth (app.js reads/writes it);
// this script renders a trigger button + popover listbox and keeps both in sync.
(function () {
  "use strict";
  var IDS = ["fCluster", "fTier", "cSegment", "cCount", "vLead", "iLead"];
  var SEARCH_MIN = 12; // show a search field when the list is this long
  var uid = 0;
  var openDD = null;
  var all = [];

  var CHEVRON = '<svg class="dd-chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  var CHECK = '<svg class="dd-check" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var SEARCH = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>';

  var protoValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  var protoIndex = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex");
  var measureCtx = document.createElement("canvas").getContext("2d");

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function enhance(select) {
    if (!select || select.dataset.ddEnhanced) return;
    select.dataset.ddEnhanced = "1";
    var id = "dd" + ++uid;
    var dark = !!select.closest(".phone");
    var full = dark || select.id === "iLead" || select.style.width === "100%";

    var wrap = el("div", "dd" + (dark ? " dd-dark" : "") + (full ? " dd-full" : ""));
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add("dd-native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    var trigger = el("button", "dd-trigger");
    trigger.type = "button";
    trigger.id = id + "-btn";
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", id + "-list");
    var label = el("span", "dd-label");
    trigger.appendChild(label);
    trigger.insertAdjacentHTML("beforeend", CHEVRON);
    wrap.appendChild(trigger);

    var pop = el("div", "dd-pop" + (dark ? " dd-dark" : ""));
    pop.hidden = true;
    var searchBox = el("div", "dd-search", SEARCH);
    var search = el("input");
    search.type = "text";
    search.placeholder = "Search…";
    search.setAttribute("aria-label", "Filter options");
    search.setAttribute("aria-controls", id + "-list");
    search.setAttribute("autocomplete", "off");
    searchBox.appendChild(search);
    pop.appendChild(searchBox);
    var list = el("div", "dd-list");
    list.id = id + "-list";
    list.tabIndex = -1;
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-labelledby", trigger.id);
    pop.appendChild(list);
    var empty = el("div", "dd-empty", "No matches");
    empty.hidden = true;
    pop.appendChild(empty);
    document.body.appendChild(pop);

    var dd = { select: select, wrap: wrap, trigger: trigger, pop: pop, items: [], active: -1, lastValue: null, lastDisabled: null };
    var typed = "", typedAt = 0;

    function useSearch() { return select.options.length >= SEARCH_MIN; }

    function syncLabel() {
      var o = select.options[select.selectedIndex];
      label.textContent = o ? o.textContent : "";
      label.classList.toggle("dd-placeholder", !o || o.value === "");
      trigger.disabled = select.disabled;
      wrap.classList.toggle("dd-disabled", select.disabled);
      dd.lastValue = select.value;
      dd.lastDisabled = select.disabled;
      dd.items.forEach(function (it) {
        var sel = it.opt.selected;
        it.node.setAttribute("aria-selected", sel ? "true" : "false");
        it.node.classList.toggle("dd-selected", sel);
      });
      if (select.disabled && openDD === dd) close(false);
    }

    function measure() {
      if (wrap.classList.contains("dd-full")) return;
      var cs = getComputedStyle(trigger);
      measureCtx.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
      var w = 0;
      for (var i = 0; i < select.options.length; i++) w = Math.max(w, measureCtx.measureText(select.options[i].textContent).width);
      // left padding 14 + chevron area 36 + border 2
      wrap.style.minWidth = Math.min(Math.ceil(w) + 54, 340) + "px";
    }
    dd.measure = measure;

    function rebuild() {
      list.innerHTML = "";
      dd.items = [];
      for (var i = 0; i < select.options.length; i++) {
        var o = select.options[i];
        var n = el("div", "dd-opt");
        n.id = id + "-o" + i;
        n.setAttribute("role", "option");
        n.dataset.i = i;
        var txt = el("span", "dd-opt-text");
        txt.textContent = o.textContent;
        n.title = o.textContent; // full text when ellipsized
        n.appendChild(txt);
        n.insertAdjacentHTML("beforeend", CHECK);
        if (o.disabled) { n.setAttribute("aria-disabled", "true"); n.classList.add("dd-off"); }
        list.appendChild(n);
        dd.items.push({ opt: o, node: n, text: o.textContent.toLowerCase(), hidden: false });
      }
      searchBox.hidden = !useSearch();
      dd.active = -1;
      if (openDD === dd) { applyFilter(); place(); }
      syncLabel();
      measure();
    }

    function selectable(it) { return !!it && !it.hidden && !it.opt.disabled; }

    function setActive(idx, scroll) {
      if (dd.items[dd.active]) dd.items[dd.active].node.classList.remove("dd-active");
      dd.active = idx;
      var it = dd.items[idx];
      var focusEl = searchBox.hidden ? list : search;
      if (it) {
        it.node.classList.add("dd-active");
        focusEl.setAttribute("aria-activedescendant", it.node.id);
        if (scroll) {
          var top = it.node.offsetTop, bottom = top + it.node.offsetHeight;
          if (top < list.scrollTop + 4) list.scrollTop = top - 4;
          else if (bottom > list.scrollTop + list.clientHeight - 4) list.scrollTop = bottom - list.clientHeight + 4;
        }
      } else {
        focusEl.removeAttribute("aria-activedescendant");
      }
    }

    function move(dir) {
      var i = dd.active;
      if (i < 0) return edge(dir > 0);
      while (true) {
        i += dir;
        if (i < 0 || i >= dd.items.length) return; // no wrap, like native
        if (selectable(dd.items[i])) return setActive(i, true);
      }
    }
    function edge(first) {
      var n = dd.items.length;
      for (var k = 0; k < n; k++) {
        var i = first ? k : n - 1 - k;
        if (selectable(dd.items[i])) return setActive(i, true);
      }
      setActive(-1, false);
    }

    function applyFilter() {
      var q = useSearch() ? search.value.trim().toLowerCase() : "";
      var shown = 0;
      dd.items.forEach(function (it) {
        it.hidden = !!q && it.text.indexOf(q) === -1;
        it.node.hidden = it.hidden;
        if (!it.hidden) shown++;
      });
      empty.hidden = shown > 0;
      if (!selectable(dd.items[dd.active])) edge(true);
    }

    function place() {
      var r = trigger.getBoundingClientRect();
      var vh = window.innerHeight, vw = window.innerWidth, gap = 6, margin = 12;
      pop.style.minWidth = r.width + "px";
      // Full-width triggers get a popover of exactly their width; compact ones may grow to fit labels.
      pop.style.maxWidth = (wrap.classList.contains("dd-full") ? r.width : Math.max(r.width, Math.min(420, vw - 2 * margin))) + "px";
      pop.style.maxHeight = "none";
      var natural = pop.scrollHeight;
      var below = vh - r.bottom - gap - margin, above = r.top - gap - margin;
      var up = below < Math.min(natural, 220) && above > below;
      var room = Math.max(120, up ? above : below);
      pop.style.maxHeight = Math.min(360, room) + "px";
      pop.classList.toggle("dd-up", up);
      var pw = pop.offsetWidth;
      pop.style.left = Math.max(margin, Math.min(r.left, vw - pw - margin)) + "px";
      if (up) { pop.style.top = "auto"; pop.style.bottom = (vh - r.top + gap) + "px"; }
      else { pop.style.bottom = "auto"; pop.style.top = (r.bottom + gap) + "px"; }
    }

    function open() {
      if (select.disabled || openDD === dd) return;
      if (openDD) openDD.close(false);
      openDD = dd;
      search.value = "";
      pop.hidden = false;
      pop.classList.remove("dd-in");
      applyFilter();
      trigger.setAttribute("aria-expanded", "true");
      wrap.classList.add("dd-open");
      place();
      var cur = select.selectedIndex;
      if (selectable(dd.items[cur])) setActive(cur, false); else edge(true);
      var it = dd.items[dd.active];
      if (it) list.scrollTop = Math.max(0, it.node.offsetTop - list.clientHeight / 2 + it.node.offsetHeight / 2);
      void pop.offsetWidth; // restart the enter transition
      pop.classList.add("dd-in");
      (searchBox.hidden ? list : search).focus({ preventScroll: true });
    }

    function close(refocus) {
      if (openDD !== dd) return;
      openDD = null;
      pop.classList.remove("dd-in");
      pop.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      wrap.classList.remove("dd-open");
      if (refocus) trigger.focus({ preventScroll: true });
    }
    dd.close = close;
    dd.place = place;

    function choose(idx) {
      var it = dd.items[idx];
      if (!it || it.opt.disabled) return;
      var changed = select.selectedIndex !== idx;
      protoIndex.set.call(select, idx);
      syncLabel();
      close(true);
      if (changed) {
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    // Type-ahead: repeated same letter cycles; a typed word matches a prefix.
    // Also matches after a "12. " rank prefix so typing a firm name works.
    function typeAhead(ch) {
      var now = Date.now();
      typed = now - typedAt > 700 ? ch : typed + ch;
      typedAt = now;
      var n = dd.items.length;
      if (!n) return -1;
      var cycling = typed.split("").every(function (c) { return c === typed[0]; });
      var q = cycling ? typed[0] : typed;
      var start = openDD === dd ? dd.active : select.selectedIndex;
      var off = cycling ? 1 : 0;
      for (var k = 0; k < n; k++) {
        var i = (Math.max(start, 0) + off + k) % n;
        var it = dd.items[i];
        if (!selectable(it)) continue;
        if (it.text.indexOf(q) === 0 || it.text.replace(/^\d+\.\s*/, "").indexOf(q) === 0) return i;
      }
      return -1;
    }

    function onKey(e) {
      var isOpen = openDD === dd;
      var inSearch = e.target === search;
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); if (!isOpen) open(); else move(1); return;
        case "ArrowUp": e.preventDefault(); if (!isOpen) open(); else move(-1); return;
        case "Home": if (isOpen && !(inSearch && search.value)) { e.preventDefault(); edge(true); } return;
        case "End": if (isOpen && !(inSearch && search.value)) { e.preventDefault(); edge(false); } return;
        case "Enter": e.preventDefault(); if (!isOpen) open(); else choose(dd.active); return;
        case " ":
          if (inSearch) return; // a space typed into the filter
          e.preventDefault(); if (!isOpen) open(); else choose(dd.active); return;
        case "Escape": if (isOpen) { e.preventDefault(); e.stopPropagation(); close(true); } return;
        case "Tab": if (isOpen) { e.preventDefault(); close(true); } return;
      }
      if (!inSearch && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var i = typeAhead(e.key.toLowerCase());
        if (i < 0) return;
        e.preventDefault();
        if (isOpen) setActive(i, true); else choose(i);
      }
    }

    trigger.addEventListener("click", function () { if (openDD === dd) close(true); else open(); });
    trigger.addEventListener("keydown", onKey);
    list.addEventListener("keydown", onKey);
    search.addEventListener("keydown", onKey);
    search.addEventListener("input", function () { applyFilter(); place(); });
    pop.addEventListener("mousedown", function (e) { if (e.target !== search) e.preventDefault(); }); // keep focus put
    list.addEventListener("click", function (e) {
      var n = e.target.closest(".dd-opt");
      if (n) choose(+n.dataset.i);
    });
    list.addEventListener("mousemove", function (e) {
      var n = e.target.closest(".dd-opt");
      if (n && +n.dataset.i !== dd.active && !n.classList.contains("dd-off")) setActive(+n.dataset.i, false);
    });

    // Options added/removed/renamed, or the select disabled/enabled.
    new MutationObserver(function (muts) {
      var structural = muts.some(function (m) { return m.type !== "attributes" || m.target !== select; });
      if (structural) rebuild(); else syncLabel();
    }).observe(select, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["disabled", "selected", "label", "value"] });

    // Programmatic select.value = x / select.selectedIndex = n
    try {
      Object.defineProperty(select, "value", {
        configurable: true,
        get: function () { return protoValue.get.call(this); },
        set: function (v) { protoValue.set.call(this, v); syncLabel(); }
      });
      Object.defineProperty(select, "selectedIndex", {
        configurable: true,
        get: function () { return protoIndex.get.call(this); },
        set: function (v) { protoIndex.set.call(this, v); syncLabel(); }
      });
    } catch (err) { /* the poll below still covers it */ }
    select.addEventListener("change", syncLabel);
    dd.check = function () { if (select.value !== dd.lastValue || select.disabled !== dd.lastDisabled) syncLabel(); };

    all.push(dd);
    rebuild();
  }

  function outside(target) { return !(openDD.pop.contains(target) || openDD.wrap.contains(target)); }
  document.addEventListener("mousedown", function (e) { if (openDD && outside(e.target)) openDD.close(false); }, true);
  document.addEventListener("focusin", function (e) { if (openDD && outside(e.target)) openDD.close(false); });
  window.addEventListener("resize", function () { if (openDD) openDD.place(); });
  window.addEventListener("scroll", function (e) {
    if (!openDD || openDD.pop.contains(e.target)) return; // scrolling inside the list is fine
    var r = openDD.trigger.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) openDD.close(false); else openDD.place();
  }, true);
  // Safety net: catch value changes that bypass the setter (e.g. option.selected = true)
  // and close the popover if its view gets hidden (tab switch).
  setInterval(function () {
    all.forEach(function (dd) { dd.check(); });
    if (openDD && !openDD.trigger.offsetParent) openDD.close(false);
  }, 250);

  function init() { IDS.forEach(function (id) { enhance(document.getElementById(id)); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { all.forEach(function (dd) { dd.measure(); }); });
})();
