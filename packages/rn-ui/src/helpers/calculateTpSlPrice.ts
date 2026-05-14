import { BigNumber } from 'bignumber.js';

import { formatPrice } from '@/helpers/formatPrice';
import { isValidSize } from '@/helpers/isValidSize';
import { isZero } from '@/helpers/number';

interface Options {
    entryPrice: string;
    tpRatio: string;
    slRatio: string;
    isLong: boolean;
    size: string;
    leverage: number;
    szDecimals: number;
}

export function calculateTpSlPrice({ entryPrice, tpRatio, slRatio, isLong, size, leverage, szDecimals }: Options) {
    if (!isValidSize(size) || !isValidSize(entryPrice) || (!isValidSize(tpRatio) && !isValidSize(slRatio))) {
        return {
            tpPrice: null,
            slPrice: null,
            tpPnl: null,
            slPnl: null,
        };
    }

    const entry = new BigNumber(entryPrice);
    const lev = new BigNumber(leverage);

    const tpR = isValidSize(tpRatio) ? new BigNumber(tpRatio) : BigNumber(0);
    const slR = isValidSize(slRatio) ? new BigNumber(slRatio) : BigNumber(0);
    const targetTpRoe = tpR.dividedBy(100);
    const targetSlRoe = slR.dividedBy(100);

    const tpPriceChange = targetTpRoe.dividedBy(lev);
    const slPriceChange = targetSlRoe.dividedBy(lev);

    let tpPrice: BigNumber;
    let slPrice: BigNumber;
    if (isLong) {
        tpPrice = entry.times(new BigNumber(1).plus(tpPriceChange));
        slPrice = entry.times(new BigNumber(1).minus(slPriceChange));
    } else {
        tpPrice = entry.times(new BigNumber(1).minus(tpPriceChange));
        slPrice = entry.times(new BigNumber(1).plus(slPriceChange));
    }

    return {
        tpPrice: isZero(tpR) ? null : formatPrice(tpPrice, szDecimals),
        slPrice: isZero(slR) ? null : formatPrice(slPrice, szDecimals),
    };
}
