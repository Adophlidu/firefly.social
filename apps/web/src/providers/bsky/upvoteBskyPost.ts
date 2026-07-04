import { getBskyPostById } from '@/providers/bsky/getBskyPostById.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function upvoteBskyPost(postId: string): Promise<void> {
    const post = await getBskyPostById(postId);
    const uri = post.metadata.contentURI;
    const cid = post.publicationId;
    if (!uri || !cid) throw new Error(`Failed to like post postId = ${postId}`);
    await bskySessionHolder.agent.like(uri, cid);
}
