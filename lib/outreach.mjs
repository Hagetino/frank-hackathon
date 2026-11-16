// Outreach desk + closing cycle.
// The database is one file, outreach/prospects.json. Python does the mail (outreach/send.py,
// outreach/sink.py); Sellbird reads the replies (cycle/bridge.py). These routes run on the local
// server only: a serverless function cannot start those processes.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { connect } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const DB = join(root, "outreach", "prospects.json");
const CACHE = join(root, "cycle", "data", "replies.json");
const PY = process.env.PYTHON || "python3";
const SELLBIRD_PY = process.env.SELLBIRD_PYTHON || join(root, "..", "sellbird", ".venv", "bin", "python");
const SINK_PORT = Number(process.env.SINK_PORT || 2525);
const PASSCODE = process.env.DEMO_PASSCODE || "";
const LOCAL = !process.env.VERCEL;

const job = { running: false, log: [] };
const fail = (status, message) => Object.assign(new Error(message), { status });
const readDb = async () => JSON.parse(await readFile(DB, "utf8"));
const writeDb = (db) => writeFile(DB, JSON.stringify(db, null, 2) + "\n");
const find = (db, id) => db.prospects.find((p) => p.id === id) || (() => { throw fail(404, `Unknown prospect ${id}`); })();
const now = () => new Date().toISOString().slice(0, 19) + "Z";
const localOnly = () => { if (!LOCAL) throw fail(501, "This step runs on the local server (npm start), not on the hosted demo."); };

// ---------- demo mailbox ----------
const portOpen = () => new Promise((ok) => {
  const s = connect(SINK_PORT, "127.0.0.1");
  s.once("connect", () => { s.destroy(); ok(true); });
  s.once("error", () => ok(false));
});

async function ensureSink() {
  if (await portOpen()) return;
  const sink = spawn(PY, [join(root, "outreach", "sink.py"), String(SINK_PORT)], { stdio: "ignore" });
  process.once("exit", () => sink.kill());
  for (let i = 0; i < 40 && !(await portOpen()); i++) await new Promise((r) => setTimeout(r, 100));
  if (!(await portOpen())) throw fail(500, "Could not start the demo mailbox (outreach/sink.py)");
}

// ---------- sender ----------
async function send({ interval = 60, only = "" }) {
  localOnly();
  if (job.running) throw fail(409, "The sender is already running");
  await ensureSink();
  const args = [join(root, "outreach", "send.py"), "--interval", String(Math.max(0, Number(interval) || 0))];
  if (only) args.push("--only", String(only));
  job.running = true;
  if (!only) job.log = [];
  const proc = spawn(PY, args, { env: { ...process.env, SINK_PORT: String(SINK_PORT), PYTHONUNBUFFERED: "1" } });
  const push = (chunk) => String(chunk).split("\n").filter(Boolean).forEach((line) => job.log.push({ at: now(), line }));
  proc.stdout.on("data", push);
  proc.stderr.on("data", push);
  return new Promise((resolve) => {
    proc.on("close", () => { job.running = false; if (only) resolve({ ok: true }); });
    if (!only) resolve({ started: true });
  });
}

// ---------- Sellbird: read a reply, classify it, move the stage, draft the answer ----------
function sellbird(payload) {
  return new Promise((resolve, reject) => {
    if (!existsSync(SELLBIRD_PY)) return reject(fail(503, "Sellbird is not installed yet: run cycle/setup.sh"));
    // A clean environment: Sellbird thinks through the Claude Code CLI on the user's own sign-in.
    const PATH = [`${process.env.HOME}/.local/bin`, "/opt/homebrew/bin", "/usr/local/bin", process.env.PATH].join(":");
    const env = { HOME: process.env.HOME, PATH, USER: process.env.USER || "", LANG: "en_GB.UTF-8" };
    const proc = spawn(SELLBIRD_PY, [join(root, "cycle", "bridge.py")], { env });
    let out = "";
    proc.stdout.on("data", (c) => (out += c));
    proc.on("error", reject);
    proc.on("close", () => {
      try {
        const res = JSON.parse(out.trim().split("\n").pop());
        res.error ? reject(fail(502, `Sellbird: ${res.error}`)) : resolve(res);
      } catch { reject(fail(502, "Sellbird returned no answer")); }
    });
    proc.stdin.end(JSON.stringify(payload));
  });
}

