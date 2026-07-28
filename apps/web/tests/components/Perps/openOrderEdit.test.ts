import { describe, expect, it } from 'vitest';

import {
    isOpenOrderEditChanged,
    isValidOpenOrderEdit,
    normalizeOpenOrderEditInput,
} from '@/components/Perps/openOrderEdit.js';

describe('open order inline editing', () => {
    it('validates size against the market lot precision', () => {
        expect(isValidOpenOrderEdit('0.0322', 'size', 4)).toBe(true);
        expect(isValidOpenOrderEdit('0.03221', 'size', 4)).toBe(false);
        expect(isValidOpenOrderEdit('0', 'size', 4)).toBe(false);
    });

    it('validates price against the Hyperliquid tick size', () => {
        expect(isValidOpenOrderEdit('1918.1', 'price', 4)).toBe(true);
        expect(isValidOpenOrderEdit('1918.05', 'price', 4)).toBe(false);
    });

    it('normalizes localized decimal input', () => {
        expect(normalizeOpenOrderEditInput('0。02')).toBe('0.02');
    });

    it('only treats numerically different values as changed', () => {
        expect(isOpenOrderEditChanged('0.0322', '0.0322')).toBe(false);
        expect(isOpenOrderEditChanged('0.03220', '0.0322')).toBe(false);
        expect(isOpenOrderEditChanged('0.0323', '0.0322')).toBe(true);
    });
});
