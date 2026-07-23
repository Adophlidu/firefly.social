import { describe, expect, it } from 'vitest';

import {
    DEFAULT_PERPS_MARKET,
    filterAndOrderPerpsMarkets,
    parsePerpsMarketFromUrl,
    resolvePerpsMarketIconUrl,
    toPerpsMarketUrl,
} from '@/components/Perps/marketSelection.js';

interface MarketFixture {
    coin: string;
    favorite: boolean;
    favoritedAt?: number;
    categories?: string[];
}

const markets: MarketFixture[] = [
    { coin: 'BTC-USDC', favorite: false, categories: ['all', 'crypto'] },
    { coin: 'SOL-USDC', favorite: true, favoritedAt: 200, categories: ['all', 'crypto'] },
    { coin: 'ETH-USDC', favorite: false },
    { coin: 'DOGE-USDC', favorite: true, favoritedAt: 100, categories: ['all', 'meme'] },
];

describe('Perpetuals market selection contract', () => {
    it('uses BTC-USDC when the URL does not select a market', () => {
        expect(DEFAULT_PERPS_MARKET).toBe('BTC-USDC'); // ASSERTION (frozen)
        expect(parsePerpsMarketFromUrl(new URL('https://firefly.social/en/perpetuals'))).toBe('BTC-USDC'); // ASSERTION (frozen)
    });

    it('orders favorites oldest-first and preserves API order for every remaining market', () => {
        expect(filterAndOrderPerpsMarkets(markets, '').map((market) => market.coin)).toEqual([
            'DOGE-USDC',
            'SOL-USDC',
            'BTC-USDC',
            'ETH-USDC',
        ]); // ASSERTION (frozen)
    });

    it('searches case-insensitively without changing the contract order', () => {
        expect(filterAndOrderPerpsMarkets(markets, 'do').map((market) => market.coin)).toEqual(['DOGE-USDC']); // ASSERTION (frozen)
        expect(filterAndOrderPerpsMarkets(markets, 'usdc').map((market) => market.coin)).toEqual([
            'DOGE-USDC',
            'SOL-USDC',
            'BTC-USDC',
            'ETH-USDC',
        ]); // ASSERTION (frozen)
    });

    it('limits the favorites category before applying search', () => {
        expect(filterAndOrderPerpsMarkets(markets, '', 'favorites').map((market) => market.coin)).toEqual([
            'DOGE-USDC',
            'SOL-USDC',
        ]); // ASSERTION (frozen)
        expect(filterAndOrderPerpsMarkets(markets, 'sol', 'favorites').map((market) => market.coin)).toEqual([
            'SOL-USDC',
        ]); // ASSERTION (frozen)
    });

    it('filters API-backed categories using the token mapping', () => {
        expect(filterAndOrderPerpsMarkets(markets, '', 'crypto').map((market) => market.coin)).toEqual([
            'SOL-USDC',
            'BTC-USDC',
        ]); // ASSERTION (frozen)
        expect(filterAndOrderPerpsMarkets(markets, '', 'meme').map((market) => market.coin)).toEqual(['DOGE-USDC']); // ASSERTION (frozen)
    });

    it('builds official Hyperliquid icon URLs from raw market names', () => {
        expect(resolvePerpsMarketIconUrl('BTC-USDC')).toBe('https://app.hyperliquid.xyz/coins/BTC.svg'); // ASSERTION (frozen)
        expect(resolvePerpsMarketIconUrl('xyz:TSLA-USDC')).toBe('https://app.hyperliquid.xyz/coins/xyz%3ATSLA.svg'); // ASSERTION (frozen)
    });

    it('round-trips the selected coin through a locale-aware URL', () => {
        const url = toPerpsMarketUrl('ja', 'ETH-USDC');

        expect(url.startsWith('/ja/perpetuals')).toBe(true); // ASSERTION (frozen)
        expect(parsePerpsMarketFromUrl(new URL(url, 'https://firefly.social'))).toBe('ETH-USDC'); // ASSERTION (frozen)
    });
});
