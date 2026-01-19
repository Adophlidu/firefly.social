import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { AppBskyFeed } from '@/providers/bsky/contentChecker.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function unmirrorBskyPost(postId: string, authorId?: number): Promise<void> {
    const response = await bskySessionHolder.agent.getPostThread({
        uri: PostAtUri.fromId(postId).toUri(),
        depth: 0,
    });
    const data = resolveBskyResponseData(response, `Failed to unmirror post postId = ${postId}`);
    if (!AppBskyFeed.isThreadViewPost(data.thread) || !data.thread.post.viewer?.repost)
        throw new Error(`Failed to unmirror post postId = ${postId}`);

    await bskySessionHolder.agent.deleteRepost(data.thread.post.viewer.repost);
}
