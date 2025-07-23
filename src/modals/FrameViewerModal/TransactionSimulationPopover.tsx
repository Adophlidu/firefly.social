'use client';

import { Trans } from '@lingui/react/macro';
import { type ReactNode, useState } from 'react';

import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { Popover } from '@/modals/FrameViewerModal/Popover.js';
import type { FrameV2 } from '@/types/frame.js';

export interface TransactionSimulationPopoverProps {
    frame?: FrameV2;
    content?: ReactNode;
}
type Props = {
    ref: React.Ref<SingletonModalRefCreator<TransactionSimulationPopoverProps, boolean>>;
};

const TransactionSimulatorContent = dynamic(() => import('@/modals/TransactionSimulatorModal/SimulatorContent.js'), {
    ssr: false,
    loading: () => null,
});

export function TransactionSimulationPopover({ ref }: Props) {
    const [props, setProps] = useState<TransactionSimulationPopoverProps>();

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen(props) {
            setProps(props);
        },
    });

    return (
        <Popover
            title={<Trans>Review Transaction</Trans>}
            content={
                <TransactionSimulatorContent
                    options={null!}
                    showCloseButton={false}
                    onContinue={() => dispatch?.close(true)}
                    onClose={() => dispatch?.close(false)}
                />
            }
            frame={props?.frame}
            open={open}
            onClose={() => dispatch?.close(false)}
        />
    );
}
