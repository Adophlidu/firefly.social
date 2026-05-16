import { ONE_DAY, ONE_YEAR } from '@dimensiondev/workers-shared/constants/duration.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { searchToken } from '@/token/src/searchToken.js';
import { searchTokens } from '@/token/src/searchTokens.js';

// cache version
const SINGLE_VERSION = 2;
const BULK_VERSION = 3;

const TokenRoute = new Hono<{ Bindings: { TOKEN_CACHE: KVNamespace; KV: KVNamespace } }>();

const coerceBoolean = z.coerce.boolean();
const SearchQuerySchema = z.object({
    coingecko_id: z.string().nullable().optional(),
    network: z.string().optional(),
    chain_id: z.coerce.number().optional(),
    address: z.string().optional(),
    token_symbol: z.string().optional(),
    localization: coerceBoolean.optional(),
    tickers: coerceBoolean.optional(),
    market_data: coerceBoolean.optional(),
    community_data: coerceBoolean.optional(),
    developer_data: coerceBoolean.optional(),
    sparkline: coerceBoolean.optional(),
});

const SearchBulkQuerySchema = z.object({
    keyword: z.string(),
    fuzzy: coerceBoolean.optional(),
});

function getSearchCacheKey(queries: z.infer<typeof SearchQuerySchema>) {
    return `token:${SINGLE_VERSION}:${Object.entries(queries)
        .map(([k, v]) => `${k}=${v}`)
        .join('_')}`;
}

function getSearchBulkCacheKey(keyword: string, fuzzy: boolean) {
    return `token-bulk:${BULK_VERSION}:${keyword}:${fuzzy}`;
}

TokenRoute.get(
    '/search',
    zValidator('query', SearchQuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { ...queries } = c.req.valid('query');
            const cacheKey = getSearchCacheKey(queries);
            const token = await withCache({
                context: c,
                ttl: ONE_YEAR,
                getKey: () => cacheKey,
                getCache: () => c.env.TOKEN_CACHE,
                isValidCache: (result) => result !== null,
                compute: async () => {
                    const token = await searchToken(queries, c);
                    return token;
                },
            });
            return createSuccessResponseJson(token);
        }),
);

TokenRoute.get(
    '/search-bulk',
    zValidator('query', SearchBulkQuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { keyword, fuzzy = true } = c.req.valid('query');
            const tokens = await withCache({
                context: c,
                ttl: ONE_DAY,
                getKey: () => getSearchBulkCacheKey(keyword, fuzzy),
                getCache: () => c.env.TOKEN_CACHE,
                compute: async () => {
                    return searchTokens(keyword, fuzzy, c);
                },
            });
            return createSuccessResponseJson(tokens);
        }),
);

export { TokenRoute };
