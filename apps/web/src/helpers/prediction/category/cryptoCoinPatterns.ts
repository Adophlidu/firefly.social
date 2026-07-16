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

/** Polymarket tag slugs that mark an event as crypto (stocks/commodities use the `finance` tag). */
const CRYPTO_EVENT_TAG_SLUGS = new Set(['crypto', 'crypto-prices']);

/**
 * Tag slugs that are structural/category rather than a coin — excluded when picking the asset label.
 * Covers the period/feature meta tags plus the category tags Polymarket attaches to non-single-coin
 * crypto events (e.g. `crypto-treasury`, `price-milestone`).
 */
const NON_COIN_TAG_SLUGS = new Set([
    'crypto',
    'crypto-prices',
    'weekly',
    'monthly',
    'yearly',
    'hit-price',
    'multi-strikes',
    'recurring',
    'hide-from-new',
    'pre-market',
    'neg-risk',
    'best-month',
    'crypto-treasury',
    'price-comparison',
    'price-milestone',
]);

/**
 * True when Polymarket tags the event as crypto (`crypto` / `crypto-prices`). Admits the long tail of
 * crypto hit-price markets (Hyperliquid, Chainlink, …) to the periodic cell while keeping
 * stocks/commodities (tagged `finance`) on `BetItem`.
 */
export function hasCryptoEventTag(event: Pick<PolymarketEventListData, 'tags'>): boolean {
    return event.tags.some((tag) => CRYPTO_EVENT_TAG_SLUGS.has(tag.slug));
}

const capitalizeFirst = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

/**
 * Display name for the periodic-cell subtitle `● Live · {coin}`.
 *
 * Known coins (BTC/ETH/SOL/XRP/DOGE/HYPE/BNB, resolved from the slug/series) use
 * {@link CRYPTO_DISPLAY_NAME}. Other crypto assets fall back to their coin tag label, preferring a
 * tag whose slug appears in the event slug so a category tag (e.g. `crypto-treasury`) loses to the
 * real asset tag (`microstrategy`). The tag fallback is gated on {@link hasCryptoEventTag} so a
 * stock ticker tag (NVDA, Gold) never leaks in. Returns `null` when no label can be derived.
 */
export function resolveCryptoCoinLabelFromEventListData(
    event: Pick<PolymarketEventListData, 'slug' | 'series' | 'tags'>,
): string | null {
    const coin = resolveCryptoCoinFromEventListData(event);
    if (coin) return CRYPTO_DISPLAY_NAME[coin];

    if (!hasCryptoEventTag(event)) return null;

    const eventSlug = (event.slug ?? '').toLowerCase();
    const coinTags = event.tags.filter((tag) => !!tag.slug && !NON_COIN_TAG_SLUGS.has(tag.slug));
    if (!coinTags.length) {
        // Last resort: hit-price slugs name the asset ("what-price-will-avalanche-hit-…"). The slug
        // is locale-independent, so this still resolves when the title is translated (zh/ja).
        return extractCoinFromHitPriceSlug(eventSlug);
    }

    const coinTag = coinTags.find((tag) => eventSlug.includes(tag.slug.toLowerCase())) ?? coinTags[0];
    return capitalizeFirst(coinTag.label || coinTag.slug);
}

/**
 * Last-resort coin label for hit-price markets whose slug names the asset ("what-price-will-
 * avalanche-hit-…") but which carry no per-coin tag and no known-coin slug. Operates on the slug
 * (not the title) because the slug is locale-independent — the title may be translated (zh/ja).
 * Kebab-case → Title Case. Returns `null` for slugs outside the "what-price-will-…-hit" shape, so
 * aggregates ("altcoin-market-cap-dip-…") and metric events stay on `BetItem`.
 */
const HIT_PRICE_COIN_SLUG_RE = /^what-price-will-(.+?)-hit\b/;

export function extractCoinFromHitPriceSlug(slug: string | null | undefined): string | null {
    const coin = slug?.toLowerCase().match(HIT_PRICE_COIN_SLUG_RE)?.[1];
    if (!coin) return null;

    return coin
        .split('-')
        .filter(Boolean)
        .map((word) => capitalizeFirst(word))
        .join(' ');
}
