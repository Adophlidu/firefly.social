import { useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type {
    FrameViewerModalCloseProps,
    FrameViewerModalOpenProps,
} from '@/modals/FrameViewerModal/FrameViewerModalContent.js';
import { FrameViewerModalHeader } from '@/modals/FrameViewerModal/FrameViewerModalHeader.js';

type Props = {
    ref: React.Ref<SingletonModalRefCreator<FrameViewerModalOpenProps>>;
};

const FrameViewerModalContent = dynamic(() => import('@/modals/FrameViewerModal/FrameViewerModalContent.js'), {
    ssr: false,
    loading: () => <Loading className="flex-1 bg-primaryBottom" />,
});

export function FrameViewerModal({ ref }: Props) {
    const [props, setProps] = useState<FrameViewerModalOpenProps | null>(null);
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen(props) {
            setProps(props);
        },
        onClose() {
            setProps(null);
        },
    });

    if (!open || !props) return null;

    return (
        <Modal disableDialogClose open={open} onClose={() => dispatch?.close()}>
            <div className="relative flex h-[755px] w-[424px] flex-col overflow-hidden rounded-xl">
                <FrameViewerModalHeader props={props} setProps={setProps} onClose={() => dispatch?.close()} />
                <FrameViewerModalContent
                    open={open}
                    props={props}
                    setProps={setProps}
                    onClose={() => dispatch?.close()}
                />
            </div>
        </Modal>
    );
}

export const FrameViewerModalRef = new SingletonModal<FrameViewerModalOpenProps, FrameViewerModalCloseProps>();
