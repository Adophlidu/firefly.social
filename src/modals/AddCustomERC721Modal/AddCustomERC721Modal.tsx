'use client';

import { delay } from '@dimensiondev/utils';
import { DialogTitle } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useCallback, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { type Address } from 'viem';
import { useConnection } from 'wagmi';

import CloseIcon from '@/assets/close.svg';
import { ActionButton } from '@/components/ActionButton.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { Modal } from '@/components/Modal.js';
import { FilterPopover } from '@/components/Search/SearchContentPanel.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { chains } from '@/configs/chains.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useNFTCollections } from '@/hooks/useNFTCollections.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import {
    type AddCustomERC721ModalOpenProps,
    type AddCustomERC721ModalRefType,
} from '@/modals/AddCustomERC721Modal/refs.js';
import { getCollection } from '@/providers/firefly/nft/getCollection.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nftscan/constants.js';
import { CustomTokenType, useCustomTokenStore } from '@/store/useCustomTokenStore.js';
import { EthereumChainId, EthereumSchemaType } from '@/web3-shared/evm/types.js';

const CHAIN_IDS = NFTSCAN_CHAIN_IDS.filter((id) => chains.some((chain) => chain.id === id));

function AddCustomERC721Content({
    onClose,
    initialChainId = EthereumChainId.Mainnet,
}: {
    onClose: () => void;
    initialChainId?: number;
}) {
    const account = useConnection();
    const isMedium = useIsMedium('max');
    const getChainItem = useCallback(
        (chainId: number, isTag?: boolean) => {
            const chain = chains.find((chain) => chain.id === chainId);
            return (
                <div className="flex items-center gap-2">
                    {chain ? (
                        <>
                            <ChainIcon chainId={chainId} size={15} />
                            {isMedium && isTag ? null : <span>{chain.name}</span>}
                        </>
                    ) : (
                        `${chainId}`
                    )}
                </div>
            );
        },
        [isMedium],
    );
    const [contractAddress, setContractAddress] = useState('');
    const [selectedChain, setSelectedChain] = useState(initialChainId);

    const { data: allCollections = EMPTY_LIST, isLoading } = useNFTCollections({
        account: account.address,
        schemaType: EthereumSchemaType.ERC721,
    });
    const addCustomToken = useCustomTokenStore((state) => state.addToken);
    const [{ loading }, onAdd] = useAsyncFn(async () => {
        try {
            if (!account.address) return;
            const address = contractAddress as Address;
            if (
                allCollections.some(
                    (x) => +x.chain_id === selectedChain && isSameAddress(x.contract_address, contractAddress),
                )
            ) {
                onClose();
                return;
            }
            const collection = await getCollection(selectedChain, address);
            if (!collection) {
                enqueueWarningMessage(<Trans>Sorry, we are not able to find this collection</Trans>);
                return;
            }
            addCustomToken({
                type: CustomTokenType.ERC721,
                chainId: selectedChain,
                address,
                name: collection.name,
            });
            enqueueSuccessMessage(<Trans>Added successfully</Trans>);
            onClose?.();
        } catch (error) {
            enqueueWarningMessage(<Trans>Sorry, we are not able to find this collection</Trans>);
            throw error;
        }
    }, [account.address, contractAddress, allCollections, selectedChain, addCustomToken, onClose]);

    const disabledAdd = [contractAddress, selectedChain, isValidAddressEthereum(contractAddress), account.address].some(
        (x) => !x,
    );

    return (
        <>
            <div className="mb-6 flex w-full flex-col">
                <div className="flex items-center gap-2.5">
                    <FilterPopover
                        data={CHAIN_IDS}
                        popoverClassName="w-[150px]"
                        onSelected={(x) => {
                            if (x) setSelectedChain(x);
                        }}
                        isSelected={(item, current) => item === current}
                        selected={selectedChain}
                        itemRenderer={getChainItem}
                    />

                    <div className="flex-1 rounded-lg !border border-transparent !bg-lightBg transition-all focus-within:border-highlight">
                        <SearchInput
                            placeholder={t`Contract address`}
                            className="h-10 !py-1.5 px-3"
                            onChange={(e) => setContractAddress(e.currentTarget.value)}
                            value={contractAddress}
                            onClear={() => setContractAddress('')}
                        />
                    </div>
                </div>
            </div>
            <ActionButton disabled={disabledAdd} loading={loading || isLoading} onClick={onAdd} className="h-10">
                <Trans>Add</Trans>
            </ActionButton>
        </>
    );
}

interface Props {
    ref: React.Ref<AddCustomERC721ModalRefType>;
}

export function AddCustomERC721Modal({ ref }: Props) {
    const [props, setProps] = useState<AddCustomERC721ModalOpenProps | undefined>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen(props) {
            setProps(props);
        },
        async onClose() {
            await delay(300); // Wait exit animation
            setProps(undefined);
        },
    });
    const onClose = () => dispatch?.close();

    return (
        <Modal open={open} onClose={onClose} className="z-50 w-[calc(100%-40px)] md:w-[450px]">
            <div className="flex h-auto transform-gpu flex-col rounded-md bg-lightBottom p-4 pt-0 text-medium text-lightMain shadow-popover">
                <DialogTitle as="h3" className="relative h-14 shrink-0 pt-safe">
                    <CloseIcon
                        onClick={onClose}
                        className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                    />
                    <span className="flex size-full items-center justify-center text-lg font-bold text-main">
                        <Trans>Add Collection</Trans>
                    </span>
                </DialogTitle>
                {props ? <AddCustomERC721Content onClose={onClose} initialChainId={props.initialChainId} /> : null}
            </div>
        </Modal>
    );
}
