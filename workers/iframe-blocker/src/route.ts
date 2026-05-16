import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { checkIframeBlocking } from '@/iframe-blocker/src/checkIframeBlocking.js';

const VERSION = 1;

const IframeBlockRoute = new Hono<{ Bindings: { IFRAME_BLOCK_CACHE: KVNamespace } }>();

const QuerySchema = z.object({
    link: z.url('Invalid URL format'),
});

function getCacheKey(url: string) {
    return `iframe-block:${VERSION}:${encodeURIComponent(url)}`;
}

IframeBlockRoute.get(
    '/check',
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

            const result = await withCache({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => getCacheKey(link),
                getCache: () => c.env.IFRAME_BLOCK_CACHE,
                compute: async () => {
                    const blockResult = await checkIframeBlocking(link, c);
                    return blockResult;
                },
            });

            return createSuccessResponseJson(result);
        }),
);

export { IframeBlockRoute };
