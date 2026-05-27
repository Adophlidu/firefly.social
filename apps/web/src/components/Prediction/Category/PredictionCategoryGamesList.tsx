'use client';

import ArrowLineDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { PredictionSportsCell } from '@/components/Prediction/Category/PredictionSportsCell.js';
import { categoryHasGamesDisplayContent } from '@/helpers/prediction/category/categoryGamesPropsTabAvailability.js';
import { formatPolymarketSportsEventForUI } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import {
    groupLiveSportsListForDisplay,
    groupSportsEventsForDisplay,
    liveSportsListHasDisplayContent,
} from '@/helpers/prediction/category/groupSportsEventsForDisplay.js';
import { isSportsLiveCategoryContext } from '@/helpers/prediction/category/isSportsLiveCategoryContext.js';
import {
    parseLiveSportsListRequest,
    parseSportsListRequest,
} from '@/helpers/prediction/category/parseCategoryRouteParams.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { applySportsMarketPriceOverrides } from '@/helpers/prediction/category/sportsMarketLivePrices.js';
import { useLiveSportsMarketPrices } from '@/hooks/prediction/useLiveSportsMarketPrices.js';
import { getSportsEventList } from '@/providers/firefly/prediction/getSportsEventList.js';
import type { PolymarketSportsEvent } from '@/providers/types/Firefly.js';

const INITIAL_VISIBLE = 5;

interface Props {
    context: CategorySlugContext;
}

export const PredictionCategoryGamesList = memo<Props>(function PredictionCategoryGamesList({ context }) {
    const isLiveCategory = isSportsLiveCategoryContext(context);
    const sportsRequest = useMemo(
        () => (isLiveCategory ? parseLiveSportsListRequest(context) : parseSportsListRequest(context)),
        [context, isLiveCategory],
    );
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [showFinishedClosed, setShowFinishedClosed] = useState(false);

    const { data, isPending, isError } = useQuery({
        queryKey: ['prediction', 'category', 'sports-list', sportsRequest],
        queryFn: () => getSportsEventList(sportsRequest),
    });

    const liveDisplay = useMemo(() => {
        if (!data || !isLiveCategory) return null;
        return groupLiveSportsListForDisplay(data);
    }, [data, isLiveCategory]);

    const { sections, closedEvents } = useMemo(() => {
        if (!data || isLiveCategory) {
            return { sections: [], closedEvents: [] };
        }
        return groupSportsEventsForDisplay(data);
    }, [data, isLiveCategory]);

    const hasVisibleContent = isLiveCategory
        ? liveSportsListHasDisplayContent(data)
        : categoryHasGamesDisplayContent(data);

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

    if (isPending) {
        return (
            <div className="flex justify-center py-12">
                <Loading />
            </div>
        );
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
            <p className="px-4 py-12 text-center text-sm text-second">
                <Trans>No games found</Trans>
            </p>
        );
    }

    if (isLiveCategory && liveDisplay) {
        return (
            <div className="flex flex-col gap-6 px-4 pb-8">
                {liveDisplay.timeSections
                    .filter((timeSection) => timeSection.sportSections.length > 0)
                    .map((timeSection) => (
                        <section key={timeSection.id} className="flex flex-col gap-4">
                            <h2 className="text-base font-black text-main">{timeSection.title}</h2>
                            {timeSection.sportSections.map((sportSection) => {
                                const sectionKey = `${timeSection.id}-${sportSection.id}`;
                                const isExpanded = expandedSections[sectionKey];
                                const visibleEvents = isExpanded
                                    ? sportSection.events
                                    : sportSection.events.slice(0, INITIAL_VISIBLE);
                                const hasMore = sportSection.events.length > INITIAL_VISIBLE;

                                return (
                                    <div key={sectionKey} className="flex flex-col gap-3">
                                        <h3 className="text-sm font-bold text-main">{sportSection.title}</h3>
                                        <div className="flex flex-col gap-3">
                                            {visibleEvents.map((event) => renderSportsCell(event))}
                                        </div>
                                        {hasMore ? (
                                            <ClickableButton
                                                className="text-sm font-bold text-highlight"
                                                onClick={() =>
                                                    setExpandedSections((prev) => ({
                                                        ...prev,
                                                        [sectionKey]: !prev[sectionKey],
                                                    }))
                                                }
                                            >
                                                {isExpanded ? <Trans>Show less</Trans> : <Trans>Show more</Trans>}
                                            </ClickableButton>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </section>
                    ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 px-4 pb-8">
            {sections.map((section) => {
                const isExpanded = expandedSections[section.id];
                const visibleEvents = isExpanded ? section.events : section.events.slice(0, INITIAL_VISIBLE);
                const hasMore = section.events.length > INITIAL_VISIBLE;

                return (
                    <section key={section.id} className="flex flex-col gap-3">
                        <h2 className="text-base font-black text-main">{section.title}</h2>
                        <div className="flex flex-col gap-3">
                            {visibleEvents.map((event) => renderSportsCell(event))}
                        </div>
                        {hasMore ? (
                            <ClickableButton
                                className="text-sm font-bold text-highlight"
                                onClick={() =>
                                    setExpandedSections((prev) => ({
                                        ...prev,
                                        [section.id]: !prev[section.id],
                                    }))
                                }
                            >
                                {isExpanded ? <Trans>Show less</Trans> : <Trans>Show more</Trans>}
                            </ClickableButton>
                        ) : null}
                    </section>
                );
            })}
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
