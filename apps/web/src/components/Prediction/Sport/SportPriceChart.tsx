'use client';

import StreamIcon from '@dimensiondev/assets/live.svg';
import MarketChartIcon from '@dimensiondev/assets/market-chart.svg';
import { BetsPriceTimeRange } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { memo, useCallback, useMemo } from 'react';

import { Loading } from '@/components/Loading.js';
import { TimeRangeSettings } from '@/components/Prediction/PredictionMarketsPriceLineChart/TimeRangeSettings.js';
import { dynamic } from '@/esm/dynamic.js';
import { openWindow } from '@/helpers/openWindow.js';
import { resolveSportLivestreamPlayback } from '@/helpers/prediction/resolveSportLivestreamPlayback.js';
import { getPrimaryMarket } from '@/helpers/prediction/sportScoreUtils.js';
import { parseAsBetsPriceTimeRange } from '@/hooks/prediction/parsers.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

const SportPriceLineChart = dynamic(
    () => import('@/components/Prediction/Sport/SportPriceLineChart.js').then((m) => m.SportPriceLineChart),
    {
        ssr: false,
        loading: () => <Loading minHeight={232} />,
    },
);

type ChartTab = 'market' | 'stream';

interface SportPriceChartProps {
    event: BetsEventDataForUI;
}

function StreamToggle({
    selected,
    type,
    onClick,
    children,
}: {
    selected: boolean;
    type: ChartTab;
    onClick: () => void;
    children: React.ReactNode;
}) {
    const Icon = type === 'market' ? MarketChartIcon : StreamIcon;

    return (
        <button
            type="button"
            className={classNames(
                'flex h-[22px] shrink-0 items-center justify-center gap-1 rounded-full border px-2 text-xs font-medium leading-[14px] transition-colors',
                selected
                    ? 'border-highlight bg-highlight/10 text-highlight'
                    : 'border-line text-main hover:border-highlight/50 hover:text-highlight',
            )}
            aria-pressed={selected}
            onClick={onClick}
        >
            <Icon width={14} height={14} />
            <span>{children}</span>
        </button>
    );
}

function MarketStreamSwitch({
    tab,
    onMarketClick,
    onStreamClick,
}: {
    tab: ChartTab;
    onMarketClick: () => void;
    onStreamClick: () => void;
}) {
    return (
        <div className="flex shrink-0 items-center gap-4">
            <StreamToggle selected={tab === 'market'} type="market" onClick={onMarketClick}>
                <Trans>Market</Trans>
            </StreamToggle>
            <StreamToggle selected={tab === 'stream'} type="stream" onClick={onStreamClick}>
                <Trans>Watch Stream</Trans>
            </StreamToggle>
        </div>
    );
}

function getTwitchParent() {
    if (typeof window === 'undefined') return 'firefly.social';
    return window.location.hostname || 'firefly.social';
}

export const SportPriceChart = memo(function SportPriceChart({ event }: SportPriceChartProps) {
    const sportData = event.sportData;
    const primaryMarket = getPrimaryMarket(event.markets);
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
        parseAsStringEnum(['market', 'stream']).withDefault('market').withOptions({ clearOnDefault: true }),
    );

    const livestreamPlayback = useMemo(
        () => resolveSportLivestreamPlayback(sportData?.livestreamInfo, getTwitchParent()),
        [sportData?.livestreamInfo],
    );
    const isLive = !!sportData?.live;
    const showToggle = isLive && !!livestreamPlayback;
    const effectiveTab = livestreamPlayback?.type === 'embed' ? tab : 'market';
    const handleStreamClick = useCallback(() => {
        if (!livestreamPlayback) return;
        if (livestreamPlayback.type === 'embed') {
            setTab('stream');
            return;
        }

        openWindow(livestreamPlayback.url);
    }, [livestreamPlayback, setTab]);

    if (!sportData || !primaryMarket) return null;

    return (
        <div className="px-4 py-3">
            {effectiveTab === 'stream' && livestreamPlayback?.type === 'embed' ? (
                <div className="overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
                    <iframe
                        src={livestreamPlayback.embedUrl}
                        className="size-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-fullscreen"
                        title="Live Stream"
                    />
                </div>
            ) : (
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
            )}

            <div className="mt-4 flex min-h-[22px] flex-col items-center gap-3 md:flex-row md:items-start md:justify-between">
                {effectiveTab === 'market' || !showToggle ? (
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
                    <MarketStreamSwitch
                        tab={effectiveTab}
                        onMarketClick={() => void setTab('market')}
                        onStreamClick={handleStreamClick}
                    />
                ) : null}
            </div>
        </div>
    );
});
