'use client';

import { DialogTitle } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';
import { useCallback, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { type Address, erc20Abi } from 'viem';
import { useAccount } from 'wagmi';
import { readContracts } from 'wagmi/actions';

import CloseIcon from '@/assets/close.svg';
import { ActionButton } from '@/components/ActionButton.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { Modal } from '@/components/Modal.js';
import { FilterPopover } from '@/components/Search/SearchContentPanel.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { config, visibleChains } from '@/configs/wagmiClient.js';
import { enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { useEvmTokens } from '@/hooks/useEvmTokens.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { searchTokenLogoURI } from '@/services/searchTokenLogoURI.js';
import { CustomTokenType, useCustomTokenStore } from '@/store/useCustomTokenStore.js';

function AddCustomERC20ModalContent({ onClose, initialChainId }: { onClose: () => void; initialChainId: number }) {
    const account = useAccount();
    const isMedium = useIsMedium('max');
    const chainIds: number[] = visibleChains.map((x) => x.id);
    const getChainItem = useCallback(
        (chainId: number, isTag?: boolean) => {
            const chain = visibleChains.find((chain) => chain.id === chainId);
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

    const { tokens, isLoading } = useEvmTokens(account.address);
    const addCustomToken = useCustomTokenStore((state) => state.addToken);
    const [{ loading }, onAdd] = useAsyncFn(async () => {
        try {
            if (!account.address) return;
            const address = contractAddress as Address;
            if (tokens.some((x) => isSameAddress(x.id, address))) {
                onClose?.();
                return;
            }
            const erc20Contracts = {
                chainId: selectedChain,
                abi: erc20Abi,
                address,
            };
            const result = await readContracts(config, {
                contracts: [
                    {
                        ...erc20Contracts,
                        functionName: 'decimals',
                    },
                    {
                        ...erc20Contracts,
                        functionName: 'name',
                    },
                    {
                        ...erc20Contracts,
                        functionName: 'symbol',
                    },
                ],
            });
            const [decimals, name, symbol] = result.map((x) => x.result) as [number, string, string];
            if (!decimals || !name || !symbol) {
                enqueueWarningMessage(t`Sorry, we are not able to find this token`);
                return;
            }
            const logoURI = await searchTokenLogoURI({
                name,
                symbol,
                address,
            });
            addCustomToken({
                type: CustomTokenType.ERC20,
                logoURI: logoURI || '',
                chainId: selectedChain,
                address,
                name,
                symbol,
                decimals,
            });
            enqueueSuccessMessage(t`Added successfully`);
            onClose?.();
        } catch (error) {
            enqueueWarningMessage(t`Sorry, we are not able to find this token`);
            throw error;
        }
    }, [account.address, contractAddress, tokens, selectedChain, addCustomToken, onClose]);

    const disabledAdd = [contractAddress, selectedChain, isValidAddressEthereum(contractAddress), account.address].some(
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

export interface AddCustomERC20ModalOpenProps {
    initialChainId: number;
}
type Props = {
    ref: React.Ref<SingletonModalRefCreator<AddCustomERC20ModalOpenProps>>;
};

export function AddCustomERC20Modal({ ref }: Props) {
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
                        <Trans>Add Token</Trans>
                    </span>
                </DialogTitle>
                {props ? <AddCustomERC20ModalContent onClose={onClose} initialChainId={props.initialChainId} /> : null}
            </div>
        </Modal>
    );
}
