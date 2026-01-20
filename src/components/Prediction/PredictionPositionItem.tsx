import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact, first, isUndefined } from 'lodash-es';
import urlcat from 'urlcat';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { resolveOpinionEventUrl } from '@/helpers/resolveOpinionEventUrl.js';
import { resolvePolymarketEventUrl } from '@/helpers/resolvePolymarketEventUrl.js';
import { useOpenFireflyWallet } from '@/hooks/useOpenFireflyWallet.js';
import { type PredictionPositionDataForUI } from '@/types/prediction.js';

interface PredictionPositionItemProps {
    platform: PredictionPlatform;
    positionData: PredictionPositionDataForUI;
    showAction?: boolean;
}

function resolveEventUrl(platform: PredictionPlatform, positionData: PredictionPositionDataForUI) {
    switch (platform) {
        case PredictionPlatform.Polymarket: {
            const eventSlug = first(positionData.event_slugs);
            return eventSlug ? resolvePolymarketEventUrl(eventSlug) : undefined;
        }
        case PredictionPlatform.Opinion:
            return positionData.topicId
                ? resolveOpinionEventUrl(positionData.topicId, Boolean(positionData.is_mutil))
                : undefined;
        default:
            safeUnreachable(platform);
            return;
    }
}

function formatBetsPrice(price: number) {
    return removeTrailingZeros((price * 100).toFixed(2)) + '¢';
}

const MIN_SELLABLE_SHARES = 0.01;

export function PredictionPositionItem({ positionData: position, platform, showAction }: PredictionPositionItemProps) {
    const displayTitle =
        platform === PredictionPlatform.Opinion
            ? compact([position.parent_title, position.title]).join(' - ')
            : position.title;
    const openFireflyWallet = useOpenFireflyWallet();
    if (isUndefined(displayTitle)) return null;

    const isGreen = ['yes', 'up'].includes(position.vote_status.toLowerCase());
    const eventUrl = resolveEventUrl(platform, position);

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
                            alt={displayTitle}
                        />
                    ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    {eventUrl ? (
                        <Link
                            target="_blank"
                            href={eventUrl}
                            className="line-clamp-5 w-full break-words text-sm font-bold text-main hover:underline"
                        >
                            {displayTitle}
                        </Link>
                    ) : (
                        <h3 className="line-clamp-5 w-full break-words text-sm font-bold text-main">{displayTitle}</h3>
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
                    <span className="text-sm font-medium text-main">{formatBetsPrice(position.avg_price)}</span>
                    <span className="text-[11px] text-second">
                        <Trans>Avg</Trans>
                    </span>
                </div>
                <div className="flex flex-1 shrink-0 flex-col items-start">
                    <span className="text-sm font-medium text-main">{formatBetsPrice(position.cur_price)}</span>
                    <span className="text-[11px] text-second">
                        <Trans>Current</Trans>
                    </span>
                </div>
                <div className="flex flex-1 shrink-0 flex-col items-start justify-center">
                    <span
                        className={classNames('text-xs font-medium', position.pnl < 0 ? 'text-danger' : 'text-success')}
                    >
                        {formatPolymarketNumber(position.pnl, { symbol: true })}
                        {`(${removeTrailingZeros((Math.abs(position.pnl_rate) * 100).toFixed(2))}%)`}
                    </span>
                    <span className="text-sm font-medium leading-[21px] tracking-[0.15px] text-second">
                        {formatPolymarketNumber(position.total_buy)}
                    </span>
                </div>
                {showAction && platform === PredictionPlatform.Polymarket ? (
                    <div className="flex flex-1 items-center justify-end empty:hidden">
                        {position.isClaimable ? (
                            position.isWin ? (
                                <ClickableButton
                                    className="box-border h-8 w-[128px] whitespace-nowrap rounded-lg bg-[#429F37] py-2 text-xs text-white"
                                    onClick={() => {
                                        // There is no such an API endpoint for querying a single position,
                                        // so we need to pass the whole position object
                                        openFireflyWallet({
                                            path: urlcat('/bet/position', {
                                                position: JSON.stringify(position),
                                                action: 'claim-proceeds',
                                            }),
                                        });
                                    }}
                                >
                                    <Trans>Claim Proceed</Trans>
                                </ClickableButton>
                            ) : (
                                <ClickableButton
                                    className="box-border h-8 w-[128px] whitespace-nowrap rounded-lg bg-[#ff564d] py-2 text-xs text-white"
                                    onClick={async () => {
                                        // There is no such an API endpoint for querying a single position,
                                        // so we need to pass the whole position object
                                        openFireflyWallet({
                                            path: urlcat('/bet/position', {
                                                position: JSON.stringify(position),
                                                action: 'close-lost-position',
                                            }),
                                        });
                                    }}
                                >
                                    <Trans>Close lost position</Trans>
                                </ClickableButton>
                            )
                        ) : position.shares && position.shares >= MIN_SELLABLE_SHARES ? (
                            <ClickableButton
                                className="box-border h-8 w-[128px] whitespace-nowrap rounded-lg bg-highlight py-2 text-xs text-white"
                                onClick={() => {
                                    const outcomeIndex = position.vote_status === 'No' ? 1 : 0;
                                    openFireflyWallet({
                                        path: `/bet/event/${encodeURIComponent(position.marketSlug)}?side=sell&outcome=${outcomeIndex}`,
                                    });
                                }}
                            >
                                <Trans>Sell</Trans>
                            </ClickableButton>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
