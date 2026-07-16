import { describe, expect, it } from 'vitest';

import { PredictionCrypto } from '@/constants/bets.js';
import {
    CRYPTO_DISPLAY_NAME,
    extractCoinFromHitPriceSlug,
    hasCryptoEventTag,
    resolveCryptoCoinFromEventListData,
    resolveCryptoCoinLabelFromEventListData,
} from '@/helpers/prediction/category/cryptoCoinPatterns.js';
import type { PolymarketSeriesData, PolymarketTagData } from '@/providers/types/Firefly.js';

function tag(slug: string, label: string): PolymarketTagData {
    return { id: slug, slug, label, forceShow: false, createdAt: '', updatedAt: '', requiresTranslation: false };
}

function series(slug: string): PolymarketSeriesData {
    return {
        id: slug,
        ticker: slug,
        slug,
        title: slug,
        active: true,
        archived: false,
        closed: false,
        commentCount: 0,
        createdAt: '',
        featured: false,
        icon: '',
        image: '',
        liquidity: 0,
        recurrence: '',
        requiresTranslation: false,
        restricted: false,
        seriesType: '',
        updatedAt: '',
        volume: 0,
    };
}

describe('resolveCryptoCoinFromEventListData', () => {
    it('detects Bitcoin by slug prefix (bitcoin- / btc-)', () => {
        expect(resolveCryptoCoinFromEventListData({ slug: 'bitcoin-100k' })).toBe(PredictionCrypto.Bitcoin);
        expect(resolveCryptoCoinFromEventListData({ slug: 'btc-100k' })).toBe(PredictionCrypto.Bitcoin);
    });

    it('detects Ethereum by slug prefix and infix', () => {
        expect(resolveCryptoCoinFromEventListData({ slug: 'ethereum-etf' })).toBe(PredictionCrypto.Ethereum);
        expect(resolveCryptoCoinFromEventListData({ slug: 'weekly-eth-merge' })).toBe(PredictionCrypto.Ethereum);
    });

    it('detects Solana by slug', () => {
        expect(resolveCryptoCoinFromEventListData({ slug: 'solana-etf' })).toBe(PredictionCrypto.Solana);
        expect(resolveCryptoCoinFromEventListData({ slug: 'sol-rally' })).toBe(PredictionCrypto.Solana);
    });

    it('detects the remaining coins (XRP / Dogecoin / Hype / BNB)', () => {
        expect(resolveCryptoCoinFromEventListData({ slug: 'xrp-etf' })).toBe(PredictionCrypto.XRP);
        expect(resolveCryptoCoinFromEventListData({ slug: 'doge-to-moon' })).toBe(PredictionCrypto.Dogecoin);
        expect(resolveCryptoCoinFromEventListData({ slug: 'hype-rally' })).toBe(PredictionCrypto.Hype);
        expect(resolveCryptoCoinFromEventListData({ slug: 'bnb-2024' })).toBe(PredictionCrypto.BNB);
    });

    it('returns undefined for non-crypto events', () => {
        expect(resolveCryptoCoinFromEventListData({ slug: 'us-election' })).toBeUndefined();
    });

    it('detects the coin via a series slug when the event slug is generic', () => {
        expect(resolveCryptoCoinFromEventListData({ slug: 'hourly-up-down', series: [series('btc-hourly')] })).toBe(
            PredictionCrypto.Bitcoin,
        );
    });

    it('returns undefined when no slug is present', () => {
        expect(resolveCryptoCoinFromEventListData({ slug: '', series: [] })).toBeUndefined();
    });
});

describe('CRYPTO_DISPLAY_NAME', () => {
    it('maps every coin to a proper-noun display name', () => {
        expect(CRYPTO_DISPLAY_NAME[PredictionCrypto.Bitcoin]).toBe('Bitcoin');
        expect(CRYPTO_DISPLAY_NAME[PredictionCrypto.Ethereum]).toBe('Ethereum');
        expect(CRYPTO_DISPLAY_NAME[PredictionCrypto.Solana]).toBe('Solana');
        expect(CRYPTO_DISPLAY_NAME[PredictionCrypto.XRP]).toBe('XRP');
        expect(CRYPTO_DISPLAY_NAME[PredictionCrypto.Dogecoin]).toBe('Dogecoin');
        expect(CRYPTO_DISPLAY_NAME[PredictionCrypto.Hype]).toBe('Hype');
        expect(CRYPTO_DISPLAY_NAME[PredictionCrypto.BNB]).toBe('BNB');
    });
});

