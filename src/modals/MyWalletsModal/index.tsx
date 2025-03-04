import { Trans } from '@lingui/react/macro';
import { forwardRef, useCallback } from 'react';

import SettingIcon from '@/assets/setting.svg';
import { CloseButton } from '@/components/IconButton.js';
import { Link } from '@/components/Link.js';
import { Modal } from '@/components/Modal.js';
import { Tooltip } from '@/components/Tooltip.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { ConnectedWallets } from '@/modals/MyWalletsModal/ConnectedWallets.js';

export const MyWalletsModal = forwardRef<SingletonModalRefCreator>(function MyWalletsModal(_, ref) {
    const [open, dispatch] = useSingletonModal(ref, {});

    const onClose = useCallback(() => dispatch?.close(), [dispatch]);

    return (
        <Modal open={open} onClose={onClose}>
            <div>
                <div className="relative flex max-h-[70vh] w-[80vw] max-w-[400px] flex-col rounded-md bg-lightBottom text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:rounded-xl">
                    <h3 className="relative h-14 shrink-0 pt-safe">
                        <CloseButton onClick={onClose} className="absolute left-4 top-4" />
                        <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                            <Trans>My Wallets</Trans>
                        </span>
                        <Tooltip placement="top" content={<Trans>Connected wallets</Trans>}>
                            <Link
                                href={'/settings/wallets'}
                                className="absolute right-4 top-4 text-main"
                                onClick={onClose}
                            >
                                <SettingIcon width={24} height={24} />
                            </Link>
                        </Tooltip>
                    </h3>
                    <div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto p-6 pt-0">
                        <p className="pb-2 text-sm text-secondary">
                            <Trans>
                                Please select one EVM wallet and one Solana wallet for onchain features in Firefly.
                            </Trans>
                        </p>
                        <ConnectedWallets />
                    </div>
                </div>
            </div>
        </Modal>
    );
});
