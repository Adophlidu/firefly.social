import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { RecognizableError } from '@dimensiondev/workers-shared/constants/error.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import { resolveHandle } from '@/bsky-identity/src/resolveHandle.js';
import { resolveIdentity } from '@/bsky-identity/src/resolveIdentity.js';

const VERSION = 1;

function getCacheKey(identifier: string) {
    return `bsky:${VERSION}:${encodeURIComponent(identifier)}`;
}

function cacheBskyPair(c: Context, did: string, handle: string, ttl: number) {
    const didKey = getCacheKey(did);
    const handleKey = getCacheKey(handle);

    return Promise.all([
        c.env.BSKY_CACHE.put(didKey, JSON.stringify({ did, handle }), { expirationTtl: ttl }),
        c.env.BSKY_CACHE.put(handleKey, JSON.stringify({ did, handle }), { expirationTtl: ttl }),
    ]);
}

const ResolveHandleSchema = z.object({
    handle: z.string().min(1, 'Missing handle').max(255, 'Handle too long'),
});

const ResolveDidSchema = z.object({
    did: z.string().min(1, 'Missing DID').max(255, 'DID too long'),
});

const BskyIdentityRoute = new Hono<{ Bindings: { BSKY_CACHE: KVNamespace; KV: KVNamespace } }>()
    .get(
        '/resolve-handle',
        zValidator('query', ResolveHandleSchema, (result) => {
            if (!result.success) {
                return createZodErrorResponseJson(result.error, {
                    status: 400,
                });
            }
        }),
        async (c) =>
            withErrorHandler(async () => {
                const { handle } = c.req.valid('query');
                const result = await withCache({
                    context: c,
                    ttl: ONE_MONTH,
                    getKey: () => getCacheKey(handle),
                    getCache: () => c.env.BSKY_CACHE,
                    setCache: async (result, ttl) => {
                        const { did, handle } = result;
                        await cacheBskyPair(c, did, handle, ttl);
                    },
                    compute: async () => {
                        const did = await resolveHandle(handle, c);
                        if (!did) throw new RecognizableError(`Unable to resolve handle = ${handle}`);
                        return { did, handle };
                    },
                });
                return createSuccessResponseJson(result);
            }),
    )
    .get(
        '/resolve-did',
        zValidator('query', ResolveDidSchema, (result) => {
            if (!result.success) {
                return createZodErrorResponseJson(result.error, {
                    status: 400,
                });
            }
        }),
        async (c) =>
            withErrorHandler(async () => {
                const { did } = c.req.valid('query');
                const result = await withCache({
                    context: c,
                    ttl: ONE_MONTH,
                    getKey: () => getCacheKey(did),
                    getCache: () => c.env.BSKY_CACHE,
                    setCache: async (result, ttl) => {
                        const { did, handle } = result;
                        await cacheBskyPair(c, did, handle, ttl);
                    },
                    compute: async () => {
                        const handle = await resolveIdentity(did, c);
                        if (!handle) throw new RecognizableError(`Unable to resolve DID = ${did}`);
                        return { did, handle };
                    },
                });
                return createSuccessResponseJson(result);
            }),
    );

export { BskyIdentityRoute };
