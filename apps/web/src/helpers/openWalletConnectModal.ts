import { dispatchModalEvent, openAndWaitForCloseModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { WalletConnectModalCloseProps, WalletConnectModalOpenProps } from '@/modals/WalletConnectModal/refs.js';

export function openWalletConnectModal(props?: WalletConnectModalOpenProps) {
    dispatchModalEvent('wallet-connect-modal', 'open', props);
}

export function closeWalletConnectModal(props?: WalletConnectModalCloseProps) {
    dispatchModalEvent('wallet-connect-modal', 'close', props);
}

export function openAndWaitForCloseWalletConnectModal(props?: WalletConnectModalOpenProps) {
    return openAndWaitForCloseModalEvent('wallet-connect-modal', props) as Promise<WalletConnectModalCloseProps | void>;
}
