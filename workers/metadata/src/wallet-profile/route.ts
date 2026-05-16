import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import {
    createErrorResponseJsonFromError,
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import z from 'zod';

import { createMetadataWalletProfile } from '@/metadata/src/wallet-profile/createMetadataWalletProfile.js';

const VERSION = 2;

const QuerySchema = z.object({
    addressOrEns: z.string(),
    pathname: Pathname,
});

const WalletProfileMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>();

function getCacheKey(addressOrEns: string, pathname: string, c: Context) {
    return `metadata:wallet-profile:${VERSION}:${getOrigin(c)}:${addressOrEns}_${pathname}`;
}

WalletProfileMetadataRoute.get(
    '/wallet-profile',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) => {
        try {
            const { addressOrEns, pathname } = c.req.valid('query');
            const cacheKey = getCacheKey(addressOrEns, pathname, c);
            const metadata = await withCache<Awaited<ReturnType<typeof createMetadataWalletProfile>>>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    return createMetadataWalletProfile(addressOrEns, pathname, c);
                },
            });
            return createSuccessResponseJson(metadata);
        } catch (error) {
            return createErrorResponseJsonFromError(error);
        }
    },
);

export { WalletProfileMetadataRoute };
