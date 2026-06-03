import { openAndWaitForCloseModalEvent } from '@/controllers/dispatchModalEvent.js';
import type {
    ConfirmSyncSessionModalCloseProps,
    ConfirmSyncSessionModalOpenProps,
} from '@/modals/ConfirmSyncSessionModal/refs.js';

export function openAndWaitForCloseConfirmSyncSessionModal(props: ConfirmSyncSessionModalOpenProps) {
    return openAndWaitForCloseModalEvent(
        'confirm-sync-session-modal',
        props,
    ) as Promise<ConfirmSyncSessionModalCloseProps>;
}
