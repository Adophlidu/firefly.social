import { FollowCategory } from '@/constants/enum.js';
import { FOLLOWING_CATEGORY } from '@/constants/index.js';

export function isFollowCategory(category: string): category is FollowCategory {
    return FOLLOWING_CATEGORY.includes(category as FollowCategory);
}
