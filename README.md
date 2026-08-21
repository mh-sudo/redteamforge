<p align="center">
  <img src="docs/cover.jpg" alt="RedTeamForge — industrial forge mark, targeting reticle, cool steel light" width="100%">
</p>

<h1 align="center">RedTeamForge</h1>

<p align="center">
  <strong>RedTeamForge is a self-hosted AI red-teaming lab that scans LLM apps for prompt injection, jailbreaks, and OWASP LLM Top 10 — in the browser, with BYOK live targets and a leaky sandbox.</strong>
</p>

<p align="center">
  Point it at OpenAI, Anthropic, Gemini, Grok, Ollama, or any OpenAI-compatible endpoint.<br>
  Automated adversarial probes. Optional analyst for prioritization, explanation, and fixes.<br>
  Fully self-hosted. No cloud dependency. Zero vendor lock-in.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-e61919?style=flat-square&labelColor=0a0a0a" alt="MIT License"></a>
  <a href="#quick-start"><img src="https://img.shields.io/badge/node-22+-eaeaea?style=flat-square&labelColor=0a0a0a" alt="Node 22"></a>
  <a href="#docker"><img src="https://img.shields.io/badge/docker-compose-eaeaea?style=flat-square&labelColor=0a0a0a" alt="Docker Compose"></a>
  <a href="#probe-catalog"><img src="https://img.shields.io/badge/probes-26-e61919?style=flat-square&labelColor=0a0a0a" alt="26 probes"></a>
  <a href="#probe-catalog"><img src="https://img.shields.io/badge/OWASP-LLM%20Top%2010-eaeaea?style=flat-square&labelColor=0a0a0a" alt="OWASP LLM Top 10"></a>
  <a href="#probe-catalog"><img src="https://img.shields.io/badge/MITRE-ATLAS-eaeaea?style=flat-square&labelColor=0a0a0a" alt="MITRE ATLAS"></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#screenshots">Screenshots</a> ·
  <a href="#probe-catalog">Probes</a> ·
  <a href="#faq">FAQ</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

![RedTeamForge dashboard with risk 76 critical and recent hits](docs/images/dashboard.png)

**[Play the 6-second intro](docs/demo/hero.mp4)** · cinematic forge mark, steel light, targeting reticle.

## What is RedTeamForge?

RedTeamForge is an open-source, self-hosted AI red-teaming lab for people who ship LLM apps and need to test prompt injection, jailbreaks, data exfiltration, and OWASP LLM Top 10 — without a vendor account or a Python scanner toolchain. It runs in the browser: 26 Garak-style probes fire at a leaky sandbox or at a BYOK live model (OpenAI, Anthropic, Gemini, Grok, Ollama, and OpenAI-compatible endpoints), then detectors score HIT / PARTIAL / BLOCKED and map every finding to OWASP and MITRE ATLAS.

Unlike wiring up Garak, Promptfoo, or PyRIT from scratch, RedTeamForge is a working lab you open at `localhost:8080`, run against your own system prompt, and export as Markdown or JSON.

## Why RedTeamForge?

LLM apps fail in ways SAST never sees. A single "ignore previous instructions" turn can dump a system prompt, mint a refund, or echo XSS into a renderer. Job posts now ask for Garak, Promptfoo, PyRIT, prompt injection, RAG security, and agent security. RedTeamForge is the lab you can run against your own model in a browser.

| You need                             | RedTeamForge does                                              |
| ------------------------------------ | -------------------------------------------------------------- |
| Prompt-injection / jailbreak scanner | 26 Garak-style probes, 8 packs                                 |
| OWASP LLM Top 10 mapping             | Every probe tagged LLM01–LLM10 (2025)                          |
| MITRE ATLAS mapping                  | Technique IDs on every finding                                 |
| Live target                          | BYOK presets (OpenAI, Anthropic, Gemini, xAI, Groq, Ollama, …) |
| Demo without keys                    | Deterministic leaky sandbox (ForgeBank)                        |
| Prioritization                       | Optional analyst: why it matters, exploitability, remediation  |
| Reports                              | Markdown + JSON export, local scan history                     |
| Deployment                           | npm, Docker Compose, no vendor account required                |

