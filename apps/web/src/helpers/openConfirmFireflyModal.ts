import { dispatchModalEvent, openAndWaitForCloseModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { ConfirmFireflyModalCloseProps, ConfirmFireflyModalOpenProps } from '@/modals/ConfirmFireflyModal/refs.js';

export function openConfirmFireflyModal(props: ConfirmFireflyModalOpenProps) {
    dispatchModalEvent('confirm-firefly-modal', 'open', props);
}

export function closeConfirmFireflyModal(result: ConfirmFireflyModalCloseProps) {
    dispatchModalEvent('confirm-firefly-modal', 'close', result);
}

export function openAndWaitForCloseConfirmFireflyModal(props: ConfirmFireflyModalOpenProps) {
    return openAndWaitForCloseModalEvent('confirm-firefly-modal', props) as Promise<ConfirmFireflyModalCloseProps>;
}
