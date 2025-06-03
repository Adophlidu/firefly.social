import { useCallback, useState } from 'react';

import { Modal } from '@/components/Modal.js';
import type { PasswordWorkflow } from '@/constants/enum.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { PasswordModalContent } from '@/modals/PasswordModal/PasswordModalContent.js';

export interface PasswordModalOpenProps {
    workflow: PasswordWorkflow;
}

type Props = {
    ref: React.Ref<SingletonModalRefCreator<PasswordModalOpenProps, boolean | void>>;
};

export function PasswordModal({ ref }: Props) {
    const [props, setProps] = useState<PasswordModalOpenProps>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
        },
    });
    const onClose = useCallback((success?: boolean) => dispatch?.close(success), [dispatch]);

    if (!props) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div>
                <PasswordModalContent {...props} onClose={onClose} />
            </div>
        </Modal>
    );
}
