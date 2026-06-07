import { FansStatus, OgStatus } from '@dimensiondev/enums';
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

import { createSparksAccountMetadata } from '@/metadata/src/sparks-account/createSparksAccountMetadata.js';
import { createSparksDefaultMetadata } from '@/metadata/src/sparks-account/createSparksDefaultMetadata.js';
import { getSparksProfileByUid } from '@/metadata/src/sparks-account/getSparksProfileByUid.js';

const VERSION = 1;

const QuerySchema = z.object({
    accountId: z.string(),
    pathname: Pathname,
});

function getCacheKey(accountId: string, pathname: string, c: Context) {
    return `metadata:sparks-account:${VERSION}:${getOrigin(c)}:${accountId}_${pathname}`;
}

const SparksAccountMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>().get(
    '/sparks-account',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withHono(c, async () => {
            const { accountId, pathname } = c.req.valid('query');
            const cacheKey = getCacheKey(accountId, pathname, c);

            return withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    const profile = await getSparksProfileByUid(accountId, c);
                    const isNotBoundX =
                        profile?.isOg === OgStatus.isNotBoundX && profile?.isFans === FansStatus.isNotBoundX;
                    const isOgUser = !!profile?.OgList?.length;
                    const isFansUser = !!profile?.FansList?.length;

                    if (!profile || !isOgUser || (isOgUser && !profile.ogActive) || !isFansUser || isNotBoundX) {
                        return createSparksDefaultMetadata(pathname, c);
                    }

                    return createSparksAccountMetadata(profile, pathname, c);
                },
            });
        }),
);

export { SparksAccountMetadataRoute };
