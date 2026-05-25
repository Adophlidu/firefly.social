import type { BetsActivity, SportActivityData, SportActivityGameData } from '@/providers/types/Firefly.js';

export interface FireflyPolymarketActivity extends Partial<
    Omit<BetsActivity, 'hasBookmarked' | 'isLiked' | 'likeCount'>
> {
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

function normalizeSportData(raw: SportActivityData | SportActivityGameData | undefined): SportActivityData | undefined {
    if (!raw) return undefined;

    const gameData = raw as SportActivityGameData;
    const livestreamInfo = (raw.livestreamInfo || gameData.livestream_info) as
        | (NonNullable<SportActivityData['livestreamInfo']> & NonNullable<SportActivityGameData['livestream_info']>)
        | undefined;

    return {
        active: raw.active,
        closed: raw.closed,
        ended: raw.ended,
        live: raw.live,
        isDraw: raw.isDraw,
        drawTeams: raw.drawTeams,
        marketTeams: raw.marketTeams,
        gameId: raw.gameId,
        startTime: raw.startTime,
        livestreamInfo: livestreamInfo
            ? {
                  livestreamUrl: livestreamInfo.livestreamUrl ?? livestreamInfo.livestream_url,
                  inWhiteList: livestreamInfo.inWhiteList ?? livestreamInfo.in_whitelist,
                  playerUrl: livestreamInfo.playerUrl ?? livestreamInfo.player_url,
              }
            : undefined,
        leagueName: raw.leagueName,
        scoreShow: raw.scoreShow ?? gameData.score_show,
        scoreType: raw.scoreType ?? gameData.score_type,
        periodShow: raw.periodShow ?? gameData.period_show,
        winResult: raw.winResult,
    };
}

export function formatPolymarketFromFirefly(activity: FireflyPolymarketActivity): BetsActivity {
    return {
        ...migrateOutcome(activity),
        sportData: normalizeSportData(activity.sportData ?? activity.gameData),
        hasBookmarked: activity.has_bookmarked ?? false,
        isLiked: activity.is_like ?? false,
        likeCount: activity.like_count ?? 0,
    } as BetsActivity;
}
