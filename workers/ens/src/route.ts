import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { attemptUntil } from '@dimensiondev/workers-shared/helpers/attemptUntil.js';
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

import { ChainId } from '@/ens/src/enums.js';
import { FireflyDomain } from '@/ens/src/providers/FireflyDomainAPI.js';

const VERSION = 1;

const EnsRoute = new Hono<{ Bindings: { ENS_CACHE: KVNamespace; KV: KVNamespace } }>();

function getCacheKey(domainOrAddress: string) {
    return `ens:${VERSION}:${encodeURIComponent(domainOrAddress)}`;
}

function cacheEnsPair(c: Context, address: string, domain: string, provider: string, ttl: number) {
    const addressKey = getCacheKey(address);
    const domainKey = getCacheKey(domain);

    return Promise.all([
        c.env.ENS_CACHE.put(addressKey, JSON.stringify({ address, domain, provider }), { expirationTtl: ttl }),
        c.env.ENS_CACHE.put(domainKey, JSON.stringify({ address, domain, provider }), { expirationTtl: ttl }),
    ]);
}

async function lookup(domain: string, c: Context) {
    return attemptUntil(
        [FireflyDomain].map((x) => async () => [x.id, await x.lookup(ChainId.Mainnet, domain, c)] as const),
        ['', ''] as const,
        (result) => !result?.[1],
    );
}

async function reverse(address: string, c: Context) {
    return attemptUntil(
        [FireflyDomain].map((x) => async () => [x.id, await x.reverse(ChainId.Mainnet, address, c)] as const),
        ['', ''] as const,
        (result) => !result?.[1],
    );
}

const LookupSchema = z.object({
    domain: z.string().min(1, 'Missing domain').max(255, 'Domain too long'),
});

const ReverseSchema = z.object({
    address: z
        .string()
        .length(42, 'Invalid address length')
        .regex(/^0x[a-fA-F0-9]{40}$/i, 'Invalid address format'),
});

EnsRoute.get(
    '/lookup',
    zValidator('query', LookupSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { domain } = c.req.valid('query');
            const result = await withCache({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => getCacheKey(domain),
                getCache: () => c.env.ENS_CACHE,
                setCache: async (result, ttl) => {
                    const { address, domain, provider } = result;
                    if (!address) return;
                    await cacheEnsPair(c, address, domain, provider, ttl);
                },
                compute: async () => {
                    const [provider, address] = await lookup(domain, c);
                    if (!address) return { address: null, domain };
                    return { address, domain, provider };
                },
            });
            return createSuccessResponseJson(result);
        }),
);

EnsRoute.get(
    '/reverse',
    zValidator('query', ReverseSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { address } = c.req.valid('query');
            const result = await withCache({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => getCacheKey(address),
                getCache: () => c.env.ENS_CACHE,
                setCache: async (result, ttl) => {
                    const { address, domain, provider } = result;
                    if (!domain) return;
                    await cacheEnsPair(c, address, domain, provider, ttl);
                },
                compute: async () => {
                    const [provider, domain] = await reverse(address, c);
                    if (!domain) return { domain: null, address };
                    return { address, domain, provider };
                },
            });
            return createSuccessResponseJson(result);
        }),
);

export { EnsRoute };
