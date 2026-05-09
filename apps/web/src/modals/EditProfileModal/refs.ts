import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export interface EditProfileModalOpenProps {
    profile: Profile;
}

export type EditProfileModalRefType = SingletonModalRefCreator<EditProfileModalOpenProps>;

export const EditProfileModalRef = new SingletonModal<EditProfileModalOpenProps>();
