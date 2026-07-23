import { describe, expect, it } from 'vitest';

import { calculateOrderLiquidationPrice, resolveEstimatedFillPrice } from '@/components/Perps/orderLiquidationPrice.js';

describe('calculateOrderLiquidationPrice', () => {
    it('uses full account equity instead of available-to-trade for cross margin', () => {
        const result = calculateOrderLiquidationPrice({
            isLong: true,
            isIsolated: false,
            entryPrice: '66049',
            size: '0.00015',
            leverage: 24,
            maxLeverage: 40,
            crossAccountValue: '8.9167640625',
        });

        expect(result?.toFixed(1)).toBe('6687.5');
    });

    it('updates the estimate when the live account equity changes', () => {
        const result = calculateOrderLiquidationPrice({
            isLong: true,
            isIsolated: false,
            entryPrice: '66049',
            size: '0.00015',
            leverage: 24,
            maxLeverage: 40,
            crossAccountValue: '8.9248665',
        });

        expect(result?.toFixed(1)).toBe('6632.8');
    });

    it('uses the mark price for a marketable limit order', () => {
        const entryPrice = resolveEstimatedFillPrice({
            direction: 'buy',
            limitPrice: '66049',
            markPrice: '65866.96375',
        });
        const result = calculateOrderLiquidationPrice({
            isLong: true,
            isIsolated: false,
            entryPrice,
            size: '0.00015',
            leverage: 24,
            maxLeverage: 40,
            crossAccountValue: '8.910759',
        });

        expect(result?.toFixed(1)).toBe('6543.7');
    });

    it('uses the limit price while an order rests on the book', () => {
        expect(
            resolveEstimatedFillPrice({
                direction: 'buy',
                limitPrice: '65000',
                markPrice: '65866',
            }),
        ).toBe('65000');
        expect(
            resolveEstimatedFillPrice({
                direction: 'sell',
                limitPrice: '67000',
                markPrice: '65866',
            }),
        ).toBe('67000');
    });

    it('does not estimate cross liquidation without account equity', () => {
        expect(
            calculateOrderLiquidationPrice({
                isLong: true,
                isIsolated: false,
                entryPrice: '66049',
                size: '0.00015',
                leverage: 24,
                maxLeverage: 40,
            }),
        ).toBeNull();
    });
});
