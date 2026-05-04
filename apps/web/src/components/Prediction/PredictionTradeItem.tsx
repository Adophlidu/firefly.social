'use client';

import BuyIcon from '@dimensiondev/assets/polymarket-bought.svg';
import SellIcon from '@dimensiondev/assets/polymarket-sold.svg';
import { classNames, removeTrailingZeros } from '@dimensiondev/utils';
import { rightShift } from '@dimensiondev/web3/numbers';
import { Plural, Trans } from '@lingui/react/macro';
import { compact, first } from 'lodash-es';
import type { HTMLProps } from 'react';

import { Link } from '@/components/Link.js';
import { PredictionTime } from '@/components/Prediction/PredictionTime.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import {
    captureOpinionProfileTradesEventClick,
    capturePolymarketProfileTradesEventClick,
} from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

interface PredictionTradeItemProps extends HTMLProps<HTMLDivElement> {
    trade: BetsActivity;
    platform: PredictionPlatform;
    targetProfileInfo?: {
        address: string;
        proxyAddress?: string;
        polymarketName?: string;
        opinionName?: string;
        isFireflyUser?: boolean;
        fireflyAccountId?: string;
    };
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
            {!onlyIcon ? <span className="text-main text-sm font-medium">{title}</span> : null}
        </div>
    );
}

export function PredictionTradeItem({ trade, platform, className, targetProfileInfo }: PredictionTradeItemProps) {
    const isGreen = trade.outcomeIndex === 0;
    const displayTitle =
        platform === PredictionPlatform.Opinion ? compact([trade.parent_title, trade.title]).join(' - ') : trade.title;
    const eventUrl = trade.topicId
        ? RouteResolver.betsEventDetail(
              platform,
              trade.topicId,
              platform === PredictionPlatform.Opinion
                  ? {
                        multiple: Boolean(trade.isMutil),
                    }
                  : undefined,
          )
        : trade.url;
    const eventImage = trade.image || first(trade.rawData?.events)?.image;

    const handleEventClick = () => {
        if (!targetProfileInfo) return;

        const baseParams = {
            target_proxy_wallet_address: targetProfileInfo.proxyAddress || targetProfileInfo.address,
            target_wallet_address: targetProfileInfo.proxyAddress ? targetProfileInfo.address : undefined,
            is_firefly_user: targetProfileInfo.isFireflyUser ?? false,
            target_firefly_account_id: targetProfileInfo.fireflyAccountId,
            event_slug: trade.topicId?.toString() || trade.slug || '',
            market_title: displayTitle,
            outcome_name: trade.outcome?.toString() || '',
        };

        if (platform === PredictionPlatform.Polymarket) {
            capturePolymarketProfileTradesEventClick({
                ...baseParams,
                target_polymarket_name: targetProfileInfo.polymarketName,
            });
        } else if (platform === PredictionPlatform.Opinion) {
            captureOpinionProfileTradesEventClick({
                ...baseParams,
                target_opinion_name: targetProfileInfo.opinionName,
            });
        }
    };

    return (
        <div className={classNames('border-line flex items-center border-t px-4 py-2', className)}>
            <BetsTradeType className="hidden md:flex" type={trade.side} />
            <div className="flex min-w-0 flex-1 gap-3 md:items-center">
                <div className="flex size-11 shrink-0 items-center overflow-hidden rounded">
                    {eventImage ? (
                        <Image
                            src={eventImage}
                            alt={displayTitle}
                            className="size-full object-cover"
                            width={44}
                            height={44}
                        />
                    ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link
                        href={eventUrl}
                        className="text-main text-[13px] font-medium hover:underline"
                        onClick={handleEventClick}
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
                        <span className="text-second text-xs font-medium">
                            <Plural
                                value={removeTrailingZeros(toFixedTrimmed(+trade.size, 2))}
                                one="# share"
                                other="# shares"
                            />
                        </span>
                    </div>
                    <div className="mt-1.5 flex items-end justify-between md:hidden">
                        <div className="flex flex-col">
                            <span className="text-main text-sm font-medium">{`$${toFixedTrimmed(+trade.usdcSize, 2)}`}</span>
                            <span className="text-second text-xs font-medium">
                                <Trans>Value</Trans>
                            </span>
                        </div>
                        <span className="text-second text-xs font-medium">
                            <PredictionTime timestamp={trade.timestamp * 1000} />
                        </span>
                    </div>
                </div>
                <div className="hidden shrink-0 items-end gap-1 md:flex md:flex-col">
                    <div className="text-main w-16 text-right text-sm font-medium">
                        {`$${toFixedTrimmed(+trade.usdcSize, 2)}`}
                    </div>
                    <div className="text-second w-24 text-right text-xs font-medium">
                        <PredictionTime timestamp={trade.timestamp * 1000} />
                    </div>
                </div>
            </div>
        </div>
    );
}
