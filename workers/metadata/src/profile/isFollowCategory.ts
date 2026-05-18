import { FollowCategory } from '@dimensiondev/enums';

const FOLLOWING_CATEGORY = [FollowCategory.Followers, FollowCategory.Mutuals, FollowCategory.Following] as const;

export function isFollowCategory(category: string): category is FollowCategory {
    return FOLLOWING_CATEGORY.includes(category as FollowCategory);
}
