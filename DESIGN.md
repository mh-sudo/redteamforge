---
name: RedTeamForge
description: Tactical dark lab — sharp geometry, one hazard-red accent, IBM Plex Mono + Archivo Black.
colors:
  bg: "#0a0a0a"
  surface: "#111111"
  elevated: "#171717"
  fg: "#eaeaea"
  muted: "#a3a3a3"
  subtle: "#737373"
  border: "rgb(234 234 234 / 14%)"
  border-strong: "rgb(234 234 234 / 22%)"
  accent: "#e61919"
  accent-fg: "#fafafa"
  critical: "#e61919"
  high: "#d4a017"
  medium: "#c8c8c8"
  low: "#4af626"
  ring: "#eaeaea"
  selection: "rgb(230 25 25 / 35%)"
typography:
  display:
    fontFamily: "Archivo Black, Arial Black, Impact, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo Black, Arial Black, Impact, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "IBM Plex Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.14em"
  body:
    fontFamily: "IBM Plex Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.12em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "32px"
  control: "44px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.bg}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "rgb(234 234 234 / 90%)"
    textColor: "{colors.bg}"
  button-secondary:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.fg}"
    rounded: "{rounded.none}"
    height: "44px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.none}"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.none}"
    height: "44px"
  button-destructive:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    rounded: "{rounded.none}"
    height: "44px"
  input:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.fg}"
    rounded: "{rounded.none}"
    height: "44px"
    padding: "8px 12px"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.none}"
    padding: "20px"
---

# Design System: RedTeamForge

## Overview

**Creative North Star: "The Targeting Reticle"**

RedTeamForge looks like a weapons-lab terminal, not a SaaS dashboard. The screen is a dark steel deck. Type is mono except when a page title hits like a stencil. Corners are square. The only color that shouts is hazard red — and it shouts rarely, like a reticle, not a brand wash.

Personality is tactical, dense, and dry. Density is cockpit-level without becoming noise: hairline borders, uppercase stamps, tabular numbers. Atmosphere comes from a faint scanline and film grain over the whole viewport, not from glow, glass, or illustration.

This is a committed dark product. There is no light theme. There is no second accent. There is no rounded corner.

**Key Characteristics:**

- Zero radius on every control, card, badge, and sheet
- One accent (`#e61919`) used as a targeting mark, never as a fill for large regions
- Archivo Black for page titles only; IBM Plex Mono for everything else
- Depth by fill step (`bg` → `surface` → `elevated`), never by drop shadow
- 44px minimum control height
- Scanline + grain overlay, disabled under `prefers-reduced-motion`

## Colors

A near-black deck, cool steel type, and a single hazard-red voice. Status colors (amber, phosphor green, pale steel) are for verdicts only.

### Primary

- **Hazard Red** (`{colors.accent}`): Active nav, hit badges, destructive actions, reticle corner ticks, text selection. Occupies a small fraction of any screen. Rarity is the signal.

### Neutral

- **Forge Black** (`{colors.bg}`): Page canvas and sticky header.
- **Deck** (`{colors.surface}`): Cards, frames, default panels.
- **Raised Deck** (`{colors.elevated}`): Inputs, nested rows, secondary buttons, hover wells.
- **Steel** (`{colors.fg}`): Primary text and the primary button fill.
- **Muted Steel** (`{colors.muted}`): Body supporting copy.
- **Quiet Steel** (`{colors.subtle}`): Stamps, timestamps, placeholders, queued states.
- **Hairline** (`{colors.border}`): Default 1px edges.
- **Hairline Strong** (`{colors.border-strong}`): Hover edges on selectable tiles.

### Status (verdicts and severity only)

- **Critical / Hit** — Hazard Red (`{colors.critical}`)
- **High / Partial** — Amber (`{colors.high}`)
- **Medium** — Pale steel (`{colors.medium}`)
- **Low / Blocked** — Phosphor green (`{colors.low}`)

