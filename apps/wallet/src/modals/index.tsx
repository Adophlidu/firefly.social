import { memo } from 'react';

import { Confirm } from '@/components/ConfirmModal.js';
import { PinCodeModal } from '@/components/PinCodeModal/index.js';
import { TokenApproveFlowModal } from '@/components/TokenApproveFlow/TokenApproveFlowModal.js';

export const Modals = memo(function Modals() {
    return (
        <>
            <Confirm.Root />
            <PinCodeModal.Root />
            <TokenApproveFlowModal.Root />
        </>
    );
});
