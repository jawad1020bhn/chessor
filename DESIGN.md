# Chess Coach — Design System Specification (2026)

**Version:** 14.0.0  
**Codename:** "Felt → Flux"  
**Design Language:** Material 3 Expressive + Custom Chess Semantics

---

## 1. Design Philosophy

**"Invisible until it matters"**

- **Zero chrome**: No cards, borders, or containers that don't carry meaning
- **Semantic color**: Every hue communicates state (you/opponent/neutral/threat)
- **Spatial honesty**: Layout reflects information hierarchy, not component taxonomy
- **Motion as signal**: Animation only when it conveys state change or focus

---

## 2. Color System (OKLCH-based, perceptual)

### 2.1 Seed Palette

```css
/* Primary: Chess felt green — trust, analysis, "your advantage" */
--seed-primary: oklch(0.48 0.18 145);       /* #006c4c light / #3dd59d dark */

/* Secondary: Slate — metadata, secondary actions */
--seed-secondary: oklch(0.42 0.04 250);     /* #4c6358 light / #b3ccbe dark */

/* Tertiary: Amber — attack, warning, "opponent advantage", urgency */
--seed-tertiary: oklch(0.62 0.16 75);       /* #8b5000 light / #ffb86b dark */

/* Error: Crimson — blunders, fair-play blocks, hard stops */
--seed-error: oklch(0.52 0.22 25);          /* #ba1a1a light / #ffb4ab dark */
```

### 2.2 Semantic Roles (The only colors components use)

| Role | Light | Dark | Use For |
|------|-------|------|---------|
| `--role-you` | `var(--md-sys-color-primary)` | `var(--md-sys-color-primary)` | Your moves, your advantage, your turn |
| `--role-opp` | `var(--md-sys-color-error)` | `var(--md-sys-color-error)` | Opponent moves, opponent advantage, threats |
| `--role-neutral` | `var(--md-sys-color-secondary)` | `var(--md-sys-color-secondary)` | Metadata, balance, "even" positions |
| `--role-attack` | `var(--md-sys-color-tertiary)` | `var(--md-sys-color-tertiary)` | Aggressive moves, sacrifices, king hunts |
| `--role-surface` | `var(--md-sys-color-surface)` | `var(--md-sys-color-surface)` | Background canvas |
| `--role-surface-elevated` | `var(--md-sys-color-surface-container-low)` | `var(--md-sys-color-surface-container-low)` | Floating sheets, dialogs |
| `--role-on-surface` | `var(--md-sys-color-on-surface)` | `var(--md-sys-color-on-surface)` | Primary text |
| `--role-muted` | `var(--md-sys-color-on-surface-variant)` | `var(--md-sys-color-on-surface-variant)` | Secondary text, labels |

### 2.3 Piece Identity (Theme-invariant)

```css
--piece-white: #f7f4ee;    /* Always warm off-white */
--piece-white-on: #1c1b17; /* Always near-black */
--piece-black: #1c1b17;
--piece-black-on: #f7f4ee;
```

> **Rule**: Piece glyphs NEVER use semantic colors. They are physical objects, not UI states.

---

## 3. Shape System (Organic, Asymmetric)

```css
/* Base radii — asymmetric pairs for directional feel */
--shape-xs: 4px;
--shape-sm: 8px;
--shape-md: 12px;
--shape-lg: 16px;
--shape-xl: 28px;
--shape-xl-inc: 36px;   /* Expressive asymmetric */
--shape-xxl: 48px;      /* Sheets, dialogs */

/* Organic corner recipes (8-value border-radius) */
--radius-hero: 28px 36px 22px 32px;           /* Hero tile */
--radius-balance: 28px 36px 22px 32px;        /* Balance tile */
--radius-verdict: 28px 34px 24px 30px;        /* Verdict tile */
--radius-sheet: 48px 48px 28px 28px;          /* Settings sheet */
--radius-dialog: 48px 48px 36px 36px;         /* Dialogs */
--radius-pill: 999px;                         /* Full pill */
```

### Shape Semantics
- **Rounded leading corners** → "Advancing, positive, yours"
- **Sharper trailing corners** → "Receiving, defensive, opponent"
- **Asymmetric** → Directional, alive, not mechanical

