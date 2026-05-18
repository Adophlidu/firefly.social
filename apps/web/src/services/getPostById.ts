import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { NotFoundError } from '@dimensiondev/utils';
import { last } from 'lodash-es';

import { extractArticleIdFromUrl } from '@/helpers/fireflyPostUrl.js';
import { matchUrls } from '@/helpers/matchUrls.js';
import { isValidPostId } from '@/helpers/postId.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { getArticleById } from '@/providers/firefly/article/getArticleById.js';
import { getLensPostById } from '@/providers/lens/getLensPostById.js';
import { isLensV2PostId } from '@/providers/lens/isLensV2PostId.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function getPostById(source: SocialSource, postId: string) {
    if (!isValidPostId(source, postId)) {
        throw new NotFoundError(`No post found for source=${source}, id=${postId}.`);
    }

    let post: Post;

    if (source === Source.Lens && isLensV2PostId(postId)) {
        post = await getLensPostById(postId, true);
    } else {
        const provider = resolveSocialMediaProvider(source);
        post = await provider.getPostById(postId);
    }
    return enrichPostWithFireflyArticle(post);
}

export async function enrichPostWithFireflyArticle(post: Post): Promise<Post> {
    // Only support Bsky for now
    if (post.source !== Source.Bsky) return post;

    const content = post.metadata.content?.content;
    if (!content) return post;

    const urls = matchUrls(content);
    const articleIds = urls.map(extractArticleIdFromUrl).filter((id) => id !== null);

    const articleId = articleIds.length > 0 ? last(articleIds) : null;

    if (!articleId) return post;

    try {
        const article = await getArticleById(articleId);
        if (!article?.content) return post;

        return {
            ...post,
            partialContent: content,
            metadata: {
                ...post.metadata,
                content: {
                    ...post.metadata.content,
                    content: article.content,
                },
            },
        };
    } catch {
        return post;
    }
}
