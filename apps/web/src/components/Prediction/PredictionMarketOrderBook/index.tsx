'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { skipToken, useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { OrderBookHeader } from '@/components/Prediction/PredictionMarketOrderBook/OrderBookHeader.js';
import { OrderBookUI } from '@/components/Prediction/PredictionMarketOrderBook/OrderBookUI.js';
import { SPREAD_SETTING_OPTIONS } from '@/constants/bets.js';
import { type PredictionPlatform } from '@/constants/enum.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import { getBetsMarketOrderBook } from '@/providers/prediction/getBetsMarketOrderBook.js';
import { type BetsMarketDataForUI, type BetsOrderBookItem, type MarketOrderBookSpread } from '@/types/prediction.js';

interface PredictionMarketOrderBookProps {
    market: BetsMarketDataForUI;
    platform: PredictionPlatform;
}

function filterOrderBookDataBySpread(data: BetsOrderBookItem[], spread: MarketOrderBookSpread): BetsOrderBookItem[] {
    switch (spread) {
        case 0.1:
            return data;
        case 1: {
            return data.filter((item) => Number.isInteger(item.price * 100));
        }
        default:
            safeUnreachable(spread);
            return data;
    }
}

export const PredictionMarketOrderBook = memo<PredictionMarketOrderBookProps>(function PredictionMarketOrderBook({
    market,
    platform,
}) {
    const [outcomeId, setOutcomeId] = useState(first(market.outcomes)?.id || '');
    const [spread, setSpread] = useState<MarketOrderBookSpread>(SPREAD_SETTING_OPTIONS[0]);
    const lastPriceRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isFetching, isPending, error, refetch } = useQuery({
        queryKey: ['bets', 'market-order-book', platform, market.id, outcomeId],
        enabled: !!outcomeId,
        refetchInterval: 1000 * 10, // 10 seconds
        refetchOnWindowFocus: true,
        queryFn: !outcomeId
            ? skipToken
            : async ({ signal }) => {
                  return getBetsMarketOrderBook(platform, {
                      market,
                      outcomeId,
                      signal,
                  });
              },
    });

    const scrollToCenter = useCallback(() => {
        // @ts-ignore
        lastPriceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', container: 'nearest' });
    }, []);

    const outcomeIndex = market.outcomes.findIndex((o) => o.id === outcomeId);
    const [, handlePriceClick] = useAsyncFn(
        async (price: number) => {
            if (outcomeIndex === -1 || !market.slug) return;
            await openPredictionPage(market.slug, {
                outcome: outcomeIndex,
                limitPrice: price,
                type: 'limit',
            });
        },
        [outcomeIndex, market.slug],
    );

    const { asks, bids } = useMemo(() => {
        const validSpread = data?.showSpreadSetting ? spread : SPREAD_SETTING_OPTIONS[0];

        return {
            asks: filterOrderBookDataBySpread(data?.asks || [], validSpread),
            bids: filterOrderBookDataBySpread(data?.bids || [], validSpread),
        };
    }, [data?.asks, data?.bids, spread, data?.showSpreadSetting]);

    return (
        <div>
            <OrderBookHeader
                spread={spread}
                market={market}
                outcomeId={outcomeId}
                loading={isFetching || isPending}
                showSpreadSetting={data?.showSpreadSetting ?? false}
                onRefresh={refetch}
                onSpreadChange={setSpread}
                onScrollToCenter={scrollToCenter}
                onOutcomeChange={setOutcomeId}
            />
            {isLoading || isPending ? (
                <Loading minHeight={110} />
            ) : error ? (
                <div className="flex h-[110px] items-center justify-center">
                    <ClickableButton
                        className="text-second text-sm font-medium hover:underline"
                        onClick={() => refetch()}
                    >
                        <Trans>Retry</Trans>
                    </ClickableButton>
                </div>
            ) : (
                <OrderBookUI
                    bids={bids}
                    asks={asks}
                    ref={lastPriceRef}
                    lastPrice={data?.lastPrice ?? null}
                    spreads={data?.spreads ?? null}
                    onPriceClick={handlePriceClick}
                />
            )}
        </div>
    );
});
