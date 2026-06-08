import { defineConfig } from '@playwright/test';

/**
 * Firefly e2e suite.
 *
 * These specs attach to YOUR already-running Chrome over CDP (see e2e/fixtures.ts),
 * so the browser is logged into Firefly and wallet-connected. They are NOT spawned in a
 * fresh Chromium and are therefore NOT CI-reproducible — they need a Chrome started with
 * `--remote-debugging-port=9222` and a dev server running locally. Run them via `pnpm test:e2e`
 * (typically driven by the `/ff-task` skill), not in CI.
 *
 * Browsers are not downloaded: `.npmrc` sets `ignore-scripts=true`, and we connect over CDP
 * instead of launching Playwright's bundled browsers.
 */
export default defineConfig({
    testDir: './e2e',
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    workers: 1,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: [['list']],
    use: {
        baseURL: process.env.FF_E2E_BASE_URL ?? 'http://localhost:3000',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
});
