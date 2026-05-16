import { compact } from '@dimensiondev/workers-shared/helpers/compact.js';
import {
    createErrorResponseJson,
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { resolveTcoLink } from '@dimensiondev/workers-shared/helpers/resolveTcoLink.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { classifyLink } from '@/og/src/classifyLink.js';

const OgRoute = new Hono<{ Bindings: { OG_CACHE: KVNamespace; TCO_CACHE: KVNamespace } }>();

const QuerySchema = z.union([
    z.object({
        url: z.string().min(1, 'url cannot be empty'),
    }),
    z.object({
        urls: z.string().min(1, 'urls cannot be empty'),
    }),
    z.object({
        'cache-urls': z.string().min(1, 'cache-urls cannot be empty'),
    }),
]);

OgRoute.get(
    '/',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const query = c.req.valid('query');

            // Handle ?url= - requires fetching from classifyLink and store to KV (single URL, returns single result)
            if ('url' in query) {
                const { url } = query;
                const urls = url
                    .split(',')
                    .map((u) => u.trim())
                    .filter(Boolean);

                if (urls.length === 0) {
                    return createErrorResponseJson('At least one URL is required', {
                        status: 400,
                    });
                }

                if (urls.length > 1) {
                    return createErrorResponseJson(
                        'url parameter only supports a single URL. Use urls parameter for multiple URLs.',
                        {
                            status: 400,
                        },
                    );
                }

                const singleUrl = urls[0];
                const resolvedLink = await resolveTcoLink(singleUrl, c);
                const result = await classifyLink(decodeURIComponent(resolvedLink), c);

                return createSuccessResponseJson(result);
            }

            // Handle ?urls= - requires fetching from classifyLink and store to KV (multiple URLs, returns array)
            // Handle ?cache-urls= - only from cache
            const urls_ = 'urls' in query ? query.urls : query['cache-urls'];
            const urls = urls_
                .split(',')
                .map((u) => u.trim())
                .filter(Boolean);

            if (urls.length === 0) {
                return createErrorResponseJson('At least one URL is required', {
                    status: 400,
                });
            }

            const promiseSettledResult = await Promise.allSettled(
                urls.map(async (url) => {
                    const resolvedLink = await resolveTcoLink(url, c);
                    const result = await classifyLink(decodeURIComponent(resolvedLink), c, 'cache-urls' in query);

                    return {
                        url,
                        result,
                    };
                }),
            );
            const results = compact(promiseSettledResult.map((x) => (x.status === 'fulfilled' ? x.value : null)));
            return createSuccessResponseJson(results);
        }),
);

export { OgRoute };
