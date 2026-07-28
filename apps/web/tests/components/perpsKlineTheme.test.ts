import { describe, expect, it } from 'vitest';

import { FIREFLY_DARK_KLINE_THEME, FIREFLY_LIGHT_KLINE_THEME } from '@/components/Perps/perpsKlineTheme.js';

describe('Perpetuals Kline theme', () => {
    it('matches the Firefly light palette', () => {
        expect(FIREFLY_LIGHT_KLINE_THEME).toMatchObject({
            background: '#ffffff',
            grid: '#f4f4f4',
            axisText: '#767676',
            upColor: '#3dc233',
            downColor: '#ff3545',
            drawingLine: '#4c4aa9',
        });
    });

    it('matches the Firefly dark palette', () => {
        expect(FIREFLY_DARK_KLINE_THEME).toMatchObject({
            background: '#030303',
            grid: 'rgba(255, 255, 255, 0.18)',
            axisText: 'rgba(255, 255, 255, 0.78)',
            upColor: '#3dc233',
            downColor: '#ff3545',
            drawingLine: '#ac9df6',
        });
    });
});
