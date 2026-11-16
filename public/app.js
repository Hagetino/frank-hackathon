const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const eur = (n) => "€" + (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1000 ? Math.round(n / 1000) + "k" : n);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- icons (one line set, 24px grid, 1.75 stroke) ----------
const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  arrow: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  building: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
  euro: '<path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkles: '<path d="m12 3 1.9 5.8L20 10.5l-6.1 1.7L12 18l-1.9-5.8L4 10.5l6.1-1.7z"/><path d="M19 3v4M17 5h4"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 11v5"/><path d="M8 8v.01"/><path d="M12 16v-5"/><path d="M16 16v-3a2 2 0 0 0-4 0"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  play: '<path d="M6 4v16l14-8z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
};
const icon = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.dot}</svg>`;
function hydrateIcons(root = document) { root.querySelectorAll("[data-ic]").forEach((el) => { el.outerHTML = icon(el.dataset.ic); }); }

const S = { leads: [], clusters: [], meta: {}, status: {}, drafts: {}, budget: 10 };

async function api(path, body, retry = true) {
  const headers = { "content-type": "application/json", "x-demo-key": localStorage.getItem("demoKey") || "" };
  const res = await fetch(path, body ? { method: "POST", headers, body: JSON.stringify(body) } : {});
  const data = await res.json();
  if (res.status === 401 && retry) {
    const key = prompt("Demo passcode (AI features are protected so nobody drains the credit):");
    if (key) { localStorage.setItem("demoKey", key.trim()); return api(path, body, false); }
  }
  if (!res.ok) throw new Error(data.error || res.statusText);
  if (data.spend) setSpend(data.spend);
  return data;
}

function setSpend(spend) {
  $("#spend").textContent = "$" + spend.usd.toFixed(2);
  $("#meter").style.width = Math.min(100, (spend.usd / S.budget) * 100) + "%";
}

const chip = (key) => `<span class="chip" style="--c:${S.meta[key].color}"><i></i>${esc(S.meta[key].name)}</span>`;
const leadById = (id) => S.leads.find((l) => l.id === id);
function pipelineCounts() {
  const st = Object.values(S.status);
  $("#pTierA").textContent = S.leads.filter((l) => l.score.tier === "A").length;
  $("#pSeq").textContent = st.length;
  $("#pReplies").textContent = st.filter((x) => ["Engaged", "In conversation", "Callback"].includes(x)).length;
}
function setStatus(id, s) {
  S.status[id] = s;
  pipelineCounts();
  if (!$("#view-leads").classList.contains("hidden")) renderLeads();
}

// ---------- nav ----------
function show(view) {
  document.querySelectorAll("main > section").forEach((s) => s.classList.toggle("hidden", s.id !== "view-" + view));
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
  if (view === "leads") renderLeads();
  if (location.hash.slice(1).split("/")[0] !== view) history.replaceState(null, "", "#" + view);
  window.scrollTo(0, 0);
}
$("#nav").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) show(b.dataset.view); });

// ---------- map ----------
const ICON = {
  firms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V8l8-4 8 4v12M9 20v-6h6v6"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  eur: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 6a7 7 0 100 12M4 10h9M4 14h9"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 17l6-6 4 4 6-7M14 8h6v6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
};
const SHORT = { commercial: "Commercial", network: "Networks", personal: "Personal", specialist: "Specialist" };

function gauge(pct, label, sub) {
  const r = 90, cx = 110, cy = 110, a0 = Math.PI * 0.85, a1 = Math.PI * 2.15;
  const pt = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const arc = (from, to) => { const [x0, y0] = pt(from), [x1, y1] = pt(to); return `M${x0} ${y0} A${r} ${r} 0 ${to - from > Math.PI ? 1 : 0} 1 ${x1} ${y1}`; };
  const end = a0 + (a1 - a0) * (pct / 100);
  const [kx, ky] = pt(end);
  const ticks = [0, 20, 40, 60, 80, 100].map((t) => { const a = a0 + (a1 - a0) * (t / 100); const [x, y] = [cx + (r + 18) * Math.cos(a), cy + (r + 18) * Math.sin(a)]; return `<text x="${x}" y="${y + 3}" font-size="9" fill="#9aa0ab" text-anchor="middle">${t}</text>`; }).join("");
  return `<svg viewBox="0 0 220 200"><defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="#9cc8ea"/><stop offset="1" stop-color="#ff7a45"/></linearGradient></defs>
    <path d="${arc(a0, a1)}" stroke="rgba(17,18,22,.08)" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="${arc(a0, end)}" stroke="url(#gg)" stroke-width="16" fill="none" stroke-linecap="round"/>
    <circle cx="${kx}" cy="${ky}" r="10" fill="#fff" stroke="#ff7a45" stroke-width="4"/>${ticks}</svg>
    <div class="gv">${pct}%</div><div class="gl">${label}</div><div class="gs">${sub}</div>`;
}

function renderMap() {
  const A = S.leads.filter((l) => l.score.tier === "A");
  const pipe = S.leads.reduce((s, l) => s + l.score.deal.eur, 0);
  const pot = S.leads.reduce((s, l) => s + l.score.deal.potentialEur, 0);
  const hrs = A.reduce((s, l) => s + l.score.hoursFreedPerWeek, 0);
  const h = new Date().getHours();
  $("#greet").textContent = `${h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"}, team FRANK`;
  $("#today").textContent = `It's ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${A.length} UK brokers ready for outreach`;
  $("#nSample").textContent = S.leads.length;
  $("#kpis").innerHTML = [
    [S.leads.length, "Brokers mapped", icon("building")],
    [A.length, "Tier A", icon("star")],
    [eur(pipe), "Year-1 value", icon("euro")],
    [eur(pot), "Full potential", icon("trend")],
    [hrs.toLocaleString() + "h", "Admin freed / week", icon("clock")],
  ].map(([v, l, ic]) => `<div class="kstat"><div class="v">${v}</div><div class="l"><span class="ic">${ic}</span>${l}</div></div>`).join("");

  const zeroHuman = S.leads.filter((l) => l.cluster !== "network").length;
  $("#gauge").innerHTML = gauge(Math.round((zeroHuman / S.leads.length) * 100), "Zero-human eligible", `${zeroHuman} of ${S.leads.length} firms can be closed with no one at FRANK involved`);

  $("#topDate").textContent = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  $("#topList").innerHTML = S.leads.slice(0, 4).map((l) => `<div class="toprow" data-id="${l.id}">
      <span class="rk">${l.rank}</span>
      <div><div class="nm">${esc(l.firm)}</div><div class="meta"><span>${esc(l.town)}</span><span>${SHORT[l.cluster]}</span><span>${eur(l.score.deal.eur)}/yr</span></div></div>
      <span class="sc">${l.score.total}</span></div>`).join("");
  $("#topList").onclick = (e) => { const r = e.target.closest(".toprow"); if (r) openDrawer(r.dataset.id); };

  $("#avgScore").textContent = Math.round(S.leads.reduce((s, l) => s + l.score.total, 0) / S.leads.length);

  const maxN = Math.max(...S.clusters.map((c) => c.count));
  $("#clusterBars").innerHTML = S.clusters.map((c, i) => `<div class="cbar c${i}" data-k="${c.key}" style="height:${Math.max(38, (c.count / maxN) * 100)}%" title="${esc(c.name)}">
      <span class="pc">${c.count}</span><span>${SHORT[c.key]}</span></div>`).join("");
  $("#clusterBars").onclick = (e) => { const b = e.target.closest(".cbar"); if (b) { $("#fCluster").value = b.dataset.k; show("leads"); } };

  const ctps = S.leads.filter((l) => !l.compliance.call.ok).length;
  $("#clusterCards").innerHTML = S.clusters.map((c) => `<div class="card ctile" style="--c:${c.color}" data-k="${c.key}" title="${esc(c.play)}">
      <span class="dot"></span><div class="lab">${esc(c.name)}</div><div class="val">${c.count} firms · ${c.avgScore}</div>
      <div class="foot"><span>${esc(c.motion.split(/[:(,]/)[0].trim())}</span><span class="go">${icon("arrow")}</span></div></div>`).join("")
    + `<div class="card ctile warn" data-k=""><span class="dot" style="--c:var(--red)"></span><div class="lab">Do-not-call (CTPS)</div><div class="val">${ctps} firms</div>
      <div class="foot"><span>Email / LinkedIn only</span><span class="go">${icon("arrow")}</span></div></div>`;
  document.querySelectorAll(".ctile").forEach((el) => el.addEventListener("click", () => { $("#fCluster").value = el.dataset.k; show("leads"); }));

  // scatter: x = log staff, y = score
  const W = 560, H = 230, P = 30;
  const x = (s) => P + (Math.log(s) / Math.log(170)) * (W - 2 * P);
  const y = (v) => H - P - ((v - 30) / 70) * (H - 2 * P);
  const dots = S.leads.map((l) => `<circle cx="${x(l.staff).toFixed(1)}" cy="${y(l.score.total).toFixed(1)}" r="5.5" fill="${S.meta[l.cluster].color}" fill-opacity=".85" stroke="#fff" data-id="${l.id}" style="cursor:pointer"><title>${esc(l.firm)}: ${l.score.total} (${l.staff} staff)</title></circle>`).join("");
  const ticks = [2, 5, 10, 25, 50, 100].map((t) => `<text x="${x(t)}" y="${H - 8}" font-size="10" fill="#9aa0ab" text-anchor="middle">${t}</text>`).join("");
  const yt = [40, 55, 70, 85, 100].map((t) => `<line x1="${P}" x2="${W - P}" y1="${y(t)}" y2="${y(t)}" stroke="rgba(17,18,22,.06)"/><text x="${P - 6}" y="${y(t) + 3}" font-size="10" fill="#9aa0ab" text-anchor="end">${t}</text>`).join("");
  $("#scatter").innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%">${yt}
    <line x1="${P}" x2="${W - P}" y1="${y(70)}" y2="${y(70)}" stroke="#ff7a45" stroke-dasharray="4 4"/><text x="${W - P}" y="${y(70) - 5}" font-size="10" fill="#c2521f" text-anchor="end">tier A</text>
    ${ticks}${dots}</svg>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${S.clusters.map((c) => chip(c.key)).join("")}</div>`;
  $("#scatter").querySelectorAll("circle").forEach((c) => c.addEventListener("click", () => openDrawer(c.dataset.id)));

  $("#method").innerHTML = `
    <b>1 · Cluster.</b> k-means on four firm features (size, commercial share, specialist share, digital maturity) finds four segments, each with its own pitch and sales motion. &nbsp;
    <b>2 · Score (0–100).</b> Size fit 20 · Admin workload 25 · Integration readiness 20 · Buying signals 20 · Digital maturity 10 · Reachability 5. &nbsp;
    <b>3 · Gate.</b> PECR rules for email, CTPS for calls, AI calls only after opt-in, AI disclosure on every call, WhatsApp only after opt-in. &nbsp;
    <b>4 · Route.</b> Independents go fully zero-human; multi-branch groups (up to ~€80k potential) get the same AI groundwork and a human joins only at the close.`;
}

document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-goto]");
  if (!g) return;
  if (g.dataset.tier) { $("#fTier").value = g.dataset.tier; $("#fCluster").value = ""; }
  show(g.dataset.goto);
});
$("#exportCsv").addEventListener("click", () => {
  const head = ["rank", "firm", "town", "cluster", "score", "tier", "value_eur", "email_ok", "call_ok"];
  const rows = S.leads.map((l) => [l.rank, l.firm, l.town, l.cluster, l.score.total, l.score.tier, l.score.deal.eur, l.compliance.email.ok, l.compliance.call.ok]);
  const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: "outflow-uk-ranked.csv" });
  a.click();
});

// ---------- leads ----------
function renderLeads() {
  const fc = $("#fCluster").value, ft = $("#fTier").value, q = $("#fSearch").value.toLowerCase();
  const rows = S.leads.filter((l) => (!fc || l.cluster === fc) && (!ft || l.score.tier === ft) && (!q || (l.firm + l.town).toLowerCase().includes(q)));
  $("#leadRows").innerHTML = rows.map((l) => `<tr data-id="${l.id}">
    <td class="small">${l.rank}</td>
    <td><div class="firm">${esc(l.firm)}</div><div class="small">${esc(l.town)} · ${l.staff} staff · ${esc(l.software)}</div></td>
    <td>${chip(l.cluster)}</td>
    <td><span class="bar"><i style="width:${l.score.total}%"></i></span>${l.score.total}</td>
    <td><span class="tier ${l.score.tier}">${l.score.tier}</span></td>
    <td>${eur(l.score.deal.eur)}<div class="small">${esc(l.score.deal.profile)}</div></td>
    <td class="chs"><span class="ch ${l.compliance.email.ok ? "" : "no"}" title="${esc(l.compliance.email.rule)}">Email</span><span class="ch" title="LinkedIn">in</span><span class="ch ${l.compliance.call.ok ? "" : "no"}" title="${esc(l.compliance.call.rule)}">Call</span></td>
    <td>${S.status[l.id] ? `<span class="status">${esc(S.status[l.id])}</span>` : `<span class="small">Not contacted</span>`}</td>
  </tr>`).join("");
}
["#fCluster", "#fTier"].forEach((s) => $(s).addEventListener("change", renderLeads));
$("#fSearch").addEventListener("input", renderLeads);
$("#leadRows").addEventListener("click", (e) => { const tr = e.target.closest("tr"); if (tr) openDrawer(tr.dataset.id); });

// ---------- drawer ----------
function closeDrawer() { $("#drawer").classList.remove("open"); $("#scrim").classList.remove("open"); }
$("#scrim").addEventListener("click", closeDrawer);

function openDrawer(id) {
  const l = leadById(id);
  const c = l.compliance;
  const rule = (name, r) => `<div><span class="${r.ok ? "ok" : "no"}">${icon(r.ok ? "check" : "x")}</span><div><b>${name}</b> <span class="small">${esc(r.rule)}</span></div></div>`;
  $("#drawer").innerHTML = `
    <div class="drawer-hd"><button class="close" id="dClose">×</button>
      <div class="eyebrow">Rank #${l.rank} · Tier ${l.score.tier} · ${esc(S.meta[l.cluster].name)}</div>
      <h3>${esc(l.firm)}</h3>
      <div class="small">${esc(l.contact.name)}, ${esc(l.contact.role)} · ${esc(l.town)}, ${esc(l.region)} · FRN ${l.frn} (demo) · founded ${l.founded}</div>
    </div>
    <div class="drawer-bd">
      <div class="section"><h4>Why it scores ${l.score.total}/100</h4><div class="parts">${l.score.parts.map((p) => `
        <div><span>${p.k}</span><span class="pb"><i style="width:${(p.pts / p.max) * 100}%"></i></span><span class="small">${p.pts}/${p.max}</span><span class="why">${esc(p.why)}</span></div>`).join("")}
      </div>
      <div class="small">Estimated value: <b>${eur(l.score.deal.eur)}/yr</b> (${esc(l.score.deal.profile)}${l.score.deal.potentialEur > l.score.deal.eur ? `, up to ${eur(l.score.deal.potentialEur)} at full rollout` : ""}). Est. <b>${l.score.hoursFreedPerWeek} admin hours/week</b> freed.</div></div>
      <div class="section"><h4>Compliance gate</h4><div class="rules">${rule("Email", c.email)}${rule("LinkedIn", c.linkedin)}${rule("AI call", c.call)}${rule("WhatsApp", c.whatsapp)}</div></div>
      <div class="section"><h4>Sequence</h4><div class="seq">${l.sequence.map((s) => `<div><b>DAY ${s.day}</b>${esc(s.label)}</div>`).join("")}</div></div>
      <div class="section"><h4>Outreach drafted by Claude</h4><div id="dDraft"></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn teal" id="dGen">${icon("sparkles")} ${S.drafts[id] ? "Regenerate" : "Draft all channels"}</button>
        <button class="btn" id="dApprove" ${S.drafts[id] ? "" : "disabled"}>Schedule sequence</button>
        <button class="btn ghost" id="dCall" ${c.call.ok ? "" : "disabled title='CTPS registered'"}>${icon("phone")} Call with AI agent</button>
      </div>
    </div>`;
  $("#drawer").classList.add("open"); $("#scrim").classList.add("open");
  $("#dClose").onclick = closeDrawer;
  $("#dGen").onclick = async () => {
    $("#dGen").disabled = true;
    $("#dDraft").innerHTML = `<div class="thinking"><span class="spin"></span> Claude is reading the firm profile and writing five channel variants…</div>`;
    try {
      S.drafts[id] = (await api("/api/draft", { leadId: id })).draft;
      renderDraft(l);
      $("#dApprove").disabled = false;
    } catch (e) { $("#dDraft").innerHTML = `<div class="no">${esc(e.message)}</div>`; }
    $("#dGen").disabled = false;
  };
  $("#dApprove").onclick = () => { setStatus(id, "Sequence scheduled"); $("#dApprove").innerHTML = icon("check") + " Scheduled"; $("#dApprove").disabled = true; };
  $("#dCall").onclick = () => { closeDrawer(); $("#vLead").value = id; pickVoiceLead(); show("voice"); };
  if (S.drafts[id]) renderDraft(l);
}

function renderDraft(l) {
  const d = S.drafts[l.id];
  const tabs = [
    ["Email", `Subject: ${d.email.subject}\n\n${d.email.body}`, l.compliance.email.ok],
    ["LinkedIn note", d.linkedin_note, true],
    ["LinkedIn follow-up", d.linkedin_followup, true],
    ["Call opener", d.call_opener, l.compliance.call.ok],
    ["Voicemail", d.voicemail, l.compliance.call.ok],
    ["WhatsApp (after opt-in)", d.whatsapp_followup, true],
  ];
  $("#dDraft").innerHTML = `<div class="angle"><b>Angle:</b> ${esc(d.angle)}</div>
    <div class="tabs">${tabs.map(([n, , ok], i) => `<button data-i="${i}" class="${i === 0 ? "on" : ""}" ${ok ? "" : "title='Blocked by compliance gate'"}>${ok ? "" : icon("ban")}${n}</button>`).join("")}</div>
    <textarea id="dText" rows="12"></textarea><div class="small" id="dCount"></div>`;
  const pickTab = (i) => {
    $("#dText").value = tabs[i][1];
    $("#dCount").textContent = `${tabs[i][1].length} characters${tabs[i][2] ? "" : " · this channel is blocked for this firm and will not be sent"}`;
    document.querySelectorAll("#dDraft .tabs button").forEach((b) => b.classList.toggle("on", +b.dataset.i === i));
  };
  $("#dDraft .tabs").onclick = (e) => { const b = e.target.closest("button"); if (b) pickTab(+b.dataset.i); };
  pickTab(l.compliance.email.ok ? 0 : 1);
}

// ---------- campaign ----------
const FUNNEL = ["Targeted", "Contacted", "Engaged (open / accept)", "Replied or answered", "Demo booked", "Trial started"];
const counts = Object.fromEntries(FUNNEL.map((k) => [k, 0]));
// Unit economics: what this costs vs a human SDR doing the same research and writing.
const SDR = { minutesPerFirm: 35, eurPerHour: 30 };
let campSpend0 = null;
function renderEcon() {
  const usd = parseFloat($("#spend").textContent.replace("$", "")) || 0;
  if (campSpend0 === null) campSpend0 = usd;
  const ai = Math.max(0, usd - campSpend0);
  const n = counts.Contacted;
  const hrs = (n * SDR.minutesPerFirm) / 60;
  $("#econ").innerHTML = [
    [n, "Firms contacted"],
    [n ? "$" + (ai / n).toFixed(2) : "–", "AI cost per firm"],
    [hrs.toFixed(1) + " h", "SDR time it replaced"],
    [n ? "€" + Math.round(hrs * SDR.eurPerHour) : "€0", "Human cost avoided"],
    [counts["Demo booked"], "Demos booked, 0 humans", true],
  ].map(([v, l, d]) => `<div class="card kpi ${d ? "dark" : ""}"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("");
}
function renderFunnel() {
  renderEcon();
  const max = Math.max(1, counts.Targeted);
  $("#funnel").innerHTML = FUNNEL.map((k) => `<div><span>${k}</span><span class="fb"><i style="width:${(counts[k] / max) * 100}%"></i></span><b>${counts[k]}</b></div>`).join("");
}
let day0 = 0;
function feed(lead, msg, ic = "dot", ai = false) {
  const f = $("#feed");
  if (f.querySelector(".small:only-child")) f.innerHTML = "";
  const d = ((Date.now() - day0) / 4000).toFixed(1); // 4 s = 1 day of campaign time
  f.insertAdjacentHTML("afterbegin", `<div class="ev"><span class="t">Day ${d}</span><span class="evic">${icon(ic)}</span><div><span class="who">${esc(lead ? lead.firm : "Engine")}</span> ${ai ? '<span class="ai">AI</span>' : ""}<div class="msg">${msg}</div></div></div>`);
}
function hash(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return (h % 1000) / 1000; }

