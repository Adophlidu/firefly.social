import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { Account } from '@/providers/types/Account.js';

export interface LogoutModalOpenProps {
    account?: Account;
}

export type LogoutModalRefType = SingletonModalRefCreator<LogoutModalOpenProps | void>;

export const LogoutModalRef = new SingletonModal<LogoutModalOpenProps | void>();
