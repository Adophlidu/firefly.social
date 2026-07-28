import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/wallet';
import { Link, useNavigate, useRouterState } from '@dimensiondev/ssr';
import { Trans } from '@lingui/react/macro';
import { useSetAtom } from 'jotai';
import { compact } from 'lodash-es';
import { type PropsWithChildren, useCallback, useState } from 'react';

import { BetEntry } from '@/components/Bet/BetEntry.js';
import { DepositModal } from '@/components/DepositModal/index.js';
import { FireflyWalletHomePageUI } from '@/components/FireflyWallet/FireflyWalletHomePageUI.js';
import { PerpsEntry } from '@/components/Perps/PerpsEntry.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { ModalType } from '@/configs/modalRoutes.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { useTotalBalance } from '@/hooks/useTotalBalance.js';
import { resetSwapWalletContext } from '@/store/swap/swapState.js';

export function FireflyWalletHomePage({ children }: PropsWithChildren) {
    const { data: balance = '0', isFetching: isLoadingBalance } = useTotalBalance();
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    const navigate = useNavigate();
    const resetSwapCtx = useSetAtom(resetSwapWalletContext);
    const { pathname: currentPathname, search } = useRouterState();

    const openReceiveModal = useCallback(() => {
        captureWalletTelemetryEvent(WalletTelemetryEventId.WALLET_RECEIVE_CLICK, {});
        const params = new URLSearchParams(search);
        params.set('modal', ModalType.Receive);
        navigate(`${currentPathname}?${params.toString()}`, { replace: true });
    }, [currentPathname, search, navigate]);

    const onDepositModalClose = useCallback(() => {
        setIsDepositModalOpen(false);
    }, []);
    const openDepositModal = useCallback(() => {
        setIsDepositModalOpen(true);
    }, []);

    const openSwap = useCallback(() => {
        captureWalletTelemetryEvent(WalletTelemetryEventId.WALLET_SWAP_CLICK, {});
        resetSwapCtx();
        navigate('/swap');
    }, [navigate, resetSwapCtx]);

    return (
        <>
            <FireflyWalletHomePageUI
                balance={balance}
                loadingBalance={isLoadingBalance}
                className="w-full max-w-[800px]"
                onReceive={openReceiveModal}
                onSend={() => {
                    captureWalletTelemetryEvent(WalletTelemetryEventId.WALLET_SEND_CLICK, {});
                    navigate('/send/tokens');
                }}
                onSwap={openSwap}
                onFund={openDepositModal}
            >
                <BetEntry className="mt-3" />
                {envs.external.NEXT_PUBLIC_PERPS_FEATURES === STATUS.Enabled ? <PerpsEntry className="mt-3" /> : null}
            </FireflyWalletHomePageUI>
            <Tabs
                value={currentPathname}
                onValueChange={(value) => {
                    if (value === '/transactions') {
                        captureWalletTelemetryEvent(WalletTelemetryEventId.WALLET_TRANSACTIONS_TAB_CLICK, {});
                    } else if (value === '/') {
                        captureWalletTelemetryEvent(WalletTelemetryEventId.WALLET_TOKENS_TAB_CLICK, {});
                    }
                    navigate(value);
                }}
                className="sticky top-0 z-10 mb-2 mt-4 w-full max-w-[800px] bg-primaryBottom px-4"
            >
                <TabsList variant="second" className="w-full">
                    {compact([
                        { pathname: '/', label: <Trans>Tokens</Trans> },
                        { pathname: '/transactions', label: <Trans>Transactions</Trans> },
                    ]).map(({ pathname, label }) => {
                        return (
                            <TabsTrigger variant="second" asChild value={pathname} key={pathname}>
                                <Link
                                    href={pathname}
                                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.preventDefault()}
                                >
                                    {label}
                                </Link>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>
            <DepositModal open={isDepositModalOpen} onClose={onDepositModalClose} />
            {children}
        </>
    );
}