---

## 4. Typography (Variable Fonts, Expressive Scale)

```css
/* Brand: Display — headlines, move notation, big numbers */
--font-brand: "Segoe UI Variable Display", "SF Pro Display", "Inter Variable", ui-rounded, system-ui;

/* Plain: UI — body, labels, data */
--font-plain: "Segoe UI Variable Text", "SF Pro Text", "Inter Variable", system-ui;

/* Mono: Engine — evaluation, SAN, coordinates */
--font-mono: "JetBrains Mono Variable", "SF Mono", ui-monospace, monospace;
```

### Type Scale (M3 Expressive)

| Token | Size | Weight | Line | Tracking | Use |
|-------|------|--------|------|----------|-----|
| `--text-display` | clamp(2.25rem, 6vw, 3rem) | 800 | 1.1 | -0.03em | App title, empty state |
| `--text-headline` | 1.5rem | 700 | 1.25 | -0.02em | Sheet titles, section headers |
| `--text-title-lg` | 1.375rem | 700 | 1.25 | -0.02em | App bar title |
| `--text-title-sm` | 0.875rem | 700 | 1.3 | +0.01em | Card titles |
| `--text-body` | 0.875rem | 400 | 1.45 | 0 | Body copy |
| `--text-label-lg` | 0.875rem | 600 | 1.25 | 0 | Data labels |
| `--text-label-md` | 0.6875rem | 700 | 1.3 | +0.08em | Kicker, metadata (UPPERCASE) |
| `--text-move` | clamp(1.75rem, 7vw, 2.5rem) | 800 | 1.1 | -0.03em | Hero move (SAN) |
| `--text-metric` | clamp(1.25rem, 4vw, 1.5rem) | 800 | 1.1 | -0.02em | Accuracy, percentages |

---

## 5. Motion System (Spring Physics, Not Easing)

```css
/* Spatial spring — for position, scale, shape morph */
--motion-spatial: cubic-bezier(0.34, 1.4, 0.64, 1);   /* Overshoot, settle */
--motion-spatial-fast: cubic-bezier(0.34, 1.3, 0.64, 1);

/* Effects easing — for color, opacity, shadow */
--motion-effects: cubic-bezier(0.4, 0, 0.2, 1);        /* Standard M3 */
--motion-effects-soft: cubic-bezier(0.25, 0.1, 0.25, 1);

/* Durations */
--dur-instant: 80ms;
--dur-fast: 160ms;
--dur-med: 280ms;
--dur-slow: 420ms;
--dur-slower: 560ms;
```

### Motion Choreography

| Event | Motion | Duration | Purpose |
|-------|--------|----------|---------|
| Tile entrance | Staggered rise (30ms/item) | `--dur-med` | Progressive disclosure |
| Hero move change | Lift + fade | `--dur-med` | "New recommendation" |
| Verdict pop | Scale 0.96 → 1.02 → 1 | 420ms | "Measured, not decorated" |
| Segmented selection | Morph radius + fill | `--dur-med` | Physical pill movement |
| Switch/slider drag | Squeeze + stretch | `--dur-med` | Tactile feedback |
| Toast entry | Drop + scale | 300ms | Arrival |
| Toast swipe exit | Fling + fade | 220ms | Dismissal intent |
| Dialog/sheet | Bottom sheet rise | `--dur-med` | Spatial hierarchy |

> **Reduced Motion**: All durations → 0.01ms, all animations → 1 iteration. Respect `prefers-reduced-motion`.

---

## 6. Space System (4px Base, 8px Rhythm)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
```

### Layout Grid (Sidepanel: ~360px wide)

- **Content max-width**: 320px (16px side padding)
- **Component gap**: `--space-3` (12px)
- **Section gap**: `--space-5` (20px)
- **Inner padding**: `--space-4` (16px) for tiles, `--space-5` (20px) for hero

---

## 7. Elevation & Depth (No Shadows on Surface)

```css
/* Only floating elements cast shadows */
--elevation-1: 0 1px 3px rgb(0 0 0 / 0.12), 0 1px 2px rgb(0 0 0 / 0.08);   /* Tooltips, toasts */
--elevation-2: 0 4px 12px rgb(0 0 0 / 0.15);                                   /* Dropdowns */
--elevation-3: 0 8px 24px rgb(0 0 0 / 0.18), 0 -2px 8px rgb(0 0 0 / 0.06);   /* Sheets, dialogs */
--elevation-appbar: 0 1px 0 var(--md-sys-color-outline-variant), 0 6px 18px rgb(0 0 0 / 0.1); /* Scrolled */
```

> **Rule**: Surface-level tiles (hero, balance, verdict) have NO shadow. They ARE the surface.

---

## 8. Component Specifications

### 8.1 App Shell
```html
<div id="app" class="app">
  <header class="app-bar">...</header>
  <main class="canvas" id="canvas">...</main>
  <footer class="toolbar">...</footer>