async function runLead(l) {
  counts.Targeted++; renderFunnel();
  feed(l, `Researching the firm and drafting 6 channel variants…`, "sparkles", true);
  let d;
  try { d = (await api("/api/draft", { leadId: l.id })).draft; S.drafts[l.id] = d; }
  catch (e) { feed(l, `<span class="no">Draft failed: ${esc(e.message)}</span>`, "alert"); return; }
  feed(l, `Angle: ${esc(d.angle)}`, "target", true);
  const r = hash(l.id);
  if (l.compliance.email.ok) feed(l, `Email sent: “${esc(d.email.subject)}”`, "mail");
  else feed(l, `Email skipped: ${esc(l.compliance.email.rule)}`, "ban");
  counts.Contacted++; renderFunnel(); setStatus(l.id, "Contacted");
  await sleep(4000 + r * 3000);
  feed(l, `LinkedIn note sent to ${esc(l.contact.name)}: “${esc(d.linkedin_note.slice(0, 90))}…”`, "linkedin");
  await sleep(2500);
  if (r < 0.8) { counts["Engaged (open / accept)"]++; renderFunnel(); feed(l, l.compliance.email.ok ? "Email opened twice, demo video watched 1:40" : "Connection accepted", "eye"); }
  await sleep(3500);
  if (l.compliance.call.ok && r < 0.8) {
    feed(l, "Clicked “call me” in the email: consent to an AI call logged", "check");
    feed(l, `AI voice agent calling ${esc(l.contact.name)}. Opener: “${esc(d.call_opener.slice(0, 110))}…”`, "phone", true);
    await sleep(3000);
  } else feed(l, l.compliance.call.ok ? "No call: broker has not opted in to a call yet" : "Call skipped: number is on the CTPS register", "ban");
  if (r < 0.62) {
    counts["Replied or answered"]++; renderFunnel();
    feed(l, l.compliance.call.ok ? "Answered: qualified (quotes done by hand across portals)" : "Replied on LinkedIn: “send me more info”", "message");
    setStatus(l.id, "Engaged");
  }
  await sleep(3000);
  if (r < 0.42) {
    counts["Demo booked"]++; renderFunnel(); setStatus(l.id, "Demo booked");
    feed(l, "Demo booked for Thu 14:30, calendar invite sent automatically", "calendar");
    await sleep(3500);
    if (r < 0.3) { counts["Trial started"]++; renderFunnel(); setStatus(l.id, "Trial started"); feed(l, "Self-serve trial started, onboarding agent connecting their insurer portals", "rocket"); }
  }
}

