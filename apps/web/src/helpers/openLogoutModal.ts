import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { LogoutModalOpenProps } from '@/modals/LogoutModal/refs.js';

export function openLogoutModal(props?: LogoutModalOpenProps) {
    dispatchModalEvent('logout-modal', 'open', props);
}
