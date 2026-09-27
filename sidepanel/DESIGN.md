# Gambit — design system for the Chess Hint Assistant

Ground-up rebuild (v14). The previous theme (Felt / Material 3 Expressive) was
deleted — no CSS, class, or token survives. What follows is the whole system.

## Research base (2026)

- **Dark-first power tools.** Products people keep open all session (Linear,
  Vercel, Supabase) now design dark first, with quiet chrome and type-led
  hierarchy. A chess coach is exactly that kind of tool.
- **Color is meaning, not decoration.** Neutral graphite surfaces, one electric
  accent for interaction/brand, and a semantic spectrum (green → red) reserved
  for evaluation and verdicts.
- **Liquid Glass, only where it serves.** Apple's 2025→26 material — used here
  exclusively on the two fixed chrome surfaces (top bar, dock) and overlays,
  where content genuinely scrolls beneath them. Performance rule respected:
  `backdrop-filter` runs on two small bars, never on scrolling cards.
- **Bento composition.** The panel is a single column of single-purpose tiles
  with one display moment (the move) — the "one trusted number" fintech rule.
- **Designed empty and loading states.** A welcome state that teaches, skeleton
  shimmer for first analyses, ghost states for tiles without data.
- **Purposeful motion.** One spatial spring for position/shape, one standard
  curve for color/opacity, staggered entrances, count-ups — all disabled under
  `prefers-reduced-motion`.
- **Method.** The stylesheet is organized like a component library (tokens →
  primitives → component set → composition), the same discipline generative-UI
  frameworks such as OpenUI apply: a closed, tokenized component set that the
  markup composes. OpenUI's React runtime itself cannot load inside an MV3
  side panel under its CSP, so the methodology was applied natively instead.

## Identity

**Gambit** — a match instrument. Graphite + hairlines + film grain; a single
**volt** accent (`#d7f651`); piece identity is theme-independent (ivory
`#e9e6da` vs onyx `#454f63`). The knight is the brand mark, riding a morphing
volt tile. System font stack only — zero network cost, CSP-clean.

## Product jobs

1. Read the recommended move in under a second.
2. Know whose side is being coached.
3. Judge evaluation and analysis quality without implementation jargon.
4. Change play style and effort as goals, not engine knobs.
5. Trust provider health without leaving the coach surface.

## The fixed-chrome layout

The canvas scrolls **under** both bars — that is what makes the glass real:

