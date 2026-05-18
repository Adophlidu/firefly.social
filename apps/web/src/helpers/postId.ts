import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';

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
