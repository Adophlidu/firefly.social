'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { first, sumBy } from 'lodash-es';
import { memo, useCallback, useMemo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { PredictionMarketBuyButtons } from '@/components/Prediction/PredictionMarketBuyButtons.js';
import { MAX_MARKETS_COUNT_SELECTABLE, PLATFORMS_SUPPORTING_ORDER_BOOK } from '@/constants/bets.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { dynamic } from '@/esm/dynamic.js';
import { Image } from '@/esm/Image.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { isZero } from '@/helpers/number.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

const PredictionMarketOrderBook = dynamic(
    () =>
        import('@/components/Prediction/PredictionMarketOrderBook/index.js').then(
            (mod) => mod.PredictionMarketOrderBook,
        ),
    { ssr: false, loading: () => <Loading minHeight={148} /> },
);

interface PredictionMarketListProps {
    markets: BetsMarketDataForUI[];
    platform: PredictionPlatform;
}

export const PredictionMarketList = memo(function PredictionMarketList({
    markets,
    platform,
}: PredictionMarketListProps) {
    const [showMore, setShowMore] = useState(false);
    const [marketId, setMarketId] = useState(
        markets.find((market) => !market.isResolved && !market.isClosed)?.id || null,
    );

    const onMarketClick = useCallback(
        (market: BetsMarketDataForUI) => {
            if (market.isResolved || market.isClosed || platform !== PredictionPlatform.Polymarket) return;

            setMarketId(market.id === marketId ? null : market.id);
        },
        [marketId, platform],
    );

    const displayedMarkets = useMemo(() => {
        if (!showMore) {
            return markets.slice(0, MAX_MARKETS_COUNT_SELECTABLE);
        }

        return markets;
    }, [markets, showMore]);

    const supportOrderBook = PLATFORMS_SUPPORTING_ORDER_BOOK.includes(platform);
    const firstMarket = markets[0];
    if (markets.length === 1 && supportOrderBook && !firstMarket.isResolved && !firstMarket.isClosed) {
        return (
            <div className="mt-2 space-y-8 px-4">
                <PredictionMarketBuyButtons
                    platform={platform}
                    market={firstMarket}
                    size="large"
                    showPrice
                    autoRefreshPrice
                />
                <PredictionMarketOrderBook key={firstMarket.id} market={firstMarket} platform={platform} />
            </div>
        );
    }

    return (
        <div className="mt-6 space-y-6 px-4">
            {displayedMarkets.map((market) => {
                const isZeroPrice = market.outcomes.every((outcome) => isZero(outcome.price));
                const totalPrice = sumBy(market.outcomes, (outcome) =>
                    Number.isNaN(+outcome.price) ? 0 : +outcome.price,
                );
                const yesPercent = totalPrice > 0 ? (Number(first(market.outcomes)?.price || 0) / totalPrice) * 100 : 0;
                const actionEnabled = !market.isResolved && !market.isClosed;
                const isGreen = market.resolvedOutcomeId === market.outcomes[0]?.id;
                const resolvedLabel = market.outcomes.find((o) => o.id === market.resolvedOutcomeId)?.label;
                const showOrderBook = actionEnabled && supportOrderBook;

                return (
                    <div key={market.id} className="space-y-3">
                        <div className="flex items-start gap-2">
                            {market.image ? (
                                <Image
                                    src={market.image}
                                    alt={market.title}
                                    width={40}
                                    height={40}
                                    className="size-10 rounded-lg object-cover"
                                />
                            ) : null}
                            <div className="min-w-0 flex-1">
                                <div className="text-base font-semibold text-main">
                                    <ClickableButton
                                        className={showOrderBook ? 'hover:underline' : 'cursor-text'}
                                        onClick={() => onMarketClick(market)}
                                    >
                                        {market.title}
                                    </ClickableButton>
                                </div>
                                <span className="text-xs text-second">
                                    <Trans>{`$${nFormatter(+market.volume, 2)}`} Vol.</Trans>
                                </span>
                            </div>
                            <span
                                className={classNames('text-2xl font-bold text-main', bedStead.className)}
                            >{`${yesPercent < 1 ? '<1' : Math.round(yesPercent)}%`}</span>
                        </div>
                        {market.isResolved ? (
                            <div>
                                <span
                                    className={classNames(
                                        'text-sm font-semibold',
                                        isGreen ? 'text-success' : 'text-danger',
                                    )}
                                >
                                    <Trans>Settled as {resolvedLabel || '-'}</Trans>
                                </span>
                                <div className={classNames('mt-1 h-1 w-full', isGreen ? 'bg-success' : 'bg-danger')} />
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between">
                                    {market.outcomes.map((outcome, i) => {
                                        return (
                                            <span
                                                key={outcome.id}
                                                className={classNames(
                                                    'text-sm font-semibold',
                                                    i === 0 ? 'text-success' : 'text-danger',
                                                    bedStead.className,
                                                )}
                                            >{`${outcome.label} ${toFixedTrimmed(+outcome.price * 100, 2)}¢`}</span>
                                        );
                                    })}
                                </div>
                                {!isZeroPrice ? (
                                    <div className="mt-1 flex gap-1">
                                        {market.outcomes.map((outcome, i) => {
                                            return (
                                                <div
                                                    key={outcome.id}
                                                    style={{ flex: outcome.price }}
                                                    className={classNames('h-1', i === 0 ? 'bg-success' : 'bg-danger')}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        )}
                        {actionEnabled && platform === PredictionPlatform.Polymarket ? (
                            <PredictionMarketBuyButtons platform={platform} market={market} />
                        ) : null}
                        {showOrderBook && marketId === market.id ? (
                            <PredictionMarketOrderBook key={market.id} market={market} platform={platform} />
                        ) : null}
                    </div>
                );
            })}
            {markets.length > MAX_MARKETS_COUNT_SELECTABLE ? (
                <div className="flex items-center justify-center">
                    <ClickableButton
                        className="rounded-full bg-bg px-4 py-2 text-xs font-semibold text-main"
                        onClick={() => setShowMore((v) => !v)}
                    >
                        {showMore ? <Trans>Show Less</Trans> : <Trans>Show More</Trans>}
                    </ClickableButton>
                </div>
            ) : null}
        </div>
    );
});
