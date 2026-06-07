import { Source } from '@dimensiondev/enums';
import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { SITE_DESCRIPTION, SITE_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { createPageTitleOG } from '@dimensiondev/workers-shared/helpers/createPageTitleOG.js';
import { createZodErrorResponseJson } from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { resolveSourceInUrl } from '@dimensiondev/workers-shared/helpers/resolveSource.js';
import { runInSafeAsync } from '@dimensiondev/workers-shared/helpers/runInSafe.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withHono } from '@dimensiondev/workers-shared/middlewares/withHono.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import type { Metadata } from 'next';
import z from 'zod';

import { getAllRelatedProfileInfo } from '@/metadata/src/firefly-profile/getAllRelatedProfileInfo.js';
import { isNumericalProfileId } from '@/metadata/src/firefly-profile/isNumericalProfileId.js';
import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';

const VERSION = 1;

const QuerySchema = z.object({
    source: z.string(),
    pathname: Pathname,
});

function getCacheKey(source: string, pathname: string, c: Context) {
    return `metadata:firefly-profile:${VERSION}:${getOrigin(c)}:${source}_${pathname}`;
}

const FireflyProfileMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>().get(
    '/firefly-profile',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withHono(c, async () => {
            const { source, pathname } = c.req.valid('query');
            const cacheKey = getCacheKey(source, pathname, c);

            const uid = isNumericalProfileId(source) ? source : null;
            if (!uid) return createSiteMetadata(`/profile/${source}`);

            return withCache<Metadata>({
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
        }),
);

export { FireflyProfileMetadataRoute };
