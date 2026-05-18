import { Source } from '@dimensiondev/enums';

import { getPostPublishInfoFromFirefly } from '@/providers/firefly/endpoint/getPostPublishInfoFromFirefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function getPostPublishPlatformInfo(post: Post): Promise<{
    name: string;
} | null> {
    const postId = post.source === Source.Bsky ? post.publicationId : post.postId;

    const fireflyRecord = await getPostPublishInfoFromFirefly(post.source, [postId]);
    if (fireflyRecord.posts[postId] === true) return { name: 'Firefly' };

    return null;
}