function renderSegments() {
  $("#cSegment").innerHTML = `<option value="">All segments</option>` + S.clusters.map((c) => `<option value="${c.key}">${esc(c.name)}</option>`).join("");
}
$("#launch").addEventListener("click", async () => {
  const seg = $("#cSegment").value, n = +$("#cCount").value;
  const targets = S.leads.filter((l) => (!seg || l.cluster === seg) && !S.status[l.id]).slice(0, n);
  if (!targets.length) return feed(null, "Every firm in this segment has already been contacted.");
  $("#launch").disabled = true;
  if (!day0) day0 = Date.now();
  feed(null, `Campaign launched: ${targets.length} firms${seg ? " in " + esc(S.meta[seg].name) : ""}. Humans involved: 0.`, "play");
  await Promise.all(targets.map((l, i) => sleep(i * 1200).then(() => runLead(l))));
  feed(null, "Campaign batch complete. Non-responders roll into the day-7 follow-up automatically.", "check");
  $("#launch").disabled = false;
});

// ---------- voice ----------
const V = { mode: "ai", active: false, history: [], timer: null, t0: 0, voices: {} };
function loadVoices() {
  const all = speechSynthesis.getVoices();
  const gb = all.filter((v) => v.lang === "en-GB");
  const find = (names, pool) => pool.find((v) => names.some((n) => v.name.includes(n)));
  V.voices.agent = find(["Daniel", "Google UK English Male", "Arthur", "Oliver"], gb) || gb[0] || all.find((v) => v.lang.startsWith("en"));
  V.voices.broker = find(["Serena", "Kate", "Martha", "Google UK English Female", "Stephanie"], gb) || gb.find((v) => v !== V.voices.agent) || all.find((v) => v.lang.startsWith("en") && v !== V.voices.agent);
}
if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

