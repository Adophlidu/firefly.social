import { describe, expect, it } from 'vitest';

import { buildPerpsPositionTpsl } from '@/components/Perps/buildPerpsPositionTpsl.js';

describe('buildPerpsPositionTpsl', () => {
    it('builds position-level take-profit and stop-loss orders for a long position', () => {
        const request = buildPerpsPositionTpsl({
            asset: 1,
            isLong: true,
            markPrice: '1918',
            szDecimals: 4,
            tpPrice: '2000',
            slPrice: '1800',
        });

        expect(request.grouping).toBe('positionTpsl');
        expect(request.orders).toHaveLength(2);
        expect(request.orders).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    a: 1,
                    b: false,
                    s: '0',
                    r: true,
                    t: { trigger: { isMarket: true, tpsl: 'tp', triggerPx: '2000' } },
                }),
                expect.objectContaining({
                    a: 1,
                    b: false,
                    s: '0',
                    r: true,
                    t: { trigger: { isMarket: true, tpsl: 'sl', triggerPx: '1800' } },
                }),
            ]),
        );
    });

    it('rejects a take-profit price on the wrong side of the mark price', () => {
        expect(() =>
            buildPerpsPositionTpsl({
                asset: 1,
                isLong: true,
                markPrice: '1918',
                szDecimals: 4,
                tpPrice: '1900',
            }),
        ).toThrow('Take profit must be above mark price.');
    });
});
