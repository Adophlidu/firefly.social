'use client';

import { BetsPriceTimeRange, type PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Trans } from '@lingui/react/macro';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { memo, useMemo } from 'react';

import { TimeRangeSettings } from '@/components/Prediction/PredictionMarketsPriceLineChart/TimeRangeSettings.js';
import { SportBuyButtons } from '@/components/Prediction/Sport/SportBuyButtons.js';
import { dynamic } from '@/esm/dynamic.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatLine, matchesTeamLabel } from '@/helpers/prediction/sportScoreUtils.js';
import { parseAsBetsPriceTimeRange } from '@/hooks/prediction/parsers.js';
import type {
    BetsEventDataForUI,
    BetsMarketDataForUI,
    SportEventData,
    SportGroupedMarkets,
} from '@/types/prediction.js';
import { SportMarketGroupType } from '@/types/prediction.js';

const PredictionMarketOrderBook = dynamic(
    () => import('@/components/Prediction/PredictionMarketOrderBook/index.js').then((m) => m.PredictionMarketOrderBook),
    { ssr: false },
);
const PredictionMarketsPriceLineChart = dynamic(
    () =>
        import('@/components/Prediction/PredictionMarketsPriceLineChart/index.js').then(
            (m) => m.PredictionMarketsPriceLineChart,
        ),
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

function formatSectionVolume(markets: BetsMarketDataForUI[]): string | null {
    const vol = markets.reduce((total, m) => {
        const v = typeof m.volume === 'string' ? Number(m.volume) : (m.volume ?? 0);
        return total + (Number.isNaN(v) ? 0 : v);
    }, 0);
    return vol > 0 ? `$${nFormatter(vol, 1)} Vol.` : null;
}

function MarketTitle({ title, markets }: { title: React.ReactNode; markets: BetsMarketDataForUI[] }) {
    const vol = formatSectionVolume(markets);
    return (
        <div className="min-w-0 max-md:flex max-md:w-full max-md:items-start max-md:justify-between max-md:gap-3">
            <h3 className="text-lightMain min-w-0 truncate text-[13px] font-semibold leading-[17px]">{title}</h3>
            {vol ? <p className="text-second shrink-0 text-xs leading-4 max-md:text-right">{vol}</p> : null}
        </div>
    );
}

type MarketContentTab = 'order-book' | 'graph' | 'resolution';
const sportMarketSectionClassName = 'border-line rounded-xl border p-4';

function normalizeSportMarketGroupType(type: string | undefined): SportMarketGroupType {
    switch (type?.toLowerCase()) {
        case SportMarketGroupType.Moneyline:
            return SportMarketGroupType.Moneyline;
        case SportMarketGroupType.Spread:
        case 'spreads':
            return SportMarketGroupType.Spread;
        case SportMarketGroupType.Total:
        case 'totals':
            return SportMarketGroupType.Total;
        default:
            return SportMarketGroupType.Other;
    }
}

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

function getTeamShortLabel(team: SportEventData['homeTeam'] | undefined): string | undefined {
    return team?.abbreviation?.toUpperCase() || team?.name;
}

interface SportLineOption {
    key: string;
    label: string;
    market: BetsMarketDataForUI;
}

function createSportLineOptions(
    sectionType: SportMarketGroupType,
    markets: BetsMarketDataForUI[],
    homeTeam: SportEventData['homeTeam'],
    awayTeam: SportEventData['awayTeam'],
): SportLineOption[] {
    return markets
        .map((market, index) => {
            const line = getMarketLine(market);
            const firstOutcomeTeam = resolveOutcomeTeam(market.outcomes[0]?.label, homeTeam, awayTeam);
            const firstOutcomeLabel = getTeamShortLabel(firstOutcomeTeam);
            const label =
                sectionType === SportMarketGroupType.Spread
                    ? firstOutcomeLabel
                        ? `${firstOutcomeLabel} ${formatLine(line)}`
                        : formatLine(line)
                    : sectionType === SportMarketGroupType.Total
                      ? formatLine(line, false)
                      : formatLine(line);

            return {
                key: market.id || market.conditionId || `${line}:${index}`,
                label,
                market,
            };
        })
        .toSorted((a, b) => {
            const lineDiff = getMarketLine(a.market) - getMarketLine(b.market);
            return lineDiff === 0 ? a.label.localeCompare(b.label) : lineDiff;
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
                'border-line -mx-4 mt-4 flex h-12 items-center justify-between border-t px-3',
                flushBottom ? '-mb-4' : '',
            )}
        >
            <button
                type="button"
                className="text-third hover:text-main flex size-8 items-center justify-center disabled:opacity-40"
                disabled={currentIndex <= 0}
                onClick={() => setLineByOffset(-1)}
            >
                <ChevronLeftIcon className="size-4" />
            </button>
            <div className="no-scrollbar flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto px-1">
                {options.map((option) => (
                    <button
                        key={option.key}
                        type="button"
                        className={classNames(
                            'shrink-0 rounded-full px-2 py-1 text-sm leading-[18px]',
                            option.key === selectedKey
                                ? 'text-main font-semibold'
                                : 'text-second hover:bg-lightBg hover:text-main font-medium opacity-80',
                        )}
                        onClick={() => onSelect(option.key)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            <button
                type="button"
                className="text-main hover:text-highlight disabled:text-third flex size-8 items-center justify-center disabled:opacity-40"
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
}: {
    market: BetsMarketDataForUI;
    platform: PredictionPlatform;
    homeTeam?: SportEventData['homeTeam'];
    awayTeam?: SportEventData['awayTeam'];
}) {
    const [timeRange, setTimeRange] = useQueryState(
        'detail-range',
        parseAsBetsPriceTimeRange.withDefault(BetsPriceTimeRange.OneWeek).withOptions({ clearOnDefault: true }),
    );
    const isMoneyline = market.sportsMarketType?.toLowerCase() === SportMarketGroupType.Moneyline;

    return (
        <div className="pt-3">
            {isMoneyline && homeTeam && awayTeam ? (
                <SportPriceLineChart market={market} homeTeam={homeTeam} awayTeam={awayTeam} timeRange={timeRange} />
            ) : (
                <PredictionMarketsPriceLineChart
                    markets={[market]}
                    platform={platform}
                    showBuyButtons={false}
                    isActive
                    filterResolvedMarkets={false}
                />
            )}
            {isMoneyline && homeTeam && awayTeam ? (
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
}: {
    market?: BetsMarketDataForUI;
    platform: PredictionPlatform;
    homeTeam?: SportEventData['homeTeam'];
    awayTeam?: SportEventData['awayTeam'];
}) {
    if (!market) return null;

    return (
        <SportMarketDetailsTabsContent
            key={`${market.id}-${market.isResolved || market.isClosed ? 'closed' : 'open'}`}
            market={market}
            platform={platform}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
        />
    );
}

function SportMarketDetailsTabsContent({
    market,
    platform,
    homeTeam,
    awayTeam,
}: {
    market: BetsMarketDataForUI;
    platform: PredictionPlatform;
    homeTeam?: SportEventData['homeTeam'];
    awayTeam?: SportEventData['awayTeam'];
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
                                : 'text-third hover:text-main border-transparent',
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
                <SportMarketGraph market={market} platform={platform} homeTeam={homeTeam} awayTeam={awayTeam} />
            )}
        </div>
    );
}

interface SportMarketsSectionProps {
    event: BetsEventDataForUI;
    sportData: SportEventData;
}

function groupMarketsByType(markets: BetsMarketDataForUI[]): SportGroupedMarkets {
    const grouped: SportGroupedMarkets = {
        moneyline: [],
        spread: [],
        total: [],
        other: [],
    };

    for (const market of markets) {
        const type = normalizeSportMarketGroupType(market.sportsMarketType);
        switch (type) {
            case SportMarketGroupType.Moneyline:
                grouped.moneyline.push(market);
                break;
            case SportMarketGroupType.Spread:
                grouped.spread.push(market);
                break;
            case SportMarketGroupType.Total:
                grouped.total.push(market);
                break;
            default:
                grouped.other.push(market);
                break;
        }
    }

    return grouped;
}

export const SportMarketsSection = memo(function SportMarketsSection({ event, sportData }: SportMarketsSectionProps) {
    const grouped = useMemo(() => groupMarketsByType(event.markets), [event.markets]);
    const { homeTeam, awayTeam, isDraw, ended, spreadsMainLine, totalsMainLine } = sportData;
    const disabled = ended;
    const sections = useMemo(
        () =>
            [
                {
                    key: SportMarketGroupType.Moneyline,
                    type: SportMarketGroupType.Moneyline,
                    title: <Trans>Moneyline</Trans>,
                    markets: grouped.moneyline,
                    mainLine: undefined,
                },
                {
                    key: SportMarketGroupType.Spread,
                    type: SportMarketGroupType.Spread,
                    title: <Trans>Spreads</Trans>,
                    markets: grouped.spread,
                    mainLine: spreadsMainLine,
                },
                {
                    key: SportMarketGroupType.Total,
                    type: SportMarketGroupType.Total,
                    title: <Trans>Totals</Trans>,
                    markets: grouped.total,
                    mainLine: totalsMainLine,
                },
                ...grouped.other.map((market) => ({
                    key: `${SportMarketGroupType.Other}:${market.id}`,
                    type: SportMarketGroupType.Other,
                    title: market.title,
                    markets: [market],
                    mainLine: undefined,
                })),
            ].filter((section) => section.markets.length > 0),
        [grouped.moneyline, grouped.other, grouped.spread, grouped.total, spreadsMainLine, totalsMainLine],
    );
    const [activeKey, setActiveKey] = useQueryState(
        'market',
        parseAsStringEnum(['moneyline', 'spread', 'total'])
            .withDefault('moneyline')
            .withOptions({ clearOnDefault: true }),
    );
    const [line, setLine] = useQueryState('line', parseAsString.withOptions({ clearOnDefault: true }));
    const activeSectionKey = sections.some((section) => section.key === activeKey) ? activeKey : sections[0]?.key;

    return (
        <div className="flex flex-col gap-3 p-4">
            {sections.map((section) => (
                <SportMarketGroupCard
                    key={section.key}
                    section={section}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    showDraw={isDraw}
                    platform={event.platform}
                    disabled={disabled}
                    active={section.key === activeSectionKey}
                    onActivate={() => {
                        const key = section.key;
                        void setActiveKey((old) =>
                            key === 'moneyline' || key === 'spread' || key === 'total' ? key : old,
                        );
                        void setLine(null);
                    }}
                    lineKey={section.key === activeSectionKey ? line : undefined}
                    onLineChange={setLine}
                />
            ))}
        </div>
    );
});

interface SportMarketSectionConfig {
    key: string;
    type: SportMarketGroupType;
    title: React.ReactNode;
    markets: BetsMarketDataForUI[];
    mainLine?: number;
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
}

const SportMarketGroupCard = memo(function SportMarketGroupCard({
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
}: SportMarketGroupCardProps) {
    const usesLineOptions = section.type === SportMarketGroupType.Spread || section.type === SportMarketGroupType.Total;
    const lineOptions = useMemo(
        () => (usesLineOptions ? createSportLineOptions(section.type, section.markets, homeTeam, awayTeam) : []),
        [awayTeam, homeTeam, section.markets, section.type, usesLineOptions],
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
    const showButtons = !disabled && !!selectedMarket;
    const showTeamButtons =
        section.type === SportMarketGroupType.Moneyline || section.type === SportMarketGroupType.Spread;
    const outcomeTeams =
        selectedMarket && showTeamButtons ? resolveOutcomeTeams(selectedMarket, homeTeam, awayTeam) : undefined;
    const titleMarkets =
        selectedMarket && (section.type === SportMarketGroupType.Spread || section.type === SportMarketGroupType.Total)
            ? [selectedMarket]
            : section.markets;

    return (
        <section className={sportMarketSectionClassName}>
            <div className="flex min-h-[34px] items-center justify-between gap-3 max-md:flex-col max-md:items-stretch">
                <button
                    type="button"
                    className="min-w-0 flex-1 text-left max-md:w-full max-md:flex-none"
                    onClick={onActivate}
                >
                    <MarketTitle title={section.title} markets={titleMarkets} />
                </button>
                {showButtons && selectedMarket ? (
                    <SportBuyButtons
                        market={selectedMarket}
                        homeTeam={section.type === SportMarketGroupType.Moneyline ? homeTeam : undefined}
                        awayTeam={section.type === SportMarketGroupType.Moneyline ? awayTeam : undefined}
                        outcomeTeams={outcomeTeams}
                        showDraw={section.type === SportMarketGroupType.Moneyline ? showDraw : undefined}
                        disabled={disabled}
                        variant="solid"
                        responsiveFullWidth
                    />
                ) : null}
            </div>
            {usesLineOptions ? (
                <SportLineSwitcher
                    options={lineOptions}
                    selectedKey={selectedOption?.key || ''}
                    onSelect={(key) => void onLineChange(key)}
                    flushBottom={!active}
                />
            ) : null}
            {active ? (
                <SportMarketDetailsTabs
                    market={selectedMarket}
                    platform={platform}
                    homeTeam={section.type === SportMarketGroupType.Moneyline ? homeTeam : undefined}
                    awayTeam={section.type === SportMarketGroupType.Moneyline ? awayTeam : undefined}
                />
            ) : null}
        </section>
    );
});
