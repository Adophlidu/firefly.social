'use client';

import {
    buildCoinInfo,
    type PerpAssetContext,
    type PerpCoinInfo,
    pickRawAssetCtxForCoin,
    resolveCoinStatic,
} from '@dimensiondev/perps-core';
import { usePerpsClient, usePerpsMarkets } from '@dimensiondev/perps-react';
import { useEffect, useMemo, useState } from 'react';

import { toDisplayPerpsMarketName, toRawPerpsMarketName } from '@/components/Perps/marketSelection.js';

export function usePerpsMarketData(selectedCoin: string) {
    const client = usePerpsClient();
    const marketsQuery = usePerpsMarkets();
    const [contexts, setContexts] = useState<Array<[string, PerpAssetContext[]]>>([]);
    const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);

    useEffect(() => {
        let disposed = false;
        let subscription: { unsubscribe(): Promise<void> } | undefined;
        let retryTimer: ReturnType<typeof setTimeout> | undefined;
        const connect = () => {
            client.subscriptions
                .allDexsAssetCtxs((event) => {
                    if (!disposed) setContexts(event.ctxs);
                })
                .then((value) => {
                    if (disposed) void value.unsubscribe();
                    else {
                        subscription = value;
                        setSubscriptionError(null);
                    }
                })
                .catch((cause: unknown) => {
                    if (disposed) return;
                    setSubscriptionError(cause instanceof Error ? cause : new Error('Market stream failed'));
                    retryTimer = setTimeout(connect, 3_000);
                });
        };
        connect();
        return () => {
            disposed = true;
            clearTimeout(retryTimer);
            void subscription?.unsubscribe();
        };
    }, [client]);

    const marketStaticParts = useMemo(() => {
        if (!marketsQuery.data) return [];
        return marketsQuery.data.flatMap((metadata) =>
            metadata.universe.flatMap(({ name }) => {
                const staticPart = resolveCoinStatic(marketsQuery.data, name);
                return staticPart ? [staticPart] : [];
            }),
        );
    }, [marketsQuery.data]);

    const markets = useMemo(() => {
        const values = marketStaticParts.map((staticPart) => {
            const info = buildCoinInfo(
                staticPart,
                pickRawAssetCtxForCoin(contexts, staticPart.dex, staticPart.coinIndexInUniverse),
            );
            const markPrice = Number(info.assetCtx?.markPx);
            const openInterest = Number(info.assetCtx?.openInterest);
            return {
                coin: toDisplayPerpsMarketName(staticPart.meta.name),
                maxLeverage: info.maxLeverage,
                lastPrice: info.assetCtx?.markPx,
                priceChangeRatio: info.priceDiffRatio,
                fundingRate: info.assetCtx?.funding,
                volume: info.assetCtx?.dayNtlVlm,
                openInterest:
                    Number.isFinite(markPrice) && Number.isFinite(openInterest)
                        ? String(markPrice * openInterest)
                        : undefined,
            };
        });
        return values?.length ? values : [{ coin: 'BTC-USDC' }, { coin: 'ETH-USDC' }, { coin: 'SOL-USDC' }];
    }, [contexts, marketStaticParts]);

    const coinInfo = useMemo<PerpCoinInfo | null>(() => {
        if (!marketsQuery.data) return null;
        const staticPart = resolveCoinStatic(marketsQuery.data, toRawPerpsMarketName(selectedCoin));
        if (!staticPart) return null;
        return buildCoinInfo(
            staticPart,
            pickRawAssetCtxForCoin(contexts, staticPart.dex, staticPart.coinIndexInUniverse),
        );
    }, [contexts, marketsQuery.data, selectedCoin]);

    return {
        coinInfo,
        markets,
        isLoading: marketsQuery.isLoading,
        error: marketsQuery.error || subscriptionError,
        rawCoin: toRawPerpsMarketName(selectedCoin),
    };
}
