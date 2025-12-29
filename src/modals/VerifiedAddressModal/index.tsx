'use client';

import { useRef, useState } from 'react';

import { Modal } from '@/components/Modal.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import {
    VerifiedAddressModalContent,
    type VerifiedAddressModalProps,
} from '@/modals/VerifiedAddressModal/VerifiedAddressModalContent.js';

interface Props {
    ref: React.Ref<SingletonModalRefCreator<VerifiedAddressModalProps>>;
}

export function VerifiedAddressModal({ ref }: Props) {
    const [props, setProps] = useState<VerifiedAddressModalProps | void>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => setProps(props),
    });
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <Modal open={open} onClose={() => dispatch?.close()} size="md">
            <VerifiedAddressModalContent ref={contentRef} {...props} onClose={() => dispatch?.close()} />
        </Modal>
    );
}

export const VerifiedAddressModalRef = new SingletonModal<VerifiedAddressModalProps>();
export type { VerifiedAddressModalProps } from '@/modals/VerifiedAddressModal/VerifiedAddressModalContent.js';
