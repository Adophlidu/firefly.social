import { publishPostToBsky } from '@/providers/bsky/publishPostToBsky.js';
import { type Notification, type Post } from '@/providers/types/SocialMedia.js';

export async function publishBskyPost(post: Post, signal?: AbortSignal) {
    const result = await publishPostToBsky(post, false, undefined, signal);

    return {
        postId: result.cid,
        contentURI: result.uri,
    };
}
