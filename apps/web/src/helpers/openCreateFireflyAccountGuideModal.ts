import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';

export function openCreateFireflyAccountGuideModal() {
    dispatchModalEvent('create-firefly-account-guide-modal', 'open', undefined);
}
