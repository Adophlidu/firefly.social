import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';

export enum WalletTelemetryEventId {
    SWAP_SUBMIT = 'swap_submit',
    SWAP_SUCCESS = 'swap_success',
    BRIDGE_SUBMIT = 'bridge_submit',
    BRIDGE_SUCCESS = 'bridge_success',
    SWAP_SKIP_REVIEWS_DISABLE = 'swap_skip_reviews_disable',
    SWAP_CUSTOM_SLIPPAGE = 'swap_custom_slippage',
}

export function captureWalletTelemetryEvent(event: WalletTelemetryEventId, params: Record<string, unknown>) {
    iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NOTIFY, {
        type: 'wallet-telemetry',
        data: { event, ...params },
    });
}
