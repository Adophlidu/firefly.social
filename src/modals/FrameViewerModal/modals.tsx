import { memo } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import {
    RelayConfirmationPopover,
    RelayConfirmationPopoverRef,
} from '@/modals/FrameViewerModal/RelayConfirmationPopover.js';

export const Modals = memo(function Modals() {
    return (
        <NoSSR>
            <RelayConfirmationPopover ref={RelayConfirmationPopoverRef.register} />
        </NoSSR>
    );
});
