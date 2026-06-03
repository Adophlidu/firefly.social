import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { ShareImageModalOpenProps } from '@/modals/ShareImageModal/refs.js';

export function openShareImageModal(props: ShareImageModalOpenProps) {
    dispatchModalEvent('share-image-modal', 'open', props);
}
