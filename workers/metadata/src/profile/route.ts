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

import { createMetadataProfileByHandle } from '@/metadata/src/profile/createMetadataProfileByHandle.js';

const VERSION = 3;

const QuerySchema = z.object({
    source: z.string(),
    handle: z.string(),
    pathname: Pathname,
});

function getCacheKey(handle: string, pathname: string, c: Context) {
    return `metadata:profile:${VERSION}:${getOrigin(c)}:${handle}_${pathname}`;
}

const ProfileMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>().get(
    '/profile',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withHono(c, async () => {
            const { handle, source, pathname } = c.req.valid('query');
            const cacheKey = getCacheKey(handle, pathname, c);
            return withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    return createMetadataProfileByHandle(source as SocialSourceInURL, pathname, handle, c);
                },
            });
        }),
);

export { ProfileMetadataRoute };
