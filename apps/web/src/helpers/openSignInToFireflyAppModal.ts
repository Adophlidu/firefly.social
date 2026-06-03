import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';

export function openSignInToFireflyAppModal() {
    dispatchModalEvent('sign-in-to-firefly-app-modal', 'open', undefined);
}
