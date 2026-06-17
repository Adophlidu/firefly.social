'use client';

import StreamIcon from '@dimensiondev/assets/live.svg';
import LiveStatsIcon from '@dimensiondev/assets/live-stats.svg';
import MarketChartIcon from '@dimensiondev/assets/market-chart.svg';
import { BetsPriceTimeRange } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import {
    type ComponentType,
    Fragment,
    memo,
    type ReactNode,
    type SVGProps,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { HlsPlayer } from '@/components/HlsPlayer/index.js';
import { Loading } from '@/components/Loading.js';
import { TimeRangeSettings } from '@/components/Prediction/PredictionMarketsPriceLineChart/TimeRangeSettings.js';
import { FIFA_SLUG } from '@/constants/bets.js';
import { dynamic } from '@/esm/dynamic.js';
import { openWindow } from '@/helpers/openWindow.js';
import { resolveSportLiveBoardUrl } from '@/helpers/prediction/resolveSportLiveBoardUrl.js';
import { resolveSportLivestreamPlayback } from '@/helpers/prediction/resolveSportLivestreamPlayback.js';
import { resolveStreamProxyUrl } from '@/helpers/prediction/resolveStreamProxyUrl.js';
import { getPrimaryMarket } from '@/helpers/prediction/sportScoreUtils.js';
import { parseAsBetsPriceTimeRange } from '@/hooks/prediction/parsers.js';
import { useFifaLiveStreams } from '@/hooks/prediction/useFifaLiveStreams.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useLocale } from '@/hooks/useLocale.js';
import {
    capturePolymarketEventMarketOptionClick,
    capturePolymarketEventStatsOptionClick,
    capturePolymarketEventSteamOptionClick,
} from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

const SportPriceLineChart = dynamic(
    () => import('@/components/Prediction/Sport/SportPriceLineChart.js').then((m) => m.SportPriceLineChart),
    {
        ssr: false,
        loading: () => <Loading minHeight={232} />,
    },
);

type ChartTab = 'market' | 'stats' | 'stream';

/** A playable stream source for the Stream / Watch Stream tab. */
interface StreamSource {
    kind: 'hls' | 'embed';
    url: string;
    label?: string;
}

interface SportPriceChartProps {
    event: BetsEventDataForUI;
}

function toggleButtonClassName(selected: boolean) {
    return classNames(
        'flex h-[22px] shrink-0 items-center justify-center gap-1 rounded-full border px-2 text-xs font-medium leading-[14px] transition-colors',
        selected
            ? 'border-highlight bg-highlight/10 text-highlight'
            : 'border-line text-main hover:border-highlight/50 hover:text-highlight',
    );
}

function ToggleButton({
    selected,
    Icon,
    onClick,
    children,
}: {
    selected: boolean;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button type="button" className={toggleButtonClassName(selected)} aria-pressed={selected} onClick={onClick}>
            <Icon width={14} height={14} />
            <span>{children}</span>
        </button>
    );
}

/**
 * Stream toggle for the chart tab row.
 * With a single source it behaves like a plain toggle; with multiple broadcast
 * sources it opens a dropdown so the source can be picked when entering the tab.
 */
function StreamToggle({
    selected,
    label,
    sources,
    selectedIndex,
    onSelectSource,
    onClick,
    onOpen,
}: {
    selected: boolean;
    label: ReactNode;
    sources: StreamSource[];
    selectedIndex: number;
    onSelectSource: (index: number) => void;
    onClick: () => void;
    onOpen: () => void;
}) {
    if (sources.length <= 1) {
        return (
            <ToggleButton selected={selected} Icon={StreamIcon} onClick={onClick}>
                {label}
            </ToggleButton>
        );
    }

    return (
        <Popover as="div" className="relative shrink-0">
            {({ close }) => (
                <>
                    <PopoverButton onClick={onOpen} className={classNames(toggleButtonClassName(selected), 'pr-1.5')}>
                        <StreamIcon width={14} height={14} />
                        <span>{label}</span>
                        <ChevronDownIcon width={12} height={12} />
                    </PopoverButton>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <PopoverPanel
                            portal={false}
                            className="absolute right-0 top-full z-30 mt-2 flex min-w-[140px] flex-col gap-1 rounded-lg bg-lightBottom p-1 shadow-popover dark:border dark:border-line dark:bg-darkBottom dark:shadow-none"
                        >
                            {sources.map((source, index) => (
                                <button
                                    key={`${source.url}-${index}`}
                                    type="button"
                                    onClick={() => {
                                        onSelectSource(index);
                                        close();
                                    }}
                                    className={classNames(
                                        'flex h-8 items-center rounded-md px-3 text-xs font-medium transition-colors',
                                        index === selectedIndex
                                            ? 'bg-highlight/10 text-highlight'
                                            : 'text-main hover:bg-bg',
                                    )}
                                >
                                    {source.label || t`Source ${index + 1}`}
                                </button>
                            ))}
                        </PopoverPanel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}

function getTwitchParent() {
    if (typeof window === 'undefined') return 'firefly.social';
    return window.location.hostname || 'firefly.social';
}

export const SportPriceChart = memo(function SportPriceChart({ event }: SportPriceChartProps) {
    const sportData = event.sportData;
    const primaryMarket = getPrimaryMarket(event.markets);
    const isDarkMode = useIsDarkMode();
    const locale = useLocale();
    const moneylineMarkets = useMemo(
        () => event.markets.filter((m) => m.sportsMarketType?.toLowerCase() === 'moneyline'),
        [event.markets],
    );
    const isEventEnded = !!sportData?.ended || !!event.closed;
    const defaultTimeRange = isEventEnded ? BetsPriceTimeRange.All : BetsPriceTimeRange.OneDay;
    const [timeRange, setTimeRange] = useQueryState(
        'chart-range',
        parseAsBetsPriceTimeRange.withDefault(defaultTimeRange).withOptions({ clearOnDefault: true }),
    );
    const [tab, setTab] = useQueryState(
        'chart-view',
        parseAsStringEnum<ChartTab>(['market', 'stats', 'stream']).withDefault('market').withOptions({
            clearOnDefault: true,
        }),
    );
    const [selectedStreamSource, setSelectedStreamSource] = useState(0);
    // Stream sources whose CDN refused our proxy egress (403); dropped so we stop retrying.
    const [failedStreamUrls, setFailedStreamUrls] = useState<ReadonlySet<string>>(() => new Set());
    // Keep the Live Stats iframe mounted once opened so switching tabs doesn't reload it.
    const [statsMounted, setStatsMounted] = useState(false);

    const eventSlug = event.slug;
    const isFifa = !!eventSlug && eventSlug.startsWith(FIFA_SLUG);

    // FIFA games play the dedicated broadcast (HLS) sources from the backend.
    // Presented for every FIFA game, not just live ones.
    const { data: fifaStreams } = useFifaLiveStreams(isFifa);
    const fifaBroadcastSources = useMemo<StreamSource[]>(
        () =>
            fifaStreams
                ?.map<StreamSource>((item) => ({
                    kind: 'hls',
                    // Serve the raw IP-hosted stream same-origin through our proxy
                    // to avoid mixed-content blocking and cross-origin CORS failures.
                    url: resolveStreamProxyUrl(item.url),
                    // Source name comes from the API; falls back to a generic "Source N" label.
                    label: item.title,
                }))
                // Drop sources that failed to play so we fall back instead of looping on errors.
                .filter((source) => !failedStreamUrls.has(source.url)) ?? [],
        [fifaStreams, failedStreamUrls],
    );

    // Non-FIFA games keep the original Twitch embed / external-jump behavior.
    const twitchPlayback = useMemo(
        () => resolveSportLivestreamPlayback(sportData?.livestreamInfo, getTwitchParent()),
        [sportData?.livestreamInfo],
    );

    const useFifaBroadcast = isFifa && fifaBroadcastSources.length > 0;
    const embedSources: StreamSource[] = useFifaBroadcast
        ? fifaBroadcastSources
        : twitchPlayback?.type === 'embed'
          ? [{ kind: 'embed', url: twitchPlayback.embedUrl }]
          : [];
    const externalStreamUrl = !useFifaBroadcast && twitchPlayback?.type === 'external' ? twitchPlayback.url : undefined;

    const boardUrl = useMemo(
        () =>
            isFifa && eventSlug
                ? resolveSportLiveBoardUrl(eventSlug, { compact: true, theme: isDarkMode ? 'dark' : 'light', locale })
                : undefined,
        [isFifa, eventSlug, isDarkMode, locale],
    );

    const hasStats = !!boardUrl;
    const hasStream = embedSources.length > 0 || !!externalStreamUrl;
    const safeStreamSource = embedSources.length ? Math.min(selectedStreamSource, embedSources.length - 1) : 0;
    const currentStream = embedSources[safeStreamSource];
    const streamLabel = useFifaBroadcast ? t`Watch Stream` : t`Stream`;

    // Tabs that only embed inline fall back to the market view when unavailable.
    let effectiveTab: ChartTab = tab;
    if (effectiveTab === 'stats' && !hasStats) effectiveTab = 'market';
    if (effectiveTab === 'stream' && embedSources.length === 0) effectiveTab = 'market';

    const handleMarketClick = useCallback(() => {
        void setTab('market');
        if (eventSlug) capturePolymarketEventMarketOptionClick(eventSlug);
    }, [eventSlug, setTab]);
    const handleStatsClick = useCallback(() => {
        void setTab('stats');
        if (eventSlug) capturePolymarketEventStatsOptionClick(eventSlug);
    }, [eventSlug, setTab]);
    const handleStreamReport = useCallback(() => {
        if (eventSlug) capturePolymarketEventSteamOptionClick(eventSlug);
    }, [eventSlug]);
    const handleStreamClick = useCallback(() => {
        handleStreamReport();
        if (embedSources.length > 0) {
            void setTab('stream');
            return;
        }
        // No embeddable player: fall back to opening the source URL.
        if (externalStreamUrl) openWindow(externalStreamUrl);
    }, [handleStreamReport, embedSources.length, externalStreamUrl, setTab]);
    // Reported on dropdown open; selecting a source only switches the tab.
    const handleSelectStreamSource = useCallback(
        (index: number) => {
            setSelectedStreamSource(index);
            void setTab('stream');
        },
        [setTab],
    );
    const handleStreamError = useCallback((url: string) => {
        setFailedStreamUrls((prev) => {
            if (prev.has(url)) return prev;
            const next = new Set(prev);
            next.add(url);
            return next;
        });
    }, []);

    useEffect(() => {
        if (effectiveTab === 'stats') setStatsMounted(true);
    }, [effectiveTab]);

    if (!sportData || !primaryMarket) return null;

    const showToggle = hasStats || hasStream;

    return (
        <div className="px-4 py-3">
            {effectiveTab === 'stream' && currentStream ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                    {currentStream.kind === 'hls' ? (
                        <HlsPlayer
                            src={currentStream.url}
                            className="size-full"
                            mode="live"
                            reloadOnStaleEnd
                            onFatalError={() => handleStreamError(currentStream.url)}
                        />
                    ) : (
                        <iframe
                            src={currentStream.url}
                            className="size-full"
                            allowFullScreen
                            allow="autoplay; encrypted-media"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-fullscreen"
                            title={streamLabel}
                        />
                    )}
                </div>
            ) : effectiveTab === 'market' ? (
                <SportPriceLineChart
                    market={primaryMarket}
                    homeTeam={sportData.homeTeam}
                    awayTeam={sportData.awayTeam}
                    timeRange={timeRange}
                    config={{
                        moneylineMarkets,
                        isDraw: !!sportData.isDraw,
                        endTime: event.endTime,
                    }}
                />
            ) : null}

            {/* Live Stats stays mounted once opened; toggling visibility avoids reloading the iframe. */}
            {boardUrl && statsMounted ? (
                <div
                    className={classNames(
                        'h-[630px] w-full overflow-hidden rounded-lg bg-bg',
                        effectiveTab === 'stats' ? '' : 'hidden',
                    )}
                >
                    <iframe
                        src={boardUrl}
                        className="size-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media; fullscreen"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-fullscreen"
                        title={t`Live Stats`}
                    />
                </div>
            ) : null}

            <div className="mt-4 flex min-h-[22px] flex-col items-center gap-3 md:flex-row md:items-start md:justify-between">
                {effectiveTab === 'market' ? (
                    <div className="flex min-w-0 items-start justify-center gap-3 max-md:w-full md:flex-1 md:justify-start">
                        <TimeRangeSettings
                            platform={event.platform}
                            timeRange={timeRange}
                            onTimeRangeChange={(range) => void setTimeRange(range)}
                            className="justify-center md:justify-start"
                        />
                    </div>
                ) : (
                    <div className="hidden min-w-0 flex-1 md:block" />
                )}
                {showToggle ? (
                    <div className="flex shrink-0 items-center gap-4">
                        <ToggleButton
                            selected={effectiveTab === 'market'}
                            Icon={MarketChartIcon}
                            onClick={handleMarketClick}
                        >
                            <Trans>Market</Trans>
                        </ToggleButton>
                        {hasStats ? (
                            <ToggleButton
                                selected={effectiveTab === 'stats'}
                                Icon={LiveStatsIcon}
                                onClick={handleStatsClick}
                            >
                                <Trans>Live Stats</Trans>
                            </ToggleButton>
                        ) : null}
                        {hasStream ? (
                            <StreamToggle
                                selected={effectiveTab === 'stream'}
                                label={streamLabel}
                                sources={embedSources}
                                selectedIndex={safeStreamSource}
                                onSelectSource={handleSelectStreamSource}
                                onClick={handleStreamClick}
                                onOpen={handleStreamReport}
                            />
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
});
