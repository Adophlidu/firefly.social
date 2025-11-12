import type { PolymarketActivity } from '@/providers/types/Firefly.js';

interface FireflyPolymarketActivity
    extends Partial<Omit<PolymarketActivity, 'hasBookmarked' | 'isLiked' | 'likeCount'>> {
    has_bookmarked?: boolean;
    is_like?: boolean;
    like_count?: number;
    [key: string]: unknown;
}

export function formatPolymarketFromFirefly(activity: FireflyPolymarketActivity): PolymarketActivity {
    return {
        ...activity,
        hasBookmarked: activity.has_bookmarked ?? false,
        isLiked: activity.is_like ?? false,
        likeCount: activity.like_count ?? 0,
    } as PolymarketActivity;
}
