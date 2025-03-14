'use client';

import { Trans } from '@lingui/react/macro';
import { ChainId as EVMChainId } from '@masknet/web3-shared-evm';
import { ChainId as SolanaChainId } from '@masknet/web3-shared-solana';
import { memo, type ReactNode } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { Image } from '@/components/Image.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { Popover } from '@/components/Popover.js';
import { NetworkPluginID, NetworkType } from '@/constants/enum.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';

interface Props {
    onOpen: (type: NetworkType) => void;
    title?: ReactNode;
    open: boolean;
    onClose: () => void;
    loading?: boolean;
}

const evmNetworkDescriptor = getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, EVMChainId.Mainnet);
const solanaNetworkDescriptor = getNetworkDescriptor(NetworkPluginID.PLUGIN_SOLANA, SolanaChainId.Mainnet);

export const SelectNetworkModalUI = memo<Props>(function SelectChainModalUI({ title, onOpen, open, onClose, loading }) {
    const isMedium = useIsMedium();

    const content = loading ? (
        <div className="flex h-[156px] items-center justify-center">
            <LoadingIcon />
        </div>
    ) : (
        <div className="grid grid-cols-1 gap-3 p-4 text-sm font-bold leading-5 text-second md:grid-cols-2">
            {[
                {
                    icon: evmNetworkDescriptor?.icon,
                    label: <Trans>EVM</Trans>,
                    type: NetworkType.Ethereum,
                },
                {
                    icon: solanaNetworkDescriptor?.icon,
                    label: <Trans>Solana</Trans>,
                    type: NetworkType.Solana,
                },
            ].map((chainType) => {
                return (
                    <ClickableButton
                        key={chainType.type}
                        className="flex flex-col items-center gap-2 rounded-md px-4 py-6 hover:bg-lightBg hover:text-main"
                        onClick={() => {
                            onOpen(chainType.type);
                        }}
                    >
                        <Image
                            src={chainType.icon ?? ''}
                            width={48}
                            height={48}
                            alt={chainType.type}
                            className="h-12 w-12"
                        />
                        <span>{chainType.label}</span>
                    </ClickableButton>
                );
            })}
        </div>
    );

    if (!isMedium) {
        return (
            <Popover open={open} onClose={onClose}>
                {content}
            </Popover>
        );
    }

    return (
        <Modal open={open} onClose={onClose}>
            <div className="transform rounded-[12px] bg-primaryBottom transition-all">
                <div
                    className="relative inline-flex items-center justify-center gap-2 rounded-t-[12px] p-4 text-center md:h-[56px] md:w-[600px]"
                    style={{ background: 'var(--m-modal-title-bg)' }}
                >
                    <CloseButton onClick={onClose} className="absolute left-4 top-4" />
                    <div className="text-lg font-bold leading-6 text-main">
                        {title ?? <Trans>Select Network</Trans>}
                    </div>
                </div>
                {content}
            </div>
        </Modal>
    );
});
