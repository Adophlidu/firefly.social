import { expect, test } from './fixtures';

/**
 * Proves the hermetic seed works without a real wallet, OAuth, or CDP:
 *  1. the app boots with no client-side crash, and
 *  2. the seeded Firefly session is RECOGNISED — the app routes as logged-in and fires
 *     session-gated API calls only an authenticated client would make.
 *
 * Note on scope: a fully-hydrated logged-in *profile* (avatar/handle) additionally needs the
 * session-validation / profile endpoints stubbed — otherwise they hit the real backend with the
 * fake token, 401, and the profile can't load. Those stubs are added per-flow in each test that
 * needs them (see fixtures.ts). This smoke deliberately asserts only what holds with no extra stubs.
 */
test('seeded session boots clean and is recognised as logged-in', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    const fireflyApiCalls: string[] = [];
    page.on('request', (r) => {
        if (/api(-dev)?\.firefly\.land\/v\d/.test(r.url())) fireflyApiCalls.push(r.url());
    });

    await page.goto('/');

    // The seed is present before the app reads it.
    const stored = await page.evaluate(() => window.localStorage.getItem('firefly-state'));
    expect(stored).toContain('currentProfileSession');

    // No client-side crash on boot. (This is what caught the stale @dimensiondev/constants build:
    // a missing RPC export threw in wagmiClient.ts and took down the whole client tree.)
    expect(pageErrors, `client pageerror(s):\n${pageErrors.join('\n')}`).toHaveLength(0);

    // Not bounced to a login / welcome / connect wall.
    await expect(page).not.toHaveURL(/\/(login|welcome|sign-in|connect)(\/|$|\?)/);

    // The seeded session is recognised: the app makes session-gated Firefly API calls.
    await expect.poll(() => fireflyApiCalls.length, { timeout: 15_000 }).toBeGreaterThan(0);
});
