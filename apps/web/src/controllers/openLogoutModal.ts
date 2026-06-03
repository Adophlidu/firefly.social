import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { LogoutModalOpenProps } from '@/modals/LogoutModal/refs.js';

export function openLogoutModal(props?: LogoutModalOpenProps) {
    dispatchModalEvent('logout-modal', 'open', props);
}
