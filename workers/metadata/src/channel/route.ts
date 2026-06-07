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

import { createMetadataChannelById } from '@/metadata/src/channel/createMetadataChannelById.js';
import { isSocialSourceInUrl } from '@/metadata/src/channel/isSocialSourceInUrl.js';
import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';

const VERSION = 2;

const QuerySchema = z.object({
    id: z.string(),
    source: z.string(),
    pathname: Pathname,
});

function getCacheKey(source: string, id: string, pathname: string, c: Context) {
    return `metadata:channel:${VERSION}:${getOrigin(c)}:${source}_${id}_${pathname}`;
}

const ChannelMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>().get(
    '/channel',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withHono(c, async () => {
            const { id, source, pathname } = c.req.valid('query');
            const source_ = source as SocialSourceInURL;
            if (!isSocialSourceInUrl(source_)) return createSiteMetadata(pathname);

            const cacheKey = getCacheKey(source, id, pathname, c);
            return withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    return createMetadataChannelById(source_, id, pathname, c);
                },
            });
        }),
);

export { ChannelMetadataRoute };
