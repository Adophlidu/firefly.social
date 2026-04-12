import { AppBskyFeed } from '@/providers/bsky/contentChecker.js';
import { formatBskyFeedPost } from '@/providers/bsky/formatBskyFeedPost.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function getBskyPinnedPost(profileId: string, signal?: AbortSignal): Promise<Post | null> {
    const response = await bskySessionHolder.agent.getProfile({ actor: profileId }, { signal });
    const data = resolveBskyResponseData(response, `Failed to get pinned post profileId = ${profileId}.`);
    const pinnedPost = data.pinnedPost;
    if (!pinnedPost) return null;

    const postThreadRes = await bskySessionHolder.agent.getPostThread(
        {
            uri: pinnedPost?.uri,
        },
        { signal },
    );
    if (!postThreadRes.success || !AppBskyFeed.isThreadViewPost(postThreadRes.data.thread)) return null;
    return formatBskyFeedPost(postThreadRes.data.thread);
}
