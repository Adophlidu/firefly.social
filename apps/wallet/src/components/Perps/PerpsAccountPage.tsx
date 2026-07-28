import {
    encodePerpsIntent,
    IframeBridgeMethod,
    iframeBridgeProvider,
    type PerpsIntent,
} from '@dimensiondev/iframe-bridge';
import {
    perpsAccountQueryOptions,
    type PerpsAddress,
    perpsOpenOrdersQueryOptions,
    perpsSpotAccountQueryOptions,
    perpsUserAbstractionQueryOptions,
    usePerpsClient,
    usePerpsComputedAccountValue,
    usePerpsMarkets,
} from '@dimensiondev/perps-react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import type { ClearinghouseStateResponse, FrontendOpenOrdersResponse } from '@nktkas/hyperliquid/api/info';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@dimensiondev/ssr';
import { memo, useEffect, useMemo, useState } from 'react';

import BackIcon from '@/assets/perps-profile/back.svg';
import BatchActionIcon from '@/assets/perps-profile/batch-action.svg';
import BtcIcon from '@/assets/perps-profile/btc.svg';
import CoinArrowIcon from '@/assets/perps-profile/coin-arrow.svg';
import DepositIcon from '@/assets/perps-profile/deposit.svg';
import EditIcon from '@/assets/perps-profile/edit.svg';
import HistoryIcon from '@/assets/perps-profile/history-clock.svg';
import SwapIcon from '@/assets/perps-profile/swap.svg';
import TrashIcon from '@/assets/perps-profile/trash.svg';
import WithdrawIcon from '@/assets/perps-profile/withdraw.svg';
import { NavigationBar } from '@/components/NavigationBar.js';
import { computeUnifiedAccountRisk } from '@/components/Perps/computeUnifiedAccountRisk.js';
import { formatPerpsHomeBalance } from '@/components/Perps/formatPerpsHomeBalance.js';
import { getPerpsDexes } from '@/components/Perps/getPerpsDexes.js';
import { getPerpsAccountTab, type PerpsAccountTab } from '@/components/Perps/perpsAccountTab.js';
import { PerpsActionSheet } from '@/components/Perps/PerpsActionSheet.js';
import { toPerpsCoinDisplayName } from '@/components/Perps/perpsCoin.js';
import { usePerpsAccountSubscriptions } from '@/components/Perps/usePerpsAccountSubscriptions.js';
import { useCachedEvmAddress } from '@/hooks/useCachedWalletAddresses.js';
import { cn } from '@/lib/utils.js';

type ActionIntent = Exclude<PerpsIntent, { kind: 'account' | 'deposit' | 'withdraw' | 'place-order' }>;
type Position = ClearinghouseStateResponse['assetPositions'][number]['position'];
type OpenOrder = FrontendOpenOrdersResponse[number];

function formatUSD(value?: string | number, signed = false) {
    const number = Number(value ?? 0);
    const formatted = formatPerpsHomeBalance({
        accountOpened: true,
        availableBalance: Math.abs(number).toString(),
    });
    if (!signed || number === 0) return formatted;
    return `${number > 0 ? '+' : '-'}${formatted}`;
}

function formatNumber(value?: string | number | null, maximumFractionDigits = 5) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return number.toLocaleString(undefined, { maximumFractionDigits });
}

function formatSignedNumber(value?: string | number, maximumFractionDigits = 2) {
    const number = Number(value ?? 0);
    if (!Number.isFinite(number)) return '--';
    return `${number > 0 ? '+' : ''}${formatNumber(number, maximumFractionDigits)}`;
}

function accountValueParts(value?: string) {
    const formatted = formatUSD(value).slice(1);
    const [integer, decimal = '00'] = formatted.split('.');
    return { integer, decimal };
}

function positionMarkPrice(position: Position) {
    const size = Math.abs(Number(position.szi));
    if (!size) return undefined;
    return Number(position.positionValue) / size;
}

