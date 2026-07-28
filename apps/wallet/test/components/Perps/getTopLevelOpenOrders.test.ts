import type { FrontendOpenOrdersResponse } from '@nktkas/hyperliquid/api/info';
import { describe, expect, it } from 'vitest';

import { getTopLevelOpenOrders } from '@/components/Perps/getTopLevelOpenOrders.js';

function createOrder(oid: number, children: unknown[] = []) {
    return {
        coin: 'ETH',
        side: 'B',
        limitPx: '1824.1',
        sz: '0.0322',
        oid,
        timestamp: 1,
        origSz: '0.0322',
        triggerCondition: 'N/A',
        isTrigger: false,
        triggerPx: '0',
        children,
        isPositionTpsl: false,
        reduceOnly: false,
        orderType: 'Limit',
        tif: 'Gtc',
        cloid: null,
    } satisfies FrontendOpenOrdersResponse[number];
}

describe('getTopLevelOpenOrders', () => {
    it('excludes attached children from a cancel-all request', () => {
        const parent = createOrder(1, [{ oid: 2 }, { order: { oid: 3 } }]);
        const takeProfit = createOrder(2);
        const stopLoss = createOrder(3);
        const independent = createOrder(4);

        expect(getTopLevelOpenOrders([parent, takeProfit, stopLoss, independent]).map((order) => order.oid)).toEqual([
            1, 4,
        ]);
    });

    it('keeps TP/SL orders whose parent is no longer open', () => {
        expect(getTopLevelOpenOrders([createOrder(2), createOrder(3)]).map((order) => order.oid)).toEqual([2, 3]);
    });
});
