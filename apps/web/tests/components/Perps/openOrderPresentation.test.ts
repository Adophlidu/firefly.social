import { describe, expect, it } from 'vitest';

import { getOpenOrderChildIds, getOpenOrderPresentation } from '@/components/Perps/openOrderPresentation.js';

describe('open order presentation', () => {
    it('presents a stop-market order as a market close-long trigger', () => {
        expect(
            getOpenOrderPresentation({
                side: 'A',
                limitPx: '59800',
                sz: '0.00107',
                origSz: '0.00107',
                triggerPx: '65000',
                reduceOnly: true,
                orderType: 'Stop Market',
            }),
        ).toEqual({
            direction: 'close-long',
            isClosePosition: false,
            canEditSize: true,
            filled: 0,
            value: undefined,
            price: undefined,
            takeProfit: undefined,
            stopLoss: '65000',
        });
    });

    it('presents a full-position TP/SL as a non-editable close-position order', () => {
        expect(
            getOpenOrderPresentation({
                side: 'A',
                limitPx: '1750',
                sz: '0',
                origSz: '0',
                triggerPx: '1800',
                isPositionTpsl: true,
                reduceOnly: true,
                orderType: 'Stop Market',
            }),
        ).toEqual({
            direction: 'close-long',
            isClosePosition: true,
            canEditSize: false,
            filled: undefined,
            value: undefined,
            price: undefined,
            takeProfit: undefined,
            stopLoss: '1800',
        });
    });

    it('presents a take-profit-market order without exposing its protection limit price', () => {
        expect(
            getOpenOrderPresentation({
                side: 'A',
                limitPx: '62560',
                sz: '0.00107',
                origSz: '0.00107',
                triggerPx: '68000',
                reduceOnly: true,
                orderType: 'Take Profit Market',
            }),
        ).toMatchObject({
            direction: 'close-long',
            value: undefined,
            price: undefined,
            takeProfit: '68000',
        });
    });

    it('uses the original size and limit price for a limit order value', () => {
        expect(
            getOpenOrderPresentation({
                side: 'B',
                limitPx: '65281',
                sz: '0.0007',
                origSz: '0.00107',
                triggerPx: '0',
                reduceOnly: false,
                orderType: 'Limit',
            }),
        ).toMatchObject({
            direction: 'long',
            filled: 0.00037,
            value: 69.85067,
            price: '65281',
        });
    });

    it('shows attached take-profit and stop-loss prices on the parent order', () => {
        const order = {
            oid: 1,
            side: 'B' as const,
            limitPx: '1824.1',
            sz: '0.0322',
            origSz: '0.0322',
            triggerPx: '0',
            reduceOnly: false,
            orderType: 'Limit' as const,
            children: [
                { oid: 2, orderType: 'Take Profit Market', triggerPx: '1918.6' },
                { order: { oid: 3, orderType: 'Stop Market', triggerPx: '1809.5' } },
            ],
        };

        expect(getOpenOrderPresentation(order)).toMatchObject({
            takeProfit: '1918.6',
            stopLoss: '1809.5',
        });
        expect(getOpenOrderChildIds(order)).toEqual([2, 3]);
    });

    it('does not repeat TP/SL on an attached child order row', () => {
        expect(
            getOpenOrderPresentation(
                {
                    oid: 2,
                    side: 'A',
                    limitPx: '0',
                    sz: '0.0322',
                    origSz: '0.0322',
                    triggerPx: '1918.6',
                    reduceOnly: true,
                    orderType: 'Take Profit Market',
                },
                { isAttachedChild: true },
            ),
        ).toMatchObject({
            takeProfit: undefined,
            stopLoss: undefined,
        });
    });
});
