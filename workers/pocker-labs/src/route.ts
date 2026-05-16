import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const AnnouncementSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Missing title').max(255, 'Title too long'),
    content: z.string().min(1, 'Missing description').max(20000, 'Description too long'),
    date: z.string().datetime(),
});
const AnnouncementListSchema = z.array(AnnouncementSchema);

const PockerRoute = new Hono<{ Bindings: { KV: KVNamespace } }>();

const KEY = 'pocker:announcement';

PockerRoute.get('/announcement', (c) =>
    withErrorHandler(async () => {
        const data = await c.env.KV.get(KEY, 'json');
        return createSuccessResponseJson(data || {});
    }),
);

PockerRoute.post(
    '/announcement',
    zValidator('json', AnnouncementListSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const data = await c.req.json();
            await c.env.KV.put(KEY, JSON.stringify(data));
            return createSuccessResponseJson(data);
        }),
);

export { PockerRoute };
