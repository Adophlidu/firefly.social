import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { useAllPerpMetas } from '@/hooks/Perps/useAllPerpMetas';
import { allDexsAssetCtxsAtom } from '@/store/websocket';
import type { CoinInfo } from '@/types/ui';

export function useCoinInfo(coinName?: string) {
    const allDexsAssetCtxs = useAtomValue(allDexsAssetCtxsAtom);

    const { data: allMetas, isLoading } = useAllPerpMetas();

    const coin = useMemo<CoinInfo | null>(() => {
        if (!allMetas?.length || !coinName) return null;

        const dexIndex = allMetas.findIndex((meta) => meta.universe.some((c) => c.name === coinName));
        if (dexIndex === -1) return null;

        const meta = allMetas[dexIndex];
        const coinIndex = meta.universe.findIndex((c) => c.name === coinName);
        if (coinIndex === -1) return null;

        const coin = meta.universe[coinIndex];
        const marginTable = meta.marginTables?.find((table) => table[0] === coin.marginTableId)?.[1];
        const dex = coin.name.includes(':') ? coin.name.split(':')[0] : '';
        const dexCtx = allDexsAssetCtxs?.find(([d]) => d === dex);
        const assetCtx = dexCtx?.[1]?.[coinIndex];
        const priceDiff = assetCtx ? parseFloat(assetCtx.markPx) - parseFloat(assetCtx.prevDayPx) : undefined;
        const priceDiffRatio =
            assetCtx && priceDiff
                ? parseFloat(assetCtx.prevDayPx) > 0
                    ? (priceDiff / parseFloat(assetCtx.prevDayPx)) * 100
                    : undefined
                : undefined;

        return {
            ...coin,
            index: dexIndex === 0 ? coinIndex : 100000 + dexIndex * 10000 + coinIndex,
            marginTable,
            dex: coin.name.includes(':') ? coin.name.split(':')[0] : '',
            assetCtx,
            priceDiff,
            priceDiffRatio,
        };
    }, [allMetas, coinName, allDexsAssetCtxs]);

    return {
        data: coin,
        isLoading,
    };
}
