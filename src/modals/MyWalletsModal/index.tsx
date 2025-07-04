import { Trans } from '@lingui/react/macro';
import { useCallback } from 'react';

import { CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { ConnectedWallets } from '@/modals/MyWalletsModal/ConnectedWallets.js';

type Props = {
    ref: React.Ref<SingletonModalRefCreator>;
};

export function MyWalletsModal({ ref }: Props) {
    const [open, dispatch] = useSingletonModal(ref, {});

    const onClose = useCallback(() => dispatch?.close(), [dispatch]);

    return (
        <Modal open={open} onClose={onClose}>
            <div className="max-md:h-[100vh] max-md:w-[100vw]">
                <div className="relative flex max-h-[70vh] w-[80vw] max-w-[400px] flex-col rounded-md bg-lightBottom text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom max-md:h-full max-md:max-h-full max-md:w-full max-md:max-w-full md:rounded-xl">
                    <h3 className="relative h-14 shrink-0 pt-safe">
                        <CloseButton onClick={onClose} className="absolute left-4 top-4" />
                        <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                            <Trans>My Wallets</Trans>
                        </span>
                    </h3>
                    <div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto p-6 pt-0">
                        <p className="pb-2 text-sm text-secondary max-md:text-left">
                            <Trans>
                                Please select one EVM wallet and one Solana wallet for onchain features in Firefly.
                            </Trans>
                        </p>
                        <ConnectedWallets onOpenWallets={() => onClose()} />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
