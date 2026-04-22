import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'node:path';

const port = Number(process.env['PLAYWRIGHT_BASE_PORT'] ?? 4300);
dotenv.config({ path: path.resolve(__dirname, '.env') });
const targetURL =
  process.env['TARGET_URL'] ??
  process.env['PLAYWRIGHT_BASE_URL'] ??
  process.env['PROD_BASE_URL'] ??
  `http://127.0.0.1:${port}`;
const isRemoteRun = Boolean(process.env['TARGET_URL'] || process.env['PLAYWRIGHT_BASE_URL']);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? [['html'], ['github']] : [['list']],
  use: {
    baseURL: targetURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
      grepInvert: /@api/,
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
      grepInvert: /@api/,
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
      grepInvert: /@api/,
    },
  ],
  webServer: isRemoteRun
    ? undefined
    : {
        command: `npm run build && PORT=${port} npm run serve:ssr:giphy-list`,
        url: `http://127.0.0.1:${port}`,
        reuseExistingServer: !process.env['CI'],
        timeout: 240_000,
      },
});
