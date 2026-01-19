import { publishPostToBsky } from '@/providers/bsky/publishPostToBsky.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function quoteBskyPost(postId: string, post: Post): Promise<{ postId: string; contentURI?: string }> {
    const result = await publishPostToBsky(post, true);

    return {
        postId: result.cid,
        contentURI: result.uri,
    };
}
