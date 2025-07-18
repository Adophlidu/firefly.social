import { useState } from 'react';

import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { PreviewMediaProps } from '@/modals/PreviewMediaModal/PreviewMedia.js';

export interface PreviewMediaModalOpenProps extends Omit<PreviewMediaProps, 'open' | 'onClose'> {}

type Props = {
    ref: React.Ref<SingletonModalRefCreator<PreviewMediaModalOpenProps>>;
};

const PreviewMedia = dynamic(() => import('@/modals/PreviewMediaModal/PreviewMedia.js').then((m) => m.PreviewMedia), {
    ssr: false,
    loading: () => null,
});

export function PreviewMediaModal({ ref }: Props) {
    const [props, setProps] = useState<PreviewMediaModalOpenProps>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => setProps(props),
        onClose: () => setProps(undefined),
    });

    if (!props) return null;

    return <PreviewMedia {...props} open={open} onClose={() => dispatch?.close()} />;
}