async function cached(key, run) {
  let cache = {};
  try { cache = JSON.parse(await readFile(CACHE, "utf8")); } catch {}
  if (cache[key]) return { ...cache[key], cached: true };
  const res = await run();
  cache[key] = res;
  await writeFile(CACHE, JSON.stringify(cache, null, 2)).catch(() => {});
  return res;
}

async function reply({ id, message }, origin) {
  localOnly();
  const text = String(message || "").trim().slice(0, 3000);
  if (!text) throw fail(400, "Empty reply");
  let db = await readDb();
  let p = find(db, id);
  if (!p.sent) throw fail(409, "Send the first email before handling a reply");
  const key = createHash("sha1").update(JSON.stringify([id, p.stage || "", (p.thread || []).length, text])).digest("hex");
  const signUrl = `${origin}/sign.html?p=${encodeURIComponent(id)}`;
  const res = await cached(key, () => sellbird({ prospect: p, reply: text, sign_url: signUrl }));

  db = await readDb();                                   // the sender may have written meanwhile
  p = find(db, id);
  p.thread = [...(p.thread || []), { from: "them", at: now(), body: text }];
  Object.assign(p, { intent: res.intent, stage: res.stage, human_needed: res.human_needed, engine: res.engine });
  delete p.draft;
  // An opt-out is final whether Sellbird's rule or its classifier caught it: this firm is never emailed again.
  if (res.opt_out || res.intent === "unsubscribe") {
    Object.assign(p, { opted_out: true, stage: "closed_lost", opt_out_reason: res.opt_out?.why || "They asked to be removed." });
  }
  if (res.response) {
    const body = res.response;
    p.draft = { subject: `Re: ${p.subject}`, body, by: res.engine, cached: !!res.cached };
    if (body.includes(signUrl)) p.contract = { status: "offered", url: signUrl };
  }
  await writeDb(db);
  return { prospect: p, result: res };
}

// Approving a draft queues it; the same Python sender delivers it.
async function approve({ id }) {
  localOnly();
  const db = await readDb();
  const p = find(db, id);
  if (!p.draft) throw fail(409, "Nothing to approve");
  p.outbox = [...(p.outbox || []), { subject: p.draft.subject, body: p.draft.body, sent: false }];
  if (p.contract?.status === "offered") p.contract.status = "sent";
  delete p.draft;
  await writeDb(db);
  await send({ interval: 0, only: id });
  return { prospect: find(await readDb(), id) };
}

async function sign({ id, name }) {
  const db = await readDb();
  const p = find(db, id);
  const signer = String(name || "").trim().slice(0, 80);
  if (!signer) throw fail(400, "Type your name to sign");
  if (!p.contract) throw fail(409, "No agreement has been offered to this firm");
  p.contract = { ...p.contract, status: "signed", signed_by: signer, signed_at: now() };
  p.stage = "closed_won";
  p.thread = [...(p.thread || []), { from: "system", at: now(), body: `Trial agreement signed by ${signer}.` }];
  await writeDb(db);
  return { prospect: p };
}

async function reset() {
  localOnly();
  if (job.running) throw fail(409, "Wait for the sender to finish");
  const db = await readDb();
  const keep = ["id", "company", "website", "email", "alt_emails", "email_source", "type", "location", "services", "why", "subject", "body"];
  db.prospects = db.prospects.map((p) => ({ ...Object.fromEntries(keep.map((k) => [k, p[k]])), sent: false }));
  await writeDb(db);
  job.log = [];
  return { ok: true };
}

const guard = (headers) => { if (PASSCODE && headers["x-demo-key"] !== PASSCODE) throw fail(401, "passcode required"); };
const originOf = (headers) => `${headers["x-forwarded-proto"] || "http"}://${headers.host || "localhost:3000"}`;

export const outreachRoutes = {
  // The team's view of the database: password protected whenever a passcode is set.
  "GET /api/outreach/state": async (_b, headers) => {
    guard(headers);
    return { ...(await readDb()), job, local: LOCAL, sellbird: existsSync(SELLBIRD_PY) };
  },
  "GET /api/outreach/contract": async (_b, headers, query) => {
    const p = find(await readDb(), query.get("p"));
    return { company: p.company, contract: p.contract || null };
  },
  "POST /api/outreach/send": (b) => send({ interval: b.interval }),
  "POST /api/outreach/reply": (b, headers) => reply(b, originOf(headers)),
  "POST /api/outreach/approve": (b) => approve(b),
  "POST /api/outreach/sign": (b) => sign(b),
  "POST /api/outreach/reset": () => reset(),
};
