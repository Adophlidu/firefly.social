import type { PerpsIntent } from '@dimensiondev/iframe-bridge';

type ActionIntent = Exclude<PerpsIntent, { kind: 'account' | 'deposit' | 'withdraw' | 'place-order' }>;

interface Input {
    intent: ActionIntent;
    hasPosition: boolean;
    hasOrder: boolean;
    isAccountLoading: boolean;
    isOrdersLoading: boolean;
    isMarketsLoading: boolean;
}

export function getPerpsActionTargetStatus({
    intent,
    hasPosition,
    hasOrder,
    isAccountLoading,
    isOrdersLoading,
    isMarketsLoading,
}: Input): 'loading' | 'ready' | 'missing' {
    if ('positionId' in intent) {
        if (hasPosition) return 'ready';
        return isMarketsLoading || isAccountLoading ? 'loading' : 'missing';
    }
    if ('orderId' in intent) {
        if (hasOrder) return 'ready';
        return isMarketsLoading || isOrdersLoading ? 'loading' : 'missing';
    }
    if (intent.kind === 'cancel-all') {
        return isMarketsLoading || isOrdersLoading ? 'loading' : 'ready';
    }
    if (intent.kind === 'close-all') {
        return isMarketsLoading || isAccountLoading || isOrdersLoading ? 'loading' : 'ready';
    }
    return 'ready';
}
