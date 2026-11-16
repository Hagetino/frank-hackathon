# Handoff: FRANK Outreach Engine launch film

Read this first. Everything you need is in this folder.

| File | What it is |
|---|---|
| `README.md` | this brief: the job, the story, the look, the skills, the steps |
| `SCOPE.md` | every feature we might ship → the shot it gets, plus the facts you may and may not claim |
| `STORYLINES.md` | three different films; **A "Zero" is the recommended one** |
| `refs/flow.png` | main mood image: the iridescent ribbon, pale ground, thin type |
| `refs/pinA.mp4`, `refs/pinA-sheet.jpg` | Pinterest ref 1 (Spline site): glass ribbon, thin sans + one italic word |
| `refs/pinB.mp4`, `refs/pinB-sheet.jpg` | Pinterest ref 2: curved wall of UI cards with soft colour gradients |
| `refs/ai-club-launch-film.mp4` | our earlier launch film, made with the same HyperFrames pipeline |
| `screens/01-market-map.png` | real screenshot of the app (2×). Capture the other 4 tabs the same way |

Original pins: https://de.pinterest.com/pin/816629344963059772/ and
https://de.pinterest.com/pin/894597913511159450/

## 1. The job

A 30–40 s launch film (1920×1080, 30 fps, music + sound effects, no voiceover) for our Nova SBE ×
FRANK hackathon project, the **FRANK Outreach Engine**. It's built as HTML and rendered to MP4 with
HyperFrames.

**What the product is:** FRANK (Lisbon, AI back office for insurance brokers, 350+ agencies in
Portugal) wants to grow abroad without hiring a sales team abroad. Our engine opens a new country
(the UK first) with zero humans: it pulls every broker from the FCA register, clusters and ranks them,
writes personalised email, LinkedIn and WhatsApp messages, calls them with an AI voice agent that says
it's an AI, answers the replies, and books the €39 trial.

**The one thing to remember:** *you can open a market without opening an office.*
**The carrier:** the app's header pill **"Humans involved 0"**, which stays at 0 the whole film.

The features are **not frozen yet**. Build the film as stations (one per feature) so a feature can be
added or dropped by swapping one shot. `SCOPE.md` has the matrix and the "minimum film" vs the "full
film".

You don't need to follow FRANK's navy/teal brand. Follow the references.

## 2. The story (storyline A, "Zero")

One fictional broker, **Kingsmere Risk Solutions Ltd** (Commercial SME cluster, fit score 90), travels
along an iridescent ribbon from a register line to a booked trial. The ribbon *is* the pipeline, and the
camera rides it in one continuous take. Each station is a real piece of the app resting on the ribbon.

| Beat | Time | What happens | On-screen line |
|---|---|---|---|
| Hook | 0–3 s | White frame, FCA register rows in grey; Kingsmere's row turns black and lifts; ribbon sweeps in and catches it | *Every broker in the UK* |
| Tension | 3–6 s | The row multiplies into a wall of rows | *and nobody there to call them* |
| Reveal | 6–9 s | Ribbon folds into the app header; "Humans involved 0" lands | *FRANK Outreach Engine* |
| Find | 9–12 s | The row becomes a dot; dots drift into the 4 coloured clusters (real scatter) | *Mapped* |
| Rank | 12–15 s | Kingsmere rises to #1, score counts to 90, reasons write in | *Ranked* |
| Write | 15–19 s | Real draft drawer: the email types itself, tabs flick to LinkedIn, then WhatsApp; PECR / CTPS / opt-in ticks | *Written for each one* |
| Call | 19–24 s | Phone card, waveform, transcript: "Hi, I'm an AI assistant calling on behalf of FRANK…" | *It calls. It says it's an AI* |
| Reply | 24–27 s | Reply lands → "Interested → book demo", "Human needed: no" | *It answers* |
| Payoff | 27–31 s | "Trial booked". Pull back: the one ribbon becomes four (UK → ES, BR, US). Pill still 0 | *Humans involved: 0* |
| Claim | 31–34 s | — | *Open a market. Not an *office** |
| End card | 34–38 s | The ribbon draws the FRANK wordmark; event line under it, held 2–3 s | *FRANK Outreach Engine* |