function positionTpSl(orders: FrontendOpenOrdersResponse, coin: string) {
    const triggerOrders = orders.filter((order) => order.coin === coin && order.reduceOnly && order.isTrigger);
    return {
        tp: triggerOrders.find((order) => order.orderType.startsWith('Take Profit'))?.triggerPx,
        sl: triggerOrders.find((order) => order.orderType.startsWith('Stop'))?.triggerPx,
    };
}

function orderDirection(order: OpenOrder) {
    if (!order.reduceOnly) return order.side === 'B' ? 'long' : 'short';
    return order.side === 'A' ? 'close-long' : 'close-short';
}

function OrderDirectionLabel({ order }: { order: OpenOrder }) {
    const direction = orderDirection(order);
    if (direction === 'long') return <Trans>Long</Trans>;
    if (direction === 'short') return <Trans>Short</Trans>;
    if (direction === 'close-long') return <Trans>Close Long</Trans>;
    return <Trans>Close Short</Trans>;
}

function PerpsIntentButton({
    intent,
    children,
    className,
}: {
    intent: PerpsIntent;
    children: React.ReactNode;
    className?: string;
}) {
    const navigate = useNavigate();
    return (
        <button
            type="button"
            className={className}
            onClick={() => navigate(`/perps/?${encodePerpsIntent(intent)}`)}
        >
            {children}
        </button>
    );
}

async function openPerpsMarketOnWeb(coin: string) {
    await iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
        path: `/perpetuals?coin=${encodeURIComponent(coin)}`,
    });
    await iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_CLOSE, {});
}

