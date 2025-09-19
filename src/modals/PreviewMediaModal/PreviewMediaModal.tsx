import { useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { PreviewMediaModalContentProps } from '@/modals/PreviewMediaModal/PreviewMediaModalContent.js';

export interface PreviewMediaModalOpenProps extends Omit<PreviewMediaModalContentProps, 'open' | 'onClose'> {}

type Props = {
    ref: React.Ref<SingletonModalRefCreator<PreviewMediaModalOpenProps>>;
};

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
        onOpen: (props) => setProps(props),
        onClose: () => setProps(null),
    });

    if (!props) return null;

    return (
        <Modal open={open} enableBackdrop={false} onClose={() => dispatch?.close()}>
            <div
                className="preview-actions fixed inset-0 flex transform-none flex-col items-center justify-center bg-black/90 bg-opacity-90 outline-none transition-all"
                onClick={isMedium ? () => dispatch?.close() : undefined}
            >
                <PreviewMediaModalContent {...props} onClose={() => dispatch?.close()} />
            </div>
        </Modal>
    );
}

export const PreviewMediaModalRef = new SingletonModal<PreviewMediaModalOpenProps>();
