import { useCallback, useEffect, useRef, useState } from 'react';

import type { TronDepositTransaction, TronDepositTransactionStatus } from '@/providers/types/Firefly.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export interface TronDepositStatusState {
    isPolling: boolean;
    latestTransaction: TronDepositTransaction | null;
    status: TronDepositTransactionStatus | null;
}

const POLL_INTERVAL_MS = 5000;

const KNOWN_STATUSES = new Set<TronDepositTransactionStatus>([
    'deposit_detected',
    'processing',
    'origin_tx_confirmed',
    'submitted',
    'completed',
    'failed',
]);

/**
 * The bridge emits statuses in UPPERCASE (e.g. `DEPOSIT_DETECTED`, `COMPLETED`).
 * Normalize to the lowercase union the app compares against; treat anything
 * unexpected as a safe intermediate (`processing`) so toasts still fire and
 * polling continues until a real terminal status arrives.
 */
function normalizeStatus(raw: string): TronDepositTransactionStatus {
    const value = raw.toLowerCase() as TronDepositTransactionStatus;
    return KNOWN_STATUSES.has(value) ? value : 'processing';
}

function isTerminalStatus(status: TronDepositTransactionStatus): boolean {
    return status === 'completed' || status === 'failed';
}

function isSameTransaction(a: TronDepositTransaction | null, b: TronDepositTransaction): boolean {
    return a?.status === b.status && a?.tx_hash === b.tx_hash && a?.created_time_ms === b.created_time_ms;
}

export function useTronDepositStatusPolling(address: string | null) {
    const [state, setState] = useState<TronDepositStatusState>({
        isPolling: false,
        latestTransaction: null,
        status: null,
    });

    const baselineCountRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setState((prev) => ({ ...prev, isPolling: false }));
    }, []);

    const poll = useCallback(async () => {
        if (!address) return;

        try {
            const result = await getFireflyEndpoint().getPolymarketDepositStatus(address);
            const transactions = result?.transactions ?? [];

            // First call: record baseline count without triggering notifications
            if (baselineCountRef.current === null) {
                baselineCountRef.current = transactions.length;
                return;
            }

            // Only track deposits that arrive after the modal opened
            if (transactions.length <= baselineCountRef.current) return;

            const latest = transactions[transactions.length - 1];
            if (!latest) return;

            const status = normalizeStatus(latest.status);
            const normalized = { ...latest, status };

            setState((prev) => {
                if (isSameTransaction(prev.latestTransaction, normalized)) return prev;
                return {
                    isPolling: true,
                    latestTransaction: normalized,
                    status,
                };
            });

            if (isTerminalStatus(status)) {
                stopPolling();
            }
        } catch {
            // Silently ignore polling errors — will retry next interval
        }
    }, [address, stopPolling]);

    useEffect(() => {
        baselineCountRef.current = null;
        setState({
            isPolling: false,
            latestTransaction: null,
            status: null,
        });

        if (!address) {
            stopPolling();
            return;
        }

        // Initial fetch to establish baseline
        poll();

        // Start interval polling
        intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
        setState((prev) => ({ ...prev, isPolling: true }));

        return () => {
            stopPolling();
        };
    }, [address, poll, stopPolling]);

    return state;
}
