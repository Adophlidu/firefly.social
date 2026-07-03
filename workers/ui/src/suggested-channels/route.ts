import { Source } from '@dimensiondev/enums';
import { ONE_HOUR } from '@dimensiondev/workers-shared/constants/duration.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { getTrendingChannels } from '@/ui/src/suggested-channels/getSuggestedChannels.js';

const VERSION = 1;

const QuerySchema = z.object({});

function getCacheKey() {
    return `suggested-channels:${VERSION}`;
}

const SuggestedChannelsRoute = new Hono<{ Bindings: { UI_CACHE: KVNamespace } }>().get(
    '/suggested-channels',
    zValidator('query', QuerySchema, (result, c) => {
        if (!result.success) {
            return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
        }
        return;
    }),
    async (c) => {
        const result = await withCache({
            context: c,
            ttl: ONE_HOUR,
            getKey: () => getCacheKey(),
            getCache: () => c.env.UI_CACHE,
            compute: async () => getTrendingChannels([Source.Farcaster, Source.Lens, Source.Bsky], 3, c),
        });
        return c.json({ success: true, data: result });
    },
);

export { SuggestedChannelsRoute };
