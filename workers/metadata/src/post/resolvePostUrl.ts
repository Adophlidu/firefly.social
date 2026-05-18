import type { SocialSource } from '@dimensiondev/enums';
import { resolveSourceInUrl } from '@dimensiondev/workers-shared/helpers/resolveSource.js';

export function resolvePostUrl(source: SocialSource, postId: string) {
    if (!postId) return '';
    return `/post/${resolveSourceInUrl(source)}/${postId}`;
}
