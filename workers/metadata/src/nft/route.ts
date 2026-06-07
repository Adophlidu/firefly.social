import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { createZodErrorResponseJson } from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withHono } from '@dimensiondev/workers-shared/middlewares/withHono.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import type { Metadata } from 'next';
import z from 'zod';

import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';
import { createMetadataNft } from '@/metadata/src/nft/createMetadataNft.js';
import { parseChainId } from '@/metadata/src/nft/parseChainId.js';

const VERSION = 1;

const QuerySchema = z.object({
    addressOrTokenId: z.string(),
    chainIdOrCollectionId: z.string(),
    tokenId: z.string(),
    pathname: Pathname,
});

function getCacheKey(
    pathname: string,
    addressOrTokenId: string,
    chainIdOrCollectionId: string,
    tokenId: string,
    c: Context,
) {
    return `metadata:nft:${VERSION}:${getOrigin(c)}:${pathname}_${chainIdOrCollectionId}_${addressOrTokenId}_${tokenId}`;
}

const NftMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>().get(
    '/nft',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withHono(c, async () => {
            const { pathname, addressOrTokenId, chainIdOrCollectionId, tokenId } = c.req.valid('query');
            const cacheKey = getCacheKey(pathname, chainIdOrCollectionId, addressOrTokenId, tokenId, c);
            return withCache<Metadata>({
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
        }),
);

export { NftMetadataRoute };
