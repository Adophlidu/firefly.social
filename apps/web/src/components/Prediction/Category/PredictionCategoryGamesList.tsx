'use client';

import ArrowLineDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo, useState } from 'react';

import { FootballLoading } from '@/components/FootballLoading.js';
import { Loading } from '@/components/Loading.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { PredictionSportsCell } from '@/components/Prediction/Category/PredictionSportsCell.js';
import { FIFA_SLUG } from '@/constants/bets.js';
import { categoryHasGamesDisplayContent } from '@/helpers/prediction/category/categoryGamesPropsTabAvailability.js';
import { ESPORTS_PRIMARY_SLUG, SPORTS_PRIMARY_SLUG } from '@/helpers/prediction/category/constants.js';
import { formatPolymarketSportsEventForUI } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import {
    groupLiveSportsListForDisplay,
    groupSportsEventsForDisplay,
    liveSportsListHasDisplayContent,
} from '@/helpers/prediction/category/groupSportsEventsForDisplay.js';
import { excludeEsportEvents } from '@/helpers/prediction/category/isEsportSportsEvent.js';
import { isSportsLiveCategoryContext } from '@/helpers/prediction/category/isSportsLiveCategoryContext.js';
import {
    parseLiveSportsListRequest,
    parseSportsListRequest,
} from '@/helpers/prediction/category/parseCategoryRouteParams.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { applySportsMarketPriceOverrides } from '@/helpers/prediction/category/sportsMarketLivePrices.js';
import { enrichSportsEventWithFifa } from '@/helpers/prediction/fifaMatchResults.js';
import { FIFA_LIVE_REFETCH_INTERVAL_MS, useFifaMatchResults } from '@/hooks/prediction/useFifaMatchResults.js';
import { useLiveSportsMarketPrices } from '@/hooks/prediction/useLiveSportsMarketPrices.js';
import { useLocale } from '@/hooks/useLocale.js';
import { getSportsEventList } from '@/providers/firefly/prediction/getSportsEventList.js';
import type {
    FifaMatchResultData,
    PolymarketSportsEvent,
    PolymarketSportsListResponse,
} from '@/providers/types/Firefly.js';

interface Props {
    context: CategorySlugContext;
}

/** Refresh the games list every ~10s while live matches are present. */
const LIVE_GAMES_REFETCH_INTERVAL_MS = 10_000;

/** Overlay FIFA match-results (penalty shootout + fresher scores) onto every list bucket. */
function enrichSportsListWithFifa(
    response: PolymarketSportsListResponse,
    fifa: Map<string, FifaMatchResultData> | undefined,
): PolymarketSportsListResponse {
    if (!fifa?.size) return response;
    const enrichBucket = (events: PolymarketSportsEvent[]) =>
        events.map((event) => enrichSportsEventWithFifa(event, fifa.get(event.slug)));
    return {
        ...response,
        live: enrichBucket(response.live),
        today: enrichBucket(response.today),
        tomorrow: enrichBucket(response.tomorrow),
        afterTomorrow: enrichBucket(response.afterTomorrow),
        afterThreeDays: response.afterThreeDays ? enrichBucket(response.afterThreeDays) : undefined,
        closed: enrichBucket(response.closed),
    };
}

