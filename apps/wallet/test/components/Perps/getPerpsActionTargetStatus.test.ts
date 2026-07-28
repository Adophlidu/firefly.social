import { describe, expect, it } from 'vitest';

import { getPerpsActionTargetStatus } from '@/components/Perps/getPerpsActionTargetStatus.js';

const positionIntent = { kind: 'edit-tpsl', coin: 'ETH-USDC', positionId: 'ETH' } as const;
const orderIntent = { kind: 'cancel-order', coin: 'ETH-USDC', orderId: '1' } as const;

describe('getPerpsActionTargetStatus', () => {
    it('keeps a position action loading until account and market data settle', () => {
        expect(
            getPerpsActionTargetStatus({
                intent: positionIntent,
                hasPosition: false,
                hasOrder: false,
                isAccountLoading: true,
                isOrdersLoading: false,
                isMarketsLoading: false,
            }),
        ).toBe('loading');
        expect(
            getPerpsActionTargetStatus({
                intent: positionIntent,
                hasPosition: false,
                hasOrder: false,
                isAccountLoading: false,
                isOrdersLoading: false,
                isMarketsLoading: true,
            }),
        ).toBe('loading');
    });

    it('keeps an order action loading until order data settles', () => {
        expect(
            getPerpsActionTargetStatus({
                intent: orderIntent,
                hasPosition: false,
                hasOrder: false,
                isAccountLoading: false,
                isOrdersLoading: true,
                isMarketsLoading: false,
            }),
        ).toBe('loading');
    });

    it('reports a missing target only after loading finishes', () => {
        expect(
            getPerpsActionTargetStatus({
                intent: positionIntent,
                hasPosition: false,
                hasOrder: false,
                isAccountLoading: false,
                isOrdersLoading: false,
                isMarketsLoading: false,
            }),
        ).toBe('missing');
    });

    it('uses an available target immediately', () => {
        expect(
            getPerpsActionTargetStatus({
                intent: positionIntent,
                hasPosition: true,
                hasOrder: false,
                isAccountLoading: true,
                isOrdersLoading: false,
                isMarketsLoading: true,
            }),
        ).toBe('ready');
    });

    it('keeps cancel-all loading until order and market data settle', () => {
        expect(
            getPerpsActionTargetStatus({
                intent: { kind: 'cancel-all' },
                hasPosition: false,
                hasOrder: false,
                isAccountLoading: true,
                isOrdersLoading: false,
                isMarketsLoading: true,
            }),
        ).toBe('loading');
        expect(
            getPerpsActionTargetStatus({
                intent: { kind: 'cancel-all' },
                hasPosition: false,
                hasOrder: false,
                isAccountLoading: false,
                isOrdersLoading: true,
                isMarketsLoading: false,
            }),
        ).toBe('loading');
        expect(
            getPerpsActionTargetStatus({
                intent: { kind: 'cancel-all' },
                hasPosition: false,
                hasOrder: false,
                isAccountLoading: true,
                isOrdersLoading: false,
                isMarketsLoading: false,
            }),
        ).toBe('ready');
    });

    it('keeps close-all loading until account, order, and market data settle', () => {
        expect(
            getPerpsActionTargetStatus({
                intent: { kind: 'close-all' },
                hasPosition: false,
                hasOrder: false,
                isAccountLoading: true,
                isOrdersLoading: false,
                isMarketsLoading: false,
            }),
        ).toBe('loading');
        expect(
            getPerpsActionTargetStatus({
                intent: { kind: 'close-all' },
                hasPosition: false,
                hasOrder: false,
                isAccountLoading: false,
                isOrdersLoading: true,
                isMarketsLoading: false,
            }),
        ).toBe('loading');
        expect(
            getPerpsActionTargetStatus({
                intent: { kind: 'close-all' },
                hasPosition: false,
                hasOrder: false,
                isAccountLoading: false,
                isOrdersLoading: false,
                isMarketsLoading: true,
            }),
        ).toBe('loading');
        expect(
            getPerpsActionTargetStatus({
                intent: { kind: 'close-all' },
                hasPosition: false,
                hasOrder: false,
                isAccountLoading: false,
                isOrdersLoading: false,
                isMarketsLoading: false,
            }),
        ).toBe('ready');
    });
});
