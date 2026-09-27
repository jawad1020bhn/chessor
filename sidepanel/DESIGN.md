# Felt — Material 3 Expressive design system

Greenfield UI for the Chess Coach side panel. The previous layout is not a source.

## Depth pass (v13, this revision)

New surfaces on the same tokens — no new direction, more depth per surface.

- **The hero teaches when there is nothing to show.** A dedicated welcome
  state (`#hero-welcome`) replaces the dead "Waiting for a board…" string:
  a knight on a morphing pedestal blob (the brand mark's idle animation,
  reused), a short title, and one sentence of instruction. It hides the
  moment any board exists; every other hero state plays over it.
- **Balance gained a memory.** A 28dp sparkline under the ribbon draws the
  recent evaluation swing from the `evalHistory` the controller already
  keeps (last 20 analyses, White's perspective, clamped ±6 pawns, dashed
  zero line, end dot). It stays hidden until two points exist, so early
  positions stay calm. New tile states: `data-state="stale"` dims the
  side labels.
- **"Also consider" — alternatives as information, not buttons.** Candidate
  PVs beyond the recommendation render read-only in the caption-rail
  dialect: piece glyph chip (piece-identity colors), SAN, a thin
  share-of-best meter that springs in staggered, and a tabular score.
  Mate scores carry tertiary urgency. Lines keeping <70% of the best
  line's value are dropped — real alternatives only, max three rows.
- **Verdicts land with weight.** A fresh classification pops the stage once
  on the spatial spring and counts the accuracy figure up from zero
  (ease-out cubic, ~520ms). Re-renders of the same stored analysis
  (settings changes) are fingerprinted and replay silently. Reduced
  motion skips both.
- **The app bar earns its keep on scroll.** One rAF-throttled listener
  flips `.is-scrolled`; CSS adds a hairline edge + container tint so
  scrolled content doesn't collide with the identity row.
- **Toasts dismiss by hand.** Pointer-drag a toast sideways past ~56px and
  it flings out with spring physics; below threshold it springs home.
  Timer dismissal now checks `isConnected` so a swiped toast can't exit twice.
- **Settings sheet stamps its version** (`Felt · v13.0.0`, read live from
  the manifest) so bug reports self-identify.

## Engine cards + Maia + attack tags (this revision)

Settings reorganized per engine — no top-level generic sections remain:

- **One `.md-engine` card per source.** Chess-API owns Quality (its depth
  control); Lichess Cloud owns Candidate lines (cloud-eval caps multiPv at
  5); Engine style owns style stack, Early King Hunt, Play-human voice, and
  sparring strength; Maia 3 owns the exclusive switch, Maia rating
  (600–2600), and Maia lines; Masters DB owns a one-line descriptor. Cards
  reuse `surface-container-low` + `shape-lg`; a body collapses when its
  engine is off, and non-Maia cards dim in Maia-exclusive mode.
- **Maia-exclusive mode.** One switch makes Maia 3 the sole hint source with
  its own rating/lines; style, human mode, quality, and the other engine
  toggles disable with a toast explaining why. Maia is already human-like,
  so no style layer applies on top.
- **Source row.** Position facts gain a Source row (`Maia 3 · 1500`,
  Chess-API, Lichess Cloud…), fed by `data.source`.
- **Attack tags.** Ultra-attack detectors run annotate-only
  (`detectAttackTags`, no rerank, no settings) over hero + alternative
  moves; hits render a tertiary `Attack` pill (mask bolt icon, motif list
  in the tooltip) in "Also consider" rows and the hero. Weak Chaos signals
  (overload, practical chances, structural complexity) never tag alone.

## Product jobs

1. Read the recommended move in under a second.
2. Know whose side is being coached.
3. Judge evaluation and analysis quality without implementation jargon.
4. Change play style and effort as goals, not engine knobs.
5. Trust provider health without leaving the coach surface.

## Design decisions (this revision)