export const PredictionCategoryGamesList = memo<Props>(function PredictionCategoryGamesList({ context }) {
    const isLiveCategory = isSportsLiveCategoryContext(context);
    const isSportsPrimary = context.primaryItem.slug === SPORTS_PRIMARY_SLUG;
    const isEsportPrimary = context.primaryItem.slug === ESPORTS_PRIMARY_SLUG;
    const sportsRequest = useMemo(
        () => (isLiveCategory ? parseLiveSportsListRequest(context) : parseSportsListRequest(context)),
        [context, isLiveCategory],
    );
    const [showFinishedClosed, setShowFinishedClosed] = useState(false);
    const locale = useLocale();

    const { data, isPending, isError } = useQuery({
        queryKey: ['prediction', 'category', 'sports-list', sportsRequest, locale],
        queryFn: () =>
            getSportsEventList({
                ...sportsRequest,
                locale,
            }),
        refetchInterval: (query) =>
            query.state.data && query.state.data.live.length > 0 ? LIVE_GAMES_REFETCH_INTERVAL_MS : false,
    });

    // FIFA feed: injects penalty-shootout dots and fresher scores (CDN-cached, deduped by React Query).
    const fifaMatchResults = useFifaMatchResults({
        enabled: !!data?.live.length,
        refetchInterval: FIFA_LIVE_REFETCH_INTERVAL_MS,
    });

    // Strip esports (Sports `live` still returns them) then overlay FIFA penalty/score data.
    const displayData = useMemo(() => {
        if (!data) return data;
        const withoutEsports = isSportsPrimary ? excludeEsportEvents(data) : data;
        return enrichSportsListWithFifa(withoutEsports, fifaMatchResults);
    }, [data, isSportsPrimary, fifaMatchResults]);

    const liveDisplay = useMemo(() => {
        if (!displayData || !isLiveCategory) return null;
        return groupLiveSportsListForDisplay(displayData, { esport: isEsportPrimary });
    }, [displayData, isLiveCategory, isEsportPrimary]);

    const { sections, closedEvents } = useMemo(() => {
        if (!displayData || isLiveCategory) {
            return { sections: [], closedEvents: [] };
        }
        return groupSportsEventsForDisplay(displayData);
    }, [displayData, isLiveCategory]);

    const hasVisibleContent = isLiveCategory
        ? liveSportsListHasDisplayContent(displayData, { esport: isEsportPrimary })
        : categoryHasGamesDisplayContent(displayData);

    const liveEventsForPrices = useMemo(() => {
        if (isLiveCategory && liveDisplay) {
            return liveDisplay.timeSections.flatMap((timeSection) =>
                timeSection.sportSections.flatMap((sportSection) => sportSection.events),
            );
        }
        return sections.flatMap((section) => section.events);
    }, [isLiveCategory, liveDisplay, sections]);

    const liveMarketPrices = useLiveSportsMarketPrices(liveEventsForPrices);

    const renderSportsCell = (event: PolymarketSportsEvent) => {
        const model = formatPolymarketSportsEventForUI(event);
        if (!model) return null;
        const displayModel = applySportsMarketPriceOverrides(model, liveMarketPrices);
        return <PredictionSportsCell key={event.id} model={displayModel} />;
    };

    const isFifa = context.secondaryItem?.slug === FIFA_SLUG;
    if (isPending) {
        return <div className="flex justify-center py-12">{isFifa ? <FootballLoading /> : <Loading />}</div>;
    }

    if (isError) {
        return (
            <p className="px-4 py-12 text-center text-sm text-second">
                <Trans>Failed to load games</Trans>
            </p>
        );
    }

    if (!hasVisibleContent) {
        return (
            <div>
                <NoResultsFallback message={<Trans>No predictions found</Trans>} />
            </div>
        );
    }

    if (isLiveCategory && liveDisplay) {
        return (
            <div className="flex flex-col gap-3 px-4 pb-8">
                {liveDisplay.timeSections
                    .filter((timeSection) => timeSection.sportSections.length > 0)
                    .map((timeSection) => (
                        <section key={timeSection.id} className="flex flex-col gap-3">
                            <h2 className="text-2xl font-black text-main">{timeSection.title}</h2>
                            {timeSection.sportSections.map((sportSection) => {
                                const sectionKey = `${timeSection.id}-${sportSection.id}`;

                                return (
                                    <div key={sectionKey} className="flex flex-col gap-3">
                                        <h3 className="text-sm font-bold text-main">{sportSection.title}</h3>
                                        <div className="flex flex-col gap-3">
                                            {sportSection.events.map((event) => renderSportsCell(event))}
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                    ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 px-4 pb-8">
            {sections.map((section) => (
                <section key={section.id} className="flex flex-col gap-3">
                    <h2 className="text-base font-black text-main">{section.title}</h2>
                    <div className="flex flex-col gap-3">{section.events.map((event) => renderSportsCell(event))}</div>
                </section>
            ))}
            {closedEvents.length > 0 ? (
                <div className="flex flex-col items-center gap-3 py-4">
                    <button
                        type="button"
                        className="mx-auto flex h-9 items-center justify-center gap-2 rounded-[20px] bg-bg px-6 py-2 text-sm font-semibold text-main"
                        onClick={() => setShowFinishedClosed((prev) => !prev)}
                    >
                        <Trans>View Finished</Trans>
                        <ArrowLineDownIcon
                            width={14}
                            height={14}
                            className={classNames(
                                'shrink-0 transition-transform',
                                showFinishedClosed ? 'rotate-180' : '',
                            )}
                        />
                    </button>
                    {showFinishedClosed ? (
                        <div className="flex w-full flex-col gap-3">
                            {closedEvents.map((event) => renderSportsCell(event))}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
});
