import { describe, expect, it } from 'vitest';

import { parseInputAmount } from '@/helpers/swap/formatSwapAmount';

describe('parseInputAmount', () => {
    it('returns empty string for empty input', () => {
        expect(parseInputAmount('')).toBe('');
    });

    it('strips commas and whitespace', () => {
        expect(parseInputAmount('1,234')).toBe('1234');
        expect(parseInputAmount(' 1 2 3 ')).toBe('123');
        expect(parseInputAmount('1,234.56')).toBe('1234.56');
    });

    it('rejects non-numeric input', () => {
        expect(parseInputAmount('abc')).toBe('');
        expect(parseInputAmount('1.2.3')).toBe('');
        expect(parseInputAmount('-1')).toBe('');
    });

    it('collapses leading zeros to a single 0 when followed by a dot', () => {
        expect(parseInputAmount('0')).toBe('0');
        expect(parseInputAmount('00')).toBe('0');
        expect(parseInputAmount('000')).toBe('0');
        expect(parseInputAmount('00.5')).toBe('0.5');
        expect(parseInputAmount('000.5')).toBe('0.5');
    });

    it('strips leading zeros entirely when followed by a non-zero digit', () => {
        expect(parseInputAmount('01')).toBe('1');
        expect(parseInputAmount('01.5')).toBe('1.5');
        expect(parseInputAmount('007')).toBe('7');
    });

    it('preserves normal numeric input', () => {
        expect(parseInputAmount('0.5')).toBe('0.5');
        expect(parseInputAmount('100')).toBe('100');
        expect(parseInputAmount('1.23')).toBe('1.23');
    });

    it('preserves trailing and leading dots while typing', () => {
        expect(parseInputAmount('0.')).toBe('0.');
        expect(parseInputAmount('1.')).toBe('1.');
        expect(parseInputAmount('.')).toBe('.');
        expect(parseInputAmount('.5')).toBe('.5');
    });
});
