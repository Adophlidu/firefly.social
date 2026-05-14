import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { calculateLiquidationPrice } from '@/helpers/calculateLiquidationPrice';
import { isValidSize } from '@/helpers/isValidSize';
import { assetBalanceAtom, currentPriceAtom, leverageAtom, sizeAtom } from '@/store/tradeForm';

export function useLiquidationPrice(maxLeverage: number) {
    const currentPrice = useAtomValue(currentPriceAtom);
    const leverage = useAtomValue(leverageAtom);
    const size = useAtomValue(sizeAtom);
    const balance = useAtomValue(assetBalanceAtom);

    return useMemo(() => {
        if (!isValidSize(currentPrice) || !isValidSize(size) || !isValidSize(balance)) {
            return {
                buy: '',
                sell: '',
            };
        }

        return {
            buy: calculateLiquidationPrice({
                isLong: true,
                isIsolated: true,
                entryPrice: currentPrice,
                size,
                leverage,
                maxLeverage,
                accountValue: balance,
            }),
            sell: calculateLiquidationPrice({
                isLong: false,
                isIsolated: true,
                entryPrice: currentPrice,
                size,
                leverage,
                maxLeverage,
                accountValue: balance,
            }),
        };
    }, [currentPrice, size, leverage, balance, maxLeverage]);
}