**The One Hazard Rule.** Hazard red is a reticle, not a theme. No red page backgrounds, no red hero washes, no red-to-orange gradients. If a screen needs color besides steel and red, it is a verdict badge.

**The Dark Deck Rule.** The product is dark-only. Do not add a light theme, cream paper, or inverted marketing sections inside the app.

## Typography

**Display Font:** Archivo Black (Arial Black, Impact)
**Body / Label / Mono Font:** IBM Plex Mono (ui-monospace, SF Mono, Menlo, Consolas)

**Character:** Stencil titles, terminal body. The pairing is industrial, not editorial. No serif. No humanist sans.

### Hierarchy

- **Display** (Archivo Black, ~36–60px, line-height 0.9, tracking tight, uppercase): Page H1 only (`New scan`, `Prompt lab`, `Red-team your LLM`).
- **Headline** (Archivo Black, ~24–30px, uppercase): Report titles and empty-state headings.
- **Title / Stamp** (IBM Plex Mono, 12px, weight 500, tracking 0.14–0.18em, uppercase): Card titles, nav, section stamps.
- **Body** (IBM Plex Mono, 14px, line-height 1.5): Paragraphs, findings, form help. Keep measure short (`max-w-2xl` / ~65ch on marketing-like intro copy).
- **Label** (IBM Plex Mono, 12px, tracking 0.12em, uppercase, muted): Form labels.
- **Numeric** (IBM Plex Mono, tabular): Scores, percents, latency. Always `tabular-nums` on live figures.

**The Two-Voice Rule.** Archivo Black is for H1/H2 stencils. Everything else is IBM Plex Mono. Do not introduce a third family (Inter, Geist, Geist Mono, Satoshi, or a display serif).

**The Stamp Case Rule.** Nav, card titles, badges, and labels are uppercase with wide tracking. Sentence case is for body copy and findings only.

## Layout

App shell: sticky 64px header, hairline bottom border, content column `max-w-6xl` centered, page padding 16px (mobile) / 32px (desktop), bottom padding 128px so the last control clears the fold.

Vertical rhythm: 24px between page header and first block (`space-y-6`), 16px between stacked cards (`space-y-4`). Card internal padding is 20px.

Grids are 1px gap on a border-colored field (`gap-px bg-border`) so adjacent panels share a hairline — used on the dashboard stat strip and latest-sweep. Standard forms use 8–16px gaps, not the 1px “welded deck.”

Responsive: single column by default; split `lg:grid-cols-[1.4fr_1fr]` on New Scan; dashboard header becomes two columns at `lg`. Controls never shrink below 44px. Nav links hide below `md` into a left sheet.

**The 44px Floor.** Buttons, inputs, nav items, and icon buttons are at least 44×44 (`h-11` / `size-11`). Do not ship 32px or 36px controls.

## Elevation & Depth

No drop shadows. Depth is three flat fills plus a 1px hairline. A hover may strengthen the hairline (`shadow-border-hover` = 1px hazard-red at 55% opacity) — that is an edge, not a shadow.

Scanline (`body::before`, opacity 0.045) and grain (`body::after`, opacity 0.05) sit above the UI at z-40/41, `pointer-events: none`. They are atmosphere, not chrome. Kill both under `prefers-reduced-motion`.

Motion is a single entrance: `rise` — 10px up, 0.55–0.7s, `cubic-bezier(0.22, 1, 0.36, 1)`, staggered +80ms. Buttons use the same ease at 200ms and `active:scale-[0.98]`. No bounce, no parallax, no infinite loops.

**The Flat Deck Rule.** If you need hierarchy, step the fill (`bg` / `surface` / `elevated`) or the border. Do not add `box-shadow` blurs, glass, or gradient meshes.

## Shapes

Every corner is square (`border-radius: 0` on the whole radius scale). Cards, buttons, inputs, badges, sheets, progress bars, and the brand mark are rectangles.

