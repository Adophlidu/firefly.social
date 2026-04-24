import ArrowRightIcon from '@dimensiondev/assets/arrow-right2.svg';
import DepositIcon from '@dimensiondev/assets/deposit.svg';
import WithdrawIcon from '@dimensiondev/assets/withdraw.svg';
import { captureException, ExceptionId } from '@dimensiondev/exception-tracker';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import type { ErrorPageProps } from '@dimensiondev/types';
import { isZero } from '@dimensiondev/web3/numbers';
import { Trans } from '@lingui/react/macro';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { Suspense, useCallback } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';

import { BetError } from '@/components/Bet/BetError.js';
import { BetNavigationBar } from '@/components/Bet/BetNavigationBar.js';
import { HeaderLoading } from '@/components/Bet/HeaderLoading.js';
import { Confirm } from '@/components/ConfirmModal.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { InvalidPolymarketAccountError } from '@/constants/error.js';
import { formatPercentRate } from '@/helpers/formatPercentRate.js';
import { formatPnlUSD } from '@/helpers/formatPnlUSD.js';
import { formatPortfolioUSDCe } from '@/helpers/formatPortfolioUSDCe.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { usePolymarketBalance } from '@/hooks/usePolymarketBalance.js';
import { cn } from '@/lib/utils.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketProfileListQueryOptions } from '@/queries/firefly/getPolymarketProfileListQueryOptions.js';
import { getPolymarketUpgradeTaskQueryOptions } from '@/queries/firefly/getPolymarketUpgradeTaskQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

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
    const queryClient = useQueryClient();
    const { data } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const { totalBalance, availableBalance } = usePolymarketBalance(data.proxyAddress, POLYMARKET_HOME_POLL_MS);

    const { data: upgradeTask } = useSuspenseQuery(getPolymarketUpgradeTaskQueryOptions(data.proxyAddress));

    const portfolioText = formatPortfolioUSDCe(totalBalance);
    const availableText = isZero(availableBalance) ? '$0' : formatTokenUSD(availableBalance, { minDisplay: 0.01 });

    const usdceBalance = upgradeTask?.usdce_balance ?? 0;
    const showToRelease = upgradeTask?.is_upgraded && usdceBalance > 0;
    const releaseAmountText = formatTokenUSD(usdceBalance, { minDisplay: 0.01 });

    const handleRelease = useCallback(async () => {
        const confirmed = await Confirm.call({
            title: <Trans>Assets to Release</Trans>,
            message: (
                <p className="text-second text-sm leading-5">
                    <Trans>
                        Polymarket V2 is now live. Release your available balance of {releaseAmountText} USDC.e as pUSD
                        to keep your predictions going.
                    </Trans>
                </p>
            ),
            buttonLabel: <Trans>Release Now</Trans>,
            buttonVariants: 'primary',
        });
        if (!confirmed) return;

        try {
            await getFireflyEndpoint().polymarketV2Wrap(data.proxyAddress);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['polymarket-upgrade-task', data.proxyAddress] }),
                queryClient.invalidateQueries({ queryKey: ['getPolymarketAccount'] }),
                queryClient.invalidateQueries({ queryKey: ['polymarket-withdrawable-amount', data.proxyAddress] }),
            ]);
            toast.success(<Trans>Done</Trans>);
        } catch {
            toast.error(<Trans>Failed to release</Trans>);
        }
    }, [data.proxyAddress, queryClient, releaseAmountText]);

    return (
        <>
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <div className="text-main mx-auto h-8 w-auto min-w-[100px] truncate text-[40px] font-bold leading-8">
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
                {showToRelease ? (
                    <button
                        type="button"
                        className="border-line col-span-2 flex w-full items-center justify-between border-y py-3"
                        onClick={handleRelease}
                    >
                        <span className="flex items-center gap-1 text-[13px]">
                            <span className="mx-0.5 inline-block size-[5px] bg-[#ffb100] text-base leading-5" />
                            <Trans>
                                <span className="text-main text-[13px] font-semibold">{releaseAmountText}</span>
                                <span className="text-second text-[13px]">to release</span>
                            </Trans>
                        </span>
                        <ArrowRightIcon width={16} height={16} className="text-second" />
                    </button>
                ) : null}
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
