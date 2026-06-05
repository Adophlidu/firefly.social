import { useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { PreviewMediaModalContentProps } from '@/modals/PreviewMediaModal/PreviewMediaModalContent.js';
import type { PreviewMediaModalRefType } from '@/modals/PreviewMediaModal/refs.js';

interface PreviewMediaModalOpenProps extends Omit<PreviewMediaModalContentProps, 'open' | 'onClose'> {}

interface Props {
    ref: React.Ref<PreviewMediaModalRefType>;
}

const PreviewMediaModalContent = dynamic(
    () => import('@/modals/PreviewMediaModal/PreviewMediaModalContent.js').then((m) => m.PreviewMediaModalContent),
    {
        ssr: false,
        loading: () => <Loading />,
    },
);

export function PreviewMediaModal({ ref }: Props) {
    const isMedium = useIsMedium();

    const [props, setProps] = useState<PreviewMediaModalOpenProps | null>(null);
    const [open, dispatch] = useSingletonModal(ref, {
        name: 'preview-media-modal',
        onOpen: (props) => setProps(props),
        onClose: () => setProps(null),
    });

    if (!props) return null;

    return (
        <Modal open={open} disableDialogClose={false} enableBackdrop={false} onClose={() => dispatch?.close()}>
            <div
                className="preview-actions fixed inset-0 flex transform-none bg-black/90 bg-opacity-90 outline-none transition-all"
                onClick={isMedium ? () => dispatch?.close() : undefined}
            >
                <PreviewMediaModalContent {...props} onClose={() => dispatch?.close()} />
            </div>
        </Modal>
    );
}
