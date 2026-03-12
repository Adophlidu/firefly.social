import { describe, expect, it } from 'vitest';

import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';

describe('formatPolymarketNumber', () => {
    it('should return fallback for undefined', () => {
        expect(formatPolymarketNumber(undefined)).toBe('-');
    });

    it('should return fallback for null', () => {
        expect(formatPolymarketNumber(null)).toBe('-');
    });

    it('should format zero', () => {
        expect(formatPolymarketNumber(0)).toBe('$0');
    });

    it('should format positive numbers with default $ prefix', () => {
        expect(formatPolymarketNumber(1)).toBe('$1');
        expect(formatPolymarketNumber(10)).toBe('$10');
        expect(formatPolymarketNumber(100)).toBe('$100');
    });

    it('should format negative numbers', () => {
        expect(formatPolymarketNumber(-1)).toBe('-$1');
        expect(formatPolymarketNumber(-10)).toBe('-$10');
        expect(formatPolymarketNumber(-100)).toBe('-$100');
    });

    it('should truncate numbers instead of rounding', () => {
        expect(formatPolymarketNumber(1.234)).toBe('$1.23'); // truncates
        expect(formatPolymarketNumber(1.235)).toBe('$1.23'); // truncates (would round to 1.24)
        expect(formatPolymarketNumber(1.999)).toBe('$1.99'); // truncates (would round to 2.00)
    });

    it('should truncate negative numbers towards zero', () => {
        expect(formatPolymarketNumber(-1.234)).toBe('-$1.23'); // truncates towards zero
        expect(formatPolymarketNumber(-1.235)).toBe('-$1.23'); // truncates towards zero
        expect(formatPolymarketNumber(-1.999)).toBe('-$1.99'); // truncates towards zero
    });

    it('should handle small numbers (< 1)', () => {
        expect(formatPolymarketNumber(0.5)).toBe('$0.5');
        expect(formatPolymarketNumber(0.123)).toBe('$0.12');
        expect(formatPolymarketNumber(0.001)).toBe('<$0.01');
    });

    it('should format large numbers with K suffix', () => {
        expect(formatPolymarketNumber(1_500)).toBe('$1.5K');
        expect(formatPolymarketNumber(10_000)).toBe('$10K');
        expect(formatPolymarketNumber(999_999)).toBe('$999.99K');
    });

    it('should format large numbers with M suffix', () => {
        expect(formatPolymarketNumber(1_500_000)).toBe('$1.5M');
        expect(formatPolymarketNumber(10_000_000)).toBe('$10M');
        expect(formatPolymarketNumber(999_999_999)).toBe('$999.99M');
    });

    it('should format large numbers with B suffix', () => {
        expect(formatPolymarketNumber(1_500_000_000)).toBe('$1.5B');
        expect(formatPolymarketNumber(10_000_000_000)).toBe('$10B');
        expect(formatPolymarketNumber(999_999_999_999)).toBe('$999.99B');
    });

    it('should format large numbers with T suffix', () => {
        expect(formatPolymarketNumber(1_500_000_000_000)).toBe('$1.5T');
        expect(formatPolymarketNumber(10_000_000_000_000)).toBe('$10T');
    });

    it('should truncate large number suffixes', () => {
        expect(formatPolymarketNumber(1_448_879)).toBe('$1.44M'); // 1.44 million
        expect(formatPolymarketNumber(1_789_006)).toBe('$1.78M'); // 1.78 million
    });

    it('should respect custom symbol', () => {
        expect(formatPolymarketNumber(100, { symbol: '' })).toBe('100');
        expect(formatPolymarketNumber(100, { symbol: '€' })).toBe('€100');
        expect(formatPolymarketNumber(100, { symbol: null })).toBe('100');
    });

    it('should add sign prefix when sign enabled', () => {
        expect(formatPolymarketNumber(100, { sign: true })).toBe('+$100');
        expect(formatPolymarketNumber(-100, { sign: true })).toBe('-$100');
        expect(formatPolymarketNumber(0, { sign: true })).toBe('$0');
    });

    it('should respect custom digits', () => {
        expect(formatPolymarketNumber(1.234, { digits: 1 })).toBe('$1.2');
        expect(formatPolymarketNumber(1.234, { digits: 3 })).toBe('$1.234');
    });

    it('should use custom fallback', () => {
        expect(formatPolymarketNumber(undefined, { fallback: 'N/A' })).toBe('N/A');
        expect(formatPolymarketNumber(null, { fallback: '' })).toBe('');
    });

    // Jira FW-6433: PnL formatting issue - truncate instead of round
    it('should handle PnL values (Jira FW-6433)', () => {
        expect(formatPolymarketNumber(-1.448879)).toBe('-$1.44'); // truncated, not rounded
    });

    // Jira FW-6434: Total Losses formatting issue - truncate instead of round
    it('should handle Total Losses values (Jira FW-6434)', () => {
        expect(formatPolymarketNumber(1.7890069999999987)).toBe('$1.78'); // truncated, not rounded
    });

    it('should handle very small positive numbers', () => {
        expect(formatPolymarketNumber(0.001)).toBe('<$0.01');
    });
});
