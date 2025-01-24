'use client';

import { DialogTitle } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';
import { useNonFungibleCollections } from '@masknet/web3-hooks-base';
import { isSameAddress } from '@masknet/web3-shared-base';
import { isValidAddress, SchemaType } from '@masknet/web3-shared-evm';
import { forwardRef, useCallback, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { type Address } from 'viem';
import { useAccount } from 'wagmi';
import { degen as wagmiDegen } from 'wagmi/chains';

import CloseIcon from '@/assets/close.svg';
import { ActionButton } from '@/components/ActionButton.js';
import { Modal } from '@/components/Modal.js';
import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { FilterPopover } from '@/components/Search/SearchContentPanel.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { chains } from '@/configs/wagmiClient.js';
import { NetworkPluginID } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { AddCustomERC20ModalOpenProps } from '@/modals/AddCustomERC20Modal.js';
import { SimpleHashProvider } from '@/providers/simplehash/index.js';
import { CustomTokenType, useCustomTokenStore } from '@/store/useCustomTokenStore.js';

function AddCustomERC721Content({ onClose, initialChainId }: { onClose: () => void; initialChainId: number }) {
    const account = useAccount();
    const isMedium = useIsMedium('max');
    const chainIds: number[] = chains.map((x) => x.id).filter((x) => !([wagmiDegen.id] as number[]).includes(x));
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

    const { data: allCollections = EMPTY_LIST, isLoading } = useNonFungibleCollections(NetworkPluginID.PLUGIN_EVM, {
        schemaType: SchemaType.ERC721,
        account: account.address,
    });
    const addCustomToken = useCustomTokenStore((state) => state.addToken);
    const [{ loading }, onAdd] = useAsyncFn(async () => {
        try {
            if (!account.address) return;
            const address = contractAddress as Address;
            if (allCollections.some((x) => x.chainId === selectedChain && isSameAddress(x.address, contractAddress))) {
                onClose();
                return;
            }
            const collection = await SimpleHashProvider.getCollection(address, {
                chainId: selectedChain,
            });
            if (!collection) {
                enqueueWarningMessage(t`Sorry, we are not able to find this collection`);
                return;
            }
            addCustomToken({
                type: CustomTokenType.ERC721,
                chainId: selectedChain,
                address,
                name: collection.name,
                simpleHashCollectionId: collection.collection_id,
            });
            enqueueSuccessMessage(t`Added successfully`);
            onClose?.();
        } catch (error) {
            enqueueWarningMessage(t`Sorry, we are not able to find this collection`);
            throw error;
        }
    }, [account.address, contractAddress, allCollections, selectedChain, addCustomToken, onClose]);

    const disabledAdd = [contractAddress, selectedChain, isValidAddress(contractAddress), account.address].some(
        (x) => !x,
    );

    return (
        <>
            <div className="mb-6 flex w-full flex-col">
                <div className="flex items-center gap-2.5">
                    <FilterPopover
                        data={chainIds}
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
                            className="!py-1.5 px-3"
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

export interface AddCustomERC721ModalOpenProps {
    initialChainId: number;
}

export const AddCustomERC721Modal = forwardRef<SingletonModalRefCreator<AddCustomERC721ModalOpenProps>>(
    function AddTokenModal(_, ref) {
        const [props, setProps] = useState<AddCustomERC20ModalOpenProps | undefined>();
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
            <Modal open={open} onClose={onClose} dialogClassName="z-50">
                <div className="z-50 flex h-auto w-[calc(100%-40px)] flex-col rounded-md bg-lightBottom p-4 pt-0 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:w-[450px] md:rounded-xl">
                    <DialogTitle as="h3" className="relative h-14 shrink-0 pt-safe">
                        <CloseIcon
                            onClick={onClose}
                            className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                        />
                        <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                            <Trans>Add Collection</Trans>
                        </span>
                    </DialogTitle>
                    {props ? <AddCustomERC721Content onClose={onClose} initialChainId={props.initialChainId} /> : null}
                </div>
            </Modal>
        );
    },
);