- **Top bar** (glass, gains tint + hairline on scroll via `.is-scrolled`):
  brand mark, side selector (a king thumb slides under **W**/**B**, colored
  ivory for White, onyx for Black), tonal settings button.
- **Status strip**: spinner ring while analyzing, semantic status dot
  (`connecting/online/analyzing/error/unknown`), status text, turn chip
  (`verified` green / `partial` amber / `pending` breathing).
- **Dock**: fair-play microcopy + the volt FAB. The FAB morphs from a squircle
  toward a circle on hover and spins while refreshing.

## Component set

- **Hero** — the move is the only display type on the canvas: 38px/750 SAN or
  the piece lockup (glyph + mono from/to square chips + volt arrow). Ambient
  accent glow signals mode: volt (engine), cyan (human), magma (ultra attack).
  A scan sweep plays while analyzing (`.analyzing`). The `Attack` tag is a
  magma outline pill with a bolt mask. Blocked states get a red hairline.
- **Welcome** — knight on a morphing conic blob; hides the moment any board
  exists; engine tiles are display-none until then (`.no-position`).
- **Caption rail ("Why this move")** — rows in the tile dialect: 28px icon
  well + kicker + body. Eight kinds, each with its own mask icon and tint
  (`idea` volt, `capture` cyan, `sacrifice` pink, `cost` yellow, `risk` red,
  `kinghunt` magma, `posture` blue, `reply` green). Rows stagger in via `--i`.
- **Alternatives ("Also consider")** — read-only candidate lines: piece chip
  (piece-identity colors), SAN, share-of-best meter animated from `--share`,
  tabular score; mate scores go volt; attacking lines carry the magma tag.
- **Balance tile** — kicker + prose description; a 24px dual-identity ribbon
  (ivory fill from the left via `scaleX`, inset-well remainder) with the
  You/Opp pills living inside the meter; a diamond fulcrum riding the split at
  `left: calc(var(--eval-pct) * 1%)`; trend sparkline (dashed zero line, volt
  line, end dot) that stays hidden until two points exist; side labels in
  tabular mono. Lifecycle via `data-state` (`empty/loading/error/stale`):
  loading breathes, loading-first paints skeletons, stale dims the labels,
  error mutes the ribbon.
- **Last-move verdict tile** — `data-verdict` resolves `--v`; the stage is a
  color-mixed container whose corner radius *sharpens as the verdict worsens*
  (organic 26/14px for brilliant/great → 7px + glow for blunder). Copy block
  (mover, verdict + quieter annotation symbol, win-chance metric in mono) and
  a conic accuracy ring driven by `--acc` with the big figure + `/ 100` cap.
  Fresh verdicts pop on the spring and count up; re-renders replay silently.
- **Position facts** — hairline-separated key/value rows; values right-aligned
  tabular; material row is tinted inline by the controller through the
  `--accent-*` aliases (part of the JS ⇄ CSS contract).
- **Banners** — critical moment (volt tint, bolt mask) and fair play (red
  tint, alert mask), both grid + kicker + body.
- **Settings sheet** — full-screen glass bar over a scrolling body; per-engine
  `.g-engine` cards (`--off` collapses the body + dims, `--inactive` greys out
  in Maia-exclusive mode); segmented wells, choice cards, switches, sliders as
  primitives; provider pulse rows + diagnostics mini-tiles + version stamp.
- **Shortcuts dialog** — centered sheet over blurred scrim, focus-trapped.
- **Toasts** — glass tiles above the dock, mask icon tinted by type, spring
  entrance, swipe-to-dismiss preserved by the controller.

## Primitives

Segmented control (inset well + JS-measured sliding pill via `--seg-*`),
switch (stretch-on-press thumb, volt when on), slider (invisible native range
over track/fill/handle, `is-dragging` scale, bumping value chip), choice cards
(volt hairline + check when selected), buttons (tonal/outlined pills), skeleton
shimmer, kbd chips.

## Tokens

Color roles: `--g-bg-0/1`, `--g-s-1…4` surface ladder, `--g-line{,-2,-3}`
hairlines, `--g-text-1/2/3` ink, `--g-volt` accent + `--g-glow`, `--g-ivory` /
`--g-onyx` piece identity, `--g-cyan…--g-red` semantic spectrum, `--g-v-*`
verdict roles, plus the `--accent-green/yellow/red` and `--text-secondary`
aliases the controller writes inline.

Type roles: `g-t-label` (10.5px caps), `g-t-body`, `g-t-num` (mono tabular),
`g-t-title`, `g-t-headline`, `g-t-brand`. Display sizes live inside components.

Shape: 7 → 10 → 14 → 18 → 24 → full. Motion: spring
`cubic-bezier(0.28, 1.38, 0.42, 1)`, ease `cubic-bezier(0.22, 0.61, 0.21, 1)`,
140/260/460ms.

## Accessibility

- 40px+ targets on icon buttons, FAB, side selector; 44×26 switches with a
  full-size input.
- Color only on paired roles (dot + text, icon + word).
- `:focus-visible` volt outline; switch focus ring on the track.
- `prefers-reduced-motion` collapses every animation and transition.
- Settings and shortcuts stay modal dialogs with focus trap and Escape; all
  radiogroups keep APG arrow-key roving (in the controller, unchanged).

## Wiring contract (locked by tests/panel-wiring.test.js)

Element ids referenced by the controller exist in the markup; the Balance and
Verdict tiles keep their component classes (`g-balance__*`, `g-verdict__*`);
the fulcrum reads `--eval-pct` from the tile; the win-probability pills stay
inside the meter; every `data-verdict` label `classifyMove` can emit has a
CSS role; every class the controller emits (captions, alternatives, toasts,
status states) has a rule. The controller carries zero styling of its own.

## Dev preview

`preview/index.html` boots the real side panel against a mocked `chrome.*`
runtime (one canned Scholar's-mate position; no network). Serve the repo root
over any static server and open `/preview/`. Query params: `?noboard` freezes
the welcome state, `?hold` freezes the quiet first analysis (alternatives
visible). Not shipped in the extension.