const PositionCard = memo(function PositionCard({
    position,
    orders,
}: {
    position: Position;
    orders: FrontendOpenOrdersResponse;
}) {
    const isLong = Number(position.szi) >= 0;
    const pnl = Number(position.unrealizedPnl);
    const roe = Number(position.returnOnEquity) * 100;
    const funding = Number(position.cumFunding.sinceOpen);
    const { tp, sl } = positionTpSl(orders, position.coin);
    const coin = `${position.coin}-USDC`;
    const coinDisplayName = toPerpsCoinDisplayName(position.coin);
    const positionId = position.coin;
    const [sizeInUsd, setSizeInUsd] = useState(false);

    return (
        <article className="rounded-xl border border-line bg-primaryBottom p-3 text-main">
            <div className="flex h-9 flex-col justify-between">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        className="flex items-center gap-1 text-sm font-semibold"
                        onClick={() => void openPerpsMarketOnWeb(coin)}
                    >
                        {coinDisplayName}
                        <CoinArrowIcon className="size-3" />
                    </button>
                    <span className="text-xs leading-[14px] text-second">
                        <Trans>PnL(USDC)</Trans>
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <span
                            className={cn(
                                'rounded-full px-1.5 py-0.5 text-xs font-medium leading-[14px]',
                                isLong ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger',
                            )}
                        >
                            {isLong ? <Trans>Buy</Trans> : <Trans>Sell</Trans>}
                        </span>
                        <span className="rounded-full bg-lightBg px-1.5 py-0.5 text-xs font-medium leading-[14px] text-third">
                            {position.leverage.type === 'isolated' ? <Trans>Isolated</Trans> : <Trans>Cross</Trans>}
                        </span>
                        <span className="rounded-full bg-lightBg px-1.5 py-0.5 text-xs font-medium leading-[14px] text-third">
                            {position.leverage.value}x
                        </span>
                    </div>
                    <strong
                        className={cn(
                            'text-sm font-semibold leading-[14px]',
                            pnl >= 0 ? 'text-success' : 'text-danger',
                        )}
                    >
                        {formatUSD(pnl, true)} ({formatSignedNumber(roe)}%)
                    </strong>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-3">
                <PositionMetric
                    label={
                        <button
                            type="button"
                            aria-label={sizeInUsd ? `Show size in ${coinDisplayName}` : 'Show size in USDC'}
                            className="flex items-center gap-0.5"
                            onClick={() => setSizeInUsd((value) => !value)}
                        >
                            <Trans>Size</Trans>({sizeInUsd ? 'USDC' : coinDisplayName})
                            <SwapIcon className="size-4" />
                        </button>
                    }
                    value={sizeInUsd ? formatUSD(position.positionValue) : formatNumber(Math.abs(Number(position.szi)))}
                />
                <PositionMetric
                    label={<Trans>Margin</Trans>}
                    value={
                        position.leverage.type === 'isolated' ? (
                            <PerpsIntentButton
                                className="flex items-center gap-1"
                                intent={{ kind: 'add-margin', coin, positionId }}
                            >
                                {formatUSD(position.marginUsed)} <EditIcon className="size-4" />
                            </PerpsIntentButton>
                        ) : (
                            formatUSD(position.marginUsed)
                        )
                    }
                />
                <PositionMetric
                    align="right"
                    label={<Trans>Funding</Trans>}
                    value={
                        <span className={funding >= 0 ? 'text-success' : 'text-danger'}>
                            {formatSignedNumber(funding)}
                        </span>
                    }
                />
                <PositionMetric label={<Trans>Entry Price</Trans>} value={formatNumber(position.entryPx, 2)} />
                <PositionMetric
                    label={<Trans>Mark Price</Trans>}
                    value={formatNumber(positionMarkPrice(position), 2)}
                />
                <PositionMetric
                    align="right"
                    label={<Trans>Liq. Price</Trans>}
                    value={formatNumber(position.liquidationPx, 2)}
                />
            </div>

            <div className="mt-3 flex items-center gap-1 text-xs text-second">
                <Trans>TP/SL</Trans>
                {tp || sl ? (
                    <strong className="text-sm font-semibold text-main">
                        <span className="text-success">{tp ? formatNumber(tp, 2) : '--'}</span>
                        {' / '}
                        <span className="text-danger">{sl ? formatNumber(sl, 2) : '--'}</span>
                    </strong>
                ) : (
                    <strong className="text-sm font-semibold text-main">--/--</strong>
                )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
                <PerpsIntentButton
                    className="h-8 rounded-[22px] bg-lightBg text-xs font-medium"
                    intent={{ kind: 'edit-tpsl', coin, positionId }}
                >
                    <Trans>TP/SL</Trans>
                </PerpsIntentButton>
                <PerpsIntentButton
                    className="h-8 rounded-[22px] bg-lightBg text-xs font-medium"
                    intent={{ kind: 'limit-close', coin, positionId }}
                >
                    <Trans>Limit Close</Trans>
                </PerpsIntentButton>
                <PerpsIntentButton
                    className="h-8 rounded-[22px] bg-lightBg text-xs font-medium"
                    intent={{ kind: 'market-close', coin, positionId }}
                >
                    <Trans>Market Close</Trans>
                </PerpsIntentButton>
            </div>
        </article>
    );
});

function PositionMetric({
    label,
    value,
    align = 'left',
}: {
    label: React.ReactNode;
    value: React.ReactNode;
    align?: 'left' | 'right';
}) {
    return (
        <div className={cn('min-w-0', align === 'right' && 'text-right')}>
            <div className="text-xs leading-[14px] text-second">{label}</div>
            <div className={cn('mt-0.5 text-sm font-semibold leading-5', align === 'right' && 'flex justify-end')}>
                {value}
            </div>
        </div>
    );
}

const OpenOrderCard = memo(function OpenOrderCard({ order }: { order: OpenOrder }) {
    const direction = orderDirection(order);
    const isLong = direction === 'long' || direction === 'close-short';
    const filled = Math.max(Number(order.origSz) - Number(order.sz), 0);
    const orderPrice = order.orderType.includes('Market') ? <Trans>Market</Trans> : formatNumber(order.limitPx, 2);
    const coin = `${order.coin}-USDC`;
    const coinDisplayName = toPerpsCoinDisplayName(order.coin);

    return (
        <article className="rounded-xl border border-line bg-primaryBottom p-3 text-main">
            <div className="flex gap-3">
                <BtcIcon className="size-9 shrink-0" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                        <strong className="text-sm font-semibold">{coinDisplayName}</strong>
                        <PerpsIntentButton
                            intent={{ kind: 'cancel-order', coin, orderId: String(order.oid) }}
                            className="flex size-6 items-center justify-center text-second"
                        >
                            <TrashIcon className="size-4" />
                            <span className="sr-only">
                                <Trans>Cancel order</Trans>
                            </span>
                        </PerpsIntentButton>
                    </div>
                    <div className="mt-0.5 flex items-center">
                        <span
                            className={cn(
                                'rounded-full px-1.5 py-0.5 text-xs font-medium leading-[14px]',
                                isLong ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger',
                            )}
                        >
                            {order.orderType} / <OrderDirectionLabel order={order} />
                        </span>
                        {!order.isTrigger ? (
                            <span className="ml-1 rounded-full bg-lightBg px-1.5 py-0.5 text-xs font-medium leading-[14px] text-third">
                                3x
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
                <PositionMetric label={<Trans>Size</Trans>} value={formatNumber(order.origSz)} />
                <PositionMetric label={<Trans>Filled</Trans>} value={formatNumber(filled)} />
                <PositionMetric align="right" label={<Trans>Order price</Trans>} value={orderPrice} />
            </div>

            <div className="mt-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                    {order.isTrigger ? (
                        <>
                            <div className="text-xs leading-[14px] text-second">
                                <Trans>Trigger Condition</Trans>
                            </div>
                            <strong className="block truncate text-sm font-semibold leading-5">
                                {order.triggerCondition}
                            </strong>
                        </>
                    ) : (
                        <div className="flex items-center gap-1 text-xs text-second">
                            <Trans>TP/SL</Trans>
                            <strong className="text-sm font-semibold text-main">--/--</strong>
                        </div>
                    )}
                </div>
                <time className="shrink-0 text-xs leading-[14px] text-second">
                    {new Date(order.timestamp).toLocaleString()}
                </time>
            </div>
        </article>
    );
});

export const PerpsAccountPage = memo(function PerpsAccountPage({ intent }: { intent?: ActionIntent }) {
    const navigate = useNavigate();
    const address = useCachedEvmAddress();
    const client = usePerpsClient();
    const markets = usePerpsMarkets();
    const dexes = useMemo(() => getPerpsDexes(markets.data), [markets.data]);
    const queryAddress = (address ?? '0x0000000000000000000000000000000000000000') as PerpsAddress;
    usePerpsAccountSubscriptions(address as PerpsAddress | undefined);
    const computedAccount = usePerpsComputedAccountValue(address as PerpsAddress | undefined);
    const abstraction = useQuery({
        ...perpsUserAbstractionQueryOptions(client, queryAddress),
        enabled: Boolean(address),
        staleTime: Number.POSITIVE_INFINITY,
    });
    const spotAccount = useQuery({
        ...perpsSpotAccountQueryOptions(client, queryAddress),
        enabled: Boolean(address),
        staleTime: Number.POSITIVE_INFINITY,
    });
    const [tab, setTab] = useState<PerpsAccountTab>(() => getPerpsAccountTab(intent));
    const accountQueries = useQueries({
        queries: dexes.map((dex) => ({
            ...perpsAccountQueryOptions(client, queryAddress, dex),
            enabled: Boolean(address),
            staleTime: Number.POSITIVE_INFINITY,
        })),
    });
    const orderQueries = useQueries({
        queries: dexes.map((dex) => ({
            ...perpsOpenOrdersQueryOptions(client, queryAddress, dex),
            enabled: Boolean(address),
            staleTime: Number.POSITIVE_INFINITY,
        })),
    });
    const data = accountQueries[0]?.data;
    const positions = useMemo(
        () => accountQueries.flatMap((query) => query.data?.assetPositions ?? []),
        [accountQueries],
    );
    const openOrders = useMemo(() => orderQueries.flatMap((query) => query.data ?? []), [orderQueries]);
    const isAccountLoading = accountQueries.some((query) => query.isPending);
    const isOrdersLoading = orderQueries.some((query) => query.isPending);
    const unifiedRisk = useMemo(
        () =>
            computeUnifiedAccountRisk(
                accountQueries.flatMap((query, index) => {
                    const collateralToken = markets.data?.[index]?.collateralToken;
                    if (collateralToken === undefined || !query.data) return [];
                    return [
                        {
                            collateralToken,
                            crossMaintenanceMarginUsed: query.data.crossMaintenanceMarginUsed,
                            positions: query.data.assetPositions.map(({ position }) => position),
                        },
                    ];
                }),
                spotAccount.data?.balances ?? [],
            ),
        [accountQueries, markets.data, spotAccount.data?.balances],
    );
    const isUnifiedAccount = abstraction.data === 'unifiedAccount';
    const unrealizedPnl = useMemo(
        () => positions.reduce((total, item) => total + Number(item.position.unrealizedPnl), 0),
        [positions],
    );
    const maintenanceMargin = isUnifiedAccount ? unifiedRisk.maintenanceMargin : data?.crossMaintenanceMarginUsed;
    const crossRatio = isUnifiedAccount
        ? unifiedRisk.ratio
        : Number(data?.crossMarginSummary.totalMarginUsed || 0) / Number(data?.crossMarginSummary.accountValue || 1);
    const balance = accountValueParts(computedAccount.accountValue ?? data?.marginSummary.accountValue);
    const withdrawable = computedAccount.withdrawable ?? data?.withdrawable;
    const isBalanceLoading = isAccountLoading || computedAccount.isQueryPending;
    const hasBatchAction = tab === 'positions' ? Boolean(positions.length) : openOrders.length > 0;

    useEffect(() => {
        if (intent) setTab(getPerpsAccountTab(intent));
    }, [intent]);

    return (
        <div className="no-scrollbar flex min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden bg-primaryBottom text-main">
            <NavigationBar
                className="shrink-0"
                backIcon={<BackIcon className="size-6" />}
                onBack={() => navigate('/', { replace: true })}
            >
                <h1 className="font-[Poppins] text-lg font-semibold">
                    <Trans>Perpetuals</Trans>
                </h1>
            </NavigationBar>

            <main className="flex shrink-0 flex-col px-4 pb-6">
                <section className="py-4">
                    <div className="flex items-end gap-1 leading-none">
                        <span className="text-5xl font-normal leading-[56px] text-third">$</span>
                        <strong className="text-5xl font-bold leading-[56px]">
                            {isBalanceLoading ? '--' : balance.integer}
                            {!isBalanceLoading ? (
                                <span className="text-2xl font-semibold leading-8">.{balance.decimal}</span>
                            ) : null}
                        </strong>
                    </div>
                    <dl className="space-y-1 text-[13px] leading-[17px] text-second">
                        <div className="flex gap-1">
                            <dt>
                                <Trans>Unrealized PnL:</Trans>
                            </dt>
                            <dd className={cn('font-bold', unrealizedPnl >= 0 ? 'text-success' : 'text-danger')}>
                                {formatUSD(unrealizedPnl, true)}
                            </dd>
                        </div>
                        <div className="flex gap-1">
                            <dt>
                                <Trans>Withdrawable Value:</Trans>
                            </dt>
                            <dd>{isBalanceLoading ? '--' : formatUSD(withdrawable)}</dd>
                        </div>
                        <div className="flex gap-1">
                            <dt>
                                <Trans>Maintenance Margin:</Trans>
                            </dt>
                            <dd>{formatUSD(maintenanceMargin)}</dd>
                        </div>
                        <div className="flex gap-1">
                            <dt>
                                <Trans>Cross Margin Ratio:</Trans>
                            </dt>
                            <dd
                                className={cn(
                                    Number.isFinite(crossRatio) && crossRatio < 0.8 ? 'text-success' : 'text-danger',
                                )}
                            >
                                {Number.isFinite(crossRatio) ? `${(crossRatio * 100).toFixed(2)}%` : '--'}
                            </dd>
                        </div>
                    </dl>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className="flex h-10 items-center justify-center gap-1.5 rounded-[20px] bg-lightBg text-sm font-medium"
                            onClick={() => navigate('/perps/withdraw' )}
                        >
                            <WithdrawIcon className="size-5" /> <Trans>Withdraw</Trans>
                        </button>
                        <button
                            type="button"
                            className="flex h-10 items-center justify-center gap-1.5 rounded-[20px] bg-lightBg text-sm font-medium"
                            onClick={() => navigate('/perps/deposit' )}
                        >
                            <DepositIcon className="size-5" /> <Trans>Add Funds</Trans>
                        </button>
                    </div>
                </section>

                <section>
                    <div className="flex h-9 items-start justify-between">
                        <div role="tablist" aria-label={t`Perpetuals account`} className="flex h-9 items-start gap-3">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={tab === 'positions'}
                                className="h-9 border-b-[2.5px] border-transparent font-[Poppins] text-base font-semibold text-second aria-selected:border-main aria-selected:text-main"
                                onClick={() => setTab('positions')}
                            >
                                <Trans>Positions</Trans>
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={tab === 'orders'}
                                className="h-9 border-b-[2.5px] border-transparent font-[Poppins] text-base font-semibold text-second aria-selected:border-main aria-selected:text-main"
                                onClick={() => setTab('orders')}
                            >
                                <Trans>Open Orders</Trans>
                            </button>
                        </div>
                        <button
                            type="button"
                            aria-label={t`Trading history`}
                            className="flex size-7 items-center justify-center"
                            onClick={() => navigate('/perps/history' )}
                        >
                            <HistoryIcon className="size-6" />
                        </button>
                    </div>

                    {hasBatchAction ? (
                        <div className="mt-4 flex justify-end">
                            <PerpsIntentButton
                                intent={{ kind: tab === 'positions' ? 'close-all' : 'cancel-all' }}
                                className="flex h-[34px] items-center justify-center gap-1 rounded-2xl border border-secondaryLine px-4 text-sm font-medium"
                            >
                                <BatchActionIcon className="size-3.5" />
                                {tab === 'positions' ? <Trans>Close all</Trans> : <Trans>Cancel all</Trans>}
                            </PerpsIntentButton>
                        </div>
                    ) : null}

                    <div className="mt-4 space-y-3">
                        {tab === 'positions'
                            ? positions.map(({ position }) => (
                                  <PositionCard key={position.coin} position={position} orders={openOrders} />
                              ))
                            : openOrders.map((order) => <OpenOrderCard key={order.oid} order={order} />)}

                        {tab === 'positions' && !isAccountLoading && !positions.length ? (
                            <p className="py-10 text-center text-sm text-second">
                                <Trans>No open positions</Trans>
                            </p>
                        ) : null}
                        {tab === 'orders' && !isOrdersLoading && !openOrders.length ? (
                            <p className="py-10 text-center text-sm text-second">
                                <Trans>No open orders</Trans>
                            </p>
                        ) : null}
                    </div>
                </section>
            </main>
            {intent ? (
                <PerpsActionSheet
                    intent={intent}
                    positions={positions.map(({ position }) => position)}
                    orders={openOrders}
                    isAccountLoading={isAccountLoading}
                    isOrdersLoading={isOrdersLoading}
                    withdrawable={withdrawable}
                    onClose={() => navigate('/perps', { replace: true })}
                />
            ) : null}
        </div>
    );
});
