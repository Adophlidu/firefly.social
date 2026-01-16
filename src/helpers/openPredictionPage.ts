import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';

import { waitForAuthorization } from '@/connectors/PrivyConnector.js';
import { createBetEventPath } from '@/helpers/createBetEventPath.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export async function openPredictionPage(slug: string, outcome: number) {
    if (!useFireflyWalletStore.getState().isAuthorized) {
        await waitForAuthorization();
    }
    iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE, {
        path: createBetEventPath(slug, { outcome }),
    });
    useGlobalState.getState().updateFireflyWalletIsOpen(true);
}
