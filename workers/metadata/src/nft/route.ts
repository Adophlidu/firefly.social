import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import z from 'zod';

import { createMetadataNft } from '@/metadata/src/nft/createMetadataNft.js';
import { parseChainId } from '@/metadata/src/nft/parseChainId.js';

type Metadata = Record<string, unknown>;

const VERSION = 1;

const QuerySchema = z.object({
    addressOrTokenId: z.string(),
    chainIdOrCollectionId: z.string(),
    tokenId: z.string(),
    pathname: Pathname,
});

const NftMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>();

function getCacheKey(
    pathname: string,
    addressOrTokenId: string,
    chainIdOrCollectionId: string,
    tokenId: string,
    c: Context,
) {
    return `metadata:nft:${VERSION}:${getOrigin(c)}:${pathname}_${chainIdOrCollectionId}_${addressOrTokenId}_${tokenId}`;
}

NftMetadataRoute.get(
    '/nft',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { pathname, addressOrTokenId, chainIdOrCollectionId, tokenId } = c.req.valid('query');
            const cacheKey = getCacheKey(pathname, chainIdOrCollectionId, addressOrTokenId, tokenId, c);
            const metadata = await withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    const { addressOrTokenId, tokenId, chainIdOrCollectionId } = await c.req.valid('query');
                    const chainId = parseChainId(chainIdOrCollectionId);
                    if (chainId)
                        return createMetadataNft(
                            chainId,
                            addressOrTokenId,
                            tokenId,
                            `/nft/${chainIdOrCollectionId}/${addressOrTokenId}/${tokenId}`,
                            c,
                        );
                    return createSiteMetadata(`/nft/${chainIdOrCollectionId}/${addressOrTokenId}/${tokenId}`);
                },
            });
            return createSuccessResponseJson(metadata);
        }),
);

export { NftMetadataRoute };
