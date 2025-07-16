import { useCallback, useState } from 'react';

import { Modal } from '@/components/Modal.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { TransactionSimulatorContent } from '@/modals/TransactionSimulatorModal/SimulatorContent.js';
import type { SimulationOptions } from '@/providers/types/Tenderly.js';

export type TransactionSimulatorModalOpenProps = SimulationOptions & {
    onContinue?: () => void;
    onCanceled?: () => void;
};

type Props = {
    ref: React.Ref<SingletonModalRefCreator<TransactionSimulatorModalOpenProps>>;
};

export function TransactionSimulatorModal({ ref }: Props) {
    const [props, setProps] = useState<TransactionSimulatorModalOpenProps>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => setProps(props),
        onClose: () => {
            props?.onCanceled?.();
            setProps(undefined);
        },
    });
    const onClose = useCallback(() => dispatch?.close(), [dispatch]);
    const onContinue = useCallback(() => {
        props?.onContinue?.();
        onClose();
    }, [onClose, props]);

    if (!props) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="w-[485px] max-w-[90vw] transform rounded-xl bg-primaryBottom p-6 transition-all">
                <TransactionSimulatorContent options={props} onClose={onClose} onContinue={onContinue} />
            </div>
        </Modal>
    );
}
