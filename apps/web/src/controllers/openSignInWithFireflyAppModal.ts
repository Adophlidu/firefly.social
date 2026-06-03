import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';

export function openSignInWithFireflyAppModal() {
    dispatchModalEvent('sign-in-with-firefly-app-modal', 'open', undefined);
}

export function closeSignInWithFireflyAppModal() {
    dispatchModalEvent('sign-in-with-firefly-app-modal', 'close', undefined);
}
