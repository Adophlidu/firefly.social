import { logger } from '@/libs/Logger.js';
import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { AppBskyFeed } from '@/providers/bsky/contentChecker.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function unvoteBskyPost(postId: string, signal?: AbortSignal): Promise<void> {
    const response = await bskySessionHolder.agent.getPostThread(
        {
            uri: PostAtUri.fromId(postId).toUri(),
            depth: 0,
        },
        { signal },
    );
    const data = resolveBskyResponseData(response, `Failed to unlike post postId = ${postId}`);
    if (!AppBskyFeed.isThreadViewPost(data.thread)) throw new Error(`Failed to unlike post postId = ${postId}`);
    if (!data.thread.post.viewer?.like) {
        logger.warn(`Failed to unlike post postId = ${postId}, no like found`);
        return;
    }
    await bskySessionHolder.agent.deleteLike(data.thread.post.viewer.like);
}
