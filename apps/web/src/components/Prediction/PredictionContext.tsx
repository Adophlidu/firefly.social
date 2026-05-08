'use client';

import { skipToken, useQuery } from '@tanstack/react-query';
import { debounce, first, isArray, isObject } from 'lodash-es';
import { createContext, memo, type PropsWithChildren, useEffect, useMemo, useState } from 'react';

import { PredictionChartType } from '@/constants/bets.js';
import { PredictionPlatform, Source } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { useListenPredictionDeadline } from '@/hooks/prediction/useListenPredictionDeadline.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import {
    type MarketMessage,
    type MarketPriceChangeData,
    MarketsWebSocketProvider,
} from '@/providers/prediction/polymarket/MarketsWebSocketProvider.js';
import type { BetsEventDataForUI, BetsMarketDataForUI } from '@/types/prediction.js';

interface PredictionContextProviderProps {
    event: BetsEventDataForUI;
    translatedEvent?: BetsEventDataForUI;
}
interface PredictionContextValue {
    platform: PredictionPlatform;
    marketId: string | null;
    market: BetsMarketDataForUI | null;
    event: BetsEventDataForUI | null;
    chartType: PredictionChartType;
    isActive: boolean;
    setChartType: (type: PredictionChartType) => void;
    setMarketId: (id: string | null) => void;
}

export const PredictionContext = createContext<PredictionContextValue>({
    platform: PredictionPlatform.Polymarket,
    marketId: null,
    market: null,
    event: null,
    chartType: PredictionChartType.RatioLine,
    isActive: false,
    setMarketId: () => {},
    setChartType: () => {},
});

export const PredictionContextProvider = memo<PropsWithChildren<PredictionContextProviderProps>>(
    function PredictionContextProvider({ event, translatedEvent, children }) {
        const { markets, platform } = event;
        const [marketId, setMarketId] = useState(
            markets.find((market) => !market.isResolved && !market.isClosed)?.id || null,
        );
        const [marketPrices, setMarketPrices] = useState<MarketPriceChangeData[]>();
        const [chartType, setChartType] = useState<PredictionChartType>(
            !!event.series?.length && event.cryptoData?.name
                ? PredictionChartType.PriceLine
                : PredictionChartType.RatioLine,
        );

        const { data: refreshedEvent } = useQuery({
            queryKey: [Source.Prediction, 'event', platform, event.slug],
            staleTime: STALE_TIMES.MINUTE_30,
            enabled: !!event.slug,
            queryFn: !event.slug
                ? skipToken
                : () =>
                      getEventDetail(platform, {
                          id: event.slug!,
                          isMutil: markets.length > 1,
                      }),
        });

        const updatedEvent = refreshedEvent || event;

        useListenPredictionDeadline({
            platform,
            slug: event.slug,
            endDate: updatedEvent.endDate,
            disabled: updatedEvent.markets.every((market) => market.isResolved || market.isClosed),
        });
        useEffect(() => {
            const market = updatedEvent.markets.find((m) => m.id === marketId);
            if (!market) return;

            const firstOutcome = first(market.outcomes);
            if (!firstOutcome) return;

            const provider = new MarketsWebSocketProvider();
            provider.subscribeToMarket(
                [firstOutcome.id],
                debounce((message?: MarketMessage) => {
                    if (!message) return;

                    if (
                        !isArray(message) &&
                        isObject(message) &&
                        message.event_type === 'price_change' &&
                        message.price_changes.length
                    ) {
                        setMarketPrices(message.price_changes);
                    }
                }, 300),
            );

            return () => {
                provider.close();
            };
        }, [marketId, updatedEvent.markets]);

        const contextValue = useMemo<PredictionContextValue>(() => {
            const market = updatedEvent.markets.find((market) => market.id === marketId);
            if (market) {
                market.outcomes = market.outcomes.map((outcome) => {
                    const priceData = marketPrices?.find((x) => x.asset_id === outcome.id);
                    if (!priceData) return outcome;

                    return {
                        ...outcome,
                        bestAsk: priceData.best_ask,
                        bestBid: priceData.best_bid,
                    };
                });
            }

            return {
                marketId,
                platform,
                market: market || null,
                event: {
                    ...updatedEvent,
                    title: translatedEvent?.title || updatedEvent.title,
                    description: translatedEvent?.description || updatedEvent.description,
                },
                isActive:
                    updatedEvent.cryptoData?.name &&
                    updatedEvent.endDate &&
                    Date.now() > new Date(updatedEvent.endDate).getTime()
                        ? false
                        : updatedEvent.markets.some((market) => !market.isClosed && !market.isResolved),
                chartType,
                setMarketId,
                setChartType,
            };
        }, [
            marketId,
            platform,
            updatedEvent,
            marketPrices,
            chartType,
            translatedEvent?.title,
            translatedEvent?.description,
        ]);

        return <PredictionContext.Provider value={contextValue}>{children}</PredictionContext.Provider>;
    },
);