Storylines B ("The wall", a carousel cut on the beat) and C ("The call", one AI phone call heard in
full, needs ElevenLabs voices) are in `STORYLINES.md` if the team prefers them.

## 3. The look (draft spec; turn it into `SPEC.md` when you start)

- **Ground:** #EEF0F4, flat, 2% grain. Never a dark background.
- **Hero material:** one iridescent satin ribbon (cyan #5FD4F0 → violet #8B7CF6 → pink #F2A7D8 →
  warm orange #FF8A4C), as in `refs/flow.png`. It's the only strong colour in the film. Build it as SVG
  or canvas with gradient strokes, or as a Three.js tube (the `hyperframes-registry` has 3D blocks).
- **Type:** Inter 300 for display at 110–130 px, tracking −2%. One word per title in Instrument Serif
  italic (as in pin 1). Body and UI text 28 px or larger. At most 6 words per line, no full stops.
- **UI cards:** real app screens, white, 24 px radius, shadow 0 20 60 rgba(20,30,60,.12), shown at
  1.6–2× real size. Never tilted in 3D, never a made-up dashboard.
- **Motion:** camera moves of 0.4–0.6 s on an expo-out ease. One hero move per shot; secondary
  moves start 4–6 frames later. Titles land and hold still; they don't drift.
- **Sound:** a warm 100–110 BPM electronic bed; a glass tick per station, a keyboard patter under
  Write, a phone ring and the agent's first line under Call, a soft chime on "Trial booked".
- **Banned:** a dark void, glow or bloom, particles, three cards in a row, KPI grids, the logo in a
  corner, everything fading up, typing into a prompt box as the opener.

## 4. Skills to use (Claude Code)

All four are free HyperFrames skills from HeyGen. Install them with:

```bash
npx skills add heygen-com/hyperframes --all
# or: npx hyperframes init frank-launch   (installs the core skills + scaffolds the project)
```

| Skill | Use it for |
|---|---|
| **`/hyperframes`** | the main one. Start here: it reads `references/types/launch.md`, `story.md`, `spec.md` and runs the build → check → snapshot → review loop |
| **`/hyperframes-cli`** | `init`, `preview`, `check --json`, `snapshot --review`, `render` |
| **`/hyperframes-registry`** | ready-made blocks (transitions, kinetic type, 3D, cursor, camera moves). Search here before hand-building anything |
| **`/media-use`** | free music + sound effects, logo fetch, optional ElevenLabs/HeyGen voice for storyline C |

Helpful but optional: `/gsap-timeline` (sequencing), `/animate` and `/emil-design-eng` (motion
polish), `/frontend-design` (type and layout).

## 5. Steps

1. **Freeze the features** with the team. Tick the rows in `SCOPE.md` (6b, 8, 10, 11 are open).
2. **Capture real screens.** Run the app (`cd frank-hackathon && npm start` → http://localhost:3000;
   needs `.env` with an Anthropic key, ask Lukas). Screenshot at 2× of: Ranked leads with the
   Kingsmere drawer open; a finished draft; Campaign autopilot after launch; a voice call mid-transcript;
   Inbox agent with a processed reply.
3. In Claude Code, from this folder, prompt:
   > Use /hyperframes. Build storyline A from README.md and STORYLINES.md as a launch film. Write
   > SPEC.md first from section 3, use the screens in `screens/` as the real UI, refs in `refs/` for
   > the look. Respect the claim rules in SCOPE.md. Open the preview before rendering.
4. Review in the preview (or the HyperFrames desktop app), then `npx hyperframes render`.
5. If it goes on social media: also render a 9:16 cut with burned-in captions.

## 6. Rules for claims

- Use only the facts in `SCOPE.md` → "Source facts". No UK customers, no UK integrations, no real
  send or reply rates (the demo simulates delivery).
- The 56 firms are fictional. Any firm name on screen comes from the demo data.
- Don't show the API key or the `.env` file in any screen capture.

Open questions for the team are in `SCOPE.md` → "Decisions only the team can make".
Contact: Lukas Hager.
