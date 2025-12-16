import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { first, isUndefined } from 'lodash-es';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { Image } from '@/esm/Image.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { resolvePolymarketEventUrl } from '@/helpers/resolvePolymarketEventUrl.js';
import type { PolymarketPositionData } from '@/providers/types/Firefly.js';

interface PolymarketPositionItemProps {
    positionData: PolymarketPositionData;
    showAction?: boolean;
}

function formatPolymarketPrice(price: number) {
    return removeTrailingZeros((price * 100).toFixed(2)) + '¢';
}

export function PolymarketPositionItem({ positionData: position, showAction }: PolymarketPositionItemProps) {
    if (isUndefined(position.title)) return null;

    const isGreen = ['Yes', 'Up'].includes(position.vote_status);
    const eventSlug = first(position.event_slugs);

    return (
        <div key={position.Id} className="mb-4 flex flex-col items-start gap-3 rounded-xl border border-line p-3">
            <div className="flex w-full gap-2">
                <div className="size-10 shrink-0">
                    {position.image ? (
                        <Image
                            width={40}
                            height={40}
                            className="size-10 shrink-0 rounded object-cover"
                            src={position.image}
                            alt={position.title}
                        />
                    ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    {eventSlug ? (
                        <Link
                            target="_blank"
                            href={resolvePolymarketEventUrl(eventSlug)}
                            className="line-clamp-5 w-full break-words text-sm font-bold text-main hover:underline"
                        >
                            {position.title}
                        </Link>
                    ) : (
                        <h3 className="line-clamp-5 w-full break-words text-sm font-bold text-main">
                            {position.title}
                        </h3>
                    )}
                    <div className="flex items-center gap-2">
                        <div
                            className={classNames(
                                'h-[22px] rounded text-xs font-semibold !leading-[22px]',
                                isGreen ? 'text-success' : 'text-danger',
                            )}
                            style={{ fontFamily: 'Bedstead' }}
                        >
                            {position.vote_status}
                        </div>
                        <span className="text-xs text-second">
                            <Trans>{formatPolymarketNumber(position.shares, { prefix: null })} shares</Trans>
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex w-full items-center justify-evenly gap-2">
                <div className="flex flex-1 shrink-0 flex-col items-start">
                    <span className="text-sm font-medium text-main">{formatPolymarketPrice(position.avg_price)}</span>
                    <span className="text-[11px] text-second">
                        <Trans>Avg</Trans>
                    </span>
                </div>
                <div className="flex flex-1 shrink-0 flex-col items-start">
                    <span className="text-sm font-medium text-main">{formatPolymarketPrice(position.cur_price)}</span>
                    <span className="text-[11px] text-second">
                        <Trans>Current</Trans>
                    </span>
                </div>
                <div className="flex flex-1 shrink-0 flex-col items-start justify-center">
                    <span
                        className={classNames('text-xs font-medium', position.pnl < 0 ? 'text-danger' : 'text-success')}
                    >
                        {formatPolymarketNumber(position.pnl, { symbol: true })}
                        {`(${removeTrailingZeros((position.pnl_rate * 100).toFixed(2))}%)`}
                    </span>
                    <span className="text-sm font-medium leading-[21px] tracking-[0.15px] text-second">
                        {formatPolymarketNumber(position.total_buy)}
                    </span>
                </div>
                {showAction ? (
                    <div className="flex flex-1 items-center justify-end">
                        <ClickableButton
                            className={classNames(
                                'box-border h-8 w-[128px] whitespace-nowrap rounded-lg py-2 text-xs text-white',
                                {
                                    'bg-highlight': !position.IsClaim && !position.is_closed,
                                    'bg-danger': position.IsClaim,
                                    'bg-[#ff564d]': position.is_closed,
                                },
                            )}
                        >
                            {position.IsClaim ? (
                                <Trans>Claim Proceed</Trans>
                            ) : position.is_closed ? (
                                <Trans>Close lost position</Trans>
                            ) : (
                                <Trans>Sell</Trans>
                            )}
                        </ClickableButton>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
