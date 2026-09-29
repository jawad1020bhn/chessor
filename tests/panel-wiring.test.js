'use strict';
// EDUCATIONAL USE ONLY — FAIR-PLAY SAFE
//
// Panel wiring regression guard (DESIGN.md v14 "Flux" contract): the
// Expressive surfaces previously lived only in CSS while the HTML/JS still
// spoke legacy markup — balance pills, the moving fulcrum, the caption rail
// kinds, the move lockup, and the alternatives meters were silently
// disconnected. This test locks the wiring so a future edit cannot
// disconnect the layers again.
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

// ── 2. Design token contract (§2.3, §3, §4, §5, §6, §12) ──
for (const token of ['--piece-white', '--piece-white-on', '--piece-black', '--piece-black-on']) {
  assert.ok(css.includes(`${token}:`), `piece identity token ${token} defined (§2.3)`);
}
for (const token of ['--radius-hero', '--radius-balance', '--radius-verdict', '--radius-sheet', '--radius-dialog', '--radius-pill']) {
  assert.ok(css.includes(`${token}:`), `organic radius recipe ${token} defined (§3)`);
}
for (const token of ['--font-brand', '--font-plain', '--font-mono', '--text-display', '--text-headline',
  '--text-title-lg', '--text-title-sm', '--text-body', '--text-label-lg', '--text-label-md',
  '--text-move', '--text-metric']) {
  assert.ok(css.includes(`${token}:`), `type token ${token} defined (§4)`);
}
for (const token of ['--motion-spatial', '--motion-effects', '--dur-instant', '--dur-fast', '--dur-med', '--dur-slow', '--dur-slower']) {
  assert.ok(css.includes(`${token}:`), `motion token ${token} defined (§5)`);
}
for (const token of ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-8', '--space-10']) {
  assert.ok(css.includes(`${token}:`), `space token ${token} defined (§6)`);
}
for (const token of ['--elevation-1', '--elevation-2', '--elevation-3', '--elevation-appbar']) {
  assert.ok(css.includes(`${token}:`), `elevation token ${token} defined (§7)`);
}
for (const token of ['--icon-check', '--icon-warning', '--icon-error', '--icon-bolt', '--icon-bulb',
  '--icon-crosshair', '--icon-flag', '--icon-trend-down', '--icon-info', '--icon-reply']) {
  assert.ok(css.includes(`${token}:`), `icon mask token ${token} defined (§12)`);
}

