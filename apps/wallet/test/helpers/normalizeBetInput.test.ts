import { describe, expect, it } from 'vitest';

import { normalizeBetInput } from '@/helpers/normalizeBetInput';

describe('normalizeBetInput', () => {
    describe('usd / shares', () => {
        it('strips currency symbols and keeps a single dot', () => {
            expect(normalizeBetInput('$1.2', 'usd')).toBe('1.2');
            expect(normalizeBetInput('1..2', 'shares')).toBe('1.2');
        });

        it('caps fraction digits to 2', () => {
            expect(normalizeBetInput('1.234', 'usd')).toBe('1.23');
        });

        it('preserves a trailing dot while typing', () => {
            expect(normalizeBetInput('1.', 'usd')).toBe('1.');
        });

        // Regression: FW-7797 — typing toward "1.01" must keep the intermediate "1.0"
        // instead of collapsing it back to "1", which made "1.01" impossible to enter.
        it('preserves a trailing fractional zero while typing (FW-7797)', () => {
            expect(normalizeBetInput('1.0', 'usd')).toBe('1.0');
            expect(normalizeBetInput('1.0', 'shares')).toBe('1.0');
        });

        it('supports typing the full "1.01" sequence keystroke by keystroke', () => {
            expect(normalizeBetInput('1', 'usd')).toBe('1');
            expect(normalizeBetInput('1.', 'usd')).toBe('1.');
            expect(normalizeBetInput('1.0', 'usd')).toBe('1.0');
            expect(normalizeBetInput('1.01', 'usd')).toBe('1.01');
        });

        it('clamps negatives to 0', () => {
            expect(normalizeBetInput('-5', 'usd')).toBe('5');
        });
    });
});
