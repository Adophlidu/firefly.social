import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { EditFireflyProfileModalOpenProps } from '@/modals/EditFireflyProfileModal/refs.js';

export function openEditFireflyProfileModal(props: EditFireflyProfileModalOpenProps) {
    dispatchModalEvent('edit-firefly-profile-modal', 'open', props);
}
