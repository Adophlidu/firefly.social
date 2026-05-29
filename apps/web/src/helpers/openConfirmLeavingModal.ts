import { dispatchModalEvent, openAndWaitForCloseModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { ConfirmLeavingModalCloseProps, ConfirmLeavingModalOpenProps } from '@/modals/ConfirmLeavingModal/refs.js';

export function openConfirmLeavingModal(props: ConfirmLeavingModalOpenProps) {
    dispatchModalEvent('confirm-leaving-modal', 'open', props);
}

export function closeConfirmLeavingModal(result: ConfirmLeavingModalCloseProps) {
    dispatchModalEvent('confirm-leaving-modal', 'close', result);
}

export function openAndWaitForCloseConfirmLeavingModal(props: ConfirmLeavingModalOpenProps) {
    return openAndWaitForCloseModalEvent('confirm-leaving-modal', props) as Promise<ConfirmLeavingModalCloseProps>;
}
