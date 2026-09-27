# Chessor — Study desk

Rebuilt September 27, 2026. This replaces the Felt / Material Expressive visual
system, not a theme layered over its stylesheet.

## Research before implementation

Two GitHub-hosted AI design skills/guidelines were read and applied as design and
review workflows. No third-party skill installer, executable agent, or generated
runtime dependency was added to the extension.

| Source | Applied decisions |
| --- | --- |
| [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), reviewed revision `41bbe19` (September 3, 2026) | Begin with the product's job and a deliberate visual identity; chess notation rather than decorative imagery; restrained motion; one clear focal point instead of equal-weight cards. |
| [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md), reviewed revision `e3d624b` (August 18, 2026) | Named controls, semantic HTML, focus visibility, modal isolation, reduced motion, overflow handling, tabular numerals, and review of empty/loading/error states. |

Discovery research also included [Snyk's UI/UX skill survey](https://snyk.io/articles/top-claude-skills-ui-ux-engineers/).
Primary GitHub source content, rather than the survey's recommendations alone,
informed implementation. “2026” is not a reason to add glass effects, animations,
or a frontend framework to a narrow, task-focused extension.

## Product and visual direction

**Purpose:** understand a chess study position, its recommended move, and the
reasoning without losing the board. For study/review, not competitive assistance.

**Identity:** an ink-blue study desk. Cool paper surfaces, a solid navy move card,
chess-piece silhouettes, and monospace notation. The panel is called **Chessor**
to match the repository; the extension's manifest name remains unchanged.

**Hierarchy:**
1. Identity, explicit White/Black radio controls, preferences.
2. Compact connection/turn status.
3. Recommended SAN, mate context when relevant, and beginner-readable coordinates.
4. Explanation and meaningful alternatives, only when available.
5. Position evaluation and last-move assessment.
6. Position/source facts, without unnecessary card nesting.
7. Fixed study-use reminder and a labeled analysis action.

Preferences remain a separate full-height dialog. Engine-specific settings are
progressively disclosed by their switches; Maia-exclusive and Ultra-only gating
continue to use the existing controller and engine rules.

## Implementation

- `sidepanel.css` is entirely new. Layers: reset, tokens, layout, components,
  states, accessibility. No old palette or Material dependency remains.
- Existing `md-*` class names and element IDs are compatibility hooks for the
  controller and regression tests, not a dependency on the previous design.
- System UI typography and local monospace fallbacks: zero font/image requests,
  no CSP changes, no build step or extension runtime package dependencies.
- Semantic palette tokens supply light and system dark themes. Piece colors and
  the evaluation meter stay stable because they encode White/Black identity.
- Readable bounded scroll regions keep the action bar and preferences close
  control visible. Layouts are tested at 320, 400, and 600px viewport widths.
- New radio behavior uses one tab stop per group; arrows/Home/End select options.
  Removed indicator measurement, font-load relayout, and resize observers.
- Settings isolate the underlying workspace with `inert`, trap focus, support
  Escape from form controls, and restore focus on close. Shortcuts restore the
  actual launching focus and isolate the entire app while open.
- Backing selects/checkboxes are removed from the tab order and accessibility
  tree because visible radio groups expose the same choices.
- Persistent inline styles only express controller state (visibility, evaluation
  proportion), not old visual styling.
- Reduced-motion users get no animation. Forced-colors styles retain control
  boundaries and checked state. Loading skeletons are intentionally static.

## Validation and development

Requirements: Node 20+, npm, Python 3, Chromium dependencies.

```sh
npm ci
npm test
npx playwright install --with-deps chromium
npm run test:ui
npm run preview
# Open http://localhost:8123/preview/
```

If using a preinstalled Chromium, set `CHROMIUM_PATH=/path/to/chromium` for UI
tests. The implementation sandbox used an npm-distributed Chromium binary and
its bundled libraries because the browser CDN/system package mirror were not
reachable. Those binaries and libraries are not repository artifacts.

### Coverage

- 10 existing Node regression suites: all pass, including controller/markup/CSS
  wiring, engine behavior, provider coordination and background smoke tests.
- 12 Playwright checks: six theme/width combinations; welcome; alternatives and
  proportional meters; style/engine settings and focus trapping; shortcuts,
  side selection and refresh; loading/stale/error states; CSS zoom/forced colors.
- axe-core WCAG A/AA rules run on analysis/preferences in all six combinations
  and on the additional content states. No violations in tested states.
- Chromium screenshots reviewed for analysis, preferences, welcome, alternatives,
  position details, light and dark themes.
- This is not a claim of complete WCAG conformance. A real Chrome extension
  side-panel smoke test, screen-reader review, and integration checks against
  live provider responses remain appropriate before publishing.

The preview loads the real panel markup and controller against a mocked Chrome
runtime. It does not contact chess services or make real engine requests.

| Query | Scenario |
| --- | --- |
| `/preview/` | Mate in one, following an initial quieter position |
| `?hold` | Alternatives / quiet evaluation |
| `?noboard` | Welcome / no position |
| `?loading` | Pending analysis |
| `?stale` | Cached result |
| `?error` | Provider unavailable |

Preview controls/styles are separate files and never loaded by the extension.
Mock preferences last only for the current page. Actual extension preferences
continue to persist through `chrome.storage.local`.

## Scope boundaries

No engine/provider algorithms, permissions, host access, background scripts, or
board extraction were changed. Fair-play copy is a study-use reminder, not a new
claim that this visual redesign adds enforcement. No external skill repositories
or binaries are vendored. Browser traces/screenshots and dependencies are ignored.
