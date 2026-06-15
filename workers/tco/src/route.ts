import { ONE_YEAR } from '@dimensiondev/workers-shared/constants/duration.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { resolveLink } from '@/tco/src/resolveLink.js';

const VERSION = 1;

const QuerySchema = z.object({
    link: z.url('Invalid URL format'),
});

function getCacheKey(link: string) {
    return `tco:${VERSION}:${encodeURIComponent(link)}`;
}

const TcoRoute = new Hono<{ Bindings: { TCO_CACHE: KVNamespace } }>().get(
    '/',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { link } = c.req.valid('query');
            const cacheKey = getCacheKey(link);
            const resolved = await withCache({
                context: c,
                ttl: ONE_YEAR,
                getKey: () => cacheKey,
                getCache: () => c.env.TCO_CACHE,
                compute: async () => {
                    const resolved = await resolveLink(link, c);
                    if (!resolved) throw new Error(`Unable to resolve t.co link = ${link}`);
                    return { resolved };
                },
            });
            return createSuccessResponseJson(resolved);
        }),
);

export { TcoRoute };
