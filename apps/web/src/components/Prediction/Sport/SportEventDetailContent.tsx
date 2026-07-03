'use client';

import type { Locale } from '@dimensiondev/enums';
import { memo, useMemo } from 'react';

import { PredictionBaseInfoTabContent } from '@/components/Prediction/PredictionBaseInfoTabContent.js';
import { PredictionBaseInfoTabs } from '@/components/Prediction/PredictionBaseInfoTabs.js';
import { PredictionContextProvider } from '@/components/Prediction/PredictionContext.js';
import { PredictionMarketsAccountTab } from '@/components/Prediction/PredictionMarketsAccountTab/index.js';
import { SportMarketsSection } from '@/components/Prediction/Sport/SportMarketsSection.js';
import { SportPriceChart } from '@/components/Prediction/Sport/SportPriceChart.js';
import { SportTeamDataDisplay } from '@/components/Prediction/Sport/SportTeamDataDisplay.js';
import { useLiveSportEventDetail } from '@/hooks/prediction/useLiveSportEventDetail.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface SportEventDetailContentProps {
    event: BetsEventDataForUI;
    locale?: Locale;
}

export const SportEventDetailContent = memo(function SportEventDetailContent({
    event,
    locale,
}: SportEventDetailContentProps) {
    // Overlay fresh scores/period/penalty data on top of the SSR value while the match is live.
    const liveSportData = useLiveSportEventDetail(event.sportData, event.slug || event.id, locale);
    const sportData = liveSportData;
    const eventSlug = event.slug || event.id;
    const showResolution = event.markets.length === 1 && !!event.markets[0]?.statusList?.length;

    const mergedEvent = useMemo(
        () => (sportData && sportData !== event.sportData ? { ...event, sportData } : event),
        [event, sportData],
    );

    if (!sportData) return null;

    return (
        <PredictionContextProvider event={mergedEvent} locale={locale}>
            <SportTeamDataDisplay sportData={sportData} event={mergedEvent} />
            <SportPriceChart event={mergedEvent} />
            <PredictionMarketsAccountTab
                eventSlug={eventSlug}
                platform={event.platform}
                marketsContent={<SportMarketsSection event={mergedEvent} sportData={sportData} />}
            />
            <PredictionBaseInfoTabs showResolution={showResolution} eventSlug={eventSlug} />
            <PredictionBaseInfoTabContent
                showResolution={showResolution}
                platform={event.platform}
                eventSlug={eventSlug}
                eventTitle={event.title}
            />
        </PredictionContextProvider>
    );
});
