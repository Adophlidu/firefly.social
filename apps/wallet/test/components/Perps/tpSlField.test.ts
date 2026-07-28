import { convertTpSlGainMethod, tpSlGainToPrice, tpSlPriceToGain } from '@dimensiondev/perps-core';
import { describe, expect, it } from 'vitest';

import {
    resolveTpSlDisplays,
    resolveTpSlMethodToggle,
    type TpSlFieldContext,
} from '@/components/Perps/useTpSlField.js';

const context: TpSlFieldContext = {
    isTp: true,
    isLong: true,
    entryPrice: '100',
    leverage: 10,
    size: '1',
    szDecimals: 2,
};

describe('TP/SL field state machine', () => {
    it('shows a price-anchored price verbatim and derives the gain', () => {
        const { priceDisplay, gainDisplay } = resolveTpSlDisplays(
            { price: '120', gain: '', anchor: 'price', method: 'usd' },
            context,
        );
        expect(priceDisplay).toBe('120');
        expect(gainDisplay).toBe(
            tpSlPriceToGain({
                price: '120',
                method: 'usd',
                entryPrice: '100',
                isLong: true,
                isTp: true,
                leverage: 10,
                size: '1',
            }),
        );
    });

    it('shows a gain-anchored gain verbatim and derives the price', () => {
        const { priceDisplay, gainDisplay } = resolveTpSlDisplays(
            { price: '', gain: '50', anchor: 'gain', method: 'usd' },
            context,
        );
        expect(gainDisplay).toBe('50');
        expect(priceDisplay).toBe(
            tpSlGainToPrice({
                gain: '50',
                method: 'usd',
                entryPrice: '100',
                isLong: true,
                isTp: true,
                leverage: 10,
                size: '1',
                szDecimals: 2,
            }),
        );
    });

    it('re-derives the price against a moving entry when gain-anchored', () => {
        const field = { price: '', gain: '50', anchor: 'gain' as const, method: 'usd' as const };
        const near = resolveTpSlDisplays(field, { ...context, entryPrice: '100' }).priceDisplay;
        const far = resolveTpSlDisplays(field, { ...context, entryPrice: '110' }).priceDisplay;
        expect(near).not.toBe(far);
        expect(far).toBe(
            tpSlGainToPrice({
                gain: '50',
                method: 'usd',
                entryPrice: '110',
                isLong: true,
                isTp: true,
                leverage: 10,
                size: '1',
                szDecimals: 2,
            }),
        );
    });

    it('leaves a price-anchored gain untouched when the unit toggles', () => {
        expect(resolveTpSlMethodToggle({ gain: 'stale', anchor: 'price', method: 'usd' }, context)).toEqual({
            method: 'ratio',
            gain: 'stale',
        });
    });

    it('converts a gain-anchored gain into the new unit', () => {
        expect(resolveTpSlMethodToggle({ gain: '50', anchor: 'gain', method: 'usd' }, context)).toEqual({
            method: 'ratio',
            gain: convertTpSlGainMethod({
                gain: '50',
                fromMethod: 'usd',
                toMethod: 'ratio',
                entryPrice: '100',
                isTp: true,
                leverage: 10,
                size: '1',
                szDecimals: 2,
            }),
        });
    });
});
