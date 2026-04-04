import { AppBskyFeed } from '@/providers/bsky/contentChecker.js';
import { getBskyPostById } from '@/providers/bsky/getBskyPostById.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function upvoteBskyPost(postId: string): Promise<void> {
    const post = await getBskyPostById(postId);
    if (!AppBskyFeed.isThreadViewPost(post.__original__)) throw new Error(`Failed to like post postId = ${postId}`);
    await bskySessionHolder.agent.like(post.__original__.post.uri, post.__original__.post.cid);
}
