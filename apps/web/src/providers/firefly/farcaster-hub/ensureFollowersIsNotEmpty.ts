import { EMPTY_LIST } from '@dimensiondev/constants';

import { formatFarcasterProfileFromFirefly } from '@/providers/farcaster/formatFarcasterProfileFromFirefly.js';
import { type User } from '@/providers/types/Firefly.js';

export function ensureFollowersIsNotEmpty(users?: User[]) {
    if (!Array.isArray(users)) return EMPTY_LIST;
    return users.map(formatFarcasterProfileFromFirefly);
}
