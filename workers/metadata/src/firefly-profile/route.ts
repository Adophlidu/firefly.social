import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { SITE_DESCRIPTION, SITE_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { Source } from '@dimensiondev/workers-shared/constants/source.js';
import { createPageTitleOG } from '@dimensiondev/workers-shared/helpers/createPageTitleOG.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { resolveSourceInUrl } from '@dimensiondev/workers-shared/helpers/resolveSource.js';
import { runInSafeAsync } from '@dimensiondev/workers-shared/helpers/runInSafe.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import z from 'zod';

import { getAllRelatedProfileInfo } from '@/metadata/src/firefly-profile/getAllRelatedProfileInfo.js';
import { isNumericalProfileId } from '@/metadata/src/firefly-profile/isNumericalProfileId.js';

type Metadata = Record<string, unknown>;

const VERSION = 1;

const QuerySchema = z.object({
    source: z.string(),
    pathname: Pathname,
});

const FireflyProfileMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>();

function getCacheKey(source: string, pathname: string, c: Context) {
    return `metadata:firefly-profile:${VERSION}:${getOrigin(c)}:${source}_${pathname}`;
}

FireflyProfileMetadataRoute.get(
    '/firefly-profile',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { source, pathname } = c.req.valid('query');
            const cacheKey = getCacheKey(source, pathname, c);

            const uid = isNumericalProfileId(source) ? source : null;
            if (!uid) return createSuccessResponseJson(createSiteMetadata(`/profile/${source}`));

            const metadata = await withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    const relatedProfile = await runInSafeAsync(() => getAllRelatedProfileInfo({ uid }, c));
                    if (!relatedProfile?.account) return createSiteMetadata(pathname);

                    const images = [
                        {
                            url: urlcat(SITE_URL, `/api/og/profile/${resolveSourceInUrl(Source.Firefly)}/${uid}/image`),
                        },
                    ];

                    const title = createPageTitleOG(`${relatedProfile.account.displayName || 'Firefly User'}`);
                    const description = SITE_DESCRIPTION;

                    return createSiteMetadata(pathname, {
                        title,
                        description,
                        openGraph: {
                            type: 'profile',
                            url: urlcat(SITE_URL, `/profile/${uid}`),
                            title,
                            description,
                            images,
                        },
                        twitter: {
                            card: 'summary_large_image',
                            title,
                            description,
                            images,
                        },
                    });
                },
            });
            return createSuccessResponseJson(metadata);
        }),
);

export { FireflyProfileMetadataRoute };
