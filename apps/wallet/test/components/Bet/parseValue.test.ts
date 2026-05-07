import { describe, expect, it } from 'vitest';

import { parseValue } from '@/components/Bet/CurrencyAmount.js';

describe('parseValue', () => {
    it('parses "<$0.01"', () => {
        expect(parseValue('<$0.01')).toEqual({
            prefix: '<',
            currency: '$',
            integer: '0',
            decimal: '01',
        });
    });

    it('parses "$1,234.56"', () => {
        expect(parseValue('$1,234.56')).toEqual({
            prefix: '',
            currency: '$',
            integer: '1,234',
            decimal: '56',
        });
    });

    it('parses "$0"', () => {
        expect(parseValue('$0')).toEqual({
            prefix: '',
            currency: '$',
            integer: '0',
            decimal: '',
        });
    });

    it('parses "$7.09"', () => {
        expect(parseValue('$7.09')).toEqual({
            prefix: '',
            currency: '$',
            integer: '7',
            decimal: '09',
        });
    });

    it('parses "$100" with no decimal', () => {
        expect(parseValue('$100')).toEqual({
            prefix: '',
            currency: '$',
            integer: '100',
            decimal: '',
        });
    });

    it('returns raw value as integer when no match', () => {
        expect(parseValue('abc')).toEqual({
            prefix: '',
            currency: '',
            integer: 'abc',
            decimal: '',
        });
    });

    it('handles empty string', () => {
        expect(parseValue('')).toEqual({
            prefix: '',
            currency: '',
            integer: '',
            decimal: '',
        });
    });
});