// ElevenLabs voices when the server has a key, browser voices otherwise.
async function speak(text, who) {
  if (S.tts) {
    try {
      const res = await fetch("/api/tts", { method: "POST", headers: { "content-type": "application/json", "x-demo-key": localStorage.getItem("demoKey") || "" }, body: JSON.stringify({ text, who }) });
      if (res.ok) {
        const audio = new Audio(URL.createObjectURL(await res.blob()));
        V.audio = audio;
        $("#wave").classList.add("on");
        await new Promise((r) => { audio.onended = audio.onerror = r; audio.play().catch(r); });
        $("#wave").classList.remove("on");
        return;
      }
    } catch {}
  }
  return speakBrowser(text, who);
}
function speakBrowser(text, who) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return setTimeout(resolve, 600 + text.length * 35);
    const u = new SpeechSynthesisUtterance(text);
    u.voice = V.voices[who] || null;
    u.rate = who === "agent" ? 1.04 : 1.0;
    u.pitch = who === "agent" ? 1.0 : 1.08;
    $("#wave").classList.add("on");
    u.onend = u.onerror = () => { $("#wave").classList.remove("on"); resolve(); };
    speechSynthesis.speak(u);
  });
}

function ring() {
  try {
    const ctx = new AudioContext();
    const g = ctx.createGain(); g.gain.value = 0; g.connect(ctx.destination);
    [400, 450].forEach((f) => { const o = ctx.createOscillator(); o.frequency.value = f; o.connect(g); o.start(); o.stop(ctx.currentTime + 3); });
    // UK ring cadence: 0.4 on, 0.2 off, 0.4 on, 2 off
    [[0, 0.4], [0.6, 1.0]].forEach(([a, b]) => { g.gain.setValueAtTime(0.06, ctx.currentTime + a); g.gain.setValueAtTime(0, ctx.currentTime + b); });
  } catch {}
}

