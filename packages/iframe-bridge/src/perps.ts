export type PerpsOrderDirection = 'buy' | 'sell';
export type PerpsOrderType = 'market' | 'limit';
export type PerpsOrderEditField = 'size' | 'price';

export type PerpsIntent =
    | { kind: 'account' | 'deposit' | 'withdraw' }
    | { kind: 'place-order'; coin: string; direction: PerpsOrderDirection; orderType?: PerpsOrderType }
    | {
          kind: 'add-margin' | 'edit-tpsl' | 'market-close' | 'limit-close';
          coin: string;
          positionId: string;
      }
    | { kind: 'cancel-order'; coin: string; orderId: string }
    | { kind: 'modify-order'; coin: string; orderId: string; field: PerpsOrderEditField; value: string }
    | { kind: 'cancel-all' | 'close-all'; coin?: string };

export type PerpsMutationOperation = Exclude<PerpsIntent['kind'], 'account'>;
export type PerpsMutationStatus = 'success' | 'failed' | 'cancelled';

export interface PerpsMutationSettled {
    type: 'PERPS_MUTATION_SETTLED';
    operation: PerpsMutationOperation;
    status: PerpsMutationStatus;
    coin?: string;
    positionId?: string;
    orderId?: string;
    message?: string;
    partial?: boolean;
}

export interface PerpsDecodeError {
    code: 'invalid-intent' | 'invalid-result';
    message: string;
    recoverable: true;
}

export type PerpsDecodeResult<T> = { ok: true; value: T } | { ok: false; error: PerpsDecodeError };

const positionActions = new Set<PerpsIntent['kind']>(['add-margin', 'edit-tpsl', 'market-close', 'limit-close']);
const operations = new Set<PerpsMutationOperation>([
    'place-order',
    'add-margin',
    'edit-tpsl',
    'market-close',
    'limit-close',
    'cancel-order',
    'modify-order',
    'cancel-all',
    'close-all',
    'deposit',
    'withdraw',
]);

function failure(code: PerpsDecodeError['code'], message: string): PerpsDecodeResult<never> {
    return { ok: false, error: { code, message, recoverable: true } };
}

export function encodePerpsIntent(intent: PerpsIntent): string {
    const params = new URLSearchParams({ kind: intent.kind });
    if ('coin' in intent && intent.coin) params.set('coin', intent.coin);
    if ('direction' in intent) params.set('direction', intent.direction);
    if ('orderType' in intent && intent.orderType) params.set('orderType', intent.orderType);
    if ('positionId' in intent) params.set('positionId', intent.positionId);
    if ('orderId' in intent) params.set('orderId', intent.orderId);
    if ('field' in intent) params.set('field', intent.field);
    if ('value' in intent) params.set('value', intent.value);
    return params.toString();
}

export function decodePerpsIntent(value: string | URLSearchParams): PerpsDecodeResult<PerpsIntent> {
    const params =
        typeof value === 'string' ? new URLSearchParams(value.startsWith('?') ? value.slice(1) : value) : value;
    const kind = params.get('kind');
    if (kind === 'account' || kind === 'deposit' || kind === 'withdraw') return { ok: true, value: { kind } };

    const coin = params.get('coin') || '';
    if (kind === 'place-order') {
        const direction = params.get('direction');
        const orderType = params.get('orderType');
        if (!coin || (direction !== 'buy' && direction !== 'sell')) {
            return failure('invalid-intent', 'Order intents require a coin and direction.');
        }
        if (orderType && orderType !== 'market' && orderType !== 'limit') {
            return failure('invalid-intent', 'The order type is not supported.');
        }
        return {
            ok: true,
            value: { kind, coin, direction, ...(orderType ? { orderType: orderType as PerpsOrderType } : {}) },
        };
    }

    if (kind && positionActions.has(kind as PerpsIntent['kind'])) {
        const positionId = params.get('positionId') || '';
        if (!coin || !positionId) return failure('invalid-intent', 'Position actions require a stable target.');
        return { ok: true, value: { kind: kind as 'add-margin', coin, positionId } };
    }

    if (kind === 'cancel-order' || kind === 'modify-order') {
        const orderId = params.get('orderId') || '';
        if (!coin || !orderId) return failure('invalid-intent', 'Order actions require a stable target.');
        if (kind === 'modify-order') {
            const field = params.get('field');
            const value = params.get('value') || '';
            if ((field !== 'size' && field !== 'price') || !value) {
                return failure('invalid-intent', 'Modify order actions require a field and value.');
            }
            return { ok: true, value: { kind, coin, orderId, field, value } };
        }
        return { ok: true, value: { kind, coin, orderId } };
    }

    if (kind === 'cancel-all' || kind === 'close-all') {
        return { ok: true, value: { kind, ...(coin ? { coin } : {}) } };
    }

    return failure('invalid-intent', 'The Perpetuals destination is not supported.');
}

export function decodePerpsMutationSettled(value: unknown): PerpsDecodeResult<PerpsMutationSettled> {
    if (!value || typeof value !== 'object') return failure('invalid-result', 'The mutation result is invalid.');
    const candidate = value as Partial<PerpsMutationSettled>;
    if (
        candidate.type !== 'PERPS_MUTATION_SETTLED' ||
        !candidate.operation ||
        !operations.has(candidate.operation) ||
        !candidate.status ||
        !['success', 'failed', 'cancelled'].includes(candidate.status) ||
        (candidate.partial !== undefined && typeof candidate.partial !== 'boolean')
    ) {
        return failure('invalid-result', 'The mutation result is invalid.');
    }
    return { ok: true, value: candidate as PerpsMutationSettled };
}

export function toPerpsWalletPath(intent: PerpsIntent): string {
    const encoded = encodePerpsIntent(intent);
    switch (intent.kind) {
        case 'account':
            return '/perps';
        case 'deposit':
            return '/perps/deposit';
        case 'withdraw':
            return '/perps/withdraw';
        default:
            return `/perps?${encoded}`;
    }
}
