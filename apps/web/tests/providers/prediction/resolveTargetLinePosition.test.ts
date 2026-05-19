import { describe, expect, it } from 'vitest';

import { resolveTargetLinePosition } from '@/providers/prediction/resolveTargetLinePosition.js';

describe('resolveTargetLinePosition', () => {
    const ticks = [630, 632, 634, 636, 638, 640];

    it('returns none when target is within tick range', () => {
        expect(resolveTargetLinePosition({ priceToBeat: 636.5, ticks })).toEqual({
            clamp: 'none',
            displayValue: 636.5,
        });
    });

    it('pins to max tick when target is above range', () => {
        expect(
            resolveTargetLinePosition({ priceToBeat: 2131.5, ticks: [2130.4, 2130.6, 2130.8, 2131, 2131.2] }),
        ).toEqual({
            clamp: 'above',
            displayValue: 2131.2,
        });
    });

    it('pins to min tick when target is below range', () => {
        expect(resolveTargetLinePosition({ priceToBeat: 629, ticks })).toEqual({
            clamp: 'below',
            displayValue: 630,
        });
    });

    it('treats exact tick boundaries as in range', () => {
        expect(resolveTargetLinePosition({ priceToBeat: 630, ticks }).clamp).toBe('none');
        expect(resolveTargetLinePosition({ priceToBeat: 640, ticks }).clamp).toBe('none');
    });
});
