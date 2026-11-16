#!/usr/bin/env python3
"""Local demo mailbox: a tiny SMTP server that accepts mail and keeps it on this machine.

send.py talks real SMTP to it, so the demo exercises the real send path while nothing
reaches a real inbox. Messages land in outreach/.sink/ as .eml files.

Usage:  python3 outreach/sink.py [port]        (default 2525)
"""
import asyncio
import sys
import time
from pathlib import Path

BOX = Path(__file__).with_name(".sink")


async def session(reader, writer):
    async def say(line):
        writer.write((line + "\r\n").encode())
        await writer.drain()

    await say("220 outflow demo mailbox")
    rcpt, data = [], None
    while True:
        raw = await reader.readline()
        if not raw:
            break
        cmd = raw.decode("utf-8", "replace").strip()
        verb = cmd[:4].upper()
        if verb in ("EHLO", "HELO"):
            await say("250 outflow")
        elif verb == "MAIL":
            rcpt = []
            await say("250 OK")
        elif verb == "RCPT":
            rcpt.append(cmd.split(":", 1)[-1].strip(" <>"))
            await say("250 OK")
        elif verb == "DATA":
            await say("354 End with <CRLF>.<CRLF>")
            lines = []
            while True:
                line = await reader.readline()
                if line in (b".\r\n", b".\n", b""):
                    break
                lines.append(line[1:] if line.startswith(b"..") else line)
            BOX.mkdir(exist_ok=True)
            name = f"{int(time.time() * 1000)}-{(rcpt or ['unknown'])[0].replace('@', '_at_')}.eml"
            (BOX / name).write_bytes(b"".join(lines))
            print(f"received for {', '.join(rcpt)} -> {name}", flush=True)
            await say("250 OK: kept locally, not delivered")
        elif verb == "QUIT":
            await say("221 Bye")
            break
        elif verb == "RSET":
            await say("250 OK")
        else:
            await say("250 OK")
    writer.close()


async def main(port):
    server = await asyncio.start_server(session, "127.0.0.1", port)
    print(f"demo mailbox listening on 127.0.0.1:{port} (mail is stored in {BOX}, never delivered)", flush=True)
    async with server:
        await server.serve_forever()


if __name__ == "__main__":
    asyncio.run(main(int(sys.argv[1]) if len(sys.argv) > 1 else 2525))
