'use client';

import { useEffect } from 'react';

import { activateWalletStack } from '@/controllers/activateWalletStack.js';
import { hasPersistedWalletSession } from '@/helpers/hasPersistedWalletSession.js';
import { useWalletStackStore } from '@/store/useWalletStackStore.js';

/**
 * Boot-time activation of the deferred wallet stack: if a wallet / Firefly
 * session is already persisted from a previous visit, mount the stack right
 * after hydration so returning users see no behavior change (wallets reconnect,
 * the FireflyWallet dock appears, wallet modals are ready). Anonymous read-only
 * visitors never trigger this, keeping the wallet chunks unloaded.
 */
export function WalletStackBootstrap() {
    useEffect(() => {
        if (useWalletStackStore.getState().active) return;
        if (hasPersistedWalletSession()) void activateWalletStack();
    }, []);

    return null;
}
