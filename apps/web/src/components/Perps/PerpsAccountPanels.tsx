'use client';

import EditIcon from '@dimensiondev/assets/edit.svg';
import TrashIcon from '@dimensiondev/assets/trash.svg';
import type { PerpsIntent, PerpsOrderEditField } from '@dimensiondev/iframe-bridge';
import {
    perpsAccountQueryOptions,
    type PerpsAddress,
    type PerpsOpenOrdersData,
    perpsOpenOrdersQueryOptions,
    usePerpsClient,
    usePerpsMarkets,
} from '@dimensiondev/perps-react';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQueries, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getPerpsDexes } from '@/components/Perps/getPerpsDexes.js';
import { toDisplayPerpsMarketName } from '@/components/Perps/marketSelection.js';
import {
    isOpenOrderEditChanged,
    isValidOpenOrderEdit,
    normalizeOpenOrderEditInput,
} from '@/components/Perps/openOrderEdit.js';
import {
    getOpenOrderChildIds,
    getOpenOrderPresentation,
    type OpenOrderDirection,
} from '@/components/Perps/openOrderPresentation.js';
import { perpsAggregatedFillsQueryKey } from '@/components/Perps/perpsAccountSubscriptions.js';
import { buildTradingHistoryFinancials } from '@/components/Perps/tradingHistoryPresentation.js';

interface Props {
    address?: PerpsAddress;
    onIntent: (intent: PerpsIntent) => void;
}

type Tab = 'positions' | 'orders' | 'history';

interface OrderEditState {
    orderId: number;
    field: PerpsOrderEditField;
    value: string;
}

function formatNumber(value?: string | number) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '--';
}

function EmptyState({ children }: { children: React.ReactNode }) {
    return <div className="flex h-[120px] items-center justify-center text-sm text-[#767676]">{children}</div>;
}

function OrderDirectionLabel({ direction }: { direction: OpenOrderDirection }) {
    switch (direction) {
        case 'long':
            return <Trans>Long</Trans>;
        case 'short':
            return <Trans>Short</Trans>;
        case 'close-long':
            return <Trans>Close Long</Trans>;
        case 'close-short':
            return <Trans>Close Short</Trans>;
    }
}

function OrderTypeLabel({ orderType }: { orderType: string }) {
    switch (orderType) {
        case 'Market':
            return <Trans>Market</Trans>;
        case 'Limit':
            return <Trans>Limit</Trans>;
        case 'Stop Market':
            return <Trans>Stop Market</Trans>;
        case 'Stop Limit':
            return <Trans>Stop Limit</Trans>;
        case 'Take Profit Market':
            return <Trans>Take Profit Market</Trans>;
        case 'Take Profit Limit':
            return <Trans>Take Profit Limit</Trans>;
        default:
            return orderType;
    }
}

function FillDirectionLabel({ direction }: { direction: string }) {
    switch (direction) {
        case 'Open Long':
            return <Trans>Open Long</Trans>;
        case 'Close Long':
            return <Trans>Close Long</Trans>;
        case 'Open Short':
            return <Trans>Open Short</Trans>;
        case 'Close Short':
            return <Trans>Close Short</Trans>;
        default:
            return direction;
    }
}

function formatSize(value: string) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 8 }) : '--';
}

