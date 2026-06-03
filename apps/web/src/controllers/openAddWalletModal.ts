import { openAndWaitForCloseModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { AddWalletModalCloseProps, AddWalletModalOpenProps } from '@/modals/AddWalletModal/refs.js';

export function openAndWaitForCloseAddWalletModal(props: AddWalletModalOpenProps) {
    return openAndWaitForCloseModalEvent('add-wallet-modal', props) as Promise<AddWalletModalCloseProps>;
}
