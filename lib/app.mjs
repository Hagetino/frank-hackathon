import { outreachRoutes } from "./outreach.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { buildLeads } from "./leads.mjs";
import { analyse } from "./engine.mjs";

const here = fileURLToPath(new URL("..", import.meta.url));
export const MODEL = "claude-opus-5-5";
export const BUDGET_USD = Number(process.env.BUDGET_USD || 10); // hard cap, credit is $25
const PRICE = { in: 4 / 1e6, out: 20 / 1e6 };

// Pin to the public API with the hackathon key: the shell may carry a proxy base URL / auth token.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  authToken: null,
  baseURL: "https://api.anthropic.com",
});
const { leads, clusters } = analyse(buildLeads());
const byId = new Map(leads.map((l) => [l.id, l]));
// Spend survives restarts so the cap is real.
const SPEND_FILE = process.env.VERCEL ? "/tmp/.spend.json" : join(here, ".spend.json");
const spend = await readFile(SPEND_FILE, "utf8").then(JSON.parse).catch(() => ({ usd: 0, calls: 0 }));

const FRANK = `FRANK (Lisbon, founded Dec 2024) builds an AI Operator for insurance intermediaries (agents and brokers).
What it does: captures every request on every channel (email, WhatsApp, documents), structures it (reads documents, identifies the process, flags missing data), then executes it inside insurers' portals and broker systems as a named user: multi-insurer quotes and simulations, renewals, proposals, policy changes, claims follow-up.
Human gate: nothing reaches the broker's end client without a named person pressing send.
Proof (Portugal): 350+ agencies and offices, 1,500+ users, about 70,000 back-office tasks a month, about 150 paying clients. Agencies report about 10 hours of admin freed per mediator per week; operations drop from over 50% of the day to under 10%. Raised EUR 2.9M (Armilar, Start Ventures) in Oct 2026.
UK status: FRANK is entering the UK in 2027 and has NO UK clients and NO live UK broker-platform connectors yet. The Operator works directly on insurer portals; Acturis/OpenGI connectors are priorities. Never claim UK customers, UK case studies or live UK integrations.
Offer: a 20-minute demo where FRANK runs a real quote on the broker's own insurer portals, then a free trial. Founding UK customers get onboarding help and early pricing.`;

function leadBrief(l) {
  return `Firm: ${l.firm} (${l.legalForm}), ${l.town}, ${l.region}. FCA FRN ${l.frn} (demo).
Contact: ${l.contact.name}, ${l.contact.role}.
${l.staff} staff, ${l.branches} branch(es), est. ${l.policies} policies across ${l.carriers} insurers.
Lines: ${l.lines.join(", ")}. Commercial share ${Math.round(l.commercialShare * 100)}%.
Broker system: ${l.software}.
Signals: ${l.signals.join("; ") || "none"}.
Segment: ${l.cluster}. Fit score ${l.score.total}/100 (tier ${l.score.tier}). Est. hours freed: ~${l.score.hoursFreedPerWeek} h/week.
Channel rules: email ${l.compliance.email.ok ? "allowed" : "NOT allowed"}; call ${l.compliance.call.ok ? "allowed" : "NOT allowed (CTPS)"}.`;
}

async function claude({ system, messages, schema, effort = "medium", maxTokens = 4000 }) {
  if (spend.usd >= BUDGET_USD) {
    const e = new Error(`Demo budget of $${BUDGET_USD} reached`);
    e.status = 429;
    throw e;
  }
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages,
    output_config: { effort, format: { type: "json_schema", schema } },
  });
  spend.calls++;
  spend.usd += res.usage.input_tokens * PRICE.in + res.usage.output_tokens * PRICE.out;
  writeFile(SPEND_FILE, JSON.stringify(spend)).catch(() => {});
  if (res.stop_reason === "refusal") throw Object.assign(new Error("Model declined this request"), { status: 422 });
  const text = res.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error(`No text in response (stop_reason ${res.stop_reason})`);
  return JSON.parse(text);
}

const obj = (props) => ({ type: "object", properties: props, required: Object.keys(props), additionalProperties: false });
const str = { type: "string" };

const STYLE = `Write like a sharp, friendly UK B2B seller, in British English. Short sentences, specific to this firm, no hype words (revolutionise, game-changer, unlock, seamless, cutting-edge), no em dashes, no fake familiarity. Lead with their pain, not with FRANK. One clear ask.`;

const DRAFT_SCHEMA = obj({
  angle: str,
  email: obj({ subject: str, body: str }),
  linkedin_note: str,
  linkedin_followup: str,
  call_opener: str,
  voicemail: str,
  whatsapp_followup: str,
});

async function draft(l, extra = "") {
  return claude({
    system: `You are FRANK's outbound assistant drafting first-touch outreach to UK insurance brokers.\n\n${FRANK}\n\n${STYLE}`,
    effort: "medium",
    schema: DRAFT_SCHEMA,
    messages: [{
      role: "user",
      content: `Draft a multichannel sequence for this prospect.\n\n${leadBrief(l)}\n\n${extra}
Requirements:
- angle: one line on the hook you chose and why.
- email: subject under 7 words; body under 120 words, signed "Frank, AI assistant at FRANK", and end with a line saying it was written by an AI assistant plus a one-line opt-out ("Reply 'stop' and we won't contact you again").
- linkedin_note: under 280 characters.
- linkedin_followup: under 500 characters, sent after they accept.
- call_opener: what the AI voice agent says in the first 15 seconds; it must say it is an AI assistant calling for FRANK and ask permission to continue.
- voicemail: under 40 words, with the AI disclosure.
- whatsapp_followup: under 300 characters, only used after they opt in.`,
    }],
  });
}

