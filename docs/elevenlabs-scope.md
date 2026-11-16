# ElevenLabs for the FRANK voice agent: scope

Researched 2026-11-16 against elevenlabs.io/docs. "Verified" means I read it on the cited page. "UNVERIFIED" means it came from memory or a third-party source, so check it before relying on it.

## TL;DR

- **Demo day (about 4 to 6 hours):** Phase 1 swaps browser `speechSynthesis` for ElevenLabs TTS through a server proxy (about 1 hour, works in both "AI broker" and "You are the broker" modes). Phase 2 adds a **"Live" mode**: an ElevenLabs Agent in the browser, started with a server-minted **conversation token** and **per-lead overrides and dynamic variables**. It uses **Claude as the agent's native LLM** and **client tools** to write the outcome back to our UI. Everything runs on localhost, so you don't need a public URL.
- **Post-hackathon:** a custom-LLM endpoint (so `server.mjs` keeps the logic), server tools, a post-call webhook to the CRM, and real outbound calls through Twilio. Do the PECR consent work before any real UK dial (see section 5). It is the real blocker for a "0-human" pitch.

## How the app works today (for reference)

- `server.mjs` → `POST /api/voice {leadId, history, speaker}` → `voiceTurn()` → Claude returns `{say, end_call, outcome, notes}` (agent) or `{say, hang_up}` (simulated broker). The system prompt comes from `FRANK` + `leadBrief(l)`.
- `public/app.js` voice section (about lines 237-395): `speak()` uses `speechSynthesis`, `#vMic` uses `webkitSpeechRecognition`, and `call()` loops turns. `endCall()` maps `outcome` to a CRM status through `setStatus()`. CTPS gating is in `renderVoiceLeads()` (`l.compliance.call.ok`).
- The app has no bundler and plain static files. That matters for loading the ElevenLabs JS SDK (see 1b).

## 1. Paths, ranked by speed

### (a) TTS only, behind a server proxy (about 1 hour, lowest risk) ★ do first
- Endpoint (verified): `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream`, header `xi-api-key`, JSON body `{text, model_id}`, query `output_format` (default `mp3_44100_128`) and optional `optimize_streaming_latency` 0-4. https://elevenlabs.io/docs/api-reference/text-to-speech/stream
- Low-latency models (verified ids): `eleven_flash_v2_5` (about 100 ms, 50% cheaper per character) and `eleven_v4_turbo` (about 100 ms, most expressive real-time model). https://elevenlabs.io/docs/overview/models. Use Flash v2.5 to save credits and v4 Turbo for the demo-day voice quality.
- en-GB voices (UNVERIFIED ids, these are the long-standing premade British voices): George `JBFqnCBsd6RMkjVDRZzb` (warm male, use for the agent), Daniel `onwK4e9ZLuTAKqWW03F9` (news-presenter male), Alice `Xb7hH8MSUJpSbSDYk0k2` (female), Lily `pFZP5JQG7iQjIQuC4Bku` (female, use for the broker). Confirm them with `GET /v1/voices` or the Voice Library filtered to "British". Keep them in env vars so swapping is trivial.
- Remaining gap: STT is still Chrome `webkitSpeechRecognition`, and turn-taking stays push-to-talk. That's fine for the AI-vs-AI demo.

