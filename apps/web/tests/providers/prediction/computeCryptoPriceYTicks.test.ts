import { describe, expect, it } from 'vitest';

import {
    computeCryptoPriceYTicks,
    CRYPTO_PRICE_Y_TICK_COUNT,
} from '@/providers/prediction/computeCryptoPriceYTicks.js';

describe('computeCryptoPriceYTicks', () => {
    it('returns exactly six ticks by default', () => {
        const { ticks } = computeCryptoPriceYTicks({ values: [100, 101, 102] });
        expect(ticks).toHaveLength(CRYPTO_PRICE_Y_TICK_COUNT);
    });

    it('returns monotonic evenly spaced ticks', () => {
        const { ticks } = computeCryptoPriceYTicks({ values: [636.1, 636.8, 637] });
        const step = ticks[1] - ticks[0];

        for (let i = 1; i < ticks.length; i += 1) {
            expect(ticks[i] - ticks[i - 1]).toBeCloseTo(step, 10);
            expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
        }
    });

    it('domain extends one step beyond outer ticks for axis padding', () => {
        const { ticks, domain } = computeCryptoPriceYTicks({ values: [636.1, 636.8, 637] });
        const step = ticks[1] - ticks[0];

        expect(domain).toEqual([ticks[0] - step, ticks[ticks.length - 1] + step]);
    });

    it('uses $2 steps for BTC-like prices around $636', () => {
        const { ticks } = computeCryptoPriceYTicks({
            values: [636.12, 636.95, 637.01],
        });

        expect(ticks).toHaveLength(6);
        expect(ticks[1] - ticks[0]).toBe(2);
        expect(ticks).toContain(636);
    });
});