function formatUsd(value?: string | number) {
    const number = Number(value);
    return Number.isFinite(number) ? `$${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--';
}

function getPositionMarkPrice(positionValue: string, size: string) {
    const absoluteSize = Math.abs(Number(size));
    return absoluteSize ? Number(positionValue) / absoluteSize : undefined;
}

function getPositionTpsl(orders: PerpsOpenOrdersData, coin: string) {
    const triggerOrders = orders.filter((order) => order.coin === coin && order.reduceOnly && order.isTrigger);
    return {
        takeProfit: triggerOrders.find((order) => order.orderType.startsWith('Take Profit'))?.triggerPx,
        stopLoss: triggerOrders.find((order) => order.orderType.startsWith('Stop'))?.triggerPx,
    };
}

function formatSignedUsd(value: BigNumber) {
    if (!value.isFinite()) return '--';
    const sign = value.isPositive() ? '+' : value.isNegative() ? '-' : '';
    return `${sign}$${value.abs().toFormat(2)}`;
}

function formatSignedPercent(value: BigNumber) {
    if (!value.isFinite()) return '--';
    const sign = value.isPositive() ? '+' : '';
    return `(${sign}${value.toFormat(2)}%)`;
}

interface TabsProps {
    tab: Tab;
    counts: Record<Tab, number>;
    onChange: (tab: Tab) => void;
}

function AccountTabs({ tab, counts, onChange }: TabsProps) {
    const tabs = [
        { id: 'positions' as const, label: <Trans>Positions</Trans> },
        { id: 'orders' as const, label: <Trans>Open Orders</Trans> },
        { id: 'history' as const, label: <Trans>Trading History</Trans> },
    ];
    return (
        <div
            role="tablist"
            aria-label={t`Perpetuals account`}
            className="flex h-12 items-start gap-8 border-b border-[#f5f5f5] px-4"
        >
            {tabs.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    className="h-12 border-b-4 border-transparent text-base font-bold leading-6 text-[#b1b1b1] outline-none focus-visible:ring-2 focus-visible:ring-[#4c4aa9] aria-selected:border-lightTextMain aria-selected:text-lightTextMain"
                    onClick={() => onChange(item.id)}
                >
                    {item.label}
                    {item.id === 'history' ? '' : `(${counts[item.id]})`}
                </button>
            ))}
        </div>
    );
}

function InlineOrderEdit({
    label,
    value,
    isValid,
    canConfirm,
    onChange,
    onConfirm,
    onCancel,
}: {
    label: string;
    value: string;
    isValid: boolean;
    canConfirm: boolean;
    onChange(value: string): void;
    onConfirm(): void;
    onCancel(): void;
}) {
    return (
        <div
            className="flex items-center gap-2"
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) onCancel();
            }}
        >
            <input
                autoFocus
                aria-label={label}
                aria-invalid={!isValid}
                value={value}
                inputMode="decimal"
                className="aria-invalid:border-[#ff3545] h-8 w-24 rounded-md border border-[#767676] px-2 outline-none focus:border-[#4c4aa9]"
                onChange={(event) => onChange(normalizeOpenOrderEditInput(event.target.value))}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && canConfirm) onConfirm();
                    if (event.key === 'Escape') onCancel();
                }}
            />
            <button
                type="button"
                disabled={!canConfirm}
                className="font-semibold text-[#4c4aa9] disabled:opacity-40"
                onClick={onConfirm}
            >
                <Trans>Confirm</Trans>
            </button>
        </div>
    );
}

function AuthenticatedPanels({ address, onIntent }: Required<Props>) {
    const [tab, setTab] = useState<Tab>('orders');
    const [orderEdit, setOrderEdit] = useState<OrderEditState | null>(null);
    const [showOrderActionShadow, setShowOrderActionShadow] = useState(false);
    const ordersTableContainerRef = useRef<HTMLDivElement>(null);
    const client = usePerpsClient();
    const markets = usePerpsMarkets();
    const dexes = useMemo(() => getPerpsDexes(markets.data), [markets.data]);
    const accountQueries = useQueries({
        queries: dexes.map((dex) => ({
            ...perpsAccountQueryOptions(client, address, dex),
            staleTime: Number.POSITIVE_INFINITY,
        })),
    });
    const orderQueries = useQueries({
        queries: dexes.map((dex) => ({
            ...perpsOpenOrdersQueryOptions(client, address, dex),
            staleTime: Number.POSITIVE_INFINITY,
        })),
    });
    const fills = useQuery({
        queryKey: perpsAggregatedFillsQueryKey(address),
        queryFn: ({ signal }) => client.info.userFills({ user: address, aggregateByTime: true }, signal),
        staleTime: Number.POSITIVE_INFINITY,
    });
    const positions = useMemo(
        () => accountQueries.flatMap((query) => query.data?.assetPositions ?? []),
        [accountQueries],
    );
    const orders = useMemo(() => orderQueries.flatMap((query) => query.data ?? []), [orderQueries]);
    const accountState = {
        isLoading: accountQueries.some((query) => query.isLoading),
        error: accountQueries.find((query) => query.error)?.error,
    };
    const orderState = {
        isLoading: orderQueries.some((query) => query.isLoading),
        error: orderQueries.find((query) => query.error)?.error,
    };
    const counts = { positions: positions.length, orders: orders.length, history: fills.data?.length ?? 0 };
    const szDecimalsByCoin = useMemo(
        () =>
            new Map(
                (markets.data ?? []).flatMap((metadata) =>
                    metadata.universe.map((coin) => [coin.name, coin.szDecimals] as const),
                ),
            ),
        [markets.data],
    );
    const attachedOrderIds = useMemo(() => new Set(orders.flatMap(getOpenOrderChildIds)), [orders]);
    const activeQuery = tab === 'positions' ? accountState : tab === 'orders' ? orderState : fills;
    const tableContainerClassName =
        'relative max-h-[360px] overflow-auto [scrollbar-color:#b1b1b1_#f5f5f5] [scrollbar-width:thin] [&::-webkit-scrollbar]:size-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#b1b1b1] [&::-webkit-scrollbar-track]:bg-[#f5f5f5]';
    const updateOrderActionShadow = useCallback(() => {
        const container = ordersTableContainerRef.current;
        if (!container) return;
        const hiddenContentWidth = container.scrollWidth - container.clientWidth - container.scrollLeft;
        setShowOrderActionShadow(hiddenContentWidth > 1);
    }, []);

    useEffect(() => {
        if (tab !== 'orders') return;
        const container = ordersTableContainerRef.current;
        if (!container) return;
        updateOrderActionShadow();
        const resizeObserver = new ResizeObserver(updateOrderActionShadow);
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [orders.length, tab, updateOrderActionShadow]);

    const orderActionColumnClassName = 'sticky right-0 border-l border-[#f5f5f5] bg-white px-4 text-right';
    const orderActionShadow = showOrderActionShadow ? (
        <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-3 w-3 bg-gradient-to-l from-[rgba(34,33,47,0.12)] to-transparent"
        />
    ) : null;

    return (
        <section className="bg-white text-lightTextMain">
            <AccountTabs tab={tab} counts={counts} onChange={setTab} />
            {activeQuery.isLoading ? (
                <EmptyState>
                    <Trans>Loading account data…</Trans>
                </EmptyState>
            ) : null}
            {activeQuery.error ? (
                <EmptyState>
                    <span role="alert">
                        <Trans>Account data is unavailable.</Trans>
                    </span>
                </EmptyState>
            ) : null}
            {!activeQuery.isLoading && !activeQuery.error && tab === 'orders' ? (
                orders.length ? (
                    <div
                        ref={ordersTableContainerRef}
                        className={tableContainerClassName}
                        onScroll={updateOrderActionShadow}
                    >
                        <table className="w-full min-w-[1260px] text-left text-[13px]">
                            <thead className="sticky top-0 z-20 h-[41px] border-b border-[#f5f5f5] bg-white text-[#767676]">
                                <tr>
                                    <th className="min-w-[190px] px-4 font-normal">
                                        <Trans>Date</Trans>
                                    </th>
                                    <th className="min-w-[130px] font-normal">
                                        <Trans>Type</Trans>
                                    </th>
                                    <th className="min-w-[100px] font-normal">
                                        <Trans>Market</Trans>
                                    </th>
                                    <th className="min-w-[200px] font-normal">
                                        <Trans>Size</Trans>
                                    </th>
                                    <th className="min-w-[100px] font-normal">
                                        <Trans>Filled</Trans>
                                    </th>
                                    <th className="min-w-[120px] font-normal">
                                        <Trans>Value</Trans>
                                    </th>
                                    <th className="min-w-[190px] font-normal">
                                        <Trans>Price</Trans>
                                    </th>
                                    <th className="min-w-[120px] font-normal">
                                        <Trans>TP/SL</Trans>
                                    </th>
                                    <th
                                        className={classNames(
                                            orderActionColumnClassName,
                                            'z-30 w-[100px] min-w-[100px] font-normal',
                                        )}
                                    >
                                        {orderActionShadow}
                                        <button
                                            type="button"
                                            className="text-[#4c4aa9]"
                                            onClick={() => onIntent({ kind: 'cancel-all' })}
                                        >
                                            <Trans>Clear all</Trans>
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const presentation = getOpenOrderPresentation(order, {
                                        isAttachedChild: attachedOrderIds.has(order.oid),
                                    });
                                    const isLong =
                                        presentation.direction === 'long' || presentation.direction === 'close-short';
                                    const szDecimals = szDecimalsByCoin.get(order.coin);
                                    const isEditingSize =
                                        orderEdit?.orderId === order.oid && orderEdit.field === 'size';
                                    const isEditingPrice =
                                        orderEdit?.orderId === order.oid && orderEdit.field === 'price';
                                    const submitEdit = (field: PerpsOrderEditField) => {
                                        if (
                                            !orderEdit ||
                                            szDecimals === undefined ||
                                            !isValidOpenOrderEdit(orderEdit.value, field, szDecimals)
                                        )
                                            return;
                                        const currentValue = field === 'size' ? order.sz : order.limitPx;
                                        if (!isOpenOrderEditChanged(orderEdit.value, currentValue)) return;
                                        onIntent({
                                            kind: 'modify-order',
                                            coin: toDisplayPerpsMarketName(order.coin),
                                            orderId: String(order.oid),
                                            field,
                                            value: orderEdit.value,
                                        });
                                        setOrderEdit(null);
                                    };
                                    return (
                                        <tr key={order.oid} className="h-[60px] border-b border-[#f5f5f5] text-sm">
                                            <td className="whitespace-nowrap px-4">
                                                {new Date(order.timestamp).toLocaleString()}
                                            </td>
                                            <td className="min-w-[130px]">
                                                <span className="block">
                                                    <OrderTypeLabel orderType={order.orderType} />
                                                </span>
                                                <span className="block">
                                                    <OrderDirectionLabel direction={presentation.direction} />
                                                </span>
                                            </td>
                                            <td className="min-w-[100px]">
                                                <span
                                                    className={classNames(
                                                        'block font-bold',
                                                        isLong ? 'text-[#3dc233]' : 'text-[#ff564d]',
                                                    )}
                                                >
                                                    {order.coin}
                                                </span>
                                            </td>
                                            <td className="min-w-[200px]">
                                                {presentation.isClosePosition ? (
                                                    <Trans>Close Position</Trans>
                                                ) : isEditingSize && orderEdit ? (
                                                    <InlineOrderEdit
                                                        label={t`New order size`}
                                                        value={orderEdit.value}
                                                        isValid={
                                                            szDecimals !== undefined &&
                                                            isValidOpenOrderEdit(orderEdit.value, 'size', szDecimals)
                                                        }
                                                        canConfirm={
                                                            szDecimals !== undefined &&
                                                            isValidOpenOrderEdit(orderEdit.value, 'size', szDecimals) &&
                                                            isOpenOrderEditChanged(orderEdit.value, order.sz)
                                                        }
                                                        onChange={(value) => setOrderEdit({ ...orderEdit, value })}
                                                        onConfirm={() => submitEdit('size')}
                                                        onCancel={() => setOrderEdit(null)}
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                                        <span>{formatNumber(order.sz)}</span>
                                                        {presentation.canEditSize ? (
                                                            <button
                                                                type="button"
                                                                aria-label={t`Edit order size`}
                                                                className="flex size-5 items-center justify-center"
                                                                onClick={() =>
                                                                    setOrderEdit({
                                                                        orderId: order.oid,
                                                                        field: 'size',
                                                                        value: order.sz,
                                                                    })
                                                                }
                                                            >
                                                                <EditIcon className="size-4" />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {presentation.filled === undefined
                                                    ? '--'
                                                    : formatNumber(String(presentation.filled))}
                                            </td>
                                            <td>
                                                {presentation.isClosePosition ? (
                                                    '--'
                                                ) : presentation.value === undefined ? (
                                                    <Trans>Market</Trans>
                                                ) : (
                                                    `$${formatNumber(String(presentation.value))}`
                                                )}
                                            </td>
                                            <td className="min-w-[190px]">
                                                {isEditingPrice && orderEdit ? (
                                                    <InlineOrderEdit
                                                        label={t`New order price`}
                                                        value={orderEdit.value}
                                                        isValid={
                                                            szDecimals !== undefined &&
                                                            isValidOpenOrderEdit(orderEdit.value, 'price', szDecimals)
                                                        }
                                                        canConfirm={
                                                            szDecimals !== undefined &&
                                                            isValidOpenOrderEdit(
                                                                orderEdit.value,
                                                                'price',
                                                                szDecimals,
                                                            ) &&
                                                            isOpenOrderEditChanged(orderEdit.value, order.limitPx)
                                                        }
                                                        onChange={(value) => setOrderEdit({ ...orderEdit, value })}
                                                        onConfirm={() => submitEdit('price')}
                                                        onCancel={() => setOrderEdit(null)}
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                                        <span>
                                                            {presentation.price === undefined ? (
                                                                <Trans>Market</Trans>
                                                            ) : (
                                                                formatNumber(presentation.price)
                                                            )}
                                                        </span>
                                                        {presentation.price === undefined ? null : (
                                                            <button
                                                                type="button"
                                                                aria-label={t`Edit order price`}
                                                                className="flex size-5 items-center justify-center"
                                                                onClick={() =>
                                                                    setOrderEdit({
                                                                        orderId: order.oid,
                                                                        field: 'price',
                                                                        value: order.limitPx,
                                                                    })
                                                                }
                                                            >
                                                                <EditIcon className="size-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className="block whitespace-nowrap text-[#3dc233]">
                                                    {presentation.takeProfit
                                                        ? formatNumber(presentation.takeProfit)
                                                        : '--'}
                                                </span>
                                                <span className="block whitespace-nowrap text-[#ff564d]">
                                                    {presentation.stopLoss ? formatNumber(presentation.stopLoss) : '--'}
                                                </span>
                                            </td>
                                            <td
                                                className={classNames(
                                                    orderActionColumnClassName,
                                                    'z-20 w-[100px] min-w-[100px]',
                                                )}
                                            >
                                                {orderActionShadow}
                                                <button
                                                    type="button"
                                                    aria-label={t`Cancel order`}
                                                    onClick={() =>
                                                        onIntent({
                                                            kind: 'cancel-order',
                                                            coin: toDisplayPerpsMarketName(order.coin),
                                                            orderId: String(order.oid),
                                                        })
                                                    }
                                                >
                                                    <TrashIcon className="ml-auto size-4 text-[#767676]" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState>
                        <Trans>No open orders</Trans>
                    </EmptyState>
                )
            ) : null}
            {!activeQuery.isLoading && !activeQuery.error && tab === 'positions' ? (
                positions.length ? (
                    <div className={tableContainerClassName}>
                        <table className="w-full min-w-[978px] table-fixed text-left text-[13px]">
                            <thead className="sticky top-0 z-20 h-[41px] border-y border-[#f5f5f5] bg-white font-normal leading-[17px] text-[#767676]">
                                <tr>
                                    <th className="w-[10%] px-4 font-normal">
                                        <Trans>Market</Trans>
                                    </th>
                                    <th className="w-[11%] font-normal">
                                        <Trans>Size/Value</Trans>
                                    </th>
                                    <th className="w-[10%] font-normal">
                                        <Trans>Entry Price</Trans>
                                    </th>
                                    <th className="w-[10%] font-normal">
                                        <Trans>Mark Price</Trans>
                                    </th>
                                    <th className="w-[10%] font-normal">
                                        <Trans>Liq. Price</Trans>
                                    </th>
                                    <th className="w-[11%] font-normal underline decoration-dotted underline-offset-2">
                                        <Trans>PNL(ROE%)</Trans>
                                    </th>
                                    <th className="w-[10%] font-normal underline decoration-dotted underline-offset-2">
                                        <Trans>Margin</Trans>
                                    </th>
                                    <th className="w-[9%] font-normal underline decoration-dotted underline-offset-2">
                                        <Trans>Funding</Trans>
                                    </th>
                                    <th className="w-[10%] font-normal">
                                        <Trans>TP/SL</Trans>
                                    </th>
                                    <th className="sticky right-0 z-30 w-[9%] border-l border-[#f5f5f5] bg-white px-4 text-right font-normal">
                                        <button
                                            type="button"
                                            className="text-[#4c4aa9]"
                                            onClick={() => onIntent({ kind: 'close-all' })}
                                        >
                                            <Trans>Close all</Trans>
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {positions.map(({ position }) => {
                                    const isLong = Number(position.szi) >= 0;
                                    const pnl = new BigNumber(position.unrealizedPnl);
                                    const roe = new BigNumber(position.returnOnEquity).times(100);
                                    const { takeProfit, stopLoss } = getPositionTpsl(orders, position.coin);
                                    const coin = toDisplayPerpsMarketName(position.coin);
                                    const positionIntent = { coin, positionId: position.coin };
                                    return (
                                        <tr
                                            key={position.coin}
                                            className="relative h-[60px] border-b border-[#f5f5f5] text-sm leading-[18px] text-lightTextMain"
                                        >
                                            <td className="relative px-4">
                                                <span
                                                    aria-hidden
                                                    className={classNames(
                                                        'absolute inset-y-px left-0 w-1.5',
                                                        isLong ? 'bg-[#3dc233]' : 'bg-[#ff564d]',
                                                    )}
                                                />
                                                <span className="block font-bold">{position.coin}</span>
                                                <span className="mt-1 inline-flex rounded-full bg-[#efeff3] px-1.5 py-0.5 text-xs font-medium leading-[14px] text-[#a9a6bc]">
                                                    {position.leverage.value}x
                                                </span>
                                            </td>
                                            <td>
                                                <span className="block">
                                                    {formatSize(new BigNumber(position.szi).abs().toFixed())}
                                                </span>
                                                <span className="mt-1 block">{formatUsd(position.positionValue)}</span>
                                            </td>
                                            <td>{formatNumber(position.entryPx)}</td>
                                            <td>
                                                {formatNumber(
                                                    getPositionMarkPrice(position.positionValue, position.szi),
                                                )}
                                            </td>
                                            <td>{formatNumber(position.liquidationPx ?? undefined)}</td>
                                            <td className={pnl.isNegative() ? 'text-[#ff564d]' : 'text-[#3dc233]'}>
                                                <span className="block">{formatSignedUsd(pnl)}</span>
                                                <span className="mt-1 block">{formatSignedPercent(roe)}</span>
                                            </td>
                                            <td>
                                                <span className="block">{formatUsd(position.marginUsed)}</span>
                                                {position.leverage.type === 'isolated' ? (
                                                    <button
                                                        type="button"
                                                        aria-label={t`Edit margin`}
                                                        className="mt-1 flex size-4 items-center justify-center"
                                                        onClick={() =>
                                                            onIntent({ kind: 'add-margin', ...positionIntent })
                                                        }
                                                    >
                                                        <EditIcon className="size-4" />
                                                    </button>
                                                ) : (
                                                    <span className="mt-1 block">
                                                        <Trans>(Cross)</Trans>
                                                    </span>
                                                )}
                                            </td>
                                            <td>{formatNumber(position.cumFunding.sinceOpen)}</td>
                                            <td>
                                                <div className="flex items-center justify-between gap-1">
                                                    <div>
                                                        <span className="block whitespace-nowrap text-[#3dc233]">
                                                            {takeProfit ? formatNumber(takeProfit) : '--'}
                                                        </span>
                                                        <span className="mt-1 block whitespace-nowrap text-[#ff564d]">
                                                            {stopLoss ? formatNumber(stopLoss) : '--'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        aria-label={t`Edit TP/SL`}
                                                        className="flex size-4 items-center justify-center"
                                                        onClick={() =>
                                                            onIntent({ kind: 'edit-tpsl', ...positionIntent })
                                                        }
                                                    >
                                                        <EditIcon className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="sticky right-0 z-20 border-l border-[#f5f5f5] bg-white px-4 text-right">
                                                <div className="flex flex-col items-end gap-2 text-[#4c4aa9]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onIntent({ kind: 'market-close', ...positionIntent })
                                                        }
                                                    >
                                                        <Trans>Market</Trans>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onIntent({ kind: 'limit-close', ...positionIntent })
                                                        }
                                                    >
                                                        <Trans>Limit</Trans>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState>
                        <Trans>No open positions</Trans>
                    </EmptyState>
                )
            ) : null}
            {!activeQuery.isLoading && !activeQuery.error && tab === 'history' ? (
                fills.data?.length ? (
                    <div className={tableContainerClassName}>
                        <table className="w-full min-w-[978px] table-fixed text-left text-[13px]">
                            <thead className="sticky top-0 z-20 h-[41px] border-y border-[#f5f5f5] bg-white font-normal leading-[17px] text-[#767676]">
                                <tr>
                                    <th className="w-[22%] px-4 font-normal">
                                        <Trans>Date</Trans>
                                    </th>
                                    <th className="w-[11%] font-normal">
                                        <Trans>Direction</Trans>
                                    </th>
                                    <th className="w-[12%] font-normal">
                                        <Trans>Market</Trans>
                                    </th>
                                    <th className="w-[12%] font-normal">
                                        <Trans>Price</Trans>
                                    </th>
                                    <th className="w-[16%] font-normal">
                                        <Trans>Size</Trans>
                                    </th>
                                    <th className="w-[17%] font-normal">
                                        <Trans>Trade Value</Trans>
                                    </th>
                                    <th className="w-[10%] font-normal underline decoration-dotted underline-offset-2">
                                        <Trans>Closed PNL</Trans>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {fills.data.map((fill) => {
                                    const { tradeValue, closedPnl, closedPnlPercent } =
                                        buildTradingHistoryFinancials(fill);
                                    const isBuy = fill.side === 'B';
                                    const directionClassName = isBuy ? 'text-[#3dc233]' : 'text-[#ff3545]';
                                    return (
                                        <tr
                                            key={`${fill.tid}-${fill.time}`}
                                            className="h-[60px] border-b border-[#f5f5f5] text-sm leading-[18px] text-lightTextMain"
                                        >
                                            <td className="px-4">{new Date(fill.time).toLocaleString()}</td>
                                            <td className={directionClassName}>
                                                <FillDirectionLabel direction={fill.dir} />
                                            </td>
                                            <td className={classNames('font-bold', directionClassName)}>{fill.coin}</td>
                                            <td>{formatNumber(fill.px)}</td>
                                            <td>
                                                {formatSize(fill.sz)} {fill.coin}
                                            </td>
                                            <td>{tradeValue.toFormat(2)} USDC</td>
                                            <td
                                                className={
                                                    closedPnl.isPositive()
                                                        ? 'text-[#3dc233]'
                                                        : closedPnl.isNegative()
                                                          ? 'text-[#ff3545]'
                                                          : 'text-lightTextMain'
                                                }
                                            >
                                                <span className="block">{formatSignedUsd(closedPnl)}</span>
                                                <span className="mt-1 block">
                                                    {formatSignedPercent(closedPnlPercent)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState>
                        <Trans>No trading history</Trans>
                    </EmptyState>
                )
            ) : null}
        </section>
    );
}

export const PerpsAccountPanels = memo(function PerpsAccountPanels({ address, onIntent }: Props) {
    const [tab, setTab] = useState<Tab>('orders');
    if (address) return <AuthenticatedPanels address={address} onIntent={onIntent} />;
    return (
        <section className="h-[209px] overflow-hidden bg-white text-lightTextMain">
            <AccountTabs tab={tab} counts={{ positions: 0, orders: 0, history: 0 }} onChange={setTab} />
            <table className="w-full table-fixed text-left text-[13px]">
                <thead className="h-[41px] border-b border-[#f5f5f5] text-[#767676]">
                    <tr>
                        <th className="px-4 font-normal">
                            <Trans>Date</Trans>
                        </th>
                        <th className="font-normal">
                            <Trans>Type</Trans>
                        </th>
                        <th className="font-normal">
                            <Trans>Market</Trans>
                        </th>
                        <th className="font-normal">
                            <Trans>Size</Trans>
                        </th>
                        <th className="font-normal">
                            <Trans>Filled</Trans>
                        </th>
                        <th className="font-normal">
                            <Trans>Value</Trans>
                        </th>
                        <th className="font-normal">
                            <Trans>Price</Trans>
                        </th>
                        <th className="font-normal">
                            <Trans>TP/SL</Trans>
                        </th>
                    </tr>
                </thead>
            </table>
            <EmptyState>
                <button
                    type="button"
                    className="font-semibold text-[#4c4aa9]"
                    onClick={() => onIntent({ kind: 'account' })}
                >
                    <Trans>Connect your wallet to view positions</Trans>
                </button>
            </EmptyState>
        </section>
    );
});
