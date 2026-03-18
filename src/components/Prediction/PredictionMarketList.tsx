'use client';

import { classNames } from '@dimensiondev/utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Trans } from '@lingui/react/macro';
import { first, sumBy } from 'lodash-es';
import { memo, use, useCallback } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { PredictionEventImage } from '@/components/Prediction/PredictionEventImage.js';
import { PredictionMarketBuyButtons } from '@/components/Prediction/PredictionMarketBuyButtons.js';
import { PLATFORMS_SUPPORTING_ORDER_BOOK } from '@/constants/bets.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { dynamic } from '@/esm/dynamic.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { isZero } from '@/helpers/number.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { useToggleMarkets } from '@/hooks/prediction/useToggleMarkets.js';
import { capturePolymarketEventMarketClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import { type BetsMarketDataForUI } from '@/types/prediction.js';

const PredictionMarketOrderBook = dynamic(
    () =>
        import('@/components/Prediction/PredictionMarketOrderBook/index.js').then(
            (mod) => mod.PredictionMarketOrderBook,
        ),
    { ssr: false, loading: () => <Loading minHeight={148} /> },
);
const PredictionSingleMarketTab = dynamic(
    () =>
        import('@/components/Prediction/PredictionSingleMarketTab/index.js').then(
            (mod) => mod.PredictionSingleMarketTab,
        ),
    { ssr: false, loading: () => <Loading minHeight={148} /> },
);

interface PredictionMarketListProps {
    markets: BetsMarketDataForUI[];
    platform: PredictionPlatform;
    eventSlug?: string;
    eventTitle?: string;
}

export const PredictionMarketList = memo(function PredictionMarketList({
    markets,
    platform,
    eventSlug,
    eventTitle,
}: PredictionMarketListProps) {
    const { marketId, setMarketId } = use(PredictionContext);
    const { displayedMarkets, showMore, toggleType, setShowMore } = useToggleMarkets(markets);

    const onMarketClick = useCallback(
        (market: BetsMarketDataForUI) => {
            // Track market click for Polymarket
            if (platform === PredictionPlatform.Polymarket && eventSlug && eventTitle) {
                capturePolymarketEventMarketClick(eventSlug, eventTitle, market.slug || market.id, market.title);
            }

            setMarketId(market.id === marketId ? null : market.id);
        },
        [marketId, platform, setMarketId, eventSlug, eventTitle],
    );

    const supportOrderBook = PLATFORMS_SUPPORTING_ORDER_BOOK.includes(platform);
    const firstMarket = markets[0];
    if (markets.length === 1 && supportOrderBook && !firstMarket.isResolved && !firstMarket.isClosed) {
        return (
            <div className="mt-2 px-4">
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
                const showOrderBook = true;

                return (
                    <div key={market.id} className="space-y-3">
                        <ClickableButton
                            className={classNames(
                                'flex w-full items-start gap-2',
                                showOrderBook ? 'cursor-pointer' : 'cursor-text',
                            )}
                            onClick={() => onMarketClick(market)}
                        >
                            {market.image ? (
                                <PredictionEventImage
                                    platform={platform}
                                    src={market.image}
                                    alt={market.title}
                                    width={40}
                                    height={40}
                                    className="size-10 rounded-lg object-cover"
                                />
                            ) : null}
                            <div className="min-w-0 flex-1 text-left">
                                <div className="text-base font-semibold text-main">
                                    <span className={showOrderBook ? 'hover:underline' : 'cursor-text'}>
                                        {market.title}
                                    </span>
                                </div>
                                <span className="text-xs text-second">
                                    <Trans>{`$${nFormatter(+market.volume, 2)}`} Vol.</Trans>
                                </span>
                            </div>
                            {market.isResolved ? (
                                <span
                                    className={classNames(
                                        'text-base font-bold',
                                        bedStead.className,
                                        isGreen ? 'text-success' : 'text-danger',
                                    )}
                                >
                                    {resolvedLabel}
                                </span>
                            ) : (
                                <span
                                    className={classNames('text-2xl font-bold text-main', bedStead.className)}
                                >{`${yesPercent < 1 ? '<1' : Math.round(yesPercent)}%`}</span>
                            )}
                        </ClickableButton>
                        {!market.isResolved && platform !== PredictionPlatform.Polymarket ? (
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
                        ) : null}
                        {actionEnabled && platform === PredictionPlatform.Polymarket ? (
                            <PredictionMarketBuyButtons showPrice platform={platform} market={market} />
                        ) : null}
                        {showOrderBook && marketId === market.id ? (
                            <PredictionSingleMarketTab key={market.id} market={market} platform={platform} />
                        ) : null}
                    </div>
                );
            })}
            {toggleType !== 'none' ? (
                <div className="flex items-center justify-center">
                    <ClickableButton
                        className="flex h-9 items-center gap-2 rounded-full bg-bg px-6 text-sm font-semibold text-main"
                        onClick={() => setShowMore((v) => !v)}
                    >
                        {showMore ? (
                            toggleType === 'resolved' ? (
                                <Trans>Hide resolved</Trans>
                            ) : (
                                <Trans>Show Less</Trans>
                            )
                        ) : toggleType === 'resolved' ? (
                            <Trans>View resolved</Trans>
                        ) : (
                            <Trans>Show More</Trans>
                        )}
                        <ChevronDownIcon
                            className={classNames(
                                'size-3.5 transition-all duration-200 ease-in-out',
                                showMore ? 'rotate-180' : '',
                            )}
                        />
                    </ClickableButton>
                </div>
            ) : null}
        </div>
    );
});
