import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';

export function openDownloadMobileAppModal() {
    dispatchModalEvent('download-mobile-app-modal', 'open', undefined);
}
