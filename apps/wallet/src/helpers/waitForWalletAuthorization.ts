import { isWalletAuthorizedAtom } from '@/store/embeddedWallets.js';
import { store } from '@/store/index.js';

export async function waitForWalletAuthorization() {
    const isAuthorized = store.get(isWalletAuthorizedAtom);
    if (isAuthorized) return true;

    return new Promise<boolean>((resolve) => {
        const unsubscribe = store.sub(isWalletAuthorizedAtom, () => {
            const isAuthorized = store.get(isWalletAuthorizedAtom);
            if (isAuthorized) {
                resolve(true);
                unsubscribe();
            }
        });
    });
}
