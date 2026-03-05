import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface RecoveryPhraseModalOpenProps {
    fid: string;
}

export type RecoveryPhraseModalCloseResult = boolean | null;

export type RecoveryPhraseModalRefType = SingletonModalRefCreator<
    RecoveryPhraseModalOpenProps,
    RecoveryPhraseModalCloseResult
>;

export const RecoveryPhraseModalRef = new SingletonModal<
    RecoveryPhraseModalOpenProps,
    RecoveryPhraseModalCloseResult
>();
