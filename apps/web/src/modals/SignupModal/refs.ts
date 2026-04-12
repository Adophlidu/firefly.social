import type { SocialSource } from '@/constants/enum.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { Account } from '@/providers/types/Account.js';

export interface SignupModalOpenProps {
    source: SocialSource;
}

export type SignupModalCloseProps = {
    account: Account;
} | void;

export type SignupModalRefType = SingletonModalRefCreator<SignupModalOpenProps, SignupModalCloseProps>;

export const SignupModalRef = new SingletonModal<SignupModalOpenProps, SignupModalCloseProps>();
