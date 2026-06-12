'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { type CSSProperties, memo, type ReactNode } from 'react';

import { PredictionActivityRate } from '@/components/Prediction/PredictionActivityRate.js';
import { PredictionActivityResult } from '@/components/Prediction/PredictionActivityResult.js';
import { PredictionActivityTxType } from '@/components/Prediction/PredictionActivityTxType.js';
import { PredictionEventImage } from '@/components/Prediction/PredictionEventImage.js';
import { SportBetInfoPills } from '@/components/Prediction/Sport/SportBetInfoPills.js';
import { SportTimelineActivityCard } from '@/components/Prediction/Sport/SportTimelineActivityCard.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { inferRenderAs } from '@/helpers/prediction/sportMarketTabs.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import type { BetsActivity, PolymarketSportsMarketData } from '@/providers/types/Firefly.js';
import { SportMarketGroupType } from '@/types/prediction.js';

function floor(num: number | string) {
    return Number.isNaN(+num) ? 0 : Math.floor(+num);
}

/** Find the moneyline market within gameData that matches this bet's conditionId. */
function findMatchedMarket(activity: BetsActivity) {
    const markets = activity.gameData?.markets;
    if (!markets?.length) return null;
    return markets.find((m) => m.conditionId === activity.conditionId);
}

/**
 * Decide how a sport activity renders in the timeline:
 * - 'game-cell': 3-column team-vs-team card (Moneyline Yes, or Draw market either side)
 * - 'compact':   existing non-sport compact card (Moneyline No, or any Spread/Total/Other)
 * - null:        non-sport activity (no sportData) — unchanged
 */
function resolveSportDisplayStyle(activity: BetsActivity): 'game-cell' | 'compact' | null {
    if (!activity.sportData) return null;

    const sportsMarketType = (activity.rawData as PolymarketSportsMarketData)?.sportsMarketType;
    if (!sportsMarketType) return 'game-cell'; // fallback: preserve current behavior

    const renderAs = inferRenderAs(sportsMarketType);

    // Non-moneyline → always compact (reuse existing card)
    if (renderAs !== SportMarketGroupType.Moneyline) return 'compact';

    // Moneyline Draw market → game cell for both Yes and No
    const matchedMarket = findMatchedMarket(activity);
    if (matchedMarket?.groupTypeFF === 1) return 'game-cell';

    // Moneyline team: Yes (outcomeIndex 0) → game cell, No → compact
    return (activity.outcomeIndex ?? 0) === 0 ? 'game-cell' : 'compact';
}

interface PredictionActivityBodyProps {
    activity: BetsActivity;
    className?: string;
    style?: CSSProperties;
    wrapper?: (children: ReactNode) => ReactNode;
}

export const PredictionActivityBody = memo<PredictionActivityBodyProps>(function PredictionActivityBody({
    activity,
    className,
    style,
    wrapper,
}) {
    const isDarkMode = useIsDarkMode();
    const conditionOutcomes = activity.conditionOutcomes ?? [];
    const outcomeIndex = activity.outcomeIndex ?? 0;
    const isLeft = outcomeIndex === 0;
    const outcome = conditionOutcomes[outcomeIndex] || activity.outcome;

    const containerStyle = {
        '--success-color': isDarkMode ? '#1F4B1A' : '#C1E7BD',
        '--danger-color': isDarkMode ? '#66120D' : '#FFD5D2',
        ...style,
    } as CSSProperties;
    const displayTitle =
        activity.platform === PredictionPlatform.Opinion
            ? compact([activity.parent_title, activity.title]).join(' - ')
            : activity.title;

    // Compact card — shared by non-sport activities and sport activities that aren't a
    // moneyline-team "Yes" bet (Moneyline "No", Spread, Totals, Other).
    const compactCard = (
        <>
            <PredictionActivityTxType type={activity.side} usdcSize={activity.usdcSize} platform={activity.platform} />
            <div className="mt-2 rounded-2xl border border-line p-4">
                <div className="flex gap-x-2">
                    <PredictionEventImage
                        platform={activity.platform}
                        alt={activity.title}
                        width={24}
                        height={24}
                        className="shrink-0"
                        src={activity.image}
                    />
                    <span className="line-clamp-2 text-sm font-semibold leading-6 text-lightMain">{displayTitle}</span>
                </div>
                <div className="mt-3 flex items-center gap-x-1 text-sm font-medium">
                    <span
                        className={classNames('rounded-lg px-2 leading-6', {
                            'bg-success/20 text-success': isLeft,
                            'bg-danger/20 text-danger': !isLeft,
                        })}
                    >
                        {outcome} - {floor(+activity.price * 100)}¢
                    </span>
                    <span className="min-h-6 rounded-lg bg-lightBg px-2 leading-6 text-lightMain">
                        <Trans>×{toFixedTrimmed(+activity.size, 2)} shares</Trans>
                    </span>
                </div>
                {activity.umaResolutionStatus === 'resolved' ? (
                    <PredictionActivityResult activity={activity} />
                ) : (
                    <PredictionActivityRate activity={activity} />
                )}
            </div>
        </>
    );

    const sportStyle = resolveSportDisplayStyle(activity);
    const content =
        sportStyle === 'game-cell' ? (
            <>
                <PredictionActivityTxType
                    type={activity.side}
                    usdcSize={activity.usdcSize}
                    platform={activity.platform}
                />
                <SportBetInfoPills activity={activity} />
                <SportTimelineActivityCard activity={activity} />
            </>
        ) : (
            compactCard
        );

    return (
        <div className={classNames('mt-2 block flex-1', className)} style={containerStyle}>
            {wrapper ? wrapper(content) : content}
        </div>
    );
});
