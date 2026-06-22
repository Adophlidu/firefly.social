import ArrowRightIcon from '@dimensiondev/assets/arrow-right2.svg';
import DepositIcon from '@dimensiondev/assets/deposit.svg';
import HistoryIcon from '@dimensiondev/assets/wallet/cal-history.svg';
import WithdrawIcon from '@dimensiondev/assets/withdraw.svg';
import { captureException, ExceptionId } from '@dimensiondev/exception-tracker';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import type { ErrorPageProps } from '@dimensiondev/types';
import { isZero } from '@dimensiondev/web3/numbers';
import { Trans } from '@lingui/react/macro';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { Suspense, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';

import { BetError } from '@/components/Bet/BetError.js';
import { BetNavigationBar } from '@/components/Bet/BetNavigationBar.js';
import { CurrencyAmount } from '@/components/Bet/CurrencyAmount.js';
import { HeaderLoading } from '@/components/Bet/HeaderLoading.js';
import { Confirm } from '@/components/ConfirmModal.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { InvalidPolymarketAccountError } from '@/constants/error.js';
import { formatPercentRate } from '@/helpers/formatPercentRate.js';
import { formatPnlUSD } from '@/helpers/formatPnlUSD.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { usePolymarketBalance } from '@/hooks/usePolymarketBalance.js';
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

function PositionsTelemetry() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());

    useEffect(() => {
        if (account?.proxyAddress) {
            captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_POSITIONS_LIST_OPEN_SUCCESS, {
                proxy_wallet_address: account.proxyAddress,
            });
        }
    }, [account?.proxyAddress]);
    return null;
}

function BetHomeLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isHistoryPage = location.pathname === '/bet/history';

    if (isHistoryPage) {
        return (
            <div className="flex w-full flex-1 flex-col items-center">
                <BetNavigationBar
                    hideActions
                    title={<Trans>History</Trans>}
                    onBack={() => navigate({ to: '/bet', replace: true })}
                />
                <div className="flex min-h-[calc(100vh-44px)] w-full flex-col items-center">
                    <ErrorBoundary fallback={betHomeErrorFallback} catch={betHomeCatchHandler}>
                        <Outlet />
                    </ErrorBoundary>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-1 flex-col items-center">
            <BetNavigationBar />
            <PositionsTelemetry />
            <div className="flex min-h-0 w-full grow flex-col items-center">
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
    ];

    return (
        <div className="sticky top-0 z-10 mb-2 mt-4 flex w-full items-center gap-4 bg-primaryBottom px-4">
            <Tabs
                className="min-w-0 flex-1"
                value={pathnameInTab}
                onValueChange={(path) => navigate({ to: path, resetScroll: false })}
            >
                <TabsList variant="second" className="flex w-full justify-normal">
                    {tabs.map(({ path, label }) => (
                        <TabsTrigger key={path} variant="second" value={path}>
                            {label}
                        </TabsTrigger>
                    ))}

                    <Link
                        to="/bet/history"
                        className="!ml-auto flex size-9 shrink-0 items-center justify-center text-main"
                    >
                        <HistoryIcon width={24} height={24} />
                    </Link>
                </TabsList>
            </Tabs>
        </div>
    );
}

export function ClientLayout() {
    useEffect(() => {
        captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_ACCOUNT_OPEN_SUCCESS, {});
    }, []);

    const queryClient = useQueryClient();
    const { data } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const proxyAddress = data.proxyAddress;
    const { data: upgradeTask } = useSuspenseQuery(getPolymarketUpgradeTaskQueryOptions(proxyAddress));
    const { totalBalance, availableBalance } = usePolymarketBalance(
        proxyAddress,
        POLYMARKET_HOME_POLL_MS,
        upgradeTask?.is_upgraded ?? true,
    );

    const availableText = isZero(availableBalance) ? '$0' : formatTokenUSD(availableBalance, { minDisplay: 0.01 });

    const usdceBalance = upgradeTask?.usdce_balance ?? 0;
    const showToRelease = upgradeTask?.is_upgraded && usdceBalance > 0;
    const releaseAmountText = formatTokenUSD(usdceBalance, { minDisplay: 0.01 });

    const handleRelease = useCallback(async () => {
        const confirmed = await Confirm.call({
            title: <Trans>Assets to Release</Trans>,
            message: (
                <p className="text-sm leading-5 text-second">
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
            await getFireflyEndpoint().polymarketV2Wrap(proxyAddress);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['polymarket-upgrade-task', proxyAddress] }),
                queryClient.invalidateQueries({ queryKey: ['getPolymarketAccount'] }),
                queryClient.invalidateQueries({ queryKey: ['polymarket-withdrawable-amount', proxyAddress] }),
            ]);
            toast.success(<Trans>Done</Trans>);
        } catch {
            toast.error(<Trans>Failed to release</Trans>);
        }
    }, [proxyAddress, queryClient, releaseAmountText]);

    return (
        <>
            <div className="flex w-full flex-col justify-start gap-2 p-4">
                <div className="w-auto truncate text-[40px] font-bold leading-8 text-main">
                    <CurrencyAmount amount={totalBalance} />
                </div>
                <Suspense
                    fallback={<div className="col-span-2 grid h-[17px] w-40 animate-pulse rounded-xl bg-lightBg" />}
                >
                    <PNL proxyAddress={proxyAddress} />
                </Suspense>
                <div className="h-4 text-[13px] leading-[17px] text-second">
                    <Trans>Available: {availableText}</Trans>
                </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-3 px-3">
                <Link
                    to="/bet/withdraw"
                    className="flex w-full items-center justify-center gap-[6px] rounded-[20px] bg-lightBg py-2.5 text-sm font-medium"
                >
                    <WithdrawIcon width={24} height={24} className="text-highlight" />
                    <span>
                        <Trans>Withdraw</Trans>
                    </span>
                </Link>
                <Link
                    to="/bet/deposit"
                    className="flex w-full items-center justify-center gap-[6px] rounded-[20px] bg-lightBg py-2.5 text-sm font-medium"
                >
                    <DepositIcon width={24} height={24} className="text-highlight" />
                    <span>
                        <Trans>Add Funds</Trans>
                    </span>
                </Link>
                {showToRelease ? (
                    <button
                        type="button"
                        className="col-span-2 flex w-full items-center justify-between border-y border-line py-3"
                        onClick={handleRelease}
                    >
                        <span className="flex items-center gap-1 text-[13px]">
                            <span className="mx-0.5 inline-block size-[5px] bg-[#ffb100] text-base leading-5" />
                            <Trans>
                                <span className="text-[13px] font-semibold text-main">{releaseAmountText}</span>
                                <span className="text-[13px] text-second">to release</span>
                            </Trans>
                        </span>
                        <ArrowRightIcon width={16} height={16} className="text-second" />
                    </button>
                ) : null}
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

    return (
        <div
            onClick={() =>
                iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
                    path: `/polymarket/profile/${profile?.proxy ?? proxyAddress}`,
                })
            }
            className="flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-xl text-[13px] leading-[17px] text-second"
        >
            <Trans>
                Total PnL:{' '}
                <span className={pnlValue >= 0 ? 'font-bold text-success' : 'font-bold text-danger'}>
                    {formatPnlUSD(pnlValue)}({formatPercentRate(pnlRate)})
                </span>
            </Trans>
            <ArrowRightIcon width={16} height={16} className="text-second" />
        </div>
    );
}
