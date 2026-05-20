import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { accessPathAtom } from '@/store/swap/swapState.js';

// Slippage type: 'auto' or a specific percentage number
export type SlippageValue = 'auto' | number;

// Slippage setting - stored in localStorage
export const slippageAtom = atomWithStorage<SlippageValue>(
    'swap-slippage',
    'auto',
    typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined,
    { getOnInit: true },
);

// Skip review toggle - stored in localStorage (default ON per Jira)
export const skipReviewAtom = atomWithStorage<boolean>(
    'swap-skip-review',
    true,
    typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined,
    { getOnInit: true },
);

// Action atom to set skip review and emit analytics
export const setSkipReviewAtom = atom(null, (get, set, value: boolean) => {
    const currentValue = get(skipReviewAtom);
    if (currentValue && !value) {
        captureWalletTelemetryEvent(WalletTelemetryEventId.SWAP_SKIP_REVIEWS_DISABLE, {
            access_path: get(accessPathAtom),
        });
    }
    set(skipReviewAtom, value);
});

// Validate slippage value (1-100 with max 2 decimal places)
export function isValidSlippage(value: number): boolean {
    if (isNaN(value) || value < 1 || value > 100) {
        return false;
    }
    // Check decimal places (max 2)
    const str = value.toString();
    const decimalIndex = str.indexOf('.');
    if (decimalIndex !== -1 && str.length - decimalIndex - 1 > 2) {
        return false;
    }
    return true;
}

// Action atom to set slippage and emit analytics
export const setSlippageAtom = atom(null, (get, set, value: SlippageValue) => {
    // Validate before saving
    if (value !== 'auto' && !isValidSlippage(value)) {
        return;
    }
    const currentValue = get(slippageAtom);
    if (currentValue === 'auto' && value !== 'auto') {
        captureWalletTelemetryEvent(WalletTelemetryEventId.SWAP_CUSTOM_SLIPPAGE, {
            value,
            access_path: get(accessPathAtom),
        });
    }
    set(slippageAtom, value);
});

// Helper to get actual slippage value as number
export function getSlippagePercent(slippage: SlippageValue): number {
    if (slippage === 'auto') {
        return 0.5; // Default auto slippage is 0.5%
    }
    return slippage;
}
