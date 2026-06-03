import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';

export function openDownloadMobileAppModal() {
    dispatchModalEvent('download-mobile-app-modal', 'open', undefined);
}
