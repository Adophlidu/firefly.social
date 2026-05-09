import { useAtomValue } from 'jotai';
import { useMemo, useRef } from 'react';

import {
    buildCoinInfo,
    coinInfoStableSignature,
    computePriceDiff,
    perpAssetCtxSignature,
    pickRawAssetCtxForCoin,
    resolveCoinStatic,
} from '@/helpers/perpsCoinInfoResolve';
import { useAllPerpMetas } from '@/hooks/Perps/useAllPerpMetas';
import { allDexsAssetCtxsAtom } from '@/store/websocket';
import type { CoinInfo, PerpAssetCtxSchema } from '@/types/ui';

export function useCoinInfo(coinName?: string) {
    const allDexsAssetCtxs = useAtomValue(allDexsAssetCtxsAtom);

    const { data: allMetas, isLoading } = useAllPerpMetas();

    const staticPart = useMemo(
        () => (coinName ? resolveCoinStatic(allMetas, coinName) : null),
        [allMetas, coinName],
    );

    const stableCoinRef = useRef<{ sig: string; coin: CoinInfo } | null>(null);

    const coin = useMemo<CoinInfo | null>(() => {
        if (!staticPart || !coinName) {
            stableCoinRef.current = null;
            return null;
        }

        const rawCtx = pickRawAssetCtxForCoin(allDexsAssetCtxs, staticPart.dex, staticPart.coinIndexInUniverse);
        const { priceDiff, priceDiffRatio } = computePriceDiff(rawCtx);

        let assetCtx: PerpAssetCtxSchema | undefined = rawCtx;
        const prevEntry = stableCoinRef.current;
        if (rawCtx && prevEntry?.coin.name === coinName) {
            const prevCtx = prevEntry.coin.assetCtx;
            if (prevCtx && perpAssetCtxSignature(prevCtx) === perpAssetCtxSignature(rawCtx)) {
                assetCtx = prevCtx;
            }
        }

        const sig = coinInfoStableSignature(
            coinName,
            staticPart.hlCoinIndex,
            assetCtx,
            priceDiff,
            priceDiffRatio,
        );

        if (prevEntry && prevEntry.sig === sig) {
            return prevEntry.coin;
        }

        const next = buildCoinInfo(staticPart, assetCtx);
        stableCoinRef.current = { sig, coin: next };
        return next;
    }, [allDexsAssetCtxs, staticPart, coinName]);

    return {
        data: coin,
        isLoading,
    };
}
