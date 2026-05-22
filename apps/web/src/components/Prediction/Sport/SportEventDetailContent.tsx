'use client';

import { memo } from 'react';

import { PredictionBaseInfoTabContent } from '@/components/Prediction/PredictionBaseInfoTabContent.js';
import { PredictionBaseInfoTabs } from '@/components/Prediction/PredictionBaseInfoTabs.js';
import { PredictionContextProvider } from '@/components/Prediction/PredictionContext.js';
import { PredictionMarketsAccountTab } from '@/components/Prediction/PredictionMarketsAccountTab/index.js';
import { SportMarketsSection } from '@/components/Prediction/Sport/SportMarketsSection.js';
import { SportPriceChart } from '@/components/Prediction/Sport/SportPriceChart.js';
import { SportTeamDataDisplay } from '@/components/Prediction/Sport/SportTeamDataDisplay.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface SportEventDetailContentProps {
    event: BetsEventDataForUI;
}

export const SportEventDetailContent = memo(function SportEventDetailContent({ event }: SportEventDetailContentProps) {
    const sportData = event.sportData;
    const eventSlug = event.slug || event.id;
    const showResolution = event.markets.length === 1 && !!event.markets[0]?.statusList?.length;

    if (!sportData) return null;

    return (
        <PredictionContextProvider event={event}>
            <SportTeamDataDisplay sportData={sportData} event={event} />
            <SportPriceChart event={event} />
            <PredictionMarketsAccountTab
                eventSlug={eventSlug}
                platform={event.platform}
                marketsContent={<SportMarketsSection event={event} sportData={sportData} />}
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
