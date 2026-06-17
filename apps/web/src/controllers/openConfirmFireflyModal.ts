import { dispatchModalEvent, openAndWaitForCloseModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { ConfirmFireflyModalCloseProps, ConfirmFireflyModalOpenProps } from '@/modals/ConfirmFireflyModal/refs.js';

export function closeConfirmFireflyModal(result: ConfirmFireflyModalCloseProps) {
    dispatchModalEvent('confirm-firefly-modal', 'close', result);
}

export function openAndWaitForCloseConfirmFireflyModal(props: ConfirmFireflyModalOpenProps) {
    return openAndWaitForCloseModalEvent('confirm-firefly-modal', props) as Promise<ConfirmFireflyModalCloseProps>;
}
