import { getBskyPostById } from '@/providers/bsky/getBskyPostById.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function mirrorBskyPost(postId: string, authorId?: number): Promise<string> {
    const post = await getBskyPostById(postId);
    if (!post.metadata.contentURI) throw new Error(`Failed to mirror post postId = ${postId}`);
    const response = await bskySessionHolder.agent.repost(post.metadata.contentURI, post.publicationId);
    return response.uri;
}
