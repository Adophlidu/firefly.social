import type { SocialSource } from '@dimensiondev/workers-shared/constants/source.js';
import { resolveSourceInUrl } from '@dimensiondev/workers-shared/helpers/resolveSource.js';

export function resolvePostUrl(source: SocialSource, postId: string) {
    if (!postId) return '';
    return `/post/${resolveSourceInUrl(source)}/${postId}`;
}