**The hero shows the move, nothing else.** The user picked the style in
settings, so the move line never repeats it — "Ultra Super Aggressive Attack
choice:" and its siblings are gone for good. `hint-engine` now returns the
hero line and a separate `captions` array (`{ kind, label, text }`), and the
panel renders the captions in their own rail outside the hero — the
"Why this move" section with staggered rows and expressive shape-play icons.

**Trust is whispered, not tagged.** The ENGINE source badge and the
VERIFIED FEN chip are deleted. Analysis quality still shows as prose in the
Position facts card; the status row communicates through its existing dot,
loader, and a state tint on the turn line.

**Selection is a connected button group, everywhere.** All radio-style groups
(side selector, Engine/Human, quality, candidate lines, Maia lines) follow the
M3 Expressive connected-group pattern: square 8dp inner corners on a 2dp
rhythm inside a fully-round container, and the selected button morphs to
fully round with a tonal fill on the spatial spring. The old sliding-pill
indicator element is retired (hidden in CSS; JS still measures it
harmlessly). Arrow keys rove per the APG radiogroup pattern.

**Switches run the full M3 motion recipe.** Thumb grows 16 → 24px while it
travels, stretches on press, a check pops inside when on, and a 40px state
layer blooms on hover/focus/press. Style choice cards morph their corner
radius (lg → xl) and pop a check when selected.

**Balance and Last move are fully wired, one layer to the next.** Earlier the
Expressive CSS for both tiles existed while the markup still spoke the legacy
`.md-card .md-eval` dialect: `#eval-score` and the fulcrum were missing from
the HTML, the hidden `#eval-bar-black` dual-bar remnant was still being
transformed, and `--eval-pct` was written to the bar instead of the tile the
fulcrum inherits from. The HTML, CSS, and JS now implement one contract each,
and `tests/panel-wiring.test.js` locks the three layers together so a future
edit cannot silently disconnect them again. The win-probability breakdown
(`You 52% · Opp 48%`) is a pair of inverse-surface pills inside the meter
itself — one per side, following the player's color — so it never competes
with the ribbon side labels, which carry the +/- score.

## Quality pass (this revision)

A consistency and contrast sweep over the same tokens — no new direction.

- **Role-retint is total — but type stays neutral.** Every muted/emphasized
  text inside the Balance and Last-move tiles reads `--balance-role-muted/fg`
  and `--verdict-role-muted/fg`, and those resolve to the surface tokens so
  the words always render in the default white/grey. A `you`/`opp`/verdict
  retint recolors the *container* (and the fulcrum / ring arc) only — the
  text color never shifts to match a red or green box.
- **Loading shimmers, it doesn't wait.** The Balance tile's skeleton
  shimmer (`.md-skeleton`) is now wired into `setBalanceLoadingState` for
  first analyses; re-analyses keep the previous numbers under
  "Analyzing position…".
- **Dead accent plumbing removed.** The `--hint-accent` writes and the
  `--accent-gold/aggressive/super-ultra` aliases are gone; the mode wash is
  container color only. `--accent-yellow` now maps to the tertiary token so
  the correlation stat keeps contrast in dark mode.
- **Shape scale grew one rung.** `--md-sys-shape-xxl: 48px` (M3 Expressive
  extra-extra-large) for the shortcuts sheet; the sheet's corner radius
  reads 48 top / 36 bottom. Wrapping connected groups keep the 8dp inner
  corners; only the container rounds with `xl`.
- **Motion completes both ways.** Toasts enter (not just exit), the settings
  sheet and shortcuts dialog animate out, and the dialog gains a scrim fade.
  Reduced-motion users skip the close delays entirely.
- **Shortcuts dialog is modal for real.** Scrim click closes, Tab traps
  inside, focus moves to the close button on open and returns to Settings
  on close.
- **Micro-polish.** Material-symbol masks replace the toast font glyphs;
  the verdict ghost state gets a pawn-in-blob; the Ultra-only Early King
  Hunt row rises in on reveal; `.md-btn` gains tonal/outlined hover layers;
  the style choice cards rove with arrow keys like every other radiogroup;
  good verdicts (best/excellent/good) share the rounded organic radius of
  brilliant/great instead of falling back to the neutral shape.

