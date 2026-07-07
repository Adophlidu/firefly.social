'use client';

// Side effect: runs createAppKit(). Co-located with the wallet modals so AppKit
// is only initialized where the wallet stack is mounted (i.e. once
// `useWalletStackStore.active` flips at boot for returning wallet users or on
// the first wallet interaction). Kept out of the eager modal barrel so it never
// loads on read-only first paint.
import '@/configs/appkit.js';

import { AppKitSolanaStateBridge } from '@/components/AppKitSolanaStateBridge.js';
import { MyWalletsModal } from '@/modals/MyWalletsModal/MyWalletsModal.js';
import { MyWalletsModalRef } from '@/modals/MyWalletsModal/refs.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { WalletConnectModal } from '@/modals/WalletConnectModal/WalletConnectModal.js';

/**
 * The always-available wallet modals that require the wagmi/AppKit context.
 *
 * Rendered only when the wallet stack is active (see `Modals`).
 * WalletConnectModal's `useAppKitTheme()` at the component root therefore never
 * runs before `createAppKit()` has executed. MyWalletsModal lives here (not in
 * `AppModals`) because it imports the AppKit side-effect module as well.
 * Opens dispatched while this cluster is unmounted are queued and re-dispatched
 * by `controllers/dispatchModalEvent.ts` after activation.
 */
export function WalletModals() {
    return (
        <>
            <AppKitSolanaStateBridge />
            <WalletConnectModal ref={WalletConnectModalRef.register} />
            <MyWalletsModal ref={MyWalletsModalRef.register} />
        </>
    );
}
