import { Trans } from '@lingui/react/macro';
import { type Ref, useCallback } from 'react';

import { Modal } from '@/components/Modal.js';
import { appkit } from '@/configs/appkit.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { ConnectedWallets } from '@/modals/MyWalletsModal/ConnectedWallets.js';
import type { MyWalletsModalRefType } from '@/modals/MyWalletsModal/refs.js';

interface Props {
    ref: Ref<MyWalletsModalRefType>;
}

export function MyWalletsModal({ ref }: Props) {
    const [open, dispatch] = useSingletonModal(ref, {
        name: 'my-wallets-modal',
        onOpen: () => {
            appkit.updateRemoteFeatures({ multiWallet: true });
        },
    });

    const onClose = useCallback(() => dispatch?.close(), [dispatch]);

    return (
        <Modal
            size="sm"
            open={open}
            onClose={onClose}
            title={<Trans>My Wallets</Trans>}
            className="max-md:h-svh"
            enableClose
        >
            <div className="relative flex max-h-[70vh] w-full flex-col bg-lightBottom text-medium text-lightMain transition-all dark:bg-darkBottom max-md:size-full max-md:max-h-full max-md:max-w-full">
                <div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto">
                    <p className="pb-2 text-sm text-secondary max-md:text-left">
                        <Trans>
                            Please select one EVM wallet and one Solana wallet for onchain features in Firefly.
                        </Trans>
                    </p>
                    <ConnectedWallets onOpenWallets={onClose} />
                </div>
            </div>
        </Modal>
    );
}
