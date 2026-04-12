import type { BetsActivity } from '@/providers/types/Firefly.js';

export interface FireflyPolymarketActivity
    extends Partial<Omit<BetsActivity, 'hasBookmarked' | 'isLiked' | 'likeCount'>> {
    has_bookmarked?: boolean;
    is_like?: boolean;
    like_count?: number;
}

function migrateOutcome(activity: FireflyPolymarketActivity): FireflyPolymarketActivity {
    if (activity.outcome) return activity;
    if (activity.outcomeIndex !== undefined && activity.conditionOutcomes) {
        activity.outcome = activity.conditionOutcomes[activity.outcomeIndex];
        return { ...activity, outcome: activity.conditionOutcomes[activity.outcomeIndex] };
    }
    return activity;
}

export function formatPolymarketFromFirefly(activity: FireflyPolymarketActivity): BetsActivity {
    return {
        ...migrateOutcome(activity),
        hasBookmarked: activity.has_bookmarked ?? false,
        isLiked: activity.is_like ?? false,
        likeCount: activity.like_count ?? 0,
    } as BetsActivity;
}
