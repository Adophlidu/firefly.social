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
 * Filter Quick Buy period events to BTC / ETH / SOL and sort by coin priority (BTC → ETH → SOL),
 * preserving volume order within each coin. Coins outside the priority set (XRP, DOGE, …) still
 * resolve via {@link resolveCryptoCoinFromEventListData} but are dropped here.
 */
export function filterAndSortCryptoQuickBuyEvents(events: PolymarketEventListData[]): PolymarketEventListData[] {
    return events
        .map((event) => ({ event, coin: resolveCryptoCoinFromEventListData(event) }))
        .filter(
            (entry): entry is { event: PolymarketEventListData; coin: PredictionCrypto } =>
                entry.coin !== undefined && coinPriority(entry.coin) !== -1,
        )
        .sort((a, b) => coinPriority(a.coin) - coinPriority(b.coin))
        .map((entry) => entry.event);
}
