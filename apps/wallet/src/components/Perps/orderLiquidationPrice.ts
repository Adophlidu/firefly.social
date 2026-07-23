import { calculateLiquidationPrice } from '@dimensiondev/perps-core';
import BigNumber from 'bignumber.js';

interface Options {
    isLong: boolean;
    isIsolated: boolean;
    entryPrice: string;
    size: string;
    leverage: number;
    maxLeverage: number;
    crossAccountValue?: string;
}

export function resolveEstimatedFillPrice({
    direction,
    limitPrice,
    markPrice,
}: {
    direction: 'buy' | 'sell';
    limitPrice: string;
    markPrice?: string;
}): string {
    const limit = new BigNumber(limitPrice);
    const mark = new BigNumber(markPrice ?? '');
    if (!mark.isFinite() || mark.lte(0)) return limitPrice;

    return direction === 'buy' ? BigNumber.minimum(limit, mark).toFixed() : BigNumber.maximum(limit, mark).toFixed();
}

export function calculateOrderLiquidationPrice(options: Options): BigNumber | null {
    const { isLong, isIsolated, entryPrice, size, leverage, maxLeverage, crossAccountValue } = options;
    if (!isIsolated) {
        const accountValue = new BigNumber(crossAccountValue ?? '');
        if (!accountValue.isFinite() || accountValue.lte(0)) return null;
    }

    const value = new BigNumber(
        calculateLiquidationPrice({
            isLong,
            isIsolated,
            entryPrice,
            size,
            leverage,
            maxLeverage,
            accountValue: crossAccountValue,
        }),
    );
    return value.isFinite() && value.gt(0) ? value : null;
}
