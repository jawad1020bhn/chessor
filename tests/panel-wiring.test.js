'use strict';
// EDUCATIONAL USE ONLY — FAIR-PLAY SAFE
//
// Panel wiring regression guard for the Gambit design system (v14): the
// three layers — markup, stylesheet, controller — must stay connected. This
// locks (1) every element id the controller touches exists in the markup,
// (2) the Balance tile contract (fulcrum driven by --eval-pct, win-probability
// pills inside the meter, stale badge, skeleton shimmer), (3) the Last-move
// verdict tile contract (component classes + the full data-verdict role
// palette), and (4) every class emitted by markup or controller has a CSS
// rule. A future edit cannot silently disconnect the layers again.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'sidepanel/sidepanel.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'sidepanel/sidepanel.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'sidepanel/sidepanel.js'), 'utf8');

const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));

// ── 1. Every element id referenced by the controller must exist in markup ──
const jsIdRefs = new Set();
for (const m of js.matchAll(/\$\('#([a-z0-9-]+)'\)/gi)) jsIdRefs.add(m[1]);
for (const m of js.matchAll(/getElementById\('([a-z0-9-]+)'\)/g)) jsIdRefs.add(m[1]);
const missing = [...jsIdRefs].filter((id) => !htmlIds.has(id));
assert.deepEqual(missing, [], `sidepanel.js references ids missing from sidepanel.html: ${missing.join(', ')}`);

