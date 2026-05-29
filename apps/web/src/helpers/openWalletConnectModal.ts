import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { WalletConnectModalCloseProps, WalletConnectModalOpenProps } from '@/modals/WalletConnectModal/refs.js';

export function openWalletConnectModal(props?: WalletConnectModalOpenProps) {
    dispatchModalEvent('wallet-connect-modal', 'open', props);
}

export function closeWalletConnectModal(props?: WalletConnectModalCloseProps) {
    dispatchModalEvent('wallet-connect-modal', 'close', props);
}
