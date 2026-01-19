import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { AppBskyFeed } from '@/providers/bsky/contentChecker.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function unvoteBskyPost(postId: string): Promise<void> {
    const response = await bskySessionHolder.agent.getPostThread({
        uri: PostAtUri.fromId(postId).toUri(),
        depth: 0,
    });
    const data = resolveBskyResponseData(response, `Failed to unlike post postId = ${postId}`);
    if (!AppBskyFeed.isThreadViewPost(data.thread) || !data.thread.post.viewer?.like)
        throw new Error(`Failed to unlike post postId = ${postId}`);
    await bskySessionHolder.agent.deleteLike(data.thread.post.viewer.like);
}
