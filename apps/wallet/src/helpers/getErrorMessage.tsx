import { AbortError } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { InsufficientGasError } from '@/constants/error.js';

export function getErrorMessage(error: unknown, options?: { fallback?: string; firstLineOnly?: boolean }): string {
    const fallback = options?.fallback ?? 'Unknown error';
    const firstLineOnly = options?.firstLineOnly ?? true;

    const raw =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : error && typeof error === 'object' && 'message' in error
                ? String((error as any).message)
                : String(error);

    if (!raw || raw === 'undefined' || raw === 'null') return fallback;
    if (!firstLineOnly) return raw;
    return raw.split('\n')[0] || fallback;
}

export interface UserFacingError {
    /**
     * Stable identifier for analytics / conditional UI.
     */
    id: string;
    /**
     * User-facing message (localized).
     */
    message: ReactNode;
    /**
     * Raw details for "See details".
     */
    details: string;
}

interface ErrorHandler {
    id: string;
    test: (error: unknown, details: string) => boolean;
    renderMessage: (error: unknown, details: string) => ReactNode;
}

const ERROR_HANDLERS: ErrorHandler[] = [
    {
        id: 'aborted',
        test: (error) => AbortError.is(error),
        renderMessage: () => <Trans>Cancelled.</Trans>,
    },
    {
        id: 'insufficient-gas',
        test: (error, details) =>
            InsufficientGasError.is(error) ||
            /insufficient\s+gas/i.test(details) ||
            /insufficient\s+funds/i.test(details) ||
            /gas\s+required\s+exceeds\s+allowance/i.test(details) ||
            /intrinsic gas too low/i.test(details) ||
            /out of gas/i.test(details) ||
            /gas\s+limit/i.test(details) ||
            /base fee exceeds/i.test(details) ||
            /max fee per gas/i.test(details) ||
            /maxPriorityFeePerGas/i.test(details) ||
            /gas\s+price\s+too\s+low/i.test(details) ||
            /transaction underpriced/i.test(details),
        renderMessage: () => <Trans>Not enough gas to pay the network fee.</Trans>,
    },
    {
        id: 'contract-execution',
        test: (_error, details) => /execution reverted|\. reverted/i.test(details),
        renderMessage: () => <Trans>Transaction failed during execution.</Trans>,
    },
    {
        id: 'nonce',
        test: (_error, details) =>
            /nonce too low/i.test(details) ||
            /nonce has already been used/i.test(details) ||
            /replacement fee too low/i.test(details),
        renderMessage: () => <Trans>Transaction nonce error. Please try again.</Trans>,
    },
    {
        id: 'user-rejected',
        test: (_error, details) => /user rejected|rejected the request|denied transaction|canceled/i.test(details),
        renderMessage: () => <Trans>Transaction was rejected.</Trans>,
    },
    {
        id: 'network',
        test: (_error, details) =>
            /network|timeout|timed out|failed to fetch|websocket failed to connect|websocket closed/i.test(details),
        renderMessage: () => <Trans>Network error. Please try again.</Trans>,
    },
];

export function getUserFacingErrorMessage(error: unknown): UserFacingError {
    const details = getErrorMessage(error);
    const matched = ERROR_HANDLERS.find((h) => h.test(error, details));
    if (matched) {
        return { id: matched.id, message: matched.renderMessage(error, details), details };
    }
    return { id: 'unknown', message: <Trans>Something went wrong.</Trans>, details };
}
