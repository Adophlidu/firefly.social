import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { SignupModalOpenProps } from '@/modals/SignupModal/refs.js';

export function openSignupModal(props: SignupModalOpenProps) {
    dispatchModalEvent('signup-modal', 'open', props);
}
