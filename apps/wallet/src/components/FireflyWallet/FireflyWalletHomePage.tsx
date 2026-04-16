import { chains } from '@dimensiondev/web3/chains';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useFundWallet } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import { compact } from 'lodash-es';
import { type PropsWithChildren, useCallback } from 'react';

import { BetEntry } from '@/components/Bet/BetEntry.js';
import { Confirm } from '@/components/ConfirmModal.js';
import { FireflyWalletHomePageUI } from '@/components/FireflyWallet/FireflyWalletHomePageUI.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { ModalType } from '@/configs/modalRoutes.js';
import { NFT_ENABLED } from '@/constants/static.js';
import { useEmbeddedEvmAddress } from '@/hooks/useCachedWalletAddresses.js';
import { useTotalBalance } from '@/hooks/useTotalBalance.js';
import { resetSwapWalletContext } from '@/store/swap/swapState.js';

export function FireflyWalletHomePage({ children }: PropsWithChildren) {
    const queryClient = useQueryClient();
    const { data: balance = '0', refetch: refetchBalance, isFetching: isLoadingBalance } = useTotalBalance();
    const firstEvmWallet = useEmbeddedEvmAddress();

    const navigate = useNavigate();
    const resetSwapCtx = useSetAtom(resetSwapWalletContext);
    const location = useLocation();
    const currentPathname = location.pathname;

    const openReceiveModal = useCallback(() => {
        navigate({
            to: location.pathname,
            search: { modal: ModalType.Receive },
            replace: true,
        });
    }, [location.pathname, navigate]);

    const openSwap = useCallback(() => {
        resetSwapCtx();
        navigate({ to: '/swap' });
    }, [navigate, resetSwapCtx]);

    const { fundWallet } = useFundWallet();
    const fund = useCallback(async () => {
        if (!firstEvmWallet) return;

        try {
            const result = await fundWallet({
                address: firstEvmWallet,
                options: {
                    amount: '0.01',
                    uiConfig: {
                        landing: {
                            title: t`Select a method for funding your Firefly wallet.`,
                        },
                    },
                },
            });
            if (result.status === 'cancelled') return;
            const addresses = compact([firstEvmWallet?.toLowerCase()]);
            const chainIds = chains.map((x) => x.id);
            await Promise.all([
                queryClient.refetchQueries({
                    queryKey: ['multi-chain-token', ...addresses, chainIds],
                }),
                refetchBalance(),
                queryClient.refetchQueries({
                    queryKey: ['wallet-transaction-history', firstEvmWallet?.toLowerCase(), chainIds],
                }),
            ]);
        } catch (err) {
            if ((err as Error).message.includes('Wallet funding is not enabled')) {
                await Confirm.call({
                    title: <Trans>Funding</Trans>,
                    message: <Trans>Wallet funding is not enabled</Trans>,
                    buttonLabel: <Trans>OK</Trans>,
                });
            }
        }
    }, [fundWallet, firstEvmWallet, queryClient, refetchBalance]);

    return (
        <>
            <FireflyWalletHomePageUI
                balance={balance}
                loadingBalance={isLoadingBalance}
                className="w-full max-w-[800px]"
                onReceive={openReceiveModal}
                onSend={() => {
                    navigate({ to: '/send/tokens' });
                }}
                onSwap={openSwap}
                onFund={fund}
            >
                <BetEntry className="mt-3" />
            </FireflyWalletHomePageUI>
            <Tabs
                value={currentPathname}
                onValueChange={(value) => navigate({ to: value, resetScroll: false })}
                className="bg-primaryBottom sticky top-0 z-10 mb-2 mt-4 w-full max-w-[800px] px-4"
            >
                <TabsList variant="second" className="w-full">
                    {compact([
                        { pathname: '/', label: <Trans>Tokens</Trans> },
                        NFT_ENABLED ? { pathname: '/nfts', label: <Trans>NFT</Trans> } : null,
                        { pathname: '/transactions', label: <Trans>Transactions</Trans> },
                    ]).map(({ pathname, label }) => {
                        return (
                            <TabsTrigger variant="second" asChild value={pathname} key={pathname}>
                                <Link
                                    to={pathname}
                                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.preventDefault()}
                                >
                                    {label}
                                </Link>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>
            {children}
        </>
    );
}
