import {
    buildCoinInfo,
    createStreamFreshness,
    monotonicNow,
    type PerpAssetContext,
    pickRawAssetCtxForCoin,
    resolveCoinStatic,
} from '@dimensiondev/perps-core';
import { usePerpsClient, usePerpsMarkets } from '@dimensiondev/perps-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { toRawPerpsCoin } from '@/components/Perps/perpsCoin.js';

interface ActiveAssetData {
    availableToTrade?: [string, string];
    leverage: {
        type: 'cross' | 'isolated';
        value: number;
    };
    markPx?: string;
    maxTradeSzs?: [string, string];
}

export function usePerpsMarketData(coin: string, address?: string) {
    const client = usePerpsClient();
    const markets = usePerpsMarkets();
    const [contexts, setContexts] = useState<Array<[string, PerpAssetContext[]]>>([]);
    const [activeAssetData, setActiveAssetData] = useState<ActiveAssetData | null>(null);
    const marketFreshness = useRef(createStreamFreshness(10_000));

    useEffect(() => {
        let disposed = false;
        let subscription: { unsubscribe(): Promise<void> } | undefined;
        void client.subscriptions
            .allDexsAssetCtxs((event) => {
                if (!disposed) {
                    marketFreshness.current.markTick(monotonicNow());
                    setContexts(event.ctxs);
                }
            })
            .then((value) => {
                if (disposed) void value.unsubscribe();
                else subscription = value;
            });
        return () => {
            disposed = true;
            void subscription?.unsubscribe();
        };
    }, [client]);

    const rawCoin = toRawPerpsCoin(coin);
    const staticPart = useMemo(
        () => (markets.data ? resolveCoinStatic(markets.data, rawCoin) : null),
        [markets.data, rawCoin],
    );

    useEffect(() => {
        if (!staticPart) return;

        const abortController = new AbortController();
        void client.info
            .metaAndAssetCtxs({ dex: staticPart.dex }, abortController.signal)
            .then(([, assetContexts]) => {
                setContexts((current) => [
                    ...current.filter(([dex]) => dex !== staticPart.dex),
                    [staticPart.dex, assetContexts],
                ]);
            })
            .catch(() => undefined);

        return () => abortController.abort();
    }, [client, staticPart]);

    useEffect(() => {
        if (!address || !staticPart) {
            setActiveAssetData(null);
            return;
        }

        let disposed = false;
        let subscription: { unsubscribe(): Promise<void> } | undefined;
        const params = { user: address as `0x${string}`, coin: staticPart.meta.name };
        void client.info
            .activeAssetData(params)
            .then((event) => {
                if (!disposed) setActiveAssetData(event as ActiveAssetData);
            })
            .catch(() => undefined);
        void client.subscriptions
            .activeAssetData(params, (event) => {
                if (!disposed) setActiveAssetData(event as ActiveAssetData);
            })
            .then((value) => {
                if (disposed) void value.unsubscribe();
                else subscription = value;
            });

        return () => {
            disposed = true;
            setActiveAssetData(null);
            void subscription?.unsubscribe();
        };
    }, [address, client, staticPart]);

    const coinInfo = useMemo(
        () =>
            staticPart
                ? buildCoinInfo(
                      staticPart,
                      pickRawAssetCtxForCoin(contexts, staticPart.dex, staticPart.coinIndexInUniverse),
                  )
                : null,
        [contexts, staticPart],
    );

    const isMarketDataFresh = useCallback(() => marketFreshness.current.isFresh(monotonicNow()), []);

    return { activeAssetData, coinInfo, isMarketDataFresh, markets, rawCoin };
}
