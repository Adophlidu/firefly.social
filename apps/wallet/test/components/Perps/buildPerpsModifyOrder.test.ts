import type { FrontendOpenOrdersResponse } from '@nktkas/hyperliquid/api/info';
import { describe, expect, it } from 'vitest';

import { buildPerpsModifyOrder } from '@/components/Perps/buildPerpsModifyOrder.js';

const limitOrder = {
    coin: 'ETH',
    side: 'B',
    limitPx: '1814.1',
    sz: '0.0322',
    oid: 7,
    timestamp: 0,
    origSz: '0.0322',
    triggerCondition: 'N/A',
    isTrigger: false,
    triggerPx: '0',
    children: [],
    isPositionTpsl: false,
    reduceOnly: false,
    orderType: 'Limit',
    tif: 'Gtc',
    cloid: null,
} satisfies FrontendOpenOrdersResponse[number];

describe('buildPerpsModifyOrder', () => {
    it('changes only the remaining size for a limit order', () => {
        expect(
            buildPerpsModifyOrder({ order: limitOrder, asset: 1, szDecimals: 4, field: 'size', value: '0.02' }),
        ).toEqual({
            oid: 7,
            order: { a: 1, b: true, p: '1814.1', s: '0.02', r: false, t: { limit: { tif: 'Gtc' } } },
        });
    });

    it('changes only the price and enforces the market tick size', () => {
        expect(
            buildPerpsModifyOrder({ order: limitOrder, asset: 1, szDecimals: 4, field: 'price', value: '1918.1' }),
        ).toMatchObject({ order: { p: '1918.1', s: '0.0322' } });
        expect(() =>
            buildPerpsModifyOrder({ order: limitOrder, asset: 1, szDecimals: 4, field: 'price', value: '1918.05' }),
        ).toThrow('Enter a valid order price.');
    });

    it('preserves trigger order parameters when changing its size', () => {
        const triggerOrder = {
            ...limitOrder,
            side: 'A' as const,
            limitPx: '1800',
            triggerPx: '1809.5',
            isTrigger: true,
            reduceOnly: true,
            orderType: 'Stop Market' as const,
            tif: null,
        };

        expect(
            buildPerpsModifyOrder({ order: triggerOrder, asset: 1, szDecimals: 4, field: 'size', value: '0.01' }),
        ).toMatchObject({
            order: {
                b: false,
                p: '1800',
                s: '0.01',
                r: true,
                t: { trigger: { isMarket: true, triggerPx: '1809.5', tpsl: 'sl' } },
            },
        });
    });

    it('rejects changing the size of a full-position TP/SL order', () => {
        const positionTpslOrder = {
            ...limitOrder,
            side: 'A' as const,
            limitPx: '1800',
            sz: '0',
            origSz: '0',
            triggerPx: '1809.5',
            isTrigger: true,
            isPositionTpsl: true,
            reduceOnly: true,
            orderType: 'Stop Market' as const,
            tif: null,
        };

        expect(() =>
            buildPerpsModifyOrder({
                order: positionTpslOrder,
                asset: 1,
                szDecimals: 4,
                field: 'size',
                value: '0.01',
            }),
        ).toThrow('Close-position TP/SL size cannot be modified.');
    });
});
