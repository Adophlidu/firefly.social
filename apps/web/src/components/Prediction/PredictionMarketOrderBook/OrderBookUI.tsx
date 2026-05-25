'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo, type ReactNode, useEffect, useMemo, useRef } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { useForkRef } from '@/hooks/useForkRef.js';
import type { BetsOrderBookItem } from '@/types/prediction.js';

interface OrderBookUIProps extends HTMLProps<HTMLDivElement> {
    bids: BetsOrderBookItem[];
    asks: BetsOrderBookItem[];
    lastPrice: number | null;
    spreads: number | null;
    onPriceClick?: (price: number) => void;
}
interface OrderBookListProps {
    data: BetsOrderBookItem[];
    emptyMessage: ReactNode;
    side: 'bids' | 'asks';
    onPriceClick?: (price: number) => void;
}

function OrderBookList({ data, emptyMessage, side, onPriceClick }: OrderBookListProps) {
    const maxCount = useMemo(() => Math.max(...data.map((item) => item.size)), [data]);

    if (!data.length) {
        return (
            <div className="flex h-10 items-center justify-center text-sm font-semibold text-second">
                {emptyMessage}
            </div>
        );
    }

    const isAsk = side === 'asks';

    return (
        <ul>
            {data.map((item) => (
                <li key={`${side}-${item.price}`} className="h-[22px]">
                    <ClickableButton
                        className={classNames(
                            'grid size-full grid-cols-[minmax(52px,1fr)_minmax(72px,1fr)_minmax(86px,1.1fr)] items-center gap-1 text-left',
                            isAsk ? 'hover:bg-danger/10' : 'hover:bg-success/10',
                        )}
                        onClick={() => onPriceClick?.(item.price)}
                    >
                        <div className={classNames('relative h-full min-w-0', isAsk ? 'text-danger' : 'text-success')}>
                            {(item.price * 100).toFixed(1)}¢
                            <div
                                className={classNames(
                                    'absolute inset-y-0 left-0 transition-all duration-300 ease-in-out',
                                    isAsk ? 'bg-danger/20' : 'bg-success/20',
                                )}
                                style={{
                                    width: maxCount === 0 ? '2%' : `calc(2% + ${(item.size / maxCount) * 98}%)`,
                                }}
                            />
                        </div>
                        <span className="min-w-0 truncate">{toFixedTrimmed(item.size, 2)}</span>
                        <span className="min-w-0 truncate text-right">
                            ${toFixedTrimmed(item.price * item.size, 2)}
                        </span>
                    </ClickableButton>
                </li>
            ))}
        </ul>
    );
}

export const OrderBookUI = memo<OrderBookUIProps>(function OrderBookUI({
    bids,
    asks,
    lastPrice,
    spreads,
    onPriceClick,
    ref,
}) {
    const lastPriceRef = useRef<HTMLDivElement>(null);
    const forkedRef = useForkRef(lastPriceRef, ref);

    const reversedBids = useMemo(() => bids.slice().reverse(), [bids]);

    useEffect(() => {
        // @ts-ignore
        lastPriceRef.current?.scrollIntoView({ block: 'center', container: 'nearest' });
    }, [bids, asks]);

    return (
        <div>
            <div className="mb-2 grid grid-cols-[minmax(52px,1fr)_minmax(72px,1fr)_minmax(86px,1.1fr)] items-center gap-1 text-left text-xs text-second">
                <span className="min-w-0">
                    <Trans>Price</Trans>
                </span>
                <span className="min-w-0">
                    <Trans>Shares</Trans>
                </span>
                <span className="min-w-0 text-right">
                    <Trans>Total</Trans>
                </span>
            </div>
            <div className="no-scrollbar max-h-[250px] space-y-2 overflow-y-auto text-xs font-medium">
                <OrderBookList
                    data={asks}
                    side="asks"
                    emptyMessage={<Trans>No asks</Trans>}
                    onPriceClick={onPriceClick}
                />
                <div ref={forkedRef} className="grid h-[14px] grid-cols-2 items-center gap-1 text-third">
                    <span className="min-w-0 truncate">
                        <Trans id="bets-last-price" comment="Last: {lastPrice}">
                            Last: {lastPrice !== null ? `${(lastPrice * 100).toFixed(1)}¢` : '-'}
                        </Trans>
                    </span>
                    <span className="min-w-0 truncate">
                        <Trans>
                            Spread:{' '}
                            {spreads !== null && !!asks.length && !!bids.length
                                ? `${(spreads * 100).toFixed(1)}¢`
                                : '0.0¢'}
                        </Trans>
                    </span>
                </div>
                <OrderBookList
                    data={reversedBids}
                    side="bids"
                    emptyMessage={<Trans>No bids</Trans>}
                    onPriceClick={onPriceClick}
                />
            </div>
        </div>
    );
});
