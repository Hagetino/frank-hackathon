// Outreach desk (find → write → send) and Close (reply → follow-up → signed agreement).
// Data: outreach/prospects.json through /api/outreach/*. Uses the outflow styles as they are.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const VIEWS = ["outreach", "close"];
const STAGES = [["initial_outreach", "Sent"], ["engaged", "Engaged"], ["qualifying", "Qualifying"], ["presenting", "Presenting"],
  ["negotiating", "Negotiating"], ["closing", "Closing"], ["closed_won", "Signed"]];
const SAMPLES = [
  ["Question", "Sounds interesting, but we use Acturis for everything. Does it work with that, and what does it cost?"],
  ["Objection", "We tried automation software two years ago and it never coped with the insurer portals. Why would this be different?"],
  ["Yes", "OK, I'm interested. The trial sounds low risk. How do we start?"],
  ["Wrong person", "I only handle claims here. You'd want our operations director for this."],
  ["Stop", "Please remove us from your list."],
];
const S = { db: null, sel: null, conv: null, busy: false, timer: null };

async function api(path, body) {
  const headers = { "content-type": "application/json", "x-demo-key": localStorage.getItem("demoKey") || "" };
  const res = await fetch(path, body ? { method: "POST", headers, body: JSON.stringify(body) } : { headers });
  const data = await res.json();
  if (res.status === 401) {
    const key = prompt("Team passcode:");
    if (key) { localStorage.setItem("demoKey", key.trim()); return api(path, body); }
  }
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

const visible = () => VIEWS.find((v) => !$("#view-" + v).classList.contains("hidden"));
const prospects = () => S.db?.prospects || [];
const byId = (id) => prospects().find((p) => p.id === id);
const stageLabel = (p) => p.opted_out ? "Opted out" : p.stage === "closed_lost" ? "Closed" : (STAGES.find(([k]) => k === (p.stage || "initial_outreach")) || [])[1];

async function load() {
  try {
    S.db = await api("/api/outreach/state");
  } catch (e) {
    $("#oNote").textContent = e.message;
    return;
  }
  S.sel = byId(S.sel)?.id || prospects()[0]?.id;
  const sent = prospects().filter((p) => p.sent);
  S.conv = sent.find((p) => p.id === S.conv)?.id || sent[0]?.id || null;
  renderDesk();
  renderClose();
  clearTimeout(S.timer);
  if (visible() && (S.db.job.running || S.busy)) S.timer = setTimeout(load, 1200);
}

// ---------- Outreach desk ----------
function renderDesk() {
  const all = prospects();
  const withMail = all.filter((p) => p.email);
  const sent = all.filter((p) => p.sent);
  $("#oKpis").innerHTML = [
    [all.length, "Firms found on the web"],
    [withMail.length, "With an address printed on their own site"],
    [`${sent.length}/${withMail.length}`, "First emails sent"],
    [all.filter((p) => (p.thread || []).some((m) => m.from === "them")).length, "Replies handled"],
  ].map(([v, l]) => `<div class="kstat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("");

  $("#oRows").innerHTML = all.map((p) => `
    <tr data-id="${p.id}" class="${p.id === S.sel ? "sel" : ""}">
      <td><div class="firm">${esc(p.company)}</div><div class="small">${esc(p.location)} · ${esc(p.type)}</div></td>
      <td>${p.email ? `<span class="mono">${esc(p.email)}</span><div class="small">printed on <a href="${esc(p.email_source)}" target="_blank" rel="noopener">${esc(p.email_source.replace(/^https?:\/\//, ""))}</a></div>`
        : `<span class="chip" style="--c:var(--red)"><i></i>none published</span><div class="small">not guessed</div>`}</td>
      <td>${p.sent ? `<span class="status">sent</span>` : p.email ? `<span class="chip" style="--c:var(--amber)"><i></i>queued</span>` : `<span class="small">unsendable</span>`}</td>
    </tr>`).join("");

  const p = byId(S.sel);
  $("#oDetail").innerHTML = !p ? "" : `
    <div class="card-hd"><b>${esc(p.company)}</b><a class="small" href="${esc(p.website)}" target="_blank" rel="noopener">${esc(p.website.replace(/^https?:\/\//, ""))} ↗</a></div>
    <div class="angle"><b>Why this firm.</b> ${esc(p.why)}</div>
    ${p.body ? `<div class="small" style="margin-bottom:6px">Subject</div><div class="subject">${esc(p.subject)}</div>
      <pre class="mail">${esc(p.body)}</pre>
      <div class="small">Plain text. No HTML, no tracking, no attachment, no link.</div>` : `<div class="small">No email is written for a firm without a published address.</div>`}`;

  const job = S.db.job;
  const queued = withMail.length - sent.length;
  $("#oSend").disabled = job.running || !queued || !S.db.local;
  $("#oSend").innerHTML = job.running ? `<span class="spin"></span> Sending…` : queued ? `Send ${queued} unsent email${queued > 1 ? "s" : ""}` : "All sent";
  $("#oLog").innerHTML = job.log.length
    ? job.log.map((l) => `<div class="ev"><span class="t">${l.at.slice(11, 19)}</span><span>✉️</span><span class="msg">${esc(l.line)}</span></div>`).join("")
    : `<div class="small" style="padding:14px 0">The sender's output appears here, one line per email.</div>`;
  $("#oNote").textContent = S.db.local
    ? "Demo mailbox: every email is sent over SMTP to a mailbox on this machine. Nothing is delivered to the firms."
    : "Hosted view: read-only. Sending and the reply cycle run on the local server.";
}

// ---------- Close ----------
function renderClose() {
  const sent = prospects().filter((p) => p.sent);
  $("#cList").innerHTML = sent.length ? sent.map((p) => `
    <button data-id="${p.id}" class="${p.id === S.conv ? "on" : ""}">
      <b>${esc(p.company)}</b><span class="small">${esc(stageLabel(p))}${p.draft ? " · draft waiting" : ""}</span>
    </button>`).join("") : `<div class="small">No conversations yet. Send the first emails from the Outreach desk.</div>`;

  const p = byId(S.conv);
  $("#cMain").classList.toggle("hidden", !p);
  $("#cSide").classList.toggle("hidden", !p);
  if (!p) return;
  const idx = STAGES.findIndex(([k]) => k === (p.stage || "initial_outreach"));
  $("#cStages").innerHTML = STAGES.map(([, label], i) => `<span class="${i < idx ? "done" : i === idx ? "now" : ""}">${label}</span>`).join("")
    + (p.opted_out || p.stage === "closed_lost" ? `<span class="lost">${p.opted_out ? "Opted out" : "Closed"}</span>` : "");

  $("#cThread").innerHTML = (p.thread || []).map((m) => m.from === "system"
    ? `<div class="sysline">${esc(m.body)}</div>`
    : `<div class="bub ${m.from === "us" ? "agent" : "broker"}"><small>${m.from === "us" ? "FRANK · AI" : esc(p.company)}</small>${esc(m.body).replace(/\n/g, "<br>")}</div>`).join("");
  $("#cThread").scrollTop = 1e6;

  const closed = p.opted_out || ["closed_lost", "closed_won"].includes(p.stage);
  $("#cCompose").classList.toggle("hidden", closed || !!p.draft);
  $("#cDraft").classList.toggle("hidden", !p.draft);
  if (p.draft) {
    $("#cDraft").innerHTML = `
      <div class="card-hd"><b>Drafted answer</b><span class="small">${esc(p.draft.by)}${p.draft.cached ? " · saved run" : ""}</span></div>
      <div class="rules"><div><span class="ok">●</span><span>Intent: <b>${esc(p.intent)}</b> · stage moved to <b>${esc(stageLabel(p))}</b> · human needed: <b>${p.human_needed ? "yes" : "no"}</b></span></div></div>
      <pre class="mail">${esc(p.draft.body)}</pre>
      <button class="btn teal" id="cApprove">Approve and send</button>`;
  }
  $("#cVerdict").innerHTML = !p.intent || p.draft ? "" : `
    <div class="rules"><div><span class="${p.opted_out ? "no" : "ok"}">●</span><span>Last reply: <b>${esc(p.intent)}</b>${p.opted_out ? ` · ${esc(p.opt_out_reason || "")} Never emailed again.` : p.human_needed ? " · handed to a person" : ""} <span class="small">(${esc(p.engine || "")})</span></span></div></div>`;

  const c = p.contract;
  $("#cContract").innerHTML = `
    <img src="/assets/contract-3d.png" alt="Trial agreement, rendered in 3D" />
    <div class="cbody">
      <div class="eyebrow">Trial agreement</div>
      <h3>${c?.status === "signed" ? "Signed" : c ? "Out for signature" : "Waiting for a yes"}</h3>
      <p class="small">${c?.status === "signed" ? `${esc(c.signed_by)} signed for ${esc(p.company)} at ${c.signed_at.slice(11, 16)} UTC. €39 a month, no lock-in.`
        : c ? "The answer carries the signing link. The firm signs on a one-page form; nobody at FRANK is involved."
        : "When the firm says yes, Sellbird's answer carries a link to the one-page trial agreement."}</p>
      ${c ? `<a class="btn ${c.status === "signed" ? "ghost" : ""}" href="${esc(c.url)}" target="_blank" rel="noopener">${c.status === "signed" ? "View agreement" : "Open the signing page"} ↗</a>` : ""}
      <div class="zero"><b>0</b><span>humans involved</span></div>
    </div>`;
}

async function act(fn, btn, label) {
  if (S.busy) return;
  S.busy = true;
  const old = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spin"></span> ${label}`;
  try { await fn(); } catch (e) { alert(e.message); }
  S.busy = false;
  btn.disabled = false;
  btn.innerHTML = old;
  await load();
}

// ---------- events ----------
$("#oRows").addEventListener("click", (e) => { const tr = e.target.closest("tr"); if (tr && !e.target.closest("a")) { S.sel = tr.dataset.id; renderDesk(); } });
$("#oSend").addEventListener("click", async () => { await api("/api/outreach/send", { interval: Number($("#oPace").value) }).catch((e) => alert(e.message)); load(); });
$("#oReset").addEventListener("click", (e) => { if (confirm("Reset the demo? Sent flags, threads and agreements are cleared; the firms stay.")) act(() => api("/api/outreach/reset", {}), e.target, "Resetting"); });
$("#cList").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { S.conv = b.dataset.id; renderClose(); } });
$("#cSamples").innerHTML = SAMPLES.map(([l], i) => `<button data-i="${i}">${l}</button>`).join("");
$("#cSamples").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) $("#cMsg").value = SAMPLES[b.dataset.i][1]; });
$("#cGo").addEventListener("click", (e) => {
  const message = $("#cMsg").value.trim();
  if (message) act(async () => { await api("/api/outreach/reply", { id: S.conv, message }); $("#cMsg").value = ""; }, e.target, "Sellbird is reading the reply");
});
$("#cDraft").addEventListener("click", (e) => { if (e.target.id === "cApprove") act(() => api("/api/outreach/approve", { id: S.conv }), e.target, "Sending"); });

// The shell (app.js) switches sections; this module loads its data when one of its views opens.
$("#nav").addEventListener("click", () => setTimeout(() => visible() && load(), 0));
window.addEventListener("focus", () => visible() && load());            // e.g. after signing in the other tab
const want = location.hash.slice(1).split("/")[0];
if (VIEWS.includes(want)) setTimeout(() => document.querySelector(`#nav button[data-view="${want}"]`).click(), 300);
