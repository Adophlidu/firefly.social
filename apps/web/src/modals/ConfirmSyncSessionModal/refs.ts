import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export interface ConfirmSyncSessionModalOpenProps {
    profiles: Profile[];
}

export type ConfirmSyncSessionModalCloseProps = boolean;

export type ConfirmSyncSessionModalRefType = SingletonModalRefCreator<
    ConfirmSyncSessionModalOpenProps,
    ConfirmSyncSessionModalCloseProps
>;

export const ConfirmSyncSessionModalRef = new SingletonModal<
    ConfirmSyncSessionModalOpenProps,
    ConfirmSyncSessionModalCloseProps
>();
