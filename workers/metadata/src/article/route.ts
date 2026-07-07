import type { SocialSourceInURL } from '@dimensiondev/enums';
import { ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import { SITE_NAME, SITE_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { createZodErrorResponseJson } from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { fetchFireflyRpc } from '@dimensiondev/workers-shared/helpers/fetchFireflyRpc.js';
import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import { getOrigin } from '@dimensiondev/workers-shared/helpers/getOrigin.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withHono } from '@dimensiondev/workers-shared/middlewares/withHono.js';
import { Pathname } from '@dimensiondev/workers-shared/schemas/Pathname.js';
import type { FireflyPost } from '@dimensiondev/workers-shared/types/firefly.js';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import type { Metadata } from 'next';
import z from 'zod';

import { getArticleById } from '@/metadata/src/article/getArticleById.js';
import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';

const VERSION = 1;

const QuerySchema = z.object({
    id: z.string(),
    pathname: Pathname,
    source: z.string().optional(),
});

function getCacheKey(id: string, pathname: string, c: Context) {
    return `metadata:firefly-article:${VERSION}:${getOrigin(c)}:${id}_${pathname}`;
}

const ArticleMetadataRoute = new Hono<{ Bindings: { METADATA_CACHE: KVNamespace } }>().get(
    '/firefly-article',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withHono(c, async () => {
            const { id, pathname, source } = c.req.valid('query');
            const cacheKey = getCacheKey(id, pathname, c);
            return withCache<Metadata>({
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
        }),
);

export { ArticleMetadataRoute };