describe('hasCryptoEventTag', () => {
    it('is true for the crypto / crypto-prices tags', () => {
        expect(hasCryptoEventTag({ tags: [tag('crypto', 'Crypto')] })).toBe(true);
        expect(hasCryptoEventTag({ tags: [tag('crypto-prices', 'Crypto Prices')] })).toBe(true);
    });

    it('is false for finance (stocks/commodities) and untagged events', () => {
        expect(hasCryptoEventTag({ tags: [tag('finance', 'Finance')] })).toBe(false);
        expect(hasCryptoEventTag({ tags: [] })).toBe(false);
    });
});

describe('resolveCryptoCoinLabelFromEventListData', () => {
    it('uses the known-coin display name when the slug resolves a coin', () => {
        expect(resolveCryptoCoinLabelFromEventListData({ slug: 'bitcoin-100k', tags: [] })).toBe('Bitcoin');
        expect(resolveCryptoCoinLabelFromEventListData({ slug: 'xrp-etf', tags: [] })).toBe('XRP');
    });

    it('derives the label from the coin tag for a crypto-tagged event with no known coin', () => {
        // Hyperliquid is HYPE but its slug has no `hype-` infix, so the slug resolver misses it — the
        // tag fallback must still surface "Hyperliquid".
        const event = {
            slug: 'what-price-will-hyperliquid-hit-before-2027',
            tags: [tag('hyperliquid', 'hyperliquid'), tag('crypto', 'Crypto'), tag('hit-price', 'Hit Price')],
        };
        expect(resolveCryptoCoinLabelFromEventListData(event)).toBe('Hyperliquid');
    });

    it('capitalizes a lowercase tag label but leaves already-cased labels intact', () => {
        expect(
            resolveCryptoCoinLabelFromEventListData({
                slug: 'x',
                tags: [tag('crypto', 'Crypto'), tag('ethena', 'ethena')],
            }),
        ).toBe('Ethena');
        expect(
            resolveCryptoCoinLabelFromEventListData({ slug: 'x', tags: [tag('crypto', 'Crypto'), tag('lab', 'LAB')] }),
        ).toBe('LAB');
    });

    it('prefers a coin tag whose slug is in the event slug over a category tag', () => {
        // MicroStrategy carries both `crypto-treasury` (category) and `microstrategy` (asset); the
        // asset tag matches the slug and must win.
        const event = {
            slug: 'will-microstrategy-announce-treasury-update',
            tags: [
                tag('crypto-treasury', 'Crypto Treasury'),
                tag('crypto', 'Crypto'),
                tag('microstrategy', 'MicroStrategy'),
            ],
        };
        expect(resolveCryptoCoinLabelFromEventListData(event)).toBe('MicroStrategy');
    });

    it('returns null for a stock event (finance tag, no known coin) so it stays on BetItem', () => {
        const event = {
            slug: 'what-price-will-nvda-hit-in-july-2026',
            tags: [
                tag('finance', 'Finance'),
                tag('stocks', 'Stocks'),
                tag('equities', 'Equities'),
                tag('nvda', 'NVDA'),
            ],
        };
        expect(resolveCryptoCoinLabelFromEventListData(event)).toBeNull();
    });

    it('returns null for an untagged unknown asset', () => {
        expect(resolveCryptoCoinLabelFromEventListData({ slug: 'someasset-rally', tags: [] })).toBeNull();
    });

    it('falls back to the hit-price slug for a crypto event with no coin tag (locale-independent)', () => {
        // The slug is always English, so this resolves even when the title is translated (zh/ja).
        expect(
            resolveCryptoCoinLabelFromEventListData({
                slug: 'what-price-will-avalanche-hit-before-2027',
                tags: [tag('crypto', 'Crypto'), tag('crypto-prices', 'Crypto Prices'), tag('hit-price', 'Hit Price')],
            }),
        ).toBe('Avalanche');
    });
});

describe('extractCoinFromHitPriceSlug', () => {
    it('extracts + Title-Cases the coin from "what-price-will-{coin}-hit-…" (locale-independent)', () => {
        expect(extractCoinFromHitPriceSlug('what-price-will-avalanche-hit-before-2027')).toBe('Avalanche');
        expect(extractCoinFromHitPriceSlug('what-price-will-chainlink-hit-in-2026')).toBe('Chainlink');
    });

    it('Title-Cases multi-word coins and ignores input case', () => {
        expect(extractCoinFromHitPriceSlug('What-Price-Will-Bitcoin-Volatility-Index-Hit-2026')).toBe(
            'Bitcoin Volatility Index',
        );
    });

    it('returns null for slugs outside the hit-price shape (aggregates/metrics stay on BetItem)', () => {
        expect(extractCoinFromHitPriceSlug('altcoin-market-cap-dip-before-2027')).toBeNull();
        expect(extractCoinFromHitPriceSlug('will-ethereum-gas-price-hit-2027')).toBeNull();
        expect(extractCoinFromHitPriceSlug(undefined)).toBeNull();
        expect(extractCoinFromHitPriceSlug('')).toBeNull();
    });
});
