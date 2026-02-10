'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { isUndefined } from 'lodash-es';
import { memo, use } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import type { PredictionPlatform } from '@/constants/enum.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
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

    const market = marketInContext?.id === marketInProps.id ? marketInContext : marketInProps;
    if (!market.outcomes.length) return null;

    const isLarge = size === 'large';

    return (
        <div className={classNames('flex', isLarge ? 'gap-4' : 'gap-2', className)}>
            {market.outcomes.map((outcome, i) => {
                const price = !Number.isNaN(+outcome.price) ? parseFloat(outcome.price) : 0;
                const bestPrice = !isUndefined(outcome.bestAsk)
                    ? !Number.isNaN(+outcome.bestAsk)
                        ? parseFloat(outcome.bestAsk)
                        : price
                    : price;
                const displayPrice = bestPrice === 1 ? 0 : bestPrice;

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
                                openPredictionPage(market.slug, i);
                            }
                        }}
                    >
                        {showPrice ? (
                            <Trans>
                                <span className="min-w-0 truncate">Buy {outcome.label}</span>
                                <span className="shrink-0">
                                    {removeTrailingZeros((displayPrice * 100).toFixed(1))}¢
                                </span>
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
