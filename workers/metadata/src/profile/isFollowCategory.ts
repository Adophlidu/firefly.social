import { FollowCategory } from '@/metadata/src/profile/enums.js';

const FOLLOWING_CATEGORY = [FollowCategory.Followers, FollowCategory.Mutuals, FollowCategory.Following] as const;

export function isFollowCategory(category: string): category is FollowCategory {
    return FOLLOWING_CATEGORY.includes(category as FollowCategory);
}