## Expressive tactics used

| Tactic | Application |
|---|---|
| Variety of shapes | Extra-large hero, blob caption icons, asymmetric FAB, morphing brand mark |
| Rich color | HCT-style roles from a felt-green seed; tertiary amber for urgency |
| Emphasized type | Display-small-emphasized for the move; label-md for wayfinding |
| Contain for emphasis | Primary-container hero; surface-container-lowest caption rail |
| Spatial springs | Selection shape-morph, switch thumb travel, staggered entrances |
| Flexible components | Connected button groups, choice cards, switches, FAB |
| Hero moment | The move is the only display type on the canvas — ever |
| Motion as identity | Hero blob follows the current container's on-color per mode |

## Tokens

Color roles follow M3 pairing: `primary` / `on-primary`, `primary-container` /
`on-primary-container`, plus secondary, tertiary, error, and the
surface-container ladder. Piece-identity neutrals (`--md-piece-light`) are
theme-independent by design.

Type roles: display-sm-emphasized, headline-sm, title-large-emphasized,
title-sm, body-md, label-lg, label-md.

Shape: xs 4 → xl-inc 36 → full.

Motion: spatial spring `cubic-bezier(0.34, 1.4, 0.64, 1)` for position/shape;
effects curve for color/opacity.

## Components

- **App bar** — identity + White/Black connected group + tonal settings icon
- **Status row** — morphing loader while analyzing; turn line with state tint
- **Hero** — primary container; switches to secondary (human) or tertiary (ultra); displays only the SAN move; carries the `Attack` chip when the chosen move trips the ultra detectors
- **Caption rail** — "Why this move": idea, capture/sacrifice, cost, risk, king-hunt, balance posture
- **Alternatives rail** — "Also consider": read-only candidate lines with piece chip + share-of-best meter (real `progressbar` semantics) + score; attacking lines gain a tertiary `Attack` pill
- **Squares lockup** — piece glyph + from/to square chips inside the hero
- **Balance tile** — content-first scorecard: kicker + prose description;
  a 32dp dual-identity ribbon (white fill from the left, inverse-surface remainder)
  with a morphing fulcrum riding the split; White/Black piece-identity labels;
  4-state lifecycle (`empty → loading → data → error/stale`) with skeleton shimmer;
  lean (you / opp / even) retints the whole tile and re-roots its corner radii
- **Last move verdict tile** — the rate and judgment as the hero: role container
  (primary for good moves, tertiary for inaccuracy/mistake, error for blunder),
  organic radius that sharpens as the verdict worsens, move identity line
  (`You played Nf6` / `Opponent played exd5`), emphasized verdict word with a quieter
  annotation symbol, win-chance swing metric, morphing blob accuracy ring with a
  large accuracy figure + `/ 100` cap, and an explicit empty ghost state
  (`Play a move to see how it rated`) before moves are classified
- **Banners** — primary / tertiary / error containers with leading icons
- **Fact list** — opening, phase, quality, source engine, material, natural play
- **FAB** — refresh; morphs toward a circle on hover
- **Settings sheet** — full-screen surface; per-engine `.md-engine` cards owning their settings (quality, lines, style, human voice, Maia exclusive/rating/lines); engine groups carry `role="group"` labels; alts list is a real `list`; slides up on open
- **Snackbar** — inverse surface, 3:1 contrast

## Accessibility

- 44px minimum targets on icon buttons, FAB, switches (52×44 input overlay)
- Color only on paired roles
- Focus-visible uses secondary, 3px
- `prefers-reduced-motion` disables springs
- Settings and shortcuts are modal dialogs with focus trap and Escape
- All connected-group radiogroups support arrow-key roving (APG)

## Dev preview

`preview/index.html` boots the real side panel against a mocked `chrome.*`
runtime (one canned Scholar's-mate position; no network). Serve the repo root
over any static server and open `/preview/`. Not shipped in the extension.
