'use client';

import { useEffect } from 'react';

import { TelemetryProvider } from '@/providers/telemetry/index.js';
import type { EventId } from '@/providers/types/Telemetry.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

// Events that can be sent from wallet iframe
type WalletTelemetryEvent =
    | EventId.EVENT_SWAP_SUBMIT
    | EventId.EVENT_SWAP_SUCCESS
    | EventId.EVENT_BRIDGE_SUBMIT
    | EventId.EVENT_BRIDGE_SUCCESS
    | EventId.EVENT_SWAP_SKIP_REVIEWS_DISABLE
    | EventId.EVENT_SWAP_CUSTOM_SLIPPAGE
    | EventId.FIREFLY_WALLET_RECEIVE_CLICK
    | EventId.FIREFLY_WALLET_SEND_CLICK
    | EventId.FIREFLY_WALLET_SWAP_CLICK
    | EventId.FIREFLY_WALLET_TOKENS_TAB_CLICK
    | EventId.FIREFLY_WALLET_TRANSACTIONS_TAB_CLICK
    | EventId.FIREFLY_WALLET_SEND_SUCCESS
    | EventId.FIREFLY_WALLET_TRANSACTION_CALL
    | EventId.FIREFLY_WALLET_TRANSACTION_SUBMIT_SUCCESS
    | EventId.FIREFLY_WALLET_SEND_RECIPIENT_SELECT
    | EventId.FIREFLY_WALLET_SEND_RECIPIENT_CHANGE_WALLET_CLICK
    | EventId.FIREFLY_WALLET_SEND_RECIPIENT_WALLET_CHANGE;

interface WalletTelemetryEventData {
    event: WalletTelemetryEvent;
    [key: string]: unknown;
}

export function useWalletTelemetrySubscriber() {
    const subscribeToWalletEvents = useGlobalState((state) => state.subscribeToWalletEvents);

    useEffect(() => {
        const unsubscribe = subscribeToWalletEvents('wallet-telemetry', (data) => {
            const { event, ...params } = data as WalletTelemetryEventData;
            TelemetryProvider.captureEventInSafe(event, params);
        });
        return unsubscribe;
    }, [subscribeToWalletEvents]);
}
