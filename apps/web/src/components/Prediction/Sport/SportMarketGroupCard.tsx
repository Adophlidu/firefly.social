'use client';

import { BetsPriceTimeRange, type PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Trans } from '@lingui/react/macro';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { memo, useLayoutEffect, useMemo, useRef } from 'react';

import { TimeRangeSettings } from '@/components/Prediction/PredictionMarketsPriceLineChart/TimeRangeSettings.js';
import { SportBuyButtons } from '@/components/Prediction/Sport/SportBuyButtons.js';
import type { SportChartConfig } from '@/components/Prediction/Sport/SportPriceLineChart.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { dynamic } from '@/esm/dynamic.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatLine, matchesTeamLabel } from '@/helpers/prediction/sportScoreUtils.js';
import { parseAsBetsPriceTimeRange } from '@/hooks/prediction/parsers.js';
import type { BetsMarketDataForUI, SportEventData } from '@/types/prediction.js';
import { SportMarketGroupType } from '@/types/prediction.js';

const PredictionMarketOrderBook = dynamic(
    () => import('@/components/Prediction/PredictionMarketOrderBook/index.js').then((m) => m.PredictionMarketOrderBook),
    { ssr: false },
);
const PredictionMarketResolution = dynamic(
    () => import('@/components/Prediction/PredictionMarketResolution.js').then((m) => m.PredictionMarketResolution),
    { ssr: false },
);
const SportPriceLineChart = dynamic(
    () => import('@/components/Prediction/Sport/SportPriceLineChart.js').then((m) => m.SportPriceLineChart),
    { ssr: false },
);

function formatSectionVolume(markets: BetsMarketDataForUI[]): string {
    const vol = markets.reduce((total, m) => {
        const v = typeof m.volume === 'string' ? Number(m.volume) : (m.volume ?? 0);
        return total + (Number.isNaN(v) ? 0 : v);
    }, 0);
    return vol > 0 ? `$${nFormatter(vol, 1)} Vol.` : '$0 Vol.';
}

function MarketTitle({ title, markets }: { title: React.ReactNode; markets: BetsMarketDataForUI[] }) {
    const vol = formatSectionVolume(markets);
    return (
        <div className="min-w-0 max-md:flex max-md:w-full max-md:items-start max-md:justify-between max-md:gap-3">
            <TextOverflowTooltip content={title}>
                <h3 className="min-w-0 truncate text-[13px] font-semibold leading-[17px] text-lightMain">{title}</h3>
            </TextOverflowTooltip>
            <p className="shrink-0 text-xs leading-4 text-second max-md:text-right">{vol}</p>
        </div>
    );
}

type MarketContentTab = 'order-book' | 'graph' | 'resolution';
const sportMarketSectionClassName = 'border-line rounded-xl border p-4';

function getMarketLine(market: BetsMarketDataForUI): number {
    return typeof market.line === 'number' && Number.isFinite(market.line) ? market.line : 0;
}

function getMarketBalancedDistance(market: BetsMarketDataForUI): number {
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const outcome of market.outcomes) {
        const price = Number.parseFloat(outcome.price);
        if (!Number.isFinite(price)) continue;

        closestDistance = Math.min(closestDistance, Math.abs(price - 0.5));
    }

    return closestDistance;
}

function findDefaultMarket(
    markets: BetsMarketDataForUI[],
    mainLine: number | undefined,
): BetsMarketDataForUI | undefined {
    if (!markets.length) return undefined;

    return markets.reduce((current, market) => {
        const currentLineDistance =
            mainLine === undefined ? Number.POSITIVE_INFINITY : Math.abs(getMarketLine(current) - mainLine);
        const nextLineDistance =
            mainLine === undefined ? Number.POSITIVE_INFINITY : Math.abs(getMarketLine(market) - mainLine);

        if (nextLineDistance !== currentLineDistance) return nextLineDistance < currentLineDistance ? market : current;

        const currentBalance = getMarketBalancedDistance(current);
        const nextBalance = getMarketBalancedDistance(market);
        if (nextBalance !== currentBalance) return nextBalance < currentBalance ? market : current;

        const currentVolume = Number.parseFloat(current.volume || '0');
        const nextVolume = Number.parseFloat(market.volume || '0');
        return nextVolume > currentVolume ? market : current;
    }, markets[0]);
}

