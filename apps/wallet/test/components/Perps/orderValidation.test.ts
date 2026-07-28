import { describe, expect, it } from 'vitest';

import { validatePerpsOrder } from '@/components/Perps/validatePerpsOrder.js';

const validOrder = {
    coin: 'BTC-USDC',
    direction: 'buy' as const,
    marginMode: 'cross' as const,
    leverage: 5,
    orderType: 'market' as const,
    size: '0.01',
    sizeUnit: 'coin' as const,
    reduceOnly: false,
};

describe('Perpetuals order validation contract', () => {
    const marketConstraints = {
        minimumSize: '0.001',
        minimumLeverage: 1,
        maximumLeverage: 50,
        supportsTakeProfitStopLoss: true,
    };

    it('accepts both margin modes and both size units under runtime market constraints', () => {
        expect(validatePerpsOrder(validOrder, marketConstraints)).toEqual({ ok: true }); // ASSERTION (frozen)
        expect(validatePerpsOrder({ ...validOrder, marginMode: 'isolated' }, marketConstraints)).toEqual({ ok: true }); // ASSERTION (frozen)
        expect(validatePerpsOrder({ ...validOrder, size: '500', sizeUnit: 'usdc' }, marketConstraints)).toEqual({
            ok: true,
        }); // ASSERTION (frozen)
    });

    it('uses runtime constraints for minimum size and leverage bounds', () => {
        expect(validatePerpsOrder({ ...validOrder, size: '0.0009' }, marketConstraints)).toMatchObject({
            ok: false,
            issues: [{ code: 'below-minimum-size' }],
        }); // ASSERTION (frozen)
        expect(validatePerpsOrder({ ...validOrder, leverage: 51 }, marketConstraints)).toMatchObject({
            ok: false,
            issues: [{ code: 'leverage-out-of-range' }],
        }); // ASSERTION (frozen)
    });

    it('requires a limit price for limit orders and accepts TP/SL when the market supports it', () => {
        expect(validatePerpsOrder({ ...validOrder, orderType: 'limit' }, marketConstraints)).toMatchObject({
            ok: false,
            issues: [{ code: 'limit-price-required' }],
        }); // ASSERTION (frozen)
        expect(
            validatePerpsOrder({ ...validOrder, takeProfitPrice: '70000', stopLossPrice: '60000' }, marketConstraints),
        ).toEqual({ ok: true }); // ASSERTION (frozen)
    });

    it('rejects Reduce Only size beyond the selected position', () => {
        expect(
            validatePerpsOrder(
                {
                    ...validOrder,
                    direction: 'sell',
                    reduceOnly: true,
                    size: '1.1',
                    availablePositionSize: '1',
                },
                marketConstraints,
            ),
        ).toMatchObject({ ok: false, issues: [{ code: 'reduce-only-size-exceeded' }] }); // ASSERTION (frozen)
    });
});
