'use client';

import ArrowLineDown from '@dimensiondev/assets/arrow-line-down.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, use, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CurrentSeriesPills } from '@/components/Prediction/EventSeriesPills/CurrentSeriesPills.js';
import { PastSeriesDropdown } from '@/components/Prediction/EventSeriesPills/PastSeriesDropdown.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { PredictionMarketBuyButtons } from '@/components/Prediction/PredictionMarketBuyButtons.js';
import { EventsPopover } from '@/components/Prediction/PredictionSeries/EventsPopover.js';
import { EventTime } from '@/components/Prediction/PredictionSeries/EventTime.js';
import { ToggleChartTypeButtons } from '@/components/Prediction/PredictionSeries/ToggleChartTypeButtons.js';
import { PLATFORMS_SUPPORTING_ORDER_BOOK } from '@/constants/bets.js';
import {
    filterAndSortOpenEvents,
    filterAndSortPastEvents,
} from '@/helpers/prediction/polymarket/eventSeriesPills/filterAndSortSeriesEvents.js';
import { formatSeriesEventTime } from '@/helpers/prediction/polymarket/eventSeriesPills/formatSeriesPillTime.js';
import { isPolymarketUpDownSlug } from '@/helpers/prediction/polymarket/eventSeriesPills/resolvePastMarketVariant.js';
import { selectCurrentPills } from '@/helpers/prediction/polymarket/eventSeriesPills/selectCurrentPills.js';
import {
    selectLiveSlugSet,
    shouldShowLiveOnPill,
} from '@/helpers/prediction/polymarket/eventSeriesPills/selectLiveSlugs.js';
import { selectMoreEvents } from '@/helpers/prediction/polymarket/eventSeriesPills/selectMoreEvents.js';
import { toSeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/toSeriesEventForPills.js';
import type { PastOutcome } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';
import { usePolymarketPastResults } from '@/hooks/prediction/usePolymarketPastResults.js';
import {
    usePolymarketSeriesEventsOpen,
    usePolymarketSeriesEventsPast,
} from '@/hooks/prediction/usePolymarketSeriesEvents.js';
import { useServerNow } from '@/hooks/prediction/useServerNow.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

export interface EventSeriesPillsProps {
    currentEvent: BetsEventDataForUI;
    series: { id: string; slug?: string };
    className?: string;
}

/**
 * Polymarket `EventSeriesPills` with PredictionSeries styling.
 * Hidden on crypto up/down series — use `shouldHidePolymarketSeriesPills` before mounting.
 */
export const EventSeriesPills = memo<EventSeriesPillsProps>(function EventSeriesPills({
    currentEvent,
    series,
    className,
}) {
    const { isActive } = use(PredictionContext);

    const currentSlug = currentEvent.slug ?? currentEvent.id;
    const currentLogic = useMemo(() => toSeriesEventForPills(currentEvent), [currentEvent]);

    const openQuery = usePolymarketSeriesEventsOpen(series.id, series.slug);
    const pastQuery = usePolymarketSeriesEventsPast(series.id, series.slug);

    const openUi = openQuery.data ?? EMPTY_LIST;
    const pastUi = pastQuery.data ?? EMPTY_LIST;

    const openLogic = useMemo(() => openUi.map(toSeriesEventForPills), [openUi]);
    const pastLogic = useMemo(() => pastUi.map(toSeriesEventForPills), [pastUi]);

    const uiBySlug = useMemo(() => {
        const map = new Map<string, BetsEventDataForUI>();
        for (const event of [...openUi, ...pastUi]) {
            if (event.slug) map.set(event.slug, event);
        }

        return map;
    }, [openUi, pastUi]);

    const sortedOpen = useMemo(() => filterAndSortOpenEvents(openLogic), [openLogic]);
    const sortedPast = useMemo(() => filterAndSortPastEvents(pastLogic), [pastLogic]);

    const serverNow = useServerNow(sortedOpen);

    const currentPillsLogic = useMemo(
        () => selectCurrentPills(sortedOpen, currentSlug, !!currentEvent.closed, serverNow),
        [currentEvent.closed, currentSlug, serverNow, sortedOpen],
    );

    const moreLogic = useMemo(
        () => selectMoreEvents(sortedOpen, currentSlug, currentPillsLogic, serverNow),
        [currentPillsLogic, currentSlug, serverNow, sortedOpen],
    );

    const liveSlugs = useMemo(() => selectLiveSlugSet(sortedOpen, serverNow), [serverNow, sortedOpen]);

    const pastSlugs = useMemo(() => sortedPast.map((e) => e.slug), [sortedPast]);
    const isUpDown = isPolymarketUpDownSlug(currentSlug);

    const allSeriesLogic = useMemo(() => [...sortedOpen, ...sortedPast], [sortedOpen, sortedPast]);

    const pastResultsQuery = usePolymarketPastResults(currentLogic, allSeriesLogic, {
        enabled: isUpDown && pastSlugs.length > 0,
        includeOutcomesBySlug: true,
        outcomesOnly: true,
        pastEventSlugs: pastSlugs,
    });

    const outcomesBySlug = useMemo(() => {
        const map = new Map<string, PastOutcome>();
        const fromApi = pastResultsQuery.data?.outcomesBySlug;
        if (fromApi) {
            for (const [slug, outcome] of Object.entries(fromApi)) {
                map.set(slug, outcome);
            }
        }

        for (const event of pastUi) {
            if (!event.slug || map.has(event.slug)) continue;
            const market = event.markets[0];
            if (!market?.resolvedOutcomeId) continue;
            const label = market.outcomes.find((o) => o.id === market.resolvedOutcomeId)?.label?.toLowerCase();
            if (label === 'up' || label === 'yes') map.set(event.slug, 'up');
            else if (label === 'down' || label === 'no') map.set(event.slug, 'down');
        }

        return map;
    }, [pastResultsQuery.data?.outcomesBySlug, pastUi]);

    const currentPillsUi = useMemo(() => {
        if (!currentPillsLogic?.length) return [];
        return currentPillsLogic.map((e) => uiBySlug.get(e.slug)).filter((e): e is BetsEventDataForUI => !!e);
    }, [currentPillsLogic, uiBySlug]);

    const moreUi = useMemo(() => {
        if (!moreLogic?.length) return [];
        return moreLogic.map((e) => uiBySlug.get(e.slug)).filter((e): e is BetsEventDataForUI => !!e);
    }, [moreLogic, uiBySlug]);

    const pastUiList = useMemo(() => {
        return sortedPast.map((e) => uiBySlug.get(e.slug)).filter((e): e is BetsEventDataForUI => !!e);
    }, [sortedPast, uiBySlug]);

    if (openQuery.isPending || pastQuery.isPending) return null;
    if (!sortedOpen.length && !sortedPast.length) return null;

    const showEnded = !!currentEvent.closed;
    const endedLabel = formatSeriesEventTime(currentLogic, { shouldShowTime: false });

    const showBuyButtons =
        isActive &&
        currentEvent.markets.length === 1 &&
        PLATFORMS_SUPPORTING_ORDER_BOOK.includes(currentEvent.platform) &&
        !currentEvent.markets[0].isResolved &&
        !currentEvent.markets[0].isClosed;

    return (
        <div className={classNames('mt-3', className)}>
            <div className="flex items-start gap-4 px-4">
                <div className="flex flex-wrap gap-2">
                    <PastSeriesDropdown
                        eventSlug={currentSlug}
                        pastEvents={pastUiList}
                        pastLogic={sortedPast}
                        outcomesBySlug={outcomesBySlug}
                    />
                    {showEnded && endedLabel ? (
                        <ClickableButton className="flex h-[30px] items-center gap-1 rounded-full bg-main px-3 text-[10px] font-bold text-primaryBottom">
                            <Trans>Ended: </Trans>
                            <EventTime event={currentEvent} onlyShowDate />
                        </ClickableButton>
                    ) : null}
                    <CurrentSeriesPills
                        events={currentPillsUi}
                        eventSlug={currentSlug}
                        shouldShowLive={(slug) => shouldShowLiveOnPill(slug, currentSlug, liveSlugs)}
                    />
                    {moreUi.length ? (
                        <EventsPopover eventSlug={currentSlug} events={moreUi}>
                            <div className="flex items-center gap-1 text-main">
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
                    platform={currentEvent.platform}
                    market={currentEvent.markets[0]}
                    size="large"
                    showPrice
                    autoRefreshPrice
                />
            ) : null}
        </div>
    );
});
