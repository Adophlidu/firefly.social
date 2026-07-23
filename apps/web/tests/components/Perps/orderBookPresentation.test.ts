import { describe, expect, it } from 'vitest';

import {
    buildOrderBookPresentation,
    getOrderBookRetryDelay,
    getOrderBookStepOptions,
} from '@/components/Perps/orderBookPresentation.js';

const asks = [
    { px: '1928.7', sz: '2' },
    { px: '1928.6', sz: '1' },
];
const bids = [
    { px: '1928.5', sz: '1' },
    { px: '1928.4', sz: '3' },
];

describe('order book presentation', () => {
    it('accumulates asks from the best price upward and bids from the best price downward', () => {
        const book = buildOrderBookPresentation(asks, bids, 'coin');

        expect(book.asks.map((row) => row.total)).toEqual([3, 1]);
        expect(book.bids.map((row) => row.total)).toEqual([1, 4]);
        expect(book.asks[0]?.ratio).toBe(0.75);
        expect(book.bids[1]?.ratio).toBe(1);
    });

    it('converts both per-level size and cumulative total to USDC notionals', () => {
        const book = buildOrderBookPresentation(asks, bids, 'USDC');

        expect(book.asks[1]?.size).toBeCloseTo(1928.6);
        expect(book.asks[0]?.total).toBeCloseTo(5786);
        expect(book.bids[1]?.total).toBeCloseTo(7713.7);
    });

    it('uses the best ask and best bid for the spread', () => {
        const book = buildOrderBookPresentation(asks, bids, 'USDC');

        expect(book.spread).toBeCloseTo(0.1);
        expect(book.spreadPercent).toBeCloseTo((0.1 / 1928.5) * 100);
    });

    it('derives aggregation labels from the market price magnitude', () => {
        expect(getOrderBookStepOptions(1928).map((option) => option.label)).toEqual([
            '0.1',
            '0.2',
            '0.5',
            '1',
            '10',
            '100',
        ]);
        expect(getOrderBookStepOptions(66_000).map((option) => option.label)).toEqual([
            '1',
            '2',
            '5',
            '10',
            '100',
            '1000',
        ]);
    });

    it('backs off retries up to thirty seconds', () => {
        expect([0, 1, 2, 3, 4, 5, 6].map(getOrderBookRetryDelay)).toEqual([
            1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000,
        ]);
    });
});
