import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { PreviewMediaModalOpenProps } from '@/modals/PreviewMediaModal/refs.js';

export function openPreviewMediaModal(props: PreviewMediaModalOpenProps) {
    dispatchModalEvent('preview-media-modal', 'open', props);
}
