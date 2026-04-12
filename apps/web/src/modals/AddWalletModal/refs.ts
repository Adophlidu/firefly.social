import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { BindWalletResponse, FireflyWalletConnection } from '@/providers/types/Firefly.js';

export interface AddWalletModalOpenProps {
    connections: FireflyWalletConnection[];
}

export interface AddWalletModalCloseProps {
    response?: BindWalletResponse['data'];
}

export type AddWalletModalRefType = SingletonModalRefCreator<AddWalletModalOpenProps, AddWalletModalCloseProps>;

export const AddWalletModalRef = new SingletonModal<AddWalletModalOpenProps, AddWalletModalCloseProps>();
