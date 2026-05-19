import { FOLLOWING_CATEGORY } from '@dimensiondev/constants/computed';
import type { FollowCategory } from '@dimensiondev/enums';

export function isFollowCategory(category: string): category is FollowCategory {
    return FOLLOWING_CATEGORY.includes(category as FollowCategory);
}
