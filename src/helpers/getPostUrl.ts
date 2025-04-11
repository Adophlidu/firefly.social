import urlcat from 'urlcat';

import { PageRoute, Source } from '@/constants/enum.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function getPostUrl(post: Post) {
    const id = post.source === Source.Lens && post.slug ? post.slug : post.postId;
    return urlcat(PageRoute.PostDetail, { source: post.source.toLowerCase(), id });
}
