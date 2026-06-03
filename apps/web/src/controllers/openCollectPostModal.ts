import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { CollectPostModalOpenProps } from '@/modals/CollectPostModal/refs.js';

export function openCollectPostModal(props: CollectPostModalOpenProps) {
    dispatchModalEvent('collect-post-modal', 'open', props);
}
