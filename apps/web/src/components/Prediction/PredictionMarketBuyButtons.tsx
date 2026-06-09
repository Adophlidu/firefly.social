'use client';

import { PredictionPlatform, Source } from '@dimensiondev/enums';
import { classNames, removeTrailingZeros } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { isUndefined, last } from 'lodash-es';
import { memo, use, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { AnimatedText } from '@/components/Prediction/AnimatedText.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { STALE_TIMES } from '@/constants/query.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import { getPolymarketOrderBooks } from '@/providers/firefly/prediction/getPolymarketOrderBook.js';
import { capturePolymarketOrderClick } from '@/providers/telemetry/capturePolymarketEvent.js';
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
        staleTime: STALE_TIMES.MINUTE_30,

        queryFn: async ({ signal }) => {
            const outcomeIds = market.outcomes.map((o) => o.id);
            if (!outcomeIds.length) return null;

            return getPolymarketOrderBooks(outcomeIds, signal);
        },
    });

    const outcomes = useMemo(() => {
        return market.outcomes.map((outcome) => {
            const price = !Number.isNaN(+outcome.price) ? Number.parseFloat(outcome.price) : 0;
            const orderBook = orderBooks?.find((book) => book.asset_id === outcome.id);
            const orderBookPrice = !!orderBook && !orderBook.asks.length ? '0' : last(orderBook?.asks)?.price;
            const bestPrice = !isUndefined(outcome.bestAsk)
                ? !Number.isNaN(+outcome.bestAsk)
                    ? Number.parseFloat(outcome.bestAsk)
                    : price
                : !isUndefined(orderBookPrice)
                  ? Number.parseFloat(orderBookPrice)
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
                                capturePolymarketOrderClick(market.slug, i);
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