Borders are 1px `{colors.border}`. Selected target tiles and active states use `{colors.accent}` as the border, not a glow.

The signature silhouette is the **reticle frame**: four 10px hazard-red corner ticks on a `Frame` with `mark`. Use it on live/status surfaces (scan progress, latest sweep). Do not put ticks on every card.

**The Zero Radius Rule.** `rounded-none` is not a preference. Adding `rounded-md` or pills breaks the system. Exception: none.

## Components

### Buttons

- **Shape:** Square. Height 44px (56px `lg`). Uppercase, wide tracking, 14px.
- **Primary:** Steel fill (`bg-fg text-bg`). Hover 90% steel. This is the default action (Run scan, New scan).
- **Secondary:** Raised deck + hairline.
- **Outline:** Transparent, hairline; hover raises fill and strengthens border.
- **Ghost:** Text only; hover raised deck. Used for Reset, back links.
- **Destructive:** Hazard red fill, white type. Rare.
- **Focus:** 2px steel ring (`ring-fg`).
- **Active:** Scale 0.98.

### Cards / Containers

- Square, 1px hairline, `{colors.surface}`, 20px padding.
- Titles are stamps (mono, 12px, uppercase, tracking 0.14em), not display type.
- Nested rows (pack pickers) sit on `{colors.elevated}` with 12px horizontal padding.

### Inputs / Fields

- Square, 44px, `{colors.elevated}`, hairline, mono 14px.
- Placeholder `{colors.subtle}`. Focus: 2px steel ring at 50%.
- Labels sit above, stamp style, muted.
- Password keys: `type="password"`, `autoComplete="off"`.

### Badges

- Square, 1px border, mono 12px, uppercase, tracking wider, `px-2 py-0.5`.
- Hit = hazard fill. Blocked = phosphor outline. Partial = amber outline. Error = muted outline.
- Severity uses the same vocabulary. Do not use pills or dots-in-circles for severity.

### Navigation

- Sticky header, 64px, `bg-bg/90` + blur. Brand: 32px square mark with Crosshair in hazard red, “RedTeamForge” in display-adjacent mono, “Unit / RTF-01” stamp under it.
- Links: mono 12px, tracking 0.14em, uppercase, 44px hit. Active = hazard red type. Inactive = muted, hover steel.
- Primary CTA in the header is the steel primary button (“New scan”).
- Mobile: ghost icon button opens a left square sheet.

### Frame (signature)

- Same as a card, plus optional reticle ticks (`mark`).
- Stamp component: quiet steel, tracking 0.18em, uppercase.

### Target tiles

- Square selectable buttons, 12px padding, left-aligned title + hint.
- Active: hazard border + elevated fill.
- Idle: hairline, 40% elevated fill, stronger hairline on hover.
- Disabled: 40% opacity, not-allowed.

## Do's and Don'ts

### Do:

- **Do** follow this file for every new page, redesign, and tweak. `DESIGN.md` is the visual authority.
- **Do** keep radius at 0 and the control floor at 44px.
- **Do** use hazard red as a sparse signal (nav active, hit, destructive, reticle).
- **Do** set page titles in Archivo Black uppercase and body in IBM Plex Mono.
- **Do** reuse `Button`, `Card`, `Input`, `Frame`, `Stamp`, `Badge` before inventing new chrome.
- **Do** honor `prefers-reduced-motion` (kill scanline, grain, and rise).

### Don't:

- **Don't** add a second accent, a light theme, or a purple/blue AI glow.
- **Don't** introduce Inter, Geist, a serif, or a rounded geometric sans.
- **Don't** use drop shadows, glassmorphism, gradient text, or pill buttons.
- **Don't** fill large regions with hazard red.
- **Don't** put reticle ticks on every container — only on live/status frames.
- **Don't** ship controls shorter than 44px or type smaller than 12px for labels.
- **Don't** invent a new visual language because a feature is new. Extend this one.
