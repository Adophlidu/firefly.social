import { DialogTitle } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { isValidAddress } from '@masknet/web3-shared-evm';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { type Address } from 'viem';
import { useAccount, useChainId } from 'wagmi';

import CloseIcon from '@/assets/close.svg';
import { ActionButton } from '@/components/ActionButton.js';
import { Modal } from '@/components/Modal.js';
import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { FilterPopover } from '@/components/Search/SearchContentPanel.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { chains } from '@/configs/wagmiClient.js';
import { enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { SimpleHashProvider } from '@/providers/simplehash/index.js';
import { CustomTokenType, useCustomTokenStore } from '@/store/useCustomTokenStore.js';

function AddCustomERC721Content({ onClose }: { onClose: () => void }) {
    const account = useAccount();
    const isMedium = useIsMedium('max');
    const chainIds: number[] = chains.map((x) => x.id);
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
    const chainId = useChainId();
    const [selectedChain, setSelectedChain] = useState(chainId);
    useEffect(() => {
        setSelectedChain(chainId);
    }, [chainId]);

    const addCustomToken = useCustomTokenStore((state) => state.addToken);
    const [{ loading }, onAdd] = useAsyncFn(async () => {
        try {
            if (!account.address) return;
            const address = contractAddress as Address;
            const collection = await SimpleHashProvider.getCollection(address, {
                chainId,
            });
            if (!collection) {
                enqueueWarningMessage(t`Sorry, we are not able to find this token`);
                return;
            }
            addCustomToken({
                type: CustomTokenType.ERC721,
                chainId,
                address,
                name: collection.name,
                simpleHashCollectionId: collection.collection_id,
            });
            enqueueSuccessMessage(t`Added successfully`);
            onClose?.();
        } catch (error) {
            enqueueWarningMessage(t`Sorry, we are not able to find this token`);
            throw error;
        }
    }, [account.address, contractAddress, chainId, addCustomToken, onClose]);

    const disabledAdd = [contractAddress, chainId, isValidAddress(contractAddress), account.address].some((x) => !x);

    return (
        <>
            <div className="mb-6 flex w-full flex-col">
                <div className="flex items-center gap-2.5">
                    <FilterPopover
                        placeholder={t`Select chain`}
                        data={chainIds}
                        popoverClassName="w-[150px]"
                        onSelected={(x) => {
                            if (x) setSelectedChain(x);
                        }}
                        selected={selectedChain}
                        itemRenderer={getChainItem}
                    />

                    <div className="flex-1 rounded-lg !border border-transparent !bg-lightBg transition-all focus-within:border-highlight">
                        <SearchInput
                            placeholder={t`Contract address`}
                            className="!py-1.5 px-3"
                            onChange={(e) => setContractAddress(e.currentTarget.value)}
                            value={contractAddress}
                        />
                    </div>
                </div>
            </div>
            <ActionButton disabled={disabledAdd} loading={loading} onClick={onAdd} className="h-10">
                <Trans>Add</Trans>
            </ActionButton>
        </>
    );
}

export const AddCustomERC721Modal = forwardRef<SingletonModalRefCreator>(function AddTokenModal(_, ref) {
    const [open, dispatch] = useSingletonModal(ref);
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
                        <Trans>Select Collection</Trans>
                    </span>
                </DialogTitle>
                <AddCustomERC721Content onClose={onClose} />
            </div>
        </Modal>
    );
});
