import { describe, expect, it } from 'vitest';

import { PredictionCrypto } from '@/constants/bets.js';
import {
    CRYPTO_DISPLAY_NAME,
    resolveCryptoCoinFromEventListData,
} from '@/helpers/prediction/category/cryptoCoinPatterns.js';
import type { PolymarketSeriesData } from '@/providers/types/Firefly.js';

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
