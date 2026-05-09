import { describe, expect, it } from 'vitest';

import {
    normalizePriceInput,
    validatePerpsPriceInput,
    validateSpotPriceInput,
} from '../../../../packages/rn-ui/src/helpers/perpsPriceValidation';

describe('perpsPriceValidation', () => {
    it('normalizes Chinese dot to decimal dot', () => {
        expect(normalizePriceInput('12。34')).toBe('12.34');
    });

    it('rejects leading zero integer forms but keeps 0.x valid', () => {
        expect(validatePerpsPriceInput('01', 2)).toBe(false);
        expect(validatePerpsPriceInput('0.1', 2)).toBe(true);
        expect(validatePerpsPriceInput('0.', 2)).toBe(true);
    });

    it('enforces perps max decimals based on szDecimals', () => {
        // max fractional digits: min(6 - szDecimals, 6) => 4 when szDecimals = 2
        expect(validatePerpsPriceInput('12.123', 2)).toBe(true);
        expect(validatePerpsPriceInput('12.1234', 2)).toBe(false); // 2 + 4 sig-figure chars > 5
        expect(validatePerpsPriceInput('12.12345', 2)).toBe(false); // 5 fractional digits > 4
    });

    it('enforces five significant figures for perps prices', () => {
        expect(validatePerpsPriceInput('12345', 2)).toBe(true);
        expect(validatePerpsPriceInput('12345.1', 2)).toBe(false);
        expect(validatePerpsPriceInput('12.345', 2)).toBe(true);
        expect(validatePerpsPriceInput('12.3456', 2)).toBe(false);
    });

    it('handles low prices with leading decimal zeros under HL rules', () => {
        // szDecimals 2 => at most 4 fractional digits; trailing sig digits after leading zeros
        expect(validatePerpsPriceInput('0.0012', 2)).toBe(true);
        expect(validatePerpsPriceInput('0.00012', 2)).toBe(false); // 5 fractional digits
        // szDecimals 0 => up to 6 fractional digits
        expect(validatePerpsPriceInput('0.000123', 0)).toBe(true);
        expect(validatePerpsPriceInput('0.0001234', 0)).toBe(false); // 7 fractional digits
    });

    it('enforces spot max decimals with spot limit', () => {
        // spot max decimals: 8 - 3 = 5; also intLen + decLen <= 5
        expect(validateSpotPriceInput('1.1234', 3)).toBe(true);
        expect(validateSpotPriceInput('1.12345', 3)).toBe(false); // 1 + 5 significant chars > 5
        expect(validateSpotPriceInput('1.123456', 3)).toBe(false); // 6 fractional digits > 5
    });
});
