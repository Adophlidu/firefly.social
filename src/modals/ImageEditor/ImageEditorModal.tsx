import { useState } from 'react';

import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { ImageEditorProps } from '@/modals/ImageEditor/ImageEditor.js';

export type ImageEditorOpenProps = Omit<ImageEditorProps, 'open' | 'onSave' | 'onClose'>;
export type ImageEditorCloseProps = File | null;

type Props = {
    ref: React.Ref<SingletonModalRefCreator<ImageEditorOpenProps, ImageEditorCloseProps>>;
};

const ImageEditor = dynamic(() => import('@/modals/ImageEditor/ImageEditor.js').then((m) => m.ImageEditor), {
    ssr: false,
    loading: () => null,
});

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
