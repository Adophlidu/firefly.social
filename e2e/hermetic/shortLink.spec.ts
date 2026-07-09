import { expect, test } from './fixtures';

/**
 * Short-link resolution (/i/[hash]) — Phase 2 of #9385, resolution path only.
 *
 * Malformed hashes are rejected by the format guard before any Redis call, so
 * those assertions are fully hermetic. The unknown-but-well-formed case needs
 * the dedicated short-link Redis (SHORT_LINK_KV_REST_API_* env vars on the dev
 * server); it is skipped when the suite runs without them.
 */
test.describe('short link resolution', () => {
    test('malformed hashes 404 before touching Redis', async ({ request }) => {
        for (const path of ['/i/short', '/i/way-too-long-hash', '/i/abcdefghijk', '/i/ABCDEFGHI', '/i/aaaa-aaaaa']) {
            const response = await request.get(path, { maxRedirects: 0 });
            expect(response.status(), path).toBe(404);
        }
    });

    test('an unknown well-formed hash 404s', async ({ request }) => {
        test.skip(!process.env.SHORT_LINK_KV_REST_API_URL, 'needs the short-link Redis env vars');

        const response = await request.get('/i/zzzzzzzzzz', { maxRedirects: 0 });
        expect(response.status()).toBe(404);
    });
});
