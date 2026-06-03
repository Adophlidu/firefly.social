import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { AddCustomERC721ModalOpenProps } from '@/modals/AddCustomERC721Modal/refs.js';

export function openAddCustomERC721Modal(props: AddCustomERC721ModalOpenProps) {
    dispatchModalEvent('add-custom-erc721-modal', 'open', props);
}
