'use client';

import { useUpdateCurrentVisitingPost } from '@/hooks/useCurrentVisitingPost.js';
import { type Post } from '@/providers/types/SocialMedia.js';

interface PostDetailEffectProps {
    post: Post;
}

/**
 * It is only for use in the server component, please do not use it in any post item.
 * @param postId
 * @returns
 */
export function PostDetailEffect({ post }: PostDetailEffectProps) {
    useUpdateCurrentVisitingPost(post);

    return null;
}
