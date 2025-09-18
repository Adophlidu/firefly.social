'use client';

import { Menu } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import AddCircleIcon from '@/assets/add-circle.svg';
import ArrowDownIcon from '@/assets/arrow-line-down.svg';
import { ActionButton } from '@/components/ActionButton.js';
import { useActivityConnectedAddresses } from '@/components/Activity/hooks/useActivityConnectedAddresses.js';
import { useActivityConnectWallet } from '@/components/Activity/hooks/useActivityConnectWallet.js';
import { Avatar } from '@/components/Avatar.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { Image } from '@/components/Image.js';
import { Modal } from '@/components/Modal.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { resolveNetworkIcon } from '@/helpers/resolveNetworkIcon.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { EVMChainResolver } from '@/web3-providers/Web3/EVM/apis/ResolverAPI.js';
import { SolanaChainResolver } from '@/web3-providers/Web3/Solana/apis/ResolverAPI.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

interface CashierProps {
    open: boolean;
    onClose: () => void;
    price: number;
    onContinue?: (
        address: string,
        networkType: NetworkType,
        chainId: EthereumChainId.Base | SolanaChainId.Mainnet,
    ) => void;
}

interface Account {
    address: string;
    ens?: string;
}

export function Cashier({ open, onClose, onContinue, price }: CashierProps) {
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const connectedAddresses = useActivityConnectedAddresses();
    const accounts = connectedAddresses.addresses?.map((address) => ({ address })) ?? EMPTY_LIST;
    const currentAccount = selectedAccount ?? accounts[0];

    const isDarkMode = useIsDarkMode();
    const networkType = isValidAddressEthereum(currentAccount?.address) ? NetworkType.Ethereum : NetworkType.Solana;
    const networkIcon = resolveNetworkIcon(networkType, isDarkMode);
    const chainId = networkType === NetworkType.Ethereum ? EthereumChainId.Base : SolanaChainId.Mainnet;

    const { mutate: mutateContinue, isPending } = useMutation({
        async mutationFn() {
            if (!currentAccount?.address) return;
            return onContinue?.(currentAccount?.address, networkType, chainId);
        },
    });

    const addWallet = useActivityConnectWallet();

    return (
        <Modal open={open} onClose={onClose} size="sm" title={<Trans>Transaction</Trans>} enableClose>
            <div className="relative space-y-6">
                <Menu>
                    {currentAccount ? (
                        <Menu.Button className="flex w-full items-center justify-between rounded-xl bg-bg p-4">
                            <span className="flex items-center gap-3">
                                <span className="relative w-9">
                                    <Avatar
                                        size={36}
                                        alt={currentAccount.address}
                                        src={getStampAvatarByProfileId(Source.Wallet, currentAccount.address)}
                                    />
                                    {networkIcon ? (
                                        <Image
                                            src={networkIcon}
                                            alt={networkType}
                                            width={14}
                                            height={14}
                                            className="absolute -right-1 bottom-0 z-10 size-[14px] rounded-full border border-main"
                                        />
                                    ) : null}
                                </span>
                                <span className="flex flex-col items-center">
                                    <span className="text-base font-bold text-main">
                                        {formatAddress(currentAccount.address, 4)}
                                    </span>
                                </span>
                            </span>
                            <ArrowDownIcon width={18} height={18} className="size-[18px] text-main" />
                        </Menu.Button>
                    ) : null}
                    <Menu.Items className="absolute left-0 top-0 z-50 flex max-h-[200px] w-[200px] flex-col overflow-y-auto rounded-[12px] border border-line bg-primaryBottom shadow-lg">
                        {accounts.map((item) => {
                            const { address } = item;
                            return (
                                <Menu.Item key={address}>
                                    <button
                                        className="cursor-pointer px-4 py-2 text-left text-sm font-semibold leading-6 hover:bg-main/10"
                                        onClick={() => {
                                            setSelectedAccount(item);
                                        }}
                                    >
                                        {formatAddress(address, 4)}
                                    </button>
                                </Menu.Item>
                            );
                        })}
                        <Menu.Item>
                            <button
                                className="flex cursor-pointer items-center justify-start px-4 py-2 text-sm font-semibold leading-6 hover:bg-main/10"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const address = await addWallet();
                                    if (address) setSelectedAccount({ address });
                                }}
                            >
                                <AddCircleIcon width={24} height={24} className="mr-2" />
                                {fireflyBridgeProvider.supported ? (
                                    <Trans>Connect Wallet</Trans>
                                ) : (
                                    <Trans>Add Wallet</Trans>
                                )}
                            </button>
                        </Menu.Item>
                    </Menu.Items>
                </Menu>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-base text-main">
                            <Trans>Chain</Trans>
                        </span>
                        {chainId ? (
                            <div className="flex items-center gap-2">
                                <ChainIcon chainId={chainId} size={16} className="size-4 shrink-0" />
                                <span className="text-sm text-second">
                                    {networkType === NetworkType.Ethereum
                                        ? EVMChainResolver.chainName(chainId as EthereumChainId)
                                        : SolanaChainResolver.chainName(chainId as SolanaChainId)}
                                </span>
                            </div>
                        ) : (
                            '-'
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-base text-main">
                            <Trans>Price</Trans>
                        </span>
                        <span className="text-base text-second">{formatPrice(price)} USDC</span>
                    </div>
                </div>

                <ActionButton onClick={() => mutateContinue()} loading={isPending} disabled={!currentAccount}>
                    <Trans>Continue</Trans>
                </ActionButton>
            </div>
        </Modal>
    );
}
