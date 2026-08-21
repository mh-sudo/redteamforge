<p align="center">
  <img src="docs/cover.jpg" alt="RedTeamForge — industrial forge mark, targeting reticle, cool steel light" width="100%">
</p>

<h1 align="center">RedTeamForge</h1>

<p align="center">
  <strong>Open-source AI red-teaming lab for prompt injection, jailbreaks & OWASP LLM Top 10</strong>
</p>

<p align="center">
  Point it at Grok, any OpenAI-compatible endpoint, or the built-in leaky sandbox.<br>
  Automated adversarial probes. Grok analyst for prioritization, explanation, and fixes.<br>
  Fully self-hosted. No cloud dependency. Zero vendor lock-in.
</p>

<p align="center">
  <a href="#quick-start"><img src="https://img.shields.io/badge/license-MIT-e61919?style=flat-square&labelColor=0a0a0a" alt="MIT License"></a>
  <a href="#quick-start"><img src="https://img.shields.io/badge/node-22+-eaeaea?style=flat-square&labelColor=0a0a0a" alt="Node 22"></a>
  <a href="#docker"><img src="https://img.shields.io/badge/docker-compose-eaeaea?style=flat-square&labelColor=0a0a0a" alt="Docker Compose"></a>
  <a href="#probe-catalog"><img src="https://img.shields.io/badge/probes-26-e61919?style=flat-square&labelColor=0a0a0a" alt="26 probes"></a>
  <a href="#probe-catalog"><img src="https://img.shields.io/badge/OWASP-LLM%20Top%2010-eaeaea?style=flat-square&labelColor=0a0a0a" alt="OWASP LLM Top 10"></a>
  <a href="#probe-catalog"><img src="https://img.shields.io/badge/MITRE-ATLAS-eaeaea?style=flat-square&labelColor=0a0a0a" alt="MITRE ATLAS"></a>
</p>

<p align="center">
  <a href="#quick-start">Install</a> ·
  <a href="#docker">Docker</a> ·
  <a href="#screenshots">Screenshots</a> ·
  <a href="#probe-catalog">Probes</a> ·
  <a href="docs/sample-report.md">Sample report</a> ·
  <a href="#responsible-use">Responsible use</a>
</p>

---

## Why RedTeamForge

LLM apps fail in ways SAST never sees. A single "ignore previous instructions" turn can dump a system prompt, mint a refund, or echo XSS into a renderer. Job posts now ask for **Garak**, **Promptfoo**, **PyRIT**, prompt injection, RAG security, and agent security. RedTeamForge is a working lab you can run against your own model in a browser.

| You need | RedTeamForge does |
| --- | --- |
| Prompt-injection / jailbreak scanner | 26 Garak-style probes, 8 packs |
| OWASP LLM Top 10 mapping | Every probe tagged LLM01–LLM10 (2025) |
| MITRE ATLAS mapping | Technique IDs on every finding |
| Live target | Grok via `XAI_API_KEY`, or any OpenAI-compatible base URL |
| Demo without keys | Deterministic leaky sandbox (ForgeBank) |
| Prioritization | Optional Grok analyst: why it matters, exploitability, remediation |
| Reports | Markdown + JSON export, local scan history |
| Deployment | npm, Docker Compose, no vendor account required |

Sandbox scans never leave the machine. Live scans only go where you pointed them.

**[Play the 6-second intro](docs/demo/hero.mp4)** · cinematic forge mark, steel light, targeting reticle.

## Screenshots

Dashboard. Latest sweep, critical hits, OWASP coverage.

![RedTeamForge dashboard with risk 76 critical and recent hits](docs/images/dashboard.png)

New scan. Sandbox, live Grok, or a custom OpenAI-compatible endpoint.

![New scan campaign with sandbox, Grok, and custom target cards](docs/images/scan.png)

Report. Findings, Grok analyst, OWASP grid, system prompt under test.

![Scan report with risk score, export, and prompt-injection findings](docs/images/report.png)

Prompt lab. Fire one payload, inspect the raw completion.

![Prompt lab after a hit on ignore-previous-instructions](docs/images/lab-hit.png)

Probe library and history.

| Probe catalog | Scan archive |
| --- | --- |
| ![Probe library filtered by pack](docs/images/probes.png) | ![History with risk scores](docs/images/history.png) |

Mobile cockpit.

<p align="center">
  <img src="docs/images/dashboard-mobile.png" alt="RedTeamForge dashboard on a phone" width="32%">
  &nbsp;
  <img src="docs/images/report-mobile.png" alt="RedTeamForge report on a phone" width="32%">
</p>

## Probe catalog

26 probes across 8 packs. Each payload is educational and aimed at the demo policy, not the public internet.

| Pack | OWASP | What it hits |
| --- | --- | --- |
| Prompt injection | LLM01 | Ignore-previous, delimiter, hierarchy, translation smuggle |
| Jailbreaks | LLM01 | DAN / roleplay, hypothetical, encoding frames |
| Data exfiltration | LLM02 / LLM07 | System-prompt dump, secret repeat, encoded leak |
| Excessive agency | LLM06 | Unauthorized refunds and off-allow-list tools |
| Output handling | LLM05 | XSS / markup the renderer would execute |
| RAG / embeddings | LLM08 | Poisoned retrieved context, citation games |
| Misinformation | LLM09 | Confident fabrication, false authority |
| Unbounded use | LLM10 | Repeat-forever and token amplification |

