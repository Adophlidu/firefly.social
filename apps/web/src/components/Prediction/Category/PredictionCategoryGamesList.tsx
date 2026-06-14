'use client';

import ArrowLineDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import type { Locale } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo, useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
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

interface Props {
    context: CategorySlugContext;
}

export const PredictionCategoryGamesList = memo<Props>(function PredictionCategoryGamesList({ context }) {
    const isLiveCategory = isSportsLiveCategoryContext(context);
    const sportsRequest = useMemo(
        () => (isLiveCategory ? parseLiveSportsListRequest(context) : parseSportsListRequest(context)),
        [context, isLiveCategory],
    );
    const [showFinishedClosed, setShowFinishedClosed] = useState(false);
    const {
        i18n: { locale },
    } = useLingui();

    const { data, isPending, isError } = useQuery({
        queryKey: ['prediction', 'category', 'sports-list', sportsRequest, locale],
        queryFn: () =>
            getSportsEventList({
                ...sportsRequest,
                locale: locale as Locale,
            }),
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
