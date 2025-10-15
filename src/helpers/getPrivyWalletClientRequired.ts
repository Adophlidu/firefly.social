import type { Config } from '@wagmi/core';
import { getConnectors, getWalletClient } from 'wagmi/actions';

import { getPrivyBridge, PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { delay } from '@/helpers/delay.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

async function waitUntilReady(options?: { timeoutMs?: number; intervalMs?: number }) {
    const timeoutMs = options?.timeoutMs ?? 10_000;
    const intervalMs = options?.intervalMs ?? 1_000;
    const start = Date.now();
    if (usePrivyWalletStore.getState().ready) return;

    while (!usePrivyWalletStore.getState().ready) {
        if (Date.now() - start > timeoutMs) {
            throw new Error('Timeout waiting for Privy to become ready');
        }
        await delay(intervalMs);
    }
}

export async function getPrivyWalletClientRequired(config: Config) {
    const isLogin = !!useFireflyProfileStore.getState().currentProfileSession;
    if (!isLogin) {
        await LoginModalRef.openAndWaitForClose();
        await waitUntilReady();
    }
    const connectors = getConnectors(config);
    const connector = connectors.find((connector) => connector.id === PRIVY_CONNECTOR_ID);

    return await getWalletClient(config, {
        connector,
    });
}

export async function runWithoutPrivyWalletUI<T>(callback: () => Promise<T>) {
    const bridge = getPrivyBridge();
    if (!bridge) throw new Error('Privy bridge not found');

    try {
        await bridge.setShowWalletUI(false);
        return await callback();
    } finally {
        await bridge.setShowWalletUI(true);
    }
}
