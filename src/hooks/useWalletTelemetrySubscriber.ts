'use client';

import { useEffect } from 'react';

import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { type EventId } from '@/providers/types/Telemetry.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

// Events that can be sent from wallet iframe
type WalletTelemetryEvent =
    | EventId.EVENT_SWAP_SUBMIT
    | EventId.EVENT_SWAP_SUCCESS
    | EventId.EVENT_BRIDGE_SUBMIT
    | EventId.EVENT_BRIDGE_SUCCESS
    | EventId.EVENT_SWAP_SKIP_REVIEWS_DISABLE
    | EventId.EVENT_SWAP_CUSTOM_SLIPPAGE;

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
