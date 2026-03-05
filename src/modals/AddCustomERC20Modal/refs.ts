import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface AddCustomERC20ModalOpenProps {
    initialChainId?: number;
    validChainIds?: number[];
}

export type AddCustomERC20ModalRefType = SingletonModalRefCreator<AddCustomERC20ModalOpenProps>;

export const AddCustomERC20ModalRef = new SingletonModal<AddCustomERC20ModalOpenProps>();
