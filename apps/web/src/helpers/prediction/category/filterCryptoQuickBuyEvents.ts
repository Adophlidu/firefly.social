import { PredictionCrypto } from '@/constants/bets.js';
import { resolveCryptoCoinFromEventListData } from '@/helpers/prediction/category/cryptoCoinPatterns.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

/**
 * Quick Buy keeps only BTC / ETH / SOL, displayed in that coin-priority order (requirement §1.1.4).
 * Events sharing a coin keep their original (volume) order — `Array#sort` is stable, so the gamma
 * volume ordering is preserved within each coin bucket.
 */
export const CRYPTO_QUICK_BUY_COIN_PRIORITY: readonly PredictionCrypto[] = [
    PredictionCrypto.Bitcoin,
    PredictionCrypto.Ethereum,
    PredictionCrypto.Solana,
];

function coinPriority(coin: PredictionCrypto): number {
    return CRYPTO_QUICK_BUY_COIN_PRIORITY.indexOf(coin);
}

/**
 * Drop markets whose resolution window already passed. Polymarket leaves recurring crypto markets
 * flagged `active` long after their endDate, so the `closed=false` fetch filter alone lets stale
 * high-volume BTC cycles bury the current ETH/SOL markets. Open-ended events (no endDate) are kept.
 */
function isQuickBuyEventLive(event: PolymarketEventListData): boolean {
    const endTime = new Date(event.endDate).getTime();
    return Number.isNaN(endTime) || endTime >= Date.now();
}

/**
 * Quick Buy = BTC/ETH/SOL only (dropping past-window markets), sorted by coin priority
 * (BTC → ETH → SOL), preserving volume order within each coin.
 */
export function filterAndSortCryptoQuickBuyEvents(events: PolymarketEventListData[]): PolymarketEventListData[] {
    return events
        .filter(isQuickBuyEventLive)
        .map((event) => ({ event, coin: resolveCryptoCoinFromEventListData(event) }))
        .filter(
            (entry): entry is { event: PolymarketEventListData; coin: PredictionCrypto } =>
                entry.coin !== undefined && coinPriority(entry.coin) !== -1,
        )
        .sort((a, b) => coinPriority(a.coin) - coinPriority(b.coin))
        .map((entry) => entry.event);
}
