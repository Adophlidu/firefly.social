import { describe, expect, it } from 'vitest';

import { normalizeDecimalInput } from '@/helpers/normalizeDecimalInput';

describe('normalizeDecimalInput', () => {
    it('returns empty string for empty input', () => {
        expect(normalizeDecimalInput('', { maxDecimals: 2 })).toBe('');
    });

    it('strips non-numeric characters and keeps a single dot', () => {
        expect(normalizeDecimalInput('a1b2', { maxDecimals: 2 })).toBe('12');
        expect(normalizeDecimalInput('1..2', { maxDecimals: 2 })).toBe('1.2');
        expect(normalizeDecimalInput('..1.2.3..', { maxDecimals: 3 })).toBe('0.123');
    });

    it('limits fraction digits to maxDecimals', () => {
        expect(normalizeDecimalInput('12.3456', { maxDecimals: 2 })).toBe('12.34');
        expect(normalizeDecimalInput('12.3', { maxDecimals: 2 })).toBe('12.3');
        expect(normalizeDecimalInput('12.3456', { maxDecimals: 0 })).toBe('12');
    });

    it('removes leading zeros but keeps 0', () => {
        expect(normalizeDecimalInput('00012', { maxDecimals: 2 })).toBe('12');
        expect(normalizeDecimalInput('000', { maxDecimals: 2 })).toBe('0');
        expect(normalizeDecimalInput('000.10', { maxDecimals: 2 })).toBe('0.10');
    });

    it('preserves a trailing dot by default', () => {
        expect(normalizeDecimalInput('1.', { maxDecimals: 2 })).toBe('1.');
        expect(normalizeDecimalInput('.', { maxDecimals: 2 })).toBe('0.');
    });

    it('does not preserve a trailing dot when disabled', () => {
        expect(normalizeDecimalInput('1.', { maxDecimals: 2, preserveTrailingDot: false })).toBe('1');
        expect(normalizeDecimalInput('.', { maxDecimals: 2, preserveTrailingDot: false })).toBe('0');
    });

    it('clamps to min/max when provided', () => {
        expect(normalizeDecimalInput('5', { maxDecimals: 2, min: 10 })).toBe('10');
        expect(normalizeDecimalInput('15', { maxDecimals: 2, max: 10 })).toBe('10');

        // When user typed a dot and some fraction, clamped value keeps the same (up to) fraction length.
        expect(normalizeDecimalInput('5.5', { maxDecimals: 2, min: 10 })).toBe('10.0');
    });
});