Sandbox scans never leave the machine. Live scans only go where you pointed them.

### RedTeamForge vs Garak vs Promptfoo vs PyRIT

|                  | RedTeamForge                                                          | [Garak](https://github.com/NVIDIA/garak) | [Promptfoo](https://github.com/promptfoo/promptfoo) | [PyRIT](https://github.com/Azure/PyRIT) |
| ---------------- | --------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| Runtime          | TypeScript (Node 22), no Python                                       | Python CLI                               | Node                                                | Python                                  |
| Interface        | Browser lab                                                           | CLI                                      | CLI + web evals                                     | Python APIs / notebooks                 |
| Demo target      | Built-in leaky sandbox (ForgeBank)                                    | Bring your own                           | Bring your own                                      | Bring your own                          |
| Live providers   | BYOK: OpenAI, Anthropic, Gemini, xAI, Groq, Ollama, OpenAI-compatible | Yes                                      | Yes                                                 | Yes                                     |
| Finding tags     | OWASP LLM Top 10 + MITRE ATLAS on every probe                         | Probe taxonomies                         | Eval / red-team plugins                             | Attack strategies                       |
| Reports          | In-app + Markdown/JSON, optional analyst                              | CLI reports                              | Eval reports                                        | Custom / notebooks                      |
| Account required | None                                                                  | None                                     | None (cloud optional)                               | None                                    |

RedTeamForge is not affiliated with Garak, Promptfoo, PyRIT, OWASP, or MITRE.

## Features

- **26 Garak-style probes, 8 packs** — prompt injection, jailbreaks, exfiltration, excessive agency, output handling, RAG, misinformation, unbounded use
- **OWASP LLM Top 10 (2025) + MITRE ATLAS** — every finding ships with category and technique IDs (e.g. AML.T0051, AML.T0054, AML.T0057)
- **Leaky sandbox (ForgeBank)** — deterministic demo target so you can scan with no API keys
- **BYOK live targets** — OpenAI, Anthropic, Gemini, xAI, Groq, Mistral, DeepSeek, Together, Fireworks, OpenRouter, Ollama, or a custom OpenAI-compatible endpoint
- **Optional analyst** — ranks hits, explains exploitability, writes hardening notes
- **Prompt lab** — fire one payload, inspect the raw completion
- **Markdown + JSON export** — scan history stays in this browser (`localStorage`)
- **Self-hosted** — `npm run dev` or Docker Compose; keys stay in the browser vault

## Quick Start

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
3. **Analyze** (optional) after connecting a provider in **Settings**. The analyst ranks hits and writes hardening notes.
4. Export Markdown or JSON.

No sign-in. Scan history lives in this browser (`localStorage`). Provider keys stay in this browser and are sent only with the scan you run.

### Live providers

Open **Settings**, pick a preset (OpenAI, Anthropic, Gemini, xAI, Groq, Mistral, DeepSeek, Together, Fireworks, OpenRouter, Ollama, or Custom), paste your key. Scan and Lab then list only connected providers. Keys are not uploaded except as the `Authorization` / `x-api-key` header to that provider.

Ollama and Custom need a base URL. HTTP is allowed on localhost; anything else must be HTTPS. Live calls are user-initiated and token-capped.

## Docker

```bash
docker compose up --build
```

Then open [http://localhost:8080](http://localhost:8080). Connect providers in **Settings** (browser vault). No server-side API keys.

Image is Node 22, production preview, port 8080. Rebuild after probe or UI changes:

```bash
docker compose up --build
```

## Screenshots

New scan. Sandbox or a connected live provider.

![New scan campaign with sandbox, Grok, and custom target cards](docs/images/scan.png)

Report. Findings, analyst, OWASP grid, system prompt under test.

![Scan report with risk score, export, and prompt-injection findings](docs/images/report.png)

Prompt lab. Fire one payload, inspect the raw completion.

![Prompt lab after a hit on ignore-previous-instructions](docs/images/lab-hit.png)

Probe library and history.

| Probe catalog                                             | Scan archive                                         |
| --------------------------------------------------------- | ---------------------------------------------------- |
| ![Probe library filtered by pack](docs/images/probes.png) | ![History with risk scores](docs/images/history.png) |

Mobile cockpit.

<p align="center">
  <img src="docs/images/dashboard-mobile.png" alt="RedTeamForge dashboard on a phone" width="32%">
  &nbsp;
  <img src="docs/images/report-mobile.png" alt="RedTeamForge report on a phone" width="32%">
</p>

## Probe catalog

RedTeamForge ships 26 probes across 8 packs. Each payload is educational and aimed at the demo policy, not the public internet.

| Pack              | OWASP         | What it hits                                               |
| ----------------- | ------------- | ---------------------------------------------------------- |
| Prompt injection  | LLM01         | Ignore-previous, delimiter, hierarchy, translation smuggle |
| Jailbreaks        | LLM01         | DAN / roleplay, hypothetical, encoding frames              |
| Data exfiltration | LLM02 / LLM07 | System-prompt dump, secret repeat, encoded leak            |
| Excessive agency  | LLM06         | Unauthorized refunds and off-allow-list tools              |
| Output handling   | LLM05         | XSS / markup the renderer would execute                    |
| RAG / embeddings  | LLM08         | Poisoned retrieved context, citation games                 |
| Misinformation    | LLM09         | Confident fabrication, false authority                     |
| Unbounded use     | LLM10         | Repeat-forever and token amplification                     |

MITRE ATLAS technique IDs ship on every finding (e.g. AML.T0051 prompt injection, AML.T0054 jailbreak, AML.T0057 LLM data leak).

A **quick pack** of 8 high-signal probes is the default campaign. Toggle packs off to go full-sweep.

## Scripts

| Command             | What it does                 |
| ------------------- | ---------------------------- |
| `npm run dev`       | Dev server on `0.0.0.0:8080` |
| `npm run build`     | Production build             |
| `npm run preview`   | Serve the production build   |
| `npm run typecheck` | `tsc --noEmit`               |
| `npm test`          | Workspace unit tests         |
| `npm run lint`      | ESLint                       |

## How a scan works

```
Target  →  probe payload  →  completion  →  detector  →  verdict
 sandbox | live provider     catalog        model         leak / keyword / regex / refusal
                                                              HIT | PARTIAL | BLOCKED
```

1. You choose a target and a system prompt under test (ForgeBank ships as the demo policy).
2. Selected probes fire one by one. The sandbox is deterministic so detectors are learnable. Live targets are the real test.
3. Detectors look for planted secrets, policy breaks, XSS, and missing refusals.
4. Risk score rolls hits by severity. OWASP coverage is counted per category.
5. Optional analyst call sends compact findings (not your full prompt dump) to a connected model and writes executive summary, exploitability, and hardening steps.
6. History, Markdown, and JSON stay on the box.

## Sample report

The checked-in ForgeBank baseline is a complete 8-probe sweep (risk **76 / critical**, 4 hits). Read the write-up:

**[docs/sample-report.md](docs/sample-report.md)**

Export the same shape from any scan: **Export → Markdown** or **JSON**.

## Stack

- [TanStack Start](https://tanstack.com/start) + React 19 + Vite 8
- Tailwind v4, Radix primitives
- Zustand persist (scan archive in the browser)
- BYOK live completions (OpenAI-compatible + Anthropic Messages) + optional analyst
- Garak-inspired TypeScript probe engine (no Python runtime required)

Inspired by [Garak](https://github.com/NVIDIA/garak), [Promptfoo](https://github.com/promptfoo/promptfoo), [PyRIT](https://github.com/Azure/PyRIT), [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/), and [MITRE ATLAS](https://atlas.mitre.org/). RedTeamForge is not affiliated with those projects.

## Project layout

```
src/
  components/          UI, findings, risk, OWASP grid
  lib/probes/          catalog, detectors, sandbox model
  lib/scan/            engine, scoring, reports, history store
  lib/providers/       presets + browser key vault
  lib/server/ai.ts     live completions + analyst
  lib/server/auth.ts   optional AUTH_PASSWORD gate
  routes/              dashboard, scan, lab, probes, history, report, settings, login
docs/
  cover.jpg            OG / GitHub hero
  demo/hero.mp4        6s intro
  images/              product screenshots
  sample-report.md     ForgeBank baseline
```

## Configuration

| Variable        | Required | Purpose                                                               |
| --------------- | -------- | --------------------------------------------------------------------- |
| `HOST`          | No       | Bind address (Docker sets `0.0.0.0`)                                  |
| `PORT`          | No       | Listen port (default 8080 in Docker)                                  |
| `AUTH_PASSWORD` | No       | Shared page password. Unset = open. Set on a VPS to require `/login`. |

Copy [`.env.example`](.env.example). Never commit a real `.env`.

## FAQ

**How do I password-protect a VPS deploy?**
Set `AUTH_PASSWORD` in the environment (or Docker Compose). The UI redirects to `/login` until that password is entered. Unset it for an open local lab. Put HTTPS in front of the instance.

**Does RedTeamForge work without an API key?**
Yes. RedTeamForge includes a deterministic leaky sandbox (ForgeBank). Leave the target on Sandbox, run a scan, and you get hits, detectors, and a report with no provider key.

**How is RedTeamForge different from Garak, Promptfoo, or PyRIT?**
RedTeamForge is a TypeScript browser lab with a built-in sandbox, OWASP LLM Top 10 + MITRE ATLAS tags on every probe, and optional in-app analyst reports. Garak is a Python CLI scanner, Promptfoo is a Node eval/red-team runner, and PyRIT is a Python research toolkit. Use RedTeamForge when you want a self-hosted UI you can point at your own model without a Python toolchain.

**Does RedTeamForge send my prompts to the cloud?**
Sandbox scans never leave the machine. Live scans send completions only to the provider you selected in Settings. API keys stay in the browser vault and are sent only as that provider's `Authorization` / `x-api-key` header.

**Can I scan OpenAI, Anthropic, Gemini, Grok, and Ollama?**
Yes. RedTeamForge is a BYOK scanner: connect OpenAI, Anthropic, Gemini, xAI (Grok), Groq, Mistral, DeepSeek, Together, Fireworks, OpenRouter, Ollama, or any OpenAI-compatible endpoint, then run the same probe catalog against that live target.

**Does RedTeamForge run on macOS, Windows, and Linux?**
Yes. RedTeamForge needs Node.js 22+ or Docker. That includes Apple Silicon. Open [http://localhost:8080](http://localhost:8080) after `npm run dev` or `docker compose up --build`.

**Is RedTeamForge free? What's the license?**
RedTeamForge is free and open source under the [MIT License](LICENSE). You can use it commercially. No vendor account is required.

**Is RedTeamForge affiliated with Garak, Promptfoo, or OWASP?**
No. RedTeamForge is an independent project inspired by those tools and taxonomies. It is not affiliated with NVIDIA Garak, Promptfoo, Microsoft PyRIT, OWASP, or MITRE.

## Responsible use

RedTeamForge is a defensive lab. Use it only on systems you own or have written permission to test.

- Payloads are for evaluating _your_ model, prompt, or agent.
- Do not aim this at third-party production assistants you do not control.
- Sandbox secrets (`482917`, `sk_live_forge_demo_9f3a`, `FORGE_POLICY_TOKEN`) are fake fixtures. Do not treat them as real credentials.
- Live completions may contain model output that looks like exploits. Handle reports as sensitive.

If you find a vulnerability _in RedTeamForge itself_, do not open a public issue with a working exploit. See [Contributing](#contributing).

## Contributing

PRs welcome: new probes (with OWASP + ATLAS tags + a sandbox expected verdict), detectors, report formats, and UI that stays in the tactical language (sharp geometry, one hazard-red accent, IBM Plex Mono + Archivo Black).

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and probe rules.

## License

RedTeamForge is licensed under the [MIT License](LICENSE) © 2026 RedTeamForge contributors.

<p align="center"><sub>Self-hosted AI red-teaming. No vendor lock-in.</sub></p>
