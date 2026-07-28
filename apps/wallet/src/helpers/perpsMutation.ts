import {
    decodePerpsIntent,
    IframeBridgeMethod,
    iframeBridgeProvider,
    type PerpsMutationOperation,
    type PerpsMutationStatus,
} from '@dimensiondev/iframe-bridge';

export function publishPerpsMutation(
    operation: PerpsMutationOperation,
    status: PerpsMutationStatus,
    details: { coin?: string; positionId?: string; orderId?: string; message?: string; partial?: boolean } = {},
) {
    return iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NOTIFY, {
        type: 'PERPS_MUTATION_SETTLED',
        data: { type: 'PERPS_MUTATION_SETTLED', operation, status, ...details },
    });
}

export async function publishCurrentPerpsMutation(status: PerpsMutationStatus, message?: string) {
    const decoded = decodePerpsIntent(globalThis.location?.search || '');
    if (!decoded.ok || decoded.value.kind === 'account') return;
    const intent = decoded.value;
    await publishPerpsMutation(intent.kind as PerpsMutationOperation, status, {
        ...('coin' in intent ? { coin: intent.coin } : {}),
        ...('positionId' in intent ? { positionId: intent.positionId } : {}),
        ...('orderId' in intent ? { orderId: intent.orderId } : {}),
        ...(message ? { message } : {}),
    });
}
