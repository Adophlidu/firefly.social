'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { capitalize, first } from 'lodash-es';
import { memo, useMemo } from 'react';

import TimeIcon from '@/assets/time.svg';
import { BUTTON_COLORS } from '@/components/Bets/BetsActivityRate.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { Timer } from '@/components/RedPacket/Timer.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import { resolvePolymarketEventUrl } from '@/helpers/resolvePolymarketEventUrl.js';
import {
    type PolymarketEventListData,
    type PolymarketMarketData,
    PolymarketUmaResolutionStatus,
} from '@/providers/types/Firefly.js';

const MAX_DISPLAYED_MARKETS = 2;

const parseMarketOutcomes = (market?: PolymarketMarketData) => {
    if (!market) return { outcomes: [], prices: [] };

    try {
        const outcomes = market.outcomes ? JSON.parse(market.outcomes) : [];
        const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : [];
        return { outcomes, prices };
    } catch {
        return { outcomes: [], prices: [] };
    }
};

const formatPriceCents = (price: string | null) => {
    if (!price) return '0¢';
    const cents = (parseFloat(price) * 100).toFixed(1);
    return `${cents}¢`;
};

const formatWinRate = (percentage: number): string => {
    if (percentage < 1) return '<1%';
    return `${Math.round(percentage)}%`;
};