function renderVoiceLeads() {
  $("#vLead").innerHTML = S.leads.map((l) => `<option value="${l.id}" ${l.compliance.call.ok ? "" : "disabled"}>${l.rank}. ${esc(l.firm)}${l.compliance.call.ok ? "" : " (CTPS: no calls)"}</option>`).join("");
  $("#vLead").value = S.leads.find((l) => l.compliance.call.ok).id;
  pickVoiceLead();
}
function pickVoiceLead() {
  const l = leadById($("#vLead").value);
  $("#vAvatar").textContent = l.contact.name.split(" ").map((p) => p[0]).join("");
  $("#vName").textContent = l.contact.name;
  $("#vFirm").textContent = `${l.contact.role} · ${l.firm}`;
  $("#vChecks").innerHTML = `<div>${icon("check")} Broker opted in to a call (clicked “call me”)</div><div>${icon("check")} Screened against CTPS: clear</div><div>${icon("check")} Agent discloses it is an AI in the first sentence</div><div>${icon("check")} “Don't call again” honoured instantly and logged</div><div>${icon("check")} Call recorded and summarised to CRM</div><div>${icon("check")} Voice: ${S.tts ? "ElevenLabs (George / Alice)" : "browser voices (ElevenLabs off)"}</div>`;
}
$("#vLead").addEventListener("change", pickVoiceLead);
$("#vMode").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b || V.active) return;
  V.mode = b.dataset.mode;
  document.querySelectorAll("#vMode button").forEach((x) => x.classList.toggle("on", x === b));
});