</div>
```

- Full-height flex column
- Canvas scrolls, app bar + toolbar fixed
- App bar elevates on scroll (`.app.is-scrolled`)

### 8.2 Hero Tile (The Move)
```html
<section class="hero" aria-label="Recommended move">
  <div class="hero__kicker">Your move</div>
  <div class="hero__stage">
    <!-- Welcome state (no board) -->
    <div class="welcome" hidden>...</div>
    <!-- Move lockup: piece glyph + from→to -->
    <div class="move-lockup" hidden>...</div>
    <!-- Fallback: text hint -->
    <p class="hero__hint" hidden>...</p>
  </div>
  <div class="hero__tag attack" hidden>Attack</div>
</section>
```

**Visual States:**
- Default: Primary container background
- Ultra attack mode: Tertiary container wash
- Human mode: Secondary container wash
- Blocked: Error container, error text

### 8.3 Caption Rail (Why This Move)
```html
<section class="caption-rail" hidden aria-label="Why this move">
  <h2 class="caption-rail__title">Why this move</h2>
  <ul class="caption-rail__list" role="list">
    <li class="caption-row caption-row--idea" role="listitem">...</li>
    <li class="caption-row caption-row--capture" role="listitem">...</li>
    ...
  </ul>
</section>
```

**Row Kinds & Icon/Color Mapping:**
| Kind | Icon | BG Role | FG Role | Label |
|------|------|---------|---------|-------|
| `idea` | bulb | you | on-you | "Key idea" |
| `capture` | crosshair | you | on-you | "Captures" |
| `sacrifice` | bolt | attack | on-attack | "Sacrifice" |
| `kinghunt` | flag | attack | on-attack | "King hunt" |
| `cost` | trend-down | opp | on-opp | "Cost" |
| `risk` | warning | opp | on-opp | "Risk" |
| `posture` | info | neutral | on-neutral | "Position" |
| `reply` | reply | attack | on-attack | "Best reply" |

### 8.4 Balance Tile (Evaluation)
```html
<section class="balance" data-lean="even" data-state="empty" aria-label="Position evaluation">
  <div class="balance__orbs" aria-hidden="true">...</div>
  <div class="balance__head">
    <div class="balance__kicker-row">
      <span class="balance__kicker">Balance</span>
      <span class="balance__stale" hidden>cached</span>
    </div>
    <p class="balance__desc">Waiting for analysis…</p>
  </div>
  <div class="balance__ribbon">
    <div class="eval-bar" role="meter" aria-label="Evaluation" aria-valuemin="-10" aria-valuemax="10">
      <div class="eval-bar__fill"></div>
      <span class="eval-bar__fulcrum" aria-hidden="true"></span>
    </div>
    <span class="eval-bar__pct eval-bar__pct--left" aria-hidden="true"></span>
    <span class="eval-bar__pct eval-bar__pct--right" aria-hidden="true"></span>
  </div>
  <svg class="balance__spark" aria-hidden="true"></svg>
  <div class="balance__labels">
    <span class="balance__side"><span class="piece-dot piece-dot--white"></span><span class="balance__label">—</span></span>
    <span class="balance__side"><span class="balance__label">—</span><span class="piece-dot piece-dot--black"></span></span>
  </div>
