import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { createPageTitleOG } from '@dimensiondev/workers-shared/helpers/createPageTitleOG.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/workers-shared/helpers/isAddress.js';
import { resolveSiteUrl } from '@dimensiondev/workers-shared/helpers/resolveSiteUrl.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { AddressSchema } from '@dimensiondev/workers-shared/schemas/Address.js';
import { ChainIdSchema } from '@dimensiondev/workers-shared/schemas/ChainId.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { searchToken } from '@dimensiondev/workers-token/searchToken.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import z from 'zod';

const VERSION = 3;

const QuerySchema = z.object({
    keyword: z.string(),
    pathname: Pathname,
    chainId: ChainIdSchema.optional(),
    address: AddressSchema.optional(),
    isCoinId: z.coerce.boolean().optional(),
});

const TokenMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>();

function getCacheKey(keyword: string, pathname: string, c: Context, chainId = 0, address = '0x0', isCoinId = false) {
    return `metadata:token:${VERSION}:${getOrigin(c)}:${keyword}_${pathname}_${chainId}_${address}_${isCoinId}`;
}

TokenMetadataRoute.get(
    '/token',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { keyword, pathname, chainId, address, isCoinId } = c.req.valid('query');
            const cacheKey = getCacheKey(keyword, pathname, c, chainId, address, isCoinId);
            const metadata = await withCache<ReturnType<typeof createSiteMetadata>>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    const isAddress = isValidAddressEthereum(keyword) || isValidAddressSolana(keyword);
                    const token = await searchToken(
                        {
                            token_symbol: isAddress || isCoinId ? undefined : keyword,
                            coingecko_id: isCoinId ? keyword : undefined,
                            address: isAddress ? keyword : address || undefined,
                            chain_id: chainId,
                        },
                        c,
                    );
                    if (!token) return createSiteMetadata(pathname);

                    const title = createPageTitleOG(`$${token.symbol.toUpperCase()}`);
                    const description = `Track ${token.name} in real time, swap tokens and see social sentiment all on Firefly.`;
                    const ogImage = token.logoURL;

                    return createSiteMetadata(pathname, {
                        title,
                        description,
                        openGraph: {
                            type: 'profile',
                            url: resolveSiteUrl(c),
                            title,
                            description,
                            images: [ogImage],
                        },
                        twitter: {
                            card: 'summary',
                            title,
                            description,
                            images: [ogImage],
                        },
                    });
                },
            });
            return createSuccessResponseJson(metadata);
        }),
);

export { TokenMetadataRoute };
