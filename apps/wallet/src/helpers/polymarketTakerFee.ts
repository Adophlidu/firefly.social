import { BigNumber } from 'bignumber.js';

/** Matches Polymarket Android fee display precision. */
const FEE_USD_DECIMALS = 5;
/** Market buy: shares = input / avgPrice with HALF_FLOOR at 18 dp. */
const MARKET_SHARES_DECIMALS = 18;

/**
 * Parse taker fee rate from Gamma when fees are enabled (PolymarketMapper parity).
 */
export function parsePolymarketTakerFeeRate(
    feesEnabled?: boolean | null,
    feeSchedule?: { rate?: string | null } | null,
): BigNumber {
    if (!feesEnabled || !feeSchedule?.rate) return BigNumber(0);
    const r = BigNumber(feeSchedule.rate);
    return r.isFinite() && r.gte(0) ? r : BigNumber(0);
}

export function computePolymarketMarketBuyShares(inputUsd: BigNumber.Value, avgPrice: BigNumber.Value): BigNumber {
    const input = BigNumber(inputUsd);
    const p = BigNumber(avgPrice);
    if (!input.isFinite() || input.lte(0) || !p.isFinite() || p.lte(0) || p.gte(1)) return BigNumber(0);
    return input.div(p).decimalPlaces(MARKET_SHARES_DECIMALS, BigNumber.ROUND_HALF_FLOOR);
}

/**
 * Taker fee in USD: shares * feeRate * price * (1 - price), rounded to 5 dp (PolymarketMarketBuyPresenter / Limit parity).
 */
export function computePolymarketTakerFeeUsd(params: {
    shares: BigNumber;
    feeRate: BigNumber;
    price: BigNumber;
}): BigNumber {
    const { shares, feeRate, price } = params;
    if (!feeRate.isFinite() || feeRate.lte(0)) return BigNumber(0);
    if (!shares.isFinite() || shares.lte(0)) return BigNumber(0);
    if (!price.isFinite() || price.lte(0) || price.gte(1)) return BigNumber(0);
    return shares
        .times(feeRate)
        .times(price)
        .times(BigNumber(1).minus(price))
        .decimalPlaces(FEE_USD_DECIMALS, BigNumber.ROUND_HALF_UP);
}

export function computePolymarketMarketBuyFeeUsd(
    inputUsd: BigNumber.Value,
    feeRate: BigNumber.Value,
    avgPrice: BigNumber.Value,
): BigNumber {
    const r = BigNumber(feeRate);
    const p = BigNumber(avgPrice);
    const shares = computePolymarketMarketBuyShares(inputUsd, p);
    return computePolymarketTakerFeeUsd({ shares, feeRate: r, price: p });
}