// ── 3. Balance tile contract (§8.4) ──
const balanceHtml = html.match(/<section id="eval-section"[\s\S]*?<\/section>/)[0];
assert.match(balanceHtml, /class="balance"/, 'Balance section uses the .balance tile');
assert.match(balanceHtml, /balance__orb/, 'decorative orbs present');
assert.match(balanceHtml, /balance__head/, 'head (kicker + description) present');
assert.match(balanceHtml, /id="eval-bar-white-pct"/, 'white-side win-probability pill present in the meter');
assert.match(balanceHtml, /id="eval-bar-black-pct"/, 'black-side win-probability pill present in the meter');
assert.match(balanceHtml, /id="eval-stale-badge"/, 'stale cache badge element present');
assert.match(balanceHtml, /balance__ribbon/, 'ribbon container present');
assert.match(balanceHtml, /eval-bar__fulcrum/, 'morphing fulcrum present');
assert.match(balanceHtml, /balance__labels/, 'piece-identity side labels present');
assert.match(balanceHtml, /role="meter"/, 'eval bar is a meter (§10)');
assert.match(balanceHtml, /balance__spark/, 'sparkline present (rev 13 feature kept)');
assert.match(css, /\.eval-bar__fulcrum \{[\s\S]*?left: calc\(var\(--eval-pct/, 'fulcrum position reads --eval-pct');
assert.match(js, /dom\.evalSection\.style\.setProperty\('--eval-pct'/, 'JS sets --eval-pct on the tile (ancestor of the fulcrum)');
assert.ok(css.includes('.eval-bar__pct'), '.eval-bar__pct in-meter pill rule exists');
assert.ok(css.includes('.eval-bar__pct--left') && css.includes('.eval-bar__pct--right'), 'left/right pill placements exist');
assert.ok(css.includes('.eval-bar__fill'), '.eval-bar__fill meter fill rule exists');
assert.ok(css.includes('.skeleton'), '.skeleton shimmer rule exists in CSS');
assert.match(js, /dom\.evalPctLeft/, 'JS sets the white-side win-probability pill');
assert.match(js, /dom\.evalPctRight/, 'JS sets the black-side win-probability pill');
assert.ok(!js.includes("evalBar.setAttribute('role', 'slider')"), 'JS must not downgrade the meter role');

// ── 4. Last-move verdict tile contract (§8.6) ──
const verdictHtml = html.match(/<section id="move-class-section"[\s\S]*?<\/section>/)[0];
assert.match(verdictHtml, /aria-live="polite"/, 'verdict tile announces updates politely');
assert.match(verdictHtml, /verdict__empty/, 'empty ghost state present in HTML');
assert.ok(css.includes('.verdict__stage'), '.verdict__stage rule exists');
assert.ok(css.includes('.verdict__empty'), '.verdict__empty rule exists');
assert.ok(css.includes('.verdict__mover'), '.verdict__mover rule exists');
assert.ok(css.includes('.verdict__ring'), '.verdict__ring rule exists');
assert.match(js, /verdict__symbol/, 'JS renders the annotation symbol in its own expressive span');
assert.match(js, /verdict__mover/, 'JS renders the move identity line');
assert.match(js, /verdict__ring-val/, 'JS renders the accuracy figure in the ring');
assert.match(js, /renderMoveClassificationEmpty/, 'JS provides empty state handler');
assert.match(js, /verdict__ring-stack/, 'JS renders the ring stack');

// ── 5. Caption rail contract (§8.3) — every row kind has role CSS ──
const CAPTION_KINDS = ['idea', 'capture', 'sacrifice', 'kinghunt', 'cost', 'risk', 'posture', 'reply'];
for (const kind of CAPTION_KINDS) {
  assert.ok(css.includes(`.caption-rail__row--${kind}`), `caption rail kind --${kind} styled in CSS`);
  assert.ok(css.includes(`--md-icon-`), 'caption icons are mask-based tokens');
}
assert.match(js, /caption-rail__row/, 'JS emits caption rail rows (not legacy idea-item markup)');
assert.ok(!js.includes('idea-item'), 'legacy .idea-item markup removed from JS');
assert.match(js, /CAPTION_KINDS/, 'JS whitelists the §8.3 caption kinds');

// ── 6. Move lockup contract (§8.2) ──
assert.ok(css.includes('.sq-piece'), '.sq-piece hero glyph rule exists');
assert.ok(css.includes('.sq-arrow'), '.sq-arrow rule exists');
assert.ok(css.includes('.move-lockup'), '.move-lockup rule exists');
assert.match(js, /sq-piece/, 'JS renders the piece glyph');
assert.match(js, /parseMoveLockup/, 'JS parses the engine from→to string into a lockup');
assert.ok(!js.includes('fromto-arrow'), 'legacy fromto SVG markup removed from JS');

// ── 7. Alternatives rail contract (§8.8) ──
assert.ok(css.includes('.alt-row__piece'), '.alt-row__piece chip rule exists');
assert.ok(css.includes('.alt-row__meter'), '.alt-row__meter rule exists');
assert.ok(css.includes('.alt-row__meter-fill'), '.alt-row__meter-fill rule exists');
assert.ok(css.includes('.alt-row__tag'), '.alt-row__tag rule exists');
assert.match(js, /alt-row__meter/, 'JS emits meter rows (not legacy alt-item markup)');
assert.ok(!js.includes('alt-item'), 'legacy .alt-item markup removed from JS');
assert.match(js, /--share/, 'JS drives meter fill with --share');

// ── 8. Sheet + dialog visibility is attribute-driven (§8.10) ──
assert.match(css, /\.sheet:not\(\[hidden\]\) \{ display: flex/, 'settings sheet becomes visible when hidden is removed');
assert.ok(!css.includes('#settings-panel'), 'legacy #settings-panel rules removed from CSS');
assert.ok(!css.match(/#shortcut-help \{ display: none/), 'shortcuts dialog not display:none at base');
assert.match(js, /settingsSheet\.hidden = false/, 'JS opens the sheet via the hidden attribute');
assert.ok(!js.includes('.then(') || !js.match(/getManifest\(\)\s*\.then/), 'getManifest is used synchronously');
assert.ok(!js.includes('segmented__indicator'), 'M3E retired sliding indicator is not created (§9.1)');
assert.match(js, /data-expressive-setting/, 'segmented + choice controls wired via data-expressive-setting');
assert.match(js, /roveRadiogroup|ArrowRight/, 'arrow-key roving implemented (§9.1)');

// ── 9. Every component class used by the tiles has a CSS rule ──
const classUses = new Set();
for (const m of balanceHtml.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach((c) => classUses.add(c));
for (const m of verdictHtml.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach((c) => classUses.add(c));
for (const m of js.matchAll(/class="verdict__([a-z-]+)/g)) classUses.add('verdict__' + m[1]);
for (const m of js.matchAll(/class="balance__([a-z-]+)/g)) classUses.add('balance__' + m[1]);
for (const m of js.matchAll(/class="caption-rail__([a-z-]+)/g)) classUses.add('caption-rail__' + m[1]);
for (const m of js.matchAll(/class="alt-row__([a-z-]+)/g)) classUses.add('alt-row__' + m[1]);
for (const m of js.matchAll(/class="sq-([a-z-]+)/g)) classUses.add('sq-' + m[1]);
// State/role helper classes are applied conditionally or share tokens.
const SHARED = new Set([
  'piece-dot', 'piece-dot--white', 'piece-dot--black',
  'sq', 'verdict__stage'
]);
const uncovered = [...classUses].filter((c) => c && !SHARED.has(c) && !new RegExp(`\\.${c}\\b`).test(css));
assert.deepEqual(uncovered, [], `tile classes without CSS rules: ${uncovered.join(', ')}`);

// ── 10. Verdict role palette covers every label classifyMove can emit ──
const engineJs = fs.readFileSync(path.join(ROOT, 'engine/hint-engine.js'), 'utf8');
const labels = [...engineJs.matchAll(/label = '([^']+)'/g)].map((m) => m[1].toLowerCase());
assert.ok(labels.length >= 8, 'classifyMove label set found in engine');
for (const label of labels) {
  assert.ok(new RegExp(`data-verdict="${label}"`).test(css), `CSS styles data-verdict="${label}"`);
}

console.log('panel wiring OK — Flux tiles, rails and controls are fully wired (HTML ⇄ CSS ⇄ JS)');
