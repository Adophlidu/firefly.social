import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { resolveTcoLink } from '@dimensiondev/workers-shared/helpers/resolveTcoLink.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { digestDocumentUrl } from '@/oembed/src/digestDocumentUrl.js';

const VERSION = 1;

const OembedRoute = new Hono<{ Bindings: { OG_CACHE: KVNamespace; TCO_CACHE: KVNamespace } }>();

const QuerySchema = z.object({
    link: z.url('Invalid URL format'),
});

function getCacheKey(link: string) {
    return `og:${VERSION}:${encodeURIComponent(link)}`;
}

OembedRoute.get(
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
            return createSuccessResponseJson(result);
        }),
);

OembedRoute.delete(
    '/',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) => {
        const { link } = c.req.valid('query');
        const cacheKey = getCacheKey(link);
        await c.env.OG_CACHE.delete(cacheKey);
        return createSuccessResponseJson(null);
    },
);

export { OembedRoute };
