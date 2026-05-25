'use client';

import TimeIcon from '@dimensiondev/assets/time.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { isZero } from '@dimensiondev/web3/numbers';
import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { capitalize, first } from 'lodash-es';
import { memo, type ReactNode, useMemo } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { BUTTON_COLORS } from '@/components/Prediction/PredictionActivityRate.js';
import { PredictionEventImage } from '@/components/Prediction/PredictionEventImage.js';
import { SportBetItem } from '@/components/Prediction/Sport/SportBetItem.js';
import { Timer } from '@/components/RedPacket/Timer.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { BetsEventDataForUI, BetsMarketDataForUI } from '@/types/prediction.js';

const MAX_DISPLAYED_MARKETS = 2;

const calculateRatio = (market: BetsMarketDataForUI): number => {
    const prices = market.outcomes.map((outcome) => outcome.price ?? '0');

    if (!prices || prices.length < 2) return 0;

    if (prices.every((price) => isZero(price))) {
        return 0;
    }

    const firstPrice = Number.parseFloat(String(prices[0]));
    const secondPrice = Number.parseFloat(String(prices[1]));

    if (Number.isNaN(firstPrice) || Number.isNaN(secondPrice)) return 0;

    const sum = firstPrice + secondPrice;

    if (isZero(sum)) return 0;

    const ratio = firstPrice / sum;
    return Math.max(0, Math.min(1, ratio));
};

const formatPriceCents = (price: string | null): string => {
    if (!price) return '50¢';

    const numPrice = Number.parseFloat(price);

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
    const parsed = value ? Number.parseInt(value, 10) : NaN;
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
};

