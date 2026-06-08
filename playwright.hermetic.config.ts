import { defineConfig, devices } from '@playwright/test';

/**
 * Hermetic, CI-runnable e2e suite (Tier 1).
 *
 * Spawns a fresh Chromium and fakes login + wallet-connected state by seeding localStorage
 * (see e2e/hermetic/fixtures.ts) + route-stubbing the Firefly backend. No CDP, no real wallet,
 * no OAuth — reproducible in CI. Run: `pnpm test:e2e:ci`.
 *
 * The CDP-attached suite (`playwright.config.ts`, Tier 2) stays for the few flows that genuinely
 * need the real Privy wallet iframe / real OAuth — run those locally or nightly.
 *
 * Note: this suite spawns a browser, so CI must run `npx playwright install chromium` first
 * (the repo's `.npmrc` has `ignore-scripts=true`, so browsers are not auto-downloaded).
 *
 * Set `FF_E2E_EXTERNAL_SERVER=1` to skip the managed dev server and run against one you've already
 * started yourself (point at it with `FF_E2E_BASE_URL` if not on :3000). Handy in CI where the
 * server is booted as a separate step, and locally to avoid a slow cold compile on every run.
 */
const useExternalServer = !!process.env.FF_E2E_EXTERNAL_SERVER;

export default defineConfig({
    testDir: './e2e/hermetic',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    workers: process.env.CI ? 2 : undefined,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: [['list']],
    use: {
        baseURL: process.env.FF_E2E_BASE_URL ?? 'http://localhost:3000',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        ...devices['Desktop Chrome'],
    },
    webServer: useExternalServer
        ? undefined
        : {
              command: 'pnpm --filter @dimensiondev/firefly-web dev',
              url: 'http://localhost:3000',
              reuseExistingServer: !process.env.CI,
              timeout: 180_000,
          },
});
