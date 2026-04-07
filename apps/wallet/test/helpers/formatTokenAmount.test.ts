import { describe, expect, it } from 'vitest';

import { formatTokenAmount } from '@/helpers/swap/formatSwapAmount';

describe('formatTokenAmount', () => {
    it('returns "0" for nullish / empty input', () => {
        expect(formatTokenAmount(undefined)).toBe('0');
        expect(formatTokenAmount(null)).toBe('0');
        expect(formatTokenAmount('')).toBe('0');
    });

    it('returns "0" for zero', () => {
        expect(formatTokenAmount(0)).toBe('0');
        expect(formatTokenAmount('0')).toBe('0');
    });

    it('returns "0" for NaN', () => {
        expect(formatTokenAmount('abc')).toBe('0');
        expect(formatTokenAmount(NaN)).toBe('0');
    });

    it('truncates (floors) small balances — never rounds up', () => {
        // 0.000246774... → "0.000246" (not "0.000247")
        expect(formatTokenAmount('0.000246774587628144')).toBe('0.000246');
    });

    it('truncates values just below 1', () => {
        // 0.9999999 → "0.999999" (not "1")
        expect(formatTokenAmount('0.9999999')).toBe('0.999999');
    });

    it('truncates values >= 1 to 2 decimals', () => {
        expect(formatTokenAmount('1.999')).toBe('1.99');
        expect(formatTokenAmount('1.005')).toBe('1.00');
    });

    it('adds thousand separators for values >= 1', () => {
        expect(formatTokenAmount('1234.5678')).toBe('1,234.56');
        expect(formatTokenAmount('1000000')).toBe('1,000,000.00');
    });

    it('shows exactly 2 decimals for whole numbers >= 1', () => {
        expect(formatTokenAmount('1')).toBe('1.00');
        expect(formatTokenAmount('42')).toBe('42.00');
    });

    it('removes trailing zeros for values < 1', () => {
        expect(formatTokenAmount('0.1')).toBe('0.1');
        expect(formatTokenAmount('0.100000')).toBe('0.1');
        expect(formatTokenAmount('0.123')).toBe('0.123');
    });

    it('returns exact boundary value 0.000001 without bracket', () => {
        expect(formatTokenAmount('0.000001')).toBe('0.000001');
    });

    it('returns "<0.000001" for values below threshold', () => {
        expect(formatTokenAmount('0.0000009')).toBe('<0.000001');
        expect(formatTokenAmount('0.0000001')).toBe('<0.000001');
    });

    it('handles numeric input', () => {
        expect(formatTokenAmount(0.000246774)).toBe('0.000246');
        expect(formatTokenAmount(1.5)).toBe('1.50');
    });
});
