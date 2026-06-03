import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { AddCustomERC20ModalOpenProps } from '@/modals/AddCustomERC20Modal/refs.js';

export function openAddCustomERC20Modal(props: AddCustomERC20ModalOpenProps) {
    dispatchModalEvent('add-custom-erc20-modal', 'open', props);
}
