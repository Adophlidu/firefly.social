import { ONE_HOUR } from '@dimensiondev/workers-shared/constants/duration.js';
import { Source } from '@dimensiondev/workers-shared/constants/source.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { getTrendingChannels } from '@/ui-suggested-channels/src/getSuggestedChannels.js';

const VERSION = 1;

const SuggestedChannelsRoute = new Hono<{ Bindings: { UI_CACHE: KVNamespace } }>();

const QuerySchema = z.object({});

function getCacheKey() {
    return `suggested-channels:${VERSION}`;
}

SuggestedChannelsRoute.get(
    '/suggested-channels',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const result = await withCache({
                context: c,
                ttl: ONE_HOUR,
                getKey: () => getCacheKey(),
                getCache: () => c.env.UI_CACHE,
                compute: async () => {
                    const channels = await getTrendingChannels([Source.Farcaster, Source.Lens, Source.Bsky], 3, c);
                    return channels;
                },
            });
            return createSuccessResponseJson(result);
        }),
);

export { SuggestedChannelsRoute };
