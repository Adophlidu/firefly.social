import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { fetchBadgeLevels } from '@/unifi-badge-level/src/fetchBadgeLevels.js';

const MAX_BATCH_SIZE = 100;

const BadgeLevelPlatformSchema = z.enum(['eth', 'twitter', 'lens', 'farcaster', 'account', 'bsky']);

const BatchBodySchema = z.object({
    queries: z
        .array(
            z.object({
                platform: BadgeLevelPlatformSchema,
                id: z.string().min(1, 'id is required'),
            }),
        )
        .min(1, 'At least one query is required')
        .max(MAX_BATCH_SIZE, `At most ${MAX_BATCH_SIZE} queries are allowed`),
});

const UnifiBadgeLevelRoute = new Hono<{ Bindings: { UNIFI_BADGE_LEVEL_CACHE: KVNamespace } }>().post(
    '/',
    zValidator('json', BatchBodySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { queries } = c.req.valid('json');
            const results = await fetchBadgeLevels(queries, c);
            return createSuccessResponseJson({ results });
        }),
);

export { UnifiBadgeLevelRoute };
