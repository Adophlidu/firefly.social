import { expect, test } from './fixtures';

/**
 * Short-link resolution (/i/[code]) — Phase 2 of #9385, resolution path only.
 *
 * Malformed codes are rejected by the format guard before any backend call, so
 * that assertion is fully hermetic. Resolving a well-formed code now calls out
 * to Mask-X-Backend's `GET /v1/shortlinks` from the Next.js server itself (the
 * edge route runs server-side, not inside the page) — Playwright's
 * `context.route()` only intercepts requests a page/browser makes, so that
 * outbound call can't be stubbed hermetically here; it isn't covered by this
 * suite.
 */
test.describe('short link resolution', () => {
    test('malformed codes 404 before touching the backend', async ({ request }) => {
        for (const path of [
            '/i/short',
            '/i/waytoolongcodewaytoolong',
            '/i/abcdefghijk',
            '/i/ABCDEFGHIJK!',
            '/i/aaaa-aaaaaaa',
        ]) {
            const response = await request.get(path, { maxRedirects: 0 });
            expect(response.status(), path).toBe(404);
        }
    });
});
