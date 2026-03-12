import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact, first, isUndefined } from 'lodash-es';

import { Link } from '@/components/Link.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { PredictionPositionAction } from '@/components/Prediction/PredictionPositionAction.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import {
    captureOpinionProfilePositionsEventClick,
    capturePolymarketProfilePositionsEventClick,
} from '@/providers/telemetry/capturePolymarketEvent.js';
import { type PredictionPositionDataForUI } from '@/types/prediction.js';

interface PredictionPositionItemProps {
    platform: PredictionPlatform;
    positionData: PredictionPositionDataForUI;
    showAction?: boolean;
    targetProfileInfo?: {
        address: string;
        proxyAddress?: string;
        polymarketName?: string;
        opinionName?: string;
        isFireflyUser?: boolean;
        fireflyAccountId?: string;
    };
}

function resolveEventUrl(platform: PredictionPlatform, positionData: PredictionPositionDataForUI) {
    switch (platform) {
        case PredictionPlatform.Polymarket: {
            const eventSlug = first(positionData.event_slugs) || positionData.marketSlug;
            return eventSlug ? RouteResolver.betsEventDetail(PredictionPlatform.Polymarket, eventSlug) : undefined;
        }
        case PredictionPlatform.Opinion:
            return positionData.topicId
                ? RouteResolver.betsEventDetail(PredictionPlatform.Opinion, positionData.topicId.toString(), {
                      multiple: Boolean(positionData.is_mutil),
                  })
                : undefined;
        default:
            safeUnreachable(platform);
            return;
    }
}

function formatBetsPrice(price: number) {
    return removeTrailingZeros(formatPolymarketNumber(price * 100, { digits: 1, sign: false, symbol: '' })) + '¢';
}

export function PredictionPositionItem({
    positionData: position,
    platform,
    showAction,
    targetProfileInfo,
}: PredictionPositionItemProps) {
    const displayTitle =
        platform === PredictionPlatform.Opinion
            ? compact([position.parent_title, position.title]).join(' - ')
            : position.title;
    if (isUndefined(displayTitle)) return null;

    const isGreen = position.outcomeIndex === 0 || ['yes', 'up'].includes(position.vote_status.toLowerCase());
    const eventUrl = resolveEventUrl(platform, position);

    const handleEventClick = () => {
        if (!targetProfileInfo) return;

        const baseParams = {
            target_proxy_wallet_address: targetProfileInfo.proxyAddress || targetProfileInfo.address,
            target_wallet_address: targetProfileInfo.proxyAddress ? targetProfileInfo.address : undefined,
            is_firefly_user: targetProfileInfo.isFireflyUser ?? false,
            target_firefly_account_id: targetProfileInfo.fireflyAccountId,
            event_slug: position.marketSlug || position.event_slugs[0] || '',
            market_title: displayTitle,
            outcome_name: position.vote_status,
        };

        if (platform === PredictionPlatform.Polymarket) {
            capturePolymarketProfilePositionsEventClick({
                ...baseParams,
                target_polymarket_name: targetProfileInfo.polymarketName,
            });
        } else if (platform === PredictionPlatform.Opinion) {
            captureOpinionProfilePositionsEventClick({
                ...baseParams,
                target_opinion_name: targetProfileInfo.opinionName,
            });
        }
    };

    return (
        <div key={position.Id} className="flex flex-col items-start gap-3 rounded-xl border border-line p-3">
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
                            href={eventUrl}
                            onClick={handleEventClick}
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
                            <Trans>{formatPolymarketNumber(position.shares, { symbol: null })} shares</Trans>
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex w-full flex-col items-center gap-2 md:flex-row">
                <div className="flex w-full min-w-0 flex-1 items-center justify-evenly gap-2 md:w-auto">
                    <div className="flex min-w-0 flex-1 shrink-0 flex-col items-start truncate">
                        <span className="text-sm font-medium text-main">{formatBetsPrice(position.avg_price)}</span>
                        <span className="text-[11px] text-second">
                            <Trans>Avg</Trans>
                        </span>
                    </div>
                    <div className="flex min-w-0 flex-1 shrink-0 flex-col items-start truncate">
                        <span className="text-sm font-medium text-main">{formatBetsPrice(position.cur_price)}</span>
                        <span className="text-[11px] text-second">
                            <Trans>Current</Trans>
                        </span>
                    </div>
                    <div className="flex min-w-0 flex-1 shrink-0 flex-col items-start justify-center truncate">
                        <span
                            className={classNames(
                                'text-xs font-medium',
                                position.pnl < 0 ? 'text-danger' : 'text-success',
                            )}
                        >
                            {formatPolymarketNumber(position.pnl, { sign: true })}
                            {`(${removeTrailingZeros((Math.abs(position.pnl_rate) * 100).toFixed(2))}%)`}
                        </span>
                        <span className="text-sm font-medium leading-[21px] tracking-[0.15px] text-second">
                            {formatPolymarketNumber(position.current_value)}
                        </span>
                    </div>
                </div>
                {showAction && platform === PredictionPlatform.Polymarket ? (
                    <div className="w-full shrink-0 md:w-auto">
                        <PredictionPositionAction position={position} />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