const sortMarkets = (markets: BetsMarketDataForUI[], sortBy?: string): BetsMarketDataForUI[] => {
    const unresolved = markets.filter((market) => !market.isResolved && !market.isClosed);
    const resolved = markets.filter((market) => market.isResolved || market.isClosed);

    const sortInternal = (marketsToSort: BetsMarketDataForUI[]): BetsMarketDataForUI[] => {
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

const getMarketData = (market: BetsMarketDataForUI) => {
    const outcomes = market.outcomes.map((outcome) => outcome.label);
    const prices = market.outcomes.map((outcome) => outcome.price ?? '0');
    const firstPrice = prices[0];
    const secondPrice = prices[1];
    const firstPercentage = firstPrice ? Number.parseFloat(firstPrice) * 100 : 0;
    const secondPercentage = secondPrice ? Number.parseFloat(secondPrice) * 100 : 0;

    const isMarketResolved = market.isResolved;

    let winningOutcome: string | null = null;
    let winningPercentage = 0;
    let isFirstOutcomeWinner = false;

    if (isMarketResolved) {
        const firstPriceNum = firstPrice ? Number.parseFloat(firstPrice) : 0;
        const secondPriceNum = secondPrice ? Number.parseFloat(secondPrice) : 0;

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
    event: BetsEventDataForUI;
    platform: PredictionPlatform;
    className?: string;
    openLinkInNewTab?: boolean;
    onLinkClick?: () => void;
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
        await openPredictionPage(slug, { outcome });
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

const MIN_RATIO_FOR_BACKGROUND = 5; // 5%

export const BetItem = memo(function BetItem({
    event,
    className,
    platform,
    openLinkInNewTab = true,
    onLinkClick,
}: BetItemProps) {
    const endTime = event.endTime;
    const eventSlug = event.slug || event.id;
    const eventClosed = !!event.closed || event.status === 'ended';
    const eventArchived = !!event.archived;
    const eventVolume = typeof event.volume === 'string' ? Number(event.volume) : event.volume;

    const sortedMarkets = useMemo(() => {
        if (!event.markets || event.markets.length === 0) return EMPTY_LIST;
        return sortMarkets(event.markets, event.sortBy);
    }, [event.markets, event.sortBy]);

    const primaryMarket = first(sortedMarkets);

    const primaryOutcomes = useMemo(
        () => primaryMarket?.outcomes.map((outcome) => outcome.label) || [],
        [primaryMarket],
    );
    const primaryPrices = useMemo(
        () => primaryMarket?.outcomes.map((outcome) => outcome.price || '0') || [],
        [primaryMarket],
    );

    const [firstOutcome, secondOutcome] = primaryOutcomes;
    const [firstPrice, secondPrice] = primaryPrices;

    const firstPercentage = firstPrice ? Number.parseFloat(firstPrice) * 100 : 0;
    const secondPercentage = secondPrice ? Number.parseFloat(secondPrice) * 100 : 0;

    const isMultiMarket = event.markets.length > 1;

    const isResolved = useMemo(() => {
        if (isMultiMarket) {
            return event.markets?.some((market) => market.isResolved) ?? false;
        }
        return primaryMarket?.isResolved ?? false;
    }, [isMultiMarket, event.markets, primaryMarket]);

    const resolvedOutcome = useMemo(() => {
        if (!isResolved || isMultiMarket || !primaryMarket) return null;
        const firstPriceNum = primaryPrices[0] ? Number.parseFloat(primaryPrices[0]) : 0;
        const secondPriceNum = primaryPrices[1] ? Number.parseFloat(primaryPrices[1]) : 0;
        if (firstPriceNum >= secondPriceNum) return { outcome: primaryOutcomes[0], isFirst: true };
        return { outcome: primaryOutcomes[1], isFirst: false };
    }, [isResolved, isMultiMarket, primaryMarket, primaryPrices, primaryOutcomes]);

    const formattedTime = useMemo(() => {
        if (isResolved) return null;

        const now = Date.now();
        const isExpired = dayjs(now).isAfter(endTime);

        if (isMultiMarket || eventClosed || eventArchived || isExpired) {
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
    }, [isResolved, isMultiMarket, eventClosed, eventArchived, endTime]);

    const displayedMarkets = sortedMarkets.slice(0, MAX_DISPLAYED_MARKETS);
    const activeMarkets = sortedMarkets.filter((market) => market.active ?? (!market.isClosed && !market.isResolved));
    const remainingCount = Math.max(0, activeMarkets.length - MAX_DISPLAYED_MARKETS);
    const series = event.series ? first(event.series) : undefined;

    const isNew = useMemo(() => {
        if (!event.startDate) return false;
        const startTime = new Date(event.startDate).getTime();
        const now = Date.now();
        const hoursSinceStart = dayjs(now).diff(dayjs(startTime), 'hour', true);
        return hoursSinceStart >= 0 && hoursSinceStart < 24;
    }, [event.startDate]);

    if (event.sportData) {
        return (
            <SportBetItem
                event={event}
                platform={platform}
                className={className}
                openLinkInNewTab={openLinkInNewTab}
                onLinkClick={onLinkClick}
            />
        );
    }

    return (
        <Link
            className={classNames(
                'flex flex-col gap-3 rounded-2xl border border-line bg-primaryBottom p-4 hover:bg-bg',
                className,
            )}
            href={RouteResolver.betsEventDetail(platform, eventSlug, { multiple: isMultiMarket })}
            target={openLinkInNewTab ? '_blank' : '_self'}
            onClick={onLinkClick}
        >
            <div className="flex items-center gap-2">
                <PredictionEventImage
                    platform={platform}
                    src={event.image || event.icon || ''}
                    alt={event.title}
                    className="shrink-0"
                    width={40}
                    height={40}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="line-clamp-1 text-left text-base font-semibold leading-5 text-lightMain">
                        {event.title}
                    </h3>

                    {formattedTime}
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
                            const ratio = isMarketResolved ? winningPercentage : firstPercentage;
                            const ratioForBg = Math.ceil(ratio);

                            return (
                                <div key={market.id} className="flex flex-col items-center gap-3 sm:gap-4 md:flex-row">
                                    <div
                                        className="flex h-5 w-full min-w-0 flex-1 items-center gap-3 rounded-full px-2 md:w-auto"
                                        style={{
                                            background:
                                                ratioForBg >= MIN_RATIO_FOR_BACKGROUND
                                                    ? `linear-gradient(90deg, var(--Polymarket-yes-background, #DCF1D9) 0%, rgba(220, 241, 217, 0.00) ${ratioForBg}%)`
                                                    : undefined,
                                        }}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-left text-sm leading-5 text-lightMain">
                                                {market.groupItemTitle || market.question || market.title}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col text-right">
                                            <p className="text-sm font-semibold leading-5 text-lightMain">
                                                {formatWinRate(ratio)}
                                            </p>
                                        </div>
                                    </div>
                                    {isMarketResolved && winningOutcome ? (
                                        <div className="flex w-full shrink-0 md:w-auto">
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
                                    ) : platform !== PredictionPlatform.Opinion ? (
                                        <div className="flex w-full min-w-0 shrink-0 gap-2 md:w-auto">
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
                                    ) : null}
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
                                    className={classNames('size-full', {
                                        'bg-success': resolvedOutcome.isFirst,
                                        'bg-danger': !resolvedOutcome.isFirst,
                                    })}
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
                            platform !== PredictionPlatform.Opinion ? (
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
                            ) : null
                        ) : null}
                    </>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm leading-[17px] text-second">
                        <span>${nFormatter(eventVolume, 2, true)} Vol.</span>
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
