# FRANK Outreach Engine: launch film scope

Status 2026-11-16: features not frozen. This file maps every feature we might ship to what the film
would show for it, so the film can be locked the moment the feature list is.

## The product in one line

FRANK opens a new country with no sales team there: it finds every broker, ranks them, writes to and
calls each one, answers the replies and books the trial. **Humans involved: 0.**

The one thing a viewer should remember: *you can open a market without opening an office.*

## Source facts the film may use (and only these)

| Fact | Source |
|---|---|
| 350+ agencies, 1,500+ users in Portugal | frankinsurance.ai FAQ, `server.mjs:28` |
| ~10 h of admin freed per mediator per week | FRANK brief, `server.mjs:28` |
| €39/month TRIAL plan, no lock-in | frankinsurance.ai pricing |
| €2.9M raised, Armilar + Start Ventures, Oct 2026 | tech.eu |
| UK leads come from the FCA Register | app copy, `public/index.html` |
| Voice agent says it is an AI on every call | app copy + EU AI Act framing |

Not claimable: any UK customer, any UK integration, any real send/open/reply rate (the demo simulates
them), the number of brokers on the FCA register (unchecked; look it up before using a number).
The 56 demo firms are fictional; if a firm name is on screen, it is one of them.

## Feature matrix

Status: **Built** = in the demo today. **Likely** = talked about, small. **Maybe** = undecided.
Each feature is one "station" in the film, so adding or dropping one changes one shot, not the film.

| # | Feature | Status | What the film shows (real UI where it exists) | Shot length |
|---|---|---|---|---|
| 1 | **Market map**: FCA register → 4 k-means clusters (networks, commercial SME, specialist, personal-lines) | Built | The register row turns into a dot; dots drift into 4 coloured clusters on the real scatter | 3 s |
| 2 | **Ranked leads**: fit score /100, tiers A/B/C, year-1 value, reasons | Built | One row rises to #1, score counts up, the "why" reasons write in | 3 s |
| 3 | **Multichannel drafts**: email, 2× LinkedIn, call opener, voicemail, WhatsApp, written by Claude per firm | Built | The real drawer: one draft types itself, tabs flick email → LinkedIn → WhatsApp | 4 s |
| 4 | **Compliance gate**: PECR (email), CTPS (phone), WhatsApp only after opt-in | Built | Three ticks land on the lead before anything is sent; one channel greys out | 1.5 s (inside 3) |
| 5 | **Campaign autopilot**: sequence email → LinkedIn → AI call → follow-up, funnel + live feed | Built (sends simulated) | Funnel bars fill, feed scrolls; small "simulated" note kept | 3 s |
| 6 | **AI voice agent**: discloses AI, qualifies, handles objections, books demo | Built (browser voice) | Phone card, waveform, live transcript; first line "I'm an AI assistant calling for FRANK" | 5 s |
| 6b | ElevenLabs voice / live agent | Likely (`docs/elevenlabs-scope.md`) | Same shot, but we hear the real voice: the film's best sound moment | +0 s |
| 7 | **Inbox agent**: classifies the reply, answers, books, flags a human only when needed | Built | A reply lands, label "Interested → book demo", answer drafts, "Human needed: no" | 3 s |
| 8 | **Trial booked / self-serve signup** at €39 | Likely | The calendar slot or trial link turns into the "Booked" state on the lead | 1.5 s |
| 9 | **Humans involved: 0** counter + Claude spend meter | Built | The header pill: the film's carrier. Stays at 0 through every station | throughout |
| 10 | **Next markets**: Spain (DGSFP), Brazil (SUSEP), US (NIPR) | Maybe (buttons exist, disabled) | Payoff: the UK path copies itself onto 3 more registers | 3 s |
| 11 | **Account-management loop** (Question 1 bridge): usage signals, overage → upgrade, monthly value report | Maybe | One closing beat: the booked trial becomes a customer the same engine keeps | 2 s, optional |
| 12 | Real FCA ingestion (live register pull) | Maybe | Only changes the copy: "demo sample" → "live register" | 0 s |
| 13 | CRM write-back / post-call webhook | Maybe | Not shown; not visual enough | 0 s |
| 14 | Real outbound phone calls (Twilio) | Post-hackathon | Not shown; needs PECR work first | 0 s |

**Minimum film** (if we freeze today): stations 1, 2, 3+4, 6, 7, 9 → ~30 s.
**Full film**: add 5, 8, 10 → ~40 s. Station 11 only if the pitch keeps the Question 1 bridge.

## Decisions only the team can make

1. Feature freeze: which of rows 6b, 8, 10, 11 make it in.
2. Where it plays: on the pitch screen (16:9, sound on) or LinkedIn/Instagram (needs a 9:16 cut, captions for sound-off).
3. Voice: the ElevenLabs agent voice in the call shot (needs their key + credits) or browser TTS (free, sounds robotic).
4. End card: FRANK's own logo file (ask FRANK, or pull from their site) vs our "FRANK · Outreach Engine" wordmark; event name and date for the line under it.
5. Team names on the end card or not.

## What I need to build it

- Feature freeze (above).
- The app running with final copy, so I capture real screens at 2× (`localhost:3000`, no login needed).
- One fictional "hero" firm we always use: **Kingsmere Risk Solutions Ltd** (Commercial SME cluster, fit score 90, the top lead in the demo).
- Music: free track from `/media-use` by default; say if you want a paid catalog track.
