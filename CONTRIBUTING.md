# Contributing to RedTeamForge

RedTeamForge is a self-hosted AI red-teaming lab. Contributions are welcome: new probes, detectors, report formats, and UI in the tactical language.

## Setup

Needs Node.js 22+.

```bash
git clone https://github.com/mh-sudo/redteamforge.git
cd redteamforge
cp .env.example .env
npm install
npm run typecheck
npm run dev
```

Open [http://localhost:8080](http://localhost:8080). Fork and branch from `main`.

## Probes

- Keep payloads in `src/lib/probes/catalog.ts`, not hardcoded in views.
- Every probe needs an OWASP LLM Top 10 tag, a MITRE ATLAS technique ID, and a sandbox expected verdict (`hit` / `partial` / `blocked`).
- Payloads are educational and aimed at the demo policy, not the public internet.

## UI

Square geometry, forge-black deck, one hazard-red accent, IBM Plex Mono + Archivo Black. Reuse `Button`, `Card`, `Input`, `Frame`, `Stamp`, `Badge` from `src/components/` before adding chrome.

## Checks

```bash
npm run typecheck
npm test
npm run lint
```

MIT license on all contributions.

## Security

If you find a vulnerability **in RedTeamForge itself**, do not open a public issue with a working exploit. Contact the maintainers privately.
