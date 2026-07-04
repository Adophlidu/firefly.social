import type { SocialSourceInURL } from '@dimensiondev/enums';
import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { createZodErrorResponseJson } from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withHono } from '@dimensiondev/workers-shared/middlewares/withHono.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import type { Metadata } from 'next';
import z from 'zod';

import { createMetadataPostById } from '@/metadata/src/post/createMetadataPostById.js';

const VERSION = 4;

const QuerySchema = z.object({
    source: z.string(),
    postId: z.string(),
    pathname: Pathname,
    s: z.string().optional(),
    sid: z.string().optional(),
});

function getCacheKey(postId: string, pathname: string, searchParams: string, c: Context) {
    return `metadata:post:${VERSION}:${getOrigin(c)}:${postId}_${pathname}${searchParams}`;
}

const PostMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>().get(
    '/post',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withHono(c, async () => {
            const { postId, source, pathname, s, sid } = c.req.valid('query');
            const sidValue = sid ?? s;
            const searchParamsString = sidValue ? `?sid=${sidValue}` : '';
            const cacheKey = getCacheKey(postId, pathname, searchParamsString, c);
            return withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    return createMetadataPostById(pathname, source as SocialSourceInURL, postId, searchParamsString, c);
                },
            });
        }),
);

export { PostMetadataRoute };
