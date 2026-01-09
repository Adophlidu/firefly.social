import { safeUnreachable } from '@dimensiondev/utils';
import { DialogTitle } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useCallback, useState } from 'react';
import { useChainId } from 'wagmi';

import AddIcon from '@/assets/add-circle.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { BackButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { SearchTokenPanel } from '@/components/Search/SearchTokenPanel.js';
import { NetworkType } from '@/constants/enum.js';
import { formatDebankTokenToFungibleToken } from '@/helpers/formatToken.js';
import { useAccountByNetwork } from '@/hooks/useAccountByNetwork.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { AddCustomERC20ModalRef } from '@/modals/AddCustomERC20Modal.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { type Token } from '@/providers/types/Transfer.js';
import { type FungibleToken } from '@/web3-shared/base/specs.js';
import { type EthereumChainId, type EthereumSchemaType } from '@/web3-shared/evm/types.js';

interface TokenSelectorModalOpenProps {
    address: string;
    networkType: NetworkType;
    disableBackdropClose?: boolean;
    isSelected?: (item: Token) => boolean;
    initialAddTokenChainId?: number;
    isConnectRequest?: boolean;
    validChainIds?: number[];
}

type TokenSelectorModalCloseProps = FungibleToken<EthereumChainId, EthereumSchemaType, Token> | null;
interface Props {
    ref: React.Ref<SingletonModalRefCreator<TokenSelectorModalOpenProps, TokenSelectorModalCloseProps>>;
}

export function TokenSelectorModal({ ref }: Props) {
    const [props, setProps] = useState<TokenSelectorModalOpenProps>();
    const isConnectRequest = props?.isConnectRequest ?? true;

    const account = useAccountByNetwork(props?.networkType);

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (newProps) => setProps(newProps),
        onClose: () => setProps(undefined),
    });

    const onSelected = useCallback(
        (token: Token) => dispatch?.close(formatDebankTokenToFungibleToken(token)),
        [dispatch],
    );

    const chainId = useChainId();

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
                    <BackButton
                        onClick={() => dispatch?.close(null)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                    />
                    <span className="flex size-full items-center justify-center text-lg font-bold text-main">
                        <Trans>Select Token</Trans>
                    </span>
                    {[NetworkType.Ethereum].includes(props.networkType) ? (
                        <ClickableButton
                            className="absolute right-0 top-1/2 flex -translate-y-1/2 cursor-pointer items-center space-x-2 text-main"
                            onClick={() => {
                                AddCustomERC20ModalRef.open({
                                    validChainIds: props.validChainIds,
                                    initialChainId: props.initialAddTokenChainId ?? chainId,
                                });
                            }}
                        >
                            <AddIcon width={24} height={24} className="size-6 shrink-0 text-highlight" />
                        </ClickableButton>
                    ) : null}
                </DialogTitle>
                <div className="min-h-0 flex-1">
                    {account.isConnected || !isConnectRequest ? (
                        <SearchTokenPanel
                            networkType={props.networkType}
                            address={props.address}
                            validChainIds={props.validChainIds}
                            isSelected={props.isSelected}
                            onSelected={onSelected}
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center">
                            <ClickableButton
                                className="h-10 rounded-full border border-main px-3 text-lg font-bold leading-10 text-main"
                                onClick={() => {
                                    switch (props.networkType) {
                                        case NetworkType.Ethereum:
                                        case NetworkType.Solana:
                                            WalletConnectModalRef.open({ networkType: props.networkType });
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
}

export const TokenSelectorModalRef = new SingletonModal<TokenSelectorModalOpenProps, TokenSelectorModalCloseProps>();
