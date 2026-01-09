import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';

import { waitForAuthorization } from '@/connectors/PrivyConnector.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export async function openPredictionPage(slug: string, outcome: number) {
    if (!useFireflyWalletStore.getState().isAuthorized) {
        await waitForAuthorization();
    }
    console.log(`/bet/event/${slug}?outcome=${outcome}`);
    iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE, {
        path: `/bet/event/${slug}?outcome=${outcome}`,
    });
    useGlobalState.getState().updateFireflyWalletIsOpen(true);
}
