// UK geo map of leads. Vanilla JS + inline SVG, no tiles, no network.
// Renders into #geoMap (Market map view) and #geoMapLeads (Leads view, filter-aware).
(function () {
  "use strict";

  // ---------- geography (hand-made, [lat, lon]) ----------
  const GB = [
    [58.63,-5.0],[58.57,-4.75],[58.55,-4.4],[58.6,-4.0],[58.6,-3.6],[58.67,-3.37],[58.64,-3.02],[58.44,-3.09],
    [58.12,-3.65],[57.95,-3.95],[57.86,-3.77],[57.68,-4.03],[57.5,-4.25],[57.59,-3.87],[57.72,-3.28],[57.68,-2.96],
    [57.69,-2.0],[57.5,-1.78],[57.15,-2.07],[56.96,-2.2],[56.71,-2.46],[56.56,-2.58],[56.47,-2.85],[56.4,-3.1],
    [56.36,-2.8],[56.28,-2.58],[56.18,-2.85],[56.11,-3.15],[56.05,-3.6],[55.98,-3.3],[55.98,-3.18],[56.06,-2.72],
    [56.0,-2.5],[55.9,-2.13],[55.77,-2.0],[55.6,-1.7],[55.33,-1.57],[55.02,-1.42],[54.9,-1.36],[54.69,-1.18],
    [54.6,-1.1],[54.49,-0.61],[54.28,-0.39],[54.12,-0.08],[54.08,-0.19],[53.91,-0.16],[53.7,0.05],[53.58,0.11],
    [53.68,-0.25],[53.62,-0.15],[53.57,-0.06],[53.34,0.26],[53.14,0.34],[53.05,0.25],[52.9,0.0],[52.8,0.2],
    [52.95,0.49],[52.96,0.85],[52.93,1.3],[52.82,1.53],[52.6,1.73],[52.48,1.76],[52.33,1.68],[52.15,1.6],
    [51.96,1.35],[51.85,1.27],[51.79,1.15],[51.73,0.9],[51.6,0.95],[51.53,0.71],[51.48,0.45],[51.45,0.7],
    [51.36,1.03],[51.39,1.38],[51.37,1.44],[51.22,1.4],[51.12,1.32],[51.08,1.17],[50.91,0.98],[50.85,0.57],
    [50.73,0.24],[50.82,-0.14],[50.81,-0.37],[50.72,-0.79],[50.79,-1.1],[50.82,-1.32],[50.75,-1.55],[50.72,-1.88],
    [50.58,-2.06],[50.6,-2.4],[50.52,-2.45],[50.7,-2.8],[50.72,-2.93],[50.62,-3.4],[50.4,-3.55],[50.22,-3.64],
    [50.36,-4.14],[50.31,-4.22],[50.22,-4.8],[50.08,-5.05],[49.96,-5.2],[50.12,-5.53],[50.07,-5.71],[50.21,-5.48],
    [50.42,-5.08],[50.55,-4.94],[50.8,-4.55],[51.02,-4.53],[51.05,-4.25],[51.19,-4.21],[51.21,-4.12],[51.21,-3.47],
    [51.23,-3.1],[51.35,-2.98],[51.5,-2.7],[51.7,-2.45],[51.6,-2.68],[51.55,-2.98],[51.46,-3.17],[51.39,-3.27],
    [51.4,-3.56],[51.48,-3.7],[51.6,-3.92],[51.56,-3.98],[51.56,-4.3],[51.68,-4.25],[51.72,-4.5],[51.67,-4.7],
    [51.6,-4.93],[51.7,-5.2],[51.88,-5.31],[52.0,-4.98],[52.1,-4.68],[52.21,-4.36],[52.41,-4.09],[52.54,-4.05],
    [52.72,-4.06],[52.89,-4.41],[52.79,-4.77],[52.94,-4.52],[53.14,-4.28],[53.17,-4.45],[53.3,-4.68],[53.43,-4.4],
    [53.31,-4.04],[53.33,-3.83],[53.32,-3.49],[53.35,-3.32],[53.22,-3.05],[53.4,-3.18],[53.4,-3.0],[53.56,-3.1],
    [53.65,-3.01],[53.73,-2.95],[53.82,-3.06],[53.93,-3.01],[54.12,-2.8],[54.07,-3.1],[54.1,-3.23],[54.25,-3.4],
    [54.49,-3.64],[54.64,-3.57],[54.87,-3.39],[54.95,-3.1],[54.98,-3.26],[54.87,-3.6],[54.78,-4.05],[54.68,-4.39],
    [54.85,-4.4],[54.64,-4.86],[54.85,-5.0],[55.0,-5.15],[55.24,-4.86],[55.46,-4.63],[55.64,-4.82],[55.95,-4.75],
    [55.98,-4.5],[55.97,-4.95],[55.85,-5.05],[55.6,-5.45],[55.3,-5.8],[55.6,-5.7],[55.95,-5.65],[56.2,-5.55],
    [56.42,-5.48],[56.55,-5.75],[56.73,-6.22],[57.0,-5.83],[57.28,-5.71],[57.43,-5.82],[57.73,-5.8],[57.9,-5.45],
    [58.1,-5.42],[58.15,-5.25],[58.26,-5.37],[58.46,-5.05]
  ];
  const ISLANDS = [
    [[57.7,-6.3],[57.55,-6.65],[57.35,-6.6],[57.15,-6.3],[57.05,-5.9],[57.25,-5.65],[57.45,-6.0],[57.65,-6.15]], // Skye
    [[56.62,-6.0],[56.6,-6.35],[56.35,-6.4],[56.3,-6.0],[56.42,-5.68],[56.55,-5.75]], // Mull
    [[58.52,-6.25],[58.3,-6.85],[58.0,-7.1],[57.75,-7.1],[57.8,-6.65],[58.1,-6.35],[58.35,-6.15]], // Lewis & Harris
    [[57.65,-7.25],[57.35,-7.45],[57.05,-7.45],[57.05,-7.25],[57.4,-7.2],[57.6,-7.1]], // Uists
    [[55.9,-6.1],[55.65,-6.15],[55.7,-6.5],[55.85,-6.4]], // Islay
    [[55.7,-5.15],[55.5,-5.05],[55.45,-5.3],[55.6,-5.4]], // Arran
    [[50.77,-1.3],[50.7,-1.1],[50.58,-1.25],[50.66,-1.55],[50.72,-1.5]], // Isle of Wight
    [[54.42,-4.37],[54.3,-4.35],[54.07,-4.6],[54.05,-4.8],[54.25,-4.72],[54.37,-4.55]], // Isle of Man
    [[59.12,-3.3],[58.95,-3.42],[58.8,-3.2],[58.9,-2.75],[59.05,-2.8],[59.25,-2.55],[59.32,-2.95]] // Orkney
  ];
  const IRELAND = [
    [55.38,-7.37],[55.15,-8.28],[54.85,-8.5],[54.6,-8.4],[54.3,-8.6],[54.25,-9.3],[54.25,-10.0],[53.95,-10.1],
    [53.6,-10.05],[53.4,-10.2],[53.25,-9.05],[53.1,-9.4],[52.56,-9.93],[52.25,-9.85],[52.15,-10.4],[51.8,-10.2],
    [51.45,-9.8],[51.55,-9.2],[51.65,-8.6],[51.8,-8.3],[51.95,-7.8],[52.15,-6.95],[52.17,-6.36],[52.5,-6.2],
    [52.97,-6.0],[53.35,-6.2],[53.6,-6.1],[54.0,-6.35],[54.05,-6.1],[54.38,-5.55],[54.6,-5.45],[54.7,-5.7],
    [54.85,-5.7],[55.05,-5.98],[55.22,-6.15],[55.24,-6.5],[55.2,-6.9],[55.05,-7.3],[55.25,-7.0]
  ];
  // NI border (open line, for a faint dashed hint)
  const NI_BORDER = [[54.05,-6.1],[54.1,-6.6],[54.4,-7.0],[54.2,-7.5],[54.45,-8.15],[54.65,-7.9],[55.05,-7.3]];

  const TOWNS = {
    Leeds: [53.80,-1.55], Harrogate: [53.99,-1.54], York: [53.96,-1.08], Sheffield: [53.38,-1.47],
    Manchester: [53.48,-2.24], Chester: [53.19,-2.89], Preston: [53.76,-2.70], Lancaster: [54.05,-2.80],
    Bristol: [51.45,-2.59], Exeter: [50.72,-3.53], Truro: [50.26,-5.05], Cheltenham: [51.90,-2.08],
    Norwich: [52.63,1.30], Ipswich: [52.06,1.16], Cambridge: [52.21,0.12], Reading: [51.45,-0.97],
    Guildford: [51.24,-0.57], Maidstone: [51.27,0.52], Brighton: [50.82,-0.14], Birmingham: [52.49,-1.89],
    Nottingham: [52.95,-1.15], Leicester: [52.64,-1.13], Shrewsbury: [52.71,-2.75], London: [51.51,-0.13],
    Croydon: [51.37,-0.10], Newcastle: [54.98,-1.61], Durham: [54.78,-1.57], Cardiff: [51.48,-3.18],
    Swansea: [51.62,-3.94], Edinburgh: [55.95,-3.19], Glasgow: [55.86,-4.25], Aberdeen: [57.15,-2.09]
  };
  const BIG = new Set(["London", "Birmingham", "Manchester", "Leeds", "Glasgow", "Edinburgh", "Bristol", "Cardiff", "Newcastle", "Aberdeen"]);

  // focus box (GB) and projection: equirectangular scaled by cos(54deg)
  const BOX = { lat0: 49.85, lat1: 59.4, lon0: -8.2, lon1: 1.85 };
  const K = Math.cos(54 * Math.PI / 180);
  const px = (lon) => lon * K, py = (lat) => -lat;

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let uid = 0;
  const maps = [];

  function smoothPath(pts, P, closed) {
    // Catmull-Rom -> cubic Bezier for a less polygonal coastline
    const p = pts.map(([la, lo]) => P(la, lo));
    const n = p.length;
    const get = (i) => closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))];
    const f = (q) => q[0].toFixed(1) + "," + q[1].toFixed(1);
    let d = "M" + f(p[0]);
    const t = 0.16;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
      const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
      d += "C" + f(c1) + " " + f(c2) + " " + f(p2);
    }
    return d + (closed ? "Z" : "");
  }

  function statusTone(s) {
    if (!s) return "";
    if (/do not contact|not interested/i.test(s)) return "neg";
    if (/demo|trial|engaged|conversation|interested/i.test(s)) return "pos";
    return "mid";
  }
  const isOutreach = (s) => !!s && statusTone(s) !== "neg";
  function div(c) { const d = document.createElement("div"); d.className = c; return d; }

  // ---------- one map instance per container ----------
  function GeoMap(el, opts) {
    this.el = el; this.opts = opts || {}; this.id = "gm" + (++uid);
    this.pinned = null; this.hideT = 0; this.sig = "";
    el.classList.add("gm");
    el.innerHTML = "";
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("class", "gm-svg");
    this.svg.setAttribute("role", "img");
    this.svg.setAttribute("aria-label", "Map of Great Britain showing where the leads are");
    el.appendChild(this.svg);
    this.chips = div("gm-chips"); el.appendChild(this.chips);
    this.legend = div("gm-legend"); el.appendChild(this.legend);
    this.tip = div("gm-tip"); this.tip.setAttribute("role", "tooltip"); el.appendChild(this.tip);

    this.tip.addEventListener("mouseenter", () => clearTimeout(this.hideT));
    this.tip.addEventListener("mouseleave", () => { if (!this.pinned) this.hideTip(120); });
    this.tip.addEventListener("click", (e) => {
      const r = e.target.closest("[data-id]");
      if (r && window.outflow) { this.pinned = null; this.hideTip(0); window.outflow.openDrawer(r.dataset.id); }
    });
    el.addEventListener("click", (e) => {
      if (!e.target.closest(".gm-town") && !e.target.closest(".gm-tip")) { this.pinned = null; this.hideTip(0); }
    });

    let raf = 0;
    this.ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => this.render()); });
    this.ro.observe(el);
  }

  GeoMap.prototype.filter = function () {
    if (!this.opts.filters) return null;
    const v = (s) => { const n = document.querySelector(s); return n ? n.value : ""; };
    return { c: v("#fCluster"), t: v("#fTier"), q: v("#fSearch").trim().toLowerCase() };
  };
  GeoMap.prototype.matches = function (l, f) {
    if (!f) return true;
    return (!f.c || l.cluster === f.c) && (!f.t || l.score.tier === f.t) && (!f.q || (l.firm + l.town).toLowerCase().includes(f.q));
  };

  GeoMap.prototype.render = function () {
    const O = window.outflow; if (!O) return;
    const W = this.el.clientWidth, H = this.el.clientHeight;
    if (W < 40 || H < 40) return; // hidden view: ResizeObserver re-renders once visible
    const f = this.filter();
    this.sig = JSON.stringify(f);
    const meta = O.meta, status = O.status || {};

    // fit the GB box into the container; the rest of the canvas shows sea + Ireland
    // legend first so the map can be nudged clear of it
    this.renderLegend();
    const bw = px(BOX.lon1) - px(BOX.lon0), bh = py(BOX.lat0) - py(BOX.lat1);
    const pad = 12;
    const mx = (px(BOX.lon0) + px(BOX.lon1)) / 2, my = (py(BOX.lat0) + py(BOX.lat1)) / 2;
    const legR = this.legend.offsetLeft + this.legend.offsetWidth + 14;
    const legT = this.legend.offsetTop;
    let s = Math.min((W - pad * 2) / bw, (H - pad * 2) / bh), cx = W / 2;
    const cy = H / 2;
    // keep the mainland that sits below the legend's top edge clear of it: shift right, else shrink
    for (let i = 0; i < 14; i++) {
      let minDx = Infinity;
      GB.forEach(([la, lo]) => { if (cy + (py(la) - my) * s > legT - 6) minDx = Math.min(minDx, (px(lo) - mx) * s); });
      if (minDx === Infinity) break;
      const need = legR - minDx;
      const max = W - pad - (px(BOX.lon1) - mx) * s;
      if (need <= max) { cx = Math.max(cx, need); break; }
      s *= 0.95;
    }
    const P = (lat, lon) => [cx + (px(lon) - mx) * s, cy + (py(lat) - my) * s];
    this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.svg.setAttribute("width", W); this.svg.setAttribute("height", H);

    // group leads by town
    const towns = {};
    O.leads.forEach((l) => {
      if (!TOWNS[l.town]) return;
      (towns[l.town] = towns[l.town] || { name: l.town, leads: [] }).leads.push(l);
    });
    const list = Object.values(towns).map((t) => {
      t.leads.sort((a, b) => b.score.total - a.score.total);
      const m = t.leads.filter((l) => this.matches(l, f));
      t.match = m;
      const best = m[0] || t.leads[0];
      t.color = (meta[best.cluster] || {}).color || "#8fb6e8";
      t.tierA = (m.length ? m : t.leads).some((l) => l.score.tier === "A");
      t.outreach = t.leads.some((l) => isOutreach(status[l.id]));
      t.xy = P(TOWNS[t.name][0], TOWNS[t.name][1]);
      t.n = t.leads.length;
      t.dim = !!f && !m.length;
      return t;
    });
    this.towns = towns;
    const maxN = Math.max(1, ...list.map((t) => t.n));
    const rk = Math.max(0.75, Math.min(1.2, H / 480));
    list.forEach((t) => { t.r = (4.5 + 7 * Math.sqrt(t.n / maxN)) * rk; });
    list.sort((a, b) => b.n - a.n); // big first, small drawn on top

    const g = this.id;
    let svg = `<defs>
      <linearGradient id="${g}-land" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dce8f7"/></linearGradient>
      <linearGradient id="${g}-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".5"/><stop offset="1" stop-color="#e6eef9" stop-opacity=".5"/></linearGradient>
      <filter id="${g}-sh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#3c5a8c" flood-opacity=".18"/></filter>
      <pattern id="${g}-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".8" fill="#3c5a8c" fill-opacity=".13"/></pattern>
    </defs>`;

    // graticule
    let grat = "";
    for (let lon = -14; lon <= 6; lon += 2) {
      const a = P(46, lon), b = P(62, lon);
      grat += `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    }
    for (let lat = 46; lat <= 62; lat += 1) {
      const a = P(lat, -30), b = P(lat, 25);
      grat += `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    }
    svg += `<rect class="gm-sea" width="${W}" height="${H}" fill="url(#${g}-dots)"/><path class="gm-grat" d="${grat}"/>`;

    // land
    svg += `<path class="gm-far" d="${smoothPath(IRELAND, P, true)}" fill="url(#${g}-far)"/>`;
    svg += `<path class="gm-border" d="${smoothPath(NI_BORDER, P, false)}"/>`;
    const land = smoothPath(GB, P, true) + ISLANDS.map((p) => smoothPath(p, P, true)).join("");
    svg += `<g filter="url(#${g}-sh)"><path class="gm-land" d="${land}" fill="url(#${g}-land)"/></g>`;

    // markers
    let mk = "";
    list.forEach((t) => {
      const [x, y] = t.xy, r = t.r;
      mk += `<g class="gm-town${t.dim ? " dim" : ""}" data-town="${esc(t.name)}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})" tabindex="0" role="button" aria-label="${esc(t.name)}: ${t.n} firm${t.n > 1 ? "s" : ""}">`;
      if (t.outreach && !t.dim) mk += `<circle class="gm-pulse${reduceMotion ? " still" : ""}" r="${(r + 3).toFixed(1)}" stroke="${t.color}"/>`;
      mk += `<circle class="gm-halo" r="${(r * 1.8).toFixed(1)}" fill="${t.color}"/>`;
      if (t.tierA) mk += `<circle class="gm-ring" r="${(r + 2.6).toFixed(1)}"/>`;
      mk += `<circle class="gm-dot" r="${r.toFixed(1)}" fill="${t.color}"/>`;
      if (t.n > 1) mk += `<text class="gm-n" dy=".35em" style="font-size:${Math.max(8, Math.min(11, r * 0.95)).toFixed(1)}px">${t.n}</text>`;
      mk += `<circle class="gm-hit" r="${Math.max(r + 5, 11).toFixed(1)}"/></g>`;
    });

    // labels: greedy placement, avoid markers, other labels and overlay boxes
    const boxes = list.map((t) => ({ x0: t.xy[0] - t.r - 3, y0: t.xy[1] - t.r - 3, x1: t.xy[0] + t.r + 3, y1: t.xy[1] + t.r + 3, own: t.name }));
    this.renderChips(list, f);
    [this.legend, this.chips].forEach((n) => boxes.push({ x0: n.offsetLeft - 4, y0: n.offsetTop - 4, x1: n.offsetLeft + n.offsetWidth + 4, y1: n.offsetTop + n.offsetHeight + 4, own: "" }));
    const hit = (b, own) => boxes.some((o) => o.own !== own && !(b.x1 < o.x0 || b.x0 > o.x1 || b.y1 < o.y0 || b.y0 > o.y1)) ||
      b.x0 < 2 || b.x1 > W - 2 || b.y0 < 2 || b.y1 > H - 2;
    const cand = list.filter((t) => !t.dim && (t.n >= 2 || BIG.has(t.name)))
      .sort((a, b) => (b.n - a.n) || (BIG.has(b.name) - BIG.has(a.name)));
    let lb = "";
    cand.forEach((t) => {
      const w = t.name.length * 5.6 + 2, h = 11, [x, y] = t.xy, r = t.r + 5;
      const tries = [
        [x + r, y + 3.5, "start", x + r, y - 6], [x - r, y + 3.5, "end", x - r - w, y - 6],
        [x, y - r - 1, "middle", x - w / 2, y - r - 10], [x, y + r + 9, "middle", x - w / 2, y + r]
      ];
      for (const [lx, ly, a, bx, by] of tries) {
        const b = { x0: bx, y0: by, x1: bx + w, y1: by + h, own: t.name };
        if (!hit(b, t.name)) { boxes.push(b); lb += `<text class="gm-label" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${a}">${esc(t.name)}</text>`; break; }
      }
    });

    svg += `<g class="gm-labels">${lb}</g><g class="gm-marks">${mk}</g>`;
    this.svg.innerHTML = svg;

    this.svg.querySelectorAll(".gm-town").forEach((n) => {
      const t = towns[n.dataset.town];
      n.addEventListener("mouseenter", () => { if (!this.pinned) this.showTip(t); });
      n.addEventListener("mouseleave", () => { if (!this.pinned) this.hideTip(160); });
      n.addEventListener("focus", () => this.showTip(t));
      n.addEventListener("blur", () => { if (!this.pinned) this.hideTip(160); });
      const act = (e) => {
        e.stopPropagation();
        const pool = t.match.length ? t.match : t.leads;
        if (pool.length === 1) { this.pinned = null; this.hideTip(0); O.openDrawer(pool[0].id); }
        else { this.pinned = t.name; this.showTip(t); }
      };
      n.addEventListener("click", act);
      n.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(e); } });
    });

    if (this.pinned && towns[this.pinned]) this.showTip(towns[this.pinned]); else this.hideTip(0);
  };

  GeoMap.prototype.renderChips = function (list, f) {
    const O = window.outflow, all = O.leads;
    const shown = f ? all.filter((l) => this.matches(l, f)) : all;
    const reg = {};
    shown.forEach((l) => { reg[l.region] = (reg[l.region] || 0) + 1; });
    const topReg = Object.entries(reg).sort((a, b) => b[1] - a[1])[0];
    const live = list.filter((t) => !t.dim);
    const dense = live.slice().sort((a, b) => (b.match.length - a.match.length) || (b.n - a.n))[0];
    const chips = [];
    chips.push(f ? `<b>${shown.length}</b> of ${all.length} firms` : `<b>${all.length}</b> firms · ${live.length} towns`);
    if (dense) chips.push(`${esc(dense.name)} · <b>${f ? dense.match.length : dense.n}</b> firms`);
    if (topReg) chips.push(`Top region: <b>${esc(topReg[0])}</b>`);
    this.chips.innerHTML = chips.map((c) => `<span class="gm-chip">${c}</span>`).join("");
  };

  GeoMap.prototype.renderLegend = function () {
    const O = window.outflow;
    const inOut = O.leads.filter((l) => isOutreach((O.status || {})[l.id])).length;
    const items = O.clusters.map((c) => `<span><i style="background:${c.color}"></i>${esc(c.name)}</span>`).join("");
    this.legend.innerHTML = `<div class="gm-lg-c">${items}</div>
      <div class="gm-lg-k"><span><i class="ring"></i>Tier A</span><span><i class="pulse"></i>In outreach${inOut ? ` · ${inOut}` : ""}</span><span><i class="size"></i>Size = firms</span></div>`;
  };

  GeoMap.prototype.showTip = function (t) {
    clearTimeout(this.hideT);
    const O = window.outflow, f = this.filter(), st = O.status || {};
    const rows = t.leads.map((l) => {
      const off = f && !this.matches(l, f);
      const s = st[l.id];
      const c = (O.meta[l.cluster] || {}).color || "#999";
      return `<button type="button" class="gm-row${off ? " off" : ""}" data-id="${esc(l.id)}">
        <i style="background:${c}"></i>
        <span class="gm-firm"><span>${esc(l.firm)}</span>${s ? `<em class="gm-st ${statusTone(s)}">${esc(s)}</em>` : ""}</span>
        <span class="gm-sc">${l.score.total}<small class="t${esc(l.score.tier)}">${esc(l.score.tier)}</small></span>
      </button>`;
    }).join("");
    this.tip.innerHTML = `<div class="gm-tip-hd"><b>${esc(t.name)}</b><span>${esc(t.leads[0].region || "")} · ${t.n} firm${t.n > 1 ? "s" : ""}</span></div>${rows}
      <div class="gm-tip-ft">Click a firm to open it</div>`;
    const W = this.el.clientWidth, H = this.el.clientHeight;
    this.tip.style.visibility = "hidden"; this.tip.classList.add("on");
    const tw = this.tip.offsetWidth, th = this.tip.offsetHeight;
    const [x, y] = t.xy;
    let left = x + t.r + 14;
    if (left + tw > W - 6) left = x - t.r - 14 - tw;
    if (left < 6) left = Math.max(6, Math.min(W - tw - 6, x - tw / 2));
    const top = Math.max(6, Math.min(H - th - 6, y - th / 2));
    this.tip.style.left = left + "px"; this.tip.style.top = top + "px";
    this.tip.style.visibility = "";
    this.svg.querySelectorAll(".gm-town").forEach((n) => n.classList.toggle("act", n.dataset.town === t.name));
  };
  GeoMap.prototype.hideTip = function (ms) {
    clearTimeout(this.hideT);
    const go = () => { this.tip.classList.remove("on"); this.svg.querySelectorAll(".gm-town.act").forEach((n) => n.classList.remove("act")); };
    if (ms) this.hideT = setTimeout(go, ms); else go();
  };

  // ---------- boot ----------
  let booted = false;
  function boot() {
    if (booted || !window.outflow) return;
    booted = true;
    const a = document.getElementById("geoMap");
    const b = document.getElementById("geoMapLeads");
    if (a) maps.push(new GeoMap(a));
    if (b) {
      const m = new GeoMap(b, { filters: true });
      maps.push(m);
      const re = () => m.render();
      ["#fCluster", "#fTier"].forEach((s) => { const n = document.querySelector(s); if (n) n.addEventListener("change", re); });
      const q = document.querySelector("#fSearch"); if (q) q.addEventListener("input", re);
      // app.js sometimes sets filter values programmatically without events: cheap signature check
      setInterval(() => { if (b.offsetParent && JSON.stringify(m.filter()) !== m.sig) m.render(); }, 400);
    }
    maps.forEach((m) => m.render());
  }
  document.addEventListener("outflow:ready", boot);
  document.addEventListener("outflow:status", () => maps.forEach((m) => m.render()));
  if (window.outflow) boot();
  window.outflowGeo = { maps, towns: TOWNS };
})();
