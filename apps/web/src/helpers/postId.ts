import { Source } from '@dimensiondev/enums';
import type { SocialSource } from '@/constants/enum.js';

const NUMERICAL_ID_RE = /^\d+$/;

export function isValidPostId(source: SocialSource, postId: string) {
    if (!postId) return false;

    switch (source) {
        case Source.Twitter:
            return NUMERICAL_ID_RE.test(postId);
        default:
            return true;
    }
}
