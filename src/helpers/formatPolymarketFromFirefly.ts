import { type BetsActivity } from '@/providers/types/Firefly.js';

interface FireflyPolymarketActivity extends Partial<Omit<BetsActivity, 'hasBookmarked' | 'isLiked' | 'likeCount'>> {
    has_bookmarked?: boolean;
    is_like?: boolean;
    like_count?: number;
}

export function formatPolymarketFromFirefly(activity: FireflyPolymarketActivity): BetsActivity {
    return {
        ...activity,
        hasBookmarked: activity.has_bookmarked ?? false,
        isLiked: activity.is_like ?? false,
        likeCount: activity.like_count ?? 0,
    } as BetsActivity;
}
