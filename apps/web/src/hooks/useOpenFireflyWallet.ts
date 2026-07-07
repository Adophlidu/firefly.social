import {
    IframeBridgeMethod,
    iframeBridgeProvider,
    type IframeBridgeRequestArguments,
} from '@dimensiondev/iframe-bridge';
import { useCallback } from 'react';

import { FIREFLY_WALLET_IFRAME_ID } from '@/constants/fireflyWallet.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export function useOpenFireflyWallet() {
    const { updateFireflyWalletIsOpen } = useGlobalState();
    return useCallback(
        (param?: IframeBridgeRequestArguments[IframeBridgeMethod.NAVIGATE]) => {
            updateFireflyWalletIsOpen(true);
            if (param) {
                iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, param, {
                    targetIframeId: FIREFLY_WALLET_IFRAME_ID,
                });
            }
        },
        [updateFireflyWalletIsOpen],
    );
}
