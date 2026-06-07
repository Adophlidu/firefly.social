import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { createZodErrorResponseJson } from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withHono } from '@dimensiondev/workers-shared/middlewares/withHono.js';
import { ChainIdSchema } from '@dimensiondev/workers-shared/schemas/ChainId.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import type { Metadata } from 'next';
import z from 'zod';

import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';
import { generateSwapMetadata } from '@/metadata/src/transaction/generateSwapMetadata.js';
import { generateTipsMetadata } from '@/metadata/src/transaction/generateTipsMetadata.js';
import { getSwapActivityByHash } from '@/metadata/src/transaction/getSwapActivityByHash.js';
import { getTipsTransactionByHash } from '@/metadata/src/transaction/getTipsTransactionByHash.js';
import { isValidTransactionHash } from '@/metadata/src/transaction/isValidTransactionHash.js';

const VERSION = 2;

const QuerySchema = z.object({
    chainId: ChainIdSchema,
    hash: z.string(),
    pathname: Pathname,
});

function getCacheKey(chainId: number, hash: string, pathname: string, c: Context) {
    return `metadata:transaction:${VERSION}:${getOrigin(c)}:${chainId}_${hash}_${pathname}`;
}

const TransactionMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>().get(
    '/transaction',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withHono(c, async () => {
            const { chainId, hash, pathname } = c.req.valid('query');
            const cacheKey = getCacheKey(chainId, hash, pathname, c);

            if (!isValidTransactionHash(hash)) return createSiteMetadata(pathname);

            return withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    const tipsTransaction = await getTipsTransactionByHash(hash, c);
                    if (tipsTransaction) return generateTipsMetadata(pathname, hash, chainId, tipsTransaction, c);

                    const swapData = await getSwapActivityByHash(chainId, hash, c);
                    if (swapData) return generateSwapMetadata(pathname, hash, chainId, swapData, c);

                    return createSiteMetadata(pathname);
                },
            });
        }),
);

export { TransactionMetadataRoute };
