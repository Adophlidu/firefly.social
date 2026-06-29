import { describe, expect, it } from 'vitest';

import { formatSignedPercent, formatSignedUsd, formatUsd } from '@/services/polymarketShareImage/format.js';

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

describe('formatSignedPercent', () => {
    it('keeps up to 2 decimals below 1000%', () => {
        expect(formatSignedPercent(19.34)).toBe('+19.34%');
        expect(formatSignedPercent(-42.5)).toBe('-42.5%');
        expect(formatSignedPercent(999.99)).toBe('+999.99%');
    });

    it('drops decimals once the magnitude reaches 1000%', () => {
        expect(formatSignedPercent(1000)).toBe('+1000%');
        expect(formatSignedPercent(1234.56)).toBe('+1235%');
        expect(formatSignedPercent(-1500.4)).toBe('-1500%');
    });
});
