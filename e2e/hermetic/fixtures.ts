import { type BrowserContext, expect, test as base } from '@playwright/test';

import { FIREFLY_STATE_KEY, fireflyStateValue, type SeedOptions } from './seedFireflySession';

/**
 * Hermetic (CI-runnable) fixtures.
 *
 * Unlike `e2e/fixtures.ts` (which attaches to the user's real Chrome over CDP and reuses their
 * live login), these spawn a fresh Chromium and **fake** the logged-in + wallet-connected state:
 *   1. seed `localStorage['firefly-state']` with a test session before any app script runs, and
 *   2. stub the session-gated Firefly backend so the fake token never hits a real server.
 *
 * No extension, no OAuth, no Privy wallet iframe → reproducible in CI. Per-flow tests add their
 * own `context.route(...)` / `page.route(...)` stubs for whatever endpoints that flow reads.
 *
 * Override the seed per test/project with: `test.use({ seed: { profileId: '...' } })`.
 */
export const test = base.extend<{ seed: SeedOptions; context: BrowserContext }>({
    seed: [{}, { option: true }],
    context: async ({ context, seed }, use) => {
        const value = fireflyStateValue(seed);

        // Runs before any page script, on every navigation → the store reads it on boot.
        await context.addInitScript(
            ([key, val]) => {
                window.localStorage.setItem(key, val);
            },
            [FIREFLY_STATE_KEY, value] as const,
        );

        // Default stub: the only always-on session-gated call. Shape may need tuning against the
        // real API; per-flow tests override/extend this for the endpoints they exercise.
        await context.route('**/v1/accountConnection', (route) =>
            route.fulfill({ json: { code: 200, data: { connections: [] } } }),
        );

        await use(context);
    },
});

export { expect };
