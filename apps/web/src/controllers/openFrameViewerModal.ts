import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { FrameViewerModalOpenProps } from '@/modals/FrameViewerModal/refs.js';

export function openFrameViewerModal(props: FrameViewerModalOpenProps) {
    dispatchModalEvent('frame-viewer-modal', 'open', props);
}

export function closeFrameViewerModal() {
    dispatchModalEvent('frame-viewer-modal', 'close', undefined);
}
