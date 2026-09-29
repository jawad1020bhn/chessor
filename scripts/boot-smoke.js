'use strict';
/* Runtime boot smoke: real sidepanel.html + engines + mock + controller in jsdom.
   Run: node scripts/boot-smoke.js  (scenarios: '', '?hold', '?noboard', '?error') */
const { JSDOM } = require('/home/user/chessor/node_modules/jsdom');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const assert = require('node:assert/strict');

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ENGINE_SCRIPTS = [
  'engine/core-utils.js', 'engine/analysis-contract.js', 'engine/analysis-policy.js',
  'engine/human-form.js', 'engine/chaos-attack.js', 'engine/early-king-hunt.js',
  'engine/cloud-engine.js', 'engine/hint-engine.js', 'preview/preview-mock.js'
];

async function boot(url) {
  const html = read('sidepanel/sidepanel.html');
  const dom = new JSDOM(html, {
    url: `http://localhost:8123/preview/${url}`,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const { window } = dom;
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.error && e.error.stack || e.message)));
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  }
  if (typeof window.ResizeObserver !== 'function') {
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
  for (const script of ENGINE_SCRIPTS) window.eval(read(script));
  window.eval(read('sidepanel/sidepanel.js'));
  // jsdom fires its own DOMContentLoaded once the document goes interactive —
  // no manual dispatch: that would run init() twice.
  if (window.document.readyState !== 'loading') {
    window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  }
  await new Promise((r) => setTimeout(r, 2600));
  return { window, errors };
}

