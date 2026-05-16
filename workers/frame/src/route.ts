import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import {
    createErrorResponseJson,
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';
import { resolveTcoLink } from '@dimensiondev/workers-shared/helpers/resolveTcoLink.js';
import { safeUnreachable } from '@dimensiondev/workers-shared/helpers/unreachable.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { HttpUrl } from '@dimensiondev/workers-shared/schemas/HttpSchema.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { digestDocument, digestDocumentUrl } from '@/frame/src/digestDocumentUrl.js';
import { getFrameErrorMessage } from '@/frame/src/getFrameErrorMessage.js';
import { getGatewayErrorMessage } from '@/frame/src/getGatewayErrorMessage.js';
import { ActionType } from '@/frame/src/types.js';

const VERSION = 1;

const FrameRoute = new Hono<{ Bindings: { FRAME_CACHE: KVNamespace; TCO_CACHE: KVNamespace } }>();

const QuerySchema = z.object({
    link: z.url('Invalid URL format'),
});

const PostQuerySchema = z.object({
    action: z.enum(ActionType),
    url: HttpUrl,
    'post-url': HttpUrl,
    target: z.union([HttpUrl, z.literal(null)]).optional(),
});

function getCacheKey(link: string) {
    return `frame:${VERSION}:${encodeURIComponent(link)}`;
}

FrameRoute.get(
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
            const { link } = c.req.valid('query');
            const resolvedLink = await resolveTcoLink(link, c);
            const linkDigested = await withCache({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => getCacheKey(resolvedLink),
                getCache: () => c.env.FRAME_CACHE,
                isValidCache: (result) => !!result.frame,
                compute: async () => {
                    const result = await digestDocumentUrl(decodeURIComponent(resolvedLink), c);
                    if (!result) throw new Error(`Unable to digest frame link = ${resolvedLink}`);
                    return result;
                },
            });
            return createSuccessResponseJson(linkDigested);
        }),
);

FrameRoute.post(
    '/',
    zValidator('query', PostQuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { action, url, target = null, 'post-url': postUrl } = c.req.valid('query');

            const packet = await c.req.text();
            const parsedPacket = parseJson<{ untrustedData: { transactionId?: string } }>(packet);

            const response = await fetchWithContext(
                // if transactionId exists, then we post upon postUrl stead of target
                parsedPacket?.untrustedData.transactionId ? postUrl || target || url : target || postUrl || url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: packet,

                    // for post_redirect, we need to handle the redirect manually
                    redirect: action === ActionType.PostRedirect ? 'manual' : 'follow',
                    context: c,
                },
            );

            // workaround: if the server cannot handle the post_redirect action correctly, then redirecting to the frame url
            if (action === ActionType.PostRedirect && response.status >= 400) {
                return createSuccessResponseJson({
                    redirectUrl: url,
                });
            }

            if (response.status < 200 || response.status >= 400) {
                const text = await response.text();
                console.error(`[frame] response status: ${response.status}\n%s`, text);
                return createErrorResponseJson(getFrameErrorMessage(text), { status: 400 });
            }

            try {
                switch (action) {
                    case ActionType.Post:
                        return createSuccessResponseJson({
                            frame: await digestDocument(url, await response.text(), c),
                        });
                    case ActionType.PostRedirect:
                        const locationUrl = response.headers.get('Location');
                        if (response.status >= 300 && response.status < 400) {
                            if (locationUrl && HttpUrl.safeParse(locationUrl).success)
                                return createSuccessResponseJson({
                                    redirectUrl: locationUrl,
                                });
                        }
                        console.error(`Failed to redirect to ${locationUrl}\n%s`, await response.text());
                        return createErrorResponseJson(
                            'The frame server cannot handle the post-redirect request correctly.',
                            {
                                status: 500,
                            },
                        );
                    case ActionType.Link:
                        return createErrorResponseJson('Not available', {
                            status: 400,
                        });
                    case ActionType.Mint:
                        return createErrorResponseJson('Not available', {
                            status: 400,
                        });
                    case ActionType.Transaction: {
                        if (parsedPacket?.untrustedData.transactionId) {
                            return createSuccessResponseJson(await digestDocument(url, await response.text(), c));
                        }
                        const tx = await response.json();
                        return createSuccessResponseJson(tx);
                    }
                    default:
                        safeUnreachable(action);
                        return createErrorResponseJson(`Unknown action: ${action}`, { status: 400 });
                }
            } catch (error) {
                return createErrorResponseJson(getGatewayErrorMessage(error), { status: 500 });
            }
        }),
);

FrameRoute.delete(
    '/',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) => {
        const { link } = c.req.valid('query');
        const resolvedLink = await resolveTcoLink(link, c);
        const cacheKey = getCacheKey(resolvedLink);
        await c.env.FRAME_CACHE.delete(cacheKey);
        return createSuccessResponseJson(null);
    },
);

export { FrameRoute };
