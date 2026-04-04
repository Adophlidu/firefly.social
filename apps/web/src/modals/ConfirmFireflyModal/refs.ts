import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type Account } from '@/providers/types/Account.js';

export interface ConfirmFireflyModalOpenProps {
    account: Account;
}

export type ConfirmFireflyModalCloseProps = boolean;

export type ConfirmFireflyModalRefType = SingletonModalRefCreator<
    ConfirmFireflyModalOpenProps,
    ConfirmFireflyModalCloseProps
>;

export const ConfirmFireflyModalRef = new SingletonModal<ConfirmFireflyModalOpenProps, ConfirmFireflyModalCloseProps>();