function resolveOutcomeTeam(
    label: string | undefined,
    homeTeam: SportEventData['homeTeam'],
    awayTeam: SportEventData['awayTeam'],
) {
    if (matchesTeamLabel(homeTeam, label)) return homeTeam;
    if (matchesTeamLabel(awayTeam, label)) return awayTeam;
    return undefined;
}

function resolveOutcomeTeams(
    market: BetsMarketDataForUI,
    homeTeam: SportEventData['homeTeam'],
    awayTeam: SportEventData['awayTeam'],
) {
    return market.outcomes.map((outcome) => resolveOutcomeTeam(outcome.label, homeTeam, awayTeam));
}

interface SportLineOption {
    key: string;
    label: string;
    market: BetsMarketDataForUI;
}

function createSportLineOptions(renderAs: SportMarketGroupType, markets: BetsMarketDataForUI[]): SportLineOption[] {
    // child_moneyline uses game numbers as line values — show plain "1", "2", "3" (no "+" prefix)
    const isGameWinner = markets.some((m) => m.sportsMarketType === 'child_moneyline');
    const options: SportLineOption[] = markets.map((market, index) => {
        const line = getMarketLine(market);
        const label =
            renderAs === SportMarketGroupType.Spread
                ? String(Math.abs(line))
                : renderAs === SportMarketGroupType.Total || isGameWinner
                  ? formatLine(line, false)
                  : formatLine(line);

        return {
            key: market.id || market.conditionId || `${line}:${index}`,
            label,
            market,
        };
    });

    return options.sort((a, b) => {
        const diff = parseFloat(a.label) - parseFloat(b.label);
        return diff === 0 ? a.label.localeCompare(b.label) : diff;
    });
}