function bubble(who, text) {
  const t = $("#vTranscript");
  if (t.querySelector(".small:only-child")) t.innerHTML = "";
  t.insertAdjacentHTML("beforeend", `<div class="bub ${who}"><small>${who === "agent" ? "FRANK AI agent" : leadById($("#vLead").value).contact.name}</small>${esc(text)}</div>`);
  t.scrollTop = t.scrollHeight;
}
function state(s) { $("#vState").textContent = s; }
function clock() {
  const s = Math.floor((Date.now() - V.t0) / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

let humanInput = null;
function waitForHuman() {
  $("#vTalk").classList.remove("hidden"); $("#vText").focus();
  return new Promise((resolve) => { humanInput = resolve; });
}
function submitHuman(text) {
  if (!humanInput || !text.trim()) return;
  const r = humanInput; humanInput = null; $("#vText").value = ""; r(text.trim());
}
$("#vText").addEventListener("keydown", (e) => { if (e.key === "Enter") submitHuman(e.target.value); });
$("#vMic").addEventListener("click", () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert("Speech recognition needs Chrome or Edge. Type instead."); return; }
  const rec = new SR(); rec.lang = "en-GB"; rec.interimResults = false;
  $("#vMic").innerHTML = icon("mic") + " Listening…"; $("#vMic").classList.add("rec");
  rec.onresult = (e) => submitHuman(e.results[0][0].transcript);
  rec.onend = () => { $("#vMic").innerHTML = icon("mic") + " Speak"; $("#vMic").classList.remove("rec"); };
  rec.start();
});