</section>
```

**Lean States (data-lean):**
- `you` → Primary container BG, rounded leading corners
- `opp` → Error container BG, rounded trailing corners
- `even` → Surface container low, balanced corners

**Data States (data-state):**
- `empty` → Skeleton shimmer, no pills
- `loading` → Skeleton shimmer, "Analyzing…"
- `data` → Live values, fulcrum animated
- `stale` → Data + "cached" badge, 70% label opacity
- `error` → Neutral, error message

### 8.5 Critical Moment Banner
```html
<section class="banner banner--critical" hidden role="alert" aria-label="Critical moment">
  <span class="banner__kicker">Critical moment</span>
  <span class="banner__icon" aria-hidden="true"></span>
  <p class="banner__title"></p>
  <p class="banner__detail"></p>
</section>
```

### 8.6 Verdict Tile (Last Move Classification)
```html
<section class="verdict" data-verdict="none" data-state="empty" aria-label="Last move classification">
  <div class="verdict__burst" aria-hidden="true"></div>
  <span class="verdict__kicker">Last move</span>
  <div class="verdict__stage">
    <!-- Empty -->
    <div class="verdict__empty">...</div>
    <!-- Or populated -->
    <div class="verdict__copy">
      <p class="verdict__mover">You played Nf3</p>
      <p class="verdict__label">Brilliant!!</p>
      <p class="verdict__metric">Win +12%</p>
    </div>
    <div class="verdict__ring" style="--acc: 95" role="img" aria-label="Engine accuracy 95 of 100">
      <div class="verdict__ring-stack">
        <span class="verdict__ring-val">95</span>
        <span class="verdict__ring-cap">/ 100</span>
      </div>
    </div>
  </div>
</section>
```

**Verdict → Color/Shape Mapping:**
| Verdict | BG Role | Ring Color | Shape |
|---------|---------|------------|-------|
| brilliant/great | you | you | Rounded leading |
| best/excellent/good | you | you | Rounded leading |
| inaccuracy/mistake | attack | attack | Slightly sharp |
| blunder | opp | opp | Sharp trailing |
| none/empty | neutral | — | Balanced |

### 8.7 Position Facts Card
```html
<section class="facts" aria-label="Position facts">
  <h2 class="facts__title">Position</h2>
  <dl class="facts__list">
    <div class="fact"><dt class="fact__label">Opening</dt><dd class="fact__value">Sicilian Defense</dd></div>
    <div class="fact"><dt class="fact__label">Phase</dt><dd class="fact__value">Middlegame</dd></div>
    <div class="fact"><dt class="fact__label">Quality</dt><dd class="fact__value">Deep · 92%</dd></div>
    <div class="fact"><dt class="fact__label">Source</dt><dd class="fact__value">Lichess Cloud</dd></div>
    <div class="fact"><dt class="fact__label">Material</dt><dd class="fact__value">You +1.5</dd></div>
    <div class="fact"><dt class="fact__label">Natural play</dt><dd class="fact__value">12 / 15 (80%)</dd></div>
  </dl>
</section>
```

### 8.8 Alternatives Rail (Also Consider)
```html
<section class="alts" hidden aria-label="Alternative good moves">
  <h2 class="alts__title">Also consider</h2>
  <ul class="alts__list" role="list">
    <li class="alt-row alt-row--white" role="listitem" style="--share: 85">
      <span class="alt-row__piece" aria-hidden="true">♘</span>
      <span class="alt-row__san">Nf3</span>
      <span class="alt-row__meter" role="progressbar" aria-valuenow="85">
        <span class="alt-row__meter-fill"></span>
      </span>
      <span class="alt-row__score">+0.3</span>
      <span class="alt-row__tag" hidden>Attack</span>
    </li>
  </ul>
</section>
```

### 8.9 Player Selector (Side Switch)
```html
<div class="side-switch" role="radiogroup" aria-label="Which side to coach" data-selected="w">
  <span class="side-switch__track" aria-hidden="true">
    <svg class="side-switch__king-white" aria-hidden="true">...</svg>
    <svg class="side-switch__king-black" aria-hidden="true">...</svg>
  </span>
  <span class="side-switch__thumb" aria-hidden="true">
    <svg class="side-switch__king" aria-hidden="true">...</svg>
  </span>
  <button class="side-switch__hit" data-color="w" role="radio" aria-checked="true"></button>
  <button class="side-switch__hit" data-color="b" role="radio" aria-checked="false"></button>
