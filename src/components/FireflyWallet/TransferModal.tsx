'use client';

import { type Ref, useImperativeHandle, useState } from 'react';

import { SendTransactionModal } from '@/components/SendTransactionModal/SendTransactionModal.js';
import type { Token } from '@/hooks/useCustomFungibleTokens.js';

export interface TransferModalRef {
    onOpen: (token?: Token) => void;
}

export function TransferModal({ ref }: { ref?: Ref<TransferModalRef> }) {
    const [open, setOpen] = useState(false);
    useImperativeHandle(ref, () => {
        return {
            onOpen: () => setOpen(true),
        };
    }, []);
    return <SendTransactionModal open={open} onClose={() => setOpen(false)} />;
}
