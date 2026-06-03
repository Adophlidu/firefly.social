import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';

export enum WalletTelemetryEventId {
    // swap/bridge
    SWAP_SUBMIT = 'swap_submit',
    SWAP_SUCCESS = 'swap_success',
    BRIDGE_SUBMIT = 'bridge_submit',
    BRIDGE_SUCCESS = 'bridge_success',
    SWAP_SKIP_REVIEWS_DISABLE = 'swap_skip_reviews_disable',
    SWAP_CUSTOM_SLIPPAGE = 'swap_custom_slippage',

    // wallet click events
    WALLET_RECEIVE_CLICK = 'Firefly_wallet_receive_click',
    WALLET_SEND_CLICK = 'Firefly_wallet_send_click',
    WALLET_SWAP_CLICK = 'Firefly_wallet_swap_click',
    WALLET_TOKENS_TAB_CLICK = 'Firefly_wallet_tokens_tab_click',
    WALLET_TRANSACTIONS_TAB_CLICK = 'Firefly_wallet_transactions_tab_click',

    // wallet transaction events
    WALLET_SEND_SUCCESS = 'Firefly_wallet_send_success',
    WALLET_TRANSACTION_CALL = 'Firefly_wallet_transaction_call',
    WALLET_TRANSACTION_SUBMIT_SUCCESS = 'Firefly_wallet_transaction_submit_success',

    // recipient events
    WALLET_SEND_RECIPIENT_SELECT = 'Firefly_wallet_send_recipient_select',
    WALLET_SEND_RECIPIENT_CHANGE_WALLET_CLICK = 'Firefly_wallet_send_recipient_change_wallet_click',
    WALLET_SEND_RECIPIENT_WALLET_CHANGE = 'Firefly_wallet_send_recipient_wallet_change',
}

export function captureWalletTelemetryEvent(event: WalletTelemetryEventId, params: Record<string, unknown>) {
    iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NOTIFY, {
        type: 'wallet-telemetry',
        data: { event, ...params },
    });
}
