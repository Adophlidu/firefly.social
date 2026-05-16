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

import { resolveIdentity } from '@/x-identity/src/resolveIdentity.js';

const VERSION = 1;

const XIdentityRoute = new Hono<{ Bindings: { X_CACHE: KVNamespace; KV: KVNamespace } }>();

function getCacheKey(userId: string) {
    return `x:${VERSION}:${userId}`;
}

const ResolveUserIdSchema = z.object({
    id: z.string().min(1, 'Missing user ID').max(255, 'User ID too long'),
});

XIdentityRoute.get(
    '/',
    zValidator('query', ResolveUserIdSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
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
            return createSuccessResponseJson(result);
        }),
);

export { XIdentityRoute };