async function call() {
  const l = leadById($("#vLead").value);
  V.active = true; V.history = [];
  $("#vCall").classList.add("hidden"); $("#vHang").classList.remove("hidden");
  $("#vOutcome").classList.add("hidden"); $("#vTranscript").innerHTML = "";
  $("#vLead").disabled = true;
  V.t0 = 0;
  state(`Dialling ${l.phone}…`); ring(); await sleep(3200);
  if (!V.active) return endCall(l, null);
  V.t0 = Date.now();
  $("#vAvatar").classList.add("live");
  V.timer = setInterval(() => state(`Connected · ${clock()}`), 500);
  let result = null;
  for (let turn = 0; turn < 16 && V.active; turn++) {
    state(`Connected · ${clock()} · agent thinking…`);
    let a;
    try { a = (await api("/api/voice", { leadId: l.id, history: V.history })).turn; }
    catch (e) { bubble("agent", "Error: " + e.message); break; }
    if (!V.active) break;
    V.history.push({ speaker: "agent", text: a.say }); bubble("agent", a.say);
    result = a;
    await speak(a.say, "agent");
    if (a.end_call || !V.active) break;

    let said;
    if (V.mode === "ai") {
      state(`Connected · ${clock()} · broker answering…`);
      let b;
      try { b = (await api("/api/voice", { leadId: l.id, history: V.history, speaker: "broker" })).turn; }
      catch (e) { bubble("broker", "Error: " + e.message); break; }
      if (!V.active) break;
      said = b.say; bubble("broker", said); await speak(said, "broker");
      if (b.hang_up) { V.history.push({ speaker: "broker", text: said }); break; }
    } else {
      state(`Connected · ${clock()} · your turn`);
      said = await waitForHuman();
      if (!V.active) break;
      bubble("broker", said);
    }
    V.history.push({ speaker: "broker", text: said });
  }
  endCall(l, result);
}

function endCall(l, result) {
  V.active = false; clearInterval(V.timer);
  window.speechSynthesis?.cancel();
  $("#vAvatar").classList.remove("live"); $("#wave").classList.remove("on");
  $("#vTalk").classList.add("hidden"); $("#vLead").disabled = false;
  $("#vCall").classList.remove("hidden"); $("#vHang").classList.add("hidden");
  state(V.t0 ? `Call ended · ${clock()}` : "Call cancelled");
  if (humanInput) { const r = humanInput; humanInput = null; r(""); }
  if (!result) return;
  const labels = { demo_booked: ["Demo booked", "Demo booked"], trial_link_sent: ["Trial link sent", "Trial link sent"], callback: ["Callback scheduled", "Callback"], not_interested: ["Not interested · nurture in 6 months", "Not interested"], do_not_contact: ["Do not contact · suppressed everywhere", "Do not contact"], in_progress: ["Call ended before a close", "Called"] };
  const [label, status] = labels[result.outcome] || labels.in_progress;
  setStatus(l.id, status);
  $("#vOutcome").classList.remove("hidden");
  $("#vOutcome").innerHTML = `<b>${label}</b><div class="small" style="margin-top:6px">CRM note (written by the agent): ${esc(result.notes)}</div><div class="small">Humans involved: 0 · Transcript stored · ${V.history.length} turns</div>`;
}
$("#vCall").addEventListener("click", call);
// Hanging up stops the loop; call() then lands in endCall with the last agent turn.
$("#vHang").addEventListener("click", () => {
  V.active = false;
  window.speechSynthesis?.cancel();
  V.audio?.pause();
  if (humanInput) { const r = humanInput; humanInput = null; r(""); }
});