MITRE ATLAS technique IDs ship on every finding (e.g. AML.T0051 prompt injection, AML.T0054 jailbreak, AML.T0057 LLM data leak).

A **quick pack** of 8 high-signal probes is the default campaign. Toggle packs off to go full-sweep.

## Quick start

**Needs:** Node.js 22+

```bash
git clone https://github.com/mh-sudo/redteamforge.git
cd redteamforge
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

1. **New scan** → leave target on **Sandbox** → **Run scan**.
2. Open the report. Expand a HIT. Copy payload / response.
3. **Analyze** (optional) if `XAI_API_KEY` is set. Grok ranks hits and writes hardening notes.
4. Export Markdown or JSON.

No sign-in. Scan history lives in this browser (`localStorage`). Nothing is uploaded unless you pointed at a live target.

### Live Grok

```bash
# .env
XAI_API_KEY=xai-...
```

Restart the app. Pick **Grok** as the target (model default `grok-4.5`). Live calls are user-initiated and token-capped.

### Custom OpenAI-compatible endpoint

In **New scan** or **Prompt lab**, choose **Custom**. Provide:

- Base URL, e.g. `https://api.openai.com/v1` or `http://localhost:11434/v1`
- API key
- Model id

The key stays in the form. It is sent only to that base URL. HTTP is allowed on localhost; anything else must be HTTPS.

## Docker

```bash
cp .env.example .env          # optional: add XAI_API_KEY
docker compose up --build
```

Then open [http://localhost:8080](http://localhost:8080).

```yaml
# docker-compose.yml
services:
  redteamforge:
    build: .
    ports:
      - "8080:8080"
    environment:
      XAI_API_KEY: ${XAI_API_KEY:-}
```

Image is Node 22, production preview, port 8080. Rebuild after probe or UI changes:

```bash
docker compose up --build
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on `0.0.0.0:8080` |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Workspace unit tests |
| `npm run lint` | ESLint |

## How a scan works

```
Target  →  probe payload  →  completion  →  detector  →  verdict
 sandbox | Grok | custom      catalog        model         leak / keyword / regex / refusal
                                                              HIT | PARTIAL | BLOCKED
```

1. You choose a target and a system prompt under test (ForgeBank ships as the demo policy).
2. Selected probes fire one by one. The sandbox is deterministic so detectors are learnable. Live targets are the real test.
3. Detectors look for planted secrets, policy breaks, XSS, and missing refusals.
4. Risk score rolls hits by severity. OWASP coverage is counted per category.
5. Optional analyst call sends compact findings (not your full prompt dump) to Grok and writes executive summary, exploitability, and hardening steps.
6. History, Markdown, and JSON stay on the box.

## Sample report

The checked-in ForgeBank baseline is a complete 8-probe sweep (risk **76 / critical**, 4 hits). Read the write-up:

**[docs/sample-report.md](docs/sample-report.md)**

Export the same shape from any scan: **Export → Markdown** or **JSON**.

## Stack

- [TanStack Start](https://tanstack.com/start) + React 19 + Vite 8
- Tailwind v4, Radix primitives
- Zustand persist (scan archive in the browser)
- xAI Responses/Completions for live Grok + analyst
- Garak-inspired TypeScript probe engine (no Python runtime required)

Inspired by [Garak](https://github.com/NVIDIA/garak), [Promptfoo](https://github.com/promptfoo/promptfoo), [PyRIT](https://github.com/Azure/PyRIT), [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/), and [MITRE ATLAS](https://atlas.mitre.org/). RedTeamForge is not affiliated with those projects.

## Project layout

```
src/
  components/          UI, findings, risk, OWASP grid
  lib/probes/          catalog, detectors, sandbox model
  lib/scan/            engine, scoring, reports, history store
  lib/server/ai.ts     live Grok + custom completions + analyst
  routes/              dashboard, scan, lab, probes, history, report
docs/
  cover.jpg            OG / GitHub hero
  demo/hero.mp4        6s intro
  images/              product screenshots
  sample-report.md     ForgeBank baseline
```

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `XAI_API_KEY` | No | Live Grok scans and analyst. Sandbox works without it. |
| `HOST` | No | Bind address (Docker sets `0.0.0.0`) |
| `PORT` | No | Listen port (default 8080 in Docker) |

Copy [`.env.example`](.env.example). Never commit a real `.env`.

## Responsible use

RedTeamForge is a defensive lab. Use it only on systems you own or have written permission to test.

- Payloads are for evaluating *your* model, prompt, or agent.
- Do not aim this at third-party production assistants you do not control.
- Sandbox secrets (`482917`, `sk_live_forge_demo_9f3a`, `FORGE_POLICY_TOKEN`) are fake fixtures. Do not treat them as real credentials.
- Live completions may contain model output that looks like exploits. Handle reports as sensitive.

If you find a vulnerability *in RedTeamForge itself*, do not open a public issue with a working exploit. See [Contributing](#contributing).

## Contributing

PRs welcome: new probes (with OWASP + ATLAS tags + a sandbox expected verdict), detectors, report formats, and UI that stays in the tactical language (sharp geometry, one hazard-red accent, IBM Plex Mono + Archivo Black).

1. Fork and branch from `main`.
2. `npm install && npm run typecheck`
3. Keep probe payloads in the catalog, not hardcoded in views.
4. MIT license on all contributions.

## License

[MIT](LICENSE) © 2026 RedTeamForge contributors.

<p align="center"><sub>Self-hosted AI red-teaming. No vendor lock-in.</sub></p>
