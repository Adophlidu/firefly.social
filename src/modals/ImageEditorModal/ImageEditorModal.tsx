import { DialogTitle } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { BackButton } from '@/components/IconButton.js';
import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { type ImageEditorModalOpenProps, type ImageEditorModalRefType } from '@/modals/ImageEditorModal/refs.js';

interface Props {
    ref: React.Ref<ImageEditorModalRefType>;
}

const ImageEditorContent = dynamic(
    () => import('@/components/ImageEditorContent.js').then((m) => m.ImageEditorContent),
    {
        ssr: false,
        loading: () => <Loading />,
    },
);

export function ImageEditorModal({ ref }: Props) {
    const [props, setProps] = useState<ImageEditorModalOpenProps>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen(props) {
            setProps(props);
        },
    });
    if (!open || !props) return null;

    return (
        <Modal open={open} onClose={() => dispatch?.close(null)}>
            <div className="relative flex w-screen flex-col overflow-hidden rounded-[12px] bg-primaryBottom transition-all md:max-h-[800px] md:w-[455px]">
                <DialogTitle as="h3" className="relative flex h-14 shrink-0 items-center px-4 pt-safe">
                    <BackButton onClick={() => dispatch?.close(null)} />
                    <span className="flex size-full items-center justify-center gap-x-1 text-lg font-bold capitalize text-fourMain">
                        <Trans>Edit Image</Trans>
                    </span>
                </DialogTitle>
                <ImageEditorContent {...props} onSave={(file) => dispatch?.close(file)} />
            </div>
        </Modal>
    );
}
