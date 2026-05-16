import { createZodErrorResponseJson } from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { HttpUrl } from '@dimensiondev/workers-shared/schemas/HttpSchema.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const ProxyImageRoute = new Hono();

const Schema = z.object({
    url: HttpUrl,
});

ProxyImageRoute.get(
    '/',
    zValidator('query', Schema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { url } = c.req.valid('query');
            const response = await fetchWithContext(url, {
                context: c,
            });
            if (!response.ok) {
                return new Response('Unable to access the image', {
                    status: response.status,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            return new Response(response.body, {
                headers: {
                    'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
                    'Cache-Control': response.headers.get('cache-control') || 'public, max-age=31536000',
                },
            });
        }),
);

export { ProxyImageRoute };
