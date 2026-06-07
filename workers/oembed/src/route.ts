import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { resolveTcoLink } from '@dimensiondev/workers-shared/helpers/resolveTcoLink.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { digestDocumentUrl } from '@/oembed/src/digestDocumentUrl.js';

const VERSION = 1;

const QuerySchema = z.object({
    link: z.url('Invalid URL format'),
});

function getCacheKey(link: string) {
    return `og:${VERSION}:${encodeURIComponent(link)}`;
}

const OembedRoute = new Hono<{ Bindings: { OG_CACHE: KVNamespace; TCO_CACHE: KVNamespace } }>()
    .get(
        '/',
        zValidator('query', QuerySchema, (result, c) => {
            if (!result.success) {
                return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
            }
            return;
        }),
        async (c) => {
            const { link } = c.req.valid('query');
            const resolvedLink = await resolveTcoLink(link, c);
            const result = await withCache({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => getCacheKey(resolvedLink),
                getCache: () => c.env.OG_CACHE,
                compute: async () => {
                    const linkDigested = await digestDocumentUrl(decodeURIComponent(resolvedLink), c);
                    if (!linkDigested) throw new Error(`Unable to digest oembed link = ${resolvedLink}`);
                    return linkDigested;
                },
            });
            return c.json({ success: true, data: result });
        },
    )
    .delete(
        '/',
        zValidator('query', QuerySchema, (result, c) => {
            if (!result.success) {
                return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
            }
            return;
        }),
        async (c) => {
            const { link } = c.req.valid('query');
            const cacheKey = getCacheKey(link);
            await c.env.OG_CACHE.delete(cacheKey);
            return c.json({ success: true, data: null });
        },
    );

export { OembedRoute };
