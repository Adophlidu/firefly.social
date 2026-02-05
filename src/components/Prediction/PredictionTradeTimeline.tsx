'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { memo, Suspense } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { PredictionTradeTimelineItem } from '@/components/Prediction/PredictionTradeTimelineItem.js';
import { PredictionPlatform, ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { getBetsTradeList } from '@/providers/firefly/prediction/getBetsTradeList.js';
import { capturePolymarketEventTradesTabClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

interface Props {
    platform: PredictionPlatform;
    marketIds: string[];
    eventSlug?: string;
}

function getTradeItem(trade: BetsActivity, platform: PredictionPlatform) {
    return <PredictionTradeTimelineItem trade={trade} platform={platform} />;
}

const PredictionTradeTimelineContent = memo<
    Props & {
        isFollowing: boolean;
    }
>(function PredictionTradeTimelineContent({ platform, marketIds, isFollowing }) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'trades-timeline', platform, marketIds.join(','), `${isFollowing}`],
        staleTime: 1000 * 60 * 2, // 2 minutes
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getBetsTradeList({
                    indicator,
                    platform,
                    size: 20,
                    isFollowing,
                    conditionIds: marketIds,
                });
            } catch {
                return createPageable([], indicator);
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });
    const tabKey = isFollowing ? 'following' : 'global';

    return (
        <ListInPage
            source={Source.Prediction}
            key={`${Source.Prediction}-${tabKey}`}
            queryResult={queryResult}
            VirtualListProps={{
                useWindowScroll: true,
                listKey: `${ScrollListKey.Bets}:trades-timeline:${tabKey}`,
                computeItemKey: (index, trade) => `${trade.slug}-${tabKey}-${index}`,
                itemContent: (index, trade) => getTradeItem(trade, platform),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
                message: <Trans>No trades found</Trans>,
                icon: <div />,
            }}
        />
    );
});

export const PredictionTradeTimeline = memo<Props>(function PredictionTradeTimeline({
    platform,
    marketIds,
    eventSlug,
}) {
    const [isFollowing, setIsFollowing] = useQueryState('isFollowing', parseAsBoolean.withDefault(false));

    return (
        <div className="min-h-[512px] space-y-4">
            <div className="m-4 mb-0 inline-flex h-7 rounded-md border border-secondaryLine text-xs">
                <ClickableButton
                    className={classNames(
                        'px-2',
                        !isFollowing ? 'bg-lightBg font-semibold text-main' : 'font-medium text-second',
                    )}
                    onClick={() => {
                        if (platform === PredictionPlatform.Polymarket && eventSlug) {
                            capturePolymarketEventTradesTabClick(eventSlug, 'Global');
                        }
                        setIsFollowing(false);
                    }}
                >
                    <Trans id="bets-trades-global" comment="Global">
                        Global
                    </Trans>
                </ClickableButton>
                <ClickableButton
                    className={classNames(
                        'px-2',
                        isFollowing ? 'bg-lightBg font-semibold text-main' : 'font-medium text-second',
                    )}
                    onClick={() => {
                        if (platform === PredictionPlatform.Polymarket && eventSlug) {
                            capturePolymarketEventTradesTabClick(eventSlug, 'Following');
                        }
                        setIsFollowing(true);
                    }}
                >
                    <Trans id="bets-trades-following" comment="Following">
                        Following
                    </Trans>
                </ClickableButton>
            </div>
            <ErrorBoundary>
                <Suspense fallback={<Loading />}>
                    <PredictionTradeTimelineContent
                        platform={platform}
                        marketIds={marketIds}
                        isFollowing={isFollowing}
                    />
                </Suspense>
            </ErrorBoundary>
        </div>
    );
});
