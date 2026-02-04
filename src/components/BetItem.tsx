'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { capitalize, first } from 'lodash-es';
import { memo, type ReactNode, useMemo } from 'react';
import { useAsyncFn } from 'react-use';

import TimeIcon from '@/assets/time.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { BUTTON_COLORS } from '@/components/Prediction/PredictionActivityRate.js';
import { PredictionEventImage } from '@/components/Prediction/PredictionEventImage.js';
import { Timer } from '@/components/RedPacket/Timer.js';
import { type PredictionPlatform } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { isZero } from '@/helpers/number.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import {
    type PolymarketEventListData,
    type PolymarketMarketData,
    PolymarketUmaResolutionStatus,
} from '@/providers/types/Firefly.js';

const MAX_DISPLAYED_MARKETS = 2;

const calculateRatio = (market: PolymarketMarketData): number => {
    const { prices } = parseMarketOutcomes(market);

    if (!prices || prices.length < 2) return 0;

    if (prices.every((price) => isZero(price))) {
        return 0;
    }

    const firstPrice = parseFloat(String(prices[0]));
    const secondPrice = parseFloat(String(prices[1]));

    if (Number.isNaN(firstPrice) || Number.isNaN(secondPrice)) return 0;

    const sum = firstPrice + secondPrice;

    if (isZero(sum)) return 0;

    const ratio = firstPrice / sum;
    return Math.max(0, Math.min(1, ratio));
};

const parseMarketOutcomes = (market?: PolymarketMarketData) => {
    if (!market) return { outcomes: [], prices: [] };

    try {
        const outcomes = market.outcomes ? JSON.parse(market.outcomes) : [];
        const prices: string[] = market.outcomePrices ? JSON.parse(market.outcomePrices) : [];
        return { outcomes, prices };
    } catch {
        return { outcomes: [], prices: [] };
    }
};

const formatPriceCents = (price: string | null): string => {
    if (!price) return '50¢';

    const numPrice = parseFloat(price);

    if (Number.isNaN(numPrice) || numPrice < 0 || numPrice > 1) {
        return '50¢';
    }

    const cents = (Math.floor(numPrice * 1000) / 10).toFixed(1);
    return `${cents}¢`;
};

const formatWinRate = (percentage: number): string => {
    if (percentage < 1) return '<1%';
    return `${Math.ceil(percentage)}%`;
};

const tryParseIntOrMax = (value: string | null | undefined): number => {
    const parsed = value ? parseInt(value, 10) : NaN;
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
};

