import { delay } from '@dimensiondev/utils';
import { useEffect, useState } from 'react';
import { useEventCallback } from 'usehooks-ts';

import { DialogOrDrawer } from '@/components/DialogOrDrawer.js';

interface Props {
    open: boolean;
    onClose: () => void;
}

export function SendTransactionModal({ open, ...rest }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        if (open) setMounted(true);
    }, [open]);

    const onClose = useEventCallback(async () => {
        rest.onClose?.();
        await delay(300);
        setMounted(false);
    });

    return (
        <DialogOrDrawer
            open={open}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            {mounted ? <div>Use /send route instead</div> : null}
        </DialogOrDrawer>
    );
}