// ── 2. The Gambit system replaced the old theme wholesale ──
assert.match(css, /GAMBIT/, 'stylesheet declares the Gambit system');
assert.ok(!/\.md-[\w-]+/.test(css), 'no legacy .md-* component rules remain in CSS');
assert.ok(!/class="[^"]*\bmd-[\w-]+/.test(html), 'no legacy md-* classes remain in markup');
assert.ok(!/['"`]md-[\w-]+/.test(js), 'no legacy md-* class strings remain in the controller');

// ── 3. Balance tile contract (`.g-balance` component) ──
const balanceHtml = html.match(/<section id="eval-section"[\s\S]*?<\/section>/)[0];
assert.match(balanceHtml, /class="g-balance"/, 'Balance section uses the .g-balance component');
assert.match(balanceHtml, /g-balance__head/, 'head (kicker + description) present');
assert.match(balanceHtml, /id="eval-bar-white-pct"/, 'white-side win-probability pill present in the meter');
assert.match(balanceHtml, /id="eval-bar-black-pct"/, 'black-side win-probability pill present in the meter');
assert.match(balanceHtml, /id="eval-stale-badge"/, 'stale cache badge element present');
assert.match(balanceHtml, /g-balance__ribbon/, 'ribbon container present');
assert.match(balanceHtml, /g-balance__fulcrum/, 'morphing fulcrum present');
assert.match(balanceHtml, /eval-side/, 'piece-identity side labels present');
assert.doesNotMatch(balanceHtml, /md-eval__|eval-bar-container|(id|class)="eval-bar-black"/, 'no legacy dual-bar markup');
assert.ok(!/(id|class)="eval-bar-black"|\.eval-bar-black\b/.test(css), 'no dead .eval-bar-black rule in CSS');
assert.match(css, /\.g-balance__fulcrum \{[\s\S]*?left: calc\(var\(--eval-pct/, 'fulcrum position reads --eval-pct');
assert.match(js, /dom\.evalSection\.style\.setProperty\('--eval-pct'/, 'JS sets --eval-pct on the tile (ancestor of the fulcrum)');
assert.ok(css.includes('.eval-bar-pct'), '.eval-bar-pct in-meter pill rule exists');
assert.ok(css.includes('.eval-bar-pct--left') && css.includes('.eval-bar-pct--right'), 'left/right pill placements exist');
assert.ok(css.includes('.g-skeleton'), '.g-skeleton shimmer rule exists in CSS');
assert.match(js, /g-skeleton/, 'JS renders skeleton shimmer with the Gambit class');
assert.match(js, /dom\.evalBarWhitePct/, 'JS sets the white-side win-probability pill');
assert.match(js, /dom\.evalBarBlackPct/, 'JS sets the black-side win-probability pill');
assert.match(js, /dom\.evalBarWhite\.style\.transform/, 'JS drives the single-ended meter via transform');
assert.match(css, /\.spark-line/, 'sparkline stroke rule exists');
assert.match(css, /\.spark-zero/, 'sparkline zero-line rule exists');
assert.match(css, /\.spark-dot/, 'sparkline end-dot rule exists');

// ── 4. Last-move verdict tile contract ──
const verdictHtml = html.match(/<section id="move-class-section"[\s\S]*?<\/section>/)[0];
assert.match(verdictHtml, /aria-live="polite"/, 'verdict tile announces updates politely');
assert.match(verdictHtml, /g-verdict__empty/, 'empty ghost state present in HTML');
assert.ok(css.includes('.g-verdict__stage'), '.g-verdict__stage rule exists');
assert.ok(css.includes('.g-verdict__empty'), '.g-verdict__empty rule exists');
assert.ok(css.includes('.g-verdict__mover'), '.g-verdict__mover rule exists');
assert.match(js, /g-verdict__symbol/, 'JS renders the annotation symbol in its own span');
assert.match(js, /g-verdict__mover/, 'JS renders the move identity line');
assert.match(js, /g-verdict__ring-val/, 'JS renders the accuracy figure');
assert.match(js, /g-verdict__ring-stack/, 'JS renders the ring value stack');
assert.match(js, /renderMoveClassificationEmpty/, 'JS provides empty state handler');
assert.ok(!js.includes('class-badge') && !js.includes('class-accuracy'), 'legacy .class-* chip classes stay gone');

// ── 5. Every component class used by the two tiles has a CSS rule ──
const classUses = new Set();
for (const m of balanceHtml.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach((c) => classUses.add(c));
for (const m of verdictHtml.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach((c) => classUses.add(c));
for (const m of js.matchAll(/class="g-verdict__([a-z-]+)/g)) classUses.add('g-verdict__' + m[1]);
for (const m of js.matchAll(/class="g-balance__([a-z-]+)/g)) classUses.add('g-balance__' + m[1]);
for (const m of js.matchAll(/class="eval-([a-z-]+)/g)) classUses.add('eval-' + m[1]);
// Identity helpers are shared tokens, not tile components.
const SHARED = new Set(['g-t-label', 'g-t-body', 'g-t-num', 'piece-dot', 'piece-dot--light', 'piece-dot--dark']);
const uncovered = [...classUses].filter((c) => c && !SHARED.has(c) && !new RegExp(`\\.${c}\\b`).test(css));
assert.deepEqual(uncovered, [], `tile classes without CSS rules: ${uncovered.join(', ')}`);

// ── 6. Verdict role palette covers every label classifyMove can emit ──
const engineJs = fs.readFileSync(path.join(ROOT, 'engine/hint-engine.js'), 'utf8');
const labels = [...engineJs.matchAll(/label = '([^']+)'/g)].map((m) => m[1].toLowerCase());
assert.ok(labels.length >= 8, 'classifyMove label set found in engine');
for (const label of labels) {
  assert.ok(new RegExp(`data-verdict="${label}"`).test(css), `CSS styles data-verdict="${label}"`);
}

// ── 7. Controller-emitted class families all exist in CSS ──
const emittedFamilies = [
  'g-cap', 'g-cap__icon', 'g-cap__texts', 'g-cap__label', 'g-cap__body',
  'g-alt', 'g-alt--white', 'g-alt--black', 'g-alt__piece', 'g-alt__san',
  'g-alt__meter', 'g-alt__meter-fill', 'g-alt__score', 'g-alt__tag',
  'g-skeleton', 'g-seg__indicator', 'g-slider__fill', 'g-slider__handle',
  'g-engine--off', 'g-engine--inactive', 'g-sheet--closing', 'g-dialog--closing',
  'toast', 'toast-icon', 'toast-message', 'toast-exit', 'dismiss-swipe',
  'status-dot', 'sq', 'sq-arrow', 'sq-piece', 'hint-attack-tag', 'fade-in',
  'spinning', 'is-live', 'is-selected', 'is-ready', 'is-dragging', 'is-bumped',
  'is-scrolled', 'no-position', 'analyzing', 'verified', 'partial', 'pending',
];
const unstyled = emittedFamilies.filter((c) => !new RegExp(`\\.${c.replace(/[-]/g, '\\-')}\\b`).test(css));
assert.deepEqual(unstyled, [], `controller-emitted classes without CSS rules: ${unstyled.join(', ')}`);
for (const kind of ['idea', 'capture', 'sacrifice', 'cost', 'risk', 'kinghunt', 'posture', 'reply']) {
  assert.ok(new RegExp(`\\.g-cap--${kind}\\b`).test(css), `caption kind --${kind} has a CSS rule`);
}
for (const state of ['connecting', 'online', 'analyzing', 'error', 'unknown']) {
  assert.ok(css.includes(`.status-dot.${state}`), `status dot state .${state} styled`);
}
for (const state of ['online', 'unknown', 'error']) {
  assert.ok(css.includes(`.api-status.${state}`), `api-status state .${state} styled`);
}

console.log('panel wiring OK — Gambit system fully wired (HTML ⇄ CSS ⇄ JS)');
