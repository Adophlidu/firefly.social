import ArrowRightIcon from '@dimensiondev/assets/arrow-right2.svg';
import DepositIcon from '@dimensiondev/assets/deposit.svg';
import WithdrawIcon from '@dimensiondev/assets/withdraw.svg';
import { captureException, ExceptionId } from '@dimensiondev/exception-tracker';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import type { ErrorPageProps } from '@dimensiondev/types';
import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { Suspense } from 'react';
import type { Address } from 'viem';

import { BetError } from '@/components/Bet/BetError.js';
import { BetNavigationBar } from '@/components/Bet/BetNavigationBar.js';
import { HeaderLoading } from '@/components/Bet/HeaderLoading.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { InvalidPolymarketAccountError } from '@/constants/error.js';
import { formatPercentRate } from '@/helpers/formatPercentRate.js';
import { formatPnlUSD } from '@/helpers/formatPnlUSD.js';
import { formatPortfolioUSDCe } from '@/helpers/formatPortfolioUSDCe.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { isZero } from '@/helpers/number.js';
import { cn } from '@/lib/utils.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketProfileListQueryOptions } from '@/queries/firefly/getPolymarketProfileListQueryOptions.js';
import { getPolymarketWithdrawableAmountQueryOptions } from '@/queries/firefly/getPolymarketWithdrawableAmountQueryOptions.js';
import { getPolymarketUserValueQueryOptions } from '@/queries/polymarket/getPolymarketUserValueQueryOptions.js';

const POLYMARKET_HOME_POLL_MS = 10_000;

function BetHomePending() {
    return <HeaderLoading className="px-4 pb-[78px]" />;
}

const betHomeErrorFallback = (props: ErrorPageProps) => <BetError {...props} />;

function betHomeCatchHandler(error: Error) {
    if (!(error instanceof InvalidPolymarketAccountError)) {
        captureException(ExceptionId.UI_CRASH, error, { handler: 'ErrorBoundary' });
    }
}

export const Route = createFileRoute('/bet/_home')({
    component: BetHomeLayout,
    pendingComponent: BetHomePending,
    errorComponent: BetError,
});

function BetHomeLayout() {
    return (
        <div className="flex w-full flex-1 flex-col items-center">
            <BetNavigationBar />
            <div className="flex min-h-[calc(100vh+460px-44px)] w-full flex-col items-center">
                <ErrorBoundary fallback={betHomeErrorFallback} catch={betHomeCatchHandler}>
                    <Suspense fallback={<HeaderLoading className="px-4 pb-[78px]" />}>
                        <ClientLayout />
                    </Suspense>
                    <TabNavigation />
                    <ErrorBoundary fallback={betHomeErrorFallback} catch={betHomeCatchHandler}>
                        <Outlet />
                    </ErrorBoundary>
                </ErrorBoundary>
            </div>
        </div>
    );
}

function TabNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const pathnameInTab = location.pathname;
    const tabs = [
        { path: '/bet', label: <Trans>Positions</Trans> },
        { path: '/bet/order/open', label: <Trans>Open orders</Trans> },
        { path: '/bet/history', label: <Trans>History</Trans> },
    ];

    return (
        <Tabs
            className="bg-primaryBottom sticky top-0 z-10 mb-2 mt-4 w-full px-4"
            value={pathnameInTab}
            onValueChange={(path) => navigate({ to: path, resetScroll: false })}
        >
            <TabsList variant="second" className="w-full">
                {tabs.map(({ path, label }) => (
                    <TabsTrigger key={path} variant="second" value={path}>
                        {label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}

export function ClientLayout() {
    const { data } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const { data: availableBalance } = useSuspenseQuery({
        ...getPolymarketWithdrawableAmountQueryOptions(data.proxyAddress),
        refetchInterval: POLYMARKET_HOME_POLL_MS,
    });

    const { data: polymarketValue } = useSuspenseQuery({
        ...getPolymarketUserValueQueryOptions(data.proxyAddress),
        refetchInterval: POLYMARKET_HOME_POLL_MS,
    });

    const totalBalanceBN = BigNumber(availableBalance ?? 0).plus(polymarketValue ?? 0);
    const portfolioText = formatPortfolioUSDCe(totalBalanceBN);
    const availableText = isZero(availableBalance) ? '$0' : formatTokenUSD(availableBalance, { minDisplay: 0.01 });

    return (
        <>
            <div className="flex flex-col items-center px-4 py-8 text-center">
                <div className="text-main mx-auto mb-2 h-8 w-auto min-w-[100px] truncate text-[40px] font-bold leading-8">
                    {portfolioText}
                </div>
                <div className="text-second h-4 text-[13px] leading-4">
                    <Trans>Available: {availableText}</Trans>
                </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-4 px-3">
                <Link
                    to="/bet/withdraw"
                    className="bg-lightBg flex w-full flex-col items-center gap-0.5 rounded-xl py-2.5 text-sm font-medium"
                >
                    <WithdrawIcon width={24} height={24} className="text-highlight" />
                    <span>
                        <Trans>Withdraw</Trans>
                    </span>
                </Link>
                <Link
                    to="/bet/deposit"
                    className="bg-lightBg flex w-full flex-col items-center gap-0.5 rounded-xl py-2.5 text-sm font-medium"
                >
                    <DepositIcon width={24} height={24} className="text-highlight" />
                    <span>
                        <Trans>Add Funds</Trans>
                    </span>
                </Link>
                <Suspense
                    fallback={<div className="bg-lightBg col-span-2 grid h-[68px] w-full animate-pulse rounded-xl" />}
                >
                    <PNL proxyAddress={data.proxyAddress} />
                </Suspense>
            </div>
        </>
    );
}

function PNL({ proxyAddress }: { proxyAddress: Address }) {
    const { data: profile } = useSuspenseQuery({
        ...getPolymarketProfileListQueryOptions(proxyAddress, true),
        refetchInterval: POLYMARKET_HOME_POLL_MS,
    });

    const pnlValue = profile?.pnl ?? 0;
    const pnlRate = profile?.pnl_rate ?? 0;
    const pnlColor = pnlValue >= 0 ? 'text-success' : 'text-danger';

    return (
        <button
            onClick={() =>
                iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
                    path: `/polymarket/profile/${profile?.proxy ?? proxyAddress}`,
                })
            }
            className="bg-lightBg col-span-2 grid w-full grid-cols-[1fr_1fr_24px] items-center rounded-xl p-4"
        >
            <span className="flex flex-col items-start">
                <span className={cn('text-sm font-semibold', pnlColor)}>{formatPnlUSD(pnlValue)}</span>
                <span className="text-second text-xs">
                    <Trans>PnL</Trans>
                </span>
            </span>
            <span className="flex flex-col items-start">
                <span className={cn('text-sm font-semibold', pnlColor)}>{formatPercentRate(pnlRate)}</span>
                <span className="text-second text-xs">
                    <Trans>PnL%</Trans>
                </span>
            </span>
            <ArrowRightIcon width={24} height={24} className="text-second" />
        </button>
    );
}
