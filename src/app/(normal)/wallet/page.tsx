'use client';

import { Trans } from '@lingui/react/macro';
import { BigNumber } from 'bignumber.js';
import { compact } from 'lodash-es';
import { notFound, redirect } from 'next/navigation.js';
import { Suspense, useMemo, useState } from 'react';
import { type Address } from 'viem';

import AddIcon from '@/assets/add-circle.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { FireflyWalletChainSelectorWithNetworkType } from '@/components/FireflyWallet/FireflyWalletChainSelectorWithNetworkType.js';
import { FireflyWalletHomePageUI } from '@/components/FireflyWallet/FireflyWalletHomePageUI.js';
import { FireflyWalletTokenList } from '@/components/FireflyWallet/FireflyWalletTokenList.js';
import { ReceiveModal } from '@/components/FireflyWallet/ReceiveModal/index.js';
import { SelectPrivyWalletGuard } from '@/components/FireflyWallet/SelectPrivyWalletGuard.js';
import { SendTransactionModal } from '@/components/FireflyWallet/SendTransactionModal/SendTransactionModal.js';
import { Loading } from '@/components/Loading.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { Tab, Tabs } from '@/components/Tabs/index.js';
import { privyVisibleChains, visibleChains } from '@/configs/chains.js';
import { NetworkPluginID, NetworkType, Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { dynamic } from '@/esm/dynamic.js';
import { useRouter } from '@/esm/navigation.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { plus } from '@/helpers/number.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useIsCreatedPrivyWallet } from '@/hooks/useIsCreatedPrivyWallet.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useMixesTokens } from '@/hooks/useMixesTokens.js';
import { AddCustomERC20ModalRef } from '@/modals/AddCustomERC20Modal.js';
import { SwapModalRef } from '@/modals/SwapModal/SwapModal.js';
import { captureFireflyWalletEvent } from '@/providers/telemetry/captureFireflyWalletEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

const TransactionHistory = dynamic(() => import('@/components/TransactionHistory/list.js'), {
    ssr: false,
    loading: () => <Loading />,
});
const NFTs = dynamic(() => import('@/components/Profile/NFTs.js'), {
    ssr: false,
    loading: () => <Loading />,
});

const EVM_TRANSACTION_CHAIN_IDS = visibleChains.map((chain) => chain.id);
const SOLANA_TRANSACTION_CHAIN_IDS = [101];

export default function Wallet() {
    const isLoginFirefly = useIsLoginFirefly();
    const ready = usePrivyWalletStore((state) => state.ready);
    const { isLoading, error, isCreatedPrivyWallet } = useIsCreatedPrivyWallet();

    if (env.external.NEXT_PUBLIC_PRIVY === STATUS.Disabled) {
        redirect('/');
    }

    if (!isLoginFirefly) {
        return <NotLoginFallback source={Source.NFTs} />;
    }

    if (!ready || isLoading || !isCreatedPrivyWallet) {
        return <Loading />;
    }

    if (error) {
        notFound();
    }

    return (
        <SelectPrivyWalletGuard>
            {env.external.NEXT_PUBLIC_FIREFLY_WALLET_IFRAME === STATUS.Enabled ? (
                <iframe src="https://firefly.social/wallet-iframe" className="h-full w-full" />
            ) : (
                <FireflyWallet />
            )}
        </SelectPrivyWalletGuard>
    );
}

export const enum TabType {
    Token = 'token',
    NFT = 'nft',
    Transactions = 'transactions',
}

