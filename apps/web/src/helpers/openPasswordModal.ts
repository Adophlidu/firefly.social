import { dispatchModalEvent, openAndWaitForCloseModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { PasswordModalCloseProps, PasswordModalOpenProps } from '@/modals/PasswordModal/refs.js';

export function openPasswordModal(props: PasswordModalOpenProps) {
    dispatchModalEvent('password-modal', 'open', props);
}

export function closePasswordModal(result?: PasswordModalCloseProps) {
    dispatchModalEvent('password-modal', 'close', result);
}

export function openAndWaitForClosePasswordModal(props: PasswordModalOpenProps) {
    return openAndWaitForCloseModalEvent('password-modal', props) as Promise<PasswordModalCloseProps>;
}
