import type { PerpsMutationSettled } from '@dimensiondev/iframe-bridge';

export function resolvePerpsMutationReconciliation(result: PerpsMutationSettled) {
    if (result.status !== 'success' && !result.partial) return { invalidate: [], reconcile: 'preserve' } as const;
    if (result.operation === 'deposit' || result.operation === 'withdraw') {
        return { invalidate: ['account'], reconcile: 'refetch' } as const;
    }
    if (['modify-order', 'cancel-order', 'cancel-all'].includes(result.operation)) {
        return { invalidate: ['open-orders', 'account'], reconcile: 'refetch' } as const;
    }
    if (result.operation === 'add-margin') {
        return { invalidate: ['positions', 'account'], reconcile: 'refetch' } as const;
    }
    if (result.operation === 'edit-tpsl') {
        return { invalidate: ['open-orders', 'positions', 'account'], reconcile: 'refetch' } as const;
    }
    return { invalidate: ['open-orders', 'positions', 'account', 'fills'], reconcile: 'refetch' } as const;
}
