const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/ui',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:8123',
    viewport: { width: 400, height: 850 },
    reducedMotion: 'reduce',
    launchOptions: process.env.CHROMIUM_PATH ? {
      executablePath: process.env.CHROMIUM_PATH,
      args: ['--no-sandbox', '--no-zygote']
    } : {},
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'python3 preview/serve.py',
    url: 'http://127.0.0.1:8123/preview/',
    reuseExistingServer: !process.env.CI
  }
});