function FireflyWallet() {
    const { ethereum, solana } = useWalletAccountAll();
    const router = useRouter();

    const [networkType, setNetworkType] = useState<NetworkType>(NetworkType.Ethereum);
    const address = useMemo(() => {
        switch (networkType) {
            case NetworkType.Ethereum:
                return ethereum.address;
            case NetworkType.Solana:
                return solana.address;
            default:
                safeUnreachable(networkType);
                return;
        }
    }, [ethereum, networkType, solana]);

    const { tokens, isLoading: isLoadingTokens } = useMixesTokens({
        evmAddress: ethereum.address as Address,
        solanaAddress: solana?.address,
    });

    const totalBalance = tokens.reduce((acc, token) => plus(acc, token.usdValue), BigNumber('0'));

    const [tabType, setTabType] = useState(TabType.Token);
    const [openReceiveModal, setOpenReceiveModal] = useState(false);
    const [openSendTransactionModal, setOpenTransactionModal] = useState(false);

    const receiveItems = useMemo(() => {
        const items = privyVisibleChains.map((chain) => ({
            avatar: getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, chain.id)?.icon ?? '',
            name: chain.name as string,
            address: ethereum.address,
        }));
        if (solana.address) {
            items.splice(1, 0, {
                avatar: getNetworkDescriptor(NetworkPluginID.PLUGIN_SOLANA, SolanaChainId.Mainnet)?.icon ?? '',
                name: 'Solana',
                address: solana.address,
            });
        }
        return items;
    }, [ethereum.address, solana.address]);

    if (!address) {
        return <Loading />;
    }

    return (
        <FireflyWalletHomePageUI
            balance={totalBalance.toString() ?? '0'}
            loadingBalance={isLoadingTokens}
            onSend={() => {
                captureFireflyWalletEvent(EventId.FIREFLY_WALLET_SEND_CLICK, {});
                setOpenTransactionModal(true);
            }}
            onReceive={() => {
                captureFireflyWalletEvent(EventId.FIREFLY_WALLET_RECEIVE_CLICK, {});
                setOpenReceiveModal(true);
            }}
            onSwap={() => {
                captureFireflyWalletEvent(EventId.FIREFLY_WALLET_SWAP_CLICK, {});
                SwapModalRef.open({
                    providerSwitchable: true,
                });
            }}
        >
            <SendTransactionModal open={openSendTransactionModal} onClose={() => setOpenTransactionModal(false)} />
            <ReceiveModal open={openReceiveModal} onClose={() => setOpenReceiveModal(false)} items={receiveItems} />
            <div className="flex w-full flex-col">
                <div className="relative flex items-center justify-between">
                    <Tabs
                        variant="subtle"
                        onChange={(x) => {
                            switch (x) {
                                case TabType.Token:
                                    captureFireflyWalletEvent(EventId.FIREFLY_WALLET_TOKENS_TAB_CLICK, {});
                                    break;
                                case TabType.NFT:
                                    captureFireflyWalletEvent(EventId.FIREFLY_WALLET_NFTS_TAB_CLICK, {});
                                    break;
                                case TabType.Transactions:
                                    captureFireflyWalletEvent(EventId.FIREFLY_WALLET_TRANSACTIONS_TAB_CLICK, {});
                                    break;
                            }
                            setTabType(x);
                        }}
                        value={tabType}
                    >
                        <Tab value={TabType.Token}>
                            <Trans>Token</Trans>
                        </Tab>
                        <Tab value={TabType.NFT}>
                            <Trans>NFT</Trans>
                        </Tab>
                        <Tab value={TabType.Transactions}>
                            <Trans>Transactions</Trans>
                        </Tab>
                    </Tabs>
                    <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center">
                        {tabType === TabType.Token && [NetworkType.Ethereum].includes(networkType) ? (
                            <ClickableButton
                                className="text-md flex cursor-pointer items-center space-x-2 text-main"
                                onClick={() => {
                                    AddCustomERC20ModalRef.open({
                                        initialChainId: EthereumChainId.Mainnet,
                                    });
                                }}
                            >
                                <AddIcon width={24} height={24} className="size-6 shrink-0 text-highlight" />
                            </ClickableButton>
                        ) : null}
                        {tabType === TabType.Transactions ? (
                            <FireflyWalletChainSelectorWithNetworkType
                                selectedChain={networkType}
                                onSelectChain={(x) => {
                                    captureFireflyWalletEvent(EventId.FIREFLY_WALLET_CHAIN_FILTER_CLICK, {
                                        chain_type: x === NetworkType.Ethereum ? 'EVM' : 'Sol',
                                    });
                                    setNetworkType(x);
                                }}
                            />
                        ) : null}
                    </div>
                </div>
                {tabType === TabType.Token ? (
                    <FireflyWalletTokenList
                        tokens={tokens}
                        isLoading={isLoadingTokens}
                        onClickToken={(token) => {
                            const url = resolveTokenPageUrl({
                                chainId: token.chainId,
                                identity: token.symbol,
                            });
                            router.push(url);
                        }}
                    />
                ) : null}
                {tabType === TabType.NFT ? (
                    <Suspense fallback={<Loading />}>
                        <NFTs address={address} addresses={compact([ethereum.address, solana.address])} />
                    </Suspense>
                ) : null}
                {tabType === TabType.Transactions ? (
                    <Suspense fallback={<Loading />}>
                        <TransactionHistory
                            address={address}
                            chains={
                                networkType === NetworkType.Ethereum
                                    ? EVM_TRANSACTION_CHAIN_IDS
                                    : SOLANA_TRANSACTION_CHAIN_IDS
                            }
                        />
                    </Suspense>
                ) : null}
            </div>
        </FireflyWalletHomePageUI>
    );
}
