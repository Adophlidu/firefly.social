import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';

/**
 * Resolves once the Firefly (Privy) wallet is authorized. Lives in helpers (not
 * in `connectors/PrivyConnector.ts`) so UI entry points that only need to await
 * authorization (prediction pages, notifications) do not pull the whole
 * connector into their chunk.
 */
export async function waitForAuthorization(): Promise<void> {
    if (useFireflyWalletStore.getState().isAuthorized) return;
    await new Promise<void>((resolve) => {
        const unsubscribe = useFireflyWalletStore.subscribe((state) => {
            if (!state.isAuthorized) return;
            unsubscribe();
            resolve();
        });
    });
}
