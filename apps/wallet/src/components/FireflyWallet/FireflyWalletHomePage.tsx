import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/wallet';
import { Trans } from '@lingui/react/macro';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import { compact } from 'lodash-es';
import { type PropsWithChildren, useCallback, useState } from 'react';

import { BetEntry } from '@/components/Bet/BetEntry.js';
import { DepositModal } from '@/components/DepositModal/index.js';
import { FireflyWalletHomePageUI } from '@/components/FireflyWallet/FireflyWalletHomePageUI.js';
import { PerpsEntry } from '@/components/Perps/PerpsEntry.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { ModalType } from '@/configs/modalRoutes.js';
import { useTotalBalance } from '@/hooks/useTotalBalance.js';
import { resetSwapWalletContext } from '@/store/swap/swapState.js';

export function FireflyWalletHomePage({ children }: PropsWithChildren) {
    const { data: balance = '0', isFetching: isLoadingBalance } = useTotalBalance();
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

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

    const onDepositModalClose = useCallback(() => {
        setIsDepositModalOpen(false);
    }, []);
    const openDepositModal = useCallback(() => {
        setIsDepositModalOpen(true);
    }, []);

    const openSwap = useCallback(() => {
        resetSwapCtx();
        navigate({ to: '/swap' });
    }, [navigate, resetSwapCtx]);

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
                onFund={openDepositModal}
            >
                <BetEntry className="mt-3" />
                <PerpsEntry className="mt-3" />
            </FireflyWalletHomePageUI>
            <Tabs
                value={currentPathname}
                onValueChange={(value) => navigate({ to: value, resetScroll: false })}
                className="bg-primaryBottom sticky top-0 z-10 mb-2 mt-4 w-full max-w-[800px] px-4"
            >
                <TabsList variant="second" className="w-full">
                    {compact([
                        { pathname: '/', label: <Trans>Tokens</Trans> },
                        envs.external.NEXT_PUBLIC_NFT_FEATURES === STATUS.Enabled
                            ? { pathname: '/nfts', label: <Trans>NFT</Trans> }
                            : null,
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
            <DepositModal open={isDepositModalOpen} onClose={onDepositModalClose} />
            {children}
        </>
    );
}
