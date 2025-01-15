import { DialogTitle } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';
import { type FungibleToken } from '@masknet/web3-shared-base';
import { ChainId, SchemaType } from '@masknet/web3-shared-evm';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { forwardRef, useCallback, useState } from 'react';

import LeftArrowIcon from '@/assets/left-arrow.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Modal } from '@/components/Modal.js';
import { SearchTokenPanel } from '@/components/Search/SearchTokenPanel.js';
import { NetworkType } from '@/constants/enum.js';
import { formatDebankTokenToFungibleToken } from '@/helpers/formatToken.js';
import { useAccountByNetwork } from '@/hooks/useAccountByNetwork.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { ConnectModalRef } from '@/modals/controls.js';
import type { Token } from '@/providers/types/Transfer.js';

export interface TokenSelectorModalOpenProps {
    address: string;
    networkType: NetworkType;
    disableBackdropClose?: boolean;
    isSelected?: (item: Token) => boolean;
}

export type TokenSelectorModalCloseProps = FungibleToken<ChainId, SchemaType> | null;

export const TokenSelectorModal = forwardRef<
    SingletonModalRefCreator<TokenSelectorModalOpenProps, TokenSelectorModalCloseProps>
>(function TokenSelectorModal(_, ref) {
    const [props, setProps] = useState<TokenSelectorModalOpenProps>();

    const solanaWalletModal = useWalletModal();
    const account = useAccountByNetwork(props?.networkType);

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (newProps) => setProps(newProps),
        onClose: () => setProps(undefined),
    });

    const onSelected = useCallback(
        (token: Token) => dispatch?.close(formatDebankTokenToFungibleToken(token)),
        [dispatch],
    );

    if (!props) return null;

    return (
        <Modal
            open={open}
            disableBackdropClose={props.disableBackdropClose}
            onClose={() => dispatch?.close(null)}
            dialogClassName="z-50"
        >
            <div className="z-50 flex h-[70vh] w-4/5 flex-col rounded-md bg-lightBottom p-4 pt-0 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:h-[620px] md:w-[600px] md:rounded-xl">
                <DialogTitle as="h3" className="relative h-14 shrink-0 pt-safe">
                    <LeftArrowIcon
                        onClick={() => dispatch?.close(null)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                    />
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                        <Trans>Select Token</Trans>
                    </span>
                </DialogTitle>
                <div className="min-h-0 flex-1 overflow-hidden">
                    {account.isConnected ? (
                        <SearchTokenPanel
                            networkType={props.networkType}
                            address={props.address}
                            isSelected={props.isSelected}
                            onSelected={onSelected}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <ClickableButton
                                className="h-10 rounded-full border border-main px-3 text-lg font-bold leading-10 text-main"
                                onClick={() => {
                                    switch (props.networkType) {
                                        case NetworkType.Ethereum:
                                            ConnectModalRef.open();
                                            break;
                                        case NetworkType.Solana:
                                            solanaWalletModal.setVisible(true);
                                            break;
                                        default:
                                            safeUnreachable(props.networkType);
                                    }
                                }}
                            >
                                <Trans>Connect Wallet</Trans>
                            </ClickableButton>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
});
