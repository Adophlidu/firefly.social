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
const BASE_URL = process.env.FF_E2E_BASE_URL ?? 'http://localhost:3000';

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
        // The user's pre-existing CDP context was not created by the test runner, so the config
        // `use.baseURL` does not apply to it — resolve relative URLs here instead.
        const originalGoto = page.goto.bind(page);
        page.goto = (url, options) =>
            originalGoto(/^https?:/.test(url) ? url : new URL(url, BASE_URL).toString(), options);

        // Spec copy assertions are the English source strings, but the app language follows the
        // `locale` cookie. Force English on the DEV-SERVER origin only for the duration of the
        // test, then restore the user's value.
        const origin = new URL(BASE_URL);
        const priorLocale = (await context.cookies(BASE_URL)).find((cookie) => cookie.name === 'locale');
        await context.addCookies([{ name: 'locale', value: 'en', domain: origin.hostname, path: '/' }]);

        await use(page);

        if (priorLocale) {
            await context.addCookies([priorLocale]);
        } else {
            await context.clearCookies({ name: 'locale', domain: origin.hostname });
        }
        // Close only the tab we opened.
        await page.close();
    },
});

export const expect = test.expect;
