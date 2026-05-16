import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { resolveSiteUrl } from '@dimensiondev/workers-shared/helpers/resolveSiteUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import z from 'zod';

import { getFireflyActivityInfo } from '@/metadata/src/event/getFireflyActivityInfo.js';

type Metadata = Record<string, unknown>;

const VERSION = 1;

const QuerySchema = z.object({
    name: z.string(),
    pathname: Pathname,
    replaceName: z.string().optional(),
});

const EventMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>();

function getCacheKey(name: string, pathname: string, c: Context) {
    return `metadata:event:${VERSION}:${getOrigin(c)}:${name}_${pathname}`;
}

EventMetadataRoute.get(
    '/event',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { name, pathname, replaceName } = c.req.valid('query');
            const cacheKey = getCacheKey(name, pathname, c);
            const metadata = await withCache<Metadata>({
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
            return createSuccessResponseJson(metadata);
        }),
);

export { EventMetadataRoute };
