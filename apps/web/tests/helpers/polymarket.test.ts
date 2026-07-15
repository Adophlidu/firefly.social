import { describe, expect, it } from 'vitest';

import { formatBuyButtonAsk } from '@/helpers/polymarket.js';

describe('formatBuyButtonAsk', () => {
    it('formats a genuine ask (0 < ask < 1) as cents', () => {
        expect(formatBuyButtonAsk(0.99)).toBe('99¢');
        expect(formatBuyButtonAsk(0.505)).toBe('50.5¢');
        expect(formatBuyButtonAsk(0.5)).toBe('50¢');
        expect(formatBuyButtonAsk(0.01)).toBe('1¢');
    });

    it('shows "--" when there is no real ask — 1 (100¢) or 0', () => {
        // A token whose only ask sits at $1, or an empty order book, has no liquidity to
        // buy against; the official site renders "--" rather than 100¢/0¢.
        expect(formatBuyButtonAsk(1)).toBe('--');
        expect(formatBuyButtonAsk(0)).toBe('--');
    });

    it('shows "--" for out-of-range or invalid asks', () => {
        expect(formatBuyButtonAsk(1.2)).toBe('--');
        expect(formatBuyButtonAsk(-0.1)).toBe('--');
        expect(formatBuyButtonAsk(Number.NaN)).toBe('--');
    });
});