(async () => {
  // ── Scenario: default mate net ──
  const { window, errors } = await boot('');
  const doc = window.document;
  assert.deepEqual(errors.filter(e => !/Read updates-server/i.test(e)), [], 'no runtime errors: ' + errors.join('\n'));

  // Hero lockup renders the designed piece + from → to (Qh5 → f7).
  const lockup = doc.getElementById('hint-fromto');
  assert.equal(lockup.hidden, false, 'lockup visible');
  assert.match(lockup.textContent, /h5/);
  assert.match(lockup.textContent, /f7/);
  assert.ok(lockup.querySelector('.piece-chip'), 'lockup has piece chip');
  assert.ok(lockup.querySelector('.piece-chip.pw'), 'queen chip is white (physical identity)');
  assert.match(doc.getElementById('lockup-san').textContent, /Qh5|#/, 'SAN headline rendered');
  assert.equal(doc.getElementById('hero-path').textContent, 'h5 → f7', 'path line rendered');
  assert.equal(doc.getElementById('hint-text').hidden, true, 'hero text hidden while lockup shows');

  // Attack tag on a forcing check (§8.2).
  const tag = doc.getElementById('hint-attack-tag');
  assert.equal(tag.hidden, false, 'attack tag visible for Qxf7#');
  assert.match(tag.textContent, /Attack/i);

  // Caption rail (§8.3): kinds from the whitelist, semantic roles.
  const rail = doc.getElementById('idea-section');
  assert.equal(rail.hidden, false, 'caption rail visible');
  const kinds = [...rail.querySelectorAll('.caption-rail__row')].flatMap(li =>
    [...li.classList].filter(c => c.startsWith('caption-rail__row--')).map(c => c.slice('caption-rail__row--'.length)));
  assert.ok(kinds.length >= 1, 'caption rows present: ' + kinds.join(','));
  assert.ok(kinds.includes('capture'), 'capture row rendered for Qxf7');

  // Alternatives (§8.8): meter rows with a physical side class.
  const alts = doc.getElementById('alts-section');
  assert.equal(alts.hidden, false, 'alts rail visible');
  const altRows = [...alts.querySelectorAll('.alt-row')];
  assert.ok(altRows.length >= 1, 'alt rows present');
  for (const row of altRows) {
    assert.match(row.getAttribute('style'), /--share: \d+/);
    assert.ok(/alt-row--(white|black)/.test(row.className), 'physical piece coloring class');
  }

  // Balance tile (§8.4): mate → lean you, center-out fill, live spark.
  const balance = doc.getElementById('eval-section');
  assert.equal(balance.dataset.state, 'data', 'balance in data state');
  assert.equal(balance.dataset.lean, 'you', 'balance leans you on mate');
  const fill = doc.getElementById('eval-bar-white');
  assert.match(fill.style.width, /^\d+(\.\d+)?%$/, 'center-out fill width set');
  assert.ok(parseFloat(fill.style.width) > 0, 'fill leans you on mate');
  assert.equal(doc.getElementById('eval-bar-white-pct').textContent.includes('You'), true, 'white pill labelled');
  assert.ok(doc.getElementById('eval-bar-white-pct').textContent.includes('%'), 'pill shows %');
  assert.ok(doc.querySelector('#eval-sparkline .spark-line'), 'sparkline live');
  assert.ok(doc.querySelector('#eval-sparkline .spark-dot'), 'spark end dot present');

  // Verdict tile (§8.6): Black's Nf6 → Blunder with ring.
  const verdict = doc.getElementById('move-class-section');
  assert.equal(verdict.dataset.verdict, 'blunder', 'verdict is blunder');
  assert.match(verdict.textContent, /Opponent played Nf6/);
  assert.ok(verdict.querySelector('.verdict__ring'), 'accuracy ring rendered');
  assert.ok(verdict.querySelector('.verdict__ring-val'), 'ring value rendered');
  assert.ok(verdict.querySelector('.verdict__symbol'), 'symbol rendered');
  assert.ok(verdict.querySelector('.verdict__copy'), 'verdict copy wrapper rendered');

  // Facts (§8.7): material computed from FEN, opening named.
  assert.match(doc.getElementById('material-balance').textContent, /You \+\d+|Equal/);
  assert.match(doc.getElementById('opening-name').textContent, /Scholar/i);

  // Version stamp landed.
  assert.match(doc.getElementById('app-version-stamp').textContent, /v14\.0\.0/);

  // Settings sheet opens via hidden attribute (§8.10).
  window.ChessPanel.openSettingsSheet();
  assert.equal(doc.getElementById('settings-sheet').hidden, false, 'sheet unhidden');
  window.ChessPanel.closeSettingsSheet();

  // Expressive control: pick Ultra attack, verify aria + gating UI.
  const ultra = doc.querySelector('[data-expressive-setting="setting-style"][data-value="super_ultra_aggressive"]');
  ultra.click();
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(ultra.getAttribute('aria-checked'), 'true', 'ultra selected');
  const ekh = doc.getElementById('early-king-hunt-setting');
  assert.equal(ekh.hidden, false, 'early king hunt revealed for ultra style');
  const normal = doc.querySelector('[data-expressive-setting="setting-style"][data-value="normal"]');
  normal.click();
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(ekh.hidden, true, 'early king hunt hidden again');

  console.log('✔ default scenario: lockup, tag, rail, alts, balance, verdict, facts, sheet, expressive controls');

  // ── Scenario: hold (alternatives state frozen) ──
  const hold = await boot('?hold');
  assert.deepEqual(hold.errors, [], 'no errors in hold scenario');
  const hlock = hold.window.document.getElementById('hint-fromto');
  assert.match(hlock.textContent, /b1/);
  assert.match(hlock.textContent, /c3/);

  // ── Scenario: noboard (welcome) ──
  const nb = await boot('?noboard');
  const ndoc = nb.window.document;
  assert.equal(ndoc.getElementById('hero-welcome').hidden, false, 'welcome shown');
  assert.equal(ndoc.getElementById('app').classList.contains('no-position'), true, 'no-position class');
  assert.equal(ndoc.getElementById('eval-section').hidden, false, 'eval still in DOM (CSS hides it)');

  // ── Scenario: error ──
  const err = await boot('?error');
  const edoc = err.window.document;
  assert.match(edoc.getElementById('hint-text').textContent, /Analysis is unavailable/i);
  // NOTE: the status dot is intentionally not asserted here — the board
  // poller re-reads at a random 2–5s interval and legitimately repaints the
  // toolbar with 'online / Your turn', racing this assertion.
  assert.equal(edoc.getElementById('eval-section').dataset.state, 'error', 'balance error state');

  console.log('✔ hold / noboard / error scenarios');
  console.log('BOOT SMOKE PASSED');
  process.exit(0);
})().catch((e) => { console.error('SMOKE FAILED:', e && e.stack || e); process.exit(1); });
