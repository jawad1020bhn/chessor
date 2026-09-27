const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function loaded(page, query = '') {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`/preview/${query}`);
  await expect(page.locator('#btn-settings')).toBeVisible();
  if (!query.includes('noboard')) {
    await expect(page.locator('#hint-text')).toContainText(query.includes('hold') ? 'Nc3' : 'Qxf7');
  }
  expect(errors).toEqual([]);
}
async function accessible(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('#main-canvas').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
}

for (const theme of ['light', 'dark']) {
  for (const width of [320, 400, 600]) {
    test(`${theme} / ${width}px: analysis and preferences`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.emulateMedia({ colorScheme: theme });
      await loaded(page);
      await expect(page.locator('.hint-mate')).toHaveText('Mate in 1');
      await noOverflow(page);
      await accessible(page);
      await page.locator('#btn-settings').click();
      await expect(page.locator('#btn-close-settings')).toBeFocused();
      await expect(page.locator('.md-canvas')).toHaveAttribute('inert', '');
      expect(await page.locator('.md-sheet__body').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await accessible(page);
      await page.locator('#setting-auto-analyze').focus();
      await page.keyboard.press('Escape');
      await expect(page.locator('#settings-panel')).toBeHidden();
      await expect(page.locator('#btn-settings')).toBeFocused();
    });
  }
}

test('welcome has actionable study copy, no phantom evaluation', async ({ page }) => {
  await loaded(page, '?noboard');
  await expect(page.locator('#hero-welcome')).toContainText('supported analysis board');
  await expect(page.locator('#eval-section')).toBeHidden();
  await expect(page.locator('#position-info')).toBeHidden();
  await accessible(page);
});

test('alternatives preserve their scores and proportional meters', async ({ page }) => {
  await loaded(page, '?hold');
  await expect(page.locator('#alts-section')).toBeVisible();
  const rows = page.locator('.md-alt-row');
  expect(await rows.count()).toBeGreaterThan(0);
  for (const row of await rows.all()) {
    const track = await row.locator('.md-alt-row__meter').boundingBox();
    const fill = await row.locator('.md-alt-row__meter-fill').boundingBox();
    expect(fill.width).toBeLessThanOrEqual(track.width);
    expect(fill.width).toBeGreaterThan(0);
  }
  await accessible(page);
});

test('style controls, gating, switches and focus trap remain functional', async ({ page }) => {
  await loaded(page);
  await page.locator('#btn-settings').click();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#btn-clear-caches')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#btn-close-settings')).toBeFocused();
  await page.getByRole('radio', { name: 'Ultra attack' }).click();
  await expect(page.locator('#early-king-hunt-setting')).toBeVisible();
  await page.locator('#setting-early-king-hunt').check();
  await page.getByRole('radio', { name: 'Normal', exact: false }).click();
  await expect(page.locator('#early-king-hunt-setting')).toBeHidden();
  await page.locator('#setting-maia-only').check();
  await expect(page.locator('#maia-settings-block')).toBeVisible();
  await expect(page.locator('#setting-use-chess-api')).toBeDisabled();
  await page.locator('#setting-maia-rating').fill('1800');
  await expect(page.locator('#maia-rating-value')).toHaveText('1800');
  await page.locator('#setting-maia-only').uncheck();
  await expect(page.locator('#setting-use-chess-api')).toBeEnabled();
  await page.locator('#setting-use-chess-api').uncheck();
  await expect(page.locator('[data-engine="chess-api"] .md-engine__body')).toBeHidden();
  await accessible(page);
});

test('shortcuts dialog restores focus; radio arrows and refresh work', async ({ page }) => {
  await loaded(page);
  await page.locator('#btn-settings').focus();
  await page.keyboard.press('?');
  await expect(page.locator('#shortcut-help')).toBeVisible();
  await expect(page.locator('#app')).toHaveAttribute('inert', '');
  await page.keyboard.press('Tab');
  await expect(page.locator('#btn-close-shortcut-help')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#shortcut-help')).toBeHidden();
  await expect(page.locator('#btn-settings')).toBeFocused();
  await page.getByRole('radio', { name: 'Coach White' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Coach Black' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowLeft');
  await page.locator('#btn-refresh').click();
  await expect(page.locator('#btn-refresh')).not.toHaveClass(/spinning/);
  await expect(page.locator('#hint-text')).toContainText('Qxf7');
});

test('loading, stale cache and provider errors have legible states', async ({ page }) => {
  await page.goto('/preview/?loading');
  await expect(page.locator('#eval-section')).toHaveAttribute('data-state', 'loading');
  await accessible(page);
  await page.goto('/preview/?stale');
  await expect(page.locator('#hint-text')).toContainText('Qxf7');
  await expect(page.locator('#eval-stale-badge')).toBeVisible();
  await accessible(page);
  await page.goto('/preview/?error');
  await expect(page.locator('#hint-text')).toContainText('Analysis is unavailable');
  await expect(page.locator('.status-dot')).toHaveClass(/error/);
  await accessible(page);
});

test('200% CSS zoom and forced colors preserve controls', async ({ page }) => {
  await loaded(page, '?hold');
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await page.setViewportSize({ width: 800, height: 1000 });
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await expect(page.locator('#btn-settings')).toBeInViewport();
  await page.locator('#btn-settings').click();
  await expect(page.locator('#btn-close-settings')).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.locator('#btn-settings')).toBeFocused();
});
