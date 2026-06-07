import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { createZodErrorResponseJson } from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { resolveSiteUrl } from '@dimensiondev/workers-shared/helpers/resolveSiteUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withHono } from '@dimensiondev/workers-shared/middlewares/withHono.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import type { Metadata } from 'next';
import z from 'zod';

import { getFireflyActivityInfo } from '@/metadata/src/event/getFireflyActivityInfo.js';
import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';

const VERSION = 1;

const QuerySchema = z.object({
    name: z.string(),
    pathname: Pathname,
    replaceName: z.string().optional(),
});

function getCacheKey(name: string, pathname: string, c: Context) {
    return `metadata:event:${VERSION}:${getOrigin(c)}:${name}_${pathname}`;
}

const EventMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>().get(
    '/event',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withHono(c, async () => {
            const { name, pathname, replaceName } = c.req.valid('query');
            const cacheKey = getCacheKey(name, pathname, c);
            return withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    const info = await getFireflyActivityInfo(replaceName || name, c).catch(() => null);
                    if (!info) return createSiteMetadata(pathname);

                    const title = info.title;
                    const description = info.description;
                    const images = [info.open_graph_url];

                    return createSiteMetadata(pathname, {
                        title,
                        description,
                        openGraph: {
                            type: 'website',
                            url: urlcat(resolveSiteUrl(c), `/event/${name}`),
                            title,
                            description,
                            images,
                        },
                        twitter: {
                            card: 'summary_large_image',
                            title,
                            description,
                            images,
                        },
                    });
                },
            });
        }),
);

export { EventMetadataRoute };
