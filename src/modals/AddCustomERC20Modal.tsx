'use client';

import { delay } from '@firefly/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useCallback, useMemo, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { type Address, erc20Abi } from 'viem';
import { useAccount } from 'wagmi';
import { readContracts } from 'wagmi/actions';

import { ActionButton } from '@/components/ActionButton.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { Modal } from '@/components/Modal.js';
import { FilterPopover } from '@/components/Search/SearchContentPanel.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { privyVisibleChains, visibleChains } from '@/configs/chains.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { useEvmTokens } from '@/hooks/useEvmTokens.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { ConnectionSource, useWalletConnections } from '@/hooks/useWalletConnections.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { searchTokenLogoURI } from '@/services/searchTokenLogoURI.js';
import { CustomTokenType, useCustomTokenStore } from '@/store/useCustomTokenStore.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export interface AddCustomERC20ModalContentProps {
    onClose: () => void;
    initialChainId?: number;
}

function useVisibleChainIds() {
    const connections = useWalletConnections();
    const isPrivyWallet = connections.some((x) => x.source === ConnectionSource.Privy && x.connected);
    const chainIds: number[] = useMemo(() => {
        return (isPrivyWallet ? privyVisibleChains : visibleChains).map((x) => x.id);
    }, [isPrivyWallet]);
    return chainIds;
}

function AddCustomERC20ModalContent({
    onClose,
    initialChainId = EthereumChainId.Mainnet,
}: AddCustomERC20ModalContentProps) {
    const account = useAccount();
    const isMedium = useIsMedium('max');

    const chainIds: number[] = useVisibleChainIds();

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

export interface AddCustomERC20ModalOpenProps extends Pick<AddCustomERC20ModalContentProps, 'initialChainId'> {}

type Props = {
    ref: React.Ref<SingletonModalRefCreator<AddCustomERC20ModalOpenProps>>;
};

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
            {props ? <AddCustomERC20ModalContent onClose={onClose} initialChainId={props.initialChainId} /> : null}
        </Modal>
    );
}

export const AddCustomERC20ModalRef = new SingletonModal<AddCustomERC20ModalOpenProps>();
