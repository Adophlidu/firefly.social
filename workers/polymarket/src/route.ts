import { POLYMARKET_API_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const PolymarketRoute = new Hono();

const QuerySchema = z.object({
    user: z.string(),
});

PolymarketRoute.get(
    '/value',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { user } = c.req.valid('query');

            const result = await fetchJson(urlcat(POLYMARKET_API_URL, '/value', { user }), {
                context: c,
                headers: {
                    Referer: 'https://polymarket.com/',
                    Origin: 'https://polymarket.com',
                },
            });

            return createSuccessResponseJson(result);
        }),
);

export { PolymarketRoute };
