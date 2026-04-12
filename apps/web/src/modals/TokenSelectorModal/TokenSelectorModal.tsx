import AddIcon from '@dimensiondev/assets/add-circle.svg';
import { safeUnreachable } from '@dimensiondev/utils';
import { DialogTitle } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useCallback, useState } from 'react';
import { useChainId } from 'wagmi';

import { ClickableButton } from '@/components/ClickableButton.js';
import { BackButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { SearchTokenPanel } from '@/components/Search/SearchTokenPanel.js';
import { NetworkType } from '@/constants/enum.js';
import { formatDebankTokenToFungibleToken } from '@/helpers/formatToken.js';
import { useAccountByNetwork } from '@/hooks/useAccountByNetwork.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { AddCustomERC20ModalRef } from '@/modals/AddCustomERC20Modal/refs.js';
import type { TokenSelectorModalOpenProps, TokenSelectorModalRefType } from '@/modals/TokenSelectorModal/refs.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import type { Token } from '@/providers/types/Transfer.js';

interface Props {
    ref: React.Ref<TokenSelectorModalRefType>;
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
            <div className="bg-lightBottom text-medium text-lightMain shadow-popover dark:bg-darkBottom z-50 flex h-[70vh] w-4/5 flex-col rounded-md p-4 pt-0 transition-all md:h-[620px] md:w-[600px] md:rounded-xl">
                <DialogTitle as="h3" className="pt-safe relative h-14 shrink-0">
                    <BackButton
                        onClick={() => dispatch?.close(null)}
                        className="text-main absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer"
                    />
                    <span className="text-main flex size-full items-center justify-center text-lg font-bold">
                        <Trans>Select Token</Trans>
                    </span>
                    {[NetworkType.Ethereum].includes(props.networkType) ? (
                        <ClickableButton
                            className="text-main absolute right-0 top-1/2 flex -translate-y-1/2 cursor-pointer items-center space-x-2"
                            onClick={() => {
                                AddCustomERC20ModalRef.open({
                                    validChainIds: props.validChainIds,
                                    initialChainId: props.initialAddTokenChainId ?? chainId,
                                });
                            }}
                        >
                            <AddIcon width={24} height={24} className="text-highlight size-6 shrink-0" />
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
                                className="border-main text-main h-10 rounded-full border px-3 text-lg font-bold leading-10"
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
