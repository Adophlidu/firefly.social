import urlcat from 'urlcat';

import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export function getPostImageUrl({ source, postId, slug }: Post, index: number, isPostPage?: boolean) {
    return urlcat('/post/:source/:id/photos/:index', {
        source: resolveSourceInUrl(source),
        id: slug || postId,
        index,
        hiddenTabs: isPostPage ? isPostPage : undefined,
    });
}
