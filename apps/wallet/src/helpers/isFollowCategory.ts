import type { FollowCategory } from '@dimensiondev/enums';

import { FOLLOWING_CATEGORY } from '@/constants/computed.js';

export function isFollowCategory(category: string): category is FollowCategory {
    return FOLLOWING_CATEGORY.includes(category as FollowCategory);
}
