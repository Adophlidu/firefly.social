import { SITE_DESCRIPTION } from '@dimensiondev/constants/static';

import type { Post } from '@/providers/types/SocialMedia.js';

const MAX_DESCRIPTION_LENGTH = 300;

export function getPostDescriptionFromPost(post: Post) {
    const raw = post.metadata?.content?.content?.trim();
    if (!raw) return SITE_DESCRIPTION;

    const text = raw.replace(/\s+/g, ' ').trim();
    if (!text) return SITE_DESCRIPTION;

    return Array.from(text).slice(0, MAX_DESCRIPTION_LENGTH).join('');
}
