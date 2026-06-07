import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { checkIframeBlocking } from '@/iframe-blocker/src/checkIframeBlocking.js';

const VERSION = 1;

const QuerySchema = z.object({
    link: z.url('Invalid URL format'),
});

function getCacheKey(url: string) {
    return `iframe-block:${VERSION}:${encodeURIComponent(url)}`;
}

const IframeBlockRoute = new Hono<{ Bindings: { IFRAME_BLOCK_CACHE: KVNamespace } }>().get(
    '/check',
    zValidator('query', QuerySchema, (result, c) => {
        if (!result.success) {
            return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
        }
        return;
    }),
    async (c) => {
        const { link } = c.req.valid('query');
        const result = await withCache({
            context: c,
            ttl: ONE_MONTH,
            getKey: () => getCacheKey(link),
            getCache: () => c.env.IFRAME_BLOCK_CACHE,
            compute: async () => checkIframeBlocking(link, c),
        });
        return c.json({ success: true, data: result });
    },
);

export { IframeBlockRoute };
