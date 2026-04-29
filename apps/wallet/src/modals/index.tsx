import { memo } from 'react';

import { Confirm } from '@/components/ConfirmModal.js';
import { PinCodeModal } from '@/components/PinCodeModal/index.js';

export const Modals = memo(function Modals() {
    return (
        <>
            <Confirm.Root />
            <PinCodeModal.Root />
        </>
    );
});
