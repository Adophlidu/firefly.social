import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { EditProfileModalOpenProps } from '@/modals/EditProfileModal/refs.js';

export function openEditProfileModal(props: EditProfileModalOpenProps) {
    dispatchModalEvent('edit-profile-modal', 'open', props);
}
