'use client';

import WonIcon from '@dimensiondev/assets/polymarket-claim.svg';
import LostIcon from '@dimensiondev/assets/polymarket-lost.svg';
import { PredictionPlatform } from '@dimensiondev/enums';
import { classNames, removeTrailingZeros, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact, first, isUndefined } from 'lodash-es';

import { Link } from '@/components/Link.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { PredictionPositionAction } from '@/components/Prediction/PredictionPositionAction.js';
import { Image } from '@/esm/Image.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import {
    captureOpinionProfilePositionsEventClick,
    capturePolymarketProfilePositionsEventClick,
} from '@/providers/telemetry/capturePolymarketEvent.js';
import type { PredictionPositionDataForUI } from '@/types/prediction.js';

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

function formatSignedPercent(rate: number) {
    if (!Number.isFinite(rate) || rate === 0) return '0%';
    const text = `${removeTrailingZeros((Math.abs(rate) * 100).toFixed(2))}%`;
    return rate > 0 ? `+${text}` : `-${text}`;
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

    if (position.is_closed) {
        const isWon = position.pnl > 0;
        const totalBought = position.total_buy || position.shares;
        const totalTrade = position.avg_price * totalBought;
        const settlementValue = position.current_value ?? totalTrade + position.pnl;
        const pnlRate = Math.max(-1, totalTrade > 0 ? position.pnl / totalTrade : position.pnl_rate);

        return (
            <div key={position.Id} className="border-line flex w-full flex-col gap-3 rounded-xl border p-3">
                <div className="flex w-full items-center gap-2">
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg">
                        {position.image ? (
                            <Image
                                width={40}
                                height={40}
                                className="size-full object-cover"
                                src={position.image}
                                alt={displayTitle}
                            />
                        ) : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        {eventUrl ? (
                            <Link
                                href={eventUrl}
                                onClick={handleEventClick}
                                className="text-main line-clamp-2 min-w-0 break-words text-sm font-semibold leading-5 hover:underline"
                            >
                                {displayTitle}
                            </Link>
                        ) : (
                            <h3 className="text-main line-clamp-2 min-w-0 break-words text-sm font-semibold leading-5">
                                {displayTitle}
                            </h3>
                        )}
                        <div className="flex min-w-0 items-center gap-1">
                            <span
                                className={classNames(
                                    'flex h-5 shrink-0 items-center gap-0.5 rounded-[10px] pl-1 pr-1.5 text-xs font-medium leading-[14px]',
                                    isWon ? 'bg-[#DCF1D9] text-[#48AD3C]' : 'bg-[#FFE6E4] text-[#FF564D]',
                                )}
                            >
                                {isWon ? <WonIcon className="size-3.5" /> : <LostIcon className="size-3.5" />}
                                <span>{isWon ? <Trans>Won</Trans> : <Trans>Lost</Trans>}</span>
                            </span>
                            <span className="text-main truncate text-xs leading-[14px]">
                                {position.vote_status || '-'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="text-main truncate text-sm font-semibold leading-5">
                            <Trans>{formatPolymarketNumber(totalBought, { symbol: null })} shares</Trans>
                        </div>
                        <div className="text-second truncate text-xs leading-[14px]">
                            <Trans>Avg</Trans> {formatBetsPrice(position.avg_price)}
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div
                            className={classNames(
                                'truncate text-sm font-semibold leading-5',
                                isWon ? 'text-success' : 'text-danger',
                            )}
                        >
                            {formatPolymarketNumber(position.pnl, { sign: true })}({formatSignedPercent(pnlRate)})
                        </div>
                        <div className="text-second truncate text-xs leading-[14px]">
                            {formatPolymarketNumber(settlementValue)}
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="text-main truncate text-sm font-semibold leading-5">
                            {formatPolymarketNumber(totalTrade)}
                        </div>
                        <div className="text-second text-xs leading-[14px]">
                            <Trans>Total trade</Trans>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div key={position.Id} className="border-line flex flex-col items-start gap-3 rounded-xl border p-3">
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
                            className="text-main line-clamp-5 w-full break-words text-sm font-bold hover:underline"
                        >
                            {displayTitle}
                        </Link>
                    ) : (
                        <h3 className="text-main line-clamp-5 w-full break-words text-sm font-bold">{displayTitle}</h3>
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
                        <span className="text-second text-xs">
                            <Trans>{formatPolymarketNumber(position.shares, { symbol: null })} shares</Trans>
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex w-full flex-col items-center gap-2 md:flex-row">
                <div className="flex w-full min-w-0 flex-1 items-center justify-evenly gap-2 md:w-auto">
                    <div className="flex min-w-0 flex-1 shrink-0 flex-col items-start truncate">
                        <span className="text-main text-sm font-medium">{formatBetsPrice(position.avg_price)}</span>
                        <span className="text-second text-[11px]">
                            <Trans>Avg</Trans>
                        </span>
                    </div>
                    <div className="flex min-w-0 flex-1 shrink-0 flex-col items-start truncate">
                        <span className="text-main text-sm font-medium">{formatBetsPrice(position.cur_price)}</span>
                        <span className="text-second text-[11px]">
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
                            {`(${removeTrailingZeros(Math.abs(position.pnl_rate * 100).toFixed(2))}%)`}
                        </span>
                        <span className="text-second text-sm font-medium leading-[21px] tracking-[0.15px]">
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
