# Agent instructions

## Design authority

`DESIGN.md` is mandatory for every UI change.

- New pages, redesigns, tweaks, components, empty states, settings, and menubar work must follow `DESIGN.md`.
- Do not invent a parallel visual language. Do not “improve” it toward generic SaaS, Inter, rounded corners, glow, or a second accent.
- If a request conflicts with `DESIGN.md`, follow `DESIGN.md` and say so.
- Tokens live in `src/styles.css` (`@theme`). Keep them in sync with `DESIGN.md`. Do not add radius, a light theme, or a third font.
- Reuse `Button`, `Card`, `Input`, `Frame`, `Stamp`, `Badge` from `src/components/` before creating new chrome.

After any visual change, the result must still look like **The Targeting Reticle**: square geometry, forge-black deck, one hazard-red accent, IBM Plex Mono + Archivo Black.
