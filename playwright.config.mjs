import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  retries: 0,
  globalSetup: './tests/e2e/server-setup.mjs',
  use: { baseURL: 'http://127.0.0.1:4179', headless: true, viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Tokyo' },
});
