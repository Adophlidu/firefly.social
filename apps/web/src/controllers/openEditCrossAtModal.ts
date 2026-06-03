import { openAndWaitForCloseModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { EditCrossAtModalCloseProps, EditCrossAtModalOpenProps } from '@/modals/EditCrossAtModal/refs.js';

export function openAndWaitForCloseEditCrossAtModal(props: EditCrossAtModalOpenProps) {
    return openAndWaitForCloseModalEvent('edit-cross-at-modal', props) as Promise<EditCrossAtModalCloseProps>;
}
