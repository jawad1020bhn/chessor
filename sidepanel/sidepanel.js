/**
 * Chess Coach — Side Panel Controller v14 "Flux"
 * Material 3 Expressive design system, turn-based analysis, cloud + human-like.
 * EDUCATIONAL USE ONLY — FAIR-PLAY SAFE
 */

(function () {
  'use strict';

  // ─── State ─────────────────────────────────────────────────────────
  let currentFen = null;
  let lastPositionFen = null;
  let lastAnalyzedFen = null;
  let playerColor = null;
  let assistedPlayerColor = null;
  let activeTabId = 'active';
  let positionReliable = false;
  let turnReliable = false;
  const EXACT_HINT_LEVEL = 5;
  let lastAnalysis = null;
  let prevEval = null;
  let prevScoreType = 'cp';
  let evalHistory = [];
  let lastCriticalAlert = null;
  let isRefreshing = false;
  let refreshSafetyTimer = null;
  let humanPlanState = null;

  const normalizeStyle = (style) => {
    if (['normal', 'aggressive', 'super_ultra_aggressive'].includes(style)) return style;
    return ['super_aggressive', 'ultra_aggressive_steam', 'kamikaze', 'berserker'].includes(style)
      ? 'super_ultra_aggressive' : 'normal';
  };

  let settings = {
    analysisQuality: 'auto',
    candidateLines: 'auto',
    style: 'normal',
    earlyKingHuntEnabled: false,
    humanLikeMode: false,
    sparringStrength: 1100,
    autoAnalyze: true,
    showThreats: true,
    showCriticalMoments: true,
    showOpeningExplorer: true,
    showTablebase: true,
    useChessApi: true,
    useLichessCloud: true,
    useMaia3: true,
    useMastersExplorer: true,
    maiaOnlyMode: false,
    maiaRating: 1500,
    maiaCandidateLines: 'auto'
  };

  const SOURCE_NAMES = {
    'chess-api': 'Chess-API', 'lichess-cloud': 'Lichess Cloud', 'maia3': 'Maia 3',
    'masters-explorer': 'Masters DB', 'opening-explorer': 'Opening Cache',
    'tablebase': 'Tablebase', 'local-engine': 'Local engine'
  };

  function sourceDisplayName(source, data) {
    const base = SOURCE_NAMES[source] || source || '–';
    if (source === 'maia3' && data && Number.isFinite(Number(data.maiaRating))) {
      return `${base} · ${data.maiaRating}`;
    }
    return base;
  }

  const STYLE_DESCRIPTIONS = {
    normal: 'Objective best play, reliable conversion, and solid defense.',
    aggressive: 'Win as fast as possible through sound, forcing play.',
    super_ultra_aggressive: 'Fearless, organized attack: build up soundly, then break through with checks, pawn storms, forks, pins and bold sacrifices to finish fast.'
  };

  function updateStyleDescription() {
    const el = document.getElementById('style-description');
    if (!el) return;
    el.textContent = STYLE_DESCRIPTIONS[settings.style] || STYLE_DESCRIPTIONS.normal;
  }

  function isEarlyKingHuntActive() {
    return settings.style === 'super_ultra_aggressive' && settings.earlyKingHuntEnabled === true;
  }

  function updateEarlyKingHuntUI() {
    const container = document.getElementById('early-king-hunt-setting');
    const checkbox = document.getElementById('setting-early-king-hunt');
    if (!container || !checkbox) return;
    const styleAllows = settings.style === 'super_ultra_aggressive';
    container.hidden = !styleAllows;
    container.setAttribute('aria-hidden', styleAllows ? 'false' : 'true');
    checkbox.disabled = !styleAllows;
    checkbox.checked = settings.earlyKingHuntEnabled === true;
  }

  // ─── Dom Refs & Helpers ───────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const h = (value) => ChessCore.escapeHtml(value);
  const clamp = (value, min, max, fallback = min) => ChessCore.clampNumber(value, min, max, fallback);

  const dom = {
    engineStatus: $('#engine-status'),
    statusDot: $('.status-dot'),
    statusText: $('.status-text'),
    positionContext: $('#position-context'),
    positionTurn: $('#position-turn'),
    evalBarFill: $('#eval-bar-white'),
    evalBar: $('#eval-bar'),
    evalSection: $('#eval-section'),
    evalPctLeft: $('#eval-bar-white-pct'),
    evalPctRight: $('#eval-bar-black-pct'),
    evalStaleBadge: $('#eval-stale-badge'),
    evalWhiteLabel: $('#eval-white-label'),
    evalBlackLabel: $('#eval-black-label'),
    evalDescription: $('#eval-description'),
    openingName: $('#opening-name'),
    gamePhase: $('#game-phase'),
    analysisQuality: $('#analysis-quality'),
    analysisSource: $('#analysis-source'),
    materialBalance: $('#material-balance'),
    hintText: $('#hint-text'),
    hintFromTo: $('#hint-fromto'),
    hintAttackTag: $('#hint-attack-tag'),
    heroWelcome: $('#hero-welcome'),
    hintCard: $('#hint-card'),
    ideaSection: $('#idea-section'),
    ideaList: $('#idea-list'),
    altsSection: $('#alts-section'),
    altsList: $('#alts-list'),
    evalSpark: $('#eval-sparkline'),
    moveClassSection: $('#move-class-section'),
    moveClassDisplay: $('#move-class-display'),
    settingsSheet: $('#settings-sheet'),
    btnSettings: $('#btn-settings'),
    btnCloseSettings: $('#btn-close-settings'),
    btnRefresh: $('#btn-refresh'),
    btnHealthCheck: $('#btn-health-check'),
    btnClearCaches: $('#btn-clear-caches'),
    playerSelector: $('#player-selector'),
    criticalMomentSection: $('#critical-moment-section'),
    criticalMomentText: $('#critical-moment-text'),
    criticalMomentDetail: $('#critical-moment-detail'),
    correlationStat: $('#correlation-stat')
  };

  // ─── Engine Groups ────────────────────────────────────────────────
  let healthCheckInFlight = false;

  function isMaiaOnlyActive() { return settings.maiaOnlyMode === true; }

  function updateEngineGroups() {
    const toggles = {
      'chess-api': 'setting-use-chess-api',
      'lichess-cloud': 'setting-use-lichess-cloud',
      'maia3': 'setting-use-maia3',
      'masters-explorer': 'setting-use-masters-explorer'
    };
    $$('.engine-group[data-engine]').forEach(group => {
      if (group.dataset.engine === 'engine-style') {
        const chessApi = $('#setting-use-chess-api');
        const lichess = $('#setting-use-lichess-cloud');
        const bothOff = (chessApi ? !chessApi.checked : false) && (lichess ? !lichess.checked : false);
        group.classList.toggle('engine-group--off', bothOff);
        return;
      }
      const toggle = $(`#${toggles[group.dataset.engine]}`);
      group.classList.toggle('engine-group--off', toggle ? !toggle.checked : false);
    });
  }

  function updateMaiaOnlyUI() {
    const maiaOnly = isMaiaOnlyActive();
    const block = $('#maia-settings-block');
    if (block) {
      block.hidden = !maiaOnly;
      block.setAttribute('aria-hidden', maiaOnly ? 'false' : 'true');
    }
    $$('.engine-group[data-engine]').forEach(group => {
      if (group.dataset.engine !== 'maia3') group.classList.toggle('engine-group--inactive', maiaOnly);
    });
    const gated = ['setting-style', 'setting-human-like-mode', 'setting-sparring-strength',
      'setting-analysis-quality', 'setting-candidate-lines',
      'setting-use-chess-api', 'setting-use-lichess-cloud', 'setting-use-masters-explorer'];
    for (const id of gated) {
      const el = $(`#${id}`);
      if (el) el.disabled = maiaOnly;
    }
    $$('.choice-stack .choice').forEach(btn => {
      btn.setAttribute('aria-disabled', maiaOnly ? 'true' : 'false');
    });
    $$('.human-mode-opt').forEach(btn => {
      btn.setAttribute('aria-disabled', maiaOnly ? 'true' : 'false');
    });
  }

  // ─── Turn-Based State ──────────────────────────────────────────────
  let isPlayerTurn = true;
  let waitingForOpponent = false;
  let turnJustChanged = false;
  let lastEngineRecommendationFen = null;
  let lastEngineRecommendationUci = null;

  // ─── Board Reading ────────────────────────────────────────────────
  let boardReadTimer = null;
  const READ_INTERVAL_MIN = 2000;
  const READ_INTERVAL_MAX = 5000;

  function startBoardReading() {
    if (boardReadTimer) return;
    readBoardFromBackground();
    scheduleNextRead();
  }
  function stopBoardReading() {
    if (boardReadTimer) { clearTimeout(boardReadTimer); boardReadTimer = null; }
  }
  function scheduleNextRead() {
    const delay = READ_INTERVAL_MIN + Math.random() * (READ_INTERVAL_MAX - READ_INTERVAL_MIN);
    boardReadTimer = setTimeout(async () => {
      await readBoardFromBackground();
      scheduleNextRead();
    }, delay);
  }
  async function readBoardFromBackground() {
    try {
      const result = await chrome.runtime.sendMessage({ type: 'read_board' });
      if (result && result.fen) {
        activeTabId = result.tabId ?? activeTabId;
        chrome.runtime.sendMessage({ type: 'panel_state', open: true, tabId: activeTabId }).catch(() => {});
        handlePositionUpdate({
          fen: result.fen,
          playerColor: result.playerColor,
          positionReliable: result.positionReliable === true,
          turnReliable: result.turnReliable === true,
          fenSource: result.fenSource || 'dom-placement',
          gameInfo: { site: result.site, url: result.url, timestamp: result.timestamp, moveHistory: [], tabId: activeTabId }
        });
      }
    } catch (e) {}
  }

  // ─── Toast System ─────────────────────────────────────────────────
  const TOAST_DURATION = 3500;
  const TOAST_MAX = 3;

  function showToast(message, type = 'info', duration = TOAST_DURATION) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    while (container.children.length >= TOAST_MAX) {
      const oldest = container.firstElementChild;
      if (oldest) oldest.remove();
    }
    const safeType = Object.hasOwn({ success: 1, error: 1, warning: 1, info: 1 }, type) ? type : 'info';
    const toast = document.createElement('div');
    toast.className = `toast toast-${safeType}`;
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.setAttribute('aria-hidden', 'true');
    const messageElement = document.createElement('span');
    messageElement.className = 'toast-message';
    messageElement.textContent = String(message ?? '');
    toast.append(icon, messageElement);
    container.appendChild(toast);
    attachSwipeDismiss(toast);
    setTimeout(() => {
      if (!toast.isConnected) return;
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function attachSwipeDismiss(toast) {
    let startX = null;
    let dx = 0;
    const settle = () => {
      if (startX === null) return;
      startX = null;
      if (Math.abs(dx) > 56) {
        toast.classList.add('dismiss-swipe');
        toast.style.transform = `translateX(${dx > 0 ? 130 : -130}%)`;
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 240);
      } else if (dx !== 0) {
        toast.classList.add('dismiss-swipe');
        toast.style.transform = '';
        setTimeout(() => toast.classList.remove('dismiss-swipe'), 240);
      }
      dx = 0;
    };
    toast.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      try { toast.setPointerCapture(e.pointerId); } catch (err) {}
    });
    toast.addEventListener('pointermove', (e) => {
      if (startX === null) return;
      dx = e.clientX - startX;
      if (Math.abs(dx) > 4) toast.style.transform = `translateX(${dx}px)`;
    });
    toast.addEventListener('pointerup', settle);
    toast.addEventListener('pointercancel', settle);
  }

  // ─── Keyboard Shortcuts ──────────────────────────────────────────
  let shortcutHelpVisible = false;
  const shortcutDialog = document.getElementById('shortcut-help');
  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function openShortcuts() {
    if (!shortcutDialog) return;
    shortcutHelpVisible = true;
    shortcutDialog.classList.remove('dialog--closing');
    shortcutDialog.hidden = false;
    const closeBtn = document.getElementById('btn-close-shortcut-help');
    if (closeBtn) closeBtn.focus();
  }

  function closeShortcuts() {
    if (!shortcutDialog || shortcutDialog.hidden) return;
    shortcutHelpVisible = false;
    shortcutDialog.classList.add('dialog--closing');
    setTimeout(() => {
      shortcutDialog.hidden = true;
      shortcutDialog.classList.remove('dialog--closing');
      if (dom.btnSettings) dom.btnSettings.focus();
    }, REDUCED_MOTION ? 0 : 200);
  }

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      switch (key) {
        case 'r':
          e.preventDefault();
          if (dom.btnRefresh) dom.btnRefresh.click();
          break;
        case 's':
          e.preventDefault();
          if (dom.settingsSheet && dom.settingsSheet.classList.contains('sheet--closing')) {
            openSettingsSheet();
          } else if (dom.settingsSheet && !dom.settingsSheet.hidden) {
            closeSettingsSheet();
          } else {
            openSettingsSheet();
          }
          break;
        case 'escape':
          if (shortcutHelpVisible) { closeShortcuts(); }
          else if (dom.settingsSheet && !dom.settingsSheet.hidden) { closeSettingsSheet(); }
          break;
        case '?':
          e.preventDefault();
          if (shortcutHelpVisible) closeShortcuts();
          else openShortcuts();
          break;
      }
    });
  }

  function initDialogFocusTrap() {
    if (!shortcutDialog) return;
    const FOCUSABLE = 'button, [href], [tabindex]:not([tabindex="-1"])';
    shortcutDialog.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(shortcutDialog.querySelectorAll(FOCUSABLE))
        .filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  function initSettingsFocusTrap() {
    if (!dom.settingsSheet) return;
    const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(dom.settingsSheet.querySelectorAll(FOCUSABLE))
      .filter(el => el.offsetParent !== null && !el.disabled);
    dom.settingsSheet.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
    const observer = new MutationObserver(() => {
      const isVisible = !dom.settingsSheet.hidden;
      if (isVisible) {
        const focusable = getFocusable();
        if (focusable.length > 0 && !dom.settingsSheet.contains(document.activeElement)) {
          focusable[0].focus();
        }
      }
    });
    observer.observe(dom.settingsSheet, { attributes: true, attributeFilter: ['style'] });
  }

  // ─── Move Inference ────────────────────────────────────────────────
  function inferMoveSan(prevFen, currFen) {
    if (!prevFen || !currFen || !window.ChessCore || typeof window.ChessCore.inferTransition !== 'function') return null;
    const t = window.ChessCore.inferTransition(prevFen, currFen);
    if (!t || !t.from || !t.to) return null;
    const fromSquare = String.fromCharCode(97 + t.from.c) + (8 - t.from.r);
    const toSquare = String.fromCharCode(97 + t.to.c) + (8 - t.to.r);
    let promo = '';
    if (t.from.before && t.from.before.toLowerCase() === 'p' && (t.to.r === 0 || t.to.r === 7)) {
      if (t.to.after && t.to.after.toLowerCase() !== 'p') {
        promo = t.to.after.toLowerCase();
      }
    }
    const uci = fromSquare + toSquare + promo;
    if (window.ChessHintEngine && typeof window.ChessHintEngine.uciToSan === 'function') {
      return window.ChessHintEngine.uciToSan(uci, prevFen);
    }
    return uci;
  }

  // ─── Balance States ────────────────────────────────────────────────
  function setBalanceLoadingState(hasPrevScore = false) {
    if (dom.evalSection) dom.evalSection.dataset.state = 'loading';
    if (dom.evalStaleBadge) dom.evalStaleBadge.style.display = 'none';
    if (!hasPrevScore) {
      renderBalanceSkeleton();
    } else if (dom.evalDescription) {
      dom.evalDescription.textContent = 'Analyzing position…';
    }
  }

  function renderBalanceSkeleton() {
    if (dom.evalDescription) {
      dom.evalDescription.innerHTML = '<span class="skeleton" style="width:58%">&#8203;</span>';
    }
    if (dom.evalWhiteLabel) {
      dom.evalWhiteLabel.innerHTML = '<span class="skeleton" style="width:3.5ch">&#8203;</span>';
    }
    if (dom.evalBlackLabel) {
      dom.evalBlackLabel.innerHTML = '<span class="skeleton" style="width:3.5ch">&#8203;</span>';
    }
  }

  function setBalanceErrorState(errorMsg = 'Analysis unavailable') {
    if (dom.evalSection) {
      dom.evalSection.dataset.state = 'error';
      dom.evalSection.dataset.lean = 'even';
      dom.evalSection.style.setProperty('--eval-pct', '50');
    }
    if (dom.evalDescription) dom.evalDescription.textContent = errorMsg;
    if (dom.evalStaleBadge) dom.evalStaleBadge.style.display = 'none';
    if (dom.evalWhiteLabel) dom.evalWhiteLabel.textContent = '—';
    if (dom.evalBlackLabel) dom.evalBlackLabel.textContent = '—';
    if (dom.evalBarFill) dom.evalBarFill.style.transform = 'scaleX(0.5)';
    renderEvalSparkline();
  }

  function setBalanceEmptyState() {
    if (dom.evalSection) {
      dom.evalSection.dataset.state = 'empty';
      dom.evalSection.dataset.lean = 'even';
      dom.evalSection.style.setProperty('--eval-pct', '50');
    }
    if (dom.evalDescription) dom.evalDescription.textContent = 'Waiting for analysis…';
    if (dom.evalStaleBadge) dom.evalStaleBadge.style.display = 'none';
    if (dom.evalWhiteLabel) dom.evalWhiteLabel.textContent = '—';
    if (dom.evalBlackLabel) dom.evalBlackLabel.textContent = '—';
    if (dom.evalBarFill) dom.evalBarFill.style.transform = 'scaleX(0.5)';
    renderEvalSparkline();
  }

  // ─── Settings Loading & Saving ─────────────────────────────────────
  function loadSettings() {
    chrome.storage.local.get('settings', (result) => {
      if (result.settings) {
        const migrated = window.AnalysisPolicy
          ? window.AnalysisPolicy.migrateLegacySettings(result.settings)
          : result.settings;
        settings = {
          ...settings,
          ...migrated,
          style: normalizeStyle(migrated.style),
          earlyKingHuntEnabled: migrated.earlyKingHuntEnabled === true,
          maiaOnlyMode: migrated.maiaOnlyMode === true,
          maiaRating: (() => {
            const r = Math.round(Number(migrated.maiaRating));
            return Number.isFinite(r) ? Math.max(600, Math.min(2600, Math.round(r / 100) * 100)) : 1500;
          })(),
          analysisQuality: window.AnalysisPolicy
            ? window.AnalysisPolicy.normalizeQuality(migrated.analysisQuality)
            : (migrated.analysisQuality || 'auto'),
          candidateLines: window.AnalysisPolicy
            ? window.AnalysisPolicy.normalizeCandidateLines(migrated.candidateLines)
            : (migrated.candidateLines || 'auto'),
          maiaCandidateLines: window.AnalysisPolicy
            ? window.AnalysisPolicy.normalizeCandidateLines(migrated.maiaCandidateLines)
            : (migrated.maiaCandidateLines || 'auto')
        };
        applySettingsToUI();
        if (settings.style !== migrated.style) chrome.storage.local.set({ settings });
        if (lastAnalysis) renderAnalysis(lastAnalysis);
      }
    });
    chrome.storage.local.get('assistedPlayerColor', (result) => {
      if (result.assistedPlayerColor) {
        assistedPlayerColor = result.assistedPlayerColor;
        updatePlayerSelectorUI();
      }
    });
  }

  function saveSettings() {
    return Promise.all([
      chrome.storage.local.set({ settings }),
      chrome.storage.local.set({ assistedPlayerColor })
    ]);
  }

  function applySettingsToUI() {
    const mapping = {
      'setting-analysis-quality': settings.analysisQuality,
      'setting-candidate-lines': settings.candidateLines,
      'setting-style': settings.style,
      'setting-early-king-hunt': settings.earlyKingHuntEnabled,
      'setting-human-like-mode': settings.humanLikeMode,
      'setting-sparring-strength': settings.sparringStrength,
      'setting-auto-analyze': settings.autoAnalyze,
      'setting-show-threats': settings.showThreats,
      'setting-show-critical-moments': settings.showCriticalMoments,
      'setting-use-chess-api': settings.useChessApi,
      'setting-use-lichess-cloud': settings.useLichessCloud,
      'setting-use-maia3': settings.useMaia3,
      'setting-use-masters-explorer': settings.useMastersExplorer,
      'setting-maia-only': settings.maiaOnlyMode,
      'setting-maia-rating': settings.maiaRating,
      'setting-maia-lines': settings.maiaCandidateLines
    };
    Object.entries(mapping).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = val;
      else el.value = val;
    });
    const humanStatus = document.querySelector('.human-mode-status');
    if (humanStatus) humanStatus.textContent = settings.humanLikeMode ? 'On' : 'Off';
    const strengthRow = document.getElementById('sparring-strength-row');
    if (strengthRow) strengthRow.hidden = !settings.humanLikeMode;
    const strengthOutput = document.getElementById('sparring-strength-value');
    if (strengthOutput) strengthOutput.textContent = String(settings.sparringStrength);
    const thinkingNote = document.getElementById('human-thinking-note');
    if (thinkingNote) thinkingNote.hidden = !settings.humanLikeMode;
    const maiaRatingOutput = document.getElementById('maia-rating-value');
    if (maiaRatingOutput) maiaRatingOutput.textContent = String(settings.maiaRating);
    updateEngineGroups();
    updateMaiaOnlyUI();
    $$('.human-mode-opt').forEach(btn => {
      const active = (btn.dataset.mode === 'on') === settings.humanLikeMode;
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    updateStyleDescription();
    updateEarlyKingHuntUI();
    syncAllSegments();
  }

  // ─── Sliders ───────────────────────────────────────────────────────
  function initMdSliders() {
    $$('[data-md-slider]').forEach((slider) => {
      const input = slider.querySelector('input[type="range"]');
      const fill = slider.querySelector('.slider__fill');
      const handle = slider.querySelector('.slider__handle');
      if (!input || !fill || !handle) return;
      const render = () => {
        const min = Number(input.min) || 0;
        const max = Number(input.max) || 100;
        const frac = Math.min(1, Math.max(0, (Number(input.value) - min) / (max - min)));
        fill.style.width = `${frac * 100}%`;
        handle.style.left = `${frac * 100}%`;
      };
      let bumpTimer = null;
      const bumpChip = () => {
        const chip = document.getElementById('sparring-strength-value');
        if (!chip) return;
        chip.classList.add('is-bumped');
        clearTimeout(bumpTimer);
        bumpTimer = setTimeout(() => chip.classList.remove('is-bumped'), 140);
      };
      input.addEventListener('input', () => { render(); bumpChip(); });
      input.addEventListener('pointerdown', () => slider.classList.add('is-dragging'));
      window.addEventListener('pointerup', () => slider.classList.remove('is-dragging'));
      render();
    });
  }

  // ─── Segmented Controls ───────────────────────────────────────────
  const segmentedGroups = [];

  function layoutSegmented(group) {
    if (!group) return;
    const selected = group.querySelector('[aria-checked="true"]');
    if (!selected) {
      group.classList.remove('is-ready');
      return;
    }
    if (group.offsetWidth === 0 || selected.offsetWidth === 0) {
      group.classList.remove('is-ready');
      return;
    }
    group.style.setProperty('--seg-x', `${selected.offsetLeft}px`);
    group.style.setProperty('--seg-y', `${selected.offsetTop}px`);
    group.style.setProperty('--seg-w', `${selected.offsetWidth}px`);
    group.style.setProperty('--seg-h', `${selected.offsetHeight}px`);
    group.classList.add('is-ready');
  }

  function syncAllSegments() {
    segmentedGroups.forEach(layoutSegmented);
  }

  function initSegmentedControls() {
    $$('.segmented[role="radiogroup"]').forEach((group) => {
      if (!group.querySelector('.segmented__indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'segmented__indicator';
        indicator.setAttribute('aria-hidden', 'true');
        group.prepend(indicator);
      }
      segmentedGroups.push(group);
      if (typeof ResizeObserver === 'function') {
        new ResizeObserver(() => layoutSegmented(group)).observe(group);
      }
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => syncAllSegments()).catch(() => {});
    }
    requestAnimationFrame(syncAllSegments);
  }

  // ─── Player Selector ──────────────────────────────────────────────
  function updatePlayerSelectorUI() {
    if (!dom.playerSelector) return;
    $$('.player-btn').forEach(btn => {
      const selected = btn.dataset.color === assistedPlayerColor;
      btn.classList.toggle('active', selected);
      btn.setAttribute('aria-checked', selected ? 'true' : 'false');
    });
    dom.playerSelector.dataset.selected = assistedPlayerColor || 'w';
  }

  // ─── Settings Sheets ──────────────────────────────────────────────
  let settingsSheetCloseTimer = null;

  function openSettingsSheet() {
    if (!dom.settingsSheet) return;
    if (settingsSheetCloseTimer) clearTimeout(settingsSheetCloseTimer);
    dom.settingsSheet.classList.remove('sheet--closing');
    dom.settingsSheet.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(syncAllSegments));
    runHealthCheck();
  }

  function closeSettingsSheet() {
    if (!dom.settingsSheet) return;
    if (!dom.settingsSheet.hidden || dom.settingsSheet.classList.contains('sheet--closing')) {
      dom.settingsSheet.classList.add('sheet--closing');
      settingsSheetCloseTimer = setTimeout(() => {
        dom.settingsSheet.hidden = true;
        dom.settingsSheet.classList.remove('sheet--closing');
        settingsSheetCloseTimer = null;
      }, REDUCED_MOTION ? 0 : 210);
    }
  }

  // ─── Health Check ─────────────────────────────────────────────────
  function formatCooldown(ms) {
    const totalSeconds = Math.max(0, Math.ceil((ms || 0) / 1000));
    if (totalSeconds < 60) return `${totalSeconds}s`;
    return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
  }

  function renderPassiveProvider(element, result) {
    if (!element) return;
    if (!result) {
      element.textContent = 'No recent data';
      element.className = 'api-status unknown';
      return;
    }
    const suffix = result.cooldownRemainingMs > 0 ? ` ${formatCooldown(result.cooldownRemainingMs)}` : '';
    element.textContent = `${result.label || 'No recent data'}${suffix}`;
    const healthy = result.state === 'healthy';
    const slow = result.state === 'slow';
    element.className = `api-status ${healthy ? 'online' : (slow || result.state === 'unknown' ? 'unknown' : 'error')}`;
  }

  function renderApiDiagnostics(diagnostics) {
    if (!diagnostics) return;
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = String(value ?? 0); };
    setText('api-cache-avoided', diagnostics.remoteCallsAvoidedByCache);
    setText('api-requests-coalesced', diagnostics.requestsCoalesced);
    setText('api-stale-served', diagnostics.staleResultsServed);
    setText('api-stale-dropped', diagnostics.staleJobsDropped);
    const calls = document.getElementById('api-provider-calls');
    if (calls) {
      const labels = {
        chessApi: 'Chess-API', lichessCloud: 'Lichess Cloud', maia3: 'Maia 3', mastersExplorer: 'Masters DB',
        openingExplorer: 'Opening', tablebase: 'Tablebase'
      };
      calls.textContent = Object.entries(diagnostics.providers || {})
        .map(([provider, data]) => `${labels[provider] || provider}: ${data.calls || 0} call${data.calls === 1 ? '' : 's'} · ${data.label || 'No recent data'}`)
        .join(' | ') || 'No remote calls yet';
    }
  }

  function runHealthCheck() {
    if (healthCheckInFlight) return;
    healthCheckInFlight = true;
    if (dom.btnHealthCheck) {
      dom.btnHealthCheck.disabled = true;
      dom.btnHealthCheck.textContent = 'Refreshing...';
    }
    const restoreButton = () => {
      healthCheckInFlight = false;
      if (dom.btnHealthCheck) {
        dom.btnHealthCheck.disabled = false;
        dom.btnHealthCheck.textContent = 'Refresh status';
      }
    };
    const safetyTimer = setTimeout(restoreButton, 5000);
    chrome.runtime.sendMessage({ type: 'health_check' }, results => {
      clearTimeout(safetyTimer);
      restoreButton();
      if (chrome.runtime.lastError || !results) return;
      renderPassiveProvider(document.getElementById('health-chessapi'), results['chess-api']);
      renderPassiveProvider(document.getElementById('health-lichess'), results.lichess);
      renderPassiveProvider(document.getElementById('health-maia3'), results.maia3);
      renderPassiveProvider(document.getElementById('health-masters'), results.masters);
      renderPassiveProvider(document.getElementById('health-opening'), results.opening);
      renderPassiveProvider(document.getElementById('health-tablebase'), results.tablebase);
      renderApiDiagnostics(results.diagnostics);
    });
  }

  // ─── Message Handler ──────────────────────────────────────────────
  function handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'analysis_update': handleAnalysisResult(message.data); break;
      case 'analysis_error': handleAnalysisError(message.data); break;
      case 'turn_status_update': handleTurnStatusUpdate(message.data); break;
      case 'opening_data_update': handleOpeningDataUpdate(message.data); break;
    }
    return false;
  }

  function updatePositionContext() {
    if (!dom.positionContext || !dom.positionTurn) return;
    const verified = positionReliable && turnReliable;
    dom.positionContext.classList.toggle('verified', verified);
    dom.positionContext.classList.toggle('partial', !positionReliable && turnReliable);
    dom.positionContext.classList.toggle('pending', !turnReliable);
    dom.positionTurn.textContent = !turnReliable
      ? 'Waiting for a game'
      : (isPlayerTurn ? 'Your turn' : 'Opponent turn');
  }

  function syncWelcome() {
    const app = document.getElementById('app');
    if (app) app.classList.toggle('no-position', !currentFen);
    if (dom.heroWelcome) dom.heroWelcome.hidden = Boolean(currentFen);
  }

  function updateEngineStatus(status, text) {
    if (dom.statusDot) dom.statusDot.className = `status-dot ${status}`;
    if (dom.statusText) dom.statusText.textContent = text;
    const app = document.getElementById('app');
    if (app) app.classList.toggle('analyzing', status === 'analyzing' || status === 'connecting');
  }

  // ─── Position Handling ────────────────────────────────────────────
  function isNewGame(oldFen, newFen) {
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const newPlacement = newFen.split(' ')[0];
    const startPlacement = startFen.split(' ')[0];
    if (newPlacement === startPlacement && oldFen.split(' ')[0] !== startPlacement) return true;
    const oldMoveNum = parseInt(oldFen.split(' ')[5]) || 1;
    const newMoveNum = parseInt(newFen.split(' ')[5]) || 1;
    if (newMoveNum < oldMoveNum - 2) return true;
    return false;
  }

  function handlePositionUpdate(message) {
    const prevFen = currentFen;
    currentFen = message.fen;
    if (prevFen && prevFen !== currentFen) lastPositionFen = prevFen;
    syncWelcome();
    const positionChanged = !prevFen || prevFen.split(' ').slice(0, 4).join(' ') !== currentFen.split(' ').slice(0, 4).join(' ');
    playerColor = message.playerColor || 'w';
    positionReliable = message.positionReliable === true;
    turnReliable = message.turnReliable === true;
    if (assistedPlayerColor === null) {
      assistedPlayerColor = playerColor;
      updatePlayerSelectorUI();
      saveSettings();
    }
    if (prevFen && currentFen && isNewGame(prevFen, currentFen)) {
      evalHistory = [];
      prevEval = null;
      prevScoreType = 'cp';
      lastCriticalAlert = null;
      lastPositionFen = null;
      lastAnalyzedFen = null;
      isPlayerTurn = true;
      waitingForOpponent = false;
      renderMoveClassificationEmpty();
      setBalanceEmptyState();
      chrome.runtime.sendMessage({ type: 'reset_correlation' }).catch(() => {});
      if (window.ChessHintEngine && typeof window.ChessHintEngine.resetSacrificeHistory === 'function') {
        window.ChessHintEngine.resetSacrificeHistory();
      }
      lastEngineRecommendationFen = null;
      lastEngineRecommendationUci = null;
      humanPlanState = null;
    }

    const activeColor = currentFen ? (currentFen.split(' ')[1] || 'w') : 'w';
    const effectiveColor = assistedPlayerColor || playerColor || 'w';
    const wasPlayerTurn = isPlayerTurn;
    isPlayerTurn = activeColor === effectiveColor;
    waitingForOpponent = !isPlayerTurn;
    turnJustChanged = !wasPlayerTurn && isPlayerTurn;
    updatePositionContext();

    if (wasPlayerTurn && !isPlayerTurn && lastEngineRecommendationFen && lastEngineRecommendationUci) {
      tryReportPlayerMove(lastEngineRecommendationFen, lastEngineRecommendationUci, currentFen);
      lastEngineRecommendationFen = null;
      lastEngineRecommendationUci = null;
    }

    if (!turnReliable) {
      isPlayerTurn = false;
      waitingForOpponent = false;
      updateEngineStatus('unknown', 'Turn unavailable: waiting for a verified position');
      if (dom.hintText) dom.hintText.textContent = 'Turn information is unavailable for this board.';
      if (dom.hintFromTo) dom.hintFromTo.style.display = 'none';
      hideIdeaRail();
      return;
    }

    if (isPlayerTurn) {
      if (positionChanged && (settings.autoAnalyze || turnJustChanged)) requestAnalysis();
      updateEngineStatus(wasPlayerTurn ? 'online' : 'analyzing', turnJustChanged ? 'Your turn: analyzing...' : 'Your turn');
    } else {
      const playerLabel = effectiveColor === 'w' ? 'White' : 'Black';
      updateEngineStatus('online', `Opponent's turn: waiting...`);
      if (dom.hintText && !lastAnalysis) {
        dom.hintText.textContent = `Waiting for opponent's move...`;
        if (dom.hintFromTo) dom.hintFromTo.style.display = 'none';
      }
    }
  }

  function tryReportPlayerMove(engineFen, engineUci, actualFen) {
    if (!engineFen || !engineUci || !actualFen) return;
    chrome.runtime.sendMessage({
      type: 'record_player_move',
      prevFen: engineFen,
      actualFen: actualFen
    }).then((result) => {
      if (result && typeof result.matched === 'boolean') updateCorrelationStat();
    }).catch(() => {});
  }

  // ─── Correlation Stat ─────────────────────────────────────────────
  function updateCorrelationStat() {
    if (!dom.correlationStat) return;
    chrome.runtime.sendMessage({ type: 'get_correlation_stats' }).then((stats) => {
      if (!stats) {
        dom.correlationStat.textContent = '0 / 0 (0%)';
        return;
      }
      const pct = stats.total > 0 ? Math.round((stats.matches / stats.total) * 100) : 0;
      dom.correlationStat.textContent = `${stats.matches} / ${stats.total} (${pct}%)`;
      if (stats.total === 0) {
        dom.correlationStat.style.color = 'var(--role-on-surface-muted)';
      } else if (pct >= 80) {
        dom.correlationStat.style.color = 'var(--role-you)';
      } else if (pct >= 60) {
        dom.correlationStat.style.color = 'var(--role-attack)';
      } else {
        dom.correlationStat.style.color = 'var(--role-opp)';
      }
    }).catch(() => {
      dom.correlationStat.textContent = '–';
    });
  }

  function handleTurnStatusUpdate(data) {
    if (!data) return;
    isPlayerTurn = data.isPlayerTurn;
    waitingForOpponent = data.waitingForOpponent;
    if (data.reason === 'turn_unknown') turnReliable = false;
    updatePositionContext();

    if (data.reason === 'turn_unknown') {
      updateEngineStatus('unknown', 'Turn unavailable: waiting for a verified position');
      if (dom.hintText) dom.hintText.textContent = 'Turn information is unavailable for this board.';
      if (dom.hintFromTo) dom.hintFromTo.style.display = 'none';
      return;
    }

    if (isPlayerTurn) {
      updateEngineStatus('analyzing', 'Your turn: analyzing...');
    } else {
      updateEngineStatus('online', "Opponent's turn: waiting...");
      if (dom.hintText && !lastAnalysis) {
        dom.hintText.textContent = `Waiting for opponent's move...`;
        if (dom.hintFromTo) dom.hintFromTo.style.display = 'none';
      }
    }
  }

  function handleOpeningDataUpdate(data) {
    if (!data || !data.openingData) return;
    if (lastAnalysis && lastAnalysis.fen === data.fen) {
      lastAnalysis.openingData = data.openingData;
      if (dom.openingName && data.openingData.opening) {
        dom.openingName.textContent = data.openingData.opening;
      }
    }
  }

  // ─── Request Analysis ─────────────────────────────────────────────
  function requestAnalysis(refresh = false) {
    if (!currentFen) return;
    updateEngineStatus('analyzing', refresh ? 'Refreshing...' : 'Analyzing...');
    setBalanceLoadingState(prevEval !== null);
    const colorToSend = assistedPlayerColor || playerColor || 'w';
    chrome.runtime.sendMessage({
      type: 'request_analysis',
      fen: currentFen,
      playerColor: colorToSend,
      multiPv: window.AnalysisPolicy
        ? window.AnalysisPolicy.resolveMultiPv(settings, { earlyKingHunt: isEarlyKingHuntActive() })
        : 3,
      hintLevel: EXACT_HINT_LEVEL,
      refresh: refresh,
      tabId: activeTabId,
      positionReliable,
      turnReliable
    }).catch(() => {});
  }

  // ─── Analysis Result Handling ─────────────────────────────────────
  function handleAnalysisResult(data) {
    if (!data || !currentFen) return;
    const resultKey = (data.fen || '').split(' ').slice(0, 4).join(' ');
    const currentKey = currentFen.split(' ').slice(0, 4).join(' ');
    if (!resultKey || resultKey !== currentKey) return;

    const wasUserRefresh = isRefreshing;
    lastAnalysis = data;

    if (data.pvs && data.pvs.length > 0) {
      const bestPV = data.pvs[0];
      const effectiveColor = assistedPlayerColor || playerColor || 'w';
      const evalScore = effectiveColor === 'w' ? bestPV.score : -bestPV.score;
      evalHistory.push({ fen: data.fen, score: evalScore, scoreType: bestPV.scoreType });
      if (evalHistory.length > 50) evalHistory.shift();

      if (prevEval !== null) {
        const prevWhite = effectiveColor === 'w' ? prevEval : -prevEval;
        const currWhite = effectiveColor === 'w' ? evalScore : -evalScore;
        const fenActiveColor = (data.fen || '').split(' ')[1] || 'w';
        const moverColor = fenActiveColor === 'w' ? 'b' : 'w';
        let moveSan = null;
        if (lastAnalyzedFen && data.fen && lastAnalyzedFen !== data.fen) {
          moveSan = inferMoveSan(lastAnalyzedFen, data.fen);
        } else if (lastPositionFen && data.fen && lastPositionFen !== data.fen) {
          moveSan = inferMoveSan(lastPositionFen, data.fen);
        }
        if (!moveSan && Array.isArray(data.moveHistory) && data.moveHistory.length > 0) {
          const lastMove = data.moveHistory[data.moveHistory.length - 1];
          if (typeof lastMove === 'string' && lastMove) {
            moveSan = lastMove.length >= 4 && /^[a-h][1-8][a-h][1-8]/.test(lastMove) && window.ChessHintEngine?.uciToSan
              ? window.ChessHintEngine.uciToSan(lastMove, data.fen)
              : lastMove;
          }
        }
        renderMoveClassification(prevWhite, currWhite, {
          moverColor,
          moveSan,
          scoreTypeBefore: prevScoreType || 'cp',
          scoreTypeAfter: bestPV.scoreType
        });
      } else {
        renderMoveClassificationEmpty();
      }
      prevEval = evalScore;
      prevScoreType = bestPV.scoreType;
      lastAnalyzedFen = data.fen;

      if (data.fen && bestPV.pv && bestPV.pv.length > 0) {
        lastEngineRecommendationFen = data.fen;
        lastEngineRecommendationUci = bestPV.pv[0];
      }
    }

    updateEngineStatus('online', data.stale ? 'Cached analysis (stale)' : 'Analysis complete');
    renderAnalysis(data);
    runHealthCheck();

    if (data.source && wasUserRefresh) {
      showToast(`Analysis ready via ${sourceDisplayName(data.source, data)}`, 'success', 2000);
    }
    if (data.exactHintBlocked) {
      showToast(data.exactHintBlocked.message, 'warning', 3500);
    }
    updateCorrelationStat();
    if (wasUserRefresh) finishRefresh();
  }

  function handleAnalysisError(data) {
    if (!data) return;
    if (data.fen && currentFen && data.fen.split(' ').slice(0, 4).join(' ') !== currentFen.split(' ').slice(0, 4).join(' ')) return;
    const errorMsg = data.error || 'Cloud analysis unavailable.';
    if (isRefreshing) finishRefresh();
    updateEngineStatus('error', errorMsg);
    setBalanceErrorState(errorMsg);
    showToast(errorMsg, 'error', 4000);
    if (dom.hintText) dom.hintText.textContent = errorMsg;
    hideIdeaRail();
  }

  // ─── Eval Bar ──────────────────────────────────────────────────────
  function renderAnalysis(data) {
    const effectiveColor = assistedPlayerColor || playerColor || 'w';
    const objectivePvs = data.pvs || [];
    const earlyKingHuntActive = isEarlyKingHuntActive();
    const styledPvs = objectivePvs.length > 0 && data.source !== 'tablebase' &&
      (objectivePvs.length > 1 || settings.humanLikeMode || earlyKingHuntActive)
      ? window.ChessHintEngine.selectPVForStyle(
          objectivePvs, data.fen, settings.style, effectiveColor,
          settings.humanLikeMode,
          {
            activePlan: humanPlanState?.activePlan || null,
            openingData: data.openingData,
            earlyKingHuntEnabled: earlyKingHuntActive,
            formSession: settings.humanLikeMode ? (data.formSession || null) : null
          }
        )
      : objectivePvs;
    const viewData = { ...data, pvs: styledPvs };

    if (styledPvs.length > 0 && styledPvs[0].pv && styledPvs[0].pv.length > 0) {
      lastEngineRecommendationFen = data.fen;
      lastEngineRecommendationUci = styledPvs[0].pv[0];
      if (settings.humanLikeMode) {
        chrome.runtime.sendMessage({
          type: 'record_human_recommendation',
          fen: data.fen,
          uci: styledPvs[0].pv[0]
        }).catch(() => {});
      }
    }

    if (objectivePvs.length > 0) {
      const bestPV = objectivePvs[0];
      updateEvalBar(bestPV.score, bestPV.scoreType, effectiveColor, data.stale === true);
      updateEvalDescription(bestPV.score, bestPV.scoreType, effectiveColor);
    }

    renderPositionInfo(viewData);
    renderHints(viewData);

    if (data.exactHintBlocked) return;

    if (settings.showCriticalMoments) {
      renderCriticalMoment(effectiveColor);
    } else if (dom.criticalMomentSection) {
      dom.criticalMomentSection.hidden = true;
    }
  }

  function updateEvalBar(score, scoreType, effectiveColor, isStale = false) {
    const isWhite = effectiveColor === 'w';
    const displayScore = isWhite ? score : -score;
    const whiteWinPct = window.ChessHintEngine.formatEvalBar(score, scoreType, true);
    const winFraction = whiteWinPct / 100;
    if (dom.evalBarFill) dom.evalBarFill.style.transform = `scaleX(${winFraction})`;

    const whiteShare = Math.round(whiteWinPct);
    const blackShare = 100 - whiteShare;
    if (dom.evalPctLeft) dom.evalPctLeft.textContent = `${isWhite ? 'You' : 'Opp'} ${whiteShare}%`;
    if (dom.evalPctRight) dom.evalPctRight.textContent = `${isWhite ? 'Opp' : 'You'} ${blackShare}%`;

    const scoreStr = scoreType === 'mate'
      ? (displayScore > 0 ? `+M${displayScore}` : `-M${Math.abs(displayScore)}`)
      : (displayScore >= 0 ? `+${(displayScore / 100).toFixed(1)}` : (displayScore / 100).toFixed(1));
    const oppStr = scoreType === 'mate'
      ? (displayScore > 0 ? `-M${displayScore}` : `+M${Math.abs(displayScore)}`)
      : (displayScore < 0 ? `+${(-displayScore / 100).toFixed(1)}` : (-displayScore / 100).toFixed(1));

    if (dom.evalBar) {
      const evalPawns = scoreType === 'mate'
        ? (displayScore > 0 ? 10 : -10) * Math.sign(displayScore || 1)
        : score / 100;
      const pct = Math.round(whiteWinPct);
      dom.evalBar.setAttribute('aria-valuenow', String(Math.max(-10, Math.min(10, evalPawns))));
      dom.evalBar.setAttribute('aria-valuetext', `${scoreStr} for ${isWhite ? 'White' : 'Black'}`);
      if (dom.evalSection) dom.evalSection.style.setProperty('--eval-pct', String(pct));
    }
    if (dom.evalStaleBadge) dom.evalStaleBadge.style.display = isStale ? 'inline-flex' : 'none';
    if (dom.evalSection) {
      const lean = scoreType === 'mate'
        ? (displayScore > 0 ? 'you' : 'opp')
        : (displayScore > 30 ? 'you' : (displayScore < -30 ? 'opp' : 'even'));
      dom.evalSection.dataset.lean = lean;
      dom.evalSection.dataset.state = isStale ? 'stale' : 'data';
    }
    if (dom.evalWhiteLabel) dom.evalWhiteLabel.textContent = isWhite ? scoreStr : oppStr;
    if (dom.evalBlackLabel) dom.evalBlackLabel.textContent = isWhite ? oppStr : scoreStr;
    renderEvalSparkline();
  }

  // ─── Eval Sparkline ────────────────────────────────────────────────
  const SPARK_WINDOW = 20;
  function renderEvalSparkline() {
    if (!dom.evalSpark) return;
    const points = evalHistory.slice(-SPARK_WINDOW);
    if (points.length < 2) {
      dom.evalSpark.classList.remove('is-live');
      dom.evalSpark.replaceChildren();
      return;
    }
    const W = 120, H = 28, MID = H / 2;
    const clampPawns = (cp) => Math.max(-600, Math.min(600, cp)) / 100;
    const values = points.map((p) => (p.scoreType === 'mate' ? Math.sign(p.score || 1) * 6 : clampPawns(p.score)));
    const min = Math.min(...values), max = Math.max(...values);
    const span = Math.max(max - min, 1.5);
    const step = W / (points.length - 1);
    const y = (v) => MID - ((v - min) / span - 0.5) * (H - 8);
    const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const lastX = ((points.length - 1) * step).toFixed(1);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    const zero = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    zero.setAttribute('class', 'spark-zero');
    zero.setAttribute('x1', '0'); zero.setAttribute('x2', String(W));
    zero.setAttribute('y1', String(MID)); zero.setAttribute('y2', String(MID));
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('class', 'spark-line');
    line.setAttribute('d', d);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('class', 'spark-dot');
    dot.setAttribute('cx', lastX);
    dot.setAttribute('cy', y(values[values.length - 1]).toFixed(1));
    dot.setAttribute('r', '2.5');
    svg.append(zero, line, dot);
    dom.evalSpark.replaceChildren(svg);
    dom.evalSpark.classList.add('is-live');
  }

  // ─── Eval Description ──────────────────────────────────────────────
  function updateEvalDescription(score, scoreType, effectiveColor) {
    if (!dom.evalDescription) return;
    const isWhite = effectiveColor === 'w';
    const displayScore = isWhite ? score : -score;
    if (scoreType === 'mate' && displayScore === 0) {
      dom.evalDescription.textContent = 'Checkmate';
      return;
    }
    if (scoreType === 'mate') {
      dom.evalDescription.textContent = displayScore > 0
        ? `Mate in ${displayScore} · ${isWhite ? 'White' : 'Black'} is winning`
        : `Mated in ${Math.abs(displayScore)} · ${isWhite ? 'Black' : 'White'} is winning`;
      return;
    }
    const absPawns = Math.abs(score) / 100;
    const sign = displayScore > 0 ? '+' : (displayScore < 0 ? '–' : '');
    let text;
    if (absPawns < 0.3) {
      text = 'Dead equal position';
    } else if (absPawns < 1) {
      text = `${sign}${absPawns.toFixed(2)} pawn advantage — ${isWhite ? 'White' : 'Black'}`;
    } else {
      text = `${sign}${absPawns.toFixed(1)} pawns — ${isWhite ? 'White' : 'Black'}`;
    }
    dom.evalDescription.textContent = text;
  }

  // ─── Position Info ─────────────────────────────────────────────────
  function renderPositionInfo(data) {
    if (dom.openingName && data.openingData && data.openingData.opening) {
      dom.openingName.textContent = data.openingData.opening;
    } else if (dom.openingName) {
      dom.openingName.textContent = '—';
    }
    if (dom.gamePhase && data.gamePhase) dom.gamePhase.textContent = data.gamePhase;
    if (dom.materialBalance && window.ChessHintEngine && typeof window.ChessHintEngine.materialBalance === 'function') {
      dom.materialBalance.textContent = window.ChessHintEngine.materialBalance(data.fen);
    }
    if (dom.analysisQuality && data.analysisParams && data.analysisParams.quality) {
      dom.analysisQuality.textContent = data.analysisParams.quality;
    }
    if (dom.analysisSource && data.source) {
      dom.analysisSource.textContent = sourceDisplayName(data.source, data);
    }
  }

  // ─── Critical Moment ──────────────────────────────────────────────
  function renderCriticalMoment(effectiveColor) {
    if (!dom.criticalMomentSection || !dom.criticalMomentText || !dom.criticalMomentDetail) return;
    if (!window.ChessHintEngine || typeof window.ChessHintEngine.analyzeCriticalMoment !== 'function') {
      dom.criticalMomentSection.hidden = true;
      return;
    }
    const result = window.ChessHintEngine.analyzeCriticalMoment({
      lastAnalysis,
      isPlayerTurn,
      playerColor: effectiveColor,
      evalHistory,
      prevEval
    });
    if (!result || !result.isCritical) {
      dom.criticalMomentSection.hidden = true;
      lastCriticalAlert = null;
      return;
    }
    dom.criticalMomentSection.hidden = false;
    dom.criticalMomentText.textContent = result.title || 'Critical moment';
    dom.criticalMomentDetail.textContent = result.detail || '';
    dom.criticalMomentSection.dataset.severity = result.severity || 'moderate';

    if (lastCriticalAlert !== result.title || true) {
      if (!lastCriticalAlert) {
        showToast(result.title, 'warning', 4000);
      }
      lastCriticalAlert = result.title;
    }
  }

  // ─── Idea Rail ────────────────────────────────────────────────────
  function renderIdeaRail(captions) {
    if (!dom.ideaSection || !dom.ideaList) return;
    if (!captions || captions.length === 0) {
      hideIdeaRail();
      return;
    }
    const items = captions.map((caption) => {
      const kind = caption.kind || 'reply';
      const label = caption.label || '';
      const text = caption.text || '';
      const svgIcon = kind === 'reply' ? '⤻' : (kind === 'threat' ? '⚡' : '→');
      return `<li class="idea-item idea-item--${kind}">
        <span class="idea-icon" aria-hidden="true">${svgIcon}</span>
        <span class="idea-label">${h(label)}</span>
        <span class="idea-text">${h(text)}</span>
      </li>`;
    }).join('');
    dom.ideaList.innerHTML = items;
    dom.ideaSection.hidden = false;
    dom.ideaSection.classList.add('fade-in');
    setTimeout(() => dom.ideaSection.classList.remove('fade-in'), 300);
  }

  function hideIdeaRail() {
    if (dom.ideaSection) {
      dom.ideaSection.hidden = true;
      dom.ideaSection.classList.remove('fade-in');
    }
  }

  // ─── Alternatives ──────────────────────────────────────────────────
  function renderAlternatives(data) {
    if (!dom.altsSection || !dom.altsList) return;
    if (!data.pvs || data.pvs.length <= 1) {
      dom.altsSection.hidden = true;
      return;
    }
    const alts = data.pvs.slice(1, 4);
    if (alts.length === 0) { dom.altsSection.hidden = true; return; }
    dom.altsList.innerHTML = alts.map((pv, i) => {
      const scoreStr = pv.scoreType === 'mate'
        ? (pv.score >= 0 ? `+M${pv.score}` : `-M${Math.abs(pv.score)}`)
        : `${(pv.score / 100).toFixed(2)}`;
      const uci = pv.pv && pv.pv[0];
      const san = uci && window.ChessHintEngine && window.ChessHintEngine.uciToSan
        ? window.ChessHintEngine.uciToSan(uci, data.fen)
        : (uci || '–');
      return `<li class="alt-item">
        <span class="alt-rank">${i + 2}</span>
        <span class="alt-move">${h(san)}</span>
        <span class="alt-score">${h(scoreStr)}</span>
      </li>`;
    }).join('');
    dom.altsSection.hidden = false;
  }

  // ─── Hints ─────────────────────────────────────────────────────────
  function renderHints(data) {
    if (!window.ChessHintEngine || typeof window.ChessHintEngine.generateHints !== 'function') return;
    const effectiveColor = assistedPlayerColor || playerColor || 'w';
    const hints = window.ChessHintEngine.generateHints(
      { ...data, prevEval, currEval: data.pvs?.[0] ? (effectiveColor === 'w' ? data.pvs[0].score : -data.pvs[0].score) : 0 },
      EXACT_HINT_LEVEL,
      effectiveColor,
      settings.style,
      null,
      settings.humanLikeMode,
      {
        activePlan: humanPlanState?.activePlan || null,
        earlyKingHuntEnabled: isEarlyKingHuntActive(),
        formSession: settings.humanLikeMode ? (data.formSession || null) : null
      }
    );
    if (dom.hintText) {
      if (hints.bestMoveFromTo) {
        dom.hintText.textContent = '';
        dom.hintText.classList.remove('fade-in');
      } else {
        dom.hintText.textContent = hints.main;
        dom.hintText.classList.add('fade-in');
        setTimeout(() => dom.hintText.classList.remove('fade-in'), 300);
      }
    }
    const captions = Array.isArray(hints.captions) ? hints.captions.slice() : [];
    if (settings.showThreats && hints.threat) {
      const already = captions.some((c) => c.kind === 'reply');
      if (!already) {
        captions.push({ kind: 'reply', label: hints.threatLabel || 'Best reply', text: hints.threat });
      }
    } else {
      for (let i = captions.length - 1; i >= 0; i--) {
        if (captions[i].kind === 'reply') captions.splice(i, 1);
      }
    }
    renderIdeaRail(captions);
    renderAlternatives(data);

    if (dom.hintFromTo) {
      if (hints.bestMoveFromTo) {
        dom.hintFromTo.style.display = '';
        renderFromTo(hints.bestMoveFromTo);
      } else {
        dom.hintFromTo.style.display = 'none';
      }
    }
    setHeroAttackTag(data.pvs && data.pvs[0] && data.pvs[0].pv ? data.pvs[0].pv[0] : null, data.fen);
  }

  // ─── FromTo Hero ──────────────────────────────────────────────────
  const SQUARE_SVG = {};
  function renderFromTo(bestMoveFromTo) {
    if (!dom.hintFromTo) return;
    const { from, to } = bestMoveFromTo;
    const fromSquare = typeof from === 'string' ? from : `${String.fromCharCode(97 + from.c)}${8 - from.r}`;
    const toSquare = typeof to === 'string' ? to : `${String.fromCharCode(97 + to.c)}${8 - to.r}`;
    const fromCol = fromSquare.charCodeAt(0) - 97;
    const fromRow = parseInt(fromSquare[1]) - 1;
    const toCol = toSquare.charCodeAt(0) - 97;
    const toRow = parseInt(toSquare[1]) - 1;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 8 8');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-label', `Suggested move: ${fromSquare}–${toSquare}`);
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('class', 'fromto-arrow');
    arrow.setAttribute('d', `M ${fromCol}.5 ${3.5} L ${toCol}.5 ${3.5} M ${toCol}.5 ${3.5} L ${toCol - 0.2} ${3.5 - 0.3} M ${toCol}.5 ${3.5} L ${toCol - 0.2} ${3.5 + 0.3}`);
    const fromCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    fromCircle.setAttribute('class', 'fromto-circle fromto-circle--from');
    fromCircle.setAttribute('cx', `${fromCol}.5`);
    fromCircle.setAttribute('cy', `${3.5}`);
    fromCircle.setAttribute('r', '0.35');
    const toCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    toCircle.setAttribute('class', 'fromto-circle fromto-circle--to');
    toCircle.setAttribute('cx', `${toCol}.5`);
    toCircle.setAttribute('cy', `${3.5}`);
    toCircle.setAttribute('r', '0.35');
    svg.append(arrow, fromCircle, toCircle);
    dom.hintFromTo.replaceChildren(svg, document.createTextNode(`${fromSquare}–${toSquare}`));
  }

  // ─── Hero Attack Tag ───────────────────────────────────────────────
  function setHeroAttackTag(uci, fen) {
    if (!dom.hintAttackTag || !fen) { if (dom.hintAttackTag) dom.hintAttackTag.hidden = true; return; }
    const color = fen.split(' ')[1] || 'w';
    const isAttacking = color === 'w';
    const attackerColor = color === 'w' ? 'white' : 'black';
    dom.hintAttackTag.textContent = isAttacking ? 'Attacking' : 'Defending';
    dom.hintAttackTag.hidden = false;
    if (dom.hintCard) {
      dom.hintCard.className = dom.hintCard.className.replace(/(^|\s)(super-ultra-mode|human-mode)\b/g, '');
      dom.hintCard.classList.add(isAttacking ? 'attacking' : 'defending');
    }
  }

  // ─── Move Classification ───────────────────────────────────────────
  function renderMoveClassificationEmpty() {
    if (!dom.moveClassSection || !dom.moveClassDisplay) return;
    dom.moveClassSection.dataset.verdict = 'none';
    dom.moveClassSection.dataset.state = 'empty';
    dom.moveClassDisplay.innerHTML = `
      <div class="verdict__empty">
        <span class="verdict__empty-icon" aria-hidden="true"></span>
        <p class="verdict__empty-text">Play a move to see how it rated</p>
      </div>
    `;
  }

  function renderMoveClassification(evalBefore, evalAfter, opts) {
    if (!dom.moveClassSection || !dom.moveClassDisplay) return;
    const cls = window.ChessHintEngine.classifyMove(evalBefore, evalAfter, opts || {});
    const swing = cls.winChanceLost > 0
      ? `Win −${cls.winChanceLost}%`
      : (cls.winChanceGained > 0 ? `Win +${cls.winChanceGained}%` : 'Held the evaluation');
    const acc = clamp(cls.accuracy, 0, 100, 0);
    const effectiveColor = assistedPlayerColor || playerColor || 'w';
    const moverColor = (opts && opts.moverColor) || (effectiveColor === 'w' ? 'b' : 'w');
    const isPlayerMover = moverColor === effectiveColor;
    let moverText = '';
    if (opts && opts.moveSan) {
      moverText = isPlayerMover ? `You played ${opts.moveSan}` : `Opponent played ${opts.moveSan}`;
    } else {
      moverText = isPlayerMover ? 'Your last move' : "Opponent's last move";
    }
    const isNewVerdict = dom.moveClassSection.dataset.verdictKey !== `${opts && opts.moveSan}|${cls.label}|${acc}`;
    dom.moveClassSection.dataset.verdictKey = `${opts && opts.moveSan}|${cls.label}|${acc}`;
    dom.moveClassSection.dataset.verdict = cls.label.toLowerCase();
    dom.moveClassSection.dataset.state = 'data';
    const symbol = cls.symbol
      ? ` <span class="verdict__symbol" aria-hidden="true">${h(cls.symbol)}</span>`
      : '';
    dom.moveClassDisplay.innerHTML = `
      <div class="verdict__copy">
        <p class="verdict__mover">${h(moverText)}</p>
        <p class="verdict__label">${h(cls.label)}${symbol}</p>
        <p class="verdict__metric">${h(swing)}</p>
      </div>
      <div class="verdict__ring" style="--acc: ${acc}" role="img"
           title="Engine accuracy estimate for this move (${acc}/100)"
           aria-label="Engine accuracy estimate ${acc} of 100">
        <span class="verdict__ring-stack">
          <span class="verdict__ring-val">${h(String(acc))}</span>
          <span class="verdict__ring-cap">/ 100</span>
        </span>
      </div>
    `;
    if (isNewVerdict && !REDUCED_MOTION) {
      dom.moveClassSection.classList.remove('pop');
      void dom.moveClassSection.offsetHeight;
      dom.moveClassSection.classList.add('pop');
      const ringVal = dom.moveClassDisplay.querySelector('.verdict__ring-val');
      if (ringVal) animateCountUp(ringVal, acc, 520);
    }
  }

  function animateCountUp(el, target, duration) {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ─── Finish Refresh ───────────────────────────────────────────────
  function finishRefresh() {
    if (refreshSafetyTimer) clearTimeout(refreshSafetyTimer);
    refreshSafetyTimer = null;
    if (dom.btnRefresh) dom.btnRefresh.classList.remove('spinning');
    isRefreshing = false;
  }

  // ─── Scroll Elevation ─────────────────────────────────────────────
  function initScrollElevation() {
    const sheet = document.querySelector('.scroll-elevation');
    if (!sheet) return;
    let ticking = false;
    const update = () => {
      if (!sheet) return;
      const hasScroll = sheet.scrollHeight > sheet.clientHeight + 1;
      const atTop = sheet.scrollTop <= 0;
      sheet.classList.toggle('is-scrolled', hasScroll && !atTop);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    sheet.addEventListener('scroll', onScroll, { passive: true });
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(() => update()).observe(sheet);
    }
    update();
  }

  // ─── Version Stamp ─────────────────────────────────────────────────
  function stampVersion() {
    chrome.runtime.getManifest().then((manifest) => {
      if (!manifest || !manifest.version) return;
      const el = document.getElementById('extension-version');
      if (el) el.textContent = `v${manifest.version}`;
    }).catch(() => {
      chrome.runtime.sendMessage({ type: 'get_version' }, (response) => {
        if (response && response.version) {
          const el = document.getElementById('extension-version');
          if (el) el.textContent = `v${response.version}`;
        }
      });
    });
  }

  // ─── Event Binding ─────────────────────────────────────────────────
  function bindEventHandlers() {
    if (dom.btnSettings) {
      dom.btnSettings.addEventListener('click', (e) => {
        e.preventDefault();
        if (dom.settingsSheet && !dom.settingsSheet.hidden) closeSettingsSheet();
        else openSettingsSheet();
      });
      dom.btnSettings.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (dom.settingsSheet && !dom.settingsSheet.hidden) closeSettingsSheet();
          else openSettingsSheet();
        }
      });
    }

    if (dom.btnCloseSettings) {
      dom.btnCloseSettings.addEventListener('click', closeSettingsSheet);
    }

    if (dom.btnRefresh) {
      dom.btnRefresh.addEventListener('click', (e) => {
        e.preventDefault();
        if (isRefreshing) return;
        isRefreshing = true;
        if (dom.btnRefresh) dom.btnRefresh.classList.add('spinning');
        const safety = setTimeout(() => {
          isRefreshing = false;
          if (dom.btnRefresh) dom.btnRefresh.classList.remove('spinning');
        }, 8000);
        refreshSafetyTimer = safety;
        requestAnalysis(true);
      });
    }

    if (dom.btnHealthCheck) {
      dom.btnHealthCheck.addEventListener('click', runHealthCheck);
    }

    if (dom.btnClearCaches) {
      dom.btnClearCaches.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ type: 'clear_cache' });
        showToast('Caches cleared', 'success', 2000);
        runHealthCheck();
      });
    }

    // Player selector buttons
    $$('.player-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const color = btn.dataset.color;
        if (color) {
          assistedPlayerColor = color;
          updatePlayerSelectorUI();
          saveSettings();
          showToast(`Coaching ${color === 'w' ? 'White' : 'Black'}`, 'info', 1500);
          if (isPlayerTurn) requestAnalysis();
        }
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const color = btn.dataset.color;
          if (color) {
            assistedPlayerColor = color;
            updatePlayerSelectorUI();
            saveSettings();
            showToast(`Coaching ${color === 'w' ? 'White' : 'Black'}`, 'info', 1500);
            if (isPlayerTurn) requestAnalysis();
          }
        }
      });
    });

    // Style choices
    $$('[data-style]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isMaiaOnlyActive()) return;
        const style = btn.dataset.style;
        if (style) {
          settings.style = normalizeStyle(style);
          applySettingsToUI();
          saveSettings();
          updateStyleDescription();
          updateEarlyKingHuntUI();
          const styleNames = { normal: 'Normal', aggressive: 'Aggressive', super_ultra_aggressive: 'Ultra-Aggressive' };
          showToast(`Style: ${styleNames[settings.style] || 'Normal'}`, 'info', 1500);
          if (isPlayerTurn && currentFen) requestAnalysis();
        }
      });
    });

    // Human-like mode
    $$('.human-mode-opt').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isMaiaOnlyActive()) return;
        const mode = btn.dataset.mode;
        settings.humanLikeMode = mode === 'on';
        applySettingsToUI();
        saveSettings();
        showToast(settings.humanLikeMode ? 'Human-like mode ON' : 'Human-like mode OFF', 'info', 1500);
        if (isPlayerTurn && currentFen) requestAnalysis();
      });
    });

    // Sparring strength slider
    const sparringInput = document.getElementById('setting-sparring-strength');
    if (sparringInput) {
      sparringInput.addEventListener('input', (e) => {
        const v = Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 1100;
        settings.sparringStrength = Math.max(500, Math.min(3000, Math.round(v / 100) * 100));
        const chip = document.getElementById('sparring-strength-value');
        if (chip) chip.textContent = String(settings.sparringStrength);
      });
      sparringInput.addEventListener('change', () => {
        saveSettings();
      });
    }

    // Maia rating slider
    const maiaRatingInput = document.getElementById('setting-maia-rating');
    if (maiaRatingInput) {
      maiaRatingInput.addEventListener('input', (e) => {
        const v = Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 1500;
        settings.maiaRating = Math.max(600, Math.min(2600, Math.round(v / 100) * 100));
        const chip = document.getElementById('maia-rating-value');
        if (chip) chip.textContent = String(settings.maiaRating);
      });
      maiaRatingInput.addEventListener('change', () => {
        saveSettings();
        if (isMaiaOnlyActive() && isPlayerTurn && currentFen) requestAnalysis();
      });
    }

    // Maia only toggle
    const maiaOnlyInput = document.getElementById('setting-maia-only');
    if (maiaOnlyInput) {
      maiaOnlyInput.addEventListener('change', () => {
        settings.maiaOnlyMode = maiaOnlyInput.checked;
        applySettingsToUI();
        saveSettings();
        if (settings.maiaOnlyMode) {
          showToast('Maia-only mode: other engines disabled', 'info', 2000);
          if (isPlayerTurn && currentFen) requestAnalysis(true);
        } else {
          showToast('All engines re-enabled', 'info', 1500);
          if (isPlayerTurn && currentFen) requestAnalysis(true);
        }
      });
    }

    // Checkbox settings that auto-save
    ['setting-auto-analyze', 'setting-show-threats', 'setting-show-critical-moments',
     'setting-use-chess-api', 'setting-use-lichess-cloud', 'setting-use-maia3',
     'setting-use-masters-explorer', 'setting-early-king-hunt'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          switch (id) {
            case 'setting-auto-analyze': settings.autoAnalyze = el.checked; break;
            case 'setting-show-threats': settings.showThreats = el.checked; break;
            case 'setting-show-critical-moments': settings.showCriticalMoments = el.checked; break;
            case 'setting-use-chess-api': settings.useChessApi = el.checked; break;
            case 'setting-use-lichess-cloud': settings.useLichessCloud = el.checked; break;
            case 'setting-use-maia3': settings.useMaia3 = el.checked; break;
            case 'setting-use-masters-explorer': settings.useMastersExplorer = el.checked; break;
            case 'setting-early-king-hunt': settings.earlyKingHuntEnabled = el.checked; break;
          }
          saveSettings();
          updateEngineGroups();
          if (el.id === 'setting-early-king-hunt' || el.id.startsWith('setting-use-')) {
            if (isPlayerTurn && currentFen) requestAnalysis(true);
          }
        });
      }
    });

    // Select dropdowns
    ['setting-analysis-quality', 'setting-candidate-lines'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          if (id === 'setting-analysis-quality') settings.analysisQuality = el.value;
          else settings.candidateLines = el.value;
          saveSettings();
          if (isPlayerTurn && currentFen) requestAnalysis();
        });
      }
    });

    chrome.runtime.onMessage.addListener(handleMessage);
  }

  // ─── Init ─────────────────────────────────────────────────────────
  function init() {
    loadSettings();
    initKeyboardShortcuts();
    initDialogFocusTrap();
    initSettingsFocusTrap();
    initMdSliders();
    initSegmentedControls();
    initScrollElevation();
    bindEventHandlers();
    stampVersion();
    setBalanceEmptyState();
    renderMoveClassificationEmpty();
    if (dom.evalBar) dom.evalBar.setAttribute('role', 'slider');
    startBoardReading();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.ChessPanel = {
    showToast, openSettingsSheet, closeSettingsSheet, requestAnalysis,
    runHealthCheck, loadSettings, applySettingsToUI, updatePlayerSelectorUI,
    syncAllSegments, initSegmentedControls
  };
})();
