'use strict';
/* Interaction wiring smoke in jsdom.
   Run: node scripts/wiring-smoke.js */
const { JSDOM } = require('/home/user/chessor/node_modules/jsdom');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const assert = require('node:assert/strict');
(async () => {
  const dom = new JSDOM(read('sidepanel/sidepanel.html'), { url: 'http://localhost:8123/preview/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  const doc = w.document;
  const winErrs = [];
  w.addEventListener('error', (e) => winErrs.push(String(e.error && e.message || e.message)));
  if (typeof w.ResizeObserver !== 'function') w.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
  if (typeof w.matchMedia !== 'function') w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  for (const s of ['engine/core-utils.js','engine/analysis-contract.js','engine/analysis-policy.js','engine/human-form.js','engine/chaos-attack.js','engine/early-king-hunt.js','engine/cloud-engine.js','engine/hint-engine.js','preview/preview-mock.js']) w.eval(read(s));
  w.eval(read('sidepanel/sidepanel.js'));
  await new Promise(r => setTimeout(r, 2200));
  assert.deepEqual(winErrs, [], 'no window errors during boot: ' + winErrs.join('; '));

  // Open sheet, toggle Human once → exactly one toast (no double-fire).
  w.ChessPanel.openSettingsSheet();
  await new Promise(r => setTimeout(r, 30));
  assert.equal(doc.getElementById('settings-sheet').hidden, false);
  const toastsBefore = doc.querySelectorAll('#toast-container .toast').length;
  doc.querySelector('[data-expressive-setting="setting-human-like-mode"][data-value="on"]').click();
  await new Promise(r => setTimeout(r, 30));
  const toastsAfter = doc.querySelectorAll('#toast-container .toast').length;
  assert.equal(toastsAfter - toastsBefore, 1, 'exactly one toast for human mode toggle');
  assert.equal(doc.getElementById('sparring-strength-row').hidden, false, 'sparring row revealed');
  assert.equal(doc.querySelector('[data-expressive-setting="setting-human-like-mode"][data-value="on"]').getAttribute('aria-checked'), 'true');
  assert.equal(doc.querySelector('[data-expressive-setting="setting-human-like-mode"][data-value="off"]').getAttribute('aria-checked'), 'false');

  // Arrow roving on the style choice stack (§9.1).
  const normalChoice = doc.querySelector('[data-expressive-setting="setting-style"][data-value="normal"]');
  normalChoice.focus();
  normalChoice.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await new Promise(r => setTimeout(r, 30));
  const aggressive = doc.querySelector('[data-expressive-setting="setting-style"][data-value="aggressive"]');
  assert.equal(doc.activeElement === aggressive, true, 'focus moved to next choice');
  assert.equal(aggressive.getAttribute('aria-checked'), 'true', 'selection follows focus');

  // 's' shortcut closes the open sheet, then reopens it.
  doc.body.focus();
  doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 's', bubbles: true }));
  await new Promise(r => setTimeout(r, 20));
  const sheet = doc.getElementById('settings-sheet');
  const closedNow = sheet.classList.contains('open') === false || sheet.hidden;
  assert.equal(closedNow, true, 'S key closes the open sheet');
  await new Promise(r => setTimeout(r, 520));
  doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 's', bubbles: true }));
  await new Promise(r => setTimeout(r, 20));
  assert.equal(sheet.hidden, false, 'S key reopens the sheet');
  assert.equal(doc.getElementById('sheet-scrim').classList.contains('show'), true, 'scrim shows with the sheet');

  // Player side switch: click Black — thumb/aria flip, toast, no ReferenceError.
  const sel = doc.getElementById('player-selector');
  const selectedBefore = sel.dataset.selected;
  doc.querySelector('.player-btn[data-color="b"]').click();
  await new Promise(r => setTimeout(r, 60));
  assert.equal(sel.dataset.selected, selectedBefore === 'b' ? 'w' : 'b', 'side switch flips selection');
  assert.equal(winErrs.filter(e => /selectPlayerColor/.test(e)).length, 0, 'no selectPlayerColor ReferenceError');
  assert.deepEqual(winErrs, [], 'no window errors on side switch: ' + winErrs.join('; '));
  doc.querySelector('.player-btn[data-color="w"]').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await new Promise(r => setTimeout(r, 60));
  assert.equal(sel.dataset.selected, selectedBefore, 'keyboard Enter switches back');

  // Clear caches uses the message the background answers (clear_caches).
  let seen;
  const orig = w.chrome.runtime.sendMessage.bind(w.chrome.runtime);
  w.chrome.runtime.sendMessage = (msg, cb) => { if (msg && msg.type && msg.type.startsWith('clear_')) seen = msg.type; return orig(msg, cb); };
  doc.getElementById('btn-clear-caches').click();
  await new Promise(r => setTimeout(r, 30));
  assert.equal(seen, 'clear_caches', 'panel sends clear_caches (matches background)');

  console.log('✔ wiring smoke: single-fire controls, roving, S-key sheet, side switch, clear_caches message');
  process.exit(0);
})().catch(e => { console.error('WIRING SMOKE FAILED:', e && e.stack || e); process.exit(1); });
