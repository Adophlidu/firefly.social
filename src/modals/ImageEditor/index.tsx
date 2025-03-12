import { useState } from 'react';

import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { ImageEditor, type ImageEditorProps } from '@/modals/ImageEditor/ImageEditor.js';

export type ImageEditorOpenProps = Omit<ImageEditorProps, 'open' | 'onSave' | 'onClose'>;
export type ImageEditorCloseProps = File | null;
type Props = {
    ref: React.Ref<SingletonModalRefCreator<ImageEditorOpenProps, ImageEditorCloseProps>>;
};

export function ImageEditorModal({ ref }: Props) {
    const [props, setProps] = useState<ImageEditorOpenProps>();

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen(p) {
            setProps(p);
        },
    });
    if (!open || !props) return null;

    return <ImageEditor open {...props} onClose={() => dispatch?.close(null)} onSave={dispatch?.close} />;
}
