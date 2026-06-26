import { describe, expect, it } from 'vitest';

import { formatSignedUsd, formatUsd } from '@/services/polymarketShareImage/format.js';

describe('formatUsd', () => {
    it('formats a positive amount', () => {
        expect(formatUsd(893.34)).toBe('$893.34');
    });

    it('formats a negative amount with a leading minus', () => {
        expect(formatUsd(-893.34)).toBe('-$893.34');
    });
});

describe('formatSignedUsd', () => {
    it('prefixes non-negative amounts with a plus sign', () => {
        expect(formatSignedUsd(893.34)).toBe('+$893.34');
        expect(formatSignedUsd(0)).toBe('+$0.00');
    });

    it('keeps the minus sign for negative amounts', () => {
        expect(formatSignedUsd(-893.34)).toBe('-$893.34');
    });
});
