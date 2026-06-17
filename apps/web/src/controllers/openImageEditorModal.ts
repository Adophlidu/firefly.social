import { openAndWaitForCloseModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { ImageEditorModalCloseProps, ImageEditorModalOpenProps } from '@/modals/ImageEditorModal/refs.js';

export function openAndWaitForCloseImageEditorModal(props: ImageEditorModalOpenProps) {
    return openAndWaitForCloseModalEvent('image-editor-modal', props) as Promise<ImageEditorModalCloseProps>;
}
