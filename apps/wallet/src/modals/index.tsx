import { memo } from 'react';

import { Confirm } from '@/components/ConfirmModal.js';

export const Modals = memo(function Modals() {
    return (
        <>
            <Confirm.Root />
        </>
    );
});
