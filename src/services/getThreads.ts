import { type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { getBskyThreadByPostId } from '@/providers/bsky/getBskyThreadByPostId.js';
import { type Post } from '@/providers/types/SocialMedia.js';

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

    const root = post.root ?? post.commentOn ?? post;
    if (!root?.stats?.comments) return createPageable<Post, undefined>(EMPTY_LIST, undefined);

    if (!isSameProfile(root.author, post.author)) return createPageable<Post, undefined>(EMPTY_LIST, undefined);

    const provider = resolveSocialMediaProvider(source);
    const posts = await provider.getThreadByPostId(root.postId, isSamePost(root, post) ? post : undefined);
    if (!posts.some((x) => isSamePost(x, post))) return createPageable(EMPTY_LIST, undefined);

    return createPageable(posts, undefined);
}
