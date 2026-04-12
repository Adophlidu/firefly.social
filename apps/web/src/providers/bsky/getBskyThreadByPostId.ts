import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { AppBskyFeed } from '@/providers/bsky/contentChecker.js';
import { formatBskyThreadPosts } from '@/providers/bsky/formatBskyFeedPost.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function getBskyThreadByPostId(postId: string, localPost?: Post, signal?: AbortSignal): Promise<Post[]> {
    const uri = AppBskyFeed.isPostView(localPost?.__original__)
        ? localPost?.__original__.uri
        : PostAtUri.fromId(postId).toUri();
    const response = await bskySessionHolder.agent.getPostThread(
        {
            uri,
            depth: 10,
        },
        { signal },
    );
    const data = resolveBskyResponseData(response, `Failed to getThreadByPostId uri = ${uri}.`);

    const thread = AppBskyFeed.isThreadViewPost(data.thread) ? data.thread : null;
    if (!thread) throw new Error(`No thread found uri = ${uri}.`);

    return formatBskyThreadPosts(thread);
}
