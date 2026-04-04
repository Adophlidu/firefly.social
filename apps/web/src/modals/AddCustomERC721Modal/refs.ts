import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface AddCustomERC721ModalOpenProps {
    initialChainId: number;
}

export type AddCustomERC721ModalRefType = SingletonModalRefCreator<AddCustomERC721ModalOpenProps>;

export const AddCustomERC721ModalRef = new SingletonModal<AddCustomERC721ModalOpenProps>();
