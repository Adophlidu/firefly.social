import { runInSafeAsync } from '@dimensiondev/utils';

import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { type EventId, type Events } from '@/providers/types/Telemetry.js';

export function captureFireflyWalletEvent<
    E extends
        | EventId.FIREFLY_WALLET_OPEN_SUCCESS
        | EventId.FIREFLY_WALLET_RECEIVE_CLICK
        | EventId.FIREFLY_WALLET_SEND_CLICK
        | EventId.FIREFLY_WALLET_SWAP_CLICK
        | EventId.FIREFLY_WALLET_CHAIN_FILTER_CLICK
        | EventId.FIREFLY_WALLET_TOKENS_TAB_CLICK
        | EventId.FIREFLY_WALLET_NFTS_TAB_CLICK
        | EventId.FIREFLY_WALLET_TRANSACTIONS_TAB_CLICK
        | EventId.FIREFLY_WALLET_SEND_SUCCESS
        | EventId.FIREFLY_WALLET_TXN_CALL
        | EventId.FIREFLY_WALLET_GENERAL_TRANSACTION_SUBMIT
        | EventId.FIREFLY_WALLET_SEND_RECIPIENT_SELECT
        | EventId.FIREFLY_WALLET_SEND_RECIPIENT_CHANGE_WALLET_CLICK
        | EventId.FIREFLY_WALLET_SEND_RECIPIENT_WALLET_CHANGE,
>(eventId: E, params: Omit<Events[E]['parameters'], 'firefly_account_id'>) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(eventId, params as Events[E]['parameters']);
    });
}
