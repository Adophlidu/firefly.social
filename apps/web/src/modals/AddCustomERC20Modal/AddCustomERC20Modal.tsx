'use client';

import { CustomTokenType } from '@dimensiondev/enums';
import { delay } from '@dimensiondev/utils';
import { privyVisibleChains, visibleChains } from '@dimensiondev/web3/chains';
import { isSameAddress, isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useCallback, useMemo, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { type Address, erc20Abi } from 'viem';
import { mainnet } from 'viem/chains';
import { useConnection } from 'wagmi';
import { readContracts } from 'wagmi/actions';

import { ActionButton } from '@/components/ActionButton.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { Modal } from '@/components/Modal.js';
import { FilterPopover } from '@/components/Search/SearchContentPanel.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { useEvmTokens } from '@/hooks/useEvmTokens.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { AddCustomERC20ModalOpenProps, AddCustomERC20ModalRefType } from '@/modals/AddCustomERC20Modal/refs.js';
import { searchTokenLogoURI } from '@/providers/firefly/endpoint/searchTokenLogoURI.js';
import { useCustomTokenStore } from '@/store/useCustomTokenStore.js';

interface AddCustomERC20ModalContentProps {
    onClose: () => void;
    initialChainId?: number;
    validChainIds?: number[];
}

function useVisibleChainIds() {
    const currentConnection = useConnection();
    const isPrivyWallet = !!currentConnection.address && currentConnection.connector?.id === PRIVY_CONNECTOR_ID;

    return useMemo<number[]>(() => {
        return (isPrivyWallet ? privyVisibleChains : visibleChains).map((x) => x.id);
    }, [isPrivyWallet]);
}

function AddCustomERC20ModalContent({
    onClose,
    validChainIds,
    initialChainId = mainnet.id,
}: AddCustomERC20ModalContentProps) {
    const account = useConnection();
    const isMedium = useIsMedium('max');

    const chainIds: number[] = useVisibleChainIds();
    const filteredChainIds = useMemo(
        () => (validChainIds?.length ? chainIds.filter((id) => validChainIds.includes(id)) : chainIds),
        [chainIds, validChainIds],
    );

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
            const result = await readContracts(wagmiConfig, {
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
                enqueueWarningMessage(<Trans>Sorry, we are not able to find this token</Trans>);
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
                chainId: selectedChain!,
                address,
                name,
                symbol,
                decimals,
            });
            enqueueSuccessMessage(<Trans>Added successfully</Trans>);
            onClose?.();
        } catch (error) {
            enqueueWarningMessage(<Trans>Sorry, we are not able to find this token</Trans>);
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
                        data={filteredChainIds}
                        popoverClassName="w-[150px]"
                        onSelected={(x) => {
                            if (x) setSelectedChain(x);
                        }}
                        isSelected={(item, current) => item === current}
                        selected={selectedChain}
                        itemRenderer={getChainItem}
                    />

                    <div className="!bg-lightBg focus-within:border-highlight flex-1 rounded-lg !border border-transparent transition-all">
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
    ref: React.Ref<AddCustomERC20ModalRefType>;
}

export function AddCustomERC20Modal({ ref }: Props) {
    const [props, setProps] = useState<AddCustomERC20ModalOpenProps | undefined>();
    const [open, dispatch, mounted] = useSingletonModal(ref, {
        onOpen(props) {
            setProps(props);
        },
        async onClose() {
            await delay(300); // Wait exit animation
            setProps(undefined);
        },
    });
    const onClose = () => dispatch?.close();

    if (!mounted) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            className="z-50 w-[calc(100%-40px)] md:w-[450px]"
            title={<Trans>Add Token</Trans>}
            enableClose
        >
            {props ? (
                <AddCustomERC20ModalContent
                    onClose={onClose}
                    validChainIds={props.validChainIds}
                    initialChainId={props.initialChainId}
                />
            ) : null}
        </Modal>
    );
}
