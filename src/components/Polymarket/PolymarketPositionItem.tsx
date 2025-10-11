import { Trans } from '@lingui/react/macro';
import { isUndefined } from 'lodash-es';

import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { Image } from '@/esm/Image.js';
import { classNames } from '@/helpers/classNames.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import type { PolymarketPositionData } from '@/providers/types/Firefly.js';

interface PolymarketPositionItemProps {
    positionData: PolymarketPositionData;
}

function formatPolymarketPrice(price: number) {
    return removeTrailingZeros((price * 100).toFixed(2)) + '¢';
}

export function PolymarketPositionItem({ positionData }: PolymarketPositionItemProps) {
    if (isUndefined(positionData.title)) return null;

    const isGreen = ['Yes', 'Up'].includes(positionData.vote_status);

    return (
        <div key={positionData.Id} className="flex items-start gap-3 py-2 md:items-center">
            <div className="h-10 w-10 shrink-0">
                {positionData.image ? (
                    <Image
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded object-cover"
                        src={positionData.image}
                        alt={positionData.title}
                    />
                ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-2 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 flex-col">
                    <h3 className="line-clamp-5 w-full break-words text-sm font-bold text-main">
                        {positionData.title}
                    </h3>
                    <div className="flex items-center gap-2 pt-2">
                        <div
                            className={classNames(
                                'h-[22px] rounded px-1 text-xs font-semibold !leading-[22px]',
                                isGreen ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger',
                            )}
                        >
                            {positionData.vote_status}
                        </div>
                        <span className="text-xs text-second">
                            <Trans>{formatPolymarketNumber(positionData.shares, { prefix: null })} shares</Trans>
                        </span>
                    </div>
                </div>
                <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-start">
                    <div className="flex w-16 shrink-0 flex-col items-start">
                        <span className="text-sm font-medium text-main">
                            {formatPolymarketPrice(positionData.avg_price)}
                        </span>
                        <span className="text-[11px] uppercase text-second md:hidden">
                            <Trans>Avg</Trans>
                        </span>
                    </div>
                    <div className="flex w-16 shrink-0 flex-col items-start">
                        <span className="text-sm font-medium text-main">
                            {formatPolymarketPrice(positionData.cur_price)}
                        </span>
                        <span className="text-[11px] uppercase text-second md:hidden">
                            <Trans>Current</Trans>
                        </span>
                    </div>
                    <div className="flex w-40 shrink-0 justify-end">
                        <div className="flex flex-col items-end justify-center text-right">
                            <span className="text-sm font-medium leading-[21px] tracking-[0.15px] text-main">
                                {formatPolymarketNumber(positionData.total_buy)}
                            </span>
                            <span
                                className={classNames(
                                    'text-xs font-medium',
                                    positionData.pnl < 0 ? 'text-danger' : 'text-success',
                                )}
                            >
                                {formatPolymarketNumber(positionData.pnl, { symbol: true })}
                                {`(${removeTrailingZeros((positionData.pnl_rate * 100).toFixed(2))}%)`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
