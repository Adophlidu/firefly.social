'use client';

import ArrowLineDown from '@dimensiondev/assets/arrow-line-down.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, use, useEffect, useMemo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { STALE_TIMES } from '@/constants/query.js';
import { PredictionMarketBuyButtons } from '@/components/Prediction/PredictionMarketBuyButtons.js';
import { ActiveTag } from '@/components/Prediction/PredictionSeries/ActiveTag.js';
import { EventResult } from '@/components/Prediction/PredictionSeries/EventResult.js';
import { EventsPopover } from '@/components/Prediction/PredictionSeries/EventsPopover.js';
import { EventTime } from '@/components/Prediction/PredictionSeries/EventTime.js';
import { ToggleChartTypeButtons } from '@/components/Prediction/PredictionSeries/ToggleChartTypeButtons.js';
import { PLATFORMS_SUPPORTING_ORDER_BOOK } from '@/constants/bets.js';
import type { PredictionPlatform } from '@/constants/enum.js';
import { Source } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { resolvePredictionEventUrl } from '@/helpers/resolvePredictionEventUrl.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { getEventsBySeries } from '@/providers/firefly/prediction/getEventsBySeries.js';
import { type BetsEventDataForUI, PredictionRecurrence } from '@/types/prediction.js';

interface PredictionSeriesProps {
    id: string;
    platform: PredictionPlatform;
    recurrence: PredictionRecurrence;
    eventSlug: string;
    endTime?: number;
}

const CURRENT_COUNT = 3;

export const PredictionSeries = memo<PredictionSeriesProps>(function PredictionSeries({
    platform,
    id,
    recurrence,
    eventSlug,
    endTime,
}) {
    const { event, isActive } = use(PredictionContext);
    const [ended, setEnded] = useState(false);

    const { data } = useQuery({
        queryKey: [Source.Prediction, 'series', platform, id, eventSlug],
        staleTime: STALE_TIMES.MINUTE_5,
        queryFn: () => getEventsBySeries(platform, id, recurrence === PredictionRecurrence.FiveMinutes ? 490 : 200),
    });

    const { past, currents, upcoming, liveEvent } = useMemo<{
        past: BetsEventDataForUI[];
        currents: BetsEventDataForUI[];
        upcoming: BetsEventDataForUI[];
        liveEvent?: BetsEventDataForUI;
    }>(() => {
        if (!data?.length)
            return {
                past: [],
                currents: [],
                upcoming: [],
            };

        const currentIndex = data.findIndex(
            (event) =>
                event.markets.some((market) => !market.isClosed && !market.isResolved) &&
                event.startTime &&
                event.endDate &&
                Date.now() >= new Date(event.startTime).getTime() &&
                Date.now() <= new Date(event.endDate).getTime(),
        );
        if (currentIndex === -1)
            return {
                past: [],
                currents: [],
                upcoming: [],
            };

        const count = recurrence === PredictionRecurrence.Daily ? 7 : 200;
        const sliceIndex = data.findIndex((e, i) => i > currentIndex && e.markets.some((m) => !m.resolvedOutcomeId));
        const liveIndex = sliceIndex !== -1 ? sliceIndex : currentIndex;
        const upcoming = data
            .slice(0, liveIndex + 1)
            .reverse()
            .slice(0, count);

        return {
            past: data.slice(liveIndex + 1).slice(0, count),
            currents: upcoming.slice(0, CURRENT_COUNT),
            upcoming: upcoming.slice(CURRENT_COUNT),
            liveEvent: data[currentIndex],
        };
    }, [data, recurrence, ended]);

    useEffect(() => {
        if (!endTime || Date.now() >= endTime) return;

        const timer = setTimeout(() => {
            setEnded(true);
        }, endTime - Date.now());

        return () => clearTimeout(timer);
    }, [endTime]);

    if (!past.length && !currents.length && !upcoming.length) return null;
    if (!event) return null;

    const selectedPast = past.find((e) => e.slug === eventSlug);
    const showBuyButtons =
        isActive &&
        event.markets.length === 1 &&
        PLATFORMS_SUPPORTING_ORDER_BOOK.includes(event.platform) &&
        !event.markets[0].isResolved &&
        !event.markets[0].isClosed;
    const hasResolved = past.slice(0, CURRENT_COUNT).some((e) => e.markets.some((m) => !!m.resolvedOutcomeId));

    return (
        <div>
            <div className="mt-3 flex items-start gap-4 px-4">
                <div className="flex flex-wrap gap-2">
                    {past.length ? (
                        <EventsPopover eventSlug={eventSlug} events={past} showResult>
                            <div className="flex items-center gap-2">
                                {hasResolved ? (
                                    past.slice(0, CURRENT_COUNT).map((e) => (
                                        <Link onClick={stopPropagation} key={e.id} href={resolvePredictionEventUrl(e)}>
                                            <EventResult event={e} />
                                        </Link>
                                    ))
                                ) : (
                                    <span className="shrink-0 whitespace-nowrap text-[10px] font-bold">
                                        <Trans>Past</Trans>
                                    </span>
                                )}
                                <ArrowLineDown className="size-[7px] shrink-0" />
                            </div>
                        </EventsPopover>
                    ) : null}
                    {selectedPast ? (
                        <ClickableButton className="bg-main text-primaryBottom flex h-[30px] items-center gap-1 rounded-full px-3 text-[10px] font-bold">
                            {selectedPast.markets.some((m) => m.isClosed || m.isResolved) ? (
                                <Trans>Ended: </Trans>
                            ) : null}
                            <EventTime event={selectedPast} onlyShowDate />
                        </ClickableButton>
                    ) : null}
                    {currents.map((e) => {
                        return (
                            <Link
                                className={classNames(
                                    'flex h-[30px] items-center gap-1 rounded-full px-3 text-[10px] font-bold',
                                    e.slug === eventSlug ? 'bg-main text-primaryBottom' : 'text-main hover:bg-lightBg',
                                )}
                                key={e.id}
                                href={resolvePredictionEventUrl(e)}
                            >
                                {liveEvent?.id === e.id ? <ActiveTag /> : null}
                                <EventTime event={e} onlyShowTime />
                            </Link>
                        );
                    })}
                    {upcoming.length ? (
                        <EventsPopover eventSlug={eventSlug} events={upcoming}>
                            <div className="text-main flex items-center gap-1">
                                <span className="shrink-0 whitespace-nowrap text-[10px] font-bold">
                                    <Trans>More</Trans>
                                </span>
                                <ArrowLineDown className="size-[7px] shrink-0" />
                            </div>
                        </EventsPopover>
                    ) : null}
                </div>
                <ToggleChartTypeButtons />
            </div>
            {showBuyButtons ? (
                <PredictionMarketBuyButtons
                    className="mt-6 px-4"
                    platform={platform}
                    market={event.markets[0]}
                    size="large"
                    showPrice
                    autoRefreshPrice
                />
            ) : null}
        </div>
    );
});