// ---------- inbox ----------
// Sample inbound mail: what brokers typically send back after the first touch.
const MAILS = [
  { from: "Rachel Barker", firm: "Kingsmere Risk Solutions", subject: "Re: Rekeying commercial quotes across 30 insurers", time: "09:12", body: "Sounds interesting, but we're on OpenGI and I'm not handing portal logins to anyone. How does security work? Who at your end can see our clients' data?" },
  { from: "Paul Ellis", firm: "Bramley Commercial Insurance", subject: "Re: 20 minutes, a real quote on your portals", time: "09:47", body: "How much is it? We're a team of six handlers, mostly commercial combined and fleet. I need a number before I put time in the diary." },
  { from: "Fiona Turner", firm: "Lowther Commercial Insurance", subject: "Re: Renewal season", time: "10:03", body: "Not now, we're in the middle of renewal season and nobody has a spare minute. Try me again in January." },
  { from: "Fiona Fraser", firm: "Fairholme Insurance Brokers", subject: "Re: Equine and agricultural quotes", time: "10:31", body: "Yes, happy to see it. Thursday works. Can you show it on an NFU Mutual quote? That's where we lose the most time." },
  { from: "Mark Doyle", firm: "Ashcombe Broking Group", subject: "Re: FRANK for multi-branch brokers", time: "11:05", body: "I'm not the right person for this. Speak to our ops manager, Karen Shaw, she looks after systems across the branches." },
  { from: "Helen Lloyd", firm: "Marlow Insurance Brokers", subject: "Re: Admin hours", time: "11:40", body: "Please remove me from your list." },
];
function renderInbox() {
  $("#iLead").innerHTML = S.leads.map((l) => `<option value="${l.id}">${l.rank}. ${esc(l.firm)} · ${esc(l.contact.name)}</option>`).join("");
  $("#samples").innerHTML = `<div class="mails">${MAILS.map((m, i) => `<button class="mail" data-i="${i}">
      <span class="mav">${m.from.split(" ").map((p) => p[0]).join("")}</span>
      <span class="mtx"><span class="mtop"><b>${esc(m.from)}</b><em>${m.time}</em></span><span class="msub">${esc(m.subject)}</span><span class="mpre">${esc(m.body)}</span></span>
    </button>`).join("")}</div>`;
  $("#samples").onclick = (e) => {
    const b = e.target.closest(".mail"); if (!b) return;
    const m = MAILS[+b.dataset.i];
    document.querySelectorAll(".mail").forEach((x) => x.classList.toggle("on", x === b));
    $("#iMsg").value = m.body;
    const l = S.leads.find((x) => m.firm && x.firm.startsWith(m.firm));
    if (l) { $("#iLead").value = l.id; $("#iLead").dispatchEvent(new Event("change", { bubbles: true })); }
  };
}
$("#iGo").addEventListener("click", async () => {
  const msg = $("#iMsg").value.trim(); if (!msg) return;
  const l = leadById($("#iLead").value);
  $("#iGo").disabled = true;
  $("#iOut").innerHTML = `<div class="thinking"><span class="spin"></span> Reading the reply in the context of ${esc(l.firm)}…</div>`;
  try {
    const r = (await api("/api/reply", { leadId: l.id, message: msg })).result;
    const color = { interested: "var(--green)", unsubscribe: "var(--red)", not_interested: "var(--red)" }[r.intent] || "var(--amber)";
    $("#iOut").innerHTML = `
      <div class="intent" style="color:${color}">${r.intent.replace("_", " ")}</div>
      <p style="margin:6px 0 12px">${esc(r.summary)}</p>
      <div class="section"><h4>Next action</h4>${esc(r.next_action)}</div>
      <div class="section"><h4>Reply drafted and sent</h4><textarea rows="9">${esc(r.response)}</textarea></div>
      <div>${r.human_needed ? '<span class="status" style="background:#fef3c7;color:#92400e">Escalated to a human</span>' : '<span class="status">Handled by AI · humans involved: 0</span>'}</div>`;
    if (r.human_needed) $("#humans").textContent = +$("#humans").textContent + 1;
    setStatus(l.id, { interested: "Demo booked", unsubscribe: "Do not contact", not_interested: "Not interested", not_now: "Nurture" }[r.intent] || "In conversation");
  } catch (e) { $("#iOut").innerHTML = `<div class="no">${esc(e.message)}</div>`; }
  $("#iGo").disabled = false;
});

// ---------- boot ----------
(async () => {
  const st = await api("/api/state");
  S.leads = st.leads; S.clusters = st.clusters; S.budget = st.budget; S.tts = st.tts;
  S.clusters.forEach((c) => (S.meta[c.key] = c));
  setSpend(st.spend);
  $("#nLeads").textContent = S.leads.length;
  $("#fCluster").innerHTML += S.clusters.map((c) => `<option value="${c.key}">${esc(c.name)}</option>`).join("");
  hydrateIcons();
  pipelineCounts(); renderMap(); renderSegments(); renderFunnel(); renderVoiceLeads(); renderInbox();
  // deep links: #leads, #voice, #leads/L001 opens a firm
  const [view, id] = location.hash.slice(1).split("/");
  if (["map", "leads", "campaign", "voice", "inbox"].includes(view)) show(view);
  if (id && leadById(id)) openDrawer(id);
})();
