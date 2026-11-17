# FRANK × Nova SBE hackathon

Zero-human outreach engine: UK broker clusters, ranking, multichannel AI drafts, voice agent, inbox agent.

Run: `npm install`, copy `.env.example` to `.env`, set `ANTHROPIC_API_KEY` and a long random `DEMO_PASSCODE`, then `npm start` and open http://localhost:3000. Enter the passcode when prompted.

Never commit `.env`.

Every API route requires the passcode, including state, outreach data, contract reads and signing, and speech generation. Without `DEMO_PASSCODE`, the API returns 503 and performs no work. Set it in the hosting provider's server environment for hosted deployments; never put it in frontend files or URLs. The signing page is part of the protected team demo and requires the same passcode.

`outreach/prospects.json` currently contains published business contact addresses with source URLs and no reply threads or signed agreements. Do not commit the file after using it with private replies or signatures. The lead dataset is fictional demo data. A public repository also exposes its Git history, so deleting a leaked credential from the latest version would still require revoking that credential.

## Outreach desk and closing cycle

Two more screens, **Outreach** and **Close**, run the basic loop on real firms and take a reply to a signed trial agreement.

| Part | What it is |
|---|---|
| `outreach/prospects.json` | The whole database: one record per firm (website, email, where the email was printed, why the firm was picked, subject, body, `sent`). |
| `outreach/find.py` | Fetches a firm's own contact pages and picks out the addresses in the HTML. It never builds an address from a name pattern and stores the source URL of each one. Claude Code does the web search and writes the records. |
| `outreach/send.py` | Sends every record with `sent: false`, one a minute, plain text only, then flips the flag. |
| `outreach/sink.py` | Local demo mailbox. By default the sender talks SMTP to it, so nothing is delivered to anyone. |
| `cycle/` | The reply cycle on [Sellbird](https://github.com/ethanplusai/sellbird): `bridge.py` hands each reply to Sellbird's handler (opt-out rules, intent, deal stage, drafted answer). FRANK's facts are in `product_knowledge.md` and `sellbird.local.yaml`. |
| `public/sign.html` | The one-page trial agreement the firm signs. |
| `blender/contract_scene.py` | Builds and renders the 3D contract image (`public/assets/contract-3d.png`) in the look of `launch-video/refs`. |

Set up the reply cycle once (needs Python 3.11+ and the Claude Code CLI signed in; Sellbird thinks through your Claude plan, no API key):

```bash
bash cycle/setup.sh
```

Then `npm start`, open the **Outreach** tile, send, and answer as the broker on the **Close** tile. These two screens need the local server: a hosted function cannot start the Python sender or Sellbird.

Sending for real: `python3 outreach/send.py --live` uses the SMTP settings in `.env` and redirects every email to `TEST_RECIPIENT`. Only `--live --to-prospects` emails the firms; check the consent rules for the market (PECR in the UK) and set SPF and DKIM first.

Re-render the contract: `/Applications/Blender.app/Contents/MacOS/Blender -b -P blender/contract_scene.py -- public/assets/contract-3d.png`

Licence note: Sellbird is AGPL-3.0. It is installed next to this repo by `cycle/setup.sh` and none of its code is copied in, but `cycle/bridge.py` imports it, so treat `cycle/` as AGPL-bound if this is ever distributed or hosted for others.
