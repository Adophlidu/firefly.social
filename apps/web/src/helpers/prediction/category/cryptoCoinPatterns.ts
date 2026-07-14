import { compact } from 'lodash-es';

import { PredictionCrypto } from '@/constants/bets.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

/**
 * Slug → coin regex map for all 7 supported crypto coins.
 *
 * Consolidated here so the Quick Buy filter ({@link filterCryptoQuickBuyEvents}) and the crypto
 * list-cell formatter ({@link formatPolymarketCryptoCellForUI}) share one source of truth. The
 * provider-layer `resolveCryptoFromPolymarketEvent` mirrors these patterns but operates on the
 * detail type `PolymarketEvent` (a different layer/type), so it is left untouched.
 *
 * Match order is preserved across consumers: BTC → ETH → SOL → XRP → DOGE → HYPE → BNB.
 */
export const CRYPTO_SLUG_PATTERNS: Record<PredictionCrypto, RegExp[]> = {
    [PredictionCrypto.Bitcoin]: [/^bitcoin-/, /-bitcoin-/, /^btc-/, /-btc-/],
    [PredictionCrypto.Ethereum]: [/^ethereum-/, /-ethereum-/, /^eth-/, /-eth-/],
    [PredictionCrypto.Solana]: [/^solana-/, /-solana-/, /^sol-/, /-sol-/],
    [PredictionCrypto.XRP]: [/^xrp-/, /-xrp-/],
    [PredictionCrypto.Dogecoin]: [/^dogecoin-/, /-dogecoin-/, /^doge-/, /-doge-/],
    [PredictionCrypto.Hype]: [/^hype-/, /-hype-/],
    [PredictionCrypto.BNB]: [/^bnb-/, /-bnb-/],
};

/**
 * Proper-noun display names for the subtitle `● Live · {coinName}`. Coin names are not translated.
 */
export const CRYPTO_DISPLAY_NAME: Record<PredictionCrypto, string> = {
    [PredictionCrypto.Bitcoin]: 'Bitcoin',
    [PredictionCrypto.Ethereum]: 'Ethereum',
    [PredictionCrypto.Solana]: 'Solana',
    [PredictionCrypto.XRP]: 'XRP',
    [PredictionCrypto.Dogecoin]: 'Dogecoin',
    [PredictionCrypto.Hype]: 'Hype',
    [PredictionCrypto.BNB]: 'BNB',
};

/**
 * Resolve the coin of a list event from its slug and series slugs. Mirrors the provider-layer
 * `resolveCryptoFromPolymarketEvent` but operates on {@link PolymarketEventListData} (which carries
 * `slug` + `series[].slug`). Returns the first coin whose pattern matches any candidate slug.
 */
export function resolveCryptoCoinFromEventListData(
    event: Pick<PolymarketEventListData, 'slug' | 'series'>,
): PredictionCrypto | undefined {
    const candidates = compact([event.slug, ...(event.series ?? []).map((series) => series.slug)]);
    if (!candidates.length) return undefined;

    for (const [coin, patterns] of Object.entries(CRYPTO_SLUG_PATTERNS)) {
        for (const pattern of patterns) {
            if (candidates.some((candidate) => pattern.test(candidate))) {
                return coin as PredictionCrypto;
            }
        }
    }

    return undefined;
}
