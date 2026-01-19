import { last } from 'lodash-es';
import urlcat from 'urlcat';

import { type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST, MIN_POST_SIZE_PER_THREAD } from '@/constants/static.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { getBskyThreadByPostId } from '@/providers/bsky/getBskyThreadByPostId.js';
import { getCommentsByProfileId } from '@/providers/lens/getCommentsByProfileId.js';
import { type Post } from '@/providers/types/SocialMedia.js';

function refreshThreadByPostId(postId: string) {
    return fetch(
        urlcat('/api/thread', {
            id: postId,
        }),
        {
            method: 'PUT',
        },
    );
}

async function getTwitterThreads(post: Post) {
    const posts = await resolveSocialMediaProvider(Source.Twitter).getThreadByPostId(post.postId);
    return createPageable(posts, undefined);
}

async function getBskyThreads(post: Post) {
    const posts = await getBskyThreadByPostId(post.postId);
    return createPageable(posts, undefined);
}

export async function getThreads(post: Post, source: SocialSource) {
    if (source === Source.Twitter) return getTwitterThreads(post);
    if (source === Source.Bsky) return getBskyThreads(post);

    const root = post.root ? post.root : post.commentOn ? post.commentOn : post;
    if (!root?.stats?.comments) return createPageable<Post, undefined>(EMPTY_LIST, undefined);

    if (!isSameProfile(root.author, post.author)) return createPageable<Post, undefined>(EMPTY_LIST, undefined);

    const provider = resolveSocialMediaProvider(source);
    const posts = await provider.getThreadByPostId(root.postId, isSamePost(root, post) ? post : undefined);

    /**
     * The data of Lens is stored in Redis.
     * Since there is no expiration time and we need to check each time whether a new post has been added to the thread.
     * If so, we need to clear the cache and request again.
     */
    if (source === Source.Lens && posts.length >= MIN_POST_SIZE_PER_THREAD) {
        const lastPost = last(posts);
        if (!lastPost) return createPageable(posts, undefined);

        const commentsOfLastPost = await getCommentsByProfileId(lastPost.postId, lastPost.author.profileId);
        if (commentsOfLastPost.data.length === 0) return createPageable(posts, undefined);

        const response = await refreshThreadByPostId(root.postId);
        if (response.status !== 200) return createPageable(posts, undefined);
        return createPageable(await provider.getThreadByPostId(root.postId), undefined);
    }

    if (!posts.some((x) => isSamePost(x, post))) return createPageable(EMPTY_LIST, undefined);

    return createPageable(posts, undefined);
}
