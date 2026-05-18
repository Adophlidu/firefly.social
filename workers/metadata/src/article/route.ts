import type { SocialSourceInURL } from '@dimensiondev/enums';
import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { SITE_NAME, SITE_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { createPageTitleOG } from '@dimensiondev/workers-shared/helpers/createPageTitleOG.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import { fetchFireflyRpc } from '@dimensiondev/workers-shared/helpers/fetchFireflyRpc.js';
import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { resolveSiteUrl } from '@dimensiondev/workers-shared/helpers/resolveSiteUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import type { FireflyPost } from '@dimensiondev/workers-shared/types/firefly.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import z from 'zod';

import { getArticleById } from '@/metadata/src/article/getArticleById.js';
import { getArticleCover } from '@/metadata/src/article/getArticleCover.js';
import { getArticleDescription } from '@/metadata/src/article/getArticleDescription.js';

type Metadata = Record<string, unknown>;

const VERSION = 1;

const QuerySchema = z.object({
    id: z.string(),
    pathname: Pathname,
    source: z.string().optional(),
});

const ArticleMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>();

function getCacheKey(id: string, pathname: string, c: Context) {
    return `metadata:article:${VERSION}:${getOrigin(c)}:${id}_${pathname}`;
}

ArticleMetadataRoute.get(
    '/article',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { id, pathname } = c.req.valid('query');
            const cacheKey = getCacheKey(id, pathname, c);
            const metadata = await withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    const article = await getArticleById(id, c);
                    if (!article) return createSiteMetadata(pathname);

                    const coverUrl = await getArticleCover(article, c).catch(() => null);
                    const images = coverUrl ? [coverUrl] : undefined;
                    const title = createPageTitleOG(article.content.title);
                    const description = await getArticleDescription(article);

                    return createSiteMetadata(pathname, {
                        title,
                        description,
                        openGraph: {
                            type: 'article',
                            url: urlcat(resolveSiteUrl(c), `/article/${id}`),
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

ArticleMetadataRoute.get(
    '/firefly-article',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const { id, pathname, source } = c.req.valid('query');
            const cacheKey = getCacheKey(id, pathname, c);
            const metadata = await withCache<Metadata>({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => cacheKey,
                getCache: () => c.env.METADATA_CACHE,
                compute: async () => {
                    const article = await getArticleById(id, c);
                    if (!article) return createSiteMetadata(pathname);

                    const postId = article.custom_payload?.posts?.postId;
                    const title = 'Continue reading on Firefly.Social';
                    const description = article.content.body;
                    if (!postId || !source)
                        return createSiteMetadata(pathname, {
                            title,
                            description,
                        });

                    const post = await fetchFireflyRpc<FireflyPost>(
                        source as SocialSourceInURL,
                        'getPostById',
                        { postId },
                        c,
                    );
                    const cover = first(post?.metadata.content.attachments)?.url ?? urlcat(SITE_URL, '/image/og.png');

                    return createSiteMetadata(pathname, {
                        title,
                        description,
                        openGraph: {
                            type: 'article',
                            title,
                            description,
                            siteName: SITE_NAME,
                            url: urlcat(SITE_URL, pathname),
                            images: [cover],
                        },
                        twitter: {
                            card: 'summary_large_image',
                            title,
                            description,
                            images: [cover],
                        },
                    });
                },
            });
            return createSuccessResponseJson(metadata);
        }),
);

export { ArticleMetadataRoute };
