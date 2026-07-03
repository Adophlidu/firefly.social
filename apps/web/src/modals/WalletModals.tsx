'use client';

// Side effect: runs createAppKit(). Co-located with the wallet modals so AppKit
// is only initialized where the wallet stack is mounted (non-whiteboard routes,
// or on demand on whiteboard routes such as /signup). Kept out of the eager
// modal barrel so it never loads on first paint of whiteboard routes.
import '@/configs/appkit.js';

import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { WalletConnectModal } from '@/modals/WalletConnectModal/WalletConnectModal.js';

/**
 * The always-available wallet modals that require the wagmi/AppKit context.
 *
 * Rendered only when the wallet stack is mounted (see `Modals`), which is always
 * true on non-whiteboard routes and becomes true on demand on whiteboard routes
 * once a wallet flow activates it. WalletConnectModal's `useAppKitTheme()` at the
 * component root therefore never runs before `createAppKit()` has executed.
 */
export function WalletModals() {
    return <WalletConnectModal ref={WalletConnectModalRef.register} />;
}