### (b) ElevenLabs Agent in the browser (about 3 to 4 hours) ★ demo-day "Live" mode
- SDK (verified): `@elevenlabs/client`, `Conversation.startSession({ signedUrl | conversationToken | agentId, connectionType: 'webrtc'|'websocket', overrides, dynamicVariables, clientTools, onConnect, onDisconnect, onMessage, onModeChange, onStatusChange, onError })` and `endSession()`. Voice defaults to WebRTC. https://elevenlabs.io/docs/agents-platform/libraries/java-script
- No bundler: the docs only show npm. Load it as `import { Conversation } from "https://esm.sh/@elevenlabs/client"` (UNVERIFIED but standard ESM CDN). Change `<script src="app.js">` to `type="module"`, or put it in a small `public/eleven.js` module. Fallback: the `<elevenlabs-convai agent-id=… dynamic-variables='{…}'>` widget (verified syntax, dynamic-variables page). The widget doesn't give our UI the transcript, so prefer the SDK.
- Per-lead personalisation (verified):
  - **Dynamic variables**: `{{lead_brief}}`, `{{contact_name}}`, `{{firm}}` in the agent's prompt or first message, passed as `dynamicVariables: {...}`. You also get the `system__conversation_id`, `system__time` and similar variables for free. A `secret__` prefix keeps a value out of the LLM. https://elevenlabs.io/docs/agents-platform/customization/personalization/dynamic-variables
  - **Overrides**: `overrides: { agent: { prompt: { prompt, llm }, firstMessage, language }, tts: { voiceId, speed } }`. **They are disabled by default. Enable each field in the agent's Security tab.** https://elevenlabs.io/docs/agents-platform/customization/personalization/overrides
  - Recommendation: build the full system prompt **server-side** (reuse `FRANK` + `leadBrief(l)`) and return it with the token. The client passes it as `overrides.agent.prompt.prompt` and passes the first message (AI disclosure) as `firstMessage`. One agent then serves every lead.
- Outcome capture: **client tools** run in our browser, so they need no public URL. Register them in the dashboard (Tool type "Client", enable "Wait for response") and pass them as `clientTools: { log_outcome: async ({outcome, notes}) => … }`. https://elevenlabs.io/docs/agents-platform/customization/tools/client-tools. Also add the system tool `end_call` so the agent hangs up itself.

### (c) Real outbound phone calls (about half a day, plus a Twilio account and legal review) → post-hackathon
- Import a Twilio number in the dashboard (Phone Numbers: label, number, SID, token). A purchased number allows inbound and outbound calls. A Verified Caller ID allows outbound only. https://elevenlabs.io/docs/agents-platform/phone-numbers/twilio-integration/native-integration
- API (verified): `POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call`, body `{agent_id, agent_phone_number_id, to_number, conversation_initiation_client_data?, call_recording_enabled?, telephony_call_config?}`. It returns `{success, message, conversation_id, callSid}`. https://elevenlabs.io/docs/api-reference/twilio/outbound-call
- `conversation_initiation_client_data` carries `dynamic_variables` and `conversation_config_override` (the raw snake_case shape from the overrides page: `{agent:{prompt:{prompt}, first_message}, tts:{voice_id}}`). The SIP-trunk route exists too, but I didn't scope it.
- On demo day, call only a team member's own phone, never a real broker. Also say clearly that it's a demo (see section 5).

## 2. LLM inside ElevenLabs agents

- **Native Claude is supported** (verified list): Opus 5.5, Opus 5, Opus 4.8/4.7/4.6, Sonnet 5.5, Sonnet 5, Sonnet 4.6/4.5, Haiku 4.5. LLM cost passes through at the provider's rate with "no markup". The docs also advise a "lower budget or effort for live voice agents". https://elevenlabs.io/docs/agents-platform/customization/llm. The exact `llm` id strings for the API or overrides weren't shown (UNVERIFIED, something like `claude-sonnet-4-5`). Pick from the dashboard dropdown and read the id back with `GET /v1/convai/agents/{id}`.
- For voice latency, choose **Sonnet 5.5 or Haiku 4.5**, not Opus. Billing goes through ElevenLabs, so our $10 Anthropic budget cap in `server.mjs` doesn't apply.
- **Custom LLM** (verified): an OpenAI-compatible `POST /v1/chat/completions` (or `/v1/responses`) that **must stream SSE** (`Content-Type: text/event-stream`, `data: {chunk}\n\n`, closing with `data: [DONE]\n\n`). ElevenLabs sends `messages, model, temperature, max_tokens, stream, user_id, tools` plus `elevenlabs_extra_body`. Configure it in the dashboard as "Custom LLM" with the URL and model id, and store the bearer key as the secret `OPENAI_API_KEY`. To use system tools (`end_call` and others), it must support OpenAI-style function calling. https://elevenlabs.io/docs/agents-platform/customization/llm/custom-llm
  - What that means for us: `server.mjs` would translate OpenAI messages into Anthropic `messages.stream()` and re-emit OpenAI chunks. Our JSON `{say,…}` contract doesn't fit, because the model must stream **plain speech**, and outcomes come back as tool calls. ElevenLabs also needs a **public HTTPS URL** (a tunnel such as cloudflared or ngrok). Not worth it on demo day.

