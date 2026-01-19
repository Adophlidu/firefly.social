'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import type { PredictionPlatform } from '@/constants/enum.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import { getBetsMarketPrice } from '@/providers/prediction/getBetsMarketPrice.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

interface PredictionMarketBuyButtonsProps {
    market: BetsMarketDataForUI;
    platform: PredictionPlatform;
    size?: 'default' | 'large';
    autoRefreshPrice?: boolean;
    showPrice?: boolean;
}

export const PredictionMarketBuyButtons = memo<PredictionMarketBuyButtonsProps>(function PredictionMarketBuyButtons({
    market,
    platform,
    size = 'default',
    showPrice = false,
    autoRefreshPrice = false,
}) {
    const { data } = useQuery({
        queryKey: ['bets', 'market-price', market.id],
        enabled: !!autoRefreshPrice && market.outcomes.length > 0,
        refetchInterval: 1000 * 10, // every 10 seconds
        queryFn: () => getBetsMarketPrice(platform, { market }),
    });

    if (!market.outcomes.length) return null;

    const isLarge = size === 'large';

    return (
        <div className={classNames('flex', isLarge ? 'gap-4' : 'gap-2')}>
            {market.outcomes.map((outcome, i) => {
                const newPrice = data?.find((item) => item.outcomeId === outcome.id)?.price;
                const priceToShow = newPrice ?? outcome.price;
                const price = Number.isNaN(+priceToShow) ? 0 : +priceToShow;

                return (
                    <ClickableButton
                        key={outcome.id}
                        className={classNames(
                            'min-w-0 flex-1 shrink-0 truncate px-3 font-bold hover:opacity-80',
                            isLarge ? 'h-12 rounded-full text-base text-white' : 'h-9 rounded-lg text-sm',
                            i === 0
                                ? isLarge
                                    ? 'bg-success'
                                    : 'bg-success/20 text-success'
                                : isLarge
                                  ? 'bg-danger'
                                  : 'bg-danger/20 text-danger',
                        )}
                        onClick={() => {
                            if (market.slug) {
                                openPredictionPage(market.slug, i);
                            }
                        }}
                    >
                        {showPrice ? (
                            <Trans>
                                Buy {outcome.label} {Math.ceil(price * 100)}¢
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
