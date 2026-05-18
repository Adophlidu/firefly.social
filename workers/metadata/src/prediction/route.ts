import type { PredictionPlatform } from '@dimensiondev/enums';
import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { SITE_NAME } from '@dimensiondev/workers-shared/constants/metadata.js';
import { createPageTitleOG } from '@dimensiondev/workers-shared/helpers/createPageTitleOG.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import { formatAddress } from '@dimensiondev/workers-shared/helpers/formatAddress.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { resolveSiteUrl } from '@dimensiondev/workers-shared/helpers/resolveSiteUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import z from 'zod';

import { getEventDetail } from '@/metadata/src/prediction/getPredictionBySlug.js';
import { getPredictionProfile } from '@/metadata/src/prediction/getPredictionProfile.js';
import { getSocialProfile } from '@/metadata/src/prediction/getSocialProfile.js';

type Metadata = Record<string, unknown>;

const VERSION = 1;

const PredictionProfileQuerySchema = z.object({
    platform: z.string(),
    address: z.string(),
    pathname: Pathname,
});

const PredictionEventQuerySchema = z.object({
    platform: z.string(),
    id: z.string(),
    pathname: Pathname,
    type: z.string().optional(),
});

const PredictionMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>();

function getProfileCacheKey(platform: string, address: string, pathname: string, c: Context) {
    return `metadata:prediction:profile:${VERSION}:${getOrigin(c)}:${platform}_${address}_${pathname}`;
}

function getEventCacheKey(platform: string, id: string, isMutil: boolean, pathname: string, c: Context) {
    return `metadata:prediction:event:${VERSION}:${getOrigin(c)}:${platform}_${id}_${pathname}`;
}

PredictionMetadataRoute.get(
    '/prediction-profile',
    zValidator('query', PredictionProfileQuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { platform, address, pathname } = c.req.valid('query');
            const cacheKey = getProfileCacheKey(platform, address, pathname, c);
            const metadata = await withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    const ogImageUrl = urlcat(
                        resolveSiteUrl(c),
                        `/api/og/prediction/profile/${platform}/${address}/image`,
                    );
                    const profile = await getPredictionProfile(platform as PredictionPlatform, address, c);

                    // Get social profile for the wallet address to display correct name
                    const walletAddress = profile?.wallet || profile?.proxy || address;
                    const { name } = await getSocialProfile(walletAddress, platform as PredictionPlatform, true, c);

                    const displayName = name || profile?.platform_name || formatAddress(walletAddress, 4);
                    const title = createPageTitleOG(displayName || `this ${platform} profile`);
                    const description = `Follow, analyze and join prediction markets in real time on Firefly.`;

                    return createSiteMetadata(pathname, {
                        title,
                        description,
                        openGraph: {
                            type: 'website',
                            url: urlcat(resolveSiteUrl(c), pathname),
                            title,
                            description,
                            siteName: SITE_NAME,
                            images: [ogImageUrl],
                        },
                        twitter: {
                            card: 'summary_large_image',
                            title,
                            description,
                            images: [ogImageUrl],
                        },
                    });
                },
            });
            return createSuccessResponseJson(metadata);
        }),
);

PredictionMetadataRoute.get(
    '/prediction-event',
    zValidator('query', PredictionEventQuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { platform, id, pathname, type } = c.req.valid('query');
            const isMutil = type === 'multi';
            const cacheKey = getEventCacheKey(platform, id, isMutil, pathname, c);
            const metadata = await withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    const ogImageUrl = urlcat(resolveSiteUrl(c), `/api/og/prediction/event/${platform}/${id}/image`, {
                        type,
                    });
                    const event = await getEventDetail(platform as PredictionPlatform, { id, isMutil }, c);

                    const title = event?.title
                        ? `Track ${event?.title} predictions on Firefly`
                        : createPageTitleOG('Prediction Event');
                    const description = `Follow, analyze and join prediction markets in real time on Firefly.`;

                    return createSiteMetadata(pathname, {
                        title,
                        description,
                        openGraph: {
                            type: 'website',
                            url: urlcat(resolveSiteUrl(c), pathname),
                            title,
                            description,
                            siteName: SITE_NAME,
                            images: [ogImageUrl],
                        },
                        twitter: {
                            card: 'summary_large_image',
                            title,
                            description,
                            images: [ogImageUrl],
                        },
                    });
                },
            });
            return createSuccessResponseJson(metadata);
        }),
);

export { PredictionMetadataRoute };
