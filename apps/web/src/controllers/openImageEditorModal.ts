import { dispatchModalEvent, openAndWaitForCloseModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { ImageEditorModalCloseProps, ImageEditorModalOpenProps } from '@/modals/ImageEditorModal/refs.js';

export function openImageEditorModal(props: ImageEditorModalOpenProps) {
    dispatchModalEvent('image-editor-modal', 'open', props);
}

export function closeImageEditorModal(result?: ImageEditorModalCloseProps) {
    dispatchModalEvent('image-editor-modal', 'close', result);
}

export function openAndWaitForCloseImageEditorModal(props: ImageEditorModalOpenProps) {
    return openAndWaitForCloseModalEvent('image-editor-modal', props) as Promise<ImageEditorModalCloseProps>;
}
