import { openAndWaitForCloseModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { AddLensManagerModalCloseProps, AddLensManagerModalOpenProps } from '@/modals/AddLensManagerModal/refs.js';

export function openAndWaitForCloseAddLensManagerModal(props: AddLensManagerModalOpenProps) {
    return openAndWaitForCloseModalEvent('add-lens-manager-modal', props) as Promise<AddLensManagerModalCloseProps>;
}