function SportLineSwitcher({
    options,
    selectedKey,
    onSelect,
    flushBottom,
}: {
    options: SportLineOption[];
    selectedKey: string;
    onSelect: (key: string) => void;
    flushBottom?: boolean;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const activeButton = container.querySelector<HTMLButtonElement>(`[data-line-key="${CSS.escape(selectedKey)}"]`);
        if (!activeButton) return;

        const targetLeft = activeButton.offsetLeft - (container.clientWidth - activeButton.clientWidth) / 2;
        const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
        const clampedLeft = Math.max(0, Math.min(targetLeft, maxScroll));

        if (Math.abs(container.scrollLeft - clampedLeft) > 1) {
            container.scrollTo({ left: clampedLeft, behavior: 'smooth' });
        }
    }, [selectedKey]);

    if (options.length <= 1) return null;

    const currentIndex = Math.max(
        0,
        options.findIndex((option) => option.key === selectedKey),
    );
    const setLineByOffset = (offset: number) => {
        const nextIndex = Math.max(0, Math.min(options.length - 1, currentIndex + offset));
        onSelect(options[nextIndex].key);
    };

    return (
        <div
            className={classNames(
                '-mx-4 mt-4 flex h-12 items-center justify-between border-t border-line px-3',
                flushBottom ? '-mb-4' : '',
            )}
        >
            <button
                type="button"
                className="flex size-8 items-center justify-center text-third hover:text-main disabled:opacity-40"
                disabled={currentIndex <= 0}
                onClick={() => setLineByOffset(-1)}
            >
                <ChevronLeftIcon className="size-4" />
            </button>
            <div ref={scrollRef} className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1">
                <div className="mx-auto flex items-center gap-2">
                    {options.map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            data-line-key={option.key}
                            className={classNames(
                                'shrink-0 rounded-full px-2 py-1 text-sm leading-[18px]',
                                option.key === selectedKey
                                    ? 'font-semibold text-main'
                                    : 'font-medium text-second opacity-80 hover:bg-lightBg hover:text-main',
                            )}
                            onClick={() => onSelect(option.key)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            <button
                type="button"
                className="flex size-8 items-center justify-center text-main hover:text-highlight disabled:text-third disabled:opacity-40"
                disabled={currentIndex >= options.length - 1}
                onClick={() => setLineByOffset(1)}
            >
                <ChevronRightIcon className="size-4" />
            </button>
        </div>
    );
}

function SportMarketGraph({
    market,
    platform,
    homeTeam,
    awayTeam,
    config,
}: {
    market: BetsMarketDataForUI;
    platform: PredictionPlatform;
    homeTeam?: SportEventData['homeTeam'];
    awayTeam?: SportEventData['awayTeam'];
    config?: SportChartConfig;
}) {
    const defaultRange = config?.isEventEnded ? BetsPriceTimeRange.All : BetsPriceTimeRange.OneWeek;
    const [timeRange, setTimeRange] = useQueryState(
        'detail-range',
        parseAsBetsPriceTimeRange.withDefault(defaultRange).withOptions({ clearOnDefault: true }),
    );
    const isMoneyline = market.sportsMarketType?.toLowerCase() === SportMarketGroupType.Moneyline;
    // Only moneyline markets support draw; spread/total/other are always two-way
    const chartConfig = isMoneyline ? config : { ...config, isDraw: false };
    // Spread/total markets from formatSportGroupedMarketItem have createTime=0 and
    // no closedTime.  Borrow the moneyline market's timestamps for correct API params.
    const moneylineRef = config?.moneylineMarkets?.[0];
    const chartMarket =
        !isMoneyline && moneylineRef
            ? {
                  ...market,
                  createTime: moneylineRef.createTime ?? market.createTime,
                  closedTime: moneylineRef.closedTime ?? market.closedTime,
              }
            : market;

    return (
        <div className="pt-3">
            {homeTeam && awayTeam ? (
                <SportPriceLineChart
                    market={chartMarket}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    timeRange={timeRange}
                    config={chartConfig}
                />
            ) : null}
            {homeTeam && awayTeam ? (
                <div className="mt-2">
                    <TimeRangeSettings
                        platform={platform}
                        timeRange={timeRange}
                        onTimeRangeChange={(r) => void setTimeRange(r)}
                    />
                </div>
            ) : null}
        </div>
    );
}

function SportMarketDetailsTabs({
    market,
    platform,
    homeTeam,
    awayTeam,
    config,
}: {
    market?: BetsMarketDataForUI;
    platform: PredictionPlatform;
    homeTeam?: SportEventData['homeTeam'];
    awayTeam?: SportEventData['awayTeam'];
    config?: SportChartConfig;
}) {
    if (!market) return null;

    return (
        <SportMarketDetailsTabsContent
            key={`${market.id}-${market.isResolved || market.isClosed ? 'closed' : 'open'}`}
            market={market}
            platform={platform}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            config={config}
        />
    );
}

function SportMarketDetailsTabsContent({
    market,
    platform,
    homeTeam,
    awayTeam,
    config,
}: {
    market: BetsMarketDataForUI;
    platform: PredictionPlatform;
    homeTeam?: SportEventData['homeTeam'];
    awayTeam?: SportEventData['awayTeam'];
    config?: SportChartConfig;
}) {
    const defaultTab: MarketContentTab = market.isResolved || market.isClosed ? 'graph' : 'order-book';
    const [tab, setTab] = useQueryState(
        'market-tab',
        parseAsStringEnum(['order-book', 'graph', 'resolution']).withOptions({ clearOnDefault: true }),
    );
    const availableTabs: MarketContentTab[] =
        market.isResolved || market.isClosed
            ? market.statusList?.length
                ? ['graph', 'resolution']
                : ['graph']
            : ['order-book', 'graph'];
    const effectiveTab = (tab as MarketContentTab | null) ?? defaultTab;
    const activeTab = availableTabs.includes(effectiveTab) ? effectiveTab : availableTabs[0];

    return (
        <div>
            <div className="flex h-10 items-center gap-4 border-b border-[#f5f5f5]">
                {availableTabs.map((item) => (
                    <button
                        key={item}
                        type="button"
                        className={classNames(
                            'h-10 border-b-4 text-sm font-bold leading-6 transition-colors',
                            activeTab === item
                                ? 'border-highlight text-highlight'
                                : 'border-transparent text-third hover:text-main',
                        )}
                        onClick={() => void setTab(item)}
                    >
                        {item === 'order-book' ? (
                            <Trans>Order Book</Trans>
                        ) : item === 'resolution' ? (
                            <Trans>Resolution</Trans>
                        ) : (
                            <Trans>Graph</Trans>
                        )}
                    </button>
                ))}
            </div>
            {activeTab === 'order-book' ? (
                <div className="pt-3">
                    <PredictionMarketOrderBook market={market} platform={platform} />
                </div>
            ) : activeTab === 'resolution' ? (
                <div className="pt-3">
                    <PredictionMarketResolution market={market} />
                </div>
            ) : (
                <SportMarketGraph
                    market={market}
                    platform={platform}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    config={config}
                />
            )}
        </div>
    );
}

export interface SportMarketSectionConfig {
    key: string;
    type: SportMarketGroupType;
    title: React.ReactNode;
    markets: BetsMarketDataForUI[];
    mainLine?: number;
    mergeByLine: boolean;
    renderAs: SportMarketGroupType;
}

interface SportMarketGroupCardProps {
    section: SportMarketSectionConfig;
    active: boolean;
    homeTeam: SportEventData['homeTeam'];
    awayTeam: SportEventData['awayTeam'];
    showDraw: boolean;
    platform: PredictionPlatform;
    disabled: boolean;
    onActivate: () => void;
    lineKey?: string | null;
    onLineChange: (value: string | null) => void;
    config?: SportChartConfig;
    eventSlug?: string;
}

export const SportMarketGroupCard = memo(function SportMarketGroupCard({
    section,
    active,
    homeTeam,
    awayTeam,
    showDraw,
    disabled,
    platform,
    onActivate,
    lineKey,
    onLineChange,
    config,
    eventSlug,
}: SportMarketGroupCardProps) {
    const usesLineOptions = section.mergeByLine;
    const effectiveRenderAs = section.renderAs ?? section.type;
    const lineOptions = useMemo(
        () => (usesLineOptions ? createSportLineOptions(effectiveRenderAs, section.markets) : []),
        [section.markets, effectiveRenderAs, usesLineOptions],
    );
    const defaultMarket = useMemo(
        () => (usesLineOptions ? findDefaultMarket(section.markets, section.mainLine) : section.markets[0]),
        [section.mainLine, section.markets, usesLineOptions],
    );
    const defaultOption = useMemo(
        () => lineOptions.find((option) => option.market === defaultMarket) || lineOptions[0],
        [defaultMarket, lineOptions],
    );
    const selectedOption = useMemo(
        () => (lineKey ? lineOptions.find((option) => option.key === lineKey) : undefined) || defaultOption,
        [defaultOption, lineOptions, lineKey],
    );
    const selectedMarket = usesLineOptions ? selectedOption?.market : section.markets[0];
    // For child_moneyline (Game N Winner), use the selected market's groupItemTitle as the title
    // so it changes from "Game 1 Winner" to "Game 2 Winner" when switching lines.
    const dynamicTitle = useMemo(() => {
        if (selectedMarket?.groupItemTitle && section.markets.some((m) => m.sportsMarketType === 'child_moneyline')) {
            return selectedMarket.groupItemTitle;
        }
        return section.title;
    }, [section.title, section.markets, selectedMarket]);
    const showButtons = !disabled && !!selectedMarket;
    const showTeamButtons =
        effectiveRenderAs === SportMarketGroupType.Moneyline || effectiveRenderAs === SportMarketGroupType.Spread;
    const outcomeTeams =
        selectedMarket && showTeamButtons ? resolveOutcomeTeams(selectedMarket, homeTeam, awayTeam) : undefined;
    return (
        <section className={sportMarketSectionClassName}>
            <div className="flex min-h-[34px] items-center justify-between gap-3 max-md:flex-col max-md:items-stretch">
                <button
                    type="button"
                    className="min-w-0 flex-1 text-left max-md:w-full max-md:flex-none"
                    onClick={onActivate}
                >
                    <MarketTitle title={dynamicTitle} markets={section.markets} />
                </button>
                {showButtons && selectedMarket ? (
                    <SportBuyButtons
                        market={selectedMarket}
                        homeTeam={effectiveRenderAs === SportMarketGroupType.Moneyline ? homeTeam : undefined}
                        awayTeam={effectiveRenderAs === SportMarketGroupType.Moneyline ? awayTeam : undefined}
                        outcomeTeams={outcomeTeams}
                        sectionType={effectiveRenderAs}
                        eventSlug={eventSlug}
                        showDraw={effectiveRenderAs === SportMarketGroupType.Moneyline ? showDraw : undefined}
                        disabled={disabled}
                        variant="solid"
                        softColor={effectiveRenderAs === SportMarketGroupType.Spread && !active}
                        responsiveFullWidth
                        line={selectedMarket.line}
                    />
                ) : null}
            </div>
            {usesLineOptions ? (
                <SportLineSwitcher
                    options={lineOptions}
                    selectedKey={selectedOption?.key || ''}
                    onSelect={(key) => {
                        if (!active) onActivate();
                        onLineChange(key);
                    }}
                    flushBottom={!active}
                />
            ) : null}
            {active ? (
                <SportMarketDetailsTabs
                    market={selectedMarket}
                    platform={platform}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    config={config}
                />
            ) : null}
        </section>
    );
});
