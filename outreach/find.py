#!/usr/bin/env python3
"""Find a prospect's published email addresses: fetch their own pages, regex the HTML.

Two rules, from the method this follows:
  1. Never guess an address from a pattern. Only addresses printed on the firm's own site count.
  2. Record where each address came from (the exact URL), so anyone can check it later.

Usage:
  python3 outreach/find.py https://example-brokers.co.uk [more sites...]     # prints JSON
Claude Code does the web search for candidate firms, runs this on each, then writes the
record (why picked, subject, body) into outreach/prospects.json.
"""
import html
import json
import re
import sys
import urllib.parse
import urllib.request

EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}")
CONTACT_LINK = re.compile(r'href=["\']([^"\'#]*(?:contact|about|get-in-touch|team|enquir)[^"\'#]*)["\']', re.I)
CONTACT_PATHS = ["/contact", "/contact-us", "/contact-us/", "/about", "/about-us", "/get-in-touch"]
JUNK = ("example.", "sentry", "wixpress", "@2x", ".png", ".jpg", ".svg", ".webp", ".gif", "domain.com", "email.com", "yourname")
UA = {"User-Agent": "Mozilla/5.0 (outflow prospect finder; contact-page lookup)"}


def fetch(url, timeout=12):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
            if "html" not in r.headers.get("content-type", "html"):
                return ""
            return r.read(600_000).decode("utf-8", "replace")
    except Exception:
        return ""


def emails_in(page):
    text = html.unescape(urllib.parse.unquote(page))
    found = []
    for m in EMAIL.findall(text):
        m = m.strip(".").lower()
        if not any(j in m for j in JUNK) and m not in found:
            found.append(m)
    return found


def find(site):
    site = site if site.startswith("http") else "https://" + site
    root = "{0.scheme}://{0.netloc}".format(urllib.parse.urlparse(site))
    domain = urllib.parse.urlparse(root).netloc.removeprefix("www.")
    home = fetch(site)
    pages = [site] + [urllib.parse.urljoin(root, h) for h in CONTACT_LINK.findall(home)][:6]
    pages += [root + p for p in CONTACT_PATHS]
    seen, hits = set(), {}                       # address -> first URL it was printed on
    for url in pages:
        if url in seen or not url.startswith(root):
            continue
        seen.add(url)
        for e in emails_in(home if url == site else fetch(url)):
            hits.setdefault(e, url)
    # the firm's own domain first; third-party addresses (web agency, regulator) are kept apart
    own = [e for e in hits if e.split("@")[1].endswith(domain)]
    other = [e for e in hits if e not in own]
    return {
        "website": root,
        "email": own[0] if own else None,          # None means: nothing published, do not guess
        "email_source": hits[own[0]] if own else None,
        "alt_emails": [{"email": e, "source": hits[e]} for e in own[1:6]],
        "other_addresses_seen": other[:5],
        "pages_checked": len(seen),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    print(json.dumps([find(s) for s in sys.argv[1:]], indent=2))
