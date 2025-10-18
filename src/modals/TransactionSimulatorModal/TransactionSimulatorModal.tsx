import { useCallback, useState } from 'react';

import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { SimulationOptions } from '@/providers/types/Tenderly.js';

export type TransactionSimulatorModalOpenProps = SimulationOptions & {
    onContinue?: () => void;
    onCanceled?: () => void;
};

type Props = {
    ref: React.Ref<SingletonModalRefCreator<TransactionSimulatorModalOpenProps>>;
};

const TransactionSimulatorContent = dynamic(() => import('./SimulatorContent.js'), { ssr: false, loading: () => null });
export function TransactionSimulatorModal({ ref }: Props) {
    const [props, setProps] = useState<TransactionSimulatorModalOpenProps>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
        },
        onClose: () => {
            props?.onCanceled?.();
            setProps(undefined);
        },
    });
    const onContinue = useCallback(() => {
        props?.onContinue?.();
        dispatch?.close();
    }, [props, dispatch]);

    if (!props) return null;

    return (
        <Modal open={open} onClose={() => dispatch?.close()}>
            <div className="w-[485px] max-w-[90vw] rounded-xl bg-primaryBottom p-6 transition-all">
                <TransactionSimulatorContent
                    options={props}
                    onClose={() => dispatch?.close()}
                    onContinue={onContinue}
                />
            </div>
        </Modal>
    );
}

export const TransactionSimulatorModalRef = new SingletonModal<TransactionSimulatorModalOpenProps>();
