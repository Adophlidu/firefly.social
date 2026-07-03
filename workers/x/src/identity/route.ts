import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { resolveIdentity } from '@/x/src/identity/resolveIdentity.js';

const VERSION = 1;

function getCacheKey(userId: string) {
    return `x:${VERSION}:${userId}`;
}

const ResolveUserIdSchema = z.object({
    id: z.string().min(1, 'Missing user ID').max(255, 'User ID too long'),
});

const XIdentityRoute = new Hono<{ Bindings: { X_CACHE: KVNamespace; KV: KVNamespace } }>().get(
    '/',
    zValidator('query', ResolveUserIdSchema, (result, c) => {
        if (!result.success) {
            return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
        }
        return;
    }),
    async (c) => {
        const { id: userId } = c.req.valid('query');
        const result = await withCache({
            context: c,
            ttl: ONE_MONTH,
            getKey: () => getCacheKey(userId),
            getCache: () => c.env.X_CACHE,
            compute: async () => {
                const username = await resolveIdentity(userId, c);
                if (!username) throw new Error(`Unable to resolve user ID = ${userId}`);
                return { username };
            },
        });
        return c.json({ success: true, data: result });
    },
);

export { XIdentityRoute };
