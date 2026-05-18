import { useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useAtomValue } from 'jotai';

import { STALE_TIMES } from '@/constants/enum';
import { calculateSlippagePrice } from '@/helpers/calculateSlippagePrice';
import { isGreaterThan } from '@/helpers/number';
import { pickRawAssetCtxForCoin, resolveCoinStatic } from '@/helpers/perpsCoinInfoResolve';
import { resolvePerpCoinIndex } from '@/helpers/resolvePerpCoinIndex';
import { toast } from '@/helpers/toast';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { infoClient } from '@/providers/client';
import { exchangeClientAtom } from '@/store/wallet';
import { allDexsAssetCtxsAtom } from '@/store/websocket';
import type { Position } from '@/types/ui';

/**
 * Market-close every position in one batch (same order shape as `useClosePosition` market path).
 */
export function useMarketCloseAllPositions() {
    const { i18n } = useLingui();
    const exchangeClient = useAtomValue(exchangeClientAtom);
    const queryClient = useQueryClient();
    const allDexsAssetCtxs = useAtomValue(allDexsAssetCtxsAtom);

    return useAsyncFn(
        async (positions: Position[]) => {
            if (!positions.length) return;

            try {
                if (!exchangeClient) {
                    throw new Error('Exchange client not initialized');
                }

                const allMetas = await queryClient.ensureQueryData({
                    queryKey: ['perps', 'all-metas'],
                    staleTime: STALE_TIMES.MINUTE_10,
                    queryFn: () => infoClient.allPerpMetas(),
                });

                if (!allMetas?.length) {
                    throw new Error('Failed to fetch market metadata');
                }

                const orders: Array<{
                    a: number;
                    b: boolean;
                    p: string;
                    r: boolean;
                    s: string;
                    t: { limit: { tif: 'FrontendMarket' } };
                }> = [];

                const errors: string[] = [];

                for (const position of positions) {
                    const staticPart = resolveCoinStatic(allMetas, position.coin);
                    if (!staticPart) {
                        errors.push(`${position.coin}: unknown market`);
                        continue;
                    }

                    const rawCtx = pickRawAssetCtxForCoin(
                        allDexsAssetCtxs,
                        staticPart.dex,
                        staticPart.coinIndexInUniverse,
                    );
                    const markPx = rawCtx?.markPx;
                    if (!markPx || markPx === '0') {
                        errors.push(`${position.coin}: no mark price`);
                        continue;
                    }

                    const a = resolvePerpCoinIndex(position.coin, allMetas);
                    if (a === -1) {
                        errors.push(`${position.coin}: failed to resolve asset index`);
                        continue;
                    }

                    const szDecimals = staticPart.meta.szDecimals;
                    const absSzi = new BigNumber(position.szi).abs();
                    if (!absSzi.isFinite() || !absSzi.gt(0)) {
                        errors.push(`${position.coin}: invalid size`);
                        continue;
                    }
                    const size = absSzi.toFixed(szDecimals, BigNumber.ROUND_DOWN);
                    if (size === '0' || !size) {
                        errors.push(`${position.coin}: size rounds to zero`);
                        continue;
                    }

                    const isBuy = isGreaterThan(position.szi, '0');
                    const p = calculateSlippagePrice({
                        price: markPx,
                        isBuy: !isBuy,
                        szDecimals,
                    });

                    orders.push({
                        a,
                        b: !isBuy,
                        p,
                        r: true,
                        s: size,
                        t: { limit: { tif: 'FrontendMarket' } },
                    });
                }

                if (errors.length && !orders.length) {
                    throw new Error(errors.join('; ') || 'No positions could be closed');
                }

                if (!orders.length) {
                    return;
                }

                await exchangeClient.order({ grouping: 'na', orders });

                if (errors.length) {
                    toast({
                        message: i18n._('rn-ui.marketCloseAll.partial', { details: errors.join('; ') }),
                        type: 'info',
                    });
                } else {
                    toast({
                        message:
                            positions.length > 1
                                ? i18n._('rn-ui.marketCloseAll.successMany')
                                : i18n._('rn-ui.marketCloseAll.successOne'),
                        type: 'success',
                    });
                }
            } catch (error) {
                toast({
                    message: error instanceof Error ? error.message : i18n._('rn-ui.marketCloseAll.failure'),
                    type: 'error',
                    error,
                });
            }
        },
        [exchangeClient, i18n, queryClient, allDexsAssetCtxs],
    );
}
