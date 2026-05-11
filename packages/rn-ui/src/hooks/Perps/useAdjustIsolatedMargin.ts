import { BigNumber } from 'bignumber.js';
import { useAtomValue } from 'jotai';

import { isGreaterThan } from '@/helpers/number';
import { toast } from '@/helpers/toast';
import { useCoinInfo } from '@/hooks/Perps/useCoinInfo';
import { usePerpsComputedAccountValue } from '@/hooks/Perps/usePerpsComputedAccountValue';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { exchangeClientAtom } from '@/store/wallet';
import type { Position } from '@/types/ui';

/** Minimum USDC amount per add (aligned with typical HL dust / UX). */
export const MIN_ISOLATED_MARGIN_ADD_USD = new BigNumber('0.01');

interface UseAdjustIsolatedMarginOptions {
    coinName?: string;
    position?: Position;
}

export function useAdjustIsolatedMargin({ coinName, position }: UseAdjustIsolatedMarginOptions) {
    const exchangeClient = useAtomValue(exchangeClientAtom);
    const { data: coinInfo } = useCoinInfo(coinName);
    const { withdrawable } = usePerpsComputedAccountValue();

    return useAsyncFn(
        async (amountUsd: string): Promise<boolean> => {
            if (!coinName || !position) return false;

            const amountBn = new BigNumber(amountUsd || '0');
            const maxAdd = new BigNumber(withdrawable || '0');

            if (amountBn.isNaN() || !amountBn.isFinite() || amountBn.lte(0)) {
                toast({ message: 'Enter a valid amount', type: 'error' });
                return false;
            }

            if (amountBn.lt(MIN_ISOLATED_MARGIN_ADD_USD)) {
                toast({
                    message: `Minimum amount is $${MIN_ISOLATED_MARGIN_ADD_USD.toFixed(2)}`,
                    type: 'error',
                });
                return false;
            }

            if (amountBn.gt(maxAdd)) {
                toast({ message: 'Amount exceeds withdrawable balance', type: 'error' });
                return false;
            }

            if (position.leverage.type !== 'isolated') {
                toast({ message: 'Margin can only be adjusted for isolated positions', type: 'error' });
                return false;
            }

            try {
                if (!exchangeClient) {
                    throw new Error('Exchange client not initialized');
                }
                if (!coinInfo) {
                    throw new Error('Failed to fetch coin info');
                }

                const isBuy = isGreaterThan(position.szi, '0');
                const ntli = amountBn.multipliedBy(1e6).integerValue(BigNumber.ROUND_DOWN).toNumber();

                await exchangeClient.updateIsolatedMargin({
                    asset: coinInfo.index,
                    isBuy,
                    ntli,
                });

                toast({
                    message: 'Margin updated successfully',
                    type: 'success',
                });
                return true;
            } catch (error) {
                toast({
                    message: error instanceof Error ? error.message : 'Failed to update margin',
                    type: 'error',
                    error,
                });
                return false;
            }
        },
        [exchangeClient, coinInfo, coinName, position, withdrawable],
    );
}
