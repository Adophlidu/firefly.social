import { type Ref, useCallback, useState } from 'react';

import { Modal } from '@/components/Modal.js';
import { Popover } from '@/components/Popover.js';
import { IS_IOS } from '@/constants/browser.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { PasswordModalContent } from '@/modals/PasswordModal/PasswordModalContent.js';
import type { PasswordModalOpenProps, PasswordModalRefType } from '@/modals/PasswordModal/refs.js';

interface Props {
    ref: Ref<PasswordModalRefType>;
}

export function PasswordModal({ ref }: Props) {
    const isMedium = useIsMedium();
    const [props, setProps] = useState<PasswordModalOpenProps>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
        },
    });
    const onClose = useCallback((success?: boolean) => dispatch?.close(success), [dispatch]);

    if (!props) return null;

    if (isMedium || IS_IOS) {
        return (
            <Modal open={open} onClose={onClose}>
                <div className="max-h-[70vh] w-[90vw] max-w-[400px]">
                    <PasswordModalContent {...props} onClose={onClose} />
                </div>
            </Modal>
        );
    }

    return (
        <Popover open={open} onClose={onClose} dialogPanelClassName="!p-0">
            <div>
                <PasswordModalContent {...props} onClose={onClose} />
            </div>
        </Popover>
    );
}
