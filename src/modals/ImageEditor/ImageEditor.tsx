import { DialogTitle } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { type AvatarEditorProps } from 'react-avatar-editor';

import LeftArrowIcon from '@/assets/left-arrow.svg';
import { ImageEditorContent } from '@/components/ImageEditorContent.js';
import { Modal, type ModalProps } from '@/components/Modal.js';
import { EMPTY_OBJECT } from '@/constants/index.js';

export interface ImageEditorProps extends ModalProps {
    image: string | File;
    onSave?(blob: Blob | null): void;
    AvatarEditorProps?: Omit<AvatarEditorProps, 'image'>;
}

export function ImageEditor({ image, onSave, AvatarEditorProps = EMPTY_OBJECT, ...rest }: ImageEditorProps) {
    if (!image) return null;

    return (
        <Modal {...rest} open>
            <div className="flex w-[600px] transform flex-col overflow-hidden rounded-[12px] bg-primaryBottom transition-all">
                <DialogTitle as="h3" className="relative h-14 shrink-0 pt-safe">
                    <LeftArrowIcon
                        onClick={() => rest.onClose()}
                        className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer text-fourMain"
                    />
                    <span className="flex h-full w-full items-center justify-center gap-x-1 text-lg font-bold capitalize text-fourMain">
                        <Trans>Edit Image</Trans>
                    </span>
                </DialogTitle>
                <ImageEditorContent image={image} onSave={onSave} AvatarEditorProps={AvatarEditorProps} />
            </div>
        </Modal>
    );
}
