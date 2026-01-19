import { publishPostToBsky } from '@/providers/bsky/publishPostToBsky.js';
import { type Notification, type Post } from '@/providers/types/SocialMedia.js';

export async function publishBskyPost(post: Post) {
    const result = await publishPostToBsky(post, false);

    return {
        postId: result.cid,
        contentURI: result.uri,
    };
}
