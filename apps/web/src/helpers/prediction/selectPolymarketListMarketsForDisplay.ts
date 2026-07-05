import { isZero } from '@dimensiondev/web3/numbers';

import type { BetsMarketDataForUI } from '@/types/prediction.js';

const calculateRatio = (market: BetsMarketDataForUI): number => {
    const prices = market.outcomes.map((outcome) => outcome.price ?? '0');

    if (!prices || prices.length < 2) return 0;

    if (prices.every((price) => isZero(price))) {
        return 0;
    }

    const firstPrice = Number.parseFloat(String(prices[0]));
    const secondPrice = Number.parseFloat(String(prices[1]));

    if (Number.isNaN(firstPrice) || Number.isNaN(secondPrice)) return 0;

    const sum = firstPrice + secondPrice;

    if (isZero(sum)) return 0;

    const ratio = firstPrice / sum;
    return Math.max(0, Math.min(1, ratio));
};

const isMarketDecided = (market: BetsMarketDataForUI): boolean => {
    return market.outcomes.some((outcome) => {
        const price = Number.parseFloat(outcome.price ?? '0');
        return !Number.isNaN(price) && price >= 1;
    });
};

const tryParseIntOrMax = (value: string | null | undefined): number => {
    const parsed = value ? Number.parseInt(value, 10) : NaN;
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
};

/** Shared by BetItem (client render) and the SSR compaction helper below so both pick identical markets. */
export const sortMarkets = (markets: BetsMarketDataForUI[], sortBy?: string): BetsMarketDataForUI[] => {
    const unresolved = markets.filter((market) => !market.isResolved && !market.isClosed);
    const resolved = markets.filter((market) => market.isResolved || market.isClosed);

    const sortInternal = (marketsToSort: BetsMarketDataForUI[]): BetsMarketDataForUI[] => {
        if (sortBy === 'price') {
            return [...marketsToSort].sort((a, b) => {
                const aRatio = calculateRatio(a);
                const bRatio = calculateRatio(b);
                return bRatio - aRatio;
            });
        }

        const sortedWithThreshold = marketsToSort
            .filter((market) => !!market.groupItemThreshold)
            .sort((a, b) => {
                const aThreshold = tryParseIntOrMax(a.groupItemThreshold);
                const bThreshold = tryParseIntOrMax(b.groupItemThreshold);
                return aThreshold - bThreshold;
            });

        const sortedWithoutThreshold = marketsToSort
            .filter((market) => !market.groupItemThreshold)
            .sort((a, b) => {
                const aId = tryParseIntOrMax(a.id);
                const bId = tryParseIntOrMax(b.id);
                return aId - bId;
            });

        return sortedWithThreshold.concat(sortedWithoutThreshold);
    };

    return sortInternal(unresolved).concat(sortInternal(resolved));
};

/** Mirrors BetItem displayedMarkets selection so SSR payloads show the same markets. */
export function selectPolymarketListMarketsForDisplay(
    markets: BetsMarketDataForUI[],
    sortBy: string | undefined,
    limit: number,
): BetsMarketDataForUI[] {
    const sortedMarkets = sortMarkets(markets, sortBy);
    const isMultiMarket = markets.length > 1;

    if (!isMultiMarket) return sortedMarkets.slice(0, limit);

    const isEligible = (market: BetsMarketDataForUI) =>
        !market.isResolved && !market.isClosed && !isMarketDecided(market) && market.active !== false;

    const eligible = sortedMarkets.filter(isEligible);
    const sorted = [...eligible].sort((a, b) => calculateRatio(b) - calculateRatio(a));

    if (sorted.length >= limit) {
        return sorted.slice(0, limit);
    }

    const usedIds = new Set(sorted.map((market) => market.id));
    const fallback = sortedMarkets.filter((market) => !usedIds.has(market.id) && market.active !== false);
    return [...sorted, ...fallback].slice(0, limit);
}
