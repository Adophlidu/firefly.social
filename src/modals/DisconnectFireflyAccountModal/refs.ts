import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type Account } from '@/providers/types/Account.js';

export interface DisconnectFireflyAccountModalProps {
    account: Pick<Account, 'profile' | 'origin'>;
}

export type DisconnectFireflyAccountModalRefType = SingletonModalRefCreator<DisconnectFireflyAccountModalProps>;

export const DisconnectFireflyAccountModalRef = new SingletonModal<DisconnectFireflyAccountModalProps>();
