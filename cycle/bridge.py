#!/usr/bin/env python3
"""Run Sellbird's reply Handler on one prospect reply and print the result as JSON.

Sellbird (github.com/ethanplusai/sellbird, AGPL-3.0) is installed next to this repo by
cycle/setup.sh; nothing of it is copied in here. This file only calls it:
  - its opt-out rules (no model involved),
  - its intent classifier and deal-stage logic,
  - its reply writer, which thinks through the Claude Code CLI on your own plan.

stdin:  {"prospect": {...record from outreach/prospects.json...}, "reply": "their email text", "sign_url": "..."}
stdout: {"intent", "stage", "response", "human_needed", "opt_out", "engine"}
"""
import asyncio
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
(HERE / "data").mkdir(exist_ok=True)


async def run(payload):
    from importlib.metadata import version as _v
    from sellbird.agents.handler import Handler, _opt_out_reason
    from sellbird.brain import Brain
    from sellbird.config import load_config, load_env
    from sellbird.models.conversation import Conversation, Message
    from sellbird.models.prospect import Prospect
    from sellbird.state import StateManager

    p, reply = payload["prospect"], payload["reply"].strip()
    engine = f"sellbird {_v('sellbird')} handler"
    stage = p.get("stage") or "initial_outreach"

    # 1. Opt-outs are honoured by rule, before any model reads the reply.
    hit = _opt_out_reason(reply, reply)
    if hit:
        return {"intent": "unsubscribe", "stage": "closed_lost", "response": "", "human_needed": False,
                "opt_out": hit, "engine": engine + " (opt-out rule, no model)"}

    config = load_config(str(HERE / "sellbird.local.yaml"))
    sign_url = payload.get("sign_url") or "http://localhost:3000/sign.html"
    offer = config.product.offer                     # this firm's own signing link
    offer.entry = offer.entry.replace("http://localhost:3000/sign.html", sign_url)
    offer.booking_url = sign_url
    state = StateManager(str(HERE / "data" / "sellbird.db"))
    await state.init_db()
    brain = Brain(state, config.brain)
    handler = Handler(brain, state, config, load_env())
    handler.skills = brain.load_skills_for_agent("handler")
    # FRANK's product facts live in this repo, not in the Sellbird checkout.
    handler.skills += "\n\nPRODUCT KNOWLEDGE\n" + (HERE / "product_knowledge.md").read_text(encoding="utf-8")

    contact = (p.get("contact") or "").split()
    prospect = Prospect(id=p["id"], first_name=contact[0] if contact else "", last_name=" ".join(contact[1:]),
                        email=p.get("email") or "", title=p.get("contact_role") or "", company=p["company"],
                        industry="Insurance broking", source="outflow prospects.json", source_url=p.get("email_source") or "")

    # 2. Sellbird classifies the reply and moves the deal stage.
    intent = await handler._classify_intent(reply, prospect)
    stage = handler._determine_stage(intent, stage, reply)
    out = {"intent": intent, "stage": stage, "response": "", "human_needed": intent == "escalate",
           "opt_out": None, "engine": engine}
    if intent in ("unsubscribe", "not_interested", "escalate", "ooo"):
        return out

    # 3. Sellbird writes the answer from the whole thread.
    thread = [Message(sender="prospect" if m["from"] == "them" else "sellbird", content=m["body"])
              for m in p.get("thread", [])]
    thread.append(Message(sender="prospect", content=reply))
    convo = Conversation(id=f"c-{p['id']}", prospect_id=p["id"], thread=thread, intent=intent, stage=stage)
    handoff = None
    if intent == "accepted_offer":
        # They said yes. Our system has already prepared the agreement; Sellbird's handoff
        # carries that result into the reply, and the deal moves to closing.
        handoff = {"ok": True, "result": f"The one-page trial agreement is ready to sign at {sign_url} . "
                                         "The 39-euro trial month starts as soon as it is signed."}
        convo.stage = out["stage"] = "closing"
    out["response"] = await handler._generate_response(intent, reply, prospect, convo, handoff)
    return out


if __name__ == "__main__":
    os.chdir(HERE)
    try:
        print(json.dumps(asyncio.run(run(json.load(sys.stdin)))))
    except Exception as e:  # the Node server shows this message
        print(json.dumps({"error": f"{type(e).__name__}: {e}"}))
        sys.exit(1)
