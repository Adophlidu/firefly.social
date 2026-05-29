import { dispatchModalEvent, openAndWaitForCloseModalEvent } from '@/helpers/dispatchModalEvent.js';

export function openMyWalletsModal() {
    dispatchModalEvent('my-wallets-modal', 'open', undefined);
}

export function openAndWaitForCloseMyWalletsModal() {
    return openAndWaitForCloseModalEvent('my-wallets-modal', undefined) as Promise<void>;
}
