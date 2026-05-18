import { useLingui } from '@lingui/react/macro';
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
    const { i18n } = useLingui();
    const exchangeClient = useAtomValue(exchangeClientAtom);
    const { data: coinInfo } = useCoinInfo(coinName);
    const { withdrawable } = usePerpsComputedAccountValue();

    return useAsyncFn(
        async (amountUsd: string): Promise<boolean> => {
            if (!coinName || !position) return false;

            const amountBn = new BigNumber(amountUsd || '0');
            const maxAdd = new BigNumber(withdrawable || '0');

            if (amountBn.isNaN() || !amountBn.isFinite() || amountBn.lte(0)) {
                toast({ message: i18n._('rn-ui.adjustMargin.error.invalidAmount'), type: 'error' });
                return false;
            }

            if (amountBn.lt(MIN_ISOLATED_MARGIN_ADD_USD)) {
                toast({
                    message: i18n._('rn-ui.adjustMargin.error.minimumAmount', {
                        minAmount: MIN_ISOLATED_MARGIN_ADD_USD.toFixed(2),
                    }),
                    type: 'error',
                });
                return false;
            }

            if (amountBn.gt(maxAdd)) {
                toast({ message: i18n._('rn-ui.adjustMargin.error.exceedsWithdrawable'), type: 'error' });
                return false;
            }

            if (position.leverage.type !== 'isolated') {
                toast({ message: i18n._('rn-ui.adjustMargin.error.isolatedOnly'), type: 'error' });
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
                    message: i18n._('rn-ui.adjustMargin.success'),
                    type: 'success',
                });
                return true;
            } catch (error) {
                toast({
                    message: error instanceof Error ? error.message : i18n._('rn-ui.adjustMargin.error.failure'),
                    type: 'error',
                    error,
                });
                return false;
            }
        },
        [exchangeClient, coinInfo, coinName, i18n, position, withdrawable],
    );
}
