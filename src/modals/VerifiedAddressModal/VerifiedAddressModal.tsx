'use client';

import { type Ref, useRef, useState } from 'react';

import { Modal } from '@/components/Modal.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { type VerifiedAddressModalRefType } from '@/modals/VerifiedAddressModal/refs.js';
import {
    VerifiedAddressModalContent,
    type VerifiedAddressModalProps,
} from '@/modals/VerifiedAddressModal/VerifiedAddressModalContent.js';

interface Props {
    ref: Ref<VerifiedAddressModalRefType>;
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
