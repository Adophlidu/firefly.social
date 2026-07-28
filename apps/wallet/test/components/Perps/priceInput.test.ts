import { describe, expect, it } from 'vitest';

import { resolvePerpsPriceInput } from '@/components/Perps/resolvePerpsPriceInput.js';

describe('Perpetuals price input', () => {
    it('enforces the ETH five-significant-figure tick size', () => {
        expect(resolvePerpsPriceInput('1918.05', 4)).toBeNull();
        expect(resolvePerpsPriceInput('1918.1', 4)).toBe('1918.1');
        expect(resolvePerpsPriceInput('1918', 4)).toBe('1918');
    });

    it('normalizes decimal input before validation', () => {
        expect(resolvePerpsPriceInput('12。345', 2)).toBe('12.345');
        expect(resolvePerpsPriceInput('12.3456', 2)).toBeNull();
    });
});
