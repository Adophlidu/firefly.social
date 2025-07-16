import { TransactionSimulationError } from '@/constants/error.js';
import { DraggablePopoverRef, TransactionSimulatorModalRef } from '@/modals/controls.js';
import { TransactionSimulatorContent } from '@/modals/TransactionSimulatorModal/SimulatorContent.js';
import { type TransactionSimulatorModalOpenProps } from '@/modals/TransactionSimulatorModal/TransactionSimulatorModal.js';

export function simulate(props: TransactionSimulatorModalOpenProps) {
    return new Promise<void>((resolve, reject) => {
        const isMedium = window.matchMedia('(min-width: 990px)').matches;
        const onCanceled = () => reject(new TransactionSimulationError());

        if (isMedium) {
            TransactionSimulatorModalRef.open({
                ...props,
                onContinue: resolve,
                onCanceled,
            });
        } else {
            DraggablePopoverRef.open({
                onClose: onCanceled,
                enableOverflow: false,
                content: (
                    <TransactionSimulatorContent
                        showCloseButton={false}
                        options={props}
                        onContinue={() => {
                            resolve();
                            DraggablePopoverRef.close();
                        }}
                    />
                ),
            });
        }
    });
}
