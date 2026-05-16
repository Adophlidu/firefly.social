import { ONE_YEAR } from '@dimensiondev/workers-shared/constants/duration.js';
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

import { digestImageUrl } from '@/sizeof/src/digestImageUrl.js';

const VERSION = 1;

const SizeofRoute = new Hono<{ Bindings: { SIZEOF_CACHE: KVNamespace; TCO_CACHE: KVNamespace } }>();

const QuerySchema = z.object({
    link: z.url('Invalid URL format'),
});

function getCacheKey(link: string) {
    return `sizeof:${VERSION}:${encodeURIComponent(link)}`;
}

SizeofRoute.get(
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
                ttl: ONE_YEAR,
                getKey: () => getCacheKey(resolvedLink),
                getCache: () => c.env.SIZEOF_CACHE,
                compute: async () => {
                    const result = await digestImageUrl(resolvedLink, c);
                    if (!result) throw new Error(`Unable to get image size for link = ${resolvedLink}`);

                    return result;
                },
            });
            return createSuccessResponseJson(result);
        }),
);

export { SizeofRoute };
