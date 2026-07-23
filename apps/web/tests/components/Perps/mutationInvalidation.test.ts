import { describe, expect, it } from 'vitest';

import { resolvePerpsMutationReconciliation } from '@/components/Perps/resolvePerpsMutationReconciliation.js';

describe('Perpetuals mutation query reconciliation contract', () => {
    it.each(['modify-order', 'cancel-order', 'cancel-all'] as const)(
        'invalidates open orders and account after successful %s',
        (operation) => {
            expect(
                resolvePerpsMutationReconciliation({
                    type: 'PERPS_MUTATION_SETTLED',
                    operation,
                    status: 'success',
                    coin: 'BTC-USDC',
                }),
            ).toEqual({ invalidate: ['open-orders', 'account'], reconcile: 'refetch' }); // ASSERTION (frozen)
        },
    );

    it('invalidates positions and account after successfully adding margin', () => {
        expect(
            resolvePerpsMutationReconciliation({
                type: 'PERPS_MUTATION_SETTLED',
                operation: 'add-margin',
                status: 'success',
                coin: 'ETH-USDC',
            }),
        ).toEqual({ invalidate: ['positions', 'account'], reconcile: 'refetch' }); // ASSERTION (frozen)
    });

    it('invalidates orders as well as positions after successfully editing TP/SL', () => {
        expect(
            resolvePerpsMutationReconciliation({
                type: 'PERPS_MUTATION_SETTLED',
                operation: 'edit-tpsl',
                status: 'success',
                coin: 'ETH-USDC',
            }),
        ).toEqual({ invalidate: ['open-orders', 'positions', 'account'], reconcile: 'refetch' }); // ASSERTION (frozen)
    });

    it.each(['place-order', 'market-close', 'limit-close', 'close-all'] as const)(
        'invalidates orders, positions, account, and fills after successful %s',
        (operation) => {
            expect(
                resolvePerpsMutationReconciliation({
                    type: 'PERPS_MUTATION_SETTLED',
                    operation,
                    status: 'success',
                    coin: 'ETH-USDC',
                }),
            ).toEqual({
                invalidate: ['open-orders', 'positions', 'account', 'fills'],
                reconcile: 'refetch',
            }); // ASSERTION (frozen)
        },
    );

    it.each(['failed', 'cancelled'] as const)(
        'preserves consistent web data without success invalidation after a %s mutation',
        (status) => {
            expect(
                resolvePerpsMutationReconciliation({
                    type: 'PERPS_MUTATION_SETTLED',
                    operation: 'place-order',
                    status,
                    coin: 'BTC-USDC',
                }),
            ).toEqual({ invalidate: [], reconcile: 'preserve' }); // ASSERTION (frozen)
        },
    );

    it('refetches all affected scopes after a partially successful close-all', () => {
        expect(
            resolvePerpsMutationReconciliation({
                type: 'PERPS_MUTATION_SETTLED',
                operation: 'close-all',
                status: 'failed',
                partial: true,
            }),
        ).toEqual({
            invalidate: ['open-orders', 'positions', 'account', 'fills'],
            reconcile: 'refetch',
        }); // ASSERTION (frozen)
    });
});