const REPLY_SCHEMA = obj({
  intent: { type: "string", enum: ["interested", "objection", "question", "not_now", "not_interested", "unsubscribe", "wrong_person"] },
  summary: str,
  next_action: str,
  response: str,
  human_needed: { type: "boolean" },
});

async function handleReply(l, message) {
  return claude({
    system: `You are FRANK's inbox agent. You read prospect replies and answer them without a human, unless a human is truly needed (legal or contract negotiation, enterprise procurement, complaint).\n\n${FRANK}\n\n${STYLE}\nIf they unsubscribe or are not interested, confirm politely in one line and stop. If interested, offer two concrete demo slots next week (Tue 10:00 or Thu 14:30 UK time) and the self-serve trial link https://meet-frank.com/uk/trial.`,
    effort: "medium",
    schema: REPLY_SCHEMA,
    messages: [{ role: "user", content: `Prospect:\n${leadBrief(l)}\n\nTheir reply:\n"""${message}"""` }],
  });
}

const AGENT_SCHEMA = obj({
  say: str,
  end_call: { type: "boolean" },
  outcome: { type: "string", enum: ["in_progress", "demo_booked", "trial_link_sent", "callback", "not_interested", "do_not_contact"] },
  notes: str,
});

const BROKER_SCHEMA = obj({ say: str, hang_up: { type: "boolean" } });

function transcript(history, me) {
  return history.map((t) => `${t.speaker === me ? "YOU" : t.speaker === "agent" ? "FRANK AI" : "BROKER"}: ${t.text}`).join("\n");
}

async function voiceTurn(l, history, speaker) {
  if (speaker === "broker") {
    return claude({
      system: `You are role-playing ${l.contact.name}, ${l.contact.role} at ${l.firm}, a UK insurance broker, answering an unexpected phone call. You are busy, polite but sceptical, and you care about time, data security and whether it works with ${l.software}. Raise one or two realistic objections, but if the answers are good, agree to a demo. Speak naturally, one or two short sentences, no stage directions.\n\nYour firm: ${leadBrief(l)}`,
      effort: "low",
      maxTokens: 1500,
      schema: BROKER_SCHEMA,
      messages: [{ role: "user", content: `Call so far:\n${transcript(history, "broker")}\n\nYour next line:` }],
    });
  }
  return claude({
    system: `You are FRANK's AI voice agent making an outbound call to a UK insurance broker. You are an AI and you said so at the start; never pretend to be human.\n\n${FRANK}\n\nCall goals, in order: get permission to talk; qualify (who does quotes and renewals, rough weekly volume, which broker system); connect it to their pain; book a 20-minute demo (offer Tue 10:00 or Thu 14:30 UK time) or send the trial link by email. Handle objections honestly. If they say no twice, or ask not to be called, apologise, confirm they won't be contacted again and end the call (outcome do_not_contact or not_interested).\nSpeak in natural spoken British English: one or two short sentences per turn, no lists, no URLs read aloud. Set end_call true only after a clear close or goodbye.\n\nProspect: ${leadBrief(l)}`,
    effort: "low",
    maxTokens: 1500,
    schema: AGENT_SCHEMA,
    messages: [{ role: "user", content: history.length ? `Call so far:\n${transcript(history, "agent")}\n\nYour next line:` : `The broker just picked up. Open the call (disclose you are an AI, ask permission).` }],
  });
}

// ---------- API (shared by the local server and the Vercel function) ----------
const PASSCODE = process.env.DEMO_PASSCODE || "";

function lead(id) {
  const l = byId.get(id);
  if (!l) throw Object.assign(new Error(`Unknown lead ${id}`), { status: 404 });
  return l;
}

const routes = {
  "GET /api/state": async () => ({ leads, clusters, spend, budget: BUDGET_USD, model: MODEL, locked: !!PASSCODE }),
  "GET /api/spend": async () => ({ spend, budget: BUDGET_USD }),
  "POST /api/draft": async (b) => ({ draft: await draft(lead(b.leadId), b.extra || ""), spend }),
  "POST /api/reply": async (b) => ({ result: await handleReply(lead(b.leadId), String(b.message || "").slice(0, 3000)), spend }),
  "POST /api/voice": async (b) => ({ turn: await voiceTurn(lead(b.leadId), (b.history || []).slice(-30), b.speaker === "broker" ? "broker" : "agent"), spend }),
  ...outreachRoutes, // outreach desk + closing cycle (lib/outreach.mjs)
};

// Returns [status, json] or null when the path is not an API route.
export async function handleApi(method, pathname, body, headers = {}, query = new URLSearchParams()) {
  const route = routes[`${method} ${pathname}`];
  if (!route) return pathname.startsWith("/api/") ? [404, { error: "not found" }] : null;
  if (method === "POST" && PASSCODE && headers["x-demo-key"] !== PASSCODE) return [401, { error: "passcode required" }];
  try {
    return [200, await route(body || {}, headers, query)];
  } catch (err) {
    console.error(`[${method} ${pathname}]`, err.message);
    return [err.status && err.status < 600 ? err.status : 500, { error: err.message }];
  }
}
