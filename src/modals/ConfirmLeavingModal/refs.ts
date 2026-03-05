import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export type ConfirmLeavingModalOpenProps = string;

export type ConfirmLeavingModalCloseProps = boolean;

export type ConfirmLeavingModalRefType = SingletonModalRefCreator<
    ConfirmLeavingModalOpenProps,
    ConfirmLeavingModalCloseProps
>;

export const ConfirmLeavingModalRef = new SingletonModal<ConfirmLeavingModalOpenProps, ConfirmLeavingModalCloseProps>();
