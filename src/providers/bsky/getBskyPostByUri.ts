import { AppBskyFeed } from '@/providers/bsky/contentChecker.js';
import { formatBskyFeedPost } from '@/providers/bsky/formatBskyFeedPost.js';
import { resolveBskyResponseDataAsync } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function getBskyPostByUri(uri: string): Promise<Post> {
    const data = await resolveBskyResponseDataAsync(
        () =>
            bskySessionHolder.agent.getPostThread({
                uri,
                depth: 10,
            }),
        `Failed to getSinglePost uri = ${uri}.`,
    );

    const thread = AppBskyFeed.isThreadViewPost(data.thread) ? data.thread : null;
    if (!thread) throw new Error(`No thread found uri = ${uri}.`);
    return formatBskyFeedPost(thread);
}
