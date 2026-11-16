#!/usr/bin/env python3
"""Send the unsent emails in outreach/prospects.json, one per minute, plain text only.

The JSON file is the whole database: this reads it, takes every record with "sent": false,
sends one email, flips the flag, saves, waits, repeats. No HTML, no tracking, no attachments,
no links. The same script sends follow-ups queued in a record's "outbox".

Where mail goes:
  default        the local demo mailbox (outreach/sink.py on localhost:2525); nothing leaves this machine
  --live         your real SMTP server, from SMTP_HOST / SMTP_PORT / SMTP_USERNAME / SMTP_PASSWORD / SMTP_FROM.
                 Every email is redirected to TEST_RECIPIENT (your own inbox) so you can see real delivery.
  --live --to-prospects   really email the firms. Check consent rules, SPF and DKIM first.

Usage:
  python3 outreach/send.py                  # demo mailbox, one a minute
  python3 outreach/send.py --interval 5     # faster, for a demo
  python3 outreach/send.py --dry-run        # print what would go out
  python3 outreach/send.py --live --limit 5
"""
import argparse
import json
import os
import smtplib
import ssl
import sys
import time
from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from pathlib import Path

DB = Path(__file__).with_name("prospects.json")

# pick up SMTP settings from the repo's .env when they are not already in the environment
ENV = Path(__file__).resolve().parent.parent / ".env"
if ENV.exists():
    for line in ENV.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


def load():
    return json.loads(DB.read_text(encoding="utf-8"))


def save(db):
    tmp = DB.with_suffix(".tmp")
    tmp.write_text(json.dumps(db, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(DB)


def pending(db, only=None):
    """First emails not sent yet, then queued follow-ups. Opted-out records are never sent to."""
    for p in db["prospects"]:
        if p.get("opted_out") or not p.get("email") or (only and p["id"] != only):
            continue
        if not p.get("sent"):
            yield p, {"subject": p["subject"], "body": p["body"], "first": True}
        for item in p.get("outbox", []):
            if not item.get("sent"):
                yield p, item


def connect(live):
    if not live:
        return smtplib.SMTP("127.0.0.1", int(os.environ.get("SINK_PORT", 2525)), timeout=10)
    host, port = os.environ["SMTP_HOST"], int(os.environ.get("SMTP_PORT", 587))
    s = smtplib.SMTP(host, port, timeout=30)
    s.starttls(context=ssl.create_default_context())
    s.login(os.environ["SMTP_USERNAME"], os.environ["SMTP_PASSWORD"])
    return s


def build(p, item, sender, domain, redirect=""):
    msg = EmailMessage()                       # plain text only
    msg["From"] = sender
    msg["To"] = redirect or p["email"]
    msg["Subject"] = item["subject"] + (f" [test copy, would go to {p['email']}]" if redirect else "")
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain=domain)
    if not item.get("first") and p.get("message_id"):
        msg["In-Reply-To"] = msg["References"] = p["message_id"]
    msg.set_content(item["body"])
    return msg


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--interval", type=float, default=60, help="seconds between emails (default 60)")
    ap.add_argument("--limit", type=int, default=0, help="stop after this many")
    ap.add_argument("--only", help="send for this prospect id only")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--live", action="store_true", help="use the real SMTP server from the environment")
    ap.add_argument("--to-prospects", action="store_true", help="with --live: email the firms, not TEST_RECIPIENT")
    a = ap.parse_args()

    demo_sender = "Frank at FRANK <frank@outflow.test>"
    sender = os.environ.get("SMTP_FROM", demo_sender) if a.live else demo_sender   # your address is used only with --live
    domain = sender.split("@")[-1].strip("> ")
    if a.live and not os.environ.get("SMTP_HOST"):
        sys.exit("--live needs SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD and SMTP_FROM")
    redirect = "" if (a.to_prospects or not a.live) else os.environ.get("TEST_RECIPIENT", "")
    if a.live and not a.to_prospects and not redirect:
        sys.exit("--live sends to TEST_RECIPIENT; set it, or add --to-prospects to email the firms")

    if a.dry_run:
        for p, item in pending(load(), a.only):
            print(f"[dry-run] to {p['email']}: {item['subject']}")
        return

    sent = 0
    while True:
        db = load()                            # re-read each round: the file may have changed
        nxt = next(pending(db, a.only), None)
        if not nxt or (a.limit and sent >= a.limit):
            break
        p, item = nxt
        msg = build(p, item, sender, domain, redirect)
        try:
            with connect(a.live) as smtp:
                smtp.send_message(msg)
        except Exception as e:
            sys.exit(f"send failed for {p['email']}: {e}" + ("" if a.live else "  (is outreach/sink.py running?)"))
        stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
        if item.get("first"):
            p.update(sent=True, sent_at=stamp, message_id=msg["Message-ID"], via="smtp" if a.live else "demo mailbox")
        else:
            item.update(sent=True, sent_at=stamp)
        p.setdefault("thread", []).append({"from": "us", "at": stamp, "subject": item["subject"], "body": item["body"]})
        save(db)
        sent += 1
        print(f"sent {sent}: {p['company']} <{p['email']}>  {item['subject']}", flush=True)
        if next(pending(db, a.only), None):
            time.sleep(a.interval)
    print(f"done, {sent} sent", flush=True)


if __name__ == "__main__":
    main()
