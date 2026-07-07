import { SITE_NAME } from '@dimensiondev/constants/static';
import type { SocialSourceInURL } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getPublicUrl } from '@/helpers/getPublicUrl.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import type { Article } from '@/providers/types/Article.js';
import { getPostById } from '@/services/getPostById.js';

export async function createFireflyArticleMetadataFromArticle(
    article: Article,
    source: SocialSourceInURL,
    pathname: string,
): Promise<Metadata> {
    const title = 'Continue reading on Firefly.Social';
    const description = article.content;
    const postId = article.customPayload?.posts.find((post) => !!post.postId)?.postId;

    if (!postId || !isSocialSourceInUrl(source)) {
        return createSiteMetadata(pathname, { title, description });
    }

    const post = await runInSafeAsync(() => getPostById(resolveSocialSource(source), postId));
    const cover =
        post?.metadata.content?.attachments?.find((attachment) => attachment.uri)?.uri ??
        getPublicUrl('/image/og.png');

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'article',
            url: urlcat(SITE_URL, pathname),
            title,
            description,
            siteName: SITE_NAME,
            images: [cover],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [cover],
        },
    });
}
