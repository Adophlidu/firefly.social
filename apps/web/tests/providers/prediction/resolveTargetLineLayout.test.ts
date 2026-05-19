import { describe, expect, it } from 'vitest';

import { resolveTargetLineLayout, TARGET_BADGE_HALF_HEIGHT } from '@/providers/prediction/resolveTargetLineLayout.js';

const plotTop = 8;
const plotHeight = 200;
const ticks = [100, 102, 104, 106, 108, 110];
const range = { min: 99, max: 111 };

function linearYScale(value: number): number {
    const { min, max } = range;
    return plotTop + ((max - value) / (max - min)) * plotHeight;
}

describe('resolveTargetLineLayout', () => {
    it('pins to top inset when target is above visible range', () => {
        const result = resolveTargetLineLayout({
            priceToBeat: 120,
            ticks,
            yScale: linearYScale,
            plotTop,
            plotHeight,
            range,
        });

        expect(result.clamp).toBe('above');
        expect(result.y).toBe(plotTop + TARGET_BADGE_HALF_HEIGHT);
    });

    it('pins to bottom inset when target is below visible range', () => {
        const result = resolveTargetLineLayout({
            priceToBeat: 90,
            ticks,
            yScale: linearYScale,
            plotTop,
            plotHeight,
            range,
        });

        expect(result.clamp).toBe('below');
        expect(result.y).toBe(plotTop + plotHeight - TARGET_BADGE_HALF_HEIGHT);
    });

    it('maps in-range target through yScale', () => {
        const priceToBeat = 105;
        const result = resolveTargetLineLayout({
            priceToBeat,
            ticks,
            yScale: linearYScale,
            plotTop,
            plotHeight,
            range,
        });

        expect(result.clamp).toBe('none');
        expect(result.y).toBeCloseTo(linearYScale(priceToBeat), 5);
    });
});
