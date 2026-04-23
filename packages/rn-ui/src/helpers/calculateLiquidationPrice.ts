import BigNumber from 'bignumber.js';

import { multipliedBy } from '@/helpers/number';

export function getMarginRequired({ price, leverage, size }: { price: string; leverage: number; size: string }) {
    return multipliedBy(size, price).dividedBy(leverage);
}

interface LiqPriceOptions {
    isLong: boolean;
    isIsolated: boolean;
    entryPrice: string;
    size: string;
    leverage: number; //
    maxLeverage: number; //
    accountValue?: string; // Account Equity
}

export function calculateLiquidationPrice(options: LiqPriceOptions): string {
    const { isLong, isIsolated, entryPrice, size, leverage, maxLeverage, accountValue = '0' } = options;

    const P = new BigNumber(entryPrice);
    const Sz = new BigNumber(size).abs();
    const Side = isLong ? 1 : -1;

    // MMF = 0.5 / maxLeverage
    const L_m = new BigNumber(0.5).div(maxLeverage);

    // Maintenance Margin Required
    const mmRequired = P.times(Sz).times(L_m);

    // Margin Available
    let marginAvailable: BigNumber;
    if (isIsolated) {
        const isolatedMargin = getMarginRequired({ price: entryPrice, leverage, size });
        marginAvailable = new BigNumber(isolatedMargin).minus(mmRequired);
    } else {
        marginAvailable = new BigNumber(accountValue).minus(mmRequired);
    }

    // liq_price = P - (Side * marginAvailable) / (Sz * (1 - L_m * Side))
    const denominator = Sz.times(new BigNumber(1).minus(L_m.times(Side)));
    const priceDiff = new BigNumber(Side).times(marginAvailable).div(denominator);

    const liqPrice = P.minus(priceDiff);

    // keep safe
    if (liqPrice.isLessThanOrEqualTo(0)) {
        return '0';
    }

    return liqPrice.toString();
}
