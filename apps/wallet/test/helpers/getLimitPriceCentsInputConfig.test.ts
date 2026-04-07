import { describe, expect, it } from 'vitest';

import { getLimitPriceCentsInputConfig } from '@/helpers/getLimitPriceCentsInputConfig';

describe('getLimitPriceCentsInputConfig', () => {
    it('defaults to tick 0.01 (no decimals in cents input)', () => {
        expect(getLimitPriceCentsInputConfig(undefined)).toEqual({
            maxDecimals: 0,
            step: '1',
            max: '99',
        });
    });

    it('derives cents maxDecimals from orderPriceMinTickSize decimals (n -> n-2)', () => {
        expect(getLimitPriceCentsInputConfig(0.01).maxDecimals).toBe(0);
        expect(getLimitPriceCentsInputConfig(0.001).maxDecimals).toBe(1);
        expect(getLimitPriceCentsInputConfig(0.0001).maxDecimals).toBe(2);
    });

    it('keeps step fixed to 1¢ regardless of tick size', () => {
        expect(getLimitPriceCentsInputConfig(0.01).step).toBe('1');
        expect(getLimitPriceCentsInputConfig(0.001).step).toBe('1');
        expect(getLimitPriceCentsInputConfig(0.0001).step).toBe('1');
    });

    it('sets max to be strictly below 100¢ based on maxDecimals', () => {
        expect(getLimitPriceCentsInputConfig(0.01).max).toBe('99');
        expect(getLimitPriceCentsInputConfig(0.001).max).toBe('99.9');
        expect(getLimitPriceCentsInputConfig(0.0001).max).toBe('99.99');
    });
});
