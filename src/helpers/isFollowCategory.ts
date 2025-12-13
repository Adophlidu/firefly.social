import { FOLLOWING_CATEGORY } from '@/constants/computed.js';
import { FollowCategory } from '@/constants/enum.js';

export function isFollowCategory(category: string): category is FollowCategory {
    return FOLLOWING_CATEGORY.includes(category as FollowCategory);
}
