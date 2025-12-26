import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';

import { waitForAuthorization } from '@/connectors/PrivyConnector.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export async function openPredictionPage(slug: string, outcome: string) {
    useGlobalState.getState().updateFireflyWalletIsOpen(true);
    if (!useFireflyWalletStore.getState().isAuthorized) {
        await waitForAuthorization();
    }
    iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE, {
        path: `/prediction/${slug}?outcome=${outcome}`,
    });
}