const parseSafeInt = (value: string | null | undefined, fallback: number): number => {
    if (!value) return fallback;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * Sort markets according to Kotlin logic:
 * 1. Unresolved markets first, then resolved markets
 * 2. Within each group:
 *    - If sortBy === "price": sort by ratio (first price) descending
 *    - Otherwise: sort by groupItemThreshold (if exists) or id, ascending
 */
const sortMarkets = (markets: PolymarketMarketData[], sortBy?: string): PolymarketMarketData[] => {
    const unresolved = markets.filter(
        (market) => market.umaResolutionStatus !== PolymarketUmaResolutionStatus.Resolved,
    );
    const resolved = markets.filter((market) => market.umaResolutionStatus === PolymarketUmaResolutionStatus.Resolved);

    const sortInternal = (marketsToSort: PolymarketMarketData[]): PolymarketMarketData[] => {
        if (sortBy === 'price') {
            return [...marketsToSort].sort((a, b) => {
                const aData = parseMarketOutcomes(a);
                const bData = parseMarketOutcomes(b);
                const aPrice = aData.prices[0] ? parseFloat(aData.prices[0]) : 0;
                const bPrice = bData.prices[0] ? parseFloat(bData.prices[0]) : 0;
                return bPrice - aPrice; // Descending
            });
        } else {
            const withThreshold = marketsToSort.filter((m) => m.groupItemThreshold != null);
            const withoutThreshold = marketsToSort.filter((m) => m.groupItemThreshold == null);

            const sortByThreshold = (a: PolymarketMarketData, b: PolymarketMarketData) => {
                const aNum = parseSafeInt(a.groupItemThreshold, Number.MAX_SAFE_INTEGER);
                const bNum = parseSafeInt(b.groupItemThreshold, Number.MAX_SAFE_INTEGER);
                return aNum - bNum;
            };

            const sortById = (a: PolymarketMarketData, b: PolymarketMarketData) => {
                const aNum = parseSafeInt(a.id, Number.MAX_SAFE_INTEGER);
                const bNum = parseSafeInt(b.id, Number.MAX_SAFE_INTEGER);
                return aNum - bNum;
            };

            return [...withThreshold].sort(sortByThreshold).concat([...withoutThreshold].sort(sortById));
        }
    };

    return sortInternal(unresolved).concat(sortInternal(resolved));
};

const getMarketData = (market: PolymarketMarketData) => {
    const { outcomes, prices } = parseMarketOutcomes(market);
    const firstPrice = prices[0];
    const secondPrice = prices[1];
    const firstPercentage = firstPrice ? parseFloat(firstPrice) * 100 : 0;
    const secondPercentage = secondPrice ? parseFloat(secondPrice) * 100 : 0;

    const isMarketResolved = market.umaResolutionStatus === PolymarketUmaResolutionStatus.Resolved;

    let winningOutcome: string | null = null;
    let winningPercentage = 0;
    let isFirstOutcomeWinner = false;

    if (isMarketResolved) {
        const firstPriceNum = firstPrice ? parseFloat(firstPrice) : 0;
        const secondPriceNum = secondPrice ? parseFloat(secondPrice) : 0;

        if (firstPriceNum >= secondPriceNum) {
            winningOutcome = outcomes[0];
            winningPercentage = firstPercentage;
            isFirstOutcomeWinner = true;
        } else {
            winningOutcome = outcomes[1];
            winningPercentage = secondPercentage;
            isFirstOutcomeWinner = false;
        }
    }

    return {
        outcomes,
        prices,
        firstPercentage,
        secondPercentage,
        winningOutcome,
        winningPercentage,
        isFirstOutcomeWinner,
        isMarketResolved,
    };
};

interface BetItemProps {
    event: PolymarketEventListData;
    className?: string;
}

export const BetItem = memo(function BetItem({ event, className }: BetItemProps) {
    const endTime = new Date(event.endDate).getTime();

    const sortedMarkets = useMemo(() => {
        if (!event.markets || event.markets.length === 0) return EMPTY_LIST;
        return sortMarkets(event.markets);
    }, [event.markets]);

    const primaryMarket = first(sortedMarkets);

    const { outcomes: primaryOutcomes, prices: primaryPrices } = parseMarketOutcomes(primaryMarket);

    const firstOutcome = primaryOutcomes[0];
    const secondOutcome = primaryOutcomes[1];
    const firstPrice = primaryPrices[0];
    const secondPrice = primaryPrices[1];

    const firstPercentage = firstPrice ? parseFloat(firstPrice) * 100 : 0;
    const secondPercentage = secondPrice ? parseFloat(secondPrice) * 100 : 0;

    const isMultiMarket = event.markets?.length > 1;

    const isResolved = useMemo(() => {
        if (isMultiMarket) {
            return (
                event.markets?.some((market) => market.resolvedBy || (market.closed && market.outcomePrices)) ?? false
            );
        }
        return !!(primaryMarket?.resolvedBy || (primaryMarket?.closed && primaryMarket?.outcomePrices));
    }, [isMultiMarket, event.markets, primaryMarket]);

    const resolvedOutcome = useMemo(() => {
        if (!isResolved || isMultiMarket || !primaryMarket) return null;
        const { prices } = parseMarketOutcomes(primaryMarket);
        const firstPriceNum = prices[0] ? parseFloat(prices[0]) : 0;
        const secondPriceNum = prices[1] ? parseFloat(prices[1]) : 0;
        if (firstPriceNum >= secondPriceNum) return { outcome: primaryOutcomes[0], isFirst: true };
        return { outcome: primaryOutcomes[1], isFirst: false };
    }, [isResolved, isMultiMarket, primaryMarket, primaryOutcomes]);

    const formatTime = useMemo(() => {
        if (isResolved) return null;

        const now = Date.now();
        const isExpired = dayjs(now).isAfter(endTime);

        if (isMultiMarket || event.closed || event.archived || isExpired) {
            return null;
        }

        const hoursUntilEnd = dayjs(endTime).diff(dayjs(now), 'hour', true);
        if (hoursUntilEnd > 0 && hoursUntilEnd <= 24) {
            return (
                <div className="flex items-center gap-1">
                    <TimeIcon className="shrink-0 text-second" width={12} height={12} />
                    <Timer endTime={endTime} className="!bg-inherit !p-0 text-xs leading-[14px] text-second" />
                </div>
            );
        }

        return (
            <div className="flex items-center gap-1">
                <TimeIcon className="shrink-0 text-second" width={12} height={12} />
                <span className="text-xs leading-[14px] text-second">{dayjs(endTime).format('MMM D, YYYY')}</span>
            </div>
        );
    }, [isResolved, isMultiMarket, event.closed, event.archived, endTime]);

    const displayedMarkets = sortedMarkets.slice(0, MAX_DISPLAYED_MARKETS);
    const remainingCount = Math.max(0, sortedMarkets.length - MAX_DISPLAYED_MARKETS);
    const series = event.series ? first(event.series) : undefined;

    const isNew = useMemo(() => {
        if (!event.startDate || isResolved) return false;
        const startTime = new Date(event.startDate).getTime();
        const now = Date.now();
        const hoursSinceStart = dayjs(now).diff(dayjs(startTime), 'hour', true);
        return hoursSinceStart >= 0 && hoursSinceStart < 24;
    }, [isResolved, event.startDate]);

    return (
        <Link
            className={classNames(
                'mb-4 flex flex-col gap-3 rounded-2xl border border-line bg-primaryBottom p-4 hover:bg-bg',
                className,
            )}
            href={resolvePolymarketEventUrl(event.slug)}
            target="_blank"
        >
            <div className="flex items-center gap-2">
                <Image
                    src={event.image || event.icon}
                    alt={event.title}
                    className="size-10 shrink-0 rounded-lg object-cover"
                    width={40}
                    height={40}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="line-clamp-1 text-base font-semibold leading-5 text-lightMain">{event.title}</h3>

                    {formatTime}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {isMultiMarket ? (
                    <div className="flex flex-col gap-2">
                        {displayedMarkets.map((market) => {
                            const {
                                outcomes,
                                firstPercentage,
                                winningOutcome,
                                winningPercentage,
                                isFirstOutcomeWinner,
                                isMarketResolved,
                            } = getMarketData(market);

                            const firstOutcome = outcomes[0] || 'Yes';
                            const secondOutcome = outcomes[1] || 'No';

                            return (
                                <div key={market.id} className="flex items-center gap-4">
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <p className="truncate text-sm leading-5 text-lightMain">
                                            {market.groupItemTitle}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-col text-right">
                                        <p className="text-sm font-semibold leading-5 text-lightMain">
                                            {formatWinRate(isMarketResolved ? winningPercentage : firstPercentage)}
                                        </p>
                                    </div>
                                    {isMarketResolved && winningOutcome ? (
                                        <div className="flex shrink-0">
                                            <span
                                                className={classNames(
                                                    bedStead.className,
                                                    'text-sm font-semibold leading-5',
                                                    {
                                                        'text-success': isFirstOutcomeWinner,
                                                        'text-danger': !isFirstOutcomeWinner,
                                                    },
                                                )}
                                            >
                                                {winningOutcome}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex shrink-0 gap-2">
                                            <ClickableButton
                                                className={classNames(
                                                    'flex-1 rounded-lg px-3 py-1.5 text-sm font-bold leading-6 md:min-w-[120px]',
                                                    BUTTON_COLORS.success.bg,
                                                    BUTTON_COLORS.success.hover,
                                                    BUTTON_COLORS.success.text,
                                                )}
                                                onClick={() => {
                                                    // TODO: Handle buy for first outcome
                                                }}
                                            >
                                                {firstOutcome}
                                            </ClickableButton>
                                            {secondOutcome ? (
                                                <ClickableButton
                                                    className={classNames(
                                                        'flex-1 rounded-lg px-3 py-1.5 text-sm font-bold leading-6 md:min-w-[120px]',
                                                        BUTTON_COLORS.danger.bg,
                                                        BUTTON_COLORS.danger.hover,
                                                        BUTTON_COLORS.danger.text,
                                                    )}
                                                    onClick={() => {
                                                        // TODO: Handle buy for second outcome
                                                    }}
                                                >
                                                    {secondOutcome}
                                                </ClickableButton>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {remainingCount > 0 && (
                            <div className="flex items-center">
                                <p className="text-sm leading-5 text-second">+{remainingCount} others</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {isResolved && resolvedOutcome ? (
                            <div
                                className={classNames('flex items-center rounded-lg text-sm font-bold leading-6', {
                                    'text-success': resolvedOutcome.isFirst,
                                    'text-danger': !resolvedOutcome.isFirst,
                                })}
                            >
                                <Trans>Settled as {resolvedOutcome.outcome}</Trans>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                {firstOutcome ? (
                                    <div className="flex flex-1 items-center gap-1">
                                        <span className="max-w-[64px] truncate text-sm font-bold leading-5 text-success">
                                            {firstOutcome}
                                        </span>
                                        <span className="text-sm font-semibold leading-5 text-success">
                                            {formatPriceCents(firstPrice)}
                                        </span>
                                    </div>
                                ) : null}
                                {secondOutcome ? (
                                    <div className="flex flex-1 items-center justify-end gap-1">
                                        <span className="max-w-[64px] truncate text-sm font-bold leading-5 text-danger">
                                            {secondOutcome}
                                        </span>
                                        <span className="text-sm font-semibold leading-5 text-danger">
                                            {formatPriceCents(secondPrice)}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {isResolved && resolvedOutcome ? (
                            <div className="flex h-1 overflow-hidden">
                                <div
                                    className={classNames('h-full', {
                                        'bg-success': resolvedOutcome.isFirst,
                                        'bg-danger': !resolvedOutcome.isFirst,
                                    })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        ) : (
                            primaryOutcomes.length === 2 && (
                                <div className="flex h-1 overflow-hidden">
                                    <div className="h-full bg-success" style={{ width: `${firstPercentage}%` }} />
                                    <div className="h-full bg-danger" style={{ width: `${secondPercentage}%` }} />
                                </div>
                            )
                        )}

                        {!isResolved || !resolvedOutcome ? (
                            <div className="flex gap-2">
                                {firstOutcome ? (
                                    <ClickableButton
                                        className={classNames(
                                            'flex-1 rounded-lg px-4 py-2 text-sm font-bold leading-6',
                                            BUTTON_COLORS.success.bg,
                                            BUTTON_COLORS.success.hover,
                                            BUTTON_COLORS.success.text,
                                        )}
                                        onClick={() => {
                                            openPredictionPage(event.slug, firstOutcome);
                                        }}
                                    >
                                        <Trans>Buy {firstOutcome}</Trans>
                                    </ClickableButton>
                                ) : null}
                                {secondOutcome ? (
                                    <ClickableButton
                                        className={classNames(
                                            'flex-1 rounded-lg px-4 py-2 text-sm font-bold leading-6',
                                            BUTTON_COLORS.danger.bg,
                                            BUTTON_COLORS.danger.hover,
                                            BUTTON_COLORS.danger.text,
                                        )}
                                        onClick={() => {
                                            openPredictionPage(event.slug, secondOutcome);
                                        }}
                                    >
                                        <Trans>Buy {secondOutcome}</Trans>
                                    </ClickableButton>
                                ) : null}
                            </div>
                        ) : null}
                    </>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm leading-[17px] text-second">
                        <span>${nFormatter(event.volume, 2)} Vol.</span>
                        {series?.recurrence ? <span>{capitalize(series.recurrence)}</span> : null}
                    </div>
                    {isNew ? (
                        <div className="flex justify-center rounded bg-[#ffedce] px-1.5 py-[2px]">
                            <span
                                className={classNames(
                                    bedStead.className,
                                    'text-xs font-bold leading-[14px] text-[#d98c09]',
                                )}
                            >
                                <Trans>NEW</Trans>
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>
        </Link>
    );
});
