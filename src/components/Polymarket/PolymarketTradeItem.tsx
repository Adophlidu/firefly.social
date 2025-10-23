import { Trans } from '@lingui/react/macro';
import type { HTMLProps } from 'react';

import BuyIcon from '@/assets/polymarket-bought.svg';
import SellIcon from '@/assets/polymarket-sold.svg';
import { Link } from '@/components/Link.js';
import { PolymarketTime } from '@/components/Polymarket/PolymarketTime.js';
import { Image } from '@/esm/Image.js';
import { classNames } from '@/helpers/classNames.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { leftShift, rightShift } from '@/helpers/number.js';
import { resolvePolymarketEventUrl } from '@/helpers/resolvePolymarketEventUrl.js';
import type { PolymarketTradeData } from '@/providers/types/Firefly.js';

interface PolymarketTradeItemProps extends HTMLProps<HTMLDivElement> {
    trade: PolymarketTradeData;
}
interface PolymarketTradeTypeProps extends HTMLProps<HTMLDivElement> {
    type: string;
    onlyIcon?: boolean;
}

function PolymarketTradeType({ type, onlyIcon = false, className }: PolymarketTradeTypeProps) {
    const Icon = {
        buy: BuyIcon,
        sell: SellIcon,
    }[type];
    const title = {
        buy: <Trans>Bought</Trans>,
        sell: <Trans>Sold</Trans>,
    }[type];

    if (!title || (onlyIcon && !Icon)) return null;

    return (
        <div className={classNames('w-[130px] shrink-0 items-center gap-3', className)}>
            {Icon ? <Icon width={18} height={18} /> : null}
            {!onlyIcon ? <span className="text-sm font-medium text-main">{title}</span> : null}
        </div>
    );
}

export function PolymarketTradeItem({ trade, className }: PolymarketTradeItemProps) {
    const isGreen = trade.outcome === 'Yes';
    const numSymbol = {
        buy: '-',
        sell: '+',
    }[trade.side];

    return (
        <div className={classNames('flex items-center border-t border-line px-4 py-2', className)}>
            <PolymarketTradeType className="hidden md:flex" type={trade.side} />
            <div className="flex min-w-0 flex-1 gap-3 md:items-center">
                <div className="flex size-11 shrink-0 items-center overflow-hidden rounded">
                    {trade.icon ? (
                        <Image
                            src={trade.icon}
                            alt={trade.title}
                            className="size-full object-cover"
                            width={44}
                            height={44}
                        />
                    ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link
                        target="_blank"
                        href={resolvePolymarketEventUrl(trade.slug)}
                        className="text-[13px] font-medium text-main hover:underline"
                    >
                        {trade.title}
                    </Link>
                    <div className="flex items-center gap-1">
                        <PolymarketTradeType onlyIcon className="flex !w-auto md:hidden" type={trade.side} />
                        <div
                            className={classNames(
                                'flex h-[22px] items-center gap-1 rounded-md px-1.5 text-xs font-semibold !leading-[22px]',
                                isGreen ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger',
                            )}
                        >
                            <span>{`${trade.outcome}`}</span>
                            <span>{removeTrailingZeros(rightShift(trade.price, 2).toFixed(1))}¢</span>
                        </div>
                        <span className="text-xs font-medium text-second">
                            <Trans>{leftShift(trade.size, 6).toFixed(1)} shares</Trans>
                        </span>
                    </div>
                    <div className="mt-1.5 flex items-end justify-between md:hidden">
                        <div className="flex flex-col">
                            <span
                                className={classNames(
                                    'text-sm font-medium text-main',
                                    trade.side === 'sell' ? 'text-success' : '',
                                )}
                            >{`${numSymbol || ''}$${leftShift(trade.usdcSize, 6).toFixed(2)}`}</span>
                            <span className="text-xs font-medium text-second">
                                <Trans>Value</Trans>
                            </span>
                        </div>
                        <span className="text-xs font-medium text-second">
                            <PolymarketTime timestamp={trade.timestamp * 1000} />
                        </span>
                    </div>
                </div>
                <div className="hidden shrink-0 items-center gap-4 md:flex">
                    <div
                        className={classNames(
                            'w-16 text-right text-sm font-medium text-main',
                            trade.side === 'sell' ? 'text-success' : '',
                        )}
                    >
                        {`${numSymbol || ''}$${leftShift(trade.usdcSize, 6).toFixed(2)}`}
                    </div>
                    <div className="w-24 text-right text-xs font-medium text-second">
                        <PolymarketTime timestamp={trade.timestamp * 1000} />
                    </div>
                </div>
            </div>
        </div>
    );
}
