import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';

/**
 * CDP-attached test fixtures.
 *
 * Instead of launching a fresh browser, every test attaches to the user's real Chrome over the
 * Chrome DevTools Protocol (started with `--remote-debugging-port=9222`). That Chrome is already
 * logged into Firefly and wallet-connected, which is exactly the session `/ff-task` verification
 * needs for auth- and wallet-gated flows.
 *
 * Hard rule: never close the browser — it is the user's whole Chrome window. We only open and
 * close the tabs (pages) we created.
 */
const CDP_ENDPOINT = process.env.PLAYWRIGHT_CDP_ENDPOINT ?? 'http://localhost:9222';

export const test = base.extend<{ context: BrowserContext; page: Page }>({
    context: async ({}, use) => {
        const browser = await chromium.connectOverCDP(CDP_ENDPOINT);
        // Reuse the user's existing default context so their logged-in / wallet-connected
        // session is available; fall back to a fresh context only if none exists.
        const context = browser.contexts()[0] ?? (await browser.newContext());
        await use(context);
        // Deliberately do NOT call browser.close() here — under CDP that can tear down the user's
        // entire Chrome session. We leave the CDP connection alone; the test runner process exiting
        // drops the socket cleanly.
    },
    page: async ({ context }, use) => {
        // Always open a NEW tab — never hijack a tab the user is working in.
        const page = await context.newPage();
        await use(page);
        // Close only the tab we opened.
        await page.close();
    },
});

export const expect = test.expect;
