import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import type { MessageDataPatch } from '@/farcaster/src/message/encodeMessageData.js';
import { encodeMessageData } from '@/farcaster/src/message/encodeMessageData.js';

const EncodeSchema = z.object({
    token: z.string(),
    profileId: z.string(),
    data: z.unknown(),
});

const FarcasterMessageRoute = new Hono().post(
    '/encode',
    zValidator('json', EncodeSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { token, profileId, data } = c.req.valid('json');
            const result = await encodeMessageData(profileId, token, data as MessageDataPatch);
            return createSuccessResponseJson(result);
        }),
);

export { FarcasterMessageRoute };
