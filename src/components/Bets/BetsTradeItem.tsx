import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { type HTMLProps } from 'react';

import BuyIcon from '@/assets/polymarket-bought.svg';
import SellIcon from '@/assets/polymarket-sold.svg';
import { BetsTime } from '@/components/Bets/BetsTime.js';
import { Link } from '@/components/Link.js';
import { BetsPlatform } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { rightShift } from '@/helpers/number.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

interface BetsTradeItemProps extends HTMLProps<HTMLDivElement> {
    trade: BetsActivity;
    platform: BetsPlatform;
}
interface BetsTradeTypeProps extends HTMLProps<HTMLDivElement> {
    type: string;
    onlyIcon?: boolean;
}

function BetsTradeType({ type, onlyIcon = false, className }: BetsTradeTypeProps) {
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
            {!onlyIcon ? <span className="text-sm font-medium text-main">{title}</span> : null}
        </div>
    );
}

export function BetsTradeItem({ trade, platform, className }: BetsTradeItemProps) {
    const isGreen = trade.outcome.toLowerCase() === 'yes';
    const displayTitle =
        platform === BetsPlatform.Opinion ? compact([trade.parent_title, trade.title]).join(' - ') : trade.title;

    return (
        <div className={classNames('flex items-center border-t border-line px-4 py-2', className)}>
            <BetsTradeType className="hidden md:flex" type={trade.side} />
            <div className="flex min-w-0 flex-1 gap-3 md:items-center">
                <div className="flex size-11 shrink-0 items-center overflow-hidden rounded">
                    {trade.image ? (
                        <Image
                            src={trade.image}
                            alt={displayTitle}
                            className="size-full object-cover"
                            width={44}
                            height={44}
                        />
                    ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link
                        target="_blank"
                        href={trade.url}
                        className="text-[13px] font-medium text-main hover:underline"
                    >
                        {displayTitle}
                    </Link>
                    <div className="flex items-center gap-1">
                        <BetsTradeType onlyIcon className="flex !w-auto md:hidden" type={trade.side} />
                        <div
                            className={classNames(
                                'flex h-[18px] items-center gap-1 rounded-md px-1 py-0.5 text-xs font-semibold !leading-[18px]',
                                isGreen ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger',
                            )}
                        >
                            <span>{`${trade.outcome}`}</span>
                            <span>{removeTrailingZeros(rightShift(trade.price, 2).toFixed(1))}¢</span>
                        </div>
                        <span className="text-xs font-medium text-second">
                            <Trans>{toFixedTrimmed(+trade.size, 2)} shares</Trans>
                        </span>
                    </div>
                    <div className="mt-1.5 flex items-end justify-between md:hidden">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-main">{`$${toFixedTrimmed(+trade.usdcSize, 2)}`}</span>
                            <span className="text-xs font-medium text-second">
                                <Trans>Value</Trans>
                            </span>
                        </div>
                        <span className="text-xs font-medium text-second">
                            <BetsTime timestamp={trade.timestamp * 1000} />
                        </span>
                    </div>
                </div>
                <div className="hidden shrink-0 items-end gap-1 md:flex md:flex-col">
                    <div className="w-16 text-right text-sm font-medium text-main">
                        {`$${toFixedTrimmed(+trade.usdcSize, 2)}`}
                    </div>
                    <div className="w-24 text-right text-xs font-medium text-second">
                        <BetsTime timestamp={trade.timestamp * 1000} />
                    </div>
                </div>
            </div>
        </div>
    );
}