const sortMarkets = (markets: PolymarketMarketData[], sortBy?: string): PolymarketMarketData[] => {
    const unresolved = markets.filter(
        (market) => market.umaResolutionStatus !== PolymarketUmaResolutionStatus.Resolved,
    );
    const resolved = markets.filter((market) => market.umaResolutionStatus === PolymarketUmaResolutionStatus.Resolved);

    const sortInternal = (marketsToSort: PolymarketMarketData[]): PolymarketMarketData[] => {
        if (sortBy === 'price') {
            return [...marketsToSort].sort((a, b) => {
                const aRatio = calculateRatio(a);
                const bRatio = calculateRatio(b);
                return bRatio - aRatio;
            });
        } else {
            const sortedWithThreshold = marketsToSort
                .filter((market) => !!market.groupItemThreshold)
                .sort((a, b) => {
                    const aThreshold = tryParseIntOrMax(a.groupItemThreshold);
                    const bThreshold = tryParseIntOrMax(b.groupItemThreshold);
                    return aThreshold - bThreshold;
                });

            const sortedWithoutThreshold = marketsToSort
                .filter((market) => !market.groupItemThreshold)
                .sort((a, b) => {
                    const aId = tryParseIntOrMax(a.id);
                    const bId = tryParseIntOrMax(b.id);
                    return aId - bId;
                });

            return sortedWithThreshold.concat(sortedWithoutThreshold);
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
    platform: PredictionPlatform;
    className?: string;
    openLinkInNewTab?: boolean;
}

interface PredictionOutcomeButtonProps {
    className: string;
    slug?: string;
    outcome: number;
    children: ReactNode;
}

function PredictionOutcomeButton({ className, slug, outcome, children }: PredictionOutcomeButtonProps) {
    const [{ loading }, handleOpenPredictionPage] = useAsyncFn(async () => {
        if (!slug) return;
        await openPredictionPage(slug, outcome);
    }, [slug, outcome]);

    return (
        <ClickableButton
            className={className}
            data-prevent-progress
            type="button"
            loading={loading}
            onClick={() => {
                if (!slug || loading) return;
                handleOpenPredictionPage();
            }}
        >
            {children}
        </ClickableButton>
    );
}

export const BetItem = memo(function BetItem({ event, className, platform, openLinkInNewTab = true }: BetItemProps) {
    const endTime = new Date(event.endDate).getTime();

    const sortedMarkets = useMemo(() => {
        if (!event.markets || event.markets.length === 0) return EMPTY_LIST;
        return sortMarkets(event.markets, event.sortBy);
    }, [event.markets, event.sortBy]);

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
                event.markets?.some(
                    (market) => market.umaResolutionStatus === PolymarketUmaResolutionStatus.Resolved,
                ) ?? false
            );
        }
        return primaryMarket?.umaResolutionStatus === PolymarketUmaResolutionStatus.Resolved;
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
                    <Timer
                        icon={<TimeIcon className="shrink-0 text-second" width={12} height={12} />}
                        endTime={endTime}
                        className="!bg-inherit !p-0 text-xs leading-[14px] text-second"
                    />
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
    const activeMarkets = sortedMarkets.filter((market) => market.active);
    const remainingCount = Math.max(0, activeMarkets.length - MAX_DISPLAYED_MARKETS);
    const series = event.series ? first(event.series) : undefined;

    const isNew = useMemo(() => {
        if (!event.startDate) return false;
        const startTime = new Date(event.startDate).getTime();
        const now = Date.now();
        const hoursSinceStart = dayjs(now).diff(dayjs(startTime), 'hour', true);
        return hoursSinceStart >= 0 && hoursSinceStart < 24;
    }, [event.startDate]);

    return (
        <Link
            className={classNames(
                'mb-4 flex flex-col gap-3 rounded-2xl border border-line bg-primaryBottom p-4 hover:bg-bg',
                className,
            )}
            href={RouteResolver.betsEventDetail(platform, event.slug)}
            target={openLinkInNewTab ? '_blank' : '_self'}
        >
            <div className="flex items-center gap-2">
                <PredictionEventImage
                    platform={platform}
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
                                <div key={market.id} className="flex items-center gap-3 sm:gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm leading-5 text-lightMain">
                                            {market.groupItemTitle || market.question}
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
                                        <div className="flex min-w-0 shrink-0 gap-2">
                                            <PredictionOutcomeButton
                                                className={classNames(
                                                    'min-w-0 flex-1 overflow-hidden rounded-lg px-3 py-1.5 text-sm font-bold leading-6 sm:w-[100px] md:w-[120px]',
                                                    BUTTON_COLORS.success.bg,
                                                    BUTTON_COLORS.success.text,
                                                )}
                                                slug={market.slug}
                                                outcome={0}
                                            >
                                                <span className="block truncate">{firstOutcome}</span>
                                            </PredictionOutcomeButton>
                                            {secondOutcome ? (
                                                <PredictionOutcomeButton
                                                    className={classNames(
                                                        'min-w-0 flex-1 overflow-hidden rounded-lg px-3 py-1.5 text-sm font-bold leading-6 sm:w-[100px] md:w-[120px]',
                                                        BUTTON_COLORS.danger.bg,
                                                        BUTTON_COLORS.danger.text,
                                                    )}
                                                    slug={market.slug}
                                                    outcome={1}
                                                >
                                                    <span className="block truncate">{secondOutcome}</span>
                                                </PredictionOutcomeButton>
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
                            <div className="flex min-w-0 gap-2">
                                {firstOutcome ? (
                                    <PredictionOutcomeButton
                                        className={classNames(
                                            'min-w-0 flex-1 overflow-hidden rounded-lg px-4 py-2 text-sm font-bold leading-6',
                                            BUTTON_COLORS.success.bg,
                                            BUTTON_COLORS.success.text,
                                        )}
                                        slug={primaryMarket?.slug}
                                        outcome={0}
                                    >
                                        <span className="block truncate">
                                            <Trans>Buy {firstOutcome}</Trans>
                                        </span>
                                    </PredictionOutcomeButton>
                                ) : null}
                                {secondOutcome ? (
                                    <PredictionOutcomeButton
                                        className={classNames(
                                            'min-w-0 flex-1 overflow-hidden rounded-lg px-4 py-2 text-sm font-bold leading-6',
                                            BUTTON_COLORS.danger.bg,
                                            BUTTON_COLORS.danger.text,
                                        )}
                                        slug={primaryMarket?.slug}
                                        outcome={1}
                                    >
                                        <span className="block truncate">
                                            <Trans>Buy {secondOutcome}</Trans>
                                        </span>
                                    </PredictionOutcomeButton>
                                ) : null}
                            </div>
                        ) : null}
                    </>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm leading-[17px] text-second">
                        <span>${nFormatter(event.volume, 2, true)} Vol.</span>
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
