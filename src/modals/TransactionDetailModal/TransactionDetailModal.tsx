import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { TransactionHistoryItem } from '@/providers/types/Firefly.js';

export type TransactionModalOpenProps = {
    transaction: TransactionHistoryItem;
};

type Props = {
    ref: React.Ref<SingletonModalRefCreator<TransactionModalOpenProps>>;
};

const TransactionDetailContent = dynamic(() => import('./TransactionDetailContent.js'), {
    ssr: false,
    loading: () => null,
});

export function TransactionDetailModal({ ref }: Props) {
    const [props, setProps] = useState<TransactionModalOpenProps>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
        },
        onClose: () => setProps(undefined),
    });

    if (!props) return null;

    return (
        <Modal enableClose title={<Trans>Transaction Detail</Trans>} open={open} onClose={() => dispatch?.close()}>
            <div className="w-[432px] rounded-xl transition-all">
                <TransactionDetailContent transaction={props.transaction} />
            </div>
        </Modal>
    );
}

export const TransactionDetailModalRef = new SingletonModal<TransactionModalOpenProps>();
