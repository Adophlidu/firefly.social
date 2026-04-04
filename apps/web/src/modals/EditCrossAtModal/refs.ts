import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type Profile } from '@/providers/types/Firefly.js';

export interface EditCrossAtModalOpenProps {
    profiles: Profile[];
}

export type EditCrossAtModalCloseProps = Profile[] | void;

export type EditCrossAtModalRefType = SingletonModalRefCreator<EditCrossAtModalOpenProps, EditCrossAtModalCloseProps>;

export const EditCrossAtModalRef = new SingletonModal<EditCrossAtModalOpenProps, EditCrossAtModalCloseProps>();
