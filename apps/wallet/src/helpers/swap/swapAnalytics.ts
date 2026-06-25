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

    // bets/predict events
    BETS_ACCOUNT_OPEN_SUCCESS = 'bets_account_open_success',
    BETS_ADD_FUNDS_OPEN_SUCCESS = 'bets_add_funds_open_success',
    BETS_ADD_FUNDS_CLICK = 'bets_add_funds_click',
    BETS_WITHDRAW_FUNDS_OPEN_SUCCESS = 'bets_withdraw_funds_open_success',
    BETS_WITHDRAW_FUNDS_CLICK = 'bets_withdraw_funds_click',
    BETS_POSITIONS_LIST_OPEN_SUCCESS = 'bets_positions_list_open_success',
    BETS_ORDERS_LIST_OPEN_SUCCESS = 'bets_orders_list_open_success',
    BETS_ORDER_CANCEL_CLICK = 'bets_order_cancel_click',
    BETS_ORDER_CANCEL_CONFIRM_CLICK = 'bets_order_cancel_confirm_click',
    BETS_POSITION_CLOSE_OPEN_SUCCESS = 'bets_position_close_open_success',
    BETS_POSITION_CLOSE_CLICK = 'bets_position_close_click',
    BETS_CLAIM_PROCEEDS_OPEN_SUCCESS = 'bets_claim_proceeds_open_success',
    BETS_CLAIM_PROCEEDS_CLICK = 'bets_claim_proceeds_click',
    BETS_EXPLORE_BETS_OPEN_SUCCESS = 'bets_explore_bets_open_success',
    BETS_RECENT_ACTIVITY_OPEN_SUCCESS = 'bets_recent_activity_open_success',
    BETS_MARKET_BUY_OPEN_SUCCESS = 'bets_market_buy_open_success',
    BETS_MARKET_BUY_CLICK = 'bets_market_buy_click',
    BETS_MARKET_ORDER_TYPE_CHANGE_CLICK = 'bets_market_order_type_change_click',
    BETS_MARKET_QUICK_BUY_OPEN_SUCCESS = 'bets_market_quick_buy_open_success',
    BETS_MARKET_QUICK_BUY_CONFIRM_CLICK = 'bets_market_quick_buy_confirm_click',
    BETS_POSITION_SELL_OPEN_SUCCESS = 'bets_position_sell_open_success',
    BETS_POSITION_SELL_CLICK = 'bets_position_sell_click',
    BETS_VIEW_PRIVATE_KEY_PANEL_OPEN = 'bets_view_private_key_panel_open',
    BETS_SHOW_PRIVATE_KEY = 'bets_show_private_key',
    BETS_PRIVATE_KEY_COPY_CLICK = 'bets_private_key_copy_click',
    BETS_DEPOSIT_VIA_CRYPTO_CLICK = 'bets_deposit_via_crypto_click',
    BETS_DEPOSIT_VIA_CRYPTO_CHANGE_CHAIN = 'bets_deposit_via_crypto_change_chain',
    BETS_DEPOSIT_VIA_CRYPTO_CHANGE_TOKEN = 'bets_deposit_via_crypto_change_token',
}

export function captureWalletTelemetryEvent(event: WalletTelemetryEventId, params: Record<string, unknown>) {
    iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NOTIFY, {
        type: 'wallet-telemetry',
        data: { event, ...params },
    });
}
