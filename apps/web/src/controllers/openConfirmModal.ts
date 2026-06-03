import { dispatchModalEvent, openAndWaitForCloseModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { ConfirmModalCloseResult, ConfirmModalOpenProps } from '@/modals/ConfirmModal/refs.js';

export function openConfirmModal(props: ConfirmModalOpenProps) {
    dispatchModalEvent('confirm-modal', 'open', props);
}

export function closeConfirmModal(result?: ConfirmModalCloseResult) {
    dispatchModalEvent('confirm-modal', 'close', result);
}

export function openAndWaitForCloseConfirmModal(props: ConfirmModalOpenProps) {
    return openAndWaitForCloseModalEvent('confirm-modal', props) as Promise<ConfirmModalCloseResult>;
}