</div>
```

### 8.10 Settings Sheet (Bottom Sheet)
```html
<div class="sheet" id="settings-sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title" hidden>
  <header class="sheet__bar">
    <div>
      <p class="sheet__eyebrow">Saved automatically</p>
      <h2 id="settings-title" class="sheet__title">Tune the coach</h2>
    </div>
    <button class="icon-btn" aria-label="Close settings">...</button>
  </header>
  <div class="sheet__body">...</div>
</div>
```

---

## 9. Interaction Patterns

### 9.1 Segmented Controls (Connected Button Groups)
- Square inner corners (8dp)
- 2dp gap rhythm
- Selected button morphs to **fully round** + tonal fill
- No sliding indicator pill (retired in M3 Expressive)
- Arrow keys rove + select (APG radiogroup)

### 9.2 Choice Stack (Radio as Cards)
- Full-width cards, organic radius
- Selection: tonal fill + check mark pop (scale 0.3 → 1)
- Radius morphs: `shape-lg` → `shape-xl` on select

### 9.3 Switch (M3 Expressive)
- 52×32 track, 16→24px thumb morph
- Thumb rides on `left` + size (spatial spring)
- Check mark pops inside thumb
- State-layer halo on hover/focus/press

### 9.4 Slider (Custom Range)
- 24px track height, generous touch target
- Handle: 18px dot → 22px pill on hover/drag
- Inner dot: 4×16px → 6×18px
- Squeeze on press (height = track height)
- Value chip: secondary container pill, springs on change

### 9.5 Toast System
- Top-fixed stack (max 3)
- Swipe-dismiss: drag > 56px → fling away
- Spring back if under threshold
- Role-tinted icon chips (no font glyphs)

### 9.6 Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `R` | Refresh analysis |
| `S` | Toggle settings |
| `Esc` | Close dialog/sheet |
| `?` | Toggle shortcuts help |
| `←/→/↑/↓` | Rove segmented/choice groups |

---

## 10. Accessibility (Non-Negotiable)

- **Semantic HTML**: Every component uses correct roles (`meter`, `progressbar`, `radiogroup`, `list`, `alert`, `dialog`)
- **ARIA Live**: Hero hint (`polite`), verdict (`polite`), status (`polite`), toasts (`assertive` for errors)
- **Focus Visible**: 3px secondary outline, 2px offset on ALL interactive elements
- **Color Contrast**: All text ≥ 4.5:1, UI elements ≥ 3:1 (verified in both themes)
- **Reduced Motion**: All animations respect `prefers-reduced-motion`
- **Keyboard**: Full operability without mouse
- **Screen Reader**: Meaningful labels, no redundant announcements

---

## 11. Dark Mode (Default)

- System preference only — no manual toggle
- All tokens swap via `@media (prefers-color-scheme: dark)`
- Piece glyphs stay theme-invariant
- Semantic roles preserve meaning across themes

---

## 12. Icon System (Material Symbols, Mask-Based)

All icons are SVG `mask-image` data URIs on colored chips:
- `--icon-check`, `--icon-warning`, `--icon-error`, `--icon-bolt`
- `--icon-bulb`, `--icon-crosshair`, `--icon-flag`, `--icon-trend-down`
- `--icon-info`, `--icon-reply`

No icon fonts. No external dependencies.

---

## 13. Implementation Rules

1. **Tokens first**: Never hardcode colors, spacing, radii, durations
2. **Semantic roles**: Components consume `--role-*`, never `--md-sys-color-*` directly
3. **CSS-driven motion**: JS only toggles classes/data-attrs; CSS handles transitions
4. **No `!important`**: Specificity managed by architecture
5. **Single source of truth**: DESIGN.md tokens → CSS custom properties → component styles
6. **Progressive enhancement**: Core works without JS; JS adds motion, live data, interactions

---

## 14. Version History

| Version | Codename | Key Changes |
|---------|----------|-------------|
| 13.x | "Felt" | M3 Expressive depth pass, sparkline, alternatives, verdict pop |
| 14.0 | "Flux" | **Full rebuild**: Semantic roles, organic shapes, spring motion, zero chrome, caption rail, M3E segmented/switch/slider |

---

*This specification is the contract. Implementation must match exactly.*