## 3. Tools and webhooks

- **Server (webhook) tools** (verified): GET/POST/PUT/PATCH to a URL with `{path}` params and query or body params, each with a description for the LLM. Headers can be marked **Secret**. Responses can set dynamic variables. https://elevenlabs.io/docs/agents-platform/customization/tools/server-tools. Planned tools: `book_demo {slot: "Tue 10:00"|"Thu 14:30", email}` → `POST /api/eleven/tools/book-demo`, and `log_outcome {outcome, notes}` → `POST /api/eleven/tools/outcome`. Both need a public URL.
- **Post-call webhook** (verified): events `post_call_transcription` (transcript, `analysis.{evaluation_criteria_results, data_collection_results, transcript_summary, call_successful}`, `conversation_initiation_client_data.dynamic_variables`), `post_call_audio` (base64) and `call_initiation_failure`. The header `ElevenLabs-Signature` is verified with `constructEvent(rawBody, sig, secret)` from `@elevenlabs/elevenlabs-js`. https://elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks
  - Signature format (UNVERIFIED, third-party: hookdeck guide): `t=<ts>,v0=<hex>` with HMAC-SHA256 over `` `${t}.${rawBody}` `` and a roughly 30-minute replay window. Prefer the SDK.
  - Pass `lead_id` as a dynamic variable so the webhook can find the CRM row.
- **Data collection** (verified): fields with name, type (string, boolean, integer or number) and an extraction description. Results show in history and the webhook. https://elevenlabs.io/docs/agents-platform/customization/agent-analysis/data-collection. Planned fields: `outcome` (string enum: demo_booked, trial_link_sent, callback, not_interested, do_not_contact), `broker_system`, `weekly_quote_volume` (integer), `demo_slot`, `email`, `opted_out` (boolean). Evaluation criteria: "AI disclosed in first turn", "Honoured opt-out", "Booked demo or sent trial". The per-entry result shape (value or rationale) wasn't shown in the docs, so log one real payload first.

## 4. Keeping the key server-side

