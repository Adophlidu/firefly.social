import { compact } from 'lodash-es';

import { PredictionCrypto } from '@/constants/bets.js';
import type { PolymarketEvent } from '@/providers/prediction/polymarket/type.js';

const cryptoPatterns: Record<PredictionCrypto, RegExp[]> = {
    [PredictionCrypto.Bitcoin]: [/^bitcoin-/, /-bitcoin-/, /^btc-/, /-btc-/],
    [PredictionCrypto.Ethereum]: [/^ethereum-/, /-ethereum-/, /^eth-/, /-eth-/],
    [PredictionCrypto.Solana]: [/^solana-/, /-solana-/, /^sol-/, /-sol-/],
    [PredictionCrypto.XRP]: [/^xrp-/, /-xrp-/],
    [PredictionCrypto.Dogecoin]: [/^dogecoin-/, /-dogecoin-/, /^doge-/, /-doge-/],
    [PredictionCrypto.Hype]: [/^hype-/, /-hype-/],
    [PredictionCrypto.BNB]: [/^bnb-/, /-bnb-/],
};

export function resolveCryptoFromPolymarketEvent(detail: PolymarketEvent): PredictionCrypto | undefined {
    if (!detail.series?.length) return;

    const candidates = compact([detail.slug, detail.seriesSlug, ...detail.series?.map((s) => s.slug)]);
    if (!candidates.length) return;

    for (const [crypto, patterns] of Object.entries(cryptoPatterns)) {
        for (const pattern of patterns) {
            if (candidates.some((c) => pattern.test(c))) {
                return crypto as PredictionCrypto;
            }
        }
    }

    return;
}
