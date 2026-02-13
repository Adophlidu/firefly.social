'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { isUndefined, last } from 'lodash-es';
import { memo, use, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { AnimatedText } from '@/components/Prediction/AnimatedText.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { PredictionPlatform, Source } from '@/constants/enum.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import { getPolymarketOrderBooks } from '@/providers/firefly/prediction/getPolymarketOrderBook.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

interface PredictionMarketBuyButtonsProps {
    market: BetsMarketDataForUI;
    platform: PredictionPlatform;
    size?: 'default' | 'large';
    autoRefreshPrice?: boolean;
    showPrice?: boolean;
    className?: string;
}

export const PredictionMarketBuyButtons = memo<PredictionMarketBuyButtonsProps>(function PredictionMarketBuyButtons({
    market: marketInProps,
    platform,
    size = 'default',
    showPrice = false,
    className,
}) {
    const { market: marketInContext } = use(PredictionContext);

    const selected = marketInContext?.id === marketInProps.id;
    const market = selected ? marketInContext : marketInProps;

    const { data: orderBooks } = useQuery({
        queryKey: [Source.Prediction, 'order-book', market.id],
        enabled: platform === PredictionPlatform.Polymarket && selected,
        staleTime: 1000 * 60 * 30, // 30 minutes
        queryFn: async ({ signal }) => {
            const outcomeIds = market.outcomes.map((o) => o.id);
            if (!outcomeIds.length) return null;

            return getPolymarketOrderBooks(outcomeIds, signal);
        },
    });

    const outcomes = useMemo(() => {
        return market.outcomes.map((outcome) => {
            const price = !Number.isNaN(+outcome.price) ? parseFloat(outcome.price) : 0;
            const orderBook = orderBooks?.find((book) => book.asset_id === outcome.id);
            const orderBookPrice = !!orderBook && !orderBook.asks.length ? '0' : last(orderBook?.asks)?.price;
            const bestPrice = !isUndefined(outcome.bestAsk)
                ? !Number.isNaN(+outcome.bestAsk)
                    ? parseFloat(outcome.bestAsk)
                    : price
                : !isUndefined(orderBookPrice)
                  ? parseFloat(orderBookPrice)
                  : price;

            return { ...outcome, displayPrice: bestPrice === 1 ? 0 : bestPrice };
        });
    }, [market.outcomes, orderBooks]);

    if (!outcomes.length) return null;

    const isLarge = size === 'large';

    return (
        <div className={classNames('flex', isLarge ? 'gap-4' : 'gap-2', className)}>
            {outcomes.map((outcome, i) => {
                return (
                    <ClickableButton
                        key={`${outcome.id}-${i}`}
                        className={classNames(
                            'flex min-w-0 flex-1 shrink-0 items-center justify-center gap-1 truncate px-3 font-bold hover:opacity-80',
                            isLarge ? 'h-12 rounded-full text-base text-white' : 'h-9 rounded-lg text-sm',
                            i === 0
                                ? isLarge
                                    ? 'bg-success'
                                    : 'bg-success/20 text-success'
                                : isLarge
                                  ? 'bg-danger'
                                  : 'bg-danger/20 text-danger',
                        )}
                        data-prevent-progress
                        onClick={() => {
                            if (market.slug) {
                                openPredictionPage(market.slug, { outcome: i });
                            }
                        }}
                    >
                        {showPrice ? (
                            <Trans>
                                <span className="min-w-0 truncate">Buy {outcome.label}</span>
                                <AnimatedText
                                    className="shrink-0"
                                    text={`${removeTrailingZeros((outcome.displayPrice * 100).toFixed(1))}¢`}
                                />
                            </Trans>
                        ) : (
                            <Trans>Buy {outcome.label}</Trans>
                        )}
                    </ClickableButton>
                );
            })}
        </div>
    );
});
