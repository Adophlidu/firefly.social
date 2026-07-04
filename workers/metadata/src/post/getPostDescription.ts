import { SITE_DESCRIPTION } from '@dimensiondev/workers-shared/constants/metadata.js';
import type { FireflyPost } from '@dimensiondev/workers-shared/types/firefly.js';

const MAX_DESCRIPTION_LENGTH = 300;

export function getPostDescription(post: FireflyPost) {
    const raw = post.metadata?.content?.content?.trim();
    if (!raw) return SITE_DESCRIPTION;

    const text = raw.replace(/\s+/g, ' ').trim();
    if (!text) return SITE_DESCRIPTION;

    return Array.from(text).slice(0, MAX_DESCRIPTION_LENGTH).join('');
}
