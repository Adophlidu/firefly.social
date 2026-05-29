import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';

import { waitForAuthorization } from '@/connectors/PrivyConnector.js';
import { type BetEventQuery, createBetEventPath } from '@/helpers/createBetEventPath.js';
import { openLoginModalWithGuard } from '@/helpers/openLoginModal.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

export async function openPredictionPage(slug: string, options: BetEventQuery) {
    if (!useFireflyProfileStore.getState().currentProfileSession) {
        openLoginModalWithGuard();
        return;
    }
    if (!useFireflyWalletStore.getState().isAuthorized) {
        await waitForAuthorization();
    }
    iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE, {
        path: createBetEventPath(slug, options),
    });
    useGlobalState.getState().updateFireflyWalletIsOpen(true);
}
