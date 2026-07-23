'use client';

import ArrowDownIcon from '@dimensiondev/assets/arrow-down.svg';
import { usePerpsL2Book } from '@dimensiondev/perps-react';
import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
    buildOrderBookPresentation,
    getOrderBookRetryDelay,
    getOrderBookStepOptions,
    type OrderBookRow,
    type OrderBookUnit,
} from '@/components/Perps/orderBookPresentation.js';

interface Props {
    coin: string;
    onBuy: () => void;
    onSell: () => void;
}

interface SelectOption<T extends string | number> {
    label: string;
    value: T;
}

interface OrderBookSelectProps<T extends string | number> {
    label: string;
    options: Array<SelectOption<T>>;
    value?: T;
    onChange(value: T): void;
}

function OrderBookSelectInner<T extends string | number>({ label, options, value, onChange }: OrderBookSelectProps<T>) {
    const selected = options.find((option) => option.value === value);

    return (
        <Popover as="div" className="relative flex-1">
            {({ open, close }) => (
                <>
                    <PopoverButton
                        aria-label={label}
                        className="flex h-6 w-full items-center justify-between rounded bg-[#f5f5f9] px-2 text-xs font-medium text-lightTextMain outline-none focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                    >
                        <span>{selected?.label ?? '--'}</span>
                        <ArrowDownIcon className={classNames('size-4 transition-transform', { 'rotate-180': open })} />
                    </PopoverButton>
                    <PopoverPanel
                        role="listbox"
                        aria-label={label}
                        className="absolute left-0 top-7 z-50 w-full overflow-hidden rounded-lg border border-[#efeff3] bg-white p-1 shadow-lg"
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={option.value === value}
                                className="flex h-7 w-full items-center rounded px-2 text-left text-xs font-medium text-lightTextMain hover:bg-[#f5f5f9] aria-selected:bg-[#efeff3]"
                                onClick={() => {
                                    onChange(option.value);
                                    close();
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </PopoverPanel>
                </>
            )}
        </Popover>
    );
}

const OrderBookSelect = memo(OrderBookSelectInner) as typeof OrderBookSelectInner;

function formatPrice(value?: string) {
    if (!value) return '--';
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toLocaleString(undefined, { maximumFractionDigits: 8 }) : value;
}

function formatBookValue(value: number, unit: OrderBookUnit) {
    return value.toLocaleString(undefined, {
        maximumFractionDigits: unit === 'USDC' ? 0 : 6,
    });
}

interface BookRowsProps {
    rows: OrderBookRow[];
    side: 'ask' | 'bid';
    unit: OrderBookUnit;
}

function BookRows({ rows, side, unit }: BookRowsProps) {
    return (
        <div className="flex flex-col">
            {rows.map((level) => (
                <div
                    key={`${side}-${level.px}`}
                    className="grid h-6 grid-cols-2 items-center gap-1 text-xs font-medium tabular-nums leading-[14px]"
                >
                    <div className="relative flex h-full items-center">
                        <span
                            aria-hidden
                            className={
                                side === 'ask'
                                    ? 'absolute inset-y-0 left-0 bg-[#ffe6e4]'
                                    : 'absolute inset-y-0 left-0 bg-[#dcf1d9]'
                            }
                            style={{ width: `${Math.min(100, Math.max(0, level.ratio * 100))}%` }}
                        />
                        <span
                            className={side === 'ask' ? 'relative z-1 text-[#ff564d]' : 'relative z-1 text-[#48ad3c]'}
                        >
                            {formatPrice(level.px)}
                        </span>
                    </div>
                    <span className="text-right text-lightTextMain">{formatBookValue(level.total, unit)}</span>
                </div>
            ))}
        </div>
    );
}

interface PerpsOrderBookContentProps extends Props {
    retryAttempt: number;
    stepIndex: number;
    unit: OrderBookUnit;
    onConnected(): void;
    onRetry(): void;
    onStepIndexChange(value: number): void;
    onUnitChange(value: OrderBookUnit): void;
}

const PerpsOrderBookContent = memo(function PerpsOrderBookContent({
    coin,
    onBuy,
    onSell,
    retryAttempt,
    stepIndex,
    unit,
    onConnected,
    onRetry,
    onStepIndexChange,
    onUnitChange,
}: PerpsOrderBookContentProps) {
    const { book, levels, isLoading, error } = usePerpsL2Book({ coin, stepIndex, maxRows: 7, reverseAsks: false });
    const asks = useMemo(() => [...levels.asks].reverse(), [levels.asks]);
    const bids = levels.bids;
    const presentation = useMemo(() => buildOrderBookPresentation(asks, bids, unit), [asks, bids, unit]);
    const referencePrice = Number(bids[0]?.px || asks.at(-1)?.px);
    const stepOptions = useMemo(
        () => getOrderBookStepOptions(referencePrice).map(({ label, stepIndex: value }) => ({ label, value })),
        [referencePrice],
    );
    const unitOptions = useMemo<Array<SelectOption<OrderBookUnit>>>(
        () => [
            { label: 'USDC', value: 'USDC' },
            { label: coin, value: 'coin' },
        ],
        [coin],
    );

    useEffect(() => {
        if (book) onConnected();
    }, [book, onConnected]);

    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(onRetry, getOrderBookRetryDelay(retryAttempt));
        return () => clearTimeout(timer);
    }, [error, onRetry, retryAttempt]);

    return (
        <section
            data-testid="perps-order-book"
            aria-label={t`Order Book`}
            className="flex h-[557px] w-56 shrink-0 flex-col border-y border-[#f5f5f5] bg-white"
        >
            <div className="flex h-[124px] shrink-0 flex-col gap-3 px-3 py-2">
                <button
                    type="button"
                    aria-label={t`Buy / Long`}
                    className="h-12 rounded-lg bg-[#3fa336] text-base font-bold leading-6 text-white outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                    onClick={onBuy}
                >
                    <Trans>Buy/Long</Trans>
                </button>
                <button
                    type="button"
                    aria-label={t`Sell / Short`}
                    className="h-12 rounded-lg bg-[#ff372b] text-base font-bold leading-6 text-white outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                    onClick={onSell}
                >
                    <Trans>Sell/Short</Trans>
                </button>
            </div>
            <div className="mt-2 flex min-h-0 flex-1 flex-col">
                <div className="flex h-6 gap-3">
                    <OrderBookSelect<number>
                        label={t`Select price aggregation`}
                        options={stepOptions}
                        value={stepOptions.length ? stepIndex : undefined}
                        onChange={onStepIndexChange}
                    />
                    <OrderBookSelect<OrderBookUnit>
                        label={t`Select order book unit`}
                        options={unitOptions}
                        value={unit}
                        onChange={onUnitChange}
                    />
                </div>
                <div className="grid h-[18px] grid-cols-2 items-center gap-1 text-xs leading-[14px] text-[#767676]">
                    <span>
                        <Trans>Price</Trans>
                    </span>
                    <span className="text-right">
                        <Trans>Total ({unit === 'USDC' ? 'USDC' : coin})</Trans>
                    </span>
                </div>
                {isLoading ? (
                    <p className="flex flex-1 items-center justify-center text-sm text-[#767676]">
                        <Trans>Loading order book…</Trans>
                    </p>
                ) : null}
                {error ? (
                    <div
                        role="alert"
                        className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-[#ff372b]"
                    >
                        <p>
                            <Trans>Order book is unavailable.</Trans>
                        </p>
                        <button
                            type="button"
                            className="font-semibold text-[#4c4aa9] outline-none focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                            onClick={onRetry}
                        >
                            <Trans>Retry</Trans>
                        </button>
                    </div>
                ) : null}
                {!isLoading && !error ? (
                    <>
                        <BookRows rows={presentation.asks} side="ask" unit={unit} />
                        <div className="my-1 flex h-[30px] shrink-0 items-center justify-center gap-3 bg-[#f5f5f9] text-xs leading-[14px] text-lightTextMain">
                            <span>
                                <Trans>Spread</Trans>
                            </span>
                            <span className="tabular-nums">
                                {presentation.spread === undefined ? '--' : formatPrice(String(presentation.spread))}
                            </span>
                            <span className="tabular-nums">
                                {presentation.spreadPercent === undefined
                                    ? '--'
                                    : `${presentation.spreadPercent.toFixed(3)}%`}
                            </span>
                        </div>
                        <BookRows rows={presentation.bids} side="bid" unit={unit} />
                    </>
                ) : null}
                {!isLoading && !error && asks.length === 0 && bids.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center text-sm text-[#767676]">
                        <Trans>No order-book data.</Trans>
                    </p>
                ) : null}
            </div>
        </section>
    );
});

export const PerpsOrderBook = memo(function PerpsOrderBook(props: Props) {
    const [stepIndex, setStepIndex] = useState(0);
    const [unit, setUnit] = useState<OrderBookUnit>('USDC');
    const [subscriptionVersion, setSubscriptionVersion] = useState(0);
    const [retryAttempt, setRetryAttempt] = useState(0);
    const handleRetry = useCallback(() => {
        setRetryAttempt((current) => current + 1);
        setSubscriptionVersion((current) => current + 1);
    }, []);
    const handleConnected = useCallback(() => setRetryAttempt(0), []);

    return (
        <PerpsOrderBookContent
            key={subscriptionVersion}
            {...props}
            retryAttempt={retryAttempt}
            stepIndex={stepIndex}
            unit={unit}
            onConnected={handleConnected}
            onRetry={handleRetry}
            onStepIndexChange={setStepIndex}
            onUnitChange={setUnit}
        />
    );
});