- Make the agent **private** (enable authentication in the agent's Security settings). The browser then never sees `ELEVENLABS_API_KEY`.
- WebRTC (preferred): `GET https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=…` → `{token, conversation_id}`. Pass it to the client as `conversationToken`. https://elevenlabs.io/docs/api-reference/conversations/get-webrtc-token. The page doesn't list headers, so send `xi-api-key` (UNVERIFIED but consistent with every other endpoint). Expiry isn't documented.
- WebSocket: `GET /v1/convai/conversation/get-signed-url?agent_id=…` with `xi-api-key` → `{signed_url}`, valid for **15 minutes** to start the call. Live sessions survive expiry. https://elevenlabs.io/docs/agents-platform/customization/authentication
- Also set the **allowlist** (up to 10 hostnames, exact match) to `localhost` plus the demo host. The TTS proxy keeps the key server-side by construction.

## 5. Compliance: what ElevenLabs gives you and what's on us

| Topic | ElevenLabs gives | We must do |
|---|---|---|
| AI disclosure | Policy only: you must tell users they're talking to an AI **and** that the call is recorded and may be shared with ElevenLabs and its LLM providers, before the interaction ([disclosure page](https://elevenlabs.io/docs/agents-platform/legal/disclosure-requirement)). No built-in disclosure. | Put both in `firstMessage`, built server-side so the client cannot drop it. Show an on-screen notice before "Call" in Live mode. |
| Recording / retention | Transcript and audio retention is configurable per agent. The default is **2 years**, and `0` means delete ([retention](https://elevenlabs.io/docs/agents-platform/customization/privacy/retention)). `call_recording_enabled` on Twilio calls. | Set short retention, such as 30 days. Mention the recording in the opener. Write a UK GDPR lawful-basis note (legitimate interest + LIA) and a privacy-notice link in the follow-up email. |
| UK PECR, live vs automated calls | Nothing UK-specific. Their TCPA page (US) says AI voices count as "artificial or prerecorded" ([TCPA](https://elevenlabs.io/docs/agents-platform/legal/tcpa)). | **Big risk:** PECR reg. 19 bans direct-marketing calls from an "automated calling system" without **prior consent**, and it covers corporate subscribers too. The ICO hasn't ruled on conversational AI. Practitioners treat AI calls as automated by default (third-party summaries: [softomate](https://www.softomatesolutions.com/blog/gdpr-pecr-call-recording-ai-voice-agents-uk-2026/), [prospeo](https://prospeo.io/s/pecr-cold-calling-rules); the ICO page returned 403 to me, so verify on ico.org.uk). Practical path: email first (corporate email is fine under PECR with an opt-out), and **call only with consent** ("reply YES for a 3-minute AI call"). Plus CTPS/TPS screening (already gated), a valid presented CLI, and a suppression list. |
| CTPS / do-not-contact | Nothing. | Keep our `compliance.call.ok` gate server-side, so the token endpoint refuses CTPS leads. A `do_not_contact` outcome writes to suppression before the call ends (client tool now, webhook later). |
| EU AI Act Art. 50 | Nothing specific. | Art. 50(1) (from 2 Aug 2026) requires telling people they're interacting with an AI unless it's obvious. Our first-sentence disclosure covers it. EU markets apply later. The UK has no equivalent yet, but do the same there. |

## 6. Pricing and free tier (snapshot, check before relying on it)

- Free plan: $0, 10k credits a month, **no commercial licence, "limited" API**. Starter is $6 a month ($1 for the first month) with 30k credits, a commercial licence and full API. Creator is $22 a month with 121k credits. https://elevenlabs.io/pricing. TTS costs about 1 credit per character, and Flash about half that.
- Agents: about $0.08 a minute plus LLM usage on realtime models. Starter includes about 12 to 14 minutes and Creator about 59 to 71. Concurrency is 4 on Starter and 6 on Creator. https://elevenlabs.io/pricing/api. The free plan's agent minutes are **unclear**: one third-party source says 15 minutes a month and 4 concurrent calls (UNVERIFIED). The official pages I read didn't say.
- Demo math: one AI-vs-AI TTS call is about 16 turns × 150 characters, roughly 2.4k credits, or about 1.2k with Flash. Free credits cover about 4 to 8 rehearsal calls. **Buy Starter at $1 for the demo** to get the commercial licence and API headroom. Twilio is a separate cost.

## 7. Integration plan for this codebase

### New env vars (`.env`, read through `--env-file`)
```
ELEVENLABS_API_KEY=...            # server only
ELEVEN_AGENT_ID=agent_...         # private agent, overrides enabled: prompt, first_message, voice
ELEVEN_VOICE_AGENT=JBFqnCBsd6RMkjVDRZzb   # George (verify)
ELEVEN_VOICE_BROKER=pFZP5JQG7iQjIQuC4Bku  # Lily (verify)
ELEVEN_TTS_MODEL=eleven_flash_v2_5        # or eleven_v4_turbo for the live demo
ELEVEN_WEBHOOK_SECRET=...         # phase 3
ELEVEN_PHONE_NUMBER_ID=...        # phase 3 (Twilio import)
```

### Server sketches (`server.mjs`)
The current router always JSON-parses the body and JSON-sends the result. The TTS and webhook routes need **raw** access, so handle them before `routes` in the `http.createServer` callback.

```js
import { Readable } from "node:stream";
const XI = { "xi-api-key": process.env.ELEVENLABS_API_KEY };

// POST /api/tts {text, who} -> audio/mpeg stream (phase 1)
if (req.method === "POST" && url.pathname === "/api/tts") {
  const { text, who } = await body(req);
  const voice = who === "broker" ? process.env.ELEVEN_VOICE_BROKER : process.env.ELEVEN_VOICE_AGENT;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_44100_128`, {
    method: "POST", headers: { ...XI, "content-type": "application/json" },
    body: JSON.stringify({ text: String(text).slice(0, 600), model_id: process.env.ELEVEN_TTS_MODEL || "eleven_flash_v2_5" }),
  });
  if (!r.ok) return send(res, r.status, { error: await r.text() });
  res.writeHead(200, { "content-type": "audio/mpeg" });
  return Readable.fromWeb(r.body).pipe(res);
}
```

```js
// GET /api/eleven/session?leadId=  (phase 2) -> token + per-lead prompt; refuses CTPS leads
"GET /api/eleven/session": async (_b, url) => {           // pass url into route handlers
  const l = lead(url.searchParams.get("leadId"));
  if (!l.compliance.call.ok) throw Object.assign(new Error("CTPS: calls not allowed"), { status: 403 });
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${process.env.ELEVEN_AGENT_ID}`, { headers: XI });
  if (!r.ok) throw Object.assign(new Error(await r.text()), { status: 502 });
  const { token } = await r.json();
  return {
    conversationToken: token,
    prompt: agentSystemPrompt(l),   // extract the existing voiceTurn() agent prompt into a function; drop the JSON-output instructions
    firstMessage: `Hi, is that ${l.contact.name.split(" ")[0]}? I'm FRANK's AI assistant, an automated agent, and this call is recorded. Have you got two minutes?`,
    dynamicVariables: { lead_id: l.id, contact_name: l.contact.name, firm: l.firm },
  };
},
```
The signed-URL alternative is `/v1/convai/conversation/get-signed-url?agent_id=…` → `signed_url` → `startSession({ signedUrl })`.

```js
// POST /api/eleven/webhook (phase 3, needs a public URL). Raw body is required for the signature.
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";   // npm i @elevenlabs/elevenlabs-js
if (req.method === "POST" && url.pathname === "/api/eleven/webhook") {
  let raw = ""; for await (const c of req) raw += c;
  const ev = await new ElevenLabsClient().webhooks.constructEvent(raw, req.headers["elevenlabs-signature"], process.env.ELEVEN_WEBHOOK_SECRET); // method path per docs, check the SDK version
  if (ev.type === "post_call_transcription") {
    const d = ev.data, id = d.conversation_initiation_client_data?.dynamic_variables?.lead_id;
    const outcome = d.analysis?.data_collection_results?.outcome?.value;   // shape UNVERIFIED, log one payload first
    updateLead(id, { outcome, summary: d.analysis?.transcript_summary, transcript: d.transcript });
  }
  return send(res, 200, { ok: true });
}
```

```js
// POST /api/eleven/call {leadId} (phase 3) -> real outbound call via Twilio
const r = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
  method: "POST", headers: { ...XI, "content-type": "application/json" },
  body: JSON.stringify({ agent_id: process.env.ELEVEN_AGENT_ID, agent_phone_number_id: process.env.ELEVEN_PHONE_NUMBER_ID,
    to_number: l.phone, call_recording_enabled: true,
    conversation_initiation_client_data: { dynamic_variables: { lead_id: l.id },
      conversation_config_override: { agent: { prompt: { prompt: agentSystemPrompt(l) }, first_message: opener(l) } } } }),
});   // -> { success, conversation_id, callSid }
```

The server state is in-memory (`leads` from `analyse()`), so `updateLead` has to mutate it and the UI has to poll `/api/state`. The status currently lives client-side through `setStatus()`.

### `public/app.js` voice section changes
1. **Phase 1:** replace the body of `speak(text, who)` with `fetch("/api/tts", {method:"POST", body: JSON.stringify({text, who})})` → `new Audio(URL.createObjectURL(await r.blob()))`. Toggle `#wave` on `play` and remove it on `ended`. Keep the `speechSynthesis` code as a fallback when the request fails. In `endCall()` and the hang-up handler, call `currentAudio?.pause()` next to `speechSynthesis.cancel()`. For quicker first audio, use MediaSource streaming later. A blob is fine for one or two sentences.
2. **Phase 2:** add a third `#vMode` button, `data-mode="live"`. In `call()`, if `V.mode === "live"`, run `liveCall(l)` instead of the turn loop:
```js
import { Conversation } from "https://esm.sh/@elevenlabs/client";   // app.js must become type="module"
async function liveCall(l) {
  const s = await api(`/api/eleven/session?leadId=${l.id}`);   // api() GETs when there is no body
  let result = { outcome: "in_progress", notes: "" };
  V.conv = await Conversation.startSession({
    conversationToken: s.conversationToken, connectionType: "webrtc",
    overrides: { agent: { prompt: { prompt: s.prompt }, firstMessage: s.firstMessage, language: "en" } },
    dynamicVariables: s.dynamicVariables,
    clientTools: { log_outcome: async ({ outcome, notes }) => { result = { outcome, notes }; return "logged"; } },
    onMessage: ({ source, message }) => bubble(source === "ai" ? "agent" : "broker", message), // field names: check SDK
    onModeChange: ({ mode }) => $("#wave").classList.toggle("on", mode === "speaking"),
    onDisconnect: () => endCall(l, result),
  });
}
```
   The hang-up handler calls `V.conv?.endSession()`. The `#vMic` and `#vText` push-to-talk UI is hidden in Live mode, because ElevenLabs does STT and turn-taking. Keep the "AI broker" mode on the existing Claude loop with ElevenLabs TTS from phase 1. It stays the safest demo because it needs no mic and no network audio.
3. Agent dashboard setup (one-off): voice George, TTS `eleven_v4_turbo`, LLM Claude Sonnet 5.5 or Haiku 4.5, enable overrides (prompt, first message, language), enable auth, allowlist `localhost`, client tool `log_outcome(outcome: string, notes: string)` with "Wait for response", system tool `end_call`, the data-collection fields from section 3, and retention at 30 days.

### Phased plan
| Phase | When | Scope | Effort |
|---|---|---|---|
| 1 | Demo day, first | `/api/tts` + `speak()` swap. AI-vs-AI demo with real British voices. | about 1 h |
| 2 | Demo day, if time | Private agent + `/api/eleven/session` (token) + Live mode with a judge or teammate as the broker on mic. Client tool `log_outcome`. Disclosure in `firstMessage`. | 3 to 4 h |
| 3 | Post-hackathon | Tunnel or deploy → post-call webhook + data collection → CRM. Server tools `book_demo` (calendar) and `log_outcome`. Real suppression list. | 1 to 2 days |
| 4 | Post-hackathon | Twilio number import + `/api/eleven/call`, gated by CTPS + **prior consent** under PECR reg. 19 + CLI. Optional custom-LLM bridge so `server.mjs` owns the prompts and Claude spend. | 2 to 4 days + legal review |

Demo-day risks: venue Wi-Fi blocking WebRTC (fall back to `connectionType: "websocket"` with a signed URL), the mic picking up the speakers (use headphones), free-tier agent minutes (buy Starter), and override fields not enabled (the session fails or ignores the prompt silently, so test with one lead first).
