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
        chainId: EthereumChainId | SolanaChainId,
        token: string,
    ) => void;
}

interface Account {
    address: string;
    ens?: string;
}

const SOLANA_USDT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const SOLANA_USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const CHAIN_TOKEN_ADDRESSES = [
    {
        name: 'Base',
        chainId: EthereumChainId.Base,
        tokens: [
            { symbol: 'USDT', address: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2' },
            { symbol: 'USDC', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' },
        ],
    },
    {
        name: 'BNB',
        chainId: EthereumChainId.BSC,
        tokens: [
            { symbol: 'USDT', address: '0x55d398326f99059ff775485246999027b3197955' },
            { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' },
        ],
    },
    {
        name: 'Optimism',
        chainId: EthereumChainId.Optimism,
        tokens: [
            { symbol: 'USDT', address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58' },
            { symbol: 'USDC', address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85' },
        ],
    },
    {
        name: 'Arbitrum',
        chainId: EthereumChainId.Arbitrum,
        tokens: [
            { symbol: 'USDT', address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9' },
            { symbol: 'USDC', address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831' },
        ],
    },
];

export function Cashier({ open, onClose, onContinue, price }: CashierProps) {
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const connectedAddresses = useActivityConnectedAddresses();
    const accounts = connectedAddresses.addresses?.map((address) => ({ address })) ?? EMPTY_LIST;
    const currentAccount = selectedAccount ?? accounts[0];

    const isDarkMode = useIsDarkMode();
    const networkType = isValidAddressEthereum(currentAccount?.address) ? NetworkType.Ethereum : NetworkType.Solana;
    const networkIcon = resolveNetworkIcon(networkType, isDarkMode);
    const [evmChainId, setEVMEvmChainId] = useState(EthereumChainId.Base);
    const [token, setToken] = useState<'USDC' | 'USDT'>('USDC');
    const chainId = networkType === NetworkType.Ethereum ? evmChainId : SolanaChainId.Mainnet;

    const { mutate: mutateContinue, isPending } = useMutation({
        async mutationFn() {
            if (!currentAccount?.address) return;
            const tokenAddress =
                chainId === SolanaChainId.Mainnet
                    ? {
                          USDC: SOLANA_USDC,
                          USDT: SOLANA_USDT,
                      }[token]
                    : CHAIN_TOKEN_ADDRESSES.find((item) => item.chainId === chainId)?.tokens.find(
                          (tokenItem) => tokenItem.symbol === token,
                      )?.address;
            if (!tokenAddress) return;
            return onContinue?.(currentAccount?.address, networkType, chainId, tokenAddress);
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
                        {evmChainId ? (
                            networkType === NetworkType.Ethereum ? (
                                <Menu>
                                    <Menu.Button className="relative flex cursor-pointer items-center gap-2">
                                        <ChainIcon chainId={evmChainId} size={24} className="size-6 shrink-0" />
                                        <span className="text-sm text-main">
                                            {EVMChainResolver.chainName(evmChainId as EthereumChainId)}
                                        </span>
                                        <ArrowDownIcon width={10} height={10} className="size-2.5 text-main" />
                                    </Menu.Button>
                                    <Menu.Items className="absolute right-0 top-0 z-50 flex max-h-[200px] w-[150px] flex-col overflow-y-auto rounded-[12px] border border-line bg-primaryBottom shadow-lg">
                                        {CHAIN_TOKEN_ADDRESSES.map((chain) => (
                                            <Menu.Item key={chain.chainId}>
                                                <button
                                                    className="cursor-pointer px-4 py-2 text-left text-sm font-semibold leading-6 hover:bg-main/10"
                                                    onClick={() => {
                                                        setEVMEvmChainId(chain.chainId);
                                                    }}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <ChainIcon
                                                            chainId={chain.chainId}
                                                            size={24}
                                                            className="size-6 shrink-0"
                                                        />
                                                        <span>{chain.name}</span>
                                                    </span>
                                                </button>
                                            </Menu.Item>
                                        ))}
                                    </Menu.Items>
                                </Menu>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <ChainIcon chainId={chainId} size={24} className="size-6 shrink-0" />
                                    <span className="text-sm text-main">
                                        {SolanaChainResolver.chainName(chainId as SolanaChainId)}
                                    </span>
                                </div>
                            )
                        ) : (
                            '-'
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-base text-main">
                            <Trans>Token</Trans>
                        </span>
                        <Menu>
                            <Menu.Button className="relative flex cursor-pointer items-center gap-2">
                                <Image
                                    src={
                                        token === 'USDC'
                                            ? 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694'
                                            : 'https://coin-images.coingecko.com/coins/images/31271/large/usdt.jpeg?1696530095'
                                    }
                                    alt={token}
                                    width={24}
                                    height={24}
                                    className="size-6 rounded-full"
                                />
                                <span className="text-sm text-main">{token}</span>
                                <ArrowDownIcon width={10} height={10} className="size-2.5 text-main" />
                            </Menu.Button>
                            <Menu.Items className="absolute bottom-0 right-0 z-50 flex max-h-[200px] w-[150px] flex-col overflow-y-auto rounded-[12px] border border-line bg-primaryBottom shadow-lg">
                                {(['USDC', 'USDT'] as const).map((symbol) => (
                                    <Menu.Item key={symbol}>
                                        <button
                                            className="flex cursor-pointer items-center px-4 py-2 text-left text-sm font-semibold leading-6 hover:bg-main/10"
                                            onClick={() => {
                                                setToken(symbol);
                                            }}
                                        >
                                            <Image
                                                src={
                                                    symbol === 'USDC'
                                                        ? 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694'
                                                        : 'https://coin-images.coingecko.com/coins/images/31271/large/usdt.jpeg?1696530095'
                                                }
                                                alt={symbol}
                                                width={24}
                                                height={24}
                                                className="mr-2 size-6 rounded-full"
                                            />
                                            {symbol}
                                        </button>
                                    </Menu.Item>
                                ))}
                            </Menu.Items>
                        </Menu>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-base text-main">
                            <Trans>Price</Trans>
                        </span>
                        <span className="text-base text-second">
                            {formatPrice(price)} {networkType === NetworkType.Ethereum ? token : 'USDC'}
                        </span>
                    </div>
                </div>

                <ActionButton onClick={() => mutateContinue()} loading={isPending} disabled={!currentAccount}>
                    <Trans>Continue</Trans>
                </ActionButton>
            </div>
        </Modal>
    );
}
