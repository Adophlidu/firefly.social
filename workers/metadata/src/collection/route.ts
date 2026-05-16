import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { runInSafeAsync } from '@dimensiondev/workers-shared/helpers/runInSafe.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import z from 'zod';

import { isNftDetailPage } from '@/metadata/src/collection/isNftDetailPage.js';
import { createMetadataCollection } from '@/metadata/src/nft/createMetadataCollection.js';
import { createMetadataNft } from '@/metadata/src/nft/createMetadataNft.js';
import { getCollection } from '@/metadata/src/nft/getCollection.js';
import { parseChainId } from '@/metadata/src/nft/parseChainId.js';

type Metadata = Record<string, unknown>;

const VERSION = 1;

const QuerySchema = z.object({
    chainIdOrCollectionId: z.string(),
    addressOrTokenId: z.string(),
    pathname: Pathname,
});

const CollectionMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>();

function getCacheKey(pathname: string, chainIdOrCollectionId: string, addressOrTokenId: string, c: Context) {
    return `metadata:collection:${VERSION}:${getOrigin(c)}:${pathname}_${addressOrTokenId}_${chainIdOrCollectionId}`;
}

CollectionMetadataRoute.get(
    '/nft-collection',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { pathname, chainIdOrCollectionId, addressOrTokenId } = c.req.valid('query');
            const cacheKey = getCacheKey(pathname, chainIdOrCollectionId, addressOrTokenId, c);
            const metadata = await withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    const { chainIdOrCollectionId, addressOrTokenId } = await c.req.valid('query');

                    const chainId = parseChainId(chainIdOrCollectionId);
                    if (isNftDetailPage(chainIdOrCollectionId, addressOrTokenId) && chainId) {
                        const collection = await runInSafeAsync(() => getCollection(chainId, addressOrTokenId, c));
                        if (collection) {
                            const { contract_address: address, chain_id: chainId } = collection;
                            return createMetadataNft(
                                +chainId,
                                address,
                                addressOrTokenId,
                                `/nft/${chainId}/${address}/${addressOrTokenId}`,
                                c,
                            );
                        }
                    }
                    if (chainId)
                        return createMetadataCollection(
                            chainId,
                            addressOrTokenId,
                            `/nft/${chainId}/${addressOrTokenId}`,
                            c,
                        );

                    return createSiteMetadata(`/nft/${chainIdOrCollectionId}/${addressOrTokenId}`);
                },
            });
            return createSuccessResponseJson(metadata);
        }),
);

export { CollectionMetadataRoute };